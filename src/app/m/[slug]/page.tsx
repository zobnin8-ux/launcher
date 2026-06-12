import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { PublicHeader, themeToCssVars } from "@/components/public/PublicHeader";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { getPublishedRestaurantWithMenu } from "@/lib/data/restaurants";
import type { Theme } from "@/lib/types/database";
import { formatHours } from "@/lib/utils/hours";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

export default async function RestaurantHomePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { lang?: string };
}) {
  const { slug } = params;
  const { lang } = searchParams;
  const data = await getPublishedRestaurantWithMenu(slug, lang);

  if (!data) notFound();

  const theme = (data.theme as Theme) || {};
  const hours = formatHours(data.hours);

  return (
    <div
      style={themeToCssVars(theme)}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
    >
      <PublicHeader slug={slug} name={data.name} logoUrl={data.logo_url} />

      <main className="max-w-lg mx-auto px-4 py-8">
        <Suspense>
          <div className="flex justify-end mb-4">
            <LanguageSwitcher locales={data.locales} defaultLocale={data.default_locale} />
          </div>
        </Suspense>

        <div className="text-center mb-8">
          {data.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logo_url}
              alt={data.name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-[var(--accent)]/20"
            />
          )}
          <h1 className="text-3xl font-bold">{data.name}</h1>
          {data.cuisine && (
            <p className="text-[var(--muted)] mt-1">{data.cuisine}</p>
          )}
        </div>

        <Link
          href={`/m/${slug}/menu${lang ? `?lang=${lang}` : ""}`}
          className="block w-full py-4 bg-[var(--accent)] text-white text-center rounded-2xl font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          View menu
        </Link>

        <div className="mt-8 bg-[var(--card)] rounded-2xl p-5 shadow-sm">
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

        <Link
          href={`/m/${slug}/contacts${lang ? `?lang=${lang}` : ""}`}
          className="block mt-4 text-center text-[var(--accent)] text-sm"
        >
          Contact & location →
        </Link>
      </main>
    </div>
  );
}
