import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { PublicShell } from "@/components/public/PublicShell";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";
import { getPublishedRestaurantWithMenu } from "@/lib/data/restaurants";
import { langQuery, withLang } from "@/lib/utils/public-theme";
import { getOpenStatus, cityFromAddress } from "@/lib/utils/hours-status";
import type { Theme } from "@/lib/types/database";

export const dynamic = "force-dynamic";

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
  const langQs = langQuery(lang, data.default_locale);
  const { label: hoursLabel } = getOpenStatus(data.hours);
  const city = cityFromAddress(data.address);
  const subtitle = [data.cuisine, city].filter(Boolean).join(" · ");

  if (data.cover_url) {
    return (
      <PublicShell theme={theme} className="relative">
        <div className="relative min-h-screen">
          <Image
            src={data.cover_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.15) 100%)",
            }}
          />
          <div className="relative z-10 flex flex-col min-h-screen text-white">
            <div className="max-w-[640px] mx-auto w-full px-5 pt-5 flex justify-end">
              <Suspense>
                <LanguageSwitcher
                  locales={data.locales}
                  defaultLocale={data.default_locale}
                  variant="inverse"
                />
              </Suspense>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8 text-center">
              {data.logo_url && (
                <Image
                  src={data.logo_url}
                  alt={data.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover mb-5 ring-1 ring-white/20"
                />
              )}
              <h1 className="font-display text-3xl md:text-[32px] leading-tight">
                {data.name}
              </h1>
              {subtitle && (
                <p className="text-white/70 mt-2 text-sm">{subtitle}</p>
              )}
              <p className="text-white/80 mt-3 text-sm">{hoursLabel}</p>
              <Link
                href={withLang(`/m/${slug}/menu`, langQs)}
                className="mt-8 inline-block px-8 py-3.5 bg-[var(--color-accent)] text-white text-[17px] font-medium hover:opacity-90 transition-opacity"
              >
                View menu
              </Link>
            </div>

            {data.address && (
              <div className="px-5 pb-8 text-center">
                <Link
                  href={withLang(`/m/${slug}/contacts`, langQs)}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {data.address}
                </Link>
              </div>
            )}
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell theme={theme}>
      <div className="min-h-screen print-frame m-3 flex flex-col">
        <div className="max-w-[640px] mx-auto w-full px-5 pt-5 flex justify-end">
          <Suspense>
            <LanguageSwitcher
              locales={data.locales}
              defaultLocale={data.default_locale}
            />
          </Suspense>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8 text-center">
          {data.logo_url && (
            <Image
              src={data.logo_url}
              alt={data.name}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover mb-5"
            />
          )}
          <h1 className="font-display text-3xl md:text-[32px] leading-tight">
            {data.name}
          </h1>
          {subtitle && (
            <p className="text-[var(--color-text-muted)] mt-2 text-sm">{subtitle}</p>
          )}
          <p className="text-[var(--color-text-muted)] mt-3 text-sm">{hoursLabel}</p>
          <Link
            href={withLang(`/m/${slug}/menu`, langQs)}
            className="mt-8 inline-block px-8 py-3.5 bg-[var(--color-accent)] text-white text-[17px] font-medium hover:opacity-90 transition-opacity"
          >
            View menu
          </Link>
        </div>

        {data.address && (
          <div className="px-5 pb-8 text-center">
            <Link
              href={withLang(`/m/${slug}/contacts`, langQs)}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
            >
              {data.address}
            </Link>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
