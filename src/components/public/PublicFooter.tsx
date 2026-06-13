import Link from "next/link";
import { withLang } from "@/lib/utils/public-theme";

export function PublicFooter({
  name,
  address,
  slug,
  langQs,
}: {
  name: string;
  address: string | null;
  slug: string;
  langQs: string;
}) {
  return (
    <footer className="max-w-[640px] mx-auto px-5 py-10 mt-8 border-t border-[var(--color-rule)]">
      <p className="font-display text-lg">{name}</p>
      {address && <p className="text-sm text-[var(--color-text-muted)] mt-1">{address}</p>}
      <Link
        href={withLang(`/m/${slug}/contacts`, langQs)}
        className="inline-block mt-3 text-sm text-[var(--color-accent)]"
      >
        Contacts
      </Link>
      <p className="mt-8 text-xs text-[var(--color-text-muted)]">
        <a href="/" className="hover:text-[var(--color-text)] transition-colors">
          Menu by Restaurant Launch Kit
        </a>
      </p>
    </footer>
  );
}
