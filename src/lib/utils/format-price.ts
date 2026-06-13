import type { Item, ItemVariant } from "@/lib/types/database";

export function itemHasDetailPage(
  item: Pick<Item, "photo_url" | "description">
): boolean {
  return Boolean(item.photo_url) || (item.description?.length ?? 0) > 100;
}

export function formatVariantsInline(
  item: Pick<Item, "variants">,
  currency: string,
  locale = "en"
): string {
  const variants = (item.variants ?? []) as ItemVariant[];
  if (!variants.length) return "";
  return variants
    .map((v) => `${v.name} ${formatPrice(v.price, currency, locale)}`)
    .join(" · ");
}

export function formatPrice(
  amount: number,
  currency: string,
  locale = "en"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatItemPrice(
  item: Pick<Item, "price" | "variants">,
  currency: string,
  locale = "en"
): string {
  if (item.variants && item.variants.length > 0) {
    const prices = (item.variants as ItemVariant[]).map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return formatPrice(min, currency, locale);
    return `${formatPrice(min, currency, locale)} – ${formatPrice(max, currency, locale)}`;
  }
  if (item.price != null) return formatPrice(Number(item.price), currency, locale);
  return "";
}
