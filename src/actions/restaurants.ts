"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidateRestaurant } from "@/lib/data/restaurants";
import { uniqueSlug } from "@/lib/utils/slug";
import { DEFAULT_HOURS } from "@/lib/utils/hours";
import type { Hours, Theme } from "@/lib/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createRestaurant(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = formData.get("name") as string;
  const cuisine = (formData.get("cuisine") as string) || null;
  const address = (formData.get("address") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const currency = (formData.get("currency") as string) || "USD";
  const localesRaw = formData.get("locales") as string;
  const locales = localesRaw ? localesRaw.split(",").map((l) => l.trim()) : ["en"];

  const { data: existing } = await supabase.from("restaurants").select("slug");
  const slug = uniqueSlug(
    name,
    (existing ?? []).map((r) => r.slug)
  );

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name,
      slug,
      cuisine,
      address,
      phone,
      email,
      currency,
      locales,
      default_locale: locales[0],
      hours: DEFAULT_HOURS,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("menus").insert({
    restaurant_id: restaurant.id,
    name: "Main Menu",
    sort_order: 0,
  });

  redirect(`/admin/${restaurant.id}`);
}

export async function updateRestaurantSettings(
  restaurantId: string,
  data: {
    name?: string;
    cuisine?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    hours?: Hours;
    locales?: string[];
    default_locale?: string;
    currency?: string;
    theme?: Theme;
    is_published?: boolean;
    logo_url?: string | null;
  }
) {
  const { supabase } = await requireUser();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .update(data)
    .eq("id", restaurantId)
    .select("slug")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/${restaurantId}/settings`);
  revalidatePath(`/admin/${restaurantId}`);
  revalidateRestaurant(restaurant.slug);
  return restaurant;
}

export async function uploadLogo(restaurantId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${restaurantId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(path);

  return updateRestaurantSettings(restaurantId, { logo_url: publicUrl });
}
