import { supabase, supabaseConfigured } from "./supabaseClient.js";

export { supabaseConfigured };

/* ------------------------------------------------------------------ *
 *  Row <-> app-object mappers
 *  DB stores a few promoted columns (for filtering + RLS) plus the
 *  full rich object in a `data` jsonb column. Timestamps are epoch
 *  millis (bigint) so the UI code needs no date conversions.
 * ------------------------------------------------------------------ */

const num = (v) => (v == null ? 0 : Number(v));

function catToRow(c) {
  return { id: c.id, order: c.order ?? 0, active: c.active !== false, data: c };
}
function rowToCat(r) {
  return { ...(r.data || {}), id: r.id, order: r.order, active: r.active };
}

function itemToRow(i, sortFallback = 0) {
  return {
    id: i.id,
    category: i.category,
    available: i.available !== false,
    sort: i.sort ?? sortFallback,
    data: i,
  };
}
function rowToItem(r) {
  return { ...(r.data || {}), id: r.id, category: r.category, available: r.available, sort: r.sort };
}

function orderToRow(o) {
  return {
    status: o.status || "New",
    placed_at: o.placedAt ?? Date.now(),
    est_minutes: o.estMinutes ?? 20,
    table_label: o.table ?? null,
    name: o.name ?? null,
    phone: o.phone ?? null,
    email: o.email ?? null,
    instructions: o.instructions ?? null,
    payment: o.payment ?? null,
    order_type: o.orderType ?? null,
    subtotal: num(o.subtotal),
    tax: num(o.tax),
    service: num(o.service),
    delivery_fee: num(o.deliveryFee),
    discount: num(o.discount),
    total: num(o.total),
    items: o.items || [],
  };
}
function rowToOrder(r) {
  return {
    id: r.id,
    orderNumber: r.order_number,
    table: r.table_label,
    items: r.items || [],
    name: r.name || "",
    phone: r.phone || "",
    email: r.email || "",
    instructions: r.instructions || "",
    payment: r.payment || "",
    orderType: r.order_type || "",
    subtotal: num(r.subtotal),
    tax: num(r.tax),
    service: num(r.service),
    deliveryFee: num(r.delivery_fee),
    discount: num(r.discount),
    total: num(r.total),
    status: r.status,
    placedAt: Number(r.placed_at),
    estMinutes: r.est_minutes,
  };
}

function resToRow(r) {
  return {
    name: r.name ?? null,
    phone: r.phone ?? null,
    email: r.email ?? null,
    date: r.date ?? null,
    time: r.time ?? null,
    guests: r.guests ?? null,
    request: r.request ?? null,
    status: r.status || "Pending",
    created_at: r.createdAt ?? Date.now(),
  };
}
function rowToRes(r) {
  return {
    id: r.id,
    name: r.name || "",
    phone: r.phone || "",
    email: r.email || "",
    date: r.date || "",
    time: r.time || "",
    guests: r.guests || 0,
    request: r.request || "",
    status: r.status,
    createdAt: Number(r.created_at),
  };
}

/* ------------------------------------------------------------------ *
 *  Reads
 * ------------------------------------------------------------------ */

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function fetchCategories() {
  return (unwrap(await supabase.from("categories").select("*").order("order")) || []).map(rowToCat);
}
export async function fetchMenuItems() {
  return (unwrap(await supabase.from("menu_items").select("*").order("sort")) || []).map(rowToItem);
}
export async function fetchOrders() {
  return (unwrap(await supabase.from("orders").select("*").order("placed_at")) || []).map(rowToOrder);
}
export async function fetchReservations() {
  return (unwrap(await supabase.from("reservations").select("*").order("created_at", { ascending: false })) || []).map(rowToRes);
}
export async function fetchContent() {
  const r = unwrap(await supabase.from("content").select("data").eq("id", "default").maybeSingle());
  return r?.data || null;
}
export async function fetchSettings() {
  const r = unwrap(await supabase.from("settings").select("data").eq("id", "default").maybeSingle());
  return r?.data || null;
}

export async function loadAll() {
  const [categories, menuItems, orders, reservations, content, settings] = await Promise.all([
    fetchCategories(),
    fetchMenuItems(),
    fetchOrders(),
    fetchReservations(),
    fetchContent(),
    fetchSettings(),
  ]);
  return { categories, menuItems, orders, reservations, content, settings };
}

/* ------------------------------------------------------------------ *
 *  Writes
 * ------------------------------------------------------------------ */

const run = async (query) => {
  const { error } = await query;
  if (error) throw error;
};

export const db = {
  saveMenuItem: (item) => run(supabase.from("menu_items").upsert(itemToRow(item))),
  deleteMenuItem: (id) => run(supabase.from("menu_items").delete().eq("id", id)),

  saveCategory: (cat) => run(supabase.from("categories").upsert(catToRow(cat))),
  deleteCategory: (id) => run(supabase.from("categories").delete().eq("id", id)),
  saveCategories: (cats) => run(supabase.from("categories").upsert(cats.map(catToRow))),

  async createOrder(order) {
    const { data, error } = await supabase.from("orders").insert(orderToRow(order)).select().single();
    if (error) throw error;
    return rowToOrder(data);
  },
  updateOrderStatus: (id, status) => run(supabase.from("orders").update({ status }).eq("id", id)),

  createReservation: (res) => run(supabase.from("reservations").insert(resToRow(res))),
  updateReservation: (id, status) => run(supabase.from("reservations").update({ status }).eq("id", id)),

  saveContent: (data) => run(supabase.from("content").upsert({ id: "default", data })),
  saveSettings: (data) => run(supabase.from("settings").upsert({ id: "default", data })),
};

/**
 * Push the in-code defaults to Supabase to populate a fresh database.
 * Uses INSERT ... ON CONFLICT DO NOTHING, so rows that already exist
 * (e.g. an item whose photo you edited) are kept untouched — this is
 * safe to run again to backfill anything missing. Requires an
 * authenticated (staff) session.
 */
const keep = { onConflict: "id", ignoreDuplicates: true };
export async function seedFromDefaults({ categories, menuItems, content, settings }) {
  await run(supabase.from("categories").upsert(categories.map(catToRow), keep));
  await run(supabase.from("menu_items").upsert(menuItems.map((i, idx) => itemToRow(i, idx)), keep));
  await run(supabase.from("content").upsert({ id: "default", data: content }, keep));
  await run(supabase.from("settings").upsert({ id: "default", data: settings }, keep));
}

/* ------------------------------------------------------------------ *
 *  Realtime — on any change to a table, re-run its refetcher
 * ------------------------------------------------------------------ */

export function watch(refetchers) {
  if (!supabaseConfigured) return () => {};
  const map = {
    orders: "onOrders",
    reservations: "onReservations",
    menu_items: "onMenu",
    categories: "onCategories",
    content: "onContent",
    settings: "onSettings",
  };
  const channel = supabase.channel("hello-sushi-db");
  for (const [table, key] of Object.entries(map)) {
    const cb = refetchers[key];
    if (cb) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => cb());
    }
  }
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

/* ------------------------------------------------------------------ *
 *  Auth
 * ------------------------------------------------------------------ */

export const auth = {
  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session || null;
  },
  onChange: (cb) => supabase.auth.onAuthStateChange((_event, session) => cb(session || null)),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
};
