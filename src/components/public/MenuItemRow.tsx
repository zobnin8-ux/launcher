import Link from "next/link";
import Image from "next/image";
import type { Item } from "@/lib/types/database";
import {
  formatItemPrice,
  formatVariantsInline,
  itemHasDetailPage,
} from "@/lib/utils/format-price";

export function MenuItemRow({
  item,
  slug,
  langQs,
  currency,
  locale,
}: {
  item: Item;
  slug: string;
  langQs: string;
  currency: string;
  locale: string;
}) {
  const variants = formatVariantsInline(item, currency, locale);
  const price = formatItemPrice(item, currency, locale);
  const showPriceInRow = price && !variants;
  const detailHref = `/m/${slug}/item/${item.id}${langQs}`;
  const clickable = itemHasDetailPage(item);

  const content = (
    <div
      className={`py-4 border-b border-[var(--color-rule)] last:border-b-0 ${
        clickable ? "cursor-pointer hover:opacity-80" : ""
      }`}
    >
      <div className={`flex gap-4 ${item.photo_url ? "" : ""}`}>
        {item.photo_url && (
          <Image
            src={item.photo_url}
            alt=""
            width={72}
            height={72}
            sizes="72px"
            className="w-[72px] h-[72px] rounded-lg object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="menu-item-leader-row">
            <span className="menu-item-name">{item.name}</span>
            {showPriceInRow && (
              <>
                <span className="menu-item-leader" aria-hidden="true" />
                <span className="menu-item-price">{price}</span>
              </>
            )}
          </div>
          {variants && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1 tabular-nums">
              {variants}
            </p>
          )}
          {item.description && (
            <p className="menu-item-desc line-clamp-2">{item.description}</p>
          )}
          {(item.tags ?? []).length > 0 && (
            <p className="mt-1.5">
              {(item.tags ?? []).map((tag) => (
                <span key={tag} className="menu-item-tag">
                  {tag}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (clickable) {
    return (
      <Link href={detailHref} className="block focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
