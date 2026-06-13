"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteRestaurant } from "@/actions/restaurants";
import type { Restaurant } from "@/lib/types/database";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        `Delete "${restaurant.name}"? This removes the menu and all data. Cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      await deleteRestaurant(restaurant.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border p-5 hover:border-orange-300 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/admin/${restaurant.id}`} className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg">{restaurant.name}</h2>
          <p className="text-sm text-gray-500">{restaurant.cuisine ?? "Restaurant"}</p>
          <p className="text-xs text-gray-400 mt-1">/m/{restaurant.slug}</p>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              restaurant.is_published
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {restaurant.is_published ? "Published" : "Draft"}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 px-2 py-1"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
