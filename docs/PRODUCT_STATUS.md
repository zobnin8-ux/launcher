# Restaurant Launch Kit — состояние продукта (MVP)

> Документ для ревизии. Актуально на: **июнь 2026**.  
> Репозиторий: https://github.com/zobnin8-ux/launcher  
> Production: **https://launcher-black.vercel.app**

---

## 1. Краткое резюме

**Restaurant Launch Kit** — MVP-сервис для владельцев ресторанов: загрузить меню (фото/PDF), распознать его через AI, отредактировать в админке и получить **мобильную публичную страницу меню** + **QR-код**.

**Это не** полноценный конструктор сайтов (Tilda/Wix).  
**Это** structured menu + admin + QR + минимальная публичная витрина для телефона.

| Ожидание заказчика | Реальность MVP |
|--------------------|----------------|
| Загрузил фото меню → готовый красивый сайт с картинками блюд | AI извлекает **текст** (названия, цены, категории). Фото блюд **не** вырезаются со скана |
| «Сайт ресторана» | Список блюд на телефоне + опционально главная/контакты |
| Загрузил и забыл | Загрузка → review → import → Settings (publish) → QR → ручные фото |

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

---

## 3. Стек

- **Next.js 14.2** (App Router, TypeScript, Server Components, Server Actions)
- **Tailwind CSS**
- **Supabase** — Postgres, Auth, Storage, RLS
- **Anthropic SDK** — vision (парсинг меню), text (описания, переводы)
- **sharp** — только для PDF (lazy import); фото JPG/PNG идут в Claude без конвертации
- **qrcode** — генерация QR
- **pdf-lib** — в зависимостях (PDF pipeline через sharp)

---

## 4. Маршруты

### Публичные (для гостей)

| URL | Описание | Статус |
|-----|----------|--------|
| `/` | Лендинг сервиса | ✅ Работает |
| `/m/[slug]` | Главная ресторана (название, часы, кнопка «Меню») | ⚠️ **500 на production** (известный баг) |
| `/m/[slug]/menu` | Меню (категории, блюда, цены) | ✅ Работает |
| `/m/[slug]/item/[itemId]` | Карточка блюда | ✅ Работает |
| `/m/[slug]/contacts` | Контакты, часы, ссылка на карты | ✅ Работает |

Query-параметры:
- `?lang=xx` — язык (через таблицу `translations`)
- `?src=qr` — учёт QR-сканов в аналитике

**Важно:** ресторан виден только если `is_published = true`.  
Slug уникален; при дубликате имени добавляется суффикс (`zobnin` → `zobnin-2`).

### Админка (требует авторизации)

| URL | Описание |
|-----|----------|
| `/login` | Вход (magic link) |
| `/admin` | Список ресторанов (+ Delete) |
| `/admin/new` | Создание ресторана (имя, кухня, адрес, валюта) |
| `/admin/[id]` | Dashboard: аналитика, навигация, **блок «Публичные ссылки»** |
| `/admin/[id]/menu` | Menu editor + upload + improve descriptions |
| `/admin/[id]/menu/review/[jobId]` | Review AI-распознанного меню → Confirm & import |
| `/admin/[id]/settings` | Контакты, часы, тема, валюта, языки, **Published** |
| `/admin/[id]/qr` | Генерация и скачивание QR |

---

## 5. API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/parse-menu` | POST | Загрузка файла в Storage + создание `parse_job` (быстрый ответ) |
| `/api/parse-menu/[jobId]` | GET | Статус job |
| `/api/parse-menu/[jobId]/process` | POST | AI-обработка (Claude vision), до 300 сек |
| `/api/improve-descriptions` | POST | AI-описания для блюд |
| `/api/translate` | POST | Перевод меню на языки из Settings |
| `/api/generate-qr` | POST | PNG + SVG QR |
| `/api/track` | POST | События аналитики |
| `/api/auth/send-code` | POST | Отправка magic link |
| `/api/auth/check` | GET | Диагностика Supabase/env |

---

## 6. Основные пользовательские сценарии

### 6.1 Владелец: первый запуск

```
/login → magic link → /admin
  → Create restaurant
  → Dashboard
  → Menu editor → Upload menu (PDF/photo)
  → AI parsing (30–90 сек)
  → Review parsed menu → Confirm & import
  → Settings → Published ✓, валюта, лого, адрес
  → QR code → скачать
```

### 6.2 Гость

