import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PublicHeader, themeToCssVars } from "@/components/public/PublicHeader";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { getPublishedRestaurantWithMenu } from "@/lib/data/restaurants";
import { formatHours } from "@/lib/utils/hours";
import type { Theme } from "@/lib/types/database";

export const revalidate = 60;

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
  const hours = formatHours(data.hours);
  const langQs = searchParams.lang ? `?lang=${searchParams.lang}` : "";
  const mapsUrl = data.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
    : null;

  return (
    <div
      style={themeToCssVars(theme)}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <PublicHeader
        slug={slug}
        name={data.name}
        logoUrl={data.logo_url}
        showBack
        backHref={`/m/${slug}${langQs}`}
        backLabel="Home"
      />

      <main className="max-w-lg mx-auto px-4 py-6">
        <Suspense>
          <div className="flex justify-end mb-4">
            <LanguageSwitcher locales={data.locales} defaultLocale={data.default_locale} />
          </div>
        </Suspense>

        <h1 className="text-2xl font-bold mb-6">Contact</h1>

        <div className="space-y-4">
          {data.address && (
            <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold mb-1">Address</h2>
              <p className="text-[var(--muted)]">{data.address}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-[var(--accent)] text-sm font-medium"
                >
                  Open in Google Maps →
                </a>
              )}
            </div>
          )}

          {data.phone && (
            <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold mb-1">Phone</h2>
              <a href={`tel:${data.phone}`} className="text-[var(--accent)]">
                {data.phone}
              </a>
            </div>
          )}

          {data.email && (
            <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold mb-1">Email</h2>
              <a href={`mailto:${data.email}`} className="text-[var(--accent)]">
                {data.email}
              </a>
            </div>
          )}

          {data.website && (
            <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold mb-1">Website</h2>
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] break-all"
              >
                {data.website}
              </a>
            </div>
          )}

          <div className="bg-[var(--card)] rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold mb-3">Hours</h2>
            <dl className="space-y-1 text-sm">
              {hours.map(({ day, hours: h }) => (
                <div key={day} className="flex justify-between">
                  <dt className="text-[var(--muted)]">{day}</dt>
                  <dd>{h}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <Link
          href={`/m/${slug}/menu${langQs}`}
          className="block mt-8 text-center text-[var(--accent)]"
        >
          View menu →
        </Link>
      </main>
    </div>
  );
}
