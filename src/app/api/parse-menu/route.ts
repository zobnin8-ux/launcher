import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processParseJob } from "@/lib/ai/process-parse-job";

export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
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

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 10 MB. Try a smaller photo or compress the PDF." },
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

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("menu-scans")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      {
        error: uploadError.message.includes("Bucket not found")
          ? "Storage bucket menu-scans missing. Run Supabase migration 002_storage_buckets.sql"
          : uploadError.message,
      },
      { status: 500 }
    );
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

  waitUntil(processParseJob(job.id));

  return NextResponse.json({ jobId: job.id });
}
