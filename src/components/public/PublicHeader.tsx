import Link from "next/link";
import type { Theme } from "@/lib/types/database";

export function PublicHeader({
  slug,
  name,
  logoUrl,
  showBack,
  backHref,
  backLabel,
}: {
  slug: string;
  name: string;
  logoUrl?: string | null;
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-[var(--bg)]/90 border-b border-black/5">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        {showBack && backHref ? (
          <Link href={backHref} className="text-sm text-[var(--accent)] shrink-0">
            ← {backLabel ?? "Back"}
          </Link>
        ) : logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] font-bold">
            {name.charAt(0)}
          </div>
        )}
        <Link href={`/m/${slug}`} className="font-semibold text-lg truncate flex-1">
          {name}
        </Link>
      </div>
    </header>
  );
}

export function themeToCssVars(theme: Theme): React.CSSProperties {
  const isDark = theme.mode === "dark";
  return {
    "--accent": theme.primary ?? "#c2410c",
    "--bg": theme.bg ?? (isDark ? "#0f0f0f" : "#faf9f7"),
    "--text": isDark ? "#f5f5f4" : "#1c1917",
    "--muted": isDark ? "#a8a29e" : "#78716c",
    "--card": isDark ? "#1c1917" : "#ffffff",
  } as React.CSSProperties;
}
