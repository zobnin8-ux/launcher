import Anthropic from "@anthropic-ai/sdk";

export async function translateTexts(
  texts: { key: string; text: string; field: string }[],
  targetLocales: string[],
  sourceLocale: string
): Promise<{ key: string; locale: string; field: string; value: string }[]> {
  if (!texts.length || !targetLocales.length) return [];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const results: { key: string; locale: string; field: string; value: string }[] = [];

  for (const locale of targetLocales) {
    if (locale === sourceLocale) continue;

    const prompt = `Translate the following restaurant menu texts from ${sourceLocale} to ${locale}.
Return ONLY valid JSON array with objects: {"key":"...", "field":"...", "value":"translated text"}
Preserve culinary terms appropriately. Do not add or remove items.

Input:
${JSON.stringify(texts.map((t) => ({ key: t.key, field: t.field, text: t.text })))}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "[]";
    const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { key: string; field: string; value: string }[];

    for (const row of parsed) {
      results.push({ ...row, locale });
    }
  }

  return results;
}

export async function improveDescriptions(
  items: { id: string; name: string; description?: string | null; tags?: string[] }[]
): Promise<{ id: string; description: string }[]> {
  const needsDescription = items.filter((i) => !i.description?.trim());
  if (!needsDescription.length) return [];

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `Write short, appetizing menu descriptions (1-2 sentences max) for these dishes.
Return ONLY valid JSON array: {"id":"...", "description":"..."}
Do not invent ingredients not implied by the name/tags.

Dishes:
${JSON.stringify(needsDescription.map((i) => ({ id: i.id, name: i.name, tags: i.tags ?? [] })))}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as { id: string; description: string }[];
}
