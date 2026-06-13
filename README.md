# Restaurant Launch Kit

Turn restaurant data (questionnaire, PDF/photo menu, dish photos) into a **print-style menu website** with QR code and admin panel.

**Production:** https://launcher-black.vercel.app  
**Product status (Obsidian / revision doc):** [`docs/PRODUCT_STATUS.md`](docs/PRODUCT_STATUS.md)

## What it is

- **Not** a Wix/Tilda site builder
- **Is** structured menu + AI import + admin + mobile public pages that look like a printed restaurant menu (dot leaders, typography, cover photo)

## Stack

- **Next.js 14** (App Router, TypeScript, Server Components)
- **Supabase** (Postgres, Auth, Storage, RLS)
- **Anthropic Claude** (menu parsing, translations, descriptions)
- **Tailwind CSS** + custom public design tokens
- **Fonts (public):** Fraunces + Schibsted Grotesk via `next/font`

> **Removed:** `sharp`, `pdf-lib` — PDF is sent to Claude document API directly.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_DEV_APP_URL=http://localhost:3000
```

On Vercel (Production only):

```
NEXT_PUBLIC_PROD_APP_URL=https://your-domain.vercel.app
```

### 3. Run Supabase migrations

Apply in order (Supabase CLI or SQL editor):

1. `001_initial_schema.sql` — tables + RLS
2. `002_storage_buckets.sql` — `logos`, `dish-photos`, `menu-scans`, `qr-codes`
3. `003_cover_url.sql` — `restaurants.cover_url` + `covers` bucket

### 4. Auth (Supabase Dashboard)

- Enable **Email** (magic link)
- Redirect URLs: `{APP_URL}/auth/confirm`, `{APP_URL}/auth/callback`

### 5. Dev server

```bash
npm run dev
```

Open http://localhost:3000

## Routes

### Public (`/m/[slug]/*`)

| Route | Description |
|-------|-------------|
| `/m/[slug]` | Cover page — logo, hours status, **View menu** |
| `/m/[slug]/menu` | Print-style menu — dot leaders, category nav, sticky header |
| `/m/[slug]/item/[itemId]` | Dish detail (photo and/or long description only) |
| `/m/[slug]/contacts` | Address, phone, email, hours table |

Query params:
- `?lang=xx` — locale (preserved across navigation)
- `?src=qr` — QR scan analytics

Published restaurants are public. **Owners** can preview their own unpublished site when logged in (RLS).

### Admin

| Route | Description |
|-------|-------------|
| `/login` | Magic link sign-in |
| `/admin` | Restaurant list |
| `/admin/new` | Create restaurant (slug live-check) |
| `/admin/[id]` | Dashboard + analytics |
| `/admin/[id]/menu` | Menu editor + **Preview as guest** |
| `/admin/[id]/menu/review/[jobId]` | Review AI-parsed menu |
| `/admin/[id]/qr` | QR generation |
| `/admin/[id]/settings` | Contacts, theme, cover photo, publishing |

### API

| Route | Description |
|-------|-------------|
| `POST /api/parse-menu` | Upload menu file → jobId |
| `GET /api/parse-menu/[jobId]` | Poll job status |
| `POST /api/parse-menu/[jobId]/process` | AI parsing (max **60s** on Hobby) |
| `GET /api/slug/check` | Slug availability |
| `POST /api/translate` | Translate menu |
| `POST /api/generate-qr` | QR PNG + SVG |
| `POST /api/track` | Analytics events |
| `POST /api/improve-descriptions` | AI description suggestions |

## Public design

Design tokens on public layout (`--color-bg`, `--color-accent`, etc.). Restaurant theme (`theme.primary`, `theme.mode`) merges into tokens.

- **Signature pattern:** dish row with dot leaders — name … price (tabular nums)
- **No** shadow cards, emoji placeholders, or gradient buttons on menu
- **Cover photo:** `cover_url` in Settings → full-screen home hero
- **Dark mode:** auto-lightened accent for contrast

Key files:

```
src/app/m/[slug]/layout.tsx      # fonts
src/app/m/public-menu.css        # print-menu styles
src/lib/utils/public-theme.ts    # CSS variables
src/components/public/MenuItemRow.tsx
src/components/public/CategoryNav.tsx
```

## Deploy (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set env vars (see Setup)
4. Apply Supabase migration `003_cover_url.sql` before using cover photos

## Architecture notes

- **Menu is structured data** — site, QR, and exports derive from DB
- **i18n** via `translations` table + `?lang=`
- **Parse jobs** — upload returns jobId; client calls `/process`; stale jobs (>10 min) auto-fail
- **Public pages** — `dynamic = force-dynamic`, anon Supabase client (no cookies)
- **Revalidation** — admin mutations call `revalidateTag('restaurant-{slug}')`

## Sprints completed

| Sprint | Focus |
|--------|-------|
| **Стабилизация** | Fix `/m/[slug]` 500, PDF without sharp, slug picker, onboarding |
| **Визуал** | Print-menu UI, cover photo, fonts, owner preview, remove emoji placeholders |

See [`docs/PRODUCT_STATUS.md`](docs/PRODUCT_STATUS.md) for full checklist, known limits, and backlog.

## Vercel timeouts

Hobby: `maxDuration: 60` in `vercel.json`. Pro: raise to 300 for large PDF menus.
