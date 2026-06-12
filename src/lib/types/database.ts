export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface HoursDay {
  open: string;
  close: string;
}

export type Hours = Record<string, HoursDay>;

export interface Theme {
  primary?: string;
  bg?: string;
  font?: string;
  mode?: "light" | "dark";
}

export interface ItemVariant {
  name: string;
  price: number;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  cuisine: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: Hours;
  default_locale: string;
  locales: string[];
  currency: string;
  theme: Theme;
  logo_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Menu {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  menu_id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface Item {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  variants: ItemVariant[];
  photo_url: string | null;
  allergens: string[];
  tags: string[];
  is_available: boolean;
  sort_order: number;
}

export interface Translation {
  id: string;
  restaurant_id: string;
  entity_type: "category" | "item" | "menu" | "restaurant";
  entity_id: string;
  locale: string;
  field: string;
  value: string;
}

export interface Media {
  id: string;
  restaurant_id: string;
  entity_type: string | null;
  entity_id: string | null;
  file_url: string;
  file_type: "photo" | "logo" | "menu_scan";
  created_at: string;
}

export interface QrCode {
  id: string;
  restaurant_id: string;
  target_url: string;
  file_url: string;
  svg_url: string | null;
  created_at: string;
}

export type ParseJobStatus = "pending" | "processing" | "done" | "error";

export interface ParsedMenuItem {
  name: string;
  description?: string;
  price: number | null;
  variants: ItemVariant[];
  tags?: string[];
}

export interface ParsedCategory {
  name: string;
  description?: string;
  items: ParsedMenuItem[];
}

export interface ParseResult {
  categories: ParsedCategory[];
}

export interface ParseJob {
  id: string;
  restaurant_id: string;
  source_file_url: string;
  status: ParseJobStatus;
  result: ParseResult | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type EventType = "menu_view" | "item_view" | "qr_scan";

export interface AnalyticsEvent {
  id: string;
  restaurant_id: string;
  event_type: EventType;
  metadata: Json;
  created_at: string;
}

export interface CategoryWithItems extends Category {
  items: Item[];
}

export interface MenuWithCategories extends Menu {
  categories: CategoryWithItems[];
}

export interface RestaurantWithMenu extends Restaurant {
  menus: MenuWithCategories[];
}
