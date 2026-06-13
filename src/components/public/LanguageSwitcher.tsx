"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  it: "IT",
  pt: "PT",
  ru: "RU",
  uk: "UK",
  pl: "PL",
  ja: "JA",
  zh: "ZH",
  ar: "AR",
};

export function LanguageSwitcher({
  locales,
  defaultLocale,
  variant = "default",
}: {
  locales: string[];
  defaultLocale: string;
  variant?: "default" | "inverse";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safeLocales = locales?.length ? locales : [defaultLocale];
  const current = searchParams.get("lang") ?? defaultLocale;

  if (safeLocales.length <= 1) return null;

  return (
    <div className="flex gap-3 shrink-0" role="navigation" aria-label="Language">
      {safeLocales.map((locale) => {
        const params = new URLSearchParams(searchParams.toString());
        if (locale === defaultLocale) {
          params.delete("lang");
        } else {
          params.set("lang", locale);
        }
        const qs = params.toString();
        const href = qs ? `${pathname}?${qs}` : pathname;
        const active = locale === current;
        const activeClass =
          variant === "inverse"
            ? active
              ? "text-[var(--color-accent)] font-medium"
              : "text-white/60 hover:text-white/90"
            : active
              ? "text-[var(--color-accent)] font-medium"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]";

        return (
          <Link
            key={locale}
            href={href}
            className={`text-xs tracking-wide transition-colors ${activeClass}`}
            aria-current={active ? "page" : undefined}
          >
            {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