```
QR / ссылка → /m/{slug}/menu
  → список категорий и блюд
  → клик по блюду → /m/{slug}/item/{id}
```

### 6.3 Menu editor — действия

| Действие | Что делает |
|----------|------------|
| Upload menu (PDF/photo) | AI парсинг → review → import |
| Add category / Add item | Ручное добавление |
| Improve descriptions | Claude пишет/улучшает описания (блок Apply/Dismiss) |
| Photo (на каждом блюде) | Ручная загрузка фото в bucket `dish-photos` |
| Перетаскивание ↑↓ | Сортировка категорий и блюд |

---

## 7. AI — что умеет и чего не умеет

### ✅ Реализовано

1. **Парсинг меню** (фото JPG/PNG, PDF с ограничениями)
   - Извлечение категорий, названий, цен, вариантов, тегов
   - Экран review перед импортом
   - Многостраничный PDF — через sharp (на Vercel может быть нестабильно)

2. **Improve descriptions**
   - Генерация/улучшение текстовых описаний для блюд
   - Предложения с Apply/Dismiss

3. **Translate** (Settings)
   - Перевод полей меню на языки из `locales`

### ❌ Не реализовано

- **Вырезание фото блюд** из загруженного меню
- **Автоматическая подстановка** scan-изображения на сайт
- **WYSIWYG-редактор** страниц
- **Бронирование, доставка, оплата**
- **SEO, домены, мультитенантный white-label**

---

## 8. Модель данных (кратко)

```
restaurants
  ├── menus (is_active)
  │     └── categories
  │           └── items (price, variants, tags, photo_url, is_available)
  ├── parse_jobs (status, result JSON, source_file_url)
  ├── translations (entity_type, entity_id, locale, field, value)
  ├── qr_codes
  └── events (menu_view, item_view, qr_scan)

Storage:
  menu-scans   — загруженные PDF/фото меню (private)
  dish-photos  — фото блюд (public)
  logos        — логотипы (public)
  qr-codes     — QR (public)
```

Меню — **structured data** в Postgres. Публичный сайт, QR и экспорт — производные от БД.

---

## 9. Публичный UI — что видит гость

Минималистичный **mobile-first** интерфейс:

- Шапка с названием ресторана
- Переключатель языка (если `locales.length > 1`)
- **Menu:** категории → карточки блюд (название, цена, описание, теги)
- **Item:** детальная карточка
- **Contacts:** адрес, телефон, email, сайт, часы, Google Maps
- **Home:** лого, название, кнопка «View menu», часы *(сейчас 500)*

Тема: `theme.primary`, `theme.mode` (light/dark) из Settings.

---

## 10. Аналитика (Dashboard)

Счётчики за 7 и 30 дней:

- `menu_view` — просмотры меню
- `qr_scan` — переходы с `?src=qr`
- `item_view` — просмотры блюд *(есть в схеме, UI на dashboard частично)*

---

## 11. Текущий production-кейс (Zobnin)

| Параметр | Значение |
|----------|----------|
| Restaurant ID | `c07145f5-df3d-4fe9-b0a2-ba124dbc1ee0` |
| Slug | **`zobnin-2`** (не `zobnin`) |
| Published | ✅ `true` |
| Публичное меню | https://launcher-black.vercel.app/m/zobnin-2/menu |
| Главная | https://launcher-black.vercel.app/m/zobnin-2 — **500** |

Меню на сайте: категория «MENU», несколько блюд с ценами.  
Структура после import может отличаться от экрана review (зависит от confirm и ручных правок).  
Валюта по умолчанию при создании — **USD** (меняется в Settings).

---

## 12. Известные проблемы и ограничения

### Баги

| # | Проблема | Severity |
|---|----------|----------|
| 1 | `/m/[slug]` (главная) — **500** на Vercel при рабочем `/menu` и `/contacts` | High |
| 2 | Slug с суффиксом (`-2`) — легко открыть неверную ссылку | Medium |
| 3 | Публичная ссылка раньше была спрятана (частично исправлено: `PublicSiteCard`) | Medium |
| 4 | PDF-парсинг на Vercel зависит от sharp/libvips | Medium |

### Ограничения платформы

| # | Ограничение |
|---|-------------|
| 1 | Vercel Hobby — timeout serverless ~10 сек; AI parsing вынесен в `/process` с `maxDuration: 300` (нужен Pro для длинных job) |
| 2 | Supabase free — magic link only, без кастомных email-шаблонов |
| 3 | Кириллица в PowerShell/логах может отображаться как `???` — в БД данные могут быть корректны |

