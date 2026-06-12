/**
 * Production site URL — set on Vercel (Production env only).
 * Example: https://launcher-black.vercel.app
 */
const PROD_URL = process.env.NEXT_PUBLIC_PROD_APP_URL;

/**
 * Local dev URL — set in .env.local on your machine only.
 * Example: http://localhost:3000
 */
const DEV_URL = process.env.NEXT_PUBLIC_DEV_APP_URL ?? "http://localhost:3000";

export function getAppUrl(): string {
  if (process.env.VERCEL_ENV === "production" && PROD_URL) {
    return PROD_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return DEV_URL.replace(/\/$/, "");
}
