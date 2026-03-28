# AGENTS.md — EscapeMaster Frontend

## Project Overview
- **Stack**: Astro 5 SSR (`output: 'server'`) + React 19 + Tailwind CSS v4 + Nanostores + Leaflet
- **Languages**: TypeScript throughout; i18n: `es` (default), `en`
- **Repo**: `/frontend` - B2C marketplace for escape room discovery and booking

---

## Commands

### Development
```bash
npm run dev          # Start dev server at http://localhost:4321
npm run dev:prod     # Production mode dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run astro        # Run Astro CLI (astro --help)
```

### Testing
> **No test framework configured** — do not add tests without setting up a framework first.

If adding tests in the future, use Vitest (Astro's recommended test runner).

**For responsive testing, use Playwright:**
```bash
# Install browser
playwright install chromium

# Run responsive tests (server must be running)
python3 test_responsive.py
```

### Environment Variables
```bash
cp .env.example .env   # Copy environment template
```
Key vars:
- `PUBLIC_API_URL` — Backend API URL (default: `http://localhost:8000`)
- `DATABASE_URL` — PostgreSQL for SSR

---

## Code Style Guidelines

### TypeScript
- Use explicit types for component props, function parameters, and return values
- Prefer `interface` for object shapes, `type` for unions/primitives
- Use `any` sparingly — prefer `unknown` with type narrowing
- Custom error classes should extend `Error` (e.g., `ApiError` in `src/lib/api.ts`)

### React Components
- Use `React.FC<Props>` for typed props (see `AuthStatus.tsx`)
- Use `React.forwardRef` for components that need ref forwarding (see `Button.tsx`)
- Always set `displayName` for forwardRef components
- Handle loading/mounted states to avoid hydration mismatches:
  ```tsx
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <Skeleton />;
  ```

### Imports
- React: `import React from "react"` (explicit, even if unused directly)
- Relative paths for local modules (`../../lib/auth`, `../ui/Button`)
- Named imports for utilities (`import { cn } from "@/lib/utils"`)
- Icon library: `import { IconName } from "lucide-react"`

### Tailwind CSS v4
- **ALWAYS use tropical-* design tokens** — never hardcode hex colors:
  ```tsx
  // ✅ Correct
  <div className="bg-tropical-primary text-white">
  <p className="text-tropical-text/60">
  
  // ❌ Incorrect
  <div style={{ background: '#0097b2' }}>
  <p className="text-gray-700">
  ```
- Tropical palette:
  - `tropical-primary` (#0097b2) — CTAs, headers
  - `tropical-secondary` (#00849c) — darker contrast
  - `tropical-accent` (#f39c12) — urgent CTAs, orange
  - `tropical-bg` (#f8fafc) — page background
  - `tropical-text` (#2d2d2d) — body text
- Use slash notation for opacity: `bg-tropical-primary/20`, `text-tropical-text/40`
- Mobile-first: `text-sm sm:text-base` (not desktop-first)
- Touch targets minimum 44px: `touch-manipulation` on interactive elements
- Input font-size: always `text-base` (16px) to prevent iOS zoom

### Astro Components
- Use `client:load` for critical interactive components (Header, AuthStatus)
- Use `client:visible` for below-the-fold components (BookingWidget, Maps)
- Frontmatter (YAML between `---`) for props interface and server-side logic
- Access params via `Astro.params.lang` not `Astro.props.lang`

### Page Layout Structure
Follow this responsive padding pattern for all pages:
```astro
<!-- Container with responsive padding -->
<div class="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
  
  <!-- Responsive header section -->
  <div class="mb-10 sm:mb-16 text-center">
    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-tropical-primary tracking-tight mb-3 sm:mb-4">
      Page Title
    </h1>
    <p class="text-tropical-text/60 text-base sm:text-lg max-w-xl mx-auto">
      Subtitle text
    </p>
  </div>
  
  <!-- Responsive grids -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    <!-- Cards with responsive padding -->
  </div>
</div>
```

### State Management (Nanostores)
- Atoms: `import { atom } from "nanostores"`
- React binding: `import { useStore } from "@nanostores/react"`
- Auth state synced to localStorage with keys `em_token` and `em_user`

### API Layer (`src/lib/api.ts`)
- Custom `ApiError` class with `status` property
- Token from localStorage (`esc_token`) added as `Authorization: Bearer`
- Handle 401 for auth redirects, 204 for empty responses

### i18n
- Translation keys in `src/i18n/ui.ts` under `ui.es` / `ui.en` objects
- Use: `const t = useTranslations(lang)` to get translator function
- Fallback: `ui[lang][key] || ui["es"][key] || key`

### File Organization
```
src/
├── components/
│   ├── react/     # React islands (client:load/client:visible)
│   ├── ui/        # Reusable UI components (Button, Input, Card, Badge, Table)
│   └── *.astro    # Astro components
├── layouts/       # Page layouts (Layout.astro, BareLayout.astro)
├── lib/           # Utilities, API, auth, stores, DB
├── i18n/          # Translation strings
├── pages/         # Astro pages (file-based routing)
│   └── [lang]/    # i18n route segments
└── styles/        # global.css with Tailwind @theme
```

---

## Critical Rules

### DO
- Use `cn()` from `@/lib/utils` to merge Tailwind classes conditionally
- Handle loading/error states in all async operations
- Use `variant` + `size` props pattern for reusable components (CVA)
- Check `typeof window !== 'undefined'` for browser-only code
- Add `client:load`/`client:visible` directives to React components in Astro
- Use responsive heading sizes: `text-3xl sm:text-4xl lg:text-5xl`
- Test at mobile (375px), tablet (768px), and desktop (1280px) viewports

### DON'T
- Hardcode colors or use generic Tailwind colors (`text-gray-700`, `bg-blue-500`)
- Use `<=` 44px touch targets on mobile
- Add test files without a configured test framework
- Skip error handling in async operations
- Use `any` without documented justification
- Use oversized headings like `text-5xl` without responsive alternatives
