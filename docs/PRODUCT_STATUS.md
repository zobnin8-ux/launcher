# Restaurant Launch Kit — состояние продукта (MVP)

> Документ для ревизии. Актуально на: **13 июня 2026** (после спринта «Стабилизация»).  
> Репозиторий: https://github.com/zobnin8-ux/launcher  
> Production: **https://launcher-black.vercel.app**  
> Последний коммит: `b6ddf4d`

---

## 1. Краткое резюме

**Restaurant Launch Kit** — MVP-сервис для владельцев ресторанов: загрузить меню (фото/PDF), распознать его через AI, отредактировать в админке и получить **мобильную публичную страницу меню** + **QR-код**.

**Это не** полноценный конструктор сайтов (Tilda/Wix).  
**Это** structured menu + admin + QR + минимальная публичная витрина для телефона.

**Статус:** MVP **готов к показу первым клиентам** после спринта «Стабилизация» (июнь 2026).

| Ожидание заказчика | Реальность MVP |
|--------------------|----------------|
| Загрузил фото меню → готовый красивый сайт с картинками блюд | AI извлекает **текст** (названия, цены, категории). Фото блюд — **вручную** или emoji-плейсхолдер |
| «Сайт ресторана» | Список блюд на телефоне + главная/контакты |
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

### Supabase — что должно быть применено

1. `supabase/migrations/001_initial_schema.sql` — таблицы + RLS  
2. `supabase/migrations/002_storage_buckets.sql` — buckets: `logos`, `dish-photos`, `menu-scans`, `qr-codes`

### Auth

- **Magic link** (email) — основной способ входа  
- OTP-код в письме **не используется** (ограничение free tier Supabase без custom SMTP)  
- Redirect URLs в Supabase: `{APP_URL}/auth/confirm`, `{APP_URL}/auth/callback`, `{APP_URL}/**`

### Vercel timeouts

| План | maxDuration AI routes | Где настроено |
|------|----------------------|---------------|
| **Hobby** (сейчас) | **60 сек** | `vercel.json` |
| Pro (рекомендация для больших PDF) | до 300 сек | поднять в `vercel.json` |

---

## 3. Стек

- **Next.js 14.2** (App Router, TypeScript, Server Components, Server Actions)
- **Tailwind CSS**
- **Supabase** — Postgres, Auth, Storage, RLS
- **Anthropic SDK** — vision (JPG/PNG), **native PDF document blocks**, text (описания, переводы)
- **qrcode** — генерация QR

**Удалено:** `sharp`, `pdf-lib`, `@vercel/functions` — PDF идёт в Claude API напрямую.

---

## 4. Маршруты

### Публичные (для гостей)

| URL | Описание | Статус |
|-----|----------|--------|
| `/` | Лендинг сервиса | ✅ |
| `/m/[slug]` | Главная (лого, часы, кнопка «View menu») | ✅ `force-dynamic` |
| `/m/[slug]/menu` | Меню (категории, блюда, цены, плейсхолдеры) | ✅ |
| `/m/[slug]/item/[itemId]` | Карточка блюда | ✅ |
| `/m/[slug]/contacts` | Контакты, часы, Google Maps | ✅ |

Query-параметры:
- `?lang=xx` — язык (таблица `translations`)
- `?src=qr` — учёт QR-сканов в аналитике

**Важно:** ресторан виден только если `is_published = true`.  
**Slug:** при создании — явное поле с live-проверкой (`/api/slug/check`). Авто-суффиксы `-2` **больше не добавляются** (старые рестораны могут иметь legacy slug, напр. `zobnin-2`).

### Админка (требует авторизации)

| URL | Описание |
|-----|----------|
| `/login` | Magic link |
| `/admin` | Список ресторанов (+ Delete) |
| `/admin/new` | Создание ресторана: **slug + live-check + preview URL** |
| `/admin/[id]` | Dashboard, аналитика, **PublicSiteCard** (ссылки + Copy) |
| `/admin/[id]/menu` | Menu editor, upload, improve descriptions, **PublicSiteCard** |
| `/admin/[id]/menu?imported=1` | После import — баннер **«What's next»** |
| `/admin/[id]/menu/review/[jobId]` | Review AI → Confirm & import |
| `/admin/[id]/settings` | Контакты, тема, часы, валюта, **Published**, slug (read-only) |
| `/admin/[id]/qr` | QR + **PublicSiteCard** + Copy URL меню |

**Общее для `/admin/[id]/*`:** если `is_published = false` — жёлтый баннер «Your site is not published yet».

---

