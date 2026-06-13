"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  uk: "Українська",
  pl: "Polski",
  ja: "日本語",
  zh: "中文",
  ar: "العربية",
};

export function LanguageSwitcher({
  locales,
  defaultLocale,
}: {
  locales: string[];
  defaultLocale: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safeLocales = locales?.length ? locales : [defaultLocale];
  const current = searchParams.get("lang") ?? defaultLocale;

  if (safeLocales.length <= 1) return null;

  return (
    <div className="flex gap-1 flex-wrap">
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

        return (
          <Link
            key={locale}
            href={href}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              active
                ? "bg-[var(--accent)] text-white"
                : "bg-black/5 dark:bg-white/10 hover:bg-black/10"
            }`}
          >
            {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
