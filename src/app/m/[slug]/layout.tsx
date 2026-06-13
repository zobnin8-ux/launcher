import { Fraunces, Schibsted_Grotesk } from "next/font/google";
import "../public-menu.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export default function PublicRestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${fraunces.variable} ${schibsted.variable}`}>{children}</div>
  );
}
