import type { Hours } from "@/lib/types/database";

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function formatHours(
  hours: Hours | null | undefined
): { key: string; day: string; hours: string }[] {
  const safe = hours && typeof hours === "object" ? hours : DEFAULT_HOURS;
  return Object.entries(DAY_LABELS).map(([key, label]) => {
    const day = safe[key];
    if (!day?.open || !day?.close) {
      return { key, day: label, hours: "Closed" };
    }
    return { key, day: label, hours: `${day.open} – ${day.close}` };
  });
}

export function getTodayHoursKey(): string {
  const keys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return keys[new Date().getDay()];
}

export const DEFAULT_HOURS: Hours = {
  mon: { open: "09:00", close: "22:00" },
  tue: { open: "09:00", close: "22:00" },
  wed: { open: "09:00", close: "22:00" },
  thu: { open: "09:00", close: "22:00" },
  fri: { open: "09:00", close: "23:00" },
  sat: { open: "10:00", close: "23:00" },
  sun: { open: "10:00", close: "21:00" },
};
