# EscapeMaster Market — Frontend

Marketplace B2C donde los jugadores buscan, filtran y reservan salas de escape room.

**URL:** escapemaster.es

## Stack

- Astro 5 SSR (`output: 'server'`, `@astrojs/vercel`)
- React 19 (islands: `client:load`, `client:visible`)
- Tailwind CSS v4
- Nanostores (estado client-side)
- Leaflet (MapSearch)
- i18n: `es`/`en`

## Desarrollo

```bash
npm install
cp .env.example .env  # Configura tus variables de entorno
npm run dev           # Inicia en http://localhost:4321
```

## Variables de entorno clave

- `PUBLIC_API_URL` — URL de la API (escapemaster-rooms-api), default `http://localhost:8000`
- `DATABASE_URL` — PostgreSQL (para SSR server-side rendering)

## Paleta Tropical

Siempre usar clases `tropical-*`:
- `bg-tropical-primary` — #0097b2 (cyan)
- `bg-tropical-accent` — #f39c12 (orange)
- `text-tropical-text` — #0d3d34

Nunca hardcodear colores hex ni usar clases Tailwind genéricas.
