# EscapeMaster Web — Design System

> Última actualización: 2026-03-20
> Proyecto: `escapemaster.es` — Astro 5 SSR + React 19 + Tailwind CSS v4

---

## Índice

1. [Paleta de Colores](#1-paleta-de-colores)
2. [Tipografía](#2-tipografía)
3. [Espaciado y Radio de Borde](#3-espaciado-y-radio-de-borde)
4. [Sombras](#4-sombras)
5. [Animaciones y Transiciones](#5-animaciones-y-transiciones)
6. [Componentes UI](#6-componentes-ui)
7. [Utilidades Mobile](#7-utilidades-mobile)
8. [Layouts](#8-layouts)
9. [Patrones de Página](#9-patrones-de-página)
10. [Islands de React](#10-islands-de-react)
11. [Patrones de Interacción](#11-patrones-de-interacción)
12. [Responsive / Breakpoints](#12-responsive--breakpoints)
13. [Iconos](#13-iconos)
14. [Reglas Críticas](#14-reglas-críticas)

---

## 1. Paleta de Colores

Definida en `src/styles/global.css` mediante el bloque `@theme` de Tailwind v4.

### Paleta Tropical (tokens oficiales)

| Token CSS | Clase Tailwind | Hex | Uso |
|-----------|---------------|-----|-----|
| `--color-tropical-primary` | `tropical-primary` | `#0097b2` | CTAs primarios, headers, enlaces, iconos de acción |
| `--color-tropical-secondary` | `tropical-secondary` | `#00849c` | Contraste oscuro, bordes, hover de primary |
| `--color-tropical-bg` | `tropical-bg` | `#f8fafc` | Fondo general de página (Slate-50) |
| `--color-tropical-accent` | `tropical-accent` | `#f39c12` | CTAs urgentes, alertas, precio destacado |
| `--color-tropical-text` | `tropical-text` | `#2d2d2d` | Texto cuerpo, foreground por defecto |
| `--color-tropical-card` | `tropical-card` | `#ffffff` | Fondo de tarjetas |

### Cómo usar los colores

```html
<!-- ✅ Correcto -->
<div class="bg-tropical-primary text-white">...</div>
<p class="text-tropical-text/60">Descripción secundaria</p>
<button class="border border-tropical-secondary/30">...</button>

<!-- ❌ Incorrecto — nunca hardcodear -->
<div style="background: #0097b2">...</div>
<p class="text-gray-700">...</p>
```

### Variantes de opacidad (slash utility)

```
bg-tropical-primary/10   → fondo muy sutil (hover states)
bg-tropical-primary/20   → fondo tenue
text-tropical-text/60    → texto secundario
text-tropical-text/40    → texto terciario / placeholder
border-tropical-secondary/20  → bordes suaves
shadow-tropical-primary/20    → sombras de color
```

### Colores de estado / semánticos

| Propósito | Clase |
|-----------|-------|
| Éxito | `text-green-600 bg-green-100` |
| Error | `text-red-600 bg-red-500/10` |
| Advertencia | `text-amber-700 bg-amber-100` |
| Información | `text-blue-600 bg-blue-100` |
| Desactivado | `opacity-50 pointer-events-none` |

### Colores de rango/nivel de jugador

| Nivel | Fondo | Texto |
|-------|-------|-------|
| Newbie | `bg-gray-200` | `text-gray-600` |
| Explorer | `bg-blue-100` | `text-blue-600` |
| Adventurer | `bg-green-100` | `text-green-600` |
| Expert | `bg-purple-100` | `text-purple-600` |
| Master | `bg-amber-100` | `text-amber-700` |
| Legend | `bg-red-100` | `text-red-600` |

---

## 2. Tipografía

### Fuentes

Definidas en el bloque `@theme` (`src/styles/global.css`):

```css
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-serif: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

> La fuente **Plus Jakarta Sans** se carga vía Google Fonts en páginas que lo requieren (ej. Onboarding).

### Escala tipográfica

| Clase | Tamaño | Uso |
|-------|--------|-----|
| `text-[10px]` | 10px | Labels uppercase, badges de categoría |
| `text-xs` | 12px | Captions, metadatos, fechas |
| `text-sm` | 14px | Cuerpo de texto, descripciones |
| `text-base` | 16px | Párrafos, inputs (evita zoom en iOS) |
| `text-lg` | 18px | Headings secundarios |
| `text-xl` | 20px | Títulos de tarjeta |
| `text-2xl` | 24px | Títulos de sección |
| `text-3xl` | 30px | Títulos de página |
| `text-4xl` | 36px | Headings hero |
| `text-[22px]` | 22px | Encabezados de sección en home |

### Pesos

| Clase | Peso | Uso |
|-------|------|-----|
| `font-normal` | 400 | Cuerpo de texto |
| `font-medium` | 500 | Labels, metadata |
| `font-semibold` | 600 | Subtítulos, precios, cabeceras de sección |
| `font-bold` | 700 | Títulos de tarjeta, botones |
| `font-extrabold` | 800 | Brand, énfasis fuerte |
| `font-black` | 900 | Headings principales, CTAs |

### Patrones tipográficos frecuentes

```html
<!-- Label de campo (small caps) -->
<label class="text-[10px] font-black uppercase tracking-widest text-tropical-text/40">
  Ciudad
</label>

<!-- Título de sección -->
<h2 class="text-lg sm:text-[22px] font-semibold text-tropical-text">
  Salas Cerca de Ti
</h2>

<!-- CTA principal -->
<h1 class="text-3xl sm:text-4xl font-black text-tropical-text tracking-tight">
  Encuentra tu aventura
</h1>

<!-- Texto secundario / descripción -->
<p class="text-sm text-tropical-text/60 leading-relaxed">
  Descripción del escape room...
</p>
```

---

## 3. Espaciado y Radio de Borde

### Token de radio

```css
--radius-xl: 1rem; /* 16px */
```

### Escala de radios usados

| Clase | Valor | Aplicación |
|-------|-------|-----------|
| `rounded-sm` | 2px | Elementos muy pequeños |
| `rounded` | 4px | Chips internos |
| `rounded-md` | 6px | Badges |
| `rounded-lg` | 8px | Botones sm |
| `rounded-xl` | 12px | Botones default, inputs, cards |
| `rounded-2xl` | 16px | Cards grandes, modales |
| `rounded-3xl` | 24px | Secciones CTA, cards onboarding |
| `rounded-[40px]` | 40px | Avatar onboarding |
| `rounded-full` | 9999px | FAB, avatares, pills circulares |

### Safe Area (iOS notch / home indicator)

```css
--spacing-safe-top: env(safe-area-inset-top, 0px);
--spacing-safe-bottom: env(safe-area-inset-bottom, 0px);
```

**Clases disponibles:**

| Clase | Propiedad |
|-------|-----------|
| `.safe-top` | `padding-top: max(1rem, env(safe-area-inset-top))` |
| `.safe-bottom` | `padding-bottom: env(safe-area-inset-bottom, 0px)` |
| `.pt-safe` | `padding-top: env(safe-area-inset-top, 0px)` |
| `.pb-safe` | `padding-bottom: env(safe-area-inset-bottom, 0px)` |

---

## 4. Sombras

| Clase | Uso |
|-------|-----|
| `shadow-sm` | Separación sutil (inputs, cards pequeñas) |
| `shadow` | Card por defecto |
| `shadow-md` | Elevación media (botones outline) |
| `shadow-lg` | Botones primarios, FAB |
| `shadow-xl` | Dropdowns, modales |
| `shadow-2xl` | Bottom sheets, map popups |

**Sombras de color** (para CTAs, elementos flotantes):

```html
<button class="shadow-lg shadow-tropical-primary/20">Reservar</button>
<div class="shadow-2xl shadow-tropical-primary/40">...</div>
```

---

## 5. Animaciones y Transiciones

### Keyframes personalizados (`src/styles/global.css`)

```css
/* Fade + slide desde abajo */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide desde el borde inferior (modales) */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(100%); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Slide desde la derecha (navegación) */
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(100%); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Skeleton shimmer */
@keyframes skeleton-loading {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Clases de animación

| Clase | Duración | Uso |
|-------|----------|-----|
| `.animate-fade-in` | 0.3s ease-out | Carga de página, cards |
| `.animate-slide-up` | 0.3s ease-out | Bottom sheets, modales |
| `.animate-slide-in-right` | 0.3s ease-out | Transiciones de pantalla |
| `.animate-pulse` | 2s infinite | Loading placeholders |
| `.animate-spin` | 1s linear | Spinners (Loader2) |

### Transiciones estándar

```html
<!-- Hover sutil (colores) -->
<div class="transition-colors duration-200">

<!-- Hover completo (todas las propiedades) -->
<div class="transition-all duration-300">

<!-- Transformaciones rápidas (botones, cards) -->
<button class="transition-transform duration-150">

<!-- Elevación de card -->
<div class="shadow-sm hover:shadow-md transition-shadow duration-300">
```

### Efectos de escala (feedback táctil)

| Clase | Escala | Uso |
|-------|--------|-----|
| `active:scale-[0.97]` | 97% | Botones primarios |
| `active:scale-[0.98]` | 98% | Botones secundarios |
| `active:scale-[0.99]` | 99% | Cards touch |
| `hover:scale-[1.03]` | 103% | Imagen de GameCard |
| `hover:scale-110` | 110% | Iconos, badges |

---

## 6. Componentes UI

Todos en `src/components/ui/`. Basados en **CVA** (`class-variance-authority`) + **clsx** + **tailwind-merge**.

### Button

**Archivo:** `src/components/ui/Button.tsx`

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="default" size="default">Reservar</Button>
<Button variant="outline">Ver más</Button>
<Button variant="cta" size="lg">¡Reserva Ahora!</Button>
```

#### Variantes

| Variante | Apariencia | Uso |
|----------|-----------|-----|
| `default` | Fondo `tropical-primary`, texto blanco, shadow-lg | Acción principal |
| `secondary` | Fondo `tropical-secondary`, texto blanco | Acción secundaria |
| `outline` | Borde `tropical-primary`, texto `tropical-primary`, fondo transparente | Alternativa sutil |
| `ghost` | Sin borde/fondo, hover sutil | Acciones terciarias |
| `cta` | Fondo `tropical-accent` (naranja), shadow orange | Urgencia / conversión |
| `link` | Solo texto con subrayado en hover | Navegación inline |
| `tropical` | Alias de `default` | Consistencia en onboarding |
| `destructive` | Rojo | Eliminar / acción destructiva |

#### Tamaños

| Size | Alto | Padding | Uso |
|------|------|---------|-----|
| `sm` | h-9 | px-3 | Acciones en tabla |
| `default` | h-11 sm (h-10 desktop) | px-5 py-2 | Uso general |
| `lg` | h-12 | px-8 text-base | CTA hero |
| `icon` | h-11 w-11 | — | Botón solo icono |

**Base siempre incluida:** `rounded-xl font-bold touch-manipulation active:scale-[0.97] disabled:opacity-50`

---

### Card

**Archivo:** `src/components/ui/Card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Sala de Escape</CardTitle>
    <CardDescription>Descripción breve</CardDescription>
  </CardHeader>
  <CardContent>
    {/* contenido */}
  </CardContent>
  <CardFooter>
    <Button>Reservar</Button>
  </CardFooter>
</Card>
```

| Sub-componente | Estilos base |
|---------------|-------------|
| `Card` | `rounded-xl bg-white shadow-sm border border-tropical-secondary/10 hover:shadow-md transition-shadow` |
| `CardHeader` | `flex flex-col space-y-1.5 p-6` |
| `CardTitle` | `text-2xl font-serif font-bold leading-none tracking-tight text-tropical-primary` |
| `CardDescription` | `text-sm text-tropical-text/60` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `flex items-center p-6 pt-0` |

---

### Badge

**Archivo:** `src/components/ui/Badge.tsx`

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="tropical">Verificado</Badge>
<Badge variant="outline">Terror</Badge>
```

#### Variantes

| Variante | Apariencia | Uso |
|----------|-----------|-----|
| `default` | Fondo primary, texto blanco | Estado activo |
| `secondary` | Fondo secondary, texto blanco | Estado secundario |
| `destructive` | Rojo | Error, cancelado |
| `outline` | Solo borde, texto foreground | Tags, categorías |
| `tropical` | Fondo `tropical-secondary`, texto blanco | Tags del tema |

**Base:** `inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold`

---

### Input

**Archivo:** `src/components/ui/Input.tsx`

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  placeholder="tu@email.com"
  icon={<Mail />}
  error="Email inválido"
/>
```

**Props adicionales:** `label?`, `error?`, `icon?`

**Estilos:**
- Base: `h-11 sm:h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-base shadow-sm`
- Focus: `focus-visible:ring-2 focus-visible:ring-tropical-primary/20 focus-visible:border-tropical-primary`
- Error: `border-destructive focus-visible:ring-destructive/20`
- Mínimo de altura **48px** en móvil (target táctil) + `font-size: 16px` (evita zoom iOS)
- Label: `text-[10px] font-bold uppercase tracking-wider text-foreground/40`
- Error text: `text-[10px] text-destructive font-bold uppercase tracking-tight`

---

### Table

**Archivo:** `src/components/ui/Table.tsx`

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
```

| Sub-componente | Estilos base |
|---------------|-------------|
| `Table` | `w-full caption-bottom text-sm` |
| `TableHeader` | `[&_tr]:border-b` |
| `TableBody` | `[&_tr:last-child]:border-0` |
| `TableRow` | `border-b hover:bg-muted/50 transition-colors` |
| `TableHead` | `h-10 px-2 text-left font-medium text-muted-foreground` |
| `TableCell` | `p-2 align-middle` |

---

## 7. Utilidades Mobile

Clases custom definidas en `src/styles/global.css`.

### Táctil y Scroll

```css
/* Scroll suave iOS */
.momentum-scroll { -webkit-overflow-scrolling: touch; }

/* Ocultar barra de scroll (mantiene scroll funcional) */
.no-scrollbar { scrollbar-width: none; }

/* Scroll horizontal con snap */
.scroll-x-smooth { scroll-snap-type: x mandatory; overflow-x: auto; }
.snap-card       { scroll-snap-align: start; flex-shrink: 0; }
```

### Inputs y Botones Touch

```css
/* Input con target táctil de 48px y sin zoom iOS */
.input-mobile {
  min-height: 48px;
  font-size: 16px;   /* Crítico: evita zoom en iOS */
  border-radius: 0.75rem;
}

/* Botón con target táctil mínimo */
.btn-mobile {
  min-height: 48px;
  padding: 0.75rem 1.5rem;
}
```

### Card Touch

```css
.card-touch {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  active: transform: scale(0.99);
}
```

### FAB (Floating Action Button)

```css
.fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  background: var(--color-tropical-primary);
  color: white;
  /* Respeta home indicator de iPhone */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### Bottom Sheet

```css
.bottom-sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 50;
  background: white;
  border-radius: 1.5rem 1.5rem 0 0;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  max-height: 90vh;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  transition: transform 0.3s ease-out;
}

/* Handle de arrastre */
.bottom-sheet-handle {
  width: 3rem;
  height: 0.25rem;
  background: #d1d5db;
  border-radius: 9999px;
  margin: 0.75rem auto;
}
```

### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(to right, #e5e7eb, #f3f4f6, #e5e7eb);
  background-size: 200% 100%;
  border-radius: 0.5rem;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}
```

### Pull Indicator

```css
.pull-indicator {
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Modal Open (bloquear scroll)

```css
body.modal-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
}
```

### Touch Targets (≤640px)

```css
@media (max-width: 640px) {
  .touch-target    { min-height: 44px; min-width: 44px; }
  .btn-full-mobile { width: 100%; }
}
```

---

## 8. Layouts

### Layout.astro (Principal)

**Uso:** Todas las páginas públicas (home, search, game detail, profile…)

```
<html>
  <head>
    meta viewport: width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover
    theme-color: #0097b2
  </head>
  <body class="bg-white text-tropical-text font-sans antialiased overflow-x-hidden">
    <Header client:load />
    <main class="animate-fade-in min-h-screen">
      <slot />
    </main>
    <footer>
      Grid 4 cols (desktop) / 1 col (mobile)
      bg-white/50 backdrop-blur-sm border-t border-tropical-secondary/20 mt-20
    </footer>
  </body>
</html>
```

**Footer:**
- Fondo: `bg-white/50 backdrop-blur-sm`
- Borde: `border-t border-tropical-secondary/20`
- Iconos sociales: `w-10 h-10 rounded-xl bg-tropical-card hover:bg-tropical-primary hover:text-white`
- Estado del sistema: `●` verde animado + texto `emerald-600/60`

### BareLayout.astro (Sin nav)

**Uso:** Páginas de auth, onboarding
**Body:** `bg-tropical-bg text-tropical-text font-sans antialiased`
Solo renderiza `<slot />` sin header ni footer.

### Contenedor de página estándar

```html
<div class="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-6 sm:pb-10">
  <!-- contenido -->
</div>
```

---

## 9. Patrones de Página

### Login (`/[lang]/login`)

```
Fondo: bg-tropical-bg
Card: max-w-md bg-white rounded-xl sm:rounded-2xl shadow-xl border border-tropical-secondary/20 p-6 sm:p-8
  ├── Icono: w-16 h-16 bg-tropical-primary rounded-2xl shadow-lg (centrado)
  ├── Título: text-2xl sm:text-3xl font-bold text-tropical-text
  ├── Form: space-y-4 sm:space-y-6
  │   ├── Inputs: rounded-xl border-tropical-secondary/30 focus:ring-tropical-secondary
  │   └── Submit: w-full py-3.5 sm:py-4 text-base sm:text-lg
  ├── Divider: relative my-8 con label centrado
  └── Google SSO: w-full outline button con logo Google
```

**Error:** `text-tropical-accent bg-tropical-accent/10 p-3 rounded-lg border border-tropical-accent/20`

### Onboarding Wizard (`/[lang]/onboarding`)

```
Fondo: bg-[#f8fafc] + mesh gradient blur (tropical-primary, accent, secondary)
Font: Plus Jakarta Sans
Card: bg-white/70 backdrop-blur-[40px] border border-white/60 rounded-[48px] p-10 sm:p-14
  ├── Progress bar: 4 steps cuadrados rounded-2xl → active: bg-tropical-primary scale-110
  ├── Paso 1 (Foto): Avatar clickable w-36 h-36 rounded-[40px] con hover overlay cámara
  ├── Paso 2 (Username): Input + disponibilidad en tiempo real
  ├── Paso 3 (Config): Temas multi-select, ciudad, idioma, preferencias
  └── Paso 4 (Welcome): Animación checkmark, CTA entrar
```

### Home (`/[lang]/`)

```
Hero: HeroSearchBar — pill shape (rounded-full), max-w-4xl, bg-white shadow-lg
Grids: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8
CTA section: bg-tropical-primary rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-white text-center
Social feed: bg-white border border-gray-200 rounded-xl p-4 sm:p-6
```

### Search (`/[lang]/search`)

```
Layout: Sidebar (filtros) + Grid de salas
Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8
Vista mapa: MapSearch component (Leaflet)
Filtros: AdvancedFilters — precio, dificultad, temas, capacidad, duración
```

### Game Detail (`/[lang]/game/[id]`)

```
Hero: Imagen full-width aspect-[16/9]
Layout desktop: 2 columnas — detalle (7 cols) + BookingWidget sticky (5 cols)
Layout mobile: BookingWidget como bottom sheet
Badges: Temas, dificultad, rating, verificación
Stats grid: Jugadores | Duración | Dificultad | Valoración
Reviews: Avatar + rating + fecha + texto
```

---

## 10. Islands de React

Todos en `src/components/react/`. Hidratación según criticidad.

| Componente | Descripción | Hidratación |
|-----------|-------------|-------------|
| `Header.tsx` | Nav + auth dropdown + idioma | `client:load` |
| `AuthStatus.tsx` | Estado sesión + menú perfil | `client:load` |
| `HeroSearchBar.tsx` | Buscador hero con filtros rápidos | `client:load` |
| `BookingWidget.tsx` | Flujo reserva 4 pasos | `client:visible` |
| `AdvancedFilters.tsx` | Filtros sidebar (precio, dificultad, temas…) | `client:visible` |
| `MapSearch.tsx` | Mapa Leaflet con markers y popups | `client:visible` |
| `UserDashboard.tsx` | Dashboard jugador (stats, reservas, logros, XP) | `client:visible` |
| `OnboardingWizard.tsx` | Onboarding jugador (4 pasos) | `client:load` |
| `OnboardingEnterpriseWizard.tsx` | Onboarding empresa | `client:load` |
| `RegisterForm.tsx` | Registro + verificación email | `client:visible` |
| `ForgotPasswordForm.tsx` | Recuperación contraseña | `client:visible` |
| `ResetPasswordForm.tsx` | Nueva contraseña | `client:visible` |
| `RoomReorder.tsx` | Drag & drop de salas en rutas | `client:visible` |
| `RouteMap.tsx` | Mapa de ruta temática | `client:visible` |
| `SingleGameMap.tsx` | Mapa de ubicación de una sala | `client:visible` |
| `StartRouteButton.tsx` | CTA iniciar ruta | `client:visible` |
| `RouteBulkBooking.tsx` | Reservar varias salas de ruta | `client:visible` |
| `ChatWidget.tsx` | Chat en tiempo real | `client:visible` |
| `SocialFeed.tsx` | Feed de actividad (reseñas, logros) | `client:visible` |
| `NearYouSection.tsx` | Salas cercanas por geolocalización | `client:load` |

---

## 11. Patrones de Interacción

### Hover

```html
<!-- Elevación de sombra -->
<div class="hover:shadow-md transition-shadow duration-300">

<!-- Cambio de color (bg) -->
<div class="hover:bg-tropical-primary/10 transition-colors">

<!-- Escala de imagen -->
<img class="group-hover:scale-[1.03] transition-transform duration-300">

<!-- Escala de icono -->
<svg class="hover:scale-110 transition-transform">
```

### Focus (accesibilidad)

```html
<input class="focus-visible:ring-2 focus-visible:ring-tropical-primary/20 focus-visible:border-tropical-primary focus-visible:outline-none">
<button class="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
```

### Active / Press

```html
<button class="active:scale-[0.97] touch-manipulation">
```

Siempre usar `touch-manipulation` en elementos interactivos para eliminar el delay de 300ms en iOS.

### Disabled

```html
<button class="disabled:pointer-events-none disabled:opacity-50" disabled>
```

### Loading

```tsx
// Botón con loading
<Button disabled={loading}>
  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando...</> : "Reservar"}
</Button>

// Skeleton de card
<div class="skeleton h-48 w-full rounded-xl" />
```

### Error en formulario

```html
<div class="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-red-600 text-sm font-bold">
  Mensaje de error
</div>
```

---

## 12. Responsive / Breakpoints

### Breakpoints Tailwind

| Nombre | Ancho | Descripción |
|--------|-------|-------------|
| *(base)* | 0px | Mobile first |
| `sm` | 640px | Teléfonos grandes / tablets pequeñas |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Pantallas grandes |

### Patrones mobile-first

```html
<!-- Grid responsivo estándar -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

<!-- Tipografía responsiva -->
<h1 class="text-2xl sm:text-3xl lg:text-4xl font-black">

<!-- Padding responsivo -->
<div class="px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

<!-- Altura de botón (móvil más alto para toque) -->
<button class="h-11 sm:h-10">

<!-- Ocultar en móvil -->
<div class="hidden sm:flex">

<!-- Solo visible en móvil -->
<div class="sm:hidden">
```

### Decisiones de layout por dispositivo

| Elemento | Mobile | Desktop |
|----------|--------|---------|
| BookingWidget | Bottom sheet | Sidebar sticky |
| Filtros de búsqueda | Drawer / accordion | Sidebar fixed |
| Nav | Hamburger / bottom nav | Top nav horizontal |
| Mapa | Tab toggle (mapa / lista) | Split view |
| Onboarding | Full screen + cards | Centered card max-w-xl |

---

## 13. Iconos

**Librería:** Lucide React (`lucide-react`)

### Iconos frecuentes por categoría

| Categoría | Iconos |
|-----------|--------|
| **Navegación** | `ChevronLeft`, `ChevronRight`, `ChevronDown`, `ArrowRight`, `ArrowLeft`, `Menu`, `X` |
| **Usuario / Auth** | `User`, `LogOut`, `Settings`, `Lock`, `Eye`, `EyeOff`, `Mail`, `Phone` |
| **Sala / Juego** | `Puzzle`, `Timer`, `Users`, `Star`, `MapPin`, `Calendar`, `Clock` |
| **Acciones** | `Search`, `Heart`, `Share2`, `Download`, `Upload`, `Trash2`, `Edit` |
| **Estado** | `CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Loader2`, `Info` |
| **Negocio** | `Building2`, `CreditCard`, `Receipt`, `BarChart3`, `Globe`, `Tag` |
| **Social** | `MessageCircle`, `Bell`, `Trophy`, `Award`, `Gift`, `Sparkles` |
| **Niveles** | `Target`, `Leaf`, `Crown`, `GraduationCap`, `Zap`, `Shield`, `Rocket` |

### Uso estándar

```tsx
import { Star, MapPin, Timer } from 'lucide-react';

// Tamaños
<Star className="w-4 h-4" />         // small (inline, badges)
<MapPin className="w-5 h-5" />       // default (botones, labels)
<Timer className="w-6 h-6" />        // medium (cards, headers)
<Trophy className="w-8 h-8" />       // large (features, CTAs)

// Con color
<Star className="w-4 h-4 text-tropical-accent fill-tropical-accent" />
<MapPin className="w-4 h-4 text-tropical-text/40" />

// Spinner
<Loader2 className="w-5 h-5 animate-spin text-tropical-primary" />
```

---

## 14. Reglas Críticas

### ❌ NUNCA hacer

```html
<!-- Hardcodear colores hex -->
<div style="background: #0097b2">

<!-- Usar colores genéricos de Tailwind directamente -->
<p class="text-gray-700">
<div class="bg-blue-500">
<button class="border-gray-200">

<!-- Touch targets menores de 44px -->
<button class="h-8 w-8">   ← muy pequeño para móvil

<!-- font-size menor de 16px en inputs (zoom iOS) -->
<input class="text-sm">   ← causa zoom en iOS, usar text-base mínimo
```

### ✅ SIEMPRE hacer

```html
<!-- Usar tokens tropical-* -->
<div class="bg-tropical-primary text-white">
<p class="text-tropical-text/60">
<button class="border-tropical-secondary/30">

<!-- Touch manipulation en interactivos -->
<button class="touch-manipulation active:scale-[0.97]">

<!-- Focus visible para accesibilidad -->
<button class="focus-visible:ring-2 focus-visible:ring-tropical-primary/20">

<!-- Mobile first en responsive -->
<div class="text-sm sm:text-base">     ✅
<div class="sm:text-base text-sm">     ✅ (equivalente)
<div class="text-base sm:text-sm">     ❌ (desktop first)
```

### Jerarquía de variantes de botón

```
Acción principal única → variant="default" o variant="tropical"
Acción urgente / conversión → variant="cta" (naranja)
Alternativa sin peso visual → variant="outline"
Acción terciaria o navegación → variant="ghost" o variant="link"
Eliminar / acción destructiva → variant="destructive"
```

### cn() para combinar clases

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class another-class",
  condition && "conditional-class",
  variant === "primary" && "primary-class",
  className  // siempre al final para permitir override
)}>
```

---

*Generado automáticamente a partir del código fuente. Ver `src/styles/global.css` y `src/components/ui/` para la fuente de verdad.*
