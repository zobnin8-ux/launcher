"use client";

import { useEffect, useState } from "react";
import { createRestaurant } from "@/actions/restaurants";
import { getAppUrl } from "@/lib/utils/app-url";
import { isValidSlug, slugFromName } from "@/lib/utils/slug";

export function NewRestaurantForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [submitting, setSubmitting] = useState(false);

  const appHost = getAppUrl().replace(/^https?:\/\//, "");

  useEffect(() => {
    if (!slugTouched && name) {
      setSlug(slugFromName(name));
    }
  }, [name, slugTouched]);

  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    if (!isValidSlug(slug)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug/check?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  const canSubmit =
    name.trim().length > 0 && isValidSlug(slug) && slugStatus === "available" && !submitting;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("slug", slug);

    try {
      await createRestaurant(formData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create restaurant");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 bg-white rounded-xl border p-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Restaurant name *
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="The Golden Fork"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-1">
          Public URL slug *
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
          }}
          className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
          placeholder="golden-fork"
        />
        <p className="text-xs text-gray-500 mt-1">
          {appHost}/m/{slug || "your-slug"}
        </p>
        {slugStatus === "checking" && (
          <p className="text-xs text-gray-500 mt-1">Checking availability…</p>
        )}
        {slugStatus === "available" && (
          <p className="text-xs text-green-600 mt-1">✓ Available</p>
        )}
        {slugStatus === "taken" && (
          <p className="text-xs text-red-600 mt-1">✗ This slug is already taken</p>
        )}
        {slugStatus === "invalid" && slug && (
          <p className="text-xs text-red-600 mt-1">
            Use 2–64 lowercase letters, numbers, and hyphens only
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cuisine" className="block text-sm font-medium mb-1">
          Cuisine
        </label>
        <input id="cuisine" name="cuisine" className="w-full border rounded-lg px-3 py-2" placeholder="Italian, Mexican, etc." />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium mb-1">
          Address
        </label>
        <input id="address" name="address" className="w-full border rounded-lg px-3 py-2" placeholder="123 Main St, City" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input id="phone" name="phone" className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input id="email" name="email" type="email" className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-1">
            Currency
          </label>
          <input id="currency" name="currency" defaultValue="USD" className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label htmlFor="locales" className="block text-sm font-medium mb-1">
            Languages
          </label>
          <input id="locales" name="locales" defaultValue="en" className="w-full border rounded-lg px-3 py-2" placeholder="en, es" />
        </div>
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create restaurant"}
      </button>
    </form>
  );
}
