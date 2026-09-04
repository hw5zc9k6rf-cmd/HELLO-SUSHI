-- ============================================================
--  Hello Sushi — Supabase schema
--  Run in:  Supabase Dashboard -> SQL Editor -> New query -> Run
--  Safe to re-run (idempotent).
-- ============================================================

-- ---------- order-number sequence (HS220, HS221, ...) -------------
create sequence if not exists public.order_seq start 220;

-- ---------- tables ----------------------------------------------
create table if not exists public.categories (
  id         text primary key,
  "order"    int     not null default 0,
  active     boolean not null default true,
  data       jsonb   not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id         text primary key,
  category   text    not null,
  available  boolean not null default true,
  sort       int     not null default 0,
  data       jsonb   not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text unique not null default ('HS' || nextval('public.order_seq')),
  status        text   not null default 'New',
  placed_at     bigint not null,
  est_minutes   int    not null default 20,
  table_label   text,
  name          text,
  phone         text,
  email         text,
  instructions  text,
  payment       text,
  order_type    text,
  subtotal      numeric not null default 0,
  tax           numeric not null default 0,
  service       numeric not null default 0,
  delivery_fee  numeric not null default 0,
  discount      numeric not null default 0,
  total         numeric not null default 0,
  items         jsonb   not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists public.reservations (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  phone      text,
  email      text,
  date       text,
  time       text,
  guests     int,
  request    text,
  status     text   not null default 'Pending',
  created_at bigint not null
);

create table if not exists public.content (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id         text primary key default 'default',
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- row level security --------------------------------
alter table public.categories   enable row level security;
alter table public.menu_items   enable row level security;
alter table public.orders       enable row level security;
alter table public.reservations enable row level security;
alter table public.content      enable row level security;
alter table public.settings     enable row level security;

-- Public catalog: anyone reads, only signed-in staff writes
drop policy if exists categories_read  on public.categories;
drop policy if exists categories_write on public.categories;
create policy categories_read  on public.categories for select to anon, authenticated using (true);
create policy categories_write on public.categories for all    to authenticated using (true) with check (true);

drop policy if exists menu_items_read  on public.menu_items;
drop policy if exists menu_items_write on public.menu_items;
create policy menu_items_read  on public.menu_items for select to anon, authenticated using (true);
create policy menu_items_write on public.menu_items for all    to authenticated using (true) with check (true);

drop policy if exists content_read  on public.content;
drop policy if exists content_write on public.content;
create policy content_read  on public.content for select to anon, authenticated using (true);
create policy content_write on public.content for all    to authenticated using (true) with check (true);

drop policy if exists settings_read  on public.settings;
drop policy if exists settings_write on public.settings;
create policy settings_read  on public.settings for select to anon, authenticated using (true);
create policy settings_write on public.settings for all    to authenticated using (true) with check (true);

-- Orders: a customer (anon) may place an order and read it back to track
-- it; only staff may change or delete. Order numbers are not secret.
drop policy if exists orders_read   on public.orders;
drop policy if exists orders_insert on public.orders;
drop policy if exists orders_update on public.orders;
drop policy if exists orders_delete on public.orders;
create policy orders_read   on public.orders for select to anon, authenticated using (true);
create policy orders_insert on public.orders for insert to anon, authenticated with check (true);
create policy orders_update on public.orders for update to authenticated using (true) with check (true);
create policy orders_delete on public.orders for delete to authenticated using (true);

-- Reservations: a customer may request one; only staff may read / change.
drop policy if exists reservations_insert on public.reservations;
drop policy if exists reservations_read   on public.reservations;
drop policy if exists reservations_update on public.reservations;
drop policy if exists reservations_delete on public.reservations;
create policy reservations_insert on public.reservations for insert to anon, authenticated with check (true);
create policy reservations_read   on public.reservations for select to authenticated using (true);
create policy reservations_update on public.reservations for update to authenticated using (true) with check (true);
create policy reservations_delete on public.reservations for delete to authenticated using (true);

-- ---------- realtime ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['orders','reservations','menu_items','categories','content','settings']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------- storage: "menu" bucket (item photos, payment QR) --
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
