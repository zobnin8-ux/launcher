import sharp from "sharp";

export async function pdfToImages(buffer: Buffer): Promise<Buffer[]> {
  // sharp can read multi-page PDF on systems with libvips PDF support
  try {
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
    // Fallback: treat as single image attempt
    const png = await sharp(buffer).png().toBuffer();
    return [png];
  }
}

export function detectMediaType(
  mimeType: string,
  fileName: string
): "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "pdf" {
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) return "pdf";
  if (mimeType === "image/png") return "image/png";
  if (mimeType === "image/webp") return "image/webp";
  if (mimeType === "image/gif") return "image/gif";
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

  const png = await sharp(buffer).png().toBuffer();
  return [{ buffer: png, mediaType: "image/png" }];
}
