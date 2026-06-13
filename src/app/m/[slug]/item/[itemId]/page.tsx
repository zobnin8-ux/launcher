import { notFound } from "next/navigation";
import Image from "next/image";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicHeader } from "@/components/public/PublicHeader";
import { TrackEvent } from "@/components/public/TrackEvent";
import { getItemById } from "@/lib/data/restaurants";
import {
  formatItemPrice,
  itemHasDetailPage,
} from "@/lib/utils/format-price";
import { langQuery } from "@/lib/utils/public-theme";
import type { ItemVariant, Theme } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: { slug: string; itemId: string };
  searchParams: { lang?: string };
}) {
  const { slug, itemId } = params;
  const data = await getItemById(slug, itemId, searchParams.lang);

  if (!data) notFound();

  const { restaurant, item, category } = data;
  if (!itemHasDetailPage(item)) notFound();

  const theme = (restaurant.theme as Theme) || {};
  const langQs = langQuery(searchParams.lang, restaurant.default_locale);
  const locale = searchParams.lang ?? restaurant.default_locale;
  const variants = (item.variants ?? []) as ItemVariant[];

  return (
    <PublicShell theme={theme}>
      <TrackEvent
        restaurantId={restaurant.id}
        eventType="item_view"
        metadata={{ itemId: item.id }}
      />

      <PublicHeader
        slug={slug}
        name={restaurant.name}
        logoUrl={restaurant.logo_url}
        locales={restaurant.locales}
        defaultLocale={restaurant.default_locale}
        showBack
        backHref={`/m/${slug}/menu${langQs}`}
        backLabel="Menu"
      />

      <main className="max-w-[640px] mx-auto pb-10">
        {item.photo_url && (
          <div className="relative w-full max-h-[45vh] overflow-hidden">
            <Image
              src={item.photo_url}
              alt={item.name}
              width={640}
              height={480}
              sizes="(max-width: 640px) 100vw, 640px"
              className="w-full max-h-[45vh] object-cover"
              priority
            />
          </div>
        )}

        <div className="px-5 py-6">
          <p className="menu-category-title">{category.name}</p>
          <hr className="menu-category-rule" />

          <h1 className="font-display text-2xl mt-2">{item.name}</h1>

          {variants.length > 0 ? (
            <dl className="mt-4 space-y-2">
              {variants.map((v) => (
                <div key={v.name} className="flex justify-between text-[17px]">
                  <dt>{v.name}</dt>
                  <dd className="tabular-nums font-medium">
                    {formatItemPrice(
                      { price: v.price, variants: [] },
                      restaurant.currency,
                      locale
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-[17px] tabular-nums font-medium">
              {formatItemPrice(item, restaurant.currency, locale)}
            </p>
          )}

          {item.description && (
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-text-muted)]">
              {item.description}
            </p>
          )}

          {(item.tags ?? []).length > 0 && (
            <p className="mt-5">
              {(item.tags ?? []).map((tag) => (
                <span key={tag} className="menu-item-tag">
                  {tag}
                </span>
              ))}
            </p>
          )}

          {(item.allergens ?? []).length > 0 && (
            <p className="mt-5 text-sm text-[var(--color-text-muted)]">
              Contains: {(item.allergens ?? []).join(", ")}
            </p>
          )}
        </div>
      </main>
    </PublicShell>
  );
}
