import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicHeader } from "@/components/public/PublicHeader";
import { CategoryNav } from "@/components/public/CategoryNav";
import { MenuItemRow } from "@/components/public/MenuItemRow";
import { PublicFooter } from "@/components/public/PublicFooter";
import { TrackEvent } from "@/components/public/TrackEvent";
import { QrScanTracker } from "@/components/public/QrScanTracker";
import { getPublishedRestaurantWithMenu } from "@/lib/data/restaurants";
import { langQuery } from "@/lib/utils/public-theme";
import type { Theme } from "@/lib/types/database";

export const dynamic = "force-dynamic";

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
  const langQs = langQuery(sp.lang, data.default_locale);
  const locale = sp.lang ?? data.default_locale;

  const allCategories = data.menus.flatMap((menu) =>
    menu.categories.map((cat) => ({ id: cat.id, name: cat.name }))
  );

  const hasItems = data.menus.some((m) =>
    m.categories.some((c) => c.items.length > 0)
  );

  return (
    <PublicShell theme={theme}>
      <TrackEvent restaurantId={data.id} eventType="menu_view" />
      <QrScanTracker restaurantId={data.id} src={sp.src} />

      <PublicHeader
        slug={slug}
        name={data.name}
        logoUrl={data.logo_url}
        locales={data.locales}
        defaultLocale={data.default_locale}
        showBack
        backHref={`/m/${slug}${langQs}`}
        backLabel="Home"
      />

      <CategoryNav categories={allCategories} />

      <main className="max-w-[640px] mx-auto px-5 py-6">
        {data.menus.map((menu) => (
          <div key={menu.id}>
            {data.menus.length > 1 && (
              <h2 className="font-display text-xl mb-6 mt-2">{menu.name}</h2>
            )}
            {menu.categories.map((cat) => (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                className="menu-section mb-10"
              >
                <h3 className="menu-category-title">{cat.name}</h3>
                <hr className="menu-category-rule" />
                {cat.description && (
                  <p className="text-sm text-[var(--color-text-muted)] mb-4 -mt-2">
                    {cat.description}
                  </p>
                )}
                {cat.items.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    slug={slug}
                    langQs={langQs}
                    currency={data.currency}
                    locale={locale}
                  />
                ))}
              </section>
            ))}
          </div>
        ))}

        {!hasItems && (
          <p className="text-center text-[var(--color-text-muted)] py-16">
            Menu coming soon.
          </p>
        )}
      </main>

      <PublicFooter
        name={data.name}
        address={data.address}
        slug={slug}
        langQs={langQs}
      />
    </PublicShell>
  );
}