## 5. API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/parse-menu` | POST | Upload в Storage + `parse_job` (JPG/PNG ≤10 MB, PDF ≤32 MB) |
| `/api/parse-menu/[jobId]` | GET | Статус job |
| `/api/parse-menu/[jobId]/process` | POST | AI-парсинг (Claude), max **60 сек** |
| `/api/slug/check?slug=` | GET | Доступность slug |
| `/api/improve-descriptions` | POST | AI-описания для блюд |
| `/api/translate` | POST | Перевод меню |
| `/api/generate-qr` | POST | PNG + SVG QR |
| `/api/track` | POST | Аналитика |
| `/api/auth/send-code` | POST | Magic link |
| `/api/auth/check` | GET | Диагностика env/Supabase |

### Parse pipeline

```
Upload (POST /parse-menu) → jobId
  → Process (POST /parse-menu/[jobId]/process) → 30–60 сек
  → Review → Confirm & import
  → Redirect /menu?imported=1
```

Jobs в `processing` **> 10 мин** автоматически → `error`.

---

## 6. Основные пользовательские сценарии

### 6.1 Владелец: первый запуск

```
/login → magic link
  → /admin/new — имя + slug (live check) + preview URL
  → Dashboard (PublicSiteCard, stats)
  → Menu editor → Upload menu (PDF/photo)
  → AI parsing (POST /process, до 60 сек)
  → Review → Confirm & import
  → «What's next»: ✓ review → publish → QR
  → Settings → Published ✓, logo, address, currency
  → QR → download PNG/SVG
```

### 6.2 Гость

```
QR / ссылка → /m/{slug}/menu
  → категории → карточки блюд (emoji-плейсхолдер если нет фото)
  → клик → /m/{slug}/item/{id}
  → Home / Contacts — опционально
```

### 6.3 Menu editor

| Действие | Что делает |
|----------|------------|
| Upload menu | AI парсинг → review → import |
| Improve descriptions | Claude → Apply/Dismiss |
| Photo (на блюде) | Ручная загрузка в `dish-photos` |
| Add category / item | Ручное добавление |
| ↑↓ | Сортировка |

---

## 7. AI — возможности и ограничения

### ✅ Реализовано

| Функция | Детали |
|---------|--------|
| **Парсинг JPG/PNG** | Claude vision, до 10 MB |
| **Парсинг PDF** | Claude document API, до 32 MB, без sharp |
| **Improve descriptions** | Все блюда, Apply/Dismiss |
| **Translate** | Кнопка в Settings → `locales` |
| **Stale job cleanup** | processing > 10 min → error |

### ❌ Не реализовано / REJECTED

| Функция | Статус |
|---------|--------|
| Crop фото блюд со scan | **REJECTED** → emoji-плейсхолдеры |
| WYSIWYG-редактор страниц | Backlog (трек B) |
| Бронирование, доставка, оплата | Out of scope |
| Custom domains | Backlog |

---

## 8. Модель данных (кратко)

```
restaurants (slug UNIQUE, is_published, theme, hours, locales, currency)
  ├── menus → categories → items (price, variants, tags, photo_url)
  ├── parse_jobs (pending → processing → done/error)
  ├── translations
  ├── qr_codes
  └── events (menu_view, qr_scan, item_view)

Storage: menu-scans (private), dish-photos, logos, qr-codes (public)
```

Публичное чтение — через **anon key** + RLS «public read published». Cookies не нужны.

---

## 9. Публичный UI — что видит гость

Mobile-first, тема из Settings (`theme.primary`, light/dark):

- **Menu** — категории, карточки блюд, цены, описания, теги
- **Плейсхолдер фото** — emoji по категории/тегу (🍕 🥩 🥗 …), если `photo_url` пуст
- **Item** — детальная карточка + плейсхолдер
- **Home** — лого, название, часы, кнопка «View menu»
- **Contacts** — адрес, телефон, email, карта

---

## 10. Аналитика (Dashboard)

Счётчики за 7 и 30 дней: `menu_view`, `qr_scan` (через `?src=qr`).

---

## 11. Production-кейс: Zobnin (legacy)

| Параметр | Значение |
|----------|----------|
| Restaurant ID | `c07145f5-df3d-4fe9-b0a2-ba124dbc1ee0` |
| Slug | **`zobnin-2`** (legacy — создан до slug picker) |
| Published | ✅ |
| Меню | https://launcher-black.vercel.app/m/zobnin-2/menu |
| Главная | https://launcher-black.vercel.app/m/zobnin-2 |

> Новые рестораны получают slug явно при создании. `zobnin-2` — исторический артеfact.

---

## 12. Спринт «Стабилизация» — что сделано (b6ddf4d)

