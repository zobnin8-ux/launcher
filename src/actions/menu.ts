"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { revalidateRestaurant } from "@/lib/data/restaurants";
import type { ItemVariant, ParseResult } from "@/lib/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

async function getRestaurantSlug(supabase: Awaited<ReturnType<typeof createClient>>, restaurantId: string) {
  const { data } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", restaurantId)
    .single();
  return data?.slug;
}

export async function ensureDefaultMenu(restaurantId: string) {
  const { supabase } = await requireUser();
  const { data: menus } = await supabase
    .from("menus")
    .select("id")
    .eq("restaurant_id", restaurantId);

  if (!menus?.length) {
    await supabase.from("menus").insert({
      restaurant_id: restaurantId,
      name: "Main Menu",
      sort_order: 0,
    });
  }
}

export async function createCategory(menuId: string, restaurantId: string, name: string) {
  const { supabase } = await requireUser();

  const { data: cats } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("menu_id", menuId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = (cats?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("categories")
    .insert({ menu_id: menuId, name, sort_order: sortOrder })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
  return data;
}

export async function updateCategory(
  categoryId: string,
  restaurantId: string,
  data: { name?: string; description?: string | null }
) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").update(data).eq("id", categoryId);
  if (error) throw new Error(error.message);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
}

export async function deleteCategory(categoryId: string, restaurantId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw new Error(error.message);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
}

export async function moveCategory(
  categoryId: string,
  restaurantId: string,
  direction: "up" | "down"
) {
  const { supabase } = await requireUser();
  const { data: cat } = await supabase
    .from("categories")
    .select("*, menus!inner(restaurant_id)")
    .eq("id", categoryId)
    .single();

  if (!cat) return;

  const { data: siblings } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("menu_id", cat.menu_id)
    .order("sort_order");

  const idx = (siblings ?? []).findIndex((s) => s.id === categoryId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= (siblings?.length ?? 0)) return;

  const other = siblings![swapIdx];
  await supabase.from("categories").update({ sort_order: other.sort_order }).eq("id", categoryId);
  await supabase.from("categories").update({ sort_order: cat.sort_order }).eq("id", other.id);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
}

export async function createItem(
  categoryId: string,
  restaurantId: string,
  data: {
    name: string;
    description?: string;
    price?: number | null;
    variants?: ItemVariant[];
    tags?: string[];
  }
) {
  const { supabase } = await requireUser();

  const { data: items } = await supabase
    .from("items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = (items?.[0]?.sort_order ?? -1) + 1;

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      category_id: categoryId,
      name: data.name,
      description: data.description ?? null,
      price: data.price ?? null,
      variants: data.variants ?? [],
      tags: data.tags ?? [],
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
  return item;
}

export async function updateItem(
  itemId: string,
  restaurantId: string,
  data: Partial<{
    name: string;
    description: string | null;
    price: number | null;
    variants: ItemVariant[];
    tags: string[];
    is_available: boolean;
    photo_url: string | null;
  }>
) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("items").update(data).eq("id", itemId);
  if (error) throw new Error(error.message);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
}

export async function deleteItem(itemId: string, restaurantId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
}

export async function moveItem(
  itemId: string,
  restaurantId: string,
  direction: "up" | "down"
) {
  const { supabase } = await requireUser();
  const { data: item } = await supabase
    .from("items")
    .select("id, category_id, sort_order")
    .eq("id", itemId)
    .single();

  if (!item) return;

  const { data: siblings } = await supabase
    .from("items")
    .select("id, sort_order")
    .eq("category_id", item.category_id)
    .order("sort_order");

  const idx = (siblings ?? []).findIndex((s) => s.id === itemId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= (siblings?.length ?? 0)) return;

  const other = siblings![swapIdx];
  await supabase.from("items").update({ sort_order: other.sort_order }).eq("id", itemId);
  await supabase.from("items").update({ sort_order: item.sort_order }).eq("id", other.id);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
}

export async function uploadItemPhoto(
  itemId: string,
  restaurantId: string,
  formData: FormData
) {
  const { supabase, user } = await requireUser();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file");

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${restaurantId}/${itemId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("dish-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("dish-photos").getPublicUrl(path);

  return updateItem(itemId, restaurantId, { photo_url: publicUrl });
}

export async function confirmParseResult(
  restaurantId: string,
  jobId: string,
  result: ParseResult
) {
  const { supabase } = await requireUser();

  const { data: menus } = await supabase
    .from("menus")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .order("sort_order")
    .limit(1);

  let menuId = menus?.[0]?.id;
  if (!menuId) {
    const { data: menu } = await supabase
      .from("menus")
      .insert({ restaurant_id: restaurantId, name: "Main Menu", sort_order: 0 })
      .select("id")
      .single();
    menuId = menu!.id;
  }

  for (let ci = 0; ci < result.categories.length; ci++) {
    const cat = result.categories[ci];
    const { data: category } = await supabase
      .from("categories")
      .insert({
        menu_id: menuId,
        name: cat.name,
        description: cat.description ?? null,
        sort_order: ci,
      })
      .select()
      .single();

    if (!category) continue;

    for (let ii = 0; ii < cat.items.length; ii++) {
      const item = cat.items[ii];
      await supabase.from("items").insert({
        category_id: category.id,
        name: item.name,
        description: item.description ?? null,
        price: item.price,
        variants: item.variants ?? [],
        tags: item.tags ?? [],
        sort_order: ii,
      });
    }
  }

  await supabase
    .from("parse_jobs")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  const slug = await getRestaurantSlug(supabase, restaurantId);
  if (slug) revalidateRestaurant(slug);
  revalidatePath(`/admin/${restaurantId}/menu`);
}
