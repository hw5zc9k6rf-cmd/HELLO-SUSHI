# Hello Sushi — QR menu & ordering

Mobile-first QR menu, online ordering, table management and admin dashboard for
**Hello Sushi** (Asian Cuisine), 3979 Nolensville Pike, Nashville TN.

Single-file React app ([`hello-sushi.jsx`](hello-sushi.jsx)) on Vite, backed by
Supabase (Postgres + Auth + Realtime). Five languages (en / mm / zh / es / th).

## Develop

```bash
npm install
cp .env.example .env   # then fill in the two values
npm run dev
```

## Environment

| Var | Where |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → Data API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (`sb_publishable_…`) |

Set both as build-time env vars in the host (Vercel etc.) for deploys.

## Backend setup

See [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) — run `supabase/schema.sql`, create a
staff user, then use **Admin → Settings → Initialize database** to load the menu.

## Build

```bash
npm run build     # -> dist/
```
