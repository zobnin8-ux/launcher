import { createAdminClient } from "@/lib/supabase/admin";
import { mergeParseResults, parseMenuPage, withRetry } from "@/lib/ai/parse-menu";
import { fileToImageBuffers } from "@/lib/ai/pdf-images";

export async function processParseJob(jobId: string) {
  const admin = createAdminClient();

  await admin
    .from("parse_jobs")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  try {
    const { data: job } = await admin
      .from("parse_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) throw new Error("Job not found");

    const path = job.source_file_url;

    const { data: fileData, error: downloadError } = await admin.storage
      .from("menu-scans")
      .download(path);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message ?? "Failed to download file");
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const fileName = path.split("/").pop() ?? "menu.pdf";
    const mimeType = fileName.endsWith(".pdf")
      ? "application/pdf"
      : "image/jpeg";

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
