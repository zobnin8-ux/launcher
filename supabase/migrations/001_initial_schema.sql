-- Restaurant Launch Kit — initial schema with RLS

-- Restaurants
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  slug text not null unique,
  cuisine text,
  address text,
  phone text,
  email text,
  website text,
  hours jsonb default '{}',
  default_locale text not null default 'en',
  locales text[] not null default '{en}',
  currency text not null default 'USD',
  theme jsonb default '{}',
  logo_url text,
  is_published boolean not null default false,
  created_at timestamptz default now()
);

-- Menus
create table menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references menus(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0
);

create table items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2),
  variants jsonb default '[]',
  photo_url text,
  allergens text[] default '{}',
  tags text[] default '{}',
  is_available boolean not null default true,
  sort_order int not null default 0
);

-- Translations (polymorphic i18n)
create table translations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  locale text not null,
  field text not null,
  value text not null,
  unique (entity_type, entity_id, locale, field)
);

-- Media
create table media (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  entity_type text,
  entity_id uuid,
  file_url text not null,
  file_type text not null,
  created_at timestamptz default now()
);

-- QR codes
create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  target_url text not null,
  file_url text not null,
  svg_url text,
  created_at timestamptz default now()
);

-- AI parse jobs
create table parse_jobs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  source_file_url text not null,
  status text not null default 'pending',
  result jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Analytics events
create table events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index idx_menus_restaurant on menus(restaurant_id);
create index idx_categories_menu on categories(menu_id);
create index idx_items_category on items(category_id);
create index idx_translations_entity on translations(entity_type, entity_id);
create index idx_events_restaurant on events(restaurant_id, created_at);
create index idx_parse_jobs_restaurant on parse_jobs(restaurant_id);

-- RLS: restaurants
alter table restaurants enable row level security;

create policy "public read published restaurants"
  on restaurants for select
  using (is_published = true or owner_id = auth.uid());

create policy "owner full access restaurants"
  on restaurants for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- RLS: menus
alter table menus enable row level security;

create policy "public read published menus"
  on menus for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = menus.restaurant_id
      and (r.is_published = true or r.owner_id = auth.uid())
    )
  );

create policy "owner write menus"
  on menus for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = menus.restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = menus.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- RLS: categories
alter table categories enable row level security;

create policy "public read published categories"
  on categories for select
  using (
    exists (
      select 1 from menus m
      join restaurants r on r.id = m.restaurant_id
      where m.id = categories.menu_id
      and (r.is_published = true or r.owner_id = auth.uid())
    )
  );

create policy "owner write categories"
  on categories for all
  using (
    exists (
      select 1 from menus m
      join restaurants r on r.id = m.restaurant_id
      where m.id = categories.menu_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from menus m
      join restaurants r on r.id = m.restaurant_id
      where m.id = categories.menu_id and r.owner_id = auth.uid()
    )
  );

-- RLS: items
alter table items enable row level security;

create policy "public read published items"
  on items for select
  using (
    exists (
      select 1 from categories c
      join menus m on m.id = c.menu_id
      join restaurants r on r.id = m.restaurant_id
      where c.id = items.category_id
      and (r.is_published = true or r.owner_id = auth.uid())
    )
  );

create policy "owner write items"
  on items for all
  using (
    exists (
      select 1 from categories c
      join menus m on m.id = c.menu_id
      join restaurants r on r.id = m.restaurant_id
      where c.id = items.category_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from categories c
      join menus m on m.id = c.menu_id
      join restaurants r on r.id = m.restaurant_id
      where c.id = items.category_id and r.owner_id = auth.uid()
    )
  );

-- RLS: translations
alter table translations enable row level security;

create policy "public read published translations"
  on translations for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = translations.restaurant_id
      and (r.is_published = true or r.owner_id = auth.uid())
    )
  );

create policy "owner write translations"
  on translations for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = translations.restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = translations.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- RLS: media
alter table media enable row level security;

create policy "public read published media"
  on media for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = media.restaurant_id
      and (r.is_published = true or r.owner_id = auth.uid())
    )
  );

create policy "owner write media"
  on media for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = media.restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = media.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- RLS: qr_codes
alter table qr_codes enable row level security;

create policy "public read published qr_codes"
  on qr_codes for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = qr_codes.restaurant_id
      and (r.is_published = true or r.owner_id = auth.uid())
    )
  );

create policy "owner write qr_codes"
  on qr_codes for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = qr_codes.restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = qr_codes.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- RLS: parse_jobs
alter table parse_jobs enable row level security;

create policy "owner read parse_jobs"
  on parse_jobs for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = parse_jobs.restaurant_id and r.owner_id = auth.uid()
    )
  );

create policy "owner write parse_jobs"
  on parse_jobs for all
  using (
    exists (
      select 1 from restaurants r
      where r.id = parse_jobs.restaurant_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurants r
      where r.id = parse_jobs.restaurant_id and r.owner_id = auth.uid()
    )
  );

-- RLS: events (anonymous insert, owner select)
alter table events enable row level security;

create policy "anyone insert events"
  on events for insert
  with check (true);

create policy "owner read events"
  on events for select
  using (
    exists (
      select 1 from restaurants r
      where r.id = events.restaurant_id and r.owner_id = auth.uid()
    )
  );
