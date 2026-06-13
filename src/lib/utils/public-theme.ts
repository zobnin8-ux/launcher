import type { Theme } from "@/lib/types/database";

const DEFAULT_ACCENT = "#8A3324";

function mixHex(hex: string, withWhite: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const t = Math.min(1, Math.max(0, withWhite));
  const mix = (c: number) => Math.round(c + (255 - c) * t);
  return `#${mix(r).toString(16).padStart(2, "0")}${mix(g).toString(16).padStart(2, "0")}${mix(b).toString(16).padStart(2, "0")}`;
}

export function buildPublicThemeVars(theme: Theme): React.CSSProperties {
  const isDark = theme.mode === "dark";
  const accentBase = theme.primary ?? DEFAULT_ACCENT;
  const accent = isDark ? mixHex(accentBase, 0.2) : accentBase;

  return {
    "--color-bg": isDark ? "#161513" : "#FCFBF8",
    "--color-surface": isDark ? "#1E1C1A" : "#FFFFFF",
    "--color-text": isDark ? "#F0EDE8" : "#1A1815",
    "--color-text-muted": isDark ? "rgba(240, 237, 232, 0.6)" : "rgba(26, 24, 21, 0.6)",
    "--color-accent": accent,
    "--color-rule": isDark ? "rgba(240, 237, 232, 0.12)" : "rgba(26, 24, 21, 0.12)",
  } as React.CSSProperties;
}

export function langQuery(lang: string | undefined, defaultLocale: string): string {
  if (!lang || lang === defaultLocale) return "";
  return `?lang=${encodeURIComponent(lang)}`;
}

export function withLang(path: string, langQs: string): string {
  return langQs ? `${path}${langQs}` : path;
}
