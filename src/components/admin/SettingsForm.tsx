"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRestaurantSettings, uploadLogo } from "@/actions/restaurants";
import type { Hours, Restaurant, Theme } from "@/lib/types/database";
import { DEFAULT_HOURS } from "@/lib/utils/hours";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function SettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const hours = (restaurant.hours as Hours) || DEFAULT_HOURS;
  const theme = (restaurant.theme as Theme) || {};

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const newHours: Hours = {};
    for (const day of DAY_KEYS) {
      newHours[day] = {
        open: fd.get(`${day}_open`) as string,
        close: fd.get(`${day}_close`) as string,
      };
    }

    const localesStr = fd.get("locales") as string;
    const locales = localesStr.split(",").map((l) => l.trim()).filter(Boolean);

    await updateRestaurantSettings(restaurant.id, {
      name: fd.get("name") as string,
      cuisine: (fd.get("cuisine") as string) || null,
      address: (fd.get("address") as string) || null,
      phone: (fd.get("phone") as string) || null,
      email: (fd.get("email") as string) || null,
      website: (fd.get("website") as string) || null,
      currency: fd.get("currency") as string,
      default_locale: fd.get("default_locale") as string,
      locales,
      hours: newHours,
      theme: {
        primary: fd.get("theme_primary") as string,
        mode: (fd.get("theme_mode") as "light" | "dark") || "light",
      },
      is_published: fd.get("is_published") === "on",
    });

    setSaving(false);
    setMessage("Settings saved.");
    router.refresh();
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    await uploadLogo(restaurant.id, fd);
    router.refresh();
  }

  async function handleTranslate() {
    setTranslating(true);
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: restaurant.id }),
    });
    const data = await res.json();
    setTranslating(false);
    setMessage(res.ok ? `Translated ${data.translated} fields.` : data.error);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {message && <p className="text-sm text-green-600">{message}</p>}

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Basic info</h2>
        <input name="name" defaultValue={restaurant.name} required className="w-full border rounded-lg px-3 py-2" placeholder="Restaurant name" />
        <input name="cuisine" defaultValue={restaurant.cuisine ?? ""} className="w-full border rounded-lg px-3 py-2" placeholder="Cuisine type" />
        <textarea name="address" defaultValue={restaurant.address ?? ""} className="w-full border rounded-lg px-3 py-2" placeholder="Address" rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <input name="phone" defaultValue={restaurant.phone ?? ""} className="border rounded-lg px-3 py-2" placeholder="Phone" />
          <input name="email" defaultValue={restaurant.email ?? ""} className="border rounded-lg px-3 py-2" placeholder="Email" />
        </div>
        <input name="website" defaultValue={restaurant.website ?? ""} className="w-full border rounded-lg px-3 py-2" placeholder="Website" />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Logo</h2>
        {restaurant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.logo_url} alt="Logo" className="h-20 w-20 rounded-full object-cover" />
        )}
        <input type="file" accept="image/*" onChange={handleLogo} />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Hours</h2>
        {DAY_KEYS.map((day) => (
          <div key={day} className="flex items-center gap-3 text-sm">
            <span className="w-10 uppercase font-medium">{day}</span>
            <input name={`${day}_open`} defaultValue={hours[day]?.open ?? ""} className="border rounded px-2 py-1 w-24" />
            <span>–</span>
            <input name={`${day}_close`} defaultValue={hours[day]?.close ?? ""} className="border rounded px-2 py-1 w-24" />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Languages & currency</h2>
        <input name="locales" defaultValue={restaurant.locales.join(", ")} className="w-full border rounded-lg px-3 py-2" placeholder="en, es, fr" />
        <input name="default_locale" defaultValue={restaurant.default_locale} className="w-full border rounded-lg px-3 py-2" placeholder="Default locale" />
        <input name="currency" defaultValue={restaurant.currency} className="w-full border rounded-lg px-3 py-2" placeholder="USD" />
        <button type="button" onClick={handleTranslate} disabled={translating} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
          {translating ? "Translating…" : "Translate menu to all locales"}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Theme</h2>
        <div className="flex gap-4">
          <input name="theme_primary" type="color" defaultValue={theme.primary ?? "#c2410c"} className="h-10 w-20" />
          <select name="theme_mode" defaultValue={theme.mode ?? "light"} className="border rounded-lg px-3 py-2">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Publishing</h2>
        <label className="flex items-center gap-2">
          <input name="is_published" type="checkbox" defaultChecked={restaurant.is_published} />
          Published (visible to public)
        </label>
      </section>

      <button type="submit" disabled={saving} className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50">
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
