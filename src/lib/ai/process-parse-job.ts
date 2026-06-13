import { createAdminClient } from "@/lib/supabase/admin";
import { mergeParseResults, parseMenuPage, withRetry } from "@/lib/ai/parse-menu";
import { detectMediaType, fileToImageBuffers } from "@/lib/ai/pdf-images";

function mimeTypeFromFileName(fileName: string): string {
  const type = detectMediaType("", fileName);
  return type === "pdf" ? "application/pdf" : type;
}

export async function processParseJob(jobId: string) {
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("parse_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) throw new Error("Job not found");
  if (job.status === "done") return;
  if (job.status === "error") {
    throw new Error(job.error_message ?? "Parsing failed");
  }

  const { data: claimed } = await admin
    .from("parse_jobs")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (!claimed) {
    if (job.status === "processing") return;
    throw new Error("Could not start parsing job");
  }

  try {

    const path = claimed.source_file_url;

    const { data: fileData, error: downloadError } = await admin.storage
      .from("menu-scans")
      .download(path);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message ?? "Failed to download file");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const fileName = path.split("/").pop() ?? "menu.jpg";
    const mimeType = mimeTypeFromFileName(fileName);

    const pages = await fileToImageBuffers(buffer, mimeType, fileName);
    const pageResults = [];

    for (const page of pages) {
      const base64 = page.buffer.toString("base64");
      const result = await withRetry(() =>
        parseMenuPage(base64, page.mediaType)
      );
      pageResults.push(result);
    }

    const merged = mergeParseResults(pageResults);

    await admin
      .from("parse_jobs")
      .update({
        status: "done",
        result: merged,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Menu parsing failed. Please try again.";
    await admin
      .from("parse_jobs")
      .update({
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
