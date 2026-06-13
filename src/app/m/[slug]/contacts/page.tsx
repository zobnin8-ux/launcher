import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicShell } from "@/components/public/PublicShell";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { getPublishedRestaurantWithMenu } from "@/lib/data/restaurants";
import { formatHours, getTodayHoursKey } from "@/lib/utils/hours";
import { langQuery, withLang } from "@/lib/utils/public-theme";
import type { Theme } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { lang?: string };
}) {
  const { slug } = params;
  const data = await getPublishedRestaurantWithMenu(slug, searchParams.lang);

  if (!data) notFound();

  const theme = (data.theme as Theme) || {};
  const langQs = langQuery(searchParams.lang, data.default_locale);
  const hours = formatHours(data.hours);
  const todayKey = getTodayHoursKey();
  const mapsUrl = data.address
    ? `https://maps.google.com/?q=${encodeURIComponent(data.address)}`
    : null;

  return (
    <PublicShell theme={theme}>
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

      <main className="max-w-[640px] mx-auto px-5 py-8">
        <h1 className="font-display text-2xl mb-8">Contact</h1>

        <div className="space-y-8">
          {data.address && (
            <section>
              <h2 className="menu-category-title">Address</h2>
              <hr className="menu-category-rule" />
              <p className="text-[var(--color-text-muted)]">{data.address}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-[var(--color-accent)]"
                >
                  Open in Google Maps
                </a>
              )}
            </section>
          )}

          {data.phone && (
            <section>
              <h2 className="menu-category-title">Phone</h2>
              <hr className="menu-category-rule" />
              <a href={`tel:${data.phone}`} className="text-[var(--color-accent)]">
                {data.phone}
              </a>
            </section>
          )}

          {data.email && (
            <section>
              <h2 className="menu-category-title">Email</h2>
              <hr className="menu-category-rule" />
              <a href={`mailto:${data.email}`} className="text-[var(--color-accent)]">
                {data.email}
              </a>
            </section>
          )}

          {data.website && (
            <section>
              <h2 className="menu-category-title">Website</h2>
              <hr className="menu-category-rule" />
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] break-all"
              >
                {data.website}
              </a>
            </section>
          )}

          <section>
            <h2 className="menu-category-title">Hours</h2>
            <hr className="menu-category-rule" />
            <dl className="space-y-2 text-sm">
              {hours.map(({ key, day, hours: h }) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt
                    className={
                      key === todayKey
                        ? "font-medium text-[var(--color-text)]"
                        : "text-[var(--color-text-muted)]"
                    }
                  >
                    {day}
                  </dt>
                  <dd
                    className={`tabular-nums ${
                      key === todayKey ? "font-medium" : ""
                    }`}
                  >
                    {h}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <Link
          href={withLang(`/m/${slug}/menu`, langQs)}
          className="inline-block mt-10 text-sm text-[var(--color-accent)]"
        >
          View menu
        </Link>
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
