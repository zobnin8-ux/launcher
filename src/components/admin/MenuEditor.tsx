"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  moveCategory,
  moveItem,
  updateCategory,
  updateItem,
  uploadItemPhoto,
} from "@/actions/menu";
import type { MenuWithCategories } from "@/lib/types/database";
import { formatItemPrice } from "@/lib/utils/format-price";

export function MenuEditor({
  restaurantId,
  restaurantSlug,
  currency,
  initialMenus,
}: {
  restaurantId: string;
  restaurantSlug: string;
  currency: string;
  initialMenus: MenuWithCategories[];
}) {
  const [menus] = useState(initialMenus);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseStatus, setParseStatus] = useState<string>("");
  const [suggestions, setSuggestions] = useState<{ id: string; description: string }[]>([]);
  const [improveLoading, setImproveLoading] = useState(false);
  const [improveStatus, setImproveStatus] = useState<string>("");
  const router = useRouter();

  const menu = menus[0];
  if (!menu) return <p className="text-gray-500">No menu found.</p>;

  async function handleAddCategory() {
    const name = prompt("Category name");
    if (!name) return;
    await createCategory(menu.id, restaurantId, name);
    router.refresh();
  }

  async function handleAddItem(categoryId: string) {
    const name = prompt("Item name");
    if (!name) return;
    const priceStr = prompt("Price (leave empty for variants later)");
    const price = priceStr ? parseFloat(priceStr) : null;
    await createItem(categoryId, restaurantId, { name, price });
    router.refresh();
  }

  async function handleParseUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 32 * 1024 * 1024) {
      setParseStatus("File too large. Max 32 MB for PDF, 10 MB for photos.");
      return;
    }

    setParseLoading(true);
    setParseStatus(`Uploading ${file.name}…`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("restaurantId", restaurantId);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch("/api/parse-menu", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const raw = await res.text();
      let data: { jobId?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setParseStatus(`Upload failed (${res.status}). ${raw.slice(0, 120)}`);
        setParseLoading(false);
        return;
      }

      if (!res.ok) {
        setParseStatus(data.error ?? `Upload failed (${res.status})`);
        setParseLoading(false);
        return;
      }

      if (!data.jobId) {
        setParseStatus("Upload failed: no job id returned");
        setParseLoading(false);
        return;
      }

      setParseStatus("AI is reading your menu… (30–90 sec, keep this tab open)");

      const processController = new AbortController();
      const processTimeout = setTimeout(() => processController.abort(), 120000);

      try {
        const processRes = await fetch(`/api/parse-menu/${data.jobId}/process`, {
          method: "POST",
          signal: processController.signal,
        });
        const processData = await processRes.json();

        if (!processRes.ok) {
          setParseStatus(processData.error ?? "Parsing failed");
          return;
        }

        router.push(`/admin/${restaurantId}/menu/review/${data.jobId}`);
      } catch (processErr) {
        setParseStatus(
          processErr instanceof Error && processErr.name === "AbortError"
            ? "AI parsing timed out. Try a smaller/clearer photo, or add items manually."
            : "Parsing failed. Try again."
        );
      } finally {
        clearTimeout(processTimeout);
        setParseLoading(false);
      }
    } catch (err) {
      setParseLoading(false);
      setParseStatus(
        err instanceof Error && err.name === "AbortError"
          ? "Upload timed out. Try a smaller photo or check your connection."
          : "Upload failed. Try again."
      );
    } finally {
      clearTimeout(timeout);
      e.target.value = "";
    }
  }

  async function handleImproveDescriptions() {
    const allItems = menu.categories.flatMap((c) =>
      c.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        tags: i.tags,
      }))
    );

    if (allItems.length === 0) {
      setImproveStatus("No menu items yet. Add dishes first.");
      return;
    }

    setImproveLoading(true);
    setImproveStatus("AI is writing descriptions… (10–30 sec)");
    setSuggestions([]);

    try {
      const res = await fetch("/api/improve-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, items: allItems }),
      });
      const data = await res.json();

      if (!res.ok) {
        setImproveStatus(data.error ?? "Failed to improve descriptions");
        return;
      }

      const next = data.suggestions ?? [];
      setSuggestions(next);
      setImproveStatus(
        next.length > 0
          ? `${next.length} suggestion${next.length === 1 ? "" : "s"} — review below`
          : "No suggestions returned. Try again."
      );
    } catch {
      setImproveStatus("Request failed. Try again.");
    } finally {
      setImproveLoading(false);
    }
  }

  async function applySuggestion(id: string, description: string) {
    await updateItem(id, restaurantId, { description });
    setSuggestions((s) => s.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {parseStatus && parseLoading && (
        <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          {parseStatus}
        </p>
      )}
      {parseStatus && !parseLoading && parseStatus !== "Upload menu (PDF/photo)" && (
        <p className="text-sm text-red-600">{parseStatus}</p>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <a
          href={`/m/${restaurantSlug}/menu`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Preview as guest
        </a>
        <label className="px-4 py-2 bg-orange-600 text-white rounded-lg cursor-pointer hover:bg-orange-700 text-sm font-medium">
          {parseLoading ? parseStatus : "Upload menu (PDF/photo)"}
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            disabled={parseLoading}
            onChange={handleParseUpload}
          />
        </label>
        <button
          onClick={handleAddCategory}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Add category
        </button>
        <button
          onClick={handleImproveDescriptions}
          disabled={improveLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {improveLoading ? "Improving…" : "Improve descriptions"}
        </button>
      </div>

      {improveStatus && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            improveStatus.includes("Failed") ||
            improveStatus.includes("failed") ||
            improveStatus.includes("No menu items")
              ? "text-red-700 bg-red-50 border border-red-200"
              : "text-amber-800 bg-amber-50 border border-amber-200"
          }`}
        >
          {improveStatus}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
          <p className="font-medium text-amber-900">Suggested descriptions</p>
          {suggestions.map((s) => {
            const item = menu.categories.flatMap((c) => c.items).find((i) => i.id === s.id);
            return (
              <div key={s.id} className="bg-white rounded p-3 text-sm">
                <p className="font-medium">{item?.name}</p>
                <p className="text-gray-600 mt-1">{s.description}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => applySuggestion(s.id, s.description)}
                    className="px-3 py-1 bg-orange-600 text-white rounded text-xs"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setSuggestions((x) => x.filter((i) => i.id !== s.id))}
                    className="px-3 py-1 border rounded text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {menu.categories.map((cat) => (
        <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
            <input
              defaultValue={cat.name}
              onBlur={(e) => updateCategory(cat.id, restaurantId, { name: e.target.value })}
              className="font-semibold bg-transparent focus:outline-none flex-1"
            />
            <div className="flex gap-1">
              <button onClick={() => moveCategory(cat.id, restaurantId, "up")} className="p-1 text-gray-400 hover:text-gray-600">↑</button>
              <button onClick={() => moveCategory(cat.id, restaurantId, "down")} className="p-1 text-gray-400 hover:text-gray-600">↓</button>
              <button onClick={() => deleteCategory(cat.id, restaurantId).then(() => router.refresh())} className="p-1 text-red-400 hover:text-red-600 ml-2">×</button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {cat.items.map((item) => (
              <div key={item.id} className="px-4 py-3 flex gap-3 items-start">
                {item.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <label className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 cursor-pointer shrink-0">
                    Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const fd = new FormData();
                        fd.append("file", f);
                        await uploadItemPhoto(item.id, restaurantId, fd);
                        router.refresh();
                      }}
                    />
                  </label>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={item.name}
                      onBlur={(e) => updateItem(item.id, restaurantId, { name: e.target.value })}
                      className="font-medium bg-transparent focus:outline-none flex-1"
                    />
                    <span className="text-sm text-orange-600 shrink-0">
                      {formatItemPrice(item, currency)}
                    </span>
                  </div>
                  <input
                    defaultValue={item.description ?? ""}
                    placeholder="Description"
                    onBlur={(e) => updateItem(item.id, restaurantId, { description: e.target.value || null })}
                    className="text-sm text-gray-500 bg-transparent focus:outline-none w-full"
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        defaultChecked={item.is_available}
                        onChange={(e) => updateItem(item.id, restaurantId, { is_available: e.target.checked })}
                      />
                      Available
                    </label>
                    <button onClick={() => moveItem(item.id, restaurantId, "up")} className="text-gray-400">↑</button>
                    <button onClick={() => moveItem(item.id, restaurantId, "down")} className="text-gray-400">↓</button>
                    <button
                      onClick={() => deleteItem(item.id, restaurantId).then(() => router.refresh())}
                      className="text-red-400 ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleAddItem(cat.id)}
            className="w-full py-2 text-sm text-orange-600 hover:bg-orange-50"
          >
            + Add item
          </button>
        </div>
      ))}

      {menu.categories.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No categories yet. Add one manually or upload a menu file.
        </p>
      )}
    </div>
  );
}
