import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPdfFile, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "@/lib/ai/parse-menu";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const restaurantId = formData.get("restaurantId") as string;

    if (!file || !restaurantId) {
      return NextResponse.json({ error: "Missing file or restaurantId" }, { status: 400 });
    }

    const isPdf = isPdfFile(file.name, file.type);
    const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: isPdf
            ? "PDF too large. Max 32 MB. Upload photos of individual pages instead."
            : "File too large. Max 10 MB.",
        },
        { status: 400 }
      );
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${restaurantId}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY missing on Vercel. Add it and redeploy." },
        { status: 500 }
      );
    }

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("menu-scans")
      .upload(path, buffer, {
        contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
      });

    if (uploadError) {
      const msg = uploadError.message.includes("Bucket not found")
        ? "Storage bucket menu-scans missing. Run Supabase migration 002_storage_buckets.sql"
        : uploadError.message;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const { data: job, error: jobError } = await supabase
      .from("parse_jobs")
      .insert({
        restaurant_id: restaurantId,
        source_file_url: path,
        status: "pending",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: jobError?.message ?? "Failed to create job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
