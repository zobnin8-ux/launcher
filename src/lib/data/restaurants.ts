import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Category,
  CategoryWithItems,
  Item,
  Menu,
  MenuWithCategories,
  ParseResult,
  Restaurant,
  RestaurantWithMenu,
  Translation,
} from "@/lib/types/database";
import { applyTranslations } from "@/lib/utils/translations";

export function revalidateRestaurant(slug: string) {
  revalidateTag(`restaurant-${slug}`);
}

export async function getOwnerRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Restaurant[];
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Restaurant;
}

export async function getPublishedRestaurantBySlug(
  slug: string
): Promise<Restaurant | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data as Restaurant;
}

async function getOwnerRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .single();

  if (error) return null;
  return data as Restaurant;
}

async function getRestaurantForPublicView(
  slug: string
): Promise<{ restaurant: Restaurant; useAuthClient: boolean } | null> {
  const published = await getPublishedRestaurantBySlug(slug);
  if (published) return { restaurant: published, useAuthClient: false };

  const owned = await getOwnerRestaurantBySlug(slug);
  if (owned) return { restaurant: owned, useAuthClient: true };

  return null;
}

async function getMenuTree(
  restaurantId: string,
  useAuthClient: boolean
): Promise<MenuWithCategories[]> {
  const supabase = useAuthClient ? await createClient() : createPublicClient();

  const { data: menus } = await supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order");

  if (!menus?.length) return [];

  const menuIds = menus.map((m) => m.id);
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .in("menu_id", menuIds)
    .order("sort_order");

  const categoryIds = (categories ?? []).map((c) => c.id);
  const { data: items } = categoryIds.length
    ? await supabase
        .from("items")
        .select("*")
        .in("category_id", categoryIds)
        .order("sort_order")
    : { data: [] as Item[] };

  return (menus as Menu[]).map((menu) => ({
    ...menu,
    categories: ((categories ?? []) as Category[])
      .filter((c) => c.menu_id === menu.id)
      .map((cat) => ({
        ...cat,
        items: ((items ?? []) as Item[]).filter((i) => i.category_id === cat.id),
      })),
  }));
}

export async function getPublishedRestaurantWithMenu(
  slug: string,
  locale?: string
): Promise<RestaurantWithMenu | null> {
  const view = await getRestaurantForPublicView(slug);
  if (!view) return null;

  const { restaurant, useAuthClient } = view;
  const menus = await getMenuTree(restaurant.id, useAuthClient);
  const effectiveLocale = locale ?? restaurant.default_locale;

  const filterAvailable = (tree: MenuWithCategories[]) =>
    tree.map((menu) => ({
      ...menu,
      categories: menu.categories.map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => i.is_available),
      })),
    }));

  if (effectiveLocale === restaurant.default_locale) {
    return {
      ...restaurant,
      menus: filterAvailable(menus),
    };
  }

  const supabase = createPublicClient();
  const { data: translations } = await supabase
    .from("translations")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("locale", effectiveLocale);

  const tr = (translations ?? []) as Translation[];

  const translatedMenus = menus.map((menu) => ({
    ...applyTranslations(menu, tr, effectiveLocale),
    categories: menu.categories.map((cat) => ({
      ...applyTranslations(cat, tr, effectiveLocale),
      items: cat.items
        .filter((i) => i.is_available)
        .map((item) => applyTranslations(item, tr, effectiveLocale)),
    })),
  }));

  return {
    ...applyTranslations(restaurant, tr, effectiveLocale),
    menus: translatedMenus,
  };
}

export async function getItemById(
  slug: string,
  itemId: string,
  locale?: string
): Promise<{ restaurant: Restaurant; item: Item; category: Category } | null> {
  const data = await getPublishedRestaurantWithMenu(slug, locale);
  if (!data) return null;

  for (const menu of data.menus) {
    for (const cat of menu.categories) {
      const item = cat.items.find((i) => i.id === itemId);
      if (item) {
        return { restaurant: data, item, category: cat };
      }
    }
  }
  return null;
}

export async function getEventCounts(
  restaurantId: string,
  days: number
): Promise<{ menu_view: number; qr_scan: number; item_view: number }> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("events")
    .select("event_type")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", since.toISOString());

  const counts = { menu_view: 0, qr_scan: 0, item_view: 0 };
  for (const e of data ?? []) {
    if (e.event_type in counts) {
      counts[e.event_type as keyof typeof counts]++;
    }
  }
  return counts;
}

export async function verifyRestaurantOwner(
  restaurantId: string,
  userId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("restaurants")
    .select("owner_id")
    .eq("id", restaurantId)
    .single();

  return data?.owner_id === userId;
}

export async function getAdminMenuTree(
  restaurantId: string
): Promise<MenuWithCategories[]> {
  const supabase = await createClient();
  const { data: menus } = await supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order");

  if (!menus?.length) return [];

  const menuIds = menus.map((m) => m.id);
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .in("menu_id", menuIds)
    .order("sort_order");

  const categoryIds = (categories ?? []).map((c) => c.id);
  const { data: items } = categoryIds.length
    ? await supabase
        .from("items")
        .select("*")
        .in("category_id", categoryIds)
        .order("sort_order")
    : { data: [] as Item[] };

  return (menus as Menu[]).map((menu) => ({
    ...menu,
    categories: ((categories ?? []) as Category[])
      .filter((c) => c.menu_id === menu.id)
      .map((cat) => ({
        ...cat,
        items: ((items ?? []) as Item[]).filter((i) => i.category_id === cat.id),
      })),
  }));
}

export async function getParseJob(jobId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parse_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  return data;
}

export async function getLatestQrCode(restaurantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export type { ParseResult, CategoryWithItems };
