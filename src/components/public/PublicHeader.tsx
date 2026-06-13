import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/public/LanguageSwitcher";

export function PublicHeader({
  slug,
  name,
  logoUrl,
  locales,
  defaultLocale,
  showBack,
  backHref,
  backLabel,
}: {
  slug: string;
  name: string;
  logoUrl?: string | null;
  locales: string[];
  defaultLocale: string;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-[var(--color-bg)]/90 border-b border-[var(--color-rule)]">
      <div className="max-w-[640px] mx-auto px-5 py-3 flex items-center gap-3">
        {showBack && backHref ? (
          <Link
            href={backHref}
            className="text-sm text-[var(--color-accent)] shrink-0 font-medium"
          >
            ← {backLabel ?? "Back"}
          </Link>
        ) : logoUrl ? (
          <Link href={`/m/${slug}`} className="shrink-0">
            <Image
              src={logoUrl}
              alt={name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          </Link>
        ) : null}

        {!showBack && (
          <Link
            href={`/m/${slug}`}
            className="font-display text-lg truncate flex-1 min-w-0"
          >
            {name}
          </Link>
        )}

        {showBack && (
          <span className="font-display text-lg truncate flex-1 min-w-0">{name}</span>
        )}

        <Suspense>
          <LanguageSwitcher locales={locales} defaultLocale={defaultLocale} />
        </Suspense>
      </div>
    </header>
  );
}
