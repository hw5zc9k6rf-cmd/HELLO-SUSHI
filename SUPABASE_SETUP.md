# Hello Sushi — Supabase setup

The app loads all live data (menu, categories, orders, reservations, editable
content, settings) from Supabase, with realtime updates and email/password
sign-in for staff.

## 1. Environment variables

`.env` already exists with this project's values:

```
VITE_SUPABASE_URL=https://awikpblcavcmafwjlubm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

If you ever need to recreate it: copy `.env.example` to `.env` and fill in

- **VITE_SUPABASE_URL** — Supabase → Project Settings → **Data API** → Project URL
  (or `https://<PROJECT_REF>.supabase.co`)
- **VITE_SUPABASE_PUBLISHABLE_KEY** — Supabase → Project Settings → **API Keys** →
  the key starting `sb_publishable_`. Safe to expose in the browser; row-level
  security still applies. **Never** put the `sb_secret_` key here.

`.env` is git-ignored. Restart `npm run dev` after changing it.

## 2. Create the database

Supabase Dashboard → **SQL Editor** → New query → paste the whole of
[`supabase/schema.sql`](supabase/schema.sql) → **Run**.

This creates the tables, row-level-security policies, the `HS###` order-number
sequence, and adds every table to the realtime publication. It is safe to
re-run.

## 3. Create a staff account

Supabase Dashboard → **Authentication** → **Users** → **Add user** →
enter your email + a password → create.

There is no public sign-up — staff accounts are only made here. Anyone with an
account can use the full admin dashboard.

> Optional: Authentication → Providers → Email → turn **Confirm email** off so
> new staff accounts work immediately without a confirmation link.

## 4. Load the starting menu

```
npm install
npm run dev
```

Open the app → top bar **Admin** → sign in with the account from step 3 →
**Settings** tab → **Initialize database**.

This loads the built-in menu, categories, homepage content and settings into
Supabase. Run it once. It uses "insert if missing" — anything that already
exists (including edits you've made) is kept — so it's always safe to run again
to backfill. After this, everything is edited from the admin dashboard and
persists.

Until you run it, the app shows the built-in menu in **preview mode** (an amber
banner) and the Menu / Categories / Content admin tabs are locked.

## Photo storage

Menu-item photos and payment QR images upload to a public Supabase Storage
bucket called **`menu`** (resized to ~1400px JPEG first). The `supabase/schema.sql`
above creates it. If you set the project up before this was added, run just this
in the SQL Editor:

```sql
insert into storage.buckets (id, name, public)
  values ('menu', 'menu', true)
  on conflict (id) do update set public = true;

drop policy if exists "menu public read"  on storage.objects;
drop policy if exists "menu staff insert" on storage.objects;
drop policy if exists "menu staff update" on storage.objects;
drop policy if exists "menu staff delete" on storage.objects;
create policy "menu public read"  on storage.objects for select using (bucket_id = 'menu');
create policy "menu staff insert" on storage.objects for insert to authenticated with check (bucket_id = 'menu');
create policy "menu staff update" on storage.objects for update to authenticated using (bucket_id = 'menu') with check (bucket_id = 'menu');
create policy "menu staff delete" on storage.objects for delete to authenticated using (bucket_id = 'menu');
```

Anyone can view the images (public bucket); only signed-in staff can upload,
replace or delete. If the bucket is missing, uploads fall back to storing the
image inline in the row (still works, just heavier).

## How access is enforced (RLS)

| Table | anonymous customer | signed-in staff |
|---|---|---|
| categories, menu_items, content, settings | read | read + write |
| orders | create + read (for order tracking) | full |
| reservations | create only | full |

Order numbers are not treated as secret — a customer can load
`?order=HS231` to track any order. If you want to lock that down later, replace
the `orders_read` policy with a `security definer` RPC that takes the order
number; note that also disables live status updates on the customer tracking
screen.

## Deploying

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as build-time env
vars in your host (Vercel / Netlify / etc.), then `npm run build`.
