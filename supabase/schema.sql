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
  scheduled_for bigint,  -- epoch ms for a pre-order; null = ASAP
  created_at    timestamptz not null default now()
);
alter table public.orders add column if not exists scheduled_for bigint;

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

-- Orders. A customer is NEVER allowed to read the orders table directly
-- (it holds names / phones / emails of every customer). They place an
-- order through the place_order() function and track it through
-- get_order(token) using the unguessable token they were handed. Only
-- signed-in staff can list, change or delete orders.
alter table public.orders add column if not exists track_token uuid not null default gen_random_uuid();
create unique index if not exists orders_track_token_idx on public.orders (track_token);

drop policy if exists orders_read   on public.orders;
drop policy if exists orders_select on public.orders;
drop policy if exists orders_insert on public.orders;
drop policy if exists orders_update on public.orders;
drop policy if exists orders_delete on public.orders;
create policy orders_select on public.orders for select to authenticated using (true);
create policy orders_insert on public.orders for insert to authenticated with check (true);
create policy orders_update on public.orders for update to authenticated using (true) with check (true);
create policy orders_delete on public.orders for delete to authenticated using (true);

-- Place an order (anon-callable). The SERVER prices every line from the
-- menu_items table (ignoring any prices the client sent), applies tax /
-- service / delivery / promo from settings + content, forces status='New'
-- and a server timestamp, and rebuilds the items list so it matches the
-- total. Returns the new row incl. track_token.
create or replace function public.place_order(p_order jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  r             public.orders;
  s_data       jsonb := coalesce((select data from public.settings where id = 'default'), '{}'::jsonb);
  c_data       jsonb := coalesce((select data from public.content  where id = 'default'), '{}'::jsonb);
  tax_rate     numeric := greatest(coalesce((s_data->>'taxRate')::numeric, 0), 0);
  service_rate numeric := greatest(coalesce((s_data->>'serviceRate')::numeric, 0), 0);
  delivery_cfg numeric := greatest(coalesce((s_data->>'deliveryFee')::numeric, 0), 0);
  promo_code   text := upper(trim(coalesce(c_data->>'promoCode', '')));
  promo_pct    numeric := greatest(least(coalesce((c_data->>'promoDiscountPct')::numeric, 0), 100), 0);
  o_type       text := left(coalesce(p_order->>'order_type', ''), 40);
  ln           jsonb;
  mi           public.menu_items;
  q            int;
  lp           numeric;
  sz_name      text;
  dlt          numeric;
  ad           jsonb;
  adp          numeric;
  clean_ads    jsonb;
  out_items    jsonb := '[]'::jsonb;
  subtotal     numeric := 0;
  svc          numeric := 0;
  delv         numeric := 0;
  disc         numeric := 0;
  tax_amt      numeric := 0;
  grand        numeric := 0;
begin
  for ln in select elem from jsonb_array_elements(coalesce(p_order->'items', '[]'::jsonb)) as elem
  loop
    select * into mi from public.menu_items where id = (ln->>'itemId') limit 1;
    if not found or mi.available is false then
      continue;
    end if;

    q  := least(greatest(coalesce((ln->>'qty')::int, 1), 1), 50);
    lp := coalesce((mi.data->>'price')::numeric, 0);

    sz_name := ln->>'size';
    if sz_name is not null and sz_name <> '' then
      select coalesce((sz->>'delta')::numeric, 0) into dlt
      from jsonb_array_elements(coalesce(mi.data->'sizes', '[]'::jsonb)) as sz
      where sz->>'name' = sz_name
      limit 1;
      lp := lp + coalesce(dlt, 0);
    end if;

    clean_ads := '[]'::jsonb;
    for ad in select elem from jsonb_array_elements(coalesce(ln->'addons', '[]'::jsonb)) as elem
    loop
      select coalesce((a->>'price')::numeric, 0) into adp
      from jsonb_array_elements(coalesce(mi.data->'addons', '[]'::jsonb)) as a
      where a->>'en' = ad->>'en'
      limit 1;
      if found then
        lp := lp + coalesce(adp, 0);
        clean_ads := clean_ads || jsonb_build_object('en', ad->>'en', 'price', coalesce(adp, 0));
      end if;
    end loop;

    lp := round(greatest(lp, 0), 2);
    subtotal := subtotal + lp * q;

    out_items := out_items || jsonb_build_object(
      'cartId', coalesce(ln->>'cartId', gen_random_uuid()::text),
      'itemId', mi.id,
      'name',  coalesce(mi.data->>'en', ln->>'name'),
      'icon',  mi.data->>'icon',
      'image', coalesce(mi.data->>'image', ''),
      'size',  sz_name,
      'spice', ln->>'spice',
      'addons', clean_ads,
      'instructions', left(coalesce(ln->>'instructions', ''), 200),
      'unitPrice', lp,
      'qty', q
    );
  end loop;

  if subtotal <= 0 then
    raise exception 'No valid items in order';
  end if;

  if o_type = 'Delivery' then
    delv := delivery_cfg;
  end if;
  svc := round(subtotal * service_rate, 2);
  if promo_code <> '' and upper(trim(coalesce(p_order->>'promo_code', ''))) = promo_code then
    disc := round(subtotal * (promo_pct / 100.0), 2);
  end if;
  tax_amt := round(subtotal * tax_rate, 2);
  grand   := greatest(round(subtotal, 2) + tax_amt + svc + delv - disc, 0);

  insert into public.orders (
    status, placed_at, est_minutes, table_label, name, phone, email,
    instructions, payment, order_type, subtotal, tax, service,
    delivery_fee, discount, total, items, scheduled_for
  ) values (
    'New',
    (extract(epoch from now()) * 1000)::bigint,
    least(greatest(coalesce((p_order->>'est_minutes')::int, 20), 1), 240),
    nullif(p_order->>'table_label',''),
    left(nullif(p_order->>'name',''), 120),
    left(nullif(p_order->>'phone',''), 40),
    left(nullif(p_order->>'email',''), 160),
    left(nullif(p_order->>'instructions',''), 500),
    left(nullif(p_order->>'payment',''), 80),
    o_type,
    round(subtotal, 2), tax_amt, svc, delv, disc, round(grand, 2),
    out_items,
    (p_order->>'scheduled_for')::bigint
  ) returning * into r;
  return r;
end;
$$;
revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- Fetch one order by its unguessable tracking token (anon-callable).
create or replace function public.get_order(p_token uuid)
returns public.orders
language sql
security definer
set search_path = public
as $$
  select * from public.orders where track_token = p_token limit 1;
$$;
revoke all on function public.get_order(uuid) from public;
grant execute on function public.get_order(uuid) to anon, authenticated;

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
