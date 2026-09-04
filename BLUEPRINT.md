# Hello Sushi — Blueprint & Operating Guide

## What it is

A QR menu + ordering system for one restaurant. Guests scan a table QR, browse
the menu, order, and track it. Staff run everything from an admin dashboard.
5 languages. Installable as an app.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite, one file `hello-sushi.jsx`, hosted on **Vercel** |
| Backend | **Supabase** — Postgres + Auth + Realtime + Storage |
| Data layer | `src/db.js` (all reads/writes), `src/supabaseClient.js` |
| Schema | `supabase/schema.sql` (tables, RLS, functions, storage) |

## How it flows

```
Guest scans  ?table=NN  →  browses menu  →  places order
        │                                        │
        │                          place_order() re-prices on the server
        ▼                                        ▼
  order lands in Supabase  ──realtime──►  Kitchen board (chime + notification)
        │
        ▼
  Guest tracks it at  ?order=<token>   (get_order, polls every 12s)
```

Customers can **never read the orders table** — only their own order, by token.

---

## Running the restaurant (admin)

Open the site → **Admin** (top bar) → sign in.

| Task | Where |
|---|---|
| Accept / progress / cancel orders | **Kitchen** or **Orders** |
| Confirm / reject reservations | **Reservations** |
| Add / edit / hide menu items, photos, prices | **Menu** |
| Add / reorder categories | **Categories** |
| Print table QR codes | **Tables & QR** → "Print all" |
| Hours, address, phone, tax, payment methods, alerts | **Settings** |
| Homepage / About text, promo code, popular picks | **Content** |
| Clear old orders / reservations | "Clear history" button on each tab |

Menu/photo/text changes save to Supabase and appear on every device instantly.

## Add or remove a staff account

Supabase dashboard → **Authentication → Users** → **Add user** →
check **"Auto Confirm User"**. To remove: delete the user.
(There is no public sign-up.)

## Change branding / logo

- Text, hours, links, payments → **Settings** / **Content** tabs
- Logo file → replace `public/logo.png`, redeploy

---

## Deploying a change

The repo auto-deploys. To ship an edit:

```bash
git add -A
git commit -m "…"
git push          # Vercel builds & deploys main automatically
```

Environment variables live in Vercel → Settings → Environment Variables
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

## First-time / fresh database setup

See [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md). Short version:

1. Run `supabase/schema.sql` in the Supabase SQL Editor (safe to re-run anytime)
2. Create a staff user (step above)
3. App → Admin → **Settings → Initialize database** (loads the built-in menu)

## If something breaks

1. Re-run `supabase/schema.sql` — fixes most backend issues, changes nothing you edited
2. Check the Vercel deployment succeeded (dashboard → Deployments)
3. Confirm the two env vars are set in Vercel
4. Support: **Zam** — WhatsApp QR on the admin sign-in screen

## Not included

Real card charging (Stripe/Square), analytics dashboard, multi-location.
"Pay now" payment methods just link out to Venmo / a payment link / QR.
