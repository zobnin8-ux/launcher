import type { Item, ItemVariant } from "@/lib/types/database";

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