| # | Задача | Результат |
|---|--------|-----------|
| 1 | Fix `/m/[slug]` 500 | `force-dynamic`, public client без cookies |
| 2 | PDF без sharp | Claude document API; sharp/pdf-lib удалены |
| 3 | Таймауты | maxDuration 60; stale jobs > 10 min |
| 4 | Slug UX | Live-check, preview URL, без авто-суффиксов |
| 5 | Onboarding | What's next, unpublished banner, PublicSiteCard + Copy |
| 6 | Backlog cleanup | RUB убран; трек C REJECTED |
| 7 | Плейсхолдеры | DishPhotoPlaceholder на menu/item |

---

## 13. Известные ограничения

| # | Ограничение |
|---|-------------|
| 1 | Vercel Hobby — AI max **60 сек**; большие PDF могут не успеть |
| 2 | Supabase free — только magic link, без custom SMTP |
| 3 | Фото блюд — только ручная загрузка (не из scan) |
| 4 | Нет preview «как видит гость» в админке |
| 5 | Legacy slug `zobnin-2` у существующего ресторана |

---

## 14. Структура проекта

```
src/
├── app/
│   ├── admin/[restaurantId]/layout.tsx   # UnpublishedBanner
│   ├── m/[slug]/                         # Public (force-dynamic)
│   └── api/
│       ├── parse-menu/                   # upload + process
│       └── slug/check/                   # slug availability
├── components/
│   ├── admin/
│   │   ├── NewRestaurantForm.tsx         # slug picker
│   │   ├── PublicSiteCard.tsx            # links + Copy
│   │   ├── WhatsNextBanner.tsx
│   │   ├── UnpublishedBanner.tsx
│   │   └── CopyButton.tsx
│   └── public/
│       └── DishPhotoPlaceholder.tsx
├── lib/ai/
│   ├── parse-menu.ts                     # image + PDF parsers
│   ├── process-parse-job.ts
│   └── parse-jobs.ts                     # stale job cleanup
└── lib/data/restaurants.ts               # createPublicClient (no cookies)

docs/PRODUCT_STATUS.md
vercel.json                               # maxDuration: 60
```

---

## 15. MVP checklist

### Готово ✅

- [x] Auth (magic link)
- [x] CRUD ресторана + delete
- [x] Slug picker с live-check
- [x] AI upload → review → import
- [x] PDF через Claude document API (без sharp)
- [x] Improve descriptions
- [x] Translate
- [x] Publish + public menu
- [x] QR generation
- [x] Settings (контакты, тема, часы, валюта)
- [x] Главная `/m/[slug]` без 500
- [x] Onboarding «What's next»
- [x] PublicSiteCard + Copy (Dashboard, Menu, QR)
- [x] Unpublished banner
- [x] Emoji-плейсхолдеры фото

### Backlog (следующие спринты)

| Трек | Фокус | Effort |
|------|-------|--------|
| **A. Стабилизация** | ✅ Done | — |
| **B. Визуал** | Hero, улучшение public UI, preview в админке | 3–5 дней |
| ~~**C. Vision crop**~~ | **REJECTED** | — |
| **D. Integrations** | Экспорт, custom domains | TBD |

> **US-рынок.** Дефолтная валюта **USD**. Другие валюты — через Settings.

---

## 16. Чеклист приёмки (ручная проверка)

```
[ ] /login — magic link работает
[ ] /admin/new — slug live-check, нельзя занятый slug, preview URL
[ ] /admin/new — создать ресторан → Dashboard
[ ] Upload JPG → review → confirm → «What's next» баннер
[ ] Upload PDF → парсится без ошибки sharp
[ ] Settings → Published ON → PublicSiteCard показывает ссылки
[ ] /m/{slug} — 200, лого/часы/кнопка меню
[ ] /m/{slug}/menu — блюда + emoji-плейсхолдеры
[ ] /m/{slug}/contacts — контакты
[ ] QR generate → download PNG → ?src=qr в stats
[ ] Improve descriptions → suggestions → Apply
[ ] Unpublished banner при is_published = false
[ ] Copy button копирует URL меню
```

---

## 17. Git history (ключевые коммиты)

| Commit | Суть |
|--------|------|
| `b6ddf4d` | **Спринт «Стабилизация»** — полный пакет фиксов |
| `ca46a62` | PRODUCT_STATUS документ |
| `09468ec` | Improve descriptions fix |
| `65261b8` | PublicSiteCard |
| `3f59b33` | sharp crash fix (до удаления sharp) |
| `71ae2d0` | Upload/process split |

---

## 18. Ссылки

| Ресурс | URL |
|--------|-----|
| Production | https://launcher-black.vercel.app |
| GitHub | https://github.com/zobnin8-ux/launcher |
| Supabase | https://supabase.com/dashboard/project/rducvwjvtwvryuwepzsv |
| Demo menu | https://launcher-black.vercel.app/m/zobnin-2/menu |

---

*Документ обновлён после спринта «Стабилизация» (commit `b6ddf4d`). Следующий приоритет — **трек B: Визуал**.*
