import type { SupabaseClient } from "@supabase/supabase-js";

const STALE_PROCESSING_MS = 10 * 60 * 1000;

export async function expireStaleParseJobs(admin: SupabaseClient) {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();

  await admin
    .from("parse_jobs")
    .update({
      status: "error",
      error_message:
        "Processing took too long. Try uploading fewer pages at once.",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "processing")
    .lt("updated_at", cutoff);
}
