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

export function formatHours(hours: Hours): { day: string; hours: string }[] {
  return Object.entries(DAY_LABELS).map(([key, label]) => {
    const day = hours[key];
    if (!day?.open || !day?.close) {
      return { day: label, hours: "Closed" };
    }
    return { day: label, hours: `${day.open} – ${day.close}` };
  });
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
