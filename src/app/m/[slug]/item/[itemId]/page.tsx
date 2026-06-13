import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicHeader, themeToCssVars } from "@/components/public/PublicHeader";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { TrackEvent } from "@/components/public/TrackEvent";
import { getItemById } from "@/lib/data/restaurants";
import { formatItemPrice } from "@/lib/utils/format-price";
import { DishPhotoPlaceholder } from "@/components/public/DishPhotoPlaceholder";
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
  const theme = (restaurant.theme as Theme) || {};
  const langQs = searchParams.lang ? `?lang=${searchParams.lang}` : "";
  const variants = (item.variants ?? []) as ItemVariant[];

  return (
    <div
      style={themeToCssVars(theme)}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <TrackEvent
        restaurantId={restaurant.id}
        eventType="item_view"
        metadata={{ itemId: item.id }}
      />

      <PublicHeader
        slug={slug}
        name={restaurant.name}
        logoUrl={restaurant.logo_url}
        showBack
        backHref={`/m/${slug}/menu${langQs}`}
        backLabel="Menu"
      />

      <main className="max-w-lg mx-auto px-4 py-6">
        <Suspense>
          <div className="flex justify-end mb-4">
            <LanguageSwitcher
              locales={restaurant.locales}
              defaultLocale={restaurant.default_locale}
            />
          </div>
        </Suspense>

        {item.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-full aspect-[4/3] object-cover rounded-2xl mb-6"
          />
        ) : (
          <div className="mb-6">
            <DishPhotoPlaceholder
              categoryName={category.name}
              tags={item.tags}
              size="lg"
            />
          </div>
        )}

        <p className="text-sm text-[var(--muted)]">{category.name}</p>
        <h1 className="text-2xl font-bold mt-1">{item.name}</h1>

        {item.description && (
          <p className="mt-4 text-[var(--muted)] leading-relaxed">{item.description}</p>
        )}

        <div className="mt-6 bg-[var(--card)] rounded-2xl p-5 shadow-sm">
          {variants.length > 0 ? (
            <dl className="space-y-2">
              {variants.map((v) => (
                <div key={v.name} className="flex justify-between">
                  <dt>{v.name}</dt>
                  <dd className="font-semibold text-[var(--accent)]">
                    {formatItemPrice(
                      { price: v.price, variants: [] },
                      restaurant.currency,
                      searchParams.lang ?? restaurant.default_locale
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xl font-semibold text-[var(--accent)]">
              {formatItemPrice(item, restaurant.currency, searchParams.lang ?? restaurant.default_locale)}
            </p>
          )}
        </div>

        {(item.tags ?? []).length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {(item.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(item.allergens ?? []).length > 0 && (
          <p className="mt-4 text-xs text-[var(--muted)]">
            Allergens: {(item.allergens ?? []).join(", ")}
          </p>
        )}
      </main>
    </div>
  );
}
