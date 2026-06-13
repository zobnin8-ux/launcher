import { createAdminClient } from "@/lib/supabase/admin";
import {
  imageMediaTypeFromFileName,
  isPdfFile,
  parseMenuImage,
  parseMenuPdf,
  withRetry,
} from "@/lib/ai/parse-menu";
import { expireStaleParseJobs } from "@/lib/ai/parse-jobs";

export async function processParseJob(jobId: string) {
  const admin = createAdminClient();

  await expireStaleParseJobs(admin);

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
    const mimeType = fileName.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : "image/jpeg";

    const base64 = buffer.toString("base64");
    let merged;

    if (isPdfFile(fileName, mimeType)) {
      merged = await withRetry(() => parseMenuPdf(base64));
    } else {
      const mediaType = imageMediaTypeFromFileName(fileName, mimeType);
      merged = await withRetry(() => parseMenuImage(base64, mediaType));
    }

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
    const friendly = message.includes("timeout") || message.includes("timed out")
      ? "Processing took too long. Try uploading fewer pages at once."
      : message;

    await admin
      .from("parse_jobs")
      .update({
        status: "error",
        error_message: friendly,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
