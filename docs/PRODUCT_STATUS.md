---
project: Restaurant Launch Kit
tags: [mvp, launcher, product, obsidian]
updated: 2026-06-13
production: https://launcher-black.vercel.app
repo: https://github.com/zobnin8-ux/launcher
---

# Restaurant Launch Kit — состояние продукта (MVP)

> Документ для ревизии и Obsidian. Актуально на: **13 июня 2026** (после спринта «Визуал»).  
> Репозиторий: https://github.com/zobnin8-ux/launcher  
> Production: **https://launcher-black.vercel.app**  
> README: [`README.md`](../README.md)

---

## 1. Краткое резюме

**Restaurant Launch Kit** — MVP-сервис для владельцев ресторанов: загрузить меню (фото/PDF), распознать его через AI, отредактировать в админке и получить **мобильную публичную страницу меню** + **QR-код**.

**Это не** полноценный конструктор сайтов (Tilda/Wix).  
**Это** structured menu + admin + QR + **печатное меню в браузере** (типографика, dot leaders, обложка).

**Статус:** MVP **готов к показу первым клиентам**; публичная часть прошла спринт «Визуал» (июнь 2026).

| Ожидание заказчика | Реальность MVP |
|--------------------|----------------|
| Загрузил фото меню → готовый красивый сайт с картинками блюд | AI извлекает **текст**. Фото блюд — **вручную**; без фото — текстовая строка меню (не «дыра») |
| «Сайт ресторана» | Обложка + меню как печатное меню + контакты |
| Загрузил и забыл | Upload → review → import → **What's next** → publish → QR |

---

## 2. Деплой и инфраструктура

| Компонент | Значение |
|-----------|----------|
| Frontend + API | Vercel (Next.js 14 App Router) |
| БД, Auth, Storage | Supabase project `rducvwjvtwvryuwepzsv` |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Репозиторий | `zobnin8-ux/launcher` |

### Переменные окружения (Vercel Production)

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rducvwjvtwvryuwepzsv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon / publishable** ключ (не service role) |
| `SUPABASE_SERVICE_ROLE_KEY` | Загрузка в Storage, admin-операции |
| `ANTHROPIC_API_KEY` | Парсинг меню, описания, переводы |
| `NEXT_PUBLIC_PROD_APP_URL` | `https://launcher-black.vercel.app` |

Локально: `.env.local` + `NEXT_PUBLIC_DEV_APP_URL=http://localhost:3000`

### Supabase — миграции

1. `001_initial_schema.sql` — таблицы + RLS  
2. `002_storage_buckets.sql` — `logos`, `dish-photos`, `menu-scans`, `qr-codes`  
3. `003_cover_url.sql` — `restaurants.cover_url`, bucket `covers` ⚠️ **применить перед деплоем визуала**

### Auth

- **Magic link** (email) — основной способ входа  
- OTP-код в письме **не используется** (free tier без custom SMTP)  
- Redirect URLs: `{APP_URL}/auth/confirm`, `{APP_URL}/auth/callback`, `{APP_URL}/**`

### Vercel timeouts

| План | maxDuration AI routes |
|------|----------------------|
| **Hobby** (сейчас) | **60 сек** |
| Pro | до 300 сек |

---

## 3. Стек

- **Next.js 14.2** (App Router, TypeScript, Server Components, Server Actions)
- **Tailwind CSS** + `public-menu.css` (print-menu UI)
- **Supabase** — Postgres, Auth, Storage, RLS
- **Anthropic SDK** — vision (JPG/PNG), native PDF document blocks, text
- **qrcode** — генерация QR
- **Public fonts:** Fraunces (display) + Schibsted Grotesk (body) via `next/font`

**Удалено:** `sharp`, `pdf-lib`, emoji-плейсхолдеры (`DishPhotoPlaceholder`)

---

## 4. Маршруты

### Публичные

| URL | Описание | Статус |
|-----|----------|--------|
| `/` | Лендинг сервиса | ✅ |
| `/m/[slug]` | Обложка: cover photo или print-frame; Open until / Closed | ✅ |
| `/m/[slug]/menu` | Печатное меню: dot leaders, category nav, footer | ✅ |
| `/m/[slug]/item/[itemId]` | Деталь блюда (если фото или описание >100 символов) | ✅ |
| `/m/[slug]/contacts` | Контакты, часы (сегодня выделен), Google Maps link | ✅ |

Query: `?lang=xx`, `?src=qr`

**Publish:** `is_published = true` для анонимных гостей.  
**Owner preview:** владелец видит свой slug даже unpublished (RLS + auth client).

### Админка

| URL | Описание |
|-----|----------|
| `/admin/new` | Slug + live-check + preview URL |
| `/admin/[id]/menu` | Editor + **Preview as guest** (новая вкладка) |
| `/admin/[id]/settings` | Logo, **cover photo**, theme, publish |

---

## 5. API

| Endpoint | Описание |
|----------|----------|
| `POST /api/parse-menu` | Upload → jobId |
| `POST /api/parse-menu/[jobId]/process` | AI, max **60 сек** |
| `GET /api/slug/check` | Slug availability |
| `POST /api/improve-descriptions` | AI descriptions |
| `POST /api/translate` | Перевод меню |
| `POST /api/generate-qr` | PNG + SVG |
| `POST /api/track` | Аналитика |

