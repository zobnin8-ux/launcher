import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/ai/parse-menu";
import { translateTexts } from "@/lib/ai/translate";
import { revalidateRestaurant } from "@/lib/data/restaurants";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { restaurantId } = await request.json();
  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .single();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const targetLocales = (restaurant.locales as string[]).filter(
    (l) => l !== restaurant.default_locale
  );

  if (!targetLocales.length) {
    return NextResponse.json({ message: "No additional locales configured" });
  }

  const { data: menus } = await supabase
    .from("menus")
    .select("id, name")
    .eq("restaurant_id", restaurantId);

  const menuIds = (menus ?? []).map((m) => m.id);
  const { data: categories } = menuIds.length
    ? await supabase.from("categories").select("id, name, description").in("menu_id", menuIds)
    : { data: [] };

  const categoryIds = (categories ?? []).map((c) => c.id);
  const { data: items } = categoryIds.length
    ? await supabase.from("items").select("id, name, description").in("category_id", categoryIds)
    : { data: [] };

  const texts: { key: string; text: string; field: string; entity_type: string; entity_id: string }[] = [];

  for (const menu of menus ?? []) {
    texts.push({
      key: menu.id,
      entity_type: "menu",
      entity_id: menu.id,
      field: "name",
      text: menu.name,
    });
  }

  for (const cat of categories ?? []) {
    texts.push({
      key: cat.id,
      entity_type: "category",
      entity_id: cat.id,
      field: "name",
      text: cat.name,
    });
    if (cat.description) {
      texts.push({
        key: `${cat.id}-desc`,
        entity_type: "category",
        entity_id: cat.id,
        field: "description",
        text: cat.description,
      });
    }
  }

  for (const item of items ?? []) {
    texts.push({
      key: item.id,
      entity_type: "item",
      entity_id: item.id,
      field: "name",
      text: item.name,
    });
    if (item.description) {
      texts.push({
        key: `${item.id}-desc`,
        entity_type: "item",
        entity_id: item.id,
        field: "description",
        text: item.description,
      });
    }
  }

  const translated = await withRetry(() =>
    translateTexts(
      texts.map((t) => ({ key: t.key, text: t.text, field: t.field })),
      targetLocales,
      restaurant.default_locale
    )
  );

  for (const row of translated) {
    const source = texts.find((t) => t.key === row.key && t.field === row.field);
    if (!source) continue;

    await supabase.from("translations").upsert(
      {
        restaurant_id: restaurantId,
        entity_type: source.entity_type,
        entity_id: source.entity_id,
        locale: row.locale,
        field: row.field,
        value: row.value,
      },
      { onConflict: "entity_type,entity_id,locale,field" }
    );
  }

  revalidateRestaurant(restaurant.slug);

  return NextResponse.json({ translated: translated.length });
}
