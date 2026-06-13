import type { Hours } from "@/lib/types/database";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function getOpenStatus(hours: Hours | null | undefined): {
  isOpen: boolean;
  label: string;
} {
  const now = new Date();
  const key = DAY_KEYS[now.getDay()];
  const day = hours?.[key];

  if (!day?.open || !day?.close) {
    return { isOpen: false, label: "Hours unavailable" };
  }

  const nowM = now.getHours() * 60 + now.getMinutes();
  const openM = parseTime(day.open);
  const closeM = parseTime(day.close);
  const isOpen = nowM >= openM && nowM < closeM;

  if (isOpen) {
    return { isOpen: true, label: `Open until ${formatTime12(day.close)}` };
  }

  return { isOpen: false, label: "Closed now" };
}

function formatTime12(t: string): string {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return m === "00" ? `${h} ${ampm}` : `${h}:${m} ${ampm}`;
}

export function cityFromAddress(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}
