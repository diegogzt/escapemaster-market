# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Astro 5 SSR** (`output: 'server'`, `@astrojs/node` adapter) — server-side rendered pages
- **React 19** — Astro "islands" architecture with `client:load` and `client:visible` directives
- **Tailwind CSS v4** with `tailwind-merge` + `clsx`
- **Nanostores** — client-side state (auth session, user data, cart)
- **Leaflet** + `react-leaflet` — map components
- **i18n** — `es`/`en` via `useTranslations` in `src/i18n/ui.ts`

## Development Commands

```bash
npm install
cp .env.example .env          # Configure environment variables
npm run dev                  # Dev server at http://localhost:4321
npm run build                # Production build
npm run preview              # Preview production build
docker-compose up            # Containerized production-like environment
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_API_URL` | `http://localhost:8000` | Backend API (escapemaster-rooms-api) |
| `DATABASE_URL` | — | PostgreSQL connection (SSR only) |
| `PUBLIC_CMS_API_URL` | `http://localhost:4322` | CMS API for editorial pages |

## Color Palette — Tropical Theme

Always use `tropical-*` utility classes, **never hardcode hex colors**.

| Class | Hex | Use |
|---|---|---|
| `bg-tropical-primary` | `#0097b2` | Primary actions, links |
| `bg-tropical-accent` | `#f39c12` | Accent/highlights |
| `text-tropical-text` | `#0d3d34` | Body text |

## Architecture

### Route Structure — i18n

All public routes live under `src/pages/[lang]/` with the `lang` param determining the locale (`es` default). Pages that don't need i18n live directly under `src/pages/`.

### Astro Island Pattern

React components hydrate as "islands" inside Astro pages:
- `client:load` — hydrates immediately on page load
- `client:visible` — hydrates when entering the viewport

Most interactive components are in `src/components/react/`:
- [AdvancedFilters.tsx](src/components/react/AdvancedFilters.tsx) — search filters
- [MapSearch.tsx](src/components/react/MapSearch.tsx) — Leaflet map search
- [BookingWidget.tsx](src/components/react/BookingWidget.tsx) — room booking
- [OnboardingWizard.tsx](src/components/react/OnboardingWizard.tsx) — customer onboarding
- [OnboardingEnterpriseWizard.tsx](src/components/react/OnboardingEnterpriseWizard.tsx) — enterprise onboarding
- [EnterpriseDashboard.tsx](src/components/react/EnterpriseDashboard.tsx) — enterprise metrics

### State Management — Nanostores

Client state in `src/lib/store.ts`:
- `$user` — authenticated user data
- `$token` — auth token
- `$cart` — cart items

Auth operations in `src/lib/auth.ts`:
- Login/register/logout
- Google auth
- Session persistence in `localStorage` (keys: `em_token`, `em_user`)
- Token refresh via `/auth/me` endpoint

### API Layer — `src/lib/api.ts`

- `api.rooms.list()` / `api.rooms.listPublic()` — room listings
- `api.auth` — login, me
- `api.bookings` — create booking
- `api.cms` — CMS page fetching

For server-side operations, use `src/lib/db.ts` (`query()` function) directly — this is **server-only**, never import in client components.

### CMS — `src/lib/cms.ts`

Editorial pages fetched via `getCMSPageFromAPI()` or `getCMSPageBySlug()`. The CMS renders sections via `CMSPageRenderer.tsx` which dynamically loads components based on the CMS configuration.

### Analytics — `src/lib/tracking.ts`

Analytics tracking is initialized in the layout and exposed as `window.analytics`. Track events:
- `trackAuth()` — login/register/logout
- `trackClick()` — click heatmap
- `trackPageView()` — page views

## Key Patterns

### Making Authenticated API Calls

```ts
import { auth } from '../lib/auth';

const token = auth.getToken();
const response = await fetch(`${API_URL}/endpoint`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Adding a New Translation

Add keys to both `es` and `en` objects in `src/i18n/ui.ts`. Use `t()` helper with the key string.

### Server-Only Database Queries

Use the `query()` function from `src/lib/db.ts` — this module uses Node.js `pg` and must not be imported in client-side React components.

## File Organization

| Path | Purpose |
|---|---|
| `src/pages/[lang]/` | All i18n route pages |
| `src/pages/[lang]/marketplace/` | Marketplace browse/search |
| `src/pages/[lang]/routes/` | Curated escape room routes |
| `src/pages/[lang]/profile/` | User profile sub-pages |
| `src/pages/[lang]/teams/` | Team management |
| `src/components/react/` | React island components |
| `src/components/ui/` | Reusable UI primitives |
| `src/lib/auth.ts` | Auth client library |
| `src/lib/api.ts` | API client |
| `src/lib/store.ts` | Nanostores state |
| `src/lib/db.ts` | PostgreSQL query (server-only) |
| `src/lib/cms.ts` | CMS API helpers |
| `src/i18n/ui.ts` | i18n strings |