### UX / product gaps

- Нет onboarding «что делать после import»
- Нет preview «как видит гость» в админке
- Improve descriptions — отдельный шаг, не автоматический
- Фото блюд — только ручная загрузка

---

## 13. Недавние исправления (git history)

| Commit | Суть |
|--------|------|
| `09468ec` | Improve descriptions: не молчит, обрабатывает все блюда |
| `65261b8` | PublicSiteCard, попытка fix главной (generateStaticParams) |
| `3f59b33` | sharp: фото без конвертации на Vercel |
| `71ae2d0` | Upload / process split — fix 500/529 на parse-menu |
| `a9b369a` | Delete restaurant |
| `2ff1226` | Magic link auth |

---

## 14. Структура проекта

```
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── login/
│   ├── admin/                   # Admin UI
│   ├── m/[slug]/                # Public restaurant
│   ├── api/                     # API routes
│   └── auth/                    # confirm, callback
├── components/
│   ├── admin/                   # MenuEditor, SettingsForm, QrPanel, …
│   └── public/                  # PublicHeader, LanguageSwitcher, …
├── actions/                     # Server actions (menu, restaurants)
├── lib/
│   ├── ai/                      # parse-menu, process-parse-job, translate
│   ├── data/restaurants.ts      # Data fetching + cache
│   ├── supabase/                # clients
│   └── utils/
└── middleware.ts                # Auth guard для /admin

supabase/migrations/             # SQL schema
docs/PRODUCT_STATUS.md           # этот файл
vercel.json                      # maxDuration для parse routes
```

---

## 15. Что считать «готовым MVP» vs «не доделано»

### MVP считается рабочим, если:

- [x] Регистрация / вход
- [x] CRUD ресторана
- [x] AI upload → review → import меню
- [x] Ручное редактирование меню
- [x] Publish + публичное меню по slug
- [x] QR generation
- [x] Settings (контакты, тема, часы, валюта)
- [x] Improve descriptions
- [x] Translate (API + кнопка в Settings)
- [ ] **Главная `/m/[slug]` без 500**
- [ ] Понятный onboarding и public URL с первого экрана

### Не входило в MVP (backlog для ревизии)

1. **Фото блюд из scan-меню** (computer vision / crop)
2. **Полноценный landing ресторана** (hero, gallery, about)
3. **Рубли по умолчанию** для RU-рынка
4. **Единый slug** без `-2` или UI-предупреждение при создании дубликата
5. **Preview mode** в админке
6. **Экспорт** PDF / iiko / r_keeper
7. **Custom domain** per restaurant

---

## 16. Рекомендуемые направления ревизии

Для обсуждения с product/заказчиком — три трека:

| Трек | Фокус | Effort |
|------|-------|--------|
| **A. Стабилизация** | Fix home 500, slug UX, валюта RUB, onboarding, «Публичные ссылки» везде | 1–2 дня |
| **B. Визуал** | Улучшить public menu UI, лого, фото, hero на главной | 3–5 дней |
| **C. Vision** | Crop фото блюд со scan-меню, auto-assign `photo_url` | 1–2 недели+ |

---

## 17. Как проверить вручную (checklist)

```
[ ] /login — magic link приходит и логинит
[ ] /admin/new — создать ресторан
[ ] /admin/[id]/settings — Published ON, currency, logo
[ ] /admin/[id]/menu — upload фото меню → review → confirm
[ ] /admin/[id]/menu — improve descriptions → apply
[ ] /admin/[id]/qr — generate QR
[ ] /m/{slug}/menu — меню видно без логина
[ ] /m/{slug} — главная открывается (сейчас FAIL)
[ ] /m/{slug}/contacts — контакты
[ ] QR URL с ?src=qr — событие в dashboard stats
```

---

## 18. Контакты и ссылки

| Ресурс | URL |
|--------|-----|
| Production app | https://launcher-black.vercel.app |
| GitHub | https://github.com/zobnin8-ux/launcher |
| Supabase Dashboard | https://supabase.com/dashboard/project/rducvwjvtwvryuwepzsv |
| Vercel Dashboard | (project launcher-black) |

---

*Документ подготовлен по результатам разработки и отладки MVP. Для ревизии продукта передать этот файл + указать приоритет трека A/B/C из раздела 16.*
