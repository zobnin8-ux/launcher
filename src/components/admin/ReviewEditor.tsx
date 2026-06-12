"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmParseResult } from "@/actions/menu";
import type { ParseResult } from "@/lib/types/database";

export function ReviewEditor({
  restaurantId,
  jobId,
  initialResult,
}: {
  restaurantId: string;
  jobId: string;
  initialResult: ParseResult;
}) {
  const [result, setResult] = useState<ParseResult>(initialResult);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function updateCategoryName(ci: number, name: string) {
    setResult((r) => {
      const cats = [...r.categories];
      cats[ci] = { ...cats[ci], name };
      return { categories: cats };
    });
  }

  function updateItem(
    ci: number,
    ii: number,
    field: "name" | "description" | "price",
    value: string
  ) {
    setResult((r) => {
      const cats = [...r.categories];
      const items = [...cats[ci].items];
      const item = { ...items[ii] };
      if (field === "price") {
        item.price = value ? parseFloat(value) : null;
      } else {
        item[field] = value;
      }
      items[ii] = item;
      cats[ci] = { ...cats[ci], items };
      return { categories: cats };
    });
  }

  function deleteItem(ci: number, ii: number) {
    setResult((r) => {
      const cats = [...r.categories];
      cats[ci] = {
        ...cats[ci],
        items: cats[ci].items.filter((_, i) => i !== ii),
      };
      return { categories: cats };
    });
  }

  function addItem(ci: number) {
    setResult((r) => {
      const cats = [...r.categories];
      cats[ci] = {
        ...cats[ci],
        items: [
          ...cats[ci].items,
          { name: "New item", description: "", price: null, variants: [], tags: [] },
        ],
      };
      return { categories: cats };
    });
  }

  function deleteCategory(ci: number) {
    setResult((r) => ({
      categories: r.categories.filter((_, i) => i !== ci),
    }));
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await confirmParseResult(restaurantId, jobId, result);
      router.push(`/admin/${restaurantId}/menu`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Review and edit the parsed menu before importing.
        </p>
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Confirm & import"}
        </button>
      </div>

      {result.categories.map((cat, ci) => (
        <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center gap-2">
            <input
              value={cat.name}
              onChange={(e) => updateCategoryName(ci, e.target.value)}
              className="font-semibold bg-transparent focus:outline-none flex-1"
            />
            <button
              onClick={() => deleteCategory(ci)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Delete category
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {cat.items.map((item, ii) => (
              <div key={ii} className="px-4 py-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(ci, ii, "name", e.target.value)}
                    className={`font-medium flex-1 border rounded px-2 py-1 ${
                      item.name === "UNRECOGNIZED" ? "border-amber-400 bg-amber-50" : "border-gray-200"
                    }`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.price ?? ""}
                    onChange={(e) => updateItem(ci, ii, "price", e.target.value)}
                    placeholder="Price"
                    className="w-24 border border-gray-200 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => deleteItem(ci, ii)}
                    className="text-red-400 px-2"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={item.description ?? ""}
                  onChange={(e) => updateItem(ci, ii, "description", e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                />
                {item.variants?.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Variants: {item.variants.map((v) => `${v.name} $${v.price}`).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => addItem(ci)}
            className="w-full py-2 text-sm text-orange-600 hover:bg-orange-50"
          >
            + Add item
          </button>
        </div>
      ))}
    </div>
  );
}
