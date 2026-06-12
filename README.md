# Restaurant Launch Kit

Turn restaurant data (questionnaire, PDF/photo menu, dish photos) into a live menu website with QR code and admin panel.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Postgres, Auth, Storage, RLS)
- **Anthropic Claude** (menu parsing, translations, descriptions)
- **Tailwind CSS**

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Supabase migrations

Apply migrations from `supabase/migrations/` to your Supabase project (via Supabase CLI or SQL editor):

1. `001_initial_schema.sql` — tables + RLS policies
2. `002_storage_buckets.sql` — storage buckets + policies

### 4. Enable Auth providers

In Supabase Dashboard → Authentication:

- Enable **Email** (magic link)
- Enable **Google OAuth** (optional)

Set redirect URL: `{APP_URL}/auth/callback`

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

### Public

| Route | Description |
|-------|-------------|
| `/` | Service landing page |
| `/m/[slug]` | Restaurant home |
| `/m/[slug]/menu` | Menu (`?lang=` for locale, `?src=qr` for analytics) |
| `/m/[slug]/item/[itemId]` | Dish detail |
| `/m/[slug]/contacts` | Contact & map link |

### Admin

| Route | Description |
|-------|-------------|
| `/login` | Sign in (magic link + Google) |
| `/admin` | Restaurant list |
| `/admin/new` | Create restaurant wizard |
| `/admin/[id]` | Dashboard + analytics |
| `/admin/[id]/menu` | Menu editor |
| `/admin/[id]/menu/review/[jobId]` | Review AI-parsed menu |
| `/admin/[id]/qr` | QR code generation |
| `/admin/[id]/settings` | Settings, theme, publishing |

### API

| Route | Description |
|-------|-------------|
| `POST /api/parse-menu` | Upload menu file, start async parsing |
| `GET /api/parse-menu/[jobId]` | Poll parse job status |
| `POST /api/translate` | Translate menu to configured locales |
| `POST /api/generate-qr` | Generate QR PNG + SVG |
| `POST /api/track` | Record analytics event |
| `POST /api/improve-descriptions` | AI description suggestions |

## Deploy (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Set `NEXT_PUBLIC_APP_URL` to production URL

## Architecture notes

- **Menu is structured data** — site, QR, and exports are derived from DB
- **i18n via `translations` table** — no locale column on menus
- **Parse jobs run async** — upload returns immediately, client polls every 3s
- **ISR** — public pages use `revalidate` + `revalidateTag` on admin mutations
