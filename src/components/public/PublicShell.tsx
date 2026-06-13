import type { Theme } from "@/lib/types/database";
import { buildPublicThemeVars } from "@/lib/utils/public-theme";

export function PublicShell({
  theme,
  children,
  className = "",
}: {
  theme: Theme;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`public-menu min-h-screen ${className}`}
      style={buildPublicThemeVars(theme)}
    >
      {children}
    </div>
  );
}
