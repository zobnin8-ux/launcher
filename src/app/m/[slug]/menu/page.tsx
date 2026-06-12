import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PublicHeader, themeToCssVars } from "@/components/public/PublicHeader";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { TrackEvent } from "@/components/public/TrackEvent";
import { QrScanTracker } from "@/components/public/QrScanTracker";
import { getPublishedRestaurantWithMenu } from "@/lib/data/restaurants";
import { formatItemPrice } from "@/lib/utils/format-price";
import type { Theme } from "@/lib/types/database";

export const revalidate = 60;

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { lang?: string; src?: string };
}) {
  const { slug } = params;
  const sp = searchParams;
  const data = await getPublishedRestaurantWithMenu(slug, sp.lang);

  if (!data) notFound();

  const theme = (data.theme as Theme) || {};
  const langQs = sp.lang ? `?lang=${sp.lang}` : "";

  return (
    <div
      style={themeToCssVars(theme)}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-8"
    >
      <TrackEvent restaurantId={data.id} eventType="menu_view" />
      <QrScanTracker restaurantId={data.id} src={sp.src} />

      <PublicHeader
        slug={slug}
        name={data.name}
        logoUrl={data.logo_url}
        showBack
        backHref={`/m/${slug}${langQs}`}
        backLabel="Home"
      />

      <main className="max-w-lg mx-auto px-4 py-4">
        <Suspense>
          <div className="flex justify-end mb-4">
            <LanguageSwitcher locales={data.locales} defaultLocale={data.default_locale} />
          </div>
        </Suspense>

        <h1 className="text-2xl font-bold mb-6">Menu</h1>

        {data.menus.map((menu) => (
          <div key={menu.id} className="space-y-8">
            {data.menus.length > 1 && (
              <h2 className="text-lg font-semibold text-[var(--accent)]">{menu.name}</h2>
            )}
            {menu.categories.map((cat) => (
              <section key={cat.id}>
                <h3 className="text-lg font-bold border-b border-[var(--accent)]/30 pb-2 mb-4">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-sm text-[var(--muted)] mb-3">{cat.description}</p>
                )}
                <div className="space-y-4">
                  {cat.items.filter((i) => i.is_available).map((item) => (
                    <Link
                      key={item.id}
                      href={`/m/${slug}/item/${item.id}${langQs}`}
                      className="flex gap-3 bg-[var(--card)] rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {item.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photo_url}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-[var(--accent)] shrink-0 text-sm font-medium">
                            {formatItemPrice(item, data.currency, sp.lang ?? data.default_locale)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-[var(--muted)] mt-0.5 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-1.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ))}

        {data.menus.every((m) => m.categories.length === 0) && (
          <p className="text-center text-[var(--muted)] py-12">Menu coming soon.</p>
        )}
      </main>
    </div>
  );
}
