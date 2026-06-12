import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processParseJob } from "@/lib/ai/process-parse-job";

export const maxDuration = 300;

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

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${restaurantId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("menu-scans")
    .upload(path, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
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
    return NextResponse.json({ error: jobError?.message ?? "Failed to create job" }, { status: 500 });
  }

  // Fire-and-forget background processing
  processParseJob(job.id).catch(console.error);

  return NextResponse.json({ jobId: job.id });
}