Parse pipeline: Upload → Process (30–60 сек) → Review → Import → `/menu?imported=1`

---

## 6. Сценарии

### 6.1 Владелец

```
/login → /admin/new (slug) → Upload menu → Review → Import
→ Settings: cover, logo, theme, Published ✓
→ Menu editor → Preview as guest
→ QR → download
```

### 6.2 Гость

```
QR → /m/{slug}/menu
→ строки блюд (название … цена), категории-якоря
→ клик → /item/{id} только если фото или длинное описание
→ Home (обложка) / Contacts
```

---

## 7. AI — возможности и ограничения

### ✅ Реализовано

- Парсинг JPG/PNG (vision, ≤10 MB)
- Парсинг PDF (document API, ≤32 MB, без sharp)
- Improve descriptions, Translate
- Stale jobs > 10 min → error

### ❌ Не реализовано / REJECTED

- Crop фото блюд со scan — **REJECTED**
- Emoji-плейсхолдеры — **удалены** (спринт «Визуал»)
- WYSIWYG, бронирование, custom domains — backlog

---

## 8. Модель данных

```
restaurants (slug, is_published, theme, cover_url, logo_url, hours, locales)
  ├── menus → categories → items (price, variants, tags, photo_url)
  ├── parse_jobs, translations, qr_codes, events
```

Storage: `menu-scans` (private), `dish-photos`, `logos`, `covers`, `qr-codes` (public)

---

## 9. Публичный UI (после «Визуал»)

- **Токены:** `--color-bg`, `--color-accent`, `--color-rule`, …
- **Типографика:** Fraunces + Schibsted Grotesk (не Inter/Roboto)
- **Menu:** dot leaders, tabular-nums, sticky header, CategoryNav (IntersectionObserver)
- **Без фото:** текстовая строка — не плейсхолдер, не emoji
- **Home:** cover_url fullscreen + gradient overlay ИЛИ print-frame border
- **Theme:** light/dark; accent осветляется в dark mode
- **Footer:** «Menu by Restaurant Launch Kit» → `/`

---

## 10. Production-кейс: Zobnin

| | |
|--|--|
| Slug | `zobnin-2` (legacy) |
| Menu | https://launcher-black.vercel.app/m/zobnin-2/menu |
| Home | https://launcher-black.vercel.app/m/zobnin-2 |

---

## 11. Спринты

### Стабилизация (b6ddf4d)

Fix `/m/[slug]` 500, PDF без sharp, slug picker, onboarding, maxDuration 60

### Визуал (трек B) ✅

| # | Результат |
|---|-----------|
| 1 | CSS-токены + dark accent lighten |
| 2 | Fraunces + Schibsted Grotesk |
| 3 | Menu: dot leaders, category nav, footer |
| 4 | Home: cover_url / print-frame, hours status |
| 5 | Item + Contacts без карточек |
| 6 | cover_url migration + Settings upload |
| 7 | Preview as guest + owner unpublished preview |
| 8 | DishPhotoPlaceholder удалён |

---

## 12. Известные ограничения

1. Vercel Hobby — AI max **60 сек**
2. Supabase free — magic link без custom SMTP
3. Фото блюд — только ручная загрузка
4. Legacy slug `zobnin-2`
5. Миграция `003_cover_url.sql` — нужно применить на prod Supabase

---

## 13. MVP checklist

### Готово ✅

- [x] Auth, CRUD, slug picker, AI parse/import
- [x] PDF без sharp, improve descriptions, translate
- [x] Publish, QR, onboarding banners
- [x] Печатное меню (dot leaders, типографика)
- [x] cover_url, Preview as guest, owner preview

### Backlog

| Трек | Статус |
|------|--------|
| A. Стабилизация | ✅ |
| B. Визуал | ✅ |
| C. Vision crop | REJECTED |
| D. Integrations | TBD |

---

## 14. Чеклист приёмки

```
[ ] /admin/new — slug live-check
[ ] Upload PDF/JPG → review → import
[ ] Settings → cover photo, theme dark, Published
[ ] /m/{slug} — обложка или print-frame, View menu
[ ] /m/{slug}/menu — dot leaders, category nav, без emoji
[ ] /m/{slug}/item/{id} — только для блюд с фото/длинным описанием
[ ] /m/{slug}/contacts — часы, maps link
[ ] Preview as guest (owner, unpublished OK)
[ ] ?lang= сохраняется между страницами
[ ] Lighthouse mobile > 85 на prod
```

---

## 15. Ссылки

| | |
|--|--|
| Production | https://launcher-black.vercel.app |
| GitHub | https://github.com/zobnin8-ux/launcher |
| Supabase | https://supabase.com/dashboard/project/rducvwjvtwvryuwepzsv |
| Demo menu | https://launcher-black.vercel.app/m/zobnin-2/menu |

---

*Обновлено после спринта «Визуал» (июнь 2026). Следующий приоритет — **трек D: Integrations**.*
