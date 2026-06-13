export function detectMediaType(
  mimeType: string,
  fileName: string
): "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "pdf" {
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) return "pdf";
  if (mimeType === "image/png" || fileName.endsWith(".png")) return "image/png";
  if (mimeType === "image/webp" || fileName.endsWith(".webp")) return "image/webp";
  if (mimeType === "image/gif" || fileName.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function fileToImageBuffers(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ buffer: Buffer; mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }[]> {
  const type = detectMediaType(mimeType, fileName);

  if (type === "pdf") {
    const pages = await pdfToImages(buffer);
    return pages.map((b) => ({ buffer: b, mediaType: "image/png" as const }));
  }

  // Photos: send as-is — Claude accepts JPEG/PNG/WebP/GIF without conversion
  return [{ buffer, mediaType: type }];
}

async function pdfToImages(buffer: Buffer): Promise<Buffer[]> {
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer, { density: 150 }).metadata();
    const pages = metadata.pages ?? 1;
    const images: Buffer[] = [];

    for (let i = 0; i < pages; i++) {
      const page = await sharp(buffer, { density: 150, page: i })
        .png()
        .toBuffer();
      images.push(page);
    }

    return images;
  } catch {
    throw new Error(
      "PDF conversion is unavailable. Upload a photo (JPG or PNG) of the menu instead."
    );
  }
}
