import Anthropic from "@anthropic-ai/sdk";
import type { ParseResult } from "@/lib/types/database";

export const PARSE_MENU_PROMPT = `You are a menu OCR assistant. Analyze this menu and extract structured data.

Return ONLY valid JSON with no markdown, no code fences, no explanation. Use this exact schema:
{
  "categories": [
    {
      "name": "Category Name",
      "items": [
        {
          "name": "Dish Name",
          "description": "optional description",
          "price": 9.50,
          "variants": [],
          "tags": ["vegetarian"]
        }
      ]
    }
  ]
}

Rules:
- Prices must be numbers, not strings
- If a dish has multiple sizes/prices (S/M/L), set price to null and fill variants: [{"name":"Small","price":8.00}, ...]
- Do NOT invent dishes or descriptions not visible in the menu
- If text is unreadable, use "name": "UNRECOGNIZED" and put raw text in description
- tags: only use if clearly indicated (vegetarian, vegan, spicy, gluten-free, etc.)
- Merge items under appropriate category headings from the menu`;

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export async function parseMenuImage(
  imageBase64: string,
  mediaType: ImageMediaType
): Promise<ParseResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          { type: "text", text: PARSE_MENU_PROMPT },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseJsonResult(text);
}

export async function parseMenuPdf(pdfBase64: string): Promise<ParseResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          { type: "text", text: PARSE_MENU_PROMPT },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseJsonResult(text);
}

/** @deprecated use parseMenuImage */
export const parseMenuPage = parseMenuImage;

export function mergeParseResults(results: ParseResult[]): ParseResult {
  const categoryMap = new Map<string, ParseResult["categories"][0]>();

  for (const result of results) {
    for (const cat of result.categories) {
      const key = cat.name.toLowerCase().trim();
      if (categoryMap.has(key)) {
        categoryMap.get(key)!.items.push(...cat.items);
      } else {
        categoryMap.set(key, { ...cat, items: [...cat.items] });
      }
    }
  }

  return { categories: Array.from(categoryMap.values()) };
}

function parseJsonResult(text: string): ParseResult {
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as ParseResult;

  for (const cat of parsed.categories) {
    for (const item of cat.items) {
      if (item.variants?.length) {
        item.price = null;
      }
    }
  }

  return parsed;
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (first) {
    try {
      return await fn();
    } catch (second) {
      throw second instanceof Error ? second : first;
    }
  }
}

export function imageMediaTypeFromFileName(
  fileName: string,
  mimeType: string
): ImageMediaType {
  if (mimeType === "image/png" || fileName.endsWith(".png")) return "image/png";
  if (mimeType === "image/webp" || fileName.endsWith(".webp")) return "image/webp";
  if (mimeType === "image/gif" || fileName.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export function isPdfFile(fileName: string, mimeType: string): boolean {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

export const MAX_PDF_BYTES = 32 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
