import { useState, useMemo, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  loadAll, fetchOrders, fetchReservations, fetchMenuItems, fetchCategories,
  fetchContent, fetchSettings, db, watch, auth, seedFromDefaults, supabaseConfigured,
} from "./src/db.js";
import {
  Search, ShoppingCart, X, Plus, Minus, Leaf, Flame, ChevronLeft,
  Clock, Check, Bell, QrCode as QrIcon, LayoutGrid, ClipboardList, Table2,
  Utensils, Star, CircleDot, Printer, ChevronRight, Globe, Ban,
  Heart, ChevronDown, ArrowUpDown, Sparkles, MapPin, Phone, Clock3,
  Home, BookOpen, CalendarDays, Users, Settings as SettingsIcon, Lock,
  Pencil, Trash2, ArrowUp, ArrowDown, Mail, Share2, ListOrdered,
  FolderTree, LogOut, LayoutDashboard, Copy, Download, ExternalLink
} from "lucide-react";

/* ---------------------------------------------------------- languages */

const LANGS = [
  { code: "en", label: "English" },
  { code: "mm", label: "မြန်မာ" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "th", label: "ไทย" },
];
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const tr = (obj, lang) => (obj && (obj[lang] || obj.en)) || "";
const trd = (obj, lang) => (obj && (obj["desc" + capFirst(lang)] || obj.descEn)) || "";

/* ---------------------------------------------------------------- data */

const CATS = [
  { id: "Starters", order: 1, active: true, en: "Starters", mm: "စတင်စားစရာများ", zh: "开胃菜", es: "Entrantes", th: "อาหารเรียกน้ำย่อย", icon: "🥢" },
  { id: "Soups", order: 2, active: true, en: "Soups", mm: "ဟင်းချိုများ", zh: "汤类", es: "Sopas", th: "ซุป", icon: "🍲" },
  { id: "Rice & Noodles", order: 3, active: true, en: "Rice & Noodles", mm: "ထမင်းနှင့် ခေါက်ဆွဲ", zh: "饭与面", es: "Arroz y fideos", th: "ข้าวและเส้น", icon: "🍜" },
  { id: "Burmese Curry", order: 4, active: true, en: "Burmese Curry", mm: "မြန်မာဟင်း", zh: "缅式咖喱", es: "Curry birmano", th: "แกงพม่า", icon: "🍛" },
  { id: "Hello Specials", order: 5, active: true, en: "Hello Specials", mm: "Hello အထူးဟင်းလျာများ", zh: "招牌特色菜", es: "Especiales Hello", th: "เมนูพิเศษ", icon: "⭐" },
  { id: "Raw Classic Rolls", order: 6, active: true, en: "Raw Classic Rolls", mm: "အစိမ်း ရိုးရိုးရိုးလ်", zh: "生鱼经典卷", es: "Rollos crudos clásicos", th: "โรลดิบคลาสสิก", icon: "🍣" },
  { id: "Cooked Classic Rolls", order: 7, active: true, en: "Cooked Classic Rolls", mm: "အချက် ရိုးရိုးရိုးလ်", zh: "熟食经典卷", es: "Rollos cocidos clásicos", th: "โรลสุกคลาสสิก", icon: "🍥" },
  { id: "Raw Specialty Rolls", order: 8, active: true, en: "Raw Specialty Rolls", mm: "အစိမ်း အထူးရိုးလ်", zh: "生鱼特色卷", es: "Rollos crudos especiales", th: "โรลดิบพิเศษ", icon: "🌈" },
  { id: "Cooked Special Rolls", order: 9, active: true, en: "Cooked Special Rolls", mm: "အချက် အထူးရိုးလ်", zh: "熟食特色卷", es: "Rollos especiales cocidos", th: "โรลสุกพิเศษ", icon: "🐉" },
  { id: "Deep Fried Rolls", order: 10, active: true, en: "Deep Fried Rolls", mm: "အကြော် ရိုးလ်", zh: "炸卷", es: "Rollos fritos", th: "โรลทอด", icon: "🍤" },
  { id: "A La Carte", order: 11, active: true, en: "A La Carte", mm: "တစ်ခုချင်းစီ", zh: "单点", es: "A la carta", th: "อาลาคาร์ต", icon: "🐟" },
  { id: "Poke Bowls", order: 12, active: true, en: "Poke Bowls", mm: "ပိုကီ ဘောလ်", zh: "波奇饭碗", es: "Poke bowls", th: "โพเกโบวล์", icon: "🥗" },
  { id: "Sushi Combos", order: 13, active: true, en: "Sushi Combos", mm: "ဆူရှီ စက်များ", zh: "寿司拼盘", es: "Combos de sushi", th: "ชุดซูชิ", icon: "🍱" },
  { id: "Desserts", order: 14, active: true, en: "Desserts", mm: "အချိုပွဲများ", zh: "甜点", es: "Postres", th: "ของหวาน", icon: "🍮" },
  { id: "Beverages", order: 15, active: true, en: "Beverages", mm: "အဖျော်ယမကာများ", zh: "饮料", es: "Bebidas", th: "เครื่องดื่ม", icon: "🥤" },
];

const ADD_EDAMAME = { en: "Side edamame", mm: "အီဒါမာမေ", zh: "毛豆", es: "Edamame", th: "ถั่วแระ", price: 3.5 };
const ADD_MISO = { en: "Miso soup", mm: "မီဆိုဟင်းချို", zh: "味噌汤", es: "Sopa de miso", th: "ซุปมิโซะ", price: 2.5 };
const ADD_SPICY_MAYO = { en: "Spicy mayo", mm: "အစပ်မေယို", zh: "辣蛋黄酱", es: "Mayonesa picante", th: "มาโยเผ็ด", price: 0.75 };
const ADD_TERIYAKI = { en: "Extra teriyaki sauce", mm: "တဲရိယာကီဆော့စ် ထပ်", zh: "照烧汁", es: "Salsa teriyaki extra", th: "ซอสเทริยากิเพิ่ม", price: 0.5 };
const ADD_RICE = { en: "Extra steamed rice", mm: "ထမင်းထပ်", zh: "加饭", es: "Arroz extra", th: "ข้าวเพิ่ม", price: 2 };
const ADD_AVOCADO = { en: "Add avocado", mm: "ထောပတ်သီးထည့်", zh: "加牛油果", es: "Añadir aguacate", th: "เพิ่มอะโวคาโด", price: 1.5 };

const ADD_EGG = { en: "Extra egg", mm: "ကြက်ဥ ထပ်", zh: "加蛋", es: "Huevo extra", th: "เพิ่มไข่", price: 0.5 };
const ADD_MEAT = { en: "Extra meat", mm: "အသား ထပ်", zh: "加肉", es: "Carne extra", th: "เพิ่มเนื้อ", price: 1.5 };
const ADD_STEAMED_RICE = { en: "Extra rice", mm: "ထမင်း ထပ်", zh: "加饭", es: "Arroz extra", th: "เพิ่มข้าว", price: 0.5 };
const ADD_NOODLES = { en: "Extra noodles", mm: "ခေါက်ဆွဲ ထပ်", zh: "加面", es: "Fideos extra", th: "เพิ่มเส้น", price: 1 };
const ADD_SAUCE = { en: "Additional sauce", mm: "အနှစ်ရည် ထပ်", zh: "加酱", es: "Salsa adicional", th: "เพิ่มน้ำซอส", price: 0.3 };
const ADD_VEG = { en: "Extra vegetables", mm: "ဟင်းသီးဟင်းရွက် ထပ်", zh: "加菜", es: "Verduras extra", th: "เพิ่มผัก", price: 0.75 };
const ADD_SHALLOTS = { en: "Crispy shallots", mm: "ကြက်သွန်ကြော်", zh: "葱酥", es: "Chalota crujiente", th: "หอมเจียว", price: 0.3 };
const ADD_BOILED_EGG = { en: "Boiled egg", mm: "ကြက်ဥပြုတ်", zh: "水煮蛋", es: "Huevo cocido", th: "ไข่ต้ม", price: 0.5 };

const SIZES_RAMEN = [{ name: "Regular", delta: 0 }, { name: "Large", delta: 2.5 }];
const SIZES_DRINK = [{ name: "Regular", delta: 0 }, { name: "Large", delta: 0.75 }];
const SIZES_SRL = [{ name: "Small", delta: -0.5 }, { name: "Regular", delta: 0 }, { name: "Large", delta: 1 }];
const SPICE_OPTIONS = ["No spice", "Mild", "Medium", "Spicy", "Extra spicy"];

/* Rice & Noodles are one dish with a protein choice that sets the price */
const CHOICE_RN_PROTEIN = [{ name: "Vegetable, Tofu, or Chicken", delta: 0 }, { name: "Beef or Shrimp", delta: 1 }, { name: "Combo", delta: 3 }];
/* Hello Specials come with a choice of rice at no extra cost */
const CHOICE_RICE = [{ name: "White rice", delta: 0 }, { name: "Fried rice", delta: 0 }];
const CHOICE_WINGS = [{ name: "Teriyaki", delta: 0 }, { name: "Sweet chili", delta: 0 }];
const CHOICE_DUMPLING = [{ name: "Steamed", delta: 0 }, { name: "Fried", delta: 0 }];
const CHOICE_TUNA_SALMON = [{ name: "Tuna", delta: 0 }, { name: "Salmon", delta: 0 }];
const CHOICE_SODA = [{ name: "Coke", delta: 0 }, { name: "Sprite", delta: 0 }, { name: "Dr. Pepper", delta: 0 }];
const CHOICE_HOT_TEA = [{ name: "Jasmine tea", delta: 0 }, { name: "Green tea", delta: 0 }];
const CHOICE_POKE = [{ name: "Salmon", delta: 0 }, { name: "Tuna", delta: 0 }, { name: "Eel", delta: 0 }, { name: "Teriyaki chicken", delta: 0 }, { name: "Grilled chicken", delta: 0 }];
const CHOICE_ALACARTE = [{ name: "Salmon", delta: 0 }, { name: "Tuna", delta: 0 }, { name: "Eel", delta: 0 }, { name: "Shrimp", delta: 0 }, { name: "White tuna", delta: 0 }];
const ADD_POKE_PROTEIN = { en: "Additional protein", mm: "အသား ထပ်ထည့်", zh: "加一份蛋白质", es: "Proteína adicional", th: "เพิ่มโปรตีน", price: 3 };

const MENU_ITEMS = [
  /* ================= Starters ================= */
  { id: "s1", category: "Starters", price: 5.00, icon: "🍟", rating: 4.5, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 8, allergens: [], en: "French Fries", mm: "အာလူးကြော်", zh: "薯条", es: "Papas fritas", th: "เฟรนช์ฟรายส์", descEn: "Golden, crispy fries." },
  { id: "s2", category: "Starters", price: 6.00, icon: "🫛", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 6, allergens: ["soy"], en: "Edamame", mm: "အီဒါမာမေ", zh: "毛豆", es: "Edamame", th: "ถั่วแระญี่ปุ่น", descEn: "Steamed young soybeans tossed with sea salt." },
  { id: "s3", category: "Starters", price: 7.00, icon: "🥟", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 10, allergens: ["gluten"], en: "Samosa (3 pcs)", mm: "ဆမူဆာ (၃ လုံး)", zh: "咖喱角（3个）", es: "Samosa (3 uds)", th: "ซาโมซ่า (3 ชิ้น)", descEn: "Crisp pastry filled with spiced potato and onion.", ingredients: "Potatoes, onions, seasonings" },
  { id: "s4", category: "Starters", price: 7.00, icon: "🌯", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 10, allergens: ["gluten"], en: "Veggie Spring Roll (3 pcs)", mm: "ဟင်းသီးဟင်းရွက် ကော်ပြန့် (၃ လုံး)", zh: "蔬菜春卷（3个）", es: "Rollitos de primavera de verduras (3 uds)", th: "ปอเปี๊ยะผัก (3 ชิ้น)", descEn: "Crisp fried rolls with a vegetable filling.", ingredients: "Carrot, cabbage, etc." },
  { id: "s5", category: "Starters", price: 7.00, icon: "🥢", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 10, allergens: ["gluten", "egg"], en: "Chicken Egg Roll (2 pcs)", mm: "ကြက်သား ကော်ပြန့် (၂ လုံး)", zh: "鸡肉蛋卷（2个）", es: "Rollo de huevo con pollo (2 uds)", th: "เอ้กโรลไก่ (2 ชิ้น)", descEn: "Crunchy egg rolls stuffed with seasoned chicken." },
  { id: "s6", category: "Starters", price: 8.00, icon: "🥟", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["gluten", "soy", "sesame"], en: "Chicken Dumplings (6 pcs)", mm: "ကြက်သား ဖက်ထုပ် (၆ လုံး)", zh: "鸡肉饺子（6个）", es: "Empanadillas de pollo (6 uds)", th: "เกี๊ยวไก่ (6 ชิ้น)", descEn: "Choice of steamed or fried chicken dumplings.", sizes: CHOICE_DUMPLING },
  { id: "s7", category: "Starters", price: 12.00, icon: "🍗", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 14, allergens: ["soy", "gluten", "sesame"], en: "Chicken Wings (5 pcs)", mm: "ကြက်တောင်ပံ (၅ ခု)", zh: "鸡翅（5只）", es: "Alitas de pollo (5 uds)", th: "ปีกไก่ (5 ชิ้น)", descEn: "Choice of teriyaki or sweet chili sauce.", sizes: CHOICE_WINGS },
  { id: "s8", category: "Starters", price: 10.00, icon: "🥗", rating: 4.6, popular: false, recommended: true, isNew: false, available: true, veg: false, spicy: false, prepMins: 8, allergens: ["fish", "soy", "sesame"], en: "Pokini", mm: "ပိုကီနီ", zh: "波奇尼", es: "Pokini", th: "โพกินิ", descEn: "Choice of tuna or salmon with seaweed salad and ponzu.", ingredients: "Seaweed salad, lettuce, cucumber, ponzu sauce, sesame seeds, green onion", sizes: CHOICE_TUNA_SALMON },
  { id: "s9", category: "Starters", price: 7.00, icon: "🥗", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 5, allergens: ["sesame", "soy"], en: "Seaweed Salad", mm: "ပင်လယ်ရေမှော် အသုပ်", zh: "海藻沙拉", es: "Ensalada de algas", th: "สลัดสาหร่าย", descEn: "Marinated wakame seaweed with sesame." },

  /* ================= Soups ================= */
  { id: "s10", category: "Soups", price: 4.00, icon: "🥣", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 6, allergens: ["soy", "fish"], en: "Miso", mm: "မီဆို ဟင်းချို", zh: "味噌汤", es: "Sopa de miso", th: "ซุปมิโซะ", descEn: "Warm dashi broth with miso, tofu, wakame and scallion." },
  { id: "s11", category: "Soups", price: 14.00, icon: "🍜", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["fish", "gluten"], en: "Fish Soup with Rice Noodle", mm: "ငါး ဟင်းရည် မုန့်ဟင်းခါး", zh: "鱼汤米线", es: "Sopa de pescado con fideos de arroz", th: "ซุปปลากับเส้นหมี่", descEn: "Rich fish broth ladled over soft rice noodles." },
  { id: "s12", category: "Soups", price: 14.00, icon: "🍲", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["gluten"], en: "Coconut Chicken Noodle", mm: "အုန်းနို့ ကြက်သား ခေါက်ဆွဲ", zh: "椰浆鸡肉面", es: "Fideos de pollo al coco", th: "ก๋วยเตี๋ยวไก่กะทิ", descEn: "Silky coconut chicken broth over wheat noodles." },
  { id: "s13", category: "Soups", price: 15.00, icon: "🍜", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["fish", "egg"], en: "Vermicelli Rice Noodle Soup", mm: "ကြာဇံ ဟင်းချို", zh: "粉丝汤", es: "Sopa de fideos de arroz vermicelli", th: "ซุปวุ้นเส้นเวอร์มิเชลลี", descEn: "Chicken broth with ground chicken, tofu, fish balls and quail eggs.", ingredients: "Chicken broth, ground chicken, tofu, fish balls, quail eggs" },

  /* ================= Burmese Curry (served with white rice) ================= */
  { id: "s14", category: "Burmese Curry", price: 15.00, icon: "🍗", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: true, prepMins: 15, allergens: [], en: "Chicken Curry", mm: "ကြက်သားဟင်း", zh: "缅式鸡肉咖喱", es: "Curry de pollo", th: "แกงไก่", descEn: "Tender bone-in chicken in Burmese spice. Served with white rice.", spiceLevels: true },
  { id: "s15", category: "Burmese Curry", price: 16.00, icon: "🥩", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, prepMins: 18, allergens: [], en: "Beef Curry", mm: "အမဲသားဟင်း", zh: "缅式牛肉咖喱", es: "Curry de ternera", th: "แกงเนื้อ", descEn: "Tender beef in Burmese spice. Served with white rice.", spiceLevels: true },
  { id: "s16", category: "Burmese Curry", price: 20.00, icon: "🍖", rating: 4.7, popular: false, recommended: true, isNew: false, available: true, veg: false, spicy: true, prepMins: 22, allergens: [], en: "Goat Curry", mm: "ဆိတ်သားဟင်း", zh: "缅式山羊肉咖喱", es: "Curry de cabra", th: "แกงแพะ", descEn: "Bone-in goat slow-cooked in Burmese spice. Served with white rice.", spiceLevels: true },

  /* ================= Rice & Noodles (Vegetable/Tofu/Chicken · Beef or Shrimp +$1 · Combo +$3) ================= */
  { id: "s17", category: "Rice & Noodles", price: 14.00, icon: "🍜", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["gluten", "egg", "soy"], en: "Lo Mein Noodle", mm: "လိုမိန်း ခေါက်ဆွဲ", zh: "捞面", es: "Fideos lo mein", th: "หมี่โลเมง", descEn: "Stir-fried egg noodles with carrot and cabbage.", ingredients: "Carrot, cabbage, eggs", sizes: CHOICE_RN_PROTEIN },
  { id: "s18", category: "Rice & Noodles", price: 14.00, icon: "🍜", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["egg", "soy"], en: "Vermicelli Rice Noodle", mm: "ကြာဇံ ကြော်", zh: "炒米粉", es: "Fideos de arroz vermicelli", th: "ผัดเส้นหมี่", descEn: "Thin rice noodles stir-fried with carrot and cabbage.", ingredients: "Carrot, cabbage, eggs", sizes: CHOICE_RN_PROTEIN },
  { id: "s19", category: "Rice & Noodles", price: 14.00, icon: "🍜", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["egg", "soy"], en: "Pad See Ewe", mm: "ပက်စီအယူး", zh: "泰式炒河粉", es: "Pad See Ewe", th: "ผัดซีอิ๊ว", descEn: "Wide flat rice noodles with egg, carrot and broccoli.", ingredients: "Wide flat rice noodle, carrot, broccoli, eggs", sizes: CHOICE_RN_PROTEIN },
  { id: "s20", category: "Rice & Noodles", price: 14.00, icon: "🍜", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, prepMins: 12, allergens: ["egg", "soy"], en: "Malaysian Noodle", mm: "မလေးရှား ခေါက်ဆွဲ", zh: "马来炒粉", es: "Fideos malayos", th: "หมี่มาเลย์", descEn: "Wide flat rice noodles with bean sprouts, chives and spice.", ingredients: "Wide flat rice noodles, eggs, bean sprouts, chives, spice", spiceLevels: true, sizes: CHOICE_RN_PROTEIN },
  { id: "s21", category: "Rice & Noodles", price: 14.00, icon: "🥗", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 10, allergens: ["egg"], en: "Rice Noodle Salad", mm: "ခေါက်ဆွဲ သုပ်", zh: "米线沙拉", es: "Ensalada de fideos de arroz", th: "ยำเส้นหมี่", descEn: "Cool rice noodles tossed with chicken, onion and egg.", ingredients: "Chicken, onion, eggs", sizes: CHOICE_RN_PROTEIN },
  { id: "s22", category: "Rice & Noodles", price: 14.00, icon: "🍜", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["egg", "soy"], en: "Garlic Noodle", mm: "ကြက်သွန်ဖြူ ခေါက်ဆွဲ", zh: "蒜香面", es: "Fideos al ajo", th: "หมี่กระเทียม", descEn: "Buttery garlic noodles with chicken and green onion.", ingredients: "Chicken, garlic, green onion", sizes: CHOICE_RN_PROTEIN },
  { id: "s23", category: "Rice & Noodles", price: 14.00, icon: "🍚", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["egg", "soy"], en: "Fried Rice", mm: "ထမင်းကြော်", zh: "炒饭", es: "Arroz frito", th: "ข้าวผัด", descEn: "Wok-fried rice with onion, egg and mixed vegetables.", ingredients: "Onion, eggs, peas, carrots, broccoli", sizes: CHOICE_RN_PROTEIN },
  { id: "s24", category: "Rice & Noodles", price: 14.00, icon: "🥩", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 12, allergens: ["soy"], en: "Pepper Steak", mm: "ငရုတ်ကောင်း အမဲသား", zh: "青椒牛柳", es: "Bistec con pimienta", th: "สเต๊กพริกไทย", descEn: "Sliced beef stir-fried with bell peppers and onion.", ingredients: "Green and red bell peppers, onion, pepper, broccoli", sizes: CHOICE_RN_PROTEIN },
  { id: "s25", category: "Rice & Noodles", price: 14.00, icon: "🥜", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, prepMins: 12, allergens: ["nuts", "soy"], en: "Kung Pao", mm: "ကွန်ပေါ့", zh: "宫保", es: "Kung Pao", th: "ผัดกังเปา", descEn: "Spicy stir-fry with vegetables and cashew nuts.", ingredients: "Broccoli, cauliflower, red and green peppers, cashew nuts", spiceLevels: true, sizes: CHOICE_RN_PROTEIN },
  { id: "s26", category: "Rice & Noodles", price: 14.00, icon: "🥦", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 12, allergens: ["soy"], en: "Mixed Veggie with Gravy Sauce", mm: "ဟင်းသီးဟင်းရွက်စုံ ဂရေဗီ", zh: "杂菜烩", es: "Verduras mixtas con salsa gravy", th: "ผักรวมราดซอสเกรวี", descEn: "Mixed vegetables in a savoury gravy sauce.", ingredients: "Mixed vegetables and gravy", sizes: CHOICE_RN_PROTEIN },

  /* ================= Hello Specials (choice of white rice or fried rice) ================= */
  { id: "s27", category: "Hello Specials", price: 14.00, icon: "🍗", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, prepMins: 14, allergens: ["gluten", "soy", "sesame", "egg"], en: "Sesame Chicken", mm: "နှမ်း ကြက်သား", zh: "芝麻鸡", es: "Pollo con sésamo", th: "ไก่งาดำ", descEn: "Sweet and sour sauce with crispy chicken and sesame seeds.", sizes: CHOICE_RICE },
  { id: "s28", category: "Hello Specials", price: 14.00, icon: "🍗", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 14, allergens: ["gluten", "soy", "egg"], en: "Orange Chicken", mm: "လိမ္မော် ကြက်သား", zh: "陈皮鸡", es: "Pollo a la naranja", th: "ไก่ส้ม", descEn: "Crispy chicken with orange flavor sauce.", sizes: CHOICE_RICE },
  { id: "s29", category: "Hello Specials", price: 14.00, icon: "🌶️", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, prepMins: 14, allergens: ["gluten", "soy", "egg"], en: "Mariachi Chicken", mm: "မာရီအာချီ ကြက်သား", zh: "墨西哥辣鸡", es: "Pollo mariachi", th: "ไก่มาเรียชี", descEn: "Sweet and spicy crispy chicken with jalapenos.", spiceLevels: true, sizes: CHOICE_RICE },
  { id: "s30", category: "Hello Specials", price: 14.00, icon: "🍱", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 14, allergens: ["soy", "gluten", "sesame"], en: "Teriyaki Chicken", mm: "တဲရိယာကီ ကြက်သား", zh: "照烧鸡", es: "Pollo teriyaki", th: "ไก่เทริยากิ", descEn: "Grilled chicken with teriyaki sauce, green onion and sesame seed.", sizes: CHOICE_RICE },
  { id: "s31", category: "Hello Specials", price: 17.00, icon: "🐟", rating: 4.8, popular: false, recommended: true, isNew: false, available: true, veg: false, spicy: false, prepMins: 16, allergens: ["fish", "soy", "gluten", "sesame"], en: "Grilled Salmon", mm: "ဆာလမွန် ကင်", zh: "烤三文鱼", es: "Salmón a la parrilla", th: "แซลมอนย่าง", descEn: "Grilled salmon with teriyaki sauce, green onion and sesame seed.", sizes: CHOICE_RICE },
  { id: "s32", category: "Hello Specials", price: 17.00, icon: "🐟", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, prepMins: 16, allergens: ["fish", "soy", "gluten", "sesame"], en: "Grilled Eel", mm: "ငါးရှဉ့် ကင်", zh: "烤鳗鱼", es: "Anguila a la parrilla", th: "ปลาไหลย่าง", descEn: "Grilled eel with teriyaki sauce and sesame seed.", sizes: CHOICE_RICE },
  { id: "s33", category: "Hello Specials", price: 17.00, icon: "🐠", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, prepMins: 16, allergens: ["fish", "gluten", "egg"], en: "Crispy Fish", mm: "ငါး ကြွပ်ကြွပ်ကြော်", zh: "香脆鱼", es: "Pescado crujiente", th: "ปลาทอดกรอบ", descEn: "Breaded tilapia with spicy mayo, sweet chili sauce and green onions.", sizes: CHOICE_RICE },

  /* ================= Raw Classic Rolls ================= */
  { id: "s34", category: "Raw Classic Rolls", price: 9.00, icon: "🍣", rating: 4.8, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Salmon Roll", mm: "ဆာလမွန် ရိုးလ်", zh: "三文鱼卷", es: "Rollo de salmón", th: "แซลมอนโรล", descEn: "Fresh raw salmon rolled with rice and nori." },
  { id: "s35", category: "Raw Classic Rolls", price: 9.00, icon: "🍣", rating: 4.8, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Tuna Roll", mm: "တူနာ ရိုးလ်", zh: "金枪鱼卷", es: "Rollo de atún", th: "ทูน่าโรล", descEn: "Fresh raw tuna rolled with rice and nori." },
  { id: "s36", category: "Raw Classic Rolls", price: 9.00, icon: "🌶️", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["fish", "egg"], en: "Spicy Salmon Roll", mm: "အစပ် ဆာလမွန် ရိုးလ်", zh: "辣三文鱼卷", es: "Rollo picante de salmón", th: "โรลแซลมอนเผ็ด", descEn: "Salmon with cucumber and spicy mayo.", ingredients: "Cucumber, spicy mayo", spiceLevels: true },
  { id: "s37", category: "Raw Classic Rolls", price: 9.00, icon: "🌶️", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["fish", "egg"], en: "Spicy Tuna Roll", mm: "အစပ် တူနာ ရိုးလ်", zh: "辣金枪鱼卷", es: "Rollo picante de atún", th: "โรลทูน่าเผ็ด", descEn: "Tuna with cucumber and spicy mayo.", ingredients: "Cucumber, spicy mayo", spiceLevels: true },
  { id: "s38", category: "Raw Classic Rolls", price: 9.00, icon: "🥑", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Salmon Avocado Roll", mm: "ဆာလမွန် ထောပတ်သီး ရိုးလ်", zh: "三文鱼牛油果卷", es: "Rollo de salmón y aguacate", th: "โรลแซลมอนอะโวคาโด", descEn: "Salmon and ripe avocado." },
  { id: "s39", category: "Raw Classic Rolls", price: 9.00, icon: "🥑", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Tuna Avocado Roll", mm: "တူနာ ထောပတ်သီး ရိုးလ်", zh: "金枪鱼牛油果卷", es: "Rollo de atún y aguacate", th: "โรลทูน่าอะโวคาโด", descEn: "Tuna and ripe avocado." },
  { id: "s40", category: "Raw Classic Rolls", price: 9.00, icon: "🍥", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish", "dairy"], en: "Philly Salmon Roll", mm: "ဖီလီ ဆာလမွန် ရိုးလ်", zh: "费城三文鱼卷", es: "Rollo Philly de salmón", th: "ฟิลลี่แซลมอนโรล", descEn: "Salmon, cream cheese and avocado.", ingredients: "Salmon, cream cheese, avocado" },

  /* ================= Cooked Classic Rolls ================= */
  { id: "s41", category: "Cooked Classic Rolls", price: 7.00, icon: "🥒", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, allergens: [], en: "Cucumber Roll", mm: "သခွားသီး ရိုးလ်", zh: "黄瓜卷", es: "Rollo de pepino", th: "โรลแตงกวา", descEn: "Simple crisp cucumber roll." },
  { id: "s42", category: "Cooked Classic Rolls", price: 7.00, icon: "🥑", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, allergens: [], en: "Avocado Roll", mm: "ထောပတ်သီး ရိုးလ်", zh: "牛油果卷", es: "Rollo de aguacate", th: "โรลอะโวคาโด", descEn: "Creamy ripe avocado roll." },
  { id: "s43", category: "Cooked Classic Rolls", price: 8.00, icon: "🥗", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, allergens: [], en: "Veggie Roll", mm: "ဟင်းသီးဟင်းရွက် ရိုးလ်", zh: "蔬菜卷", es: "Rollo de verduras", th: "โรลผัก", descEn: "Carrot, cucumber and avocado.", ingredients: "Carrot, cucumber, avocado" },
  { id: "s44", category: "Cooked Classic Rolls", price: 8.00, icon: "🍱", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["shellfish", "gluten", "egg", "sesame"], en: "California Roll", mm: "ကယ်လီဖိုးနီးယား ရိုးလ်", zh: "加州卷", es: "Rollo California", th: "แคลิฟอร์เนียโรล", descEn: "Krab, avocado and cucumber, rolled with sesame." },
  { id: "s45", category: "Cooked Classic Rolls", price: 9.00, icon: "🍥", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["shellfish", "dairy", "gluten"], en: "Philly Roll", mm: "ဖီလီ ရိုးလ်", zh: "费城卷", es: "Rollo Philly", th: "ฟิลลี่โรล", descEn: "Krab, cream cheese and avocado.", ingredients: "Krab, cream cheese, avocado" },
  { id: "s46", category: "Cooked Classic Rolls", price: 9.00, icon: "🍤", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["shellfish", "gluten", "egg"], en: "Krispy Roll", mm: "ကရစ်စပီ ရိုးလ်", zh: "香脆卷", es: "Rollo Krispy", th: "คริสปี้โรล", descEn: "Krab, cucumber, avocado, spicy mayo, eel sauce and tempura crunch.", ingredients: "Krab, cucumber, avocado, spicy mayo, eel sauce, tempura crunch" },
  { id: "s47", category: "Cooked Classic Rolls", price: 9.00, icon: "🧅", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["shellfish", "gluten", "egg"], en: "Fried Onion Roll", mm: "ကြက်သွန်ကြော် ရိုးလ်", zh: "炸洋葱卷", es: "Rollo de cebolla frita", th: "โรลหอมทอด", descEn: "Krab, cucumber, avocado, spicy mayo, eel sauce and fried onion.", ingredients: "Krab, cucumber, avocado, spicy mayo, eel sauce, fried onion" },

  /* ================= Cooked Special Rolls ================= */
  { id: "s48", category: "Cooked Special Rolls", price: 12.00, icon: "🍤", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, allergens: ["shellfish", "gluten", "egg"], en: "Tempura Shrimp Roll", mm: "တမ်ပူရာ ပုစွန် ရိုးလ်", zh: "天妇罗虾卷", es: "Rollo de langostino tempura", th: "โรลกุ้งเทมปุระ", descEn: "Shrimp tempura with cucumber, avocado, eel sauce and tempura crunch.", ingredients: "Cucumber, avocado, eel sauce, tempura crunch" },
  { id: "s49", category: "Cooked Special Rolls", price: 15.00, icon: "🍤", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["shellfish", "gluten", "egg"], en: "Lover Roll", mm: "လာဗာ ရိုးလ်", zh: "情人卷", es: "Rollo Lover", th: "โรลเลิฟเวอร์", descEn: "Tempura shrimp, krab, spicy mayo, eel sauce, fried onion and tiger shrimp.", ingredients: "Tempura shrimp, krab, spicy mayo, eel sauce, fried onion, tiger shrimp" },
  { id: "s50", category: "Cooked Special Rolls", price: 15.00, icon: "🥭", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: true, allergens: ["shellfish", "gluten", "egg", "dairy"], en: "Mango Tango", mm: "မန်ဂို တန်ဂို", zh: "芒果探戈卷", es: "Mango Tango", th: "มะม่วงแทงโก้", descEn: "Tempura shrimp, krab, cream cheese, mango, spicy mayo, eel sauce, tempura crunch and tiger shrimp.", ingredients: "Tempura shrimp, krab, cream cheese, mango, spicy mayo, eel sauce, tempura crunch, tiger shrimp" },
  { id: "s51", category: "Cooked Special Rolls", price: 15.00, icon: "🐯", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["shellfish"], en: "Tiger Roll", mm: "ကျား ရိုးလ်", zh: "老虎卷", es: "Rollo Tigre", th: "ไทเกอร์โรล", descEn: "Tempura shrimp, tiger shrimp and avocado.", ingredients: "Tempura shrimp, tiger shrimp, avocado" },
  { id: "s52", category: "Cooked Special Rolls", price: 16.00, icon: "🐉", rating: 4.8, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish", "shellfish", "gluten", "egg", "sesame"], en: "Black Sea Dragon", mm: "ပင်လယ်နက် နဂါး", zh: "黑海龙卷", es: "Dragón del Mar Negro", th: "แบล็คซีดราก้อน", descEn: "Eel on top with tempura shrimp, tiger shrimp, cucumber, eel sauce, sesame seeds and tempura crunch.", ingredients: "Eel on top, tempura shrimp, tiger shrimp, cucumber, eel sauce, sesame seeds, tempura crunch" },

  /* ================= Deep Fried Rolls ================= */
  { id: "s53", category: "Deep Fried Rolls", price: 14.00, icon: "🍤", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["shellfish", "gluten", "egg"], en: "Yum Yum Roll", mm: "ယမ်ယမ် ရိုးလ်", zh: "Yum Yum 卷", es: "Rollo Yum Yum", th: "โรลยำยำ", descEn: "Krab, cucumber, avocado, spicy yum yum sauce and tempura crunch.", ingredients: "Krab, cucumber, avocado, spicy yum yum sauce, tempura crunch" },
  { id: "s54", category: "Deep Fried Rolls", price: 14.00, icon: "🍥", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["shellfish", "dairy", "gluten", "egg"], en: "Tasty Roll", mm: "တေစတီ ရိုးလ်", zh: "美味卷", es: "Rollo Tasty", th: "โรลเทสตี้", descEn: "Krab, cream cheese, avocado, spicy mayo, eel sauce and fried onion.", ingredients: "Krab, cream cheese, avocado, spicy mayo, eel sauce, fried onion" },
  { id: "s55", category: "Deep Fried Rolls", price: 15.00, icon: "🌶️", rating: 4.7, popular: false, recommended: true, isNew: false, available: true, veg: false, spicy: true, allergens: ["fish", "dairy", "gluten", "egg"], en: "Salmon Chili Roll", mm: "ဆာလမွန် ချီလီ ရိုးလ်", zh: "辣椒三文鱼卷", es: "Rollo de salmón y chili", th: "โรลแซลมอนชิลี", descEn: "Salmon, cream cheese, avocado, spicy mayo, yum yum sauce, tempura crunch, masago, green onion and sweet chili sauce.", ingredients: "Salmon, cream cheese, avocado, spicy mayo, yum yum sauce, tempura crunch, masago, green onion, sweet chili sauce", spiceLevels: true },

  /* ================= Raw Specialty Rolls ================= */
  { id: "s56", category: "Raw Specialty Rolls", price: 15.00, icon: "🌈", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish", "shellfish"], en: "Rainbow Roll", mm: "သက်တံ့ ရိုးလ်", zh: "彩虹卷", es: "Rollo Arcoíris", th: "เรนโบว์โรล", descEn: "Krab, tuna, salmon, cucumber, avocado, tiger shrimp and white tuna.", ingredients: "Krab, tuna, salmon, cucumber, avocado, tiger shrimp, white tuna" },
  { id: "s57", category: "Raw Specialty Rolls", price: 16.00, icon: "🎨", rating: 4.8, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["fish", "shellfish", "dairy", "egg"], en: "Living Color Roll", mm: "လီဗင် ကာလာ ရိုးလ်", zh: "缤纷色彩卷", es: "Rollo Living Color", th: "ลิฟวิ่งคัลเลอร์โรล", descEn: "Krab, krab salad, tuna, salmon, cucumber, white tuna, masago, avocado, cream cheese, spicy mayo and green onion.", ingredients: "Krab, krab salad, tuna, salmon, cucumber, white tuna, masago, avocado, cream cheese, spicy mayo, green onion" },
  { id: "s58", category: "Raw Specialty Rolls", price: 16.00, icon: "🍣", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: true, allergens: ["fish", "egg"], en: "Hello Roll", mm: "Hello ရိုးလ်", zh: "Hello 卷", es: "Rollo Hello", th: "เฮลโหลโรล", descEn: "Salmon, tuna, white tuna, cucumber, avocado, spicy mayo, yum yum sauce and fried onion.", ingredients: "Salmon, tuna, white tuna, cucumber, avocado, spicy mayo, yum yum sauce, fried onion" },
  { id: "s59", category: "Raw Specialty Rolls", price: 16.00, icon: "🌶️", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["fish", "egg", "gluten"], en: "Mariachi Roll", mm: "မာရီအာချီ ရိုးလ်", zh: "墨西哥辣卷", es: "Rollo Mariachi", th: "มาเรียชีโรล", descEn: "Tuna, white tuna, salmon, cucumber, avocado, spicy mayo, sriracha, jalapenos, masago, tempura crunch and green onion.", ingredients: "Tuna, white tuna, salmon, cucumber, avocado, spicy mayo, sriracha, jalapenos, masago, tempura crunch, green onion", spiceLevels: true },
  { id: "s60", category: "Raw Specialty Rolls", price: 16.00, icon: "🔥", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true, allergens: ["fish", "shellfish", "dairy", "egg"], en: "Nash Vegas Roll", mm: "နက်ရှ် ဗေးဂတ် ရိုးလ်", zh: "纳什维加斯卷", es: "Rollo Nash Vegas", th: "แนชเวกัสโรล", descEn: "Krab, krab salad, tuna, salmon, tiger shrimp, cream cheese, masago, spicy mayo and eel sauce.", ingredients: "Krab, krab salad, tuna, salmon, tiger shrimp, cream cheese, masago, spicy mayo, eel sauce" },
  { id: "s61", category: "Raw Specialty Rolls", price: 16.00, icon: "🍣", rating: 4.8, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Salmon Lover", mm: "ဆာလမွန် လာဗာ", zh: "三文鱼恋人卷", es: "Salmon Lover", th: "แซลมอนเลิฟเวอร์", descEn: "Salmon on top and inside, with avocado.", ingredients: "Salmon on top and inside, avocado" },
  { id: "s62", category: "Raw Specialty Rolls", price: 16.00, icon: "🍣", rating: 4.8, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Tuna Lover", mm: "တူနာ လာဗာ", zh: "金枪鱼恋人卷", es: "Tuna Lover", th: "ทูน่าเลิฟเวอร์", descEn: "Tuna on top and inside, with avocado.", ingredients: "Tuna on top and inside, avocado" },

  /* ================= Poke Bowls ================= */
  { id: "s63", category: "Poke Bowls", price: 16.00, icon: "🥗", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, prepMins: 8, allergens: ["fish", "soy", "sesame"], en: "Poke Bowl", mm: "ပိုကီ ဘောလ်", zh: "波奇饭碗", es: "Poke Bowl", th: "โพเกโบวล์", descEn: "Choose one protein (salmon, tuna, eel, teriyaki chicken or grilled chicken) and your sauces. Additional protein $3.", ingredients: "Rice, lettuce, carrot, cucumber, red radish, red onion. Sauces: spicy mayo, eel sauce, sriracha, ponzu", sizes: CHOICE_POKE, addons: [ADD_POKE_PROTEIN] },

  /* ================= A La Carte ================= */
  { id: "s64", category: "A La Carte", price: 2.50, icon: "🐟", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish", "shellfish"], en: "Nigiri or Sashimi", mm: "နီဂီရီ / ဆာရှီမီ", zh: "握寿司或刺身", es: "Nigiri o Sashimi", th: "นิกิริ หรือ ซาชิมิ", descEn: "Priced per piece. Choice of salmon, tuna, eel, shrimp or white tuna.", sizes: CHOICE_ALACARTE },

  /* ================= Sushi Combos ================= */
  { id: "s65", category: "Sushi Combos", price: 22.00, icon: "🍱", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish", "shellfish"], en: "Ocean Platter", mm: "အိုရှင်း ပလိတ်တာ", zh: "海洋拼盘", es: "Bandeja del Océano", th: "โอเชียนแพลตเตอร์", descEn: "Tuna, salmon and avocado, plus 8 pieces of nigiri (tuna, salmon, white tuna, shrimp, eel)." },
  { id: "s66", category: "Sushi Combos", price: 22.00, icon: "🍱", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish", "shellfish"], en: "Hello Combo", mm: "Hello ကွန်ဘို", zh: "Hello 拼盘", es: "Combo Hello", th: "เฮลโหลคอมโบ", descEn: "Tuna and salmon roll, plus 6 pieces of nigiri (tuna, salmon, white tuna, shrimp, eel)." },
  { id: "s67", category: "Sushi Combos", price: 16.00, icon: "🍣", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish", "shellfish"], en: "Nigiri Combo (10 pieces)", mm: "နီဂီရီ ကွန်ဘို (၁၀ ခု)", zh: "握寿司拼盘（10件）", es: "Combo de Nigiri (10 piezas)", th: "นิกิริคอมโบ (10 ชิ้น)", descEn: "Ten pieces of nigiri: tuna, salmon, white tuna, shrimp and eel." },
  { id: "s68", category: "Sushi Combos", price: 16.00, icon: "🐟", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Sashimi Combo (9 pieces)", mm: "ဆာရှီမီ ကွန်ဘို (၉ ချပ်)", zh: "刺身拼盘（9件）", es: "Combo de Sashimi (9 piezas)", th: "ซาชิมิคอมโบ (9 ชิ้น)", descEn: "Nine slices of sashimi: tuna, salmon and white tuna." },
  { id: "s69", category: "Sushi Combos", price: 16.00, icon: "🍱", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, allergens: ["fish"], en: "Couple Combo (9 pieces)", mm: "ကပ်ပယ် ကွန်ဘို (၉ ခု)", zh: "情侣拼盘（9件）", es: "Combo Pareja (9 piezas)", th: "คัปเปิลคอมโบ (9 ชิ้น)", descEn: "Tuna, salmon, an avocado roll and 4 pieces of nigiri." },

  /* ================= Desserts ================= */
  { id: "s70", category: "Desserts", price: 7.00, icon: "🍰", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 3, allergens: ["dairy", "gluten", "egg"], en: "New York Cheesecake", mm: "နယူးယောက် ချိစ်ကိတ်", zh: "纽约芝士蛋糕", es: "Tarta de queso Nueva York", th: "นิวยอร์กชีสเค้ก", descEn: "Classic dense cheesecake topped with whipped cream." },
  { id: "s71", category: "Desserts", price: 5.00, icon: "🍨", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 2, allergens: ["dairy"], en: "Vanilla Ice Cream", mm: "ဗနီလာ ရေခဲမုန့်", zh: "香草冰淇淋", es: "Helado de vainilla", th: "ไอศกรีมวานิลลา", descEn: "Two scoops of vanilla ice cream." },

  /* ================= Beverages ================= */
  { id: "s72", category: "Beverages", price: 2.00, icon: "💧", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 1, allergens: [], en: "Bottled Water", mm: "ရေသန့်ဘူး", zh: "瓶装水", es: "Agua embotellada", th: "น้ำดื่มบรรจุขวด", descEn: "Chilled bottled water." },
  { id: "s73", category: "Beverages", price: 3.00, icon: "🥤", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 1, allergens: [], en: "Bottled Soda", mm: "ဆိုဒါ ဘူး", zh: "瓶装汽水", es: "Refresco embotellado", th: "น้ำอัดลมบรรจุขวด", descEn: "Choice of Coke, Sprite or Dr. Pepper.", sizes: CHOICE_SODA },
  { id: "s74", category: "Beverages", price: 3.00, icon: "🍊", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 1, allergens: [], en: "Orange Juice", mm: "လိမ္မော်ရည်", zh: "橙汁", es: "Zumo de naranja", th: "น้ำส้ม", descEn: "Chilled orange juice." },
  { id: "s75", category: "Beverages", price: 4.00, icon: "🧊", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 3, allergens: ["dairy"], en: "Iced Coffee", mm: "ကော်ဖီ အအေး", zh: "冰咖啡", es: "Café helado", th: "กาแฟเย็น", descEn: "Sweet iced coffee over ice." },
  { id: "s76", category: "Beverages", price: 4.00, icon: "🧋", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: true, spicy: false, prepMins: 3, allergens: ["dairy"], en: "Thai Tea", mm: "ထိုင်း လက်ဖက်ရည်", zh: "泰式奶茶", es: "Té tailandés", th: "ชาไทย", descEn: "Sweet spiced black tea with evaporated milk over ice." },
  { id: "s77", category: "Beverages", price: 2.00, icon: "🍵", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false, prepMins: 2, allergens: [], en: "Hot Tea", mm: "လက်ဖက်ရည် ပူ", zh: "热茶", es: "Té caliente", th: "ชาร้อน", descEn: "Choice of jasmine or green tea.", sizes: CHOICE_HOT_TEA },
];

const ALLERGEN_LABEL = {
  fish: { en: "Fish", mm: "ငါး", zh: "鱼", es: "Pescado", th: "ปลา" },
  shellfish: { en: "Shellfish", mm: "ခရု/ပုစွန်", zh: "贝类", es: "Marisco", th: "หอย/กุ้ง" },
  gluten: { en: "Gluten", mm: "ဂ​လူတင်", zh: "麸质", es: "Gluten", th: "กลูเตน" },
  soy: { en: "Soy", mm: "ပဲပိစပ်", zh: "大豆", es: "Soja", th: "ถั่วเหลือง" },
  egg: { en: "Egg", mm: "ကြက်ဥ", zh: "蛋", es: "Huevo", th: "ไข่" },
  dairy: { en: "Dairy", mm: "နို့ထွက်", zh: "乳制品", es: "Lácteos", th: "นม" },
  sesame: { en: "Sesame", mm: "နှမ်း", zh: "芝麻", es: "Sésamo", th: "งา" },
  peanut: { en: "Peanut", mm: "မြေပဲ", zh: "花生", es: "Cacahuete", th: "ถั่วลิสง" },
  nuts: { en: "Tree nuts", mm: "အခွံမာသီး", zh: "坚果", es: "Frutos secos", th: "ถั่วเปลือกแข็ง" },
};

const STAFF_STATUSES = ["New", "Confirmed", "Preparing", "Ready", "Served", "Completed"];
const CUSTOMER_STEPS = ["New", "Confirmed", "Preparing", "Ready", "Served"];
const CUSTOMER_STATUS_LABEL = {
  en: { New: "Order received", Confirmed: "Restaurant confirmed", Preparing: "Preparing your food", Ready: "Ready", Served: "Served" },
  mm: { New: "အော်ဒါလက်ခံပြီး", Confirmed: "စားသောက်ဆိုင်အတည်ပြုပြီး", Preparing: "ချက်ပြုတ်နေသည်", Ready: "အသင့်ဖြစ်ပါပြီ", Served: "ပြီးစီးပါပြီ" },
  zh: { New: "已收到订单", Confirmed: "餐厅已确认", Preparing: "正在备餐", Ready: "已就绪", Served: "已上菜" },
  es: { New: "Pedido recibido", Confirmed: "Restaurante confirmó", Preparing: "Preparando tu comida", Ready: "Listo", Served: "Servido" },
  th: { New: "รับออร์เดอร์แล้ว", Confirmed: "ร้านยืนยันแล้ว", Preparing: "กำลังทำอาหาร", Ready: "พร้อมเสิร์ฟ", Served: "เสิร์ฟแล้ว" },
};
const KITCHEN_ACTION_LABEL = { New: "Accept", Confirmed: "Start preparing", Preparing: "Mark ready", Ready: "Serve", Served: "Complete" };
const RES_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled", "Rejected"];

function tablesList(n) {
  return Array.from({ length: Math.max(1, Math.min(60, Number(n) || 10)) }, (_, i) => ({ number: String(i + 1).padStart(2, "0") }));
}

const DEFAULT_SETTINGS = {
  name: "Hello Sushi",
  tagline: "Asian Cuisine",
  intro: "Where culinary artistry meets Asian flavors — a delightful escape into authentic sushi, Burmese, Thai and Chinese cooking, in both classic and modern interpretations.",
  address: "3979 Nolensville Pike, Nashville, TN 37211",
  phone: "(615) 953-7568",
  email: "hellosushinash@gmail.com",
  hours: "Wed–Mon 11:00 AM–8:30 PM · Sat from 1:00 PM · Closed Tuesday",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Hello+Sushi+3979+Nolensville+Pike+Nashville+TN+37211",
  facebook: "https://www.facebook.com/hellosushinashville/",
  instagram: "",
  taxRate: 0.0925,
  deliveryFee: 0,
  serviceRate: 0,
  currency: "USD ($)",
  tableCount: 10,
  siteUrl: "",
  // Admin-editable in Settings → Payment methods.
  // type "person" = pay in person (label + note only)
  // type "online" = pay now: `url` (Venmo / Cash App / PayPal.me / Stripe Payment
  //   Link / Square checkout — any link) shown as a button + auto-generated QR,
  //   and/or an uploaded `image` QR (image wins if both are set)
  paymentMethods: [
    { id: "counter", label: "Pay at counter", type: "person", note: "Pay when you collect your order or at your table.", url: "", image: "", enabled: true },
    { id: "cash", label: "Cash", type: "person", note: "Please have the amount ready for our staff.", url: "", image: "", enabled: true },
    { id: "card", label: "Card in person", type: "person", note: "We'll bring the card reader to your table.", url: "", image: "", enabled: true },
    { id: "online", label: "Pay now (Venmo / Cash App / card)", type: "online", note: "Pay with the link or QR below, then show the confirmation to our staff.", url: "", image: "", enabled: false },
  ],
};

const REVIEWS = [
  { name: "Marcus T.", city: "Woodbine", rating: 5, text: "Best place in Nashville for sushi, noodles and rice dishes. Fresh fish, quick service, always spotless." },
  { name: "Priya S.", city: "Oak Hill", rating: 5, text: "The Burmese curry and the specialty rolls are unreal, and the presentation makes every plate feel special." },
  { name: "Danielle R.", city: "Antioch", rating: 5, text: "Friendly staff, generous portions, and it travels great on DoorDash. Our go-to on Nolensville Pike." },
];

const HIGHLIGHTS = [
  { icon: "🍣", en: "Sushi, Burmese, Thai & Chinese", zh: "寿司、缅甸、泰式与中式", es: "Sushi, birmana, tailandesa y china", th: "ซูชิ พม่า ไทย และจีน", mm: "ဆူရှီ၊ မြန်မာ၊ ထိုင်း၊ တရုတ်" },
  { icon: "🔪", en: "Rolled to order", zh: "现点现卷", es: "Enrollado al momento", th: "ม้วนสดตามสั่ง", mm: "မှာမှ လိပ်" },
  { icon: "🥡", en: "Dine-in, take-out & delivery", zh: "堂食、外带与外送", es: "En mesa, para llevar y a domicilio", th: "ทานที่ร้าน สั่งกลับ และเดลิเวอรี", mm: "ဆိုင်တွင်း၊ ထုတ်ယူ၊ ပို့ဆောင်" },
  { icon: "🎉", en: "Catering & private events", zh: "宴会与私人活动", es: "Catering y eventos privados", th: "จัดเลี้ยงและงานส่วนตัว", mm: "ပွဲအခမ်းအနားများ" },
];

const POPULAR_PICK_IDS = ["s14", "s27", "s56", "s65", "s12", "s19"];

// Editable customer-facing content (admin → Content tab). Text fields left blank
// fall back to the translated string in T for the active language.
const DEFAULT_CONTENT = {
  heroIntro: "", featureBandTitle: "", featureBandText: "", ratingHeadline: "Sushi · Burmese · Thai · Chinese",
  storyTitle: "", story: "", conceptTitle: "", concept: "", freshTitle: "", fresh: "",
  prepTitle: "", prep: "", philosophyTitle: "", philosophy: "",
  highlights: HIGHLIGHTS.map((h) => ({ icon: h.icon, text: h.en })),
  reviews: REVIEWS.map((r) => ({ ...r })),
  promoCode: "HELLO10", promoDiscountPct: 10,
  popularPickIds: [...POPULAR_PICK_IDS],
};

/* ------------------------------------------------------------- helpers */

function fmt(n) {
  const v = Number(n) || 0;
  return `$${v.toFixed(2)}`;
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function dayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function isToday(ts) {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

/* Live data (orders, reservations, menu, categories, content, settings) is
 * loaded from Supabase at runtime — see src/db.js. The constants above
 * (MENU_ITEMS, CATS, DEFAULT_CONTENT, DEFAULT_SETTINGS) are the payload for
 * the admin "Initialize database" button and the offline fallback. */

const TIME_SLOTS = ["11:30", "12:00", "12:30", "13:00", "13:30", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

/* ------------------------------------------------------------- i18n */

const T = {
  en: {
    navHome: "Home", navMenu: "Menu", navAbout: "About", navBook: "Book", navCategories: "Categories", navContact: "Contact",
    categoriesTitle: "Menu categories", allCategories: "All categories", contactTitle: "Contact & location", ingredients: "Ingredients",
    orderingFor: "You are ordering for", featureBandTitle: "Sushi & Asian Comfort Food",
    featureBandText: "Sushi rolled to order, Burmese curries and Thai-style noodles — freshly prepared and served with care.",
    popularDishesBtn: "Popular Dishes", popularPicksTitle: "Guest Favourites", callUs: "Call us", emailUs: "Email us", findUs: "Find us",
    search: "Search the menu", table: "Table", all: "All", popular: "Popular",
    vegetarian: "Vegetarian", spicy: "Spicy",
    popularSection: "Popular right now", fullMenu: "Full menu", noMatch: "No dishes match your search.",
    addToCart: "Add to cart", size: "Size", spiceLevel: "Spice level", addOns: "Add-ons",
    instructions: "Special instructions", instructionsPh: "e.g. no wasabi, please",
    quantity: "Quantity", soldOut: "Sold out", yourOrder: "Your order", cartEmpty: "Your cart is empty.",
    clearCart: "Clear cart", subtotal: "Subtotal", tax: "Tax", deliveryFee: "Delivery fee", total: "Total",
    continueCheckout: "Continue to checkout", checkout: "Checkout", orderType: "Order type",
    dineIn: "Dine-in", takeaway: "Takeaway", delivery: "Delivery", name: "Name",
    phone: "Phone", email: "Email", kitchenNote: "Note for the kitchen (optional)", payment: "Payment",
    placeOrder: "Place order", placing: "Placing order…", orderPlaced: "Order placed",
    kitchenReceived: "The kitchen has received your order.", estimated: "Estimated", min: "min",
    trackOrder: "Track my order", backToMenu: "Back to menu", orderTracking: "Order tracking",
    autoUpdate: "This screen updates automatically — no need to refresh.", orderSomethingElse: "Order something else",
    items: "items", promo: "Promo code", apply: "Apply", applied: "Applied",
    promoInvalid: "That code isn't valid.", inProgress: "In progress", discount: "Discount",
    orderCancelled: "This order was cancelled.", orderCancelledHelp: "Please speak with a staff member if you have questions.",
    scanToTrack: "Scan this code with your phone to follow your order on another device.",
    orderNotFound: "Order not found", orderNotFoundHelp: "This order link can't be opened here. Please check with a staff member.",
    qrNote: "The restaurant's payment QR code will be shown at checkout.", selectLanguage: "Language",
    payNow: "Pay now", howToPay: "How to pay", completeYourPayment: "Complete your payment", paymentPending: "Payment pending",
    add: "Add", reviews: "reviews", allergens: "Allergens", contains: "Contains",
    heroIntro: "A delightful escape into authentic Asian cuisine on Nolensville Pike — sushi, Burmese, Thai and Chinese dishes, in both classic and modern interpretations.",
    viewMenu: "View Menu", orderNow: "Order Now", featured: "Featured dishes", browseCategories: "Browse by category",
    whyUs: "Why guests love us", whatGuestsSay: "What our guests say", visitUs: "Visit us", getDirections: "Get directions",
    openHours: "Opening hours", recommendedSection: "Recommended for you", recommended: "Recommended",
    sortRecommended: "Recommended", sortPriceLow: "Price: low to high", sortPriceHigh: "Price: high to low", sortRating: "Top rated",
    favorites: "Favorites", favoritesEmpty: "No favorites yet — tap the heart on a dish to save it.",
    footerRights: "All rights reserved.",
    aboutTitle: "About Hello Sushi",
    storyTitle: "Our story", story: "Hello Sushi is a neighborhood spot on Nolensville Pike in South Nashville, where culinary artistry meets Asian flavors. We set out to make a place that feels like a delightful escape — warm, unhurried, and full of flavor.",
    conceptTitle: "Sushi, Burmese, Thai & Chinese — one kitchen", concept: "One menu across the cuisines we love: sushi rolls and nigiri, Burmese curries, Thai-style noodles and Chinese classics, in both classic and modern interpretations.",
    freshTitle: "Made to order", fresh: "Rolls are cut when you order them and plates are built to be a feast for the eyes as much as the table. Vegetarian options run right through the menu.",
    prepTitle: "Crafted with care", prep: "Our chefs bring passion and precision to every plate — whether you're a longtime sushi regular or trying it for the first time.",
    philosophyTitle: "Catering & events", philosophy: "We cater premium sushi for birthdays, holidays, corporate events and weddings, and take private party bookings. Call us to plan yours.",
    reserveTitle: "Book a table", reserveIntro: "Tell us when you're coming and we'll have a table ready.",
    date: "Date", time: "Time", guests: "Guests", specialRequests: "Special requests",
    reserveSubmit: "Request reservation", reserveThanks: "Reservation requested",
    reserveThanksBody: "We've received your request and will confirm by phone or email shortly.",
    reserveAnother: "Make another request", guest: "guest", guestsWord: "guests",
  },
  mm: {
    navHome: "ပင်မ", navMenu: "မီနူး", navAbout: "အကြောင်း", navBook: "ကြိုတင်မှာ", navCategories: "အမျိုးအစားများ", navContact: "ဆက်သွယ်ရန်",
    categoriesTitle: "မီနူးအမျိုးအစားများ", allCategories: "အမျိုးအစားအားလုံး", contactTitle: "ဆက်သွယ်ရန်နှင့် တည်နေရာ", ingredients: "ပါဝင်ပစ္စည်းများ",
    orderingFor: "သင်မှာယူနေသည်မှာ", featureBandTitle: "ဆူရှီနှင့် အာရှအစားအစာ",
    featureBandText: "ဆူရှီကို မှာယူချိန်မှ လိပ်ပေး၊ မြန်မာဟင်းများနှင့် ထိုင်းစတိုင် ခေါက်ဆွဲများကို လတ်ဆတ်စွာ ပြင်ဆင်တင်ဆက်ပါသည်။",
    popularDishesBtn: "လူကြိုက်များသော ဟင်းလျာများ", popularPicksTitle: "ဧည့်သည်များ နှစ်သက်ရာများ", callUs: "ဖုန်းခေါ်ရန်", emailUs: "အီးမေးလ်ပို့ရန်", findUs: "လမ်းညွှန်",
    search: "မီနူးရှာရန်", table: "စားပွဲ", all: "အားလုံး", popular: "လူကြိုက်များ",
    vegetarian: "သက်သတ်လွတ်", spicy: "အစပ်",
    popularSection: "လူကြိုက်များသော", fullMenu: "မီနူးအပြည့်", noMatch: "ရှာဖွေမှုနှင့် ကိုက်ညီသော ဟင်းမရှိပါ။",
    addToCart: "ခြင်းထဲထည့်ရန်", size: "အရွယ်အစား", spiceLevel: "စပ်ဆလိုအဆင့်", addOns: "ထပ်ဆောင်းများ",
    instructions: "အထူးညွှန်ကြားချက်", instructionsPh: "ဥပမာ - ဝါဆာဘီ မထည့်ပါနှင့်",
    quantity: "အရေအတွက်", soldOut: "ကုန်သွားပါပြီ", yourOrder: "သင့်အော်ဒါ", cartEmpty: "ခြင်းထဲတွင် ဘာမျှမရှိပါ။",
    clearCart: "ခြင်းရှင်းရန်", subtotal: "စုစုပေါင်း", tax: "အခွန်", deliveryFee: "ပို့ဆောင်ခ", total: "စုစုပေါင်းငွေ",
    continueCheckout: "ငွေရှင်းရန်ဆက်လုပ်ရန်", checkout: "ငွေရှင်းရန်", orderType: "အော်ဒါအမျိုးအစား",
    dineIn: "ဆိုင်တွင်စား", takeaway: "ယူသွားရန်", delivery: "ပို့ဆောင်ရန်", name: "အမည်",
    phone: "ဖုန်းနံပါတ်", email: "အီးမေးလ်", kitchenNote: "မီးဖိုဆီးအတွက်မှတ်ချက် (ရွေးချယ်ခွင့်)", payment: "ငွေပေးချေမှု",
    placeOrder: "အော်ဒါတင်ရန်", placing: "အော်ဒါတင်နေသည်…", orderPlaced: "အော်ဒါတင်ပြီးပါပြီ",
    kitchenReceived: "မီးဖိုဆီးမှ သင့်အော်ဒါကို လက်ခံရရှိပါပြီ။", estimated: "ခန့်မှန်းချိန်", min: "မိနစ်",
    trackOrder: "အော်ဒါခြေရာခံရန်", backToMenu: "မီနူးသို့ပြန်သွားရန်", orderTracking: "အော်ဒါခြေရာခံခြင်း",
    autoUpdate: "ဒီစာမျက်နှာသည် အလိုအလျောက်အပ်ဒိတ်ဖြစ်ပါသည်။", orderSomethingElse: "နောက်ထပ်မှာယူရန်",
    items: "မျိုး", promo: "ပရိုမိုကုတ်", apply: "သုံးမည်", applied: "သုံးပြီး",
    promoInvalid: "ကုတ်မှန်ကန်မှုမရှိပါ။", inProgress: "လုပ်ဆောင်နေဆဲ", discount: "လျှော့ဈေး",
    orderCancelled: "ဒီအော်ဒါကို ပယ်ဖျက်လိုက်ပါသည်။", orderCancelledHelp: "မေးခွန်းရှိပါက ဝန်ထမ်းတစ်ဦးဦးအား ပြောပါ။",
    scanToTrack: "အခြားစက်တစ်ခုတွင် အော်ဒါကိုကြည့်ရန် ဤကုဒ်ကို ဖုန်းဖြင့် စကင်ဖတ်ပါ။",
    orderNotFound: "အော်ဒါ ရှာမတွေ့ပါ", orderNotFoundHelp: "ဤအော်ဒါလင့်ခ်ကို ဖွင့်၍မရပါ။ ဝန်ထမ်းတစ်ဦးဦးအား မေးမြန်းပါ။",
    qrNote: "ဆိုင်၏ ငွေပေးချေမှု QR ကုဒ်ကို ငွေရှင်းချိန်တွင် ပြသပါမည်။", selectLanguage: "ဘာသာစကား",
    payNow: "ယခုပေးချေရန်", howToPay: "ငွေပေးချေနည်း", completeYourPayment: "ငွေပေးချေမှု ပြီးမြောက်စေရန်", paymentPending: "ငွေပေးချေရန် ကျန်ရှိ",
    add: "ထည့်ရန်", reviews: "သုံးသပ်ချက်", allergens: "ဓာတ်မတည့်စာ", contains: "ပါဝင်သည်",
    heroIntro: "Nolensville Pike ပေါ်ရှိ စစ်မှန်သော အာရှအစားအစာများ — ဆူရှီ၊ မြန်မာ၊ ထိုင်းနှင့် တရုတ် ဟင်းလျာများ။",
    viewMenu: "မီနူးကြည့်ရန်", orderNow: "အခုမှာမည်", featured: "အထူးဟင်းလျာများ", browseCategories: "အမျိုးအစားဖြင့် ရှာရန်",
    whyUs: "ဧည့်သည်များ နှစ်သက်ရခြင်း", whatGuestsSay: "ဧည့်သည်များ၏ ပြောကြားချက်", visitUs: "လာရောက်လည်ပတ်ရန်", getDirections: "လမ်းညွှန်ရယူရန်",
    openHours: "ဖွင့်ချိန်", recommendedSection: "သင့်အတွက် အကြံပြုချက်", recommended: "အကြံပြုထား",
    sortRecommended: "အကြံပြုထား", sortPriceLow: "ဈေးနှုန်း - နည်းမှများ", sortPriceHigh: "ဈေးနှုန်း - များမှနည်း", sortRating: "အဆင့်သတ်မှတ်ချက် အမြင့်ဆုံး",
    favorites: "အနှစ်သက်ဆုံး", favoritesEmpty: "အနှစ်သက်ဆုံး မရှိသေးပါ — ဟင်းတစ်ခုပေါ်ရှိ နှလုံးကို နှိပ်၍ သိမ်းဆည်းပါ။",
    footerRights: "မူပိုင်ခွင့်အားလုံး ရယူထားသည်။",
    aboutTitle: "Hello Sushi အကြောင်း",
    storyTitle: "ကျွန်ုပ်တို့၏ ဇာတ်လမ်း", story: "Hello Sushi သည် South Nashville ရှိ Nolensville Pike ပေါ်က ရပ်ကွက်စားသောက်ဆိုင်တစ်ခုဖြစ်ပြီး ချက်ပြုတ်အနုပညာနှင့် အာရှအရသာများ ဆုံစည်းရာနေရာဖြစ်သည်။",
    conceptTitle: "ဆူရှီ၊ မြန်မာ၊ ထိုင်းနှင့် တရုတ် — မီးဖိုတစ်ခု", concept: "ဆူရှီ ရိုးလ်များ၊ မြန်မာဟင်းများ၊ ထိုင်းခေါက်ဆွဲများနှင့် တရုတ်ဟင်းလျာများ — ရိုးရာနှင့် ခေတ်သစ်ပုံစံနှစ်မျိုးလုံး။",
    freshTitle: "မှာမှ ပြင်ဆင်", fresh: "ရိုးလ်များကို မှာမှ ဖြတ်ပြီး ပန်းကန်တိုင်းကို ဂရုတစိုက် စီစဉ်သည်။ သက်သတ်လွတ် ရွေးချယ်စရာများ မီနူးတစ်ခုလုံးတွင် ပါဝင်သည်။",
    prepTitle: "ဂရုတစိုက် ပြုလုပ်", prep: "ကျွန်ုပ်တို့၏ စားဖိုမှူးများသည် သင် ပုံမှန်လာသူဖြစ်စေ၊ ပထမဆုံးအကြိမ်စမ်းသူဖြစ်စေ ပန်းကန်တိုင်းတွင် စိတ်အားထက်သန်မှုနှင့် တိကျမှုကို ထည့်သွင်းသည်။",
    philosophyTitle: "ပွဲများနှင့် အခမ်းအနားများ", philosophy: "မွေးနေ့၊ အားလပ်ရက်၊ ကုမ္ပဏီပွဲနှင့် မင်္ဂလာဆောင်များအတွက် premium ဆူရှီ catering ဝန်ဆောင်မှုပေးပြီး ကိုယ်ပိုင်ပါတီများလည်း လက်ခံသည်။",
    reserveTitle: "စားပွဲကြိုတင်မှာရန်", reserveIntro: "ဘယ်အချိန်လာမယ်ဆိုတာ ပြောပြပါ၊ စားပွဲအဆင်သင့်ထားပေးပါမည်။",
    date: "ရက်စွဲ", time: "အချိန်", guests: "ဧည့်သည်", specialRequests: "အထူးတောင်းဆိုချက်",
    reserveSubmit: "ကြိုတင်မှာယူရန်", reserveThanks: "ကြိုတင်မှာယူပြီးပါပြီ",
    reserveThanksBody: "သင့်တောင်းဆိုမှုကို လက်ခံရရှိပြီး မကြာမီ ဖုန်း သို့မဟုတ် အီးမေးလ်ဖြင့် အတည်ပြုပါမည်။",
    reserveAnother: "နောက်ထပ် တောင်းဆိုရန်", guest: "ဦး", guestsWord: "ဦး",
  },
  zh: {
    navHome: "首页", navMenu: "菜单", navAbout: "关于", navBook: "订位", navCategories: "分类", navContact: "联系",
    categoriesTitle: "菜单分类", allCategories: "全部分类", contactTitle: "联系与位置", ingredients: "食材",
    orderingFor: "您正在为以下点餐", featureBandTitle: "寿司与亚洲美食",
    featureBandText: "现点现卷的寿司、缅式咖喱和泰式炒面，新鲜现做，用心呈现。",
    popularDishesBtn: "热门菜品", popularPicksTitle: "客人最爱", callUs: "致电我们", emailUs: "发送邮件", findUs: "查看位置",
    search: "搜索菜单", table: "餐桌", all: "全部", popular: "热门",
    vegetarian: "素食", spicy: "辣",
    popularSection: "当前热门", fullMenu: "完整菜单", noMatch: "没有符合搜索的菜品。",
    addToCart: "加入购物车", size: "份量", spiceLevel: "辣度", addOns: "加料",
    instructions: "特殊要求", instructionsPh: "例如：请不要芥末",
    quantity: "数量", soldOut: "售罄", yourOrder: "您的订单", cartEmpty: "您的购物车是空的。",
    clearCart: "清空购物车", subtotal: "小计", tax: "税", deliveryFee: "配送费", total: "合计",
    continueCheckout: "继续结算", checkout: "结算", orderType: "订单类型",
    dineIn: "堂食", takeaway: "外带", delivery: "外送", name: "姓名",
    phone: "电话", email: "邮箱", kitchenNote: "给厨房的备注（选填）", payment: "支付",
    placeOrder: "下单", placing: "正在下单…", orderPlaced: "已下单",
    kitchenReceived: "厨房已收到您的订单。", estimated: "预计", min: "分钟",
    trackOrder: "追踪我的订单", backToMenu: "返回菜单", orderTracking: "订单追踪",
    autoUpdate: "此页面自动更新，无需刷新。", orderSomethingElse: "再点些别的",
    items: "项", promo: "优惠码", apply: "应用", applied: "已应用",
    promoInvalid: "该优惠码无效。", inProgress: "进行中", discount: "折扣",
    orderCancelled: "此订单已取消。", orderCancelledHelp: "如有疑问请联系工作人员。",
    scanToTrack: "用手机扫描此码，即可在其他设备上跟踪订单。",
    orderNotFound: "未找到订单", orderNotFoundHelp: "无法在此打开该订单链接，请咨询工作人员。",
    qrNote: "餐厅的付款二维码将在结算时显示。", selectLanguage: "语言",
    payNow: "立即支付", howToPay: "如何支付", completeYourPayment: "完成支付", paymentPending: "待支付",
    add: "添加", reviews: "条评价", allergens: "过敏原", contains: "含有",
    heroIntro: "位于 Nolensville Pike 的正宗亚洲美食——寿司、缅甸、泰式与中式菜肴，兼具经典与现代演绎。",
    viewMenu: "查看菜单", orderNow: "立即点餐", featured: "招牌菜品", browseCategories: "按分类浏览",
    whyUs: "顾客为何喜欢我们", whatGuestsSay: "顾客怎么说", visitUs: "到店拜访", getDirections: "获取路线",
    openHours: "营业时间", recommendedSection: "为你推荐", recommended: "推荐",
    sortRecommended: "推荐", sortPriceLow: "价格：从低到高", sortPriceHigh: "价格：从高到低", sortRating: "评分最高",
    favorites: "收藏", favoritesEmpty: "还没有收藏 — 点击菜品上的爱心即可保存。",
    footerRights: "版权所有。",
    aboutTitle: "关于 Hello Sushi",
    storyTitle: "我们的故事", story: "Hello Sushi 是位于南纳什维尔 Nolensville Pike 的社区餐厅，让烹饪艺术与亚洲风味在此相遇。",
    conceptTitle: "寿司、缅甸、泰式与中式 —— 一个厨房", concept: "寿司卷与握寿司、缅式咖喱、泰式炒面与中式经典，兼具经典与现代演绎。",
    freshTitle: "现点现做", fresh: "卷物现点现切，每一份摆盘都用心，整份菜单都有丰富的素食选择。",
    prepTitle: "用心制作", prep: "无论你是常客还是第一次尝试，我们的厨师都为每一道菜倾注热情与精准。",
    philosophyTitle: "宴会与活动", philosophy: "我们为生日、节日、公司活动和婚礼提供高级寿司宴会，并接受私人聚会预订。",
    reserveTitle: "预订餐桌", reserveIntro: "告诉我们您何时到店，我们会备好餐桌。",
    date: "日期", time: "时间", guests: "人数", specialRequests: "特殊要求",
    reserveSubmit: "提交预订", reserveThanks: "已提交预订",
    reserveThanksBody: "我们已收到您的请求，稍后将通过电话或邮件确认。",
    reserveAnother: "再次预订", guest: "位", guestsWord: "位",
  },
  es: {
    navHome: "Inicio", navMenu: "Menú", navAbout: "Nosotros", navBook: "Reservar", navCategories: "Categorías", navContact: "Contacto",
    categoriesTitle: "Categorías del menú", allCategories: "Todas las categorías", contactTitle: "Contacto y ubicación", ingredients: "Ingredientes",
    orderingFor: "Estás pidiendo para", featureBandTitle: "Sushi y cocina asiática",
    featureBandText: "Sushi enrollado al momento, curris birmanos y fideos al estilo tailandés, recién preparados y servidos con cariño.",
    popularDishesBtn: "Platos populares", popularPicksTitle: "Favoritos de los clientes", callUs: "Llámanos", emailUs: "Escríbenos", findUs: "Cómo llegar",
    search: "Buscar en el menú", table: "Mesa", all: "Todo", popular: "Popular",
    vegetarian: "Vegetariano", spicy: "Picante",
    popularSection: "Popular ahora", fullMenu: "Menú completo", noMatch: "Ningún plato coincide con tu búsqueda.",
    addToCart: "Añadir al carrito", size: "Tamaño", spiceLevel: "Nivel de picante", addOns: "Extras",
    instructions: "Instrucciones especiales", instructionsPh: "p. ej. sin wasabi, por favor",
    quantity: "Cantidad", soldOut: "Agotado", yourOrder: "Tu pedido", cartEmpty: "Tu carrito está vacío.",
    clearCart: "Vaciar carrito", subtotal: "Subtotal", tax: "Impuesto", deliveryFee: "Envío", total: "Total",
    continueCheckout: "Continuar al pago", checkout: "Pago", orderType: "Tipo de pedido",
    dineIn: "Para comer aquí", takeaway: "Para llevar", delivery: "Entrega a domicilio", name: "Nombre",
    phone: "Teléfono", email: "Correo", kitchenNote: "Nota para la cocina (opcional)", payment: "Pago",
    placeOrder: "Realizar pedido", placing: "Realizando pedido…", orderPlaced: "Pedido realizado",
    kitchenReceived: "La cocina ha recibido tu pedido.", estimated: "Estimado", min: "min",
    trackOrder: "Seguir mi pedido", backToMenu: "Volver al menú", orderTracking: "Seguimiento del pedido",
    autoUpdate: "Esta pantalla se actualiza automáticamente, no necesitas recargar.", orderSomethingElse: "Pedir algo más",
    items: "artículos", promo: "Código promocional", apply: "Aplicar", applied: "Aplicado",
    promoInvalid: "Ese código no es válido.", inProgress: "En curso", discount: "Descuento",
    orderCancelled: "Este pedido fue cancelado.", orderCancelledHelp: "Habla con un miembro del personal si tienes preguntas.",
    scanToTrack: "Escanea este código con tu teléfono para seguir el pedido en otro dispositivo.",
    orderNotFound: "Pedido no encontrado", orderNotFoundHelp: "Este enlace de pedido no se puede abrir aquí. Consulta con un miembro del personal.",
    qrNote: "El código QR de pago del restaurante se mostrará al finalizar la compra.", selectLanguage: "Idioma",
    payNow: "Pagar ahora", howToPay: "Cómo pagar", completeYourPayment: "Completa tu pago", paymentPending: "Pago pendiente",
    add: "Añadir", reviews: "reseñas", allergens: "Alérgenos", contains: "Contiene",
    heroIntro: "Una escapada a la auténtica cocina asiática en Nolensville Pike: sushi, birmana, tailandesa y china, en versiones clásicas y modernas.",
    viewMenu: "Ver menú", orderNow: "Pedir ahora", featured: "Platos destacados", browseCategories: "Explorar por categoría",
    whyUs: "Por qué nos quieren", whatGuestsSay: "Lo que dicen nuestros clientes", visitUs: "Visítanos", getDirections: "Cómo llegar",
    openHours: "Horario", recommendedSection: "Recomendado para ti", recommended: "Recomendado",
    sortRecommended: "Recomendado", sortPriceLow: "Precio: de menor a mayor", sortPriceHigh: "Precio: de mayor a menor", sortRating: "Mejor valorados",
    favorites: "Favoritos", favoritesEmpty: "Aún no hay favoritos: toca el corazón de un plato para guardarlo.",
    footerRights: "Todos los derechos reservados.",
    aboutTitle: "Sobre Hello Sushi",
    storyTitle: "Nuestra historia", story: "Hello Sushi es un local de barrio en Nolensville Pike, en el sur de Nashville, donde el arte culinario se encuentra con los sabores asiáticos.",
    conceptTitle: "Sushi, birmana, tailandesa y china: una cocina", concept: "Rollos y nigiri, curris birmanos, fideos tailandeses y clásicos chinos, en versiones clásicas y modernas.",
    freshTitle: "Hecho al momento", fresh: "Los rolls se cortan al pedirlos y cada plato se monta con cuidado. Hay opciones vegetarianas en toda la carta.",
    prepTitle: "Elaborado con cuidado", prep: "Nuestros chefs ponen pasión y precisión en cada plato, seas cliente habitual o lo pruebes por primera vez.",
    philosophyTitle: "Catering y eventos", philosophy: "Ofrecemos catering de sushi para cumpleaños, fiestas, eventos de empresa y bodas, y aceptamos reservas para grupos privados.",
    reserveTitle: "Reservar mesa", reserveIntro: "Dinos cuándo vienes y tendremos una mesa lista.",
    date: "Fecha", time: "Hora", guests: "Comensales", specialRequests: "Peticiones especiales",
    reserveSubmit: "Solicitar reserva", reserveThanks: "Reserva solicitada",
    reserveThanksBody: "Hemos recibido tu solicitud y la confirmaremos por teléfono o correo en breve.",
    reserveAnother: "Hacer otra solicitud", guest: "comensal", guestsWord: "comensales",
  },
  th: {
    navHome: "หน้าแรก", navMenu: "เมนู", navAbout: "เกี่ยวกับ", navBook: "จองโต๊ะ", navCategories: "หมวดหมู่", navContact: "ติดต่อ",
    categoriesTitle: "หมวดหมู่เมนู", allCategories: "ทุกหมวดหมู่", contactTitle: "ติดต่อและที่ตั้ง", ingredients: "ส่วนผสม",
    orderingFor: "คุณกำลังสั่งสำหรับ", featureBandTitle: "ซูชิและอาหารเอเชีย",
    featureBandText: "ซูชิม้วนสดตามสั่ง แกงพม่า และก๋วยเตี๋ยวสไตล์ไทย ปรุงสดใหม่และเสิร์ฟด้วยความใส่ใจ",
    popularDishesBtn: "เมนูยอดนิยม", popularPicksTitle: "เมนูยอดนิยมของลูกค้า", callUs: "โทรหาเรา", emailUs: "ส่งอีเมล", findUs: "ดูแผนที่",
    search: "ค้นหาเมนู", table: "โต๊ะ", all: "ทั้งหมด", popular: "ยอดนิยม",
    vegetarian: "มังสวิรัติ", spicy: "เผ็ด",
    popularSection: "ยอดนิยมตอนนี้", fullMenu: "เมนูทั้งหมด", noMatch: "ไม่พบเมนูที่ตรงกับการค้นหา",
    addToCart: "ใส่ตะกร้า", size: "ขนาด", spiceLevel: "ระดับความเผ็ด", addOns: "เพิ่มเติม",
    instructions: "คำสั่งพิเศษ", instructionsPh: "เช่น ไม่ใส่วาซาบิ",
    quantity: "จำนวน", soldOut: "ของหมด", yourOrder: "ออร์เดอร์ของคุณ", cartEmpty: "ตะกร้าของคุณว่างเปล่า",
    clearCart: "ล้างตะกร้า", subtotal: "ยอดรวมย่อย", tax: "ภาษี", deliveryFee: "ค่าจัดส่ง", total: "ยอดรวม",
    continueCheckout: "ดำเนินการชำระเงิน", checkout: "ชำระเงิน", orderType: "ประเภทออร์เดอร์",
    dineIn: "ทานที่ร้าน", takeaway: "กลับบ้าน", delivery: "จัดส่ง", name: "ชื่อ",
    phone: "เบอร์โทร", email: "อีเมล", kitchenNote: "หมายเหตุถึงครัว (ไม่บังคับ)", payment: "การชำระเงิน",
    placeOrder: "สั่งอาหาร", placing: "กำลังสั่ง…", orderPlaced: "สั่งอาหารแล้ว",
    kitchenReceived: "ครัวได้รับออร์เดอร์ของคุณแล้ว", estimated: "โดยประมาณ", min: "นาที",
    trackOrder: "ติดตามออร์เดอร์", backToMenu: "กลับไปที่เมนู", orderTracking: "การติดตามออร์เดอร์",
    autoUpdate: "หน้านี้อัปเดตอัตโนมัติ ไม่ต้องรีเฟรช", orderSomethingElse: "สั่งเพิ่ม",
    items: "รายการ", promo: "โค้ดส่วนลด", apply: "ใช้", applied: "ใช้แล้ว",
    promoInvalid: "โค้ดนี้ใช้ไม่ได้", inProgress: "กำลังดำเนินการ", discount: "ส่วนลด",
    orderCancelled: "ออร์เดอร์นี้ถูกยกเลิก", orderCancelledHelp: "หากมีคำถามกรุณาติดต่อพนักงาน",
    scanToTrack: "สแกนโค้ดนี้ด้วยมือถือเพื่อติดตามออร์เดอร์บนอุปกรณ์อื่น",
    orderNotFound: "ไม่พบออร์เดอร์", orderNotFoundHelp: "ไม่สามารถเปิดลิงก์ออร์เดอร์นี้ได้ กรุณาสอบถามพนักงาน",
    qrNote: "คิวอาร์โค้ดสำหรับชำระเงินของร้านจะแสดงตอนชำระเงิน", selectLanguage: "ภาษา",
    payNow: "ชำระเงินตอนนี้", howToPay: "วิธีชำระเงิน", completeYourPayment: "ชำระเงินให้เสร็จสิ้น", paymentPending: "รอชำระเงิน",
    add: "เพิ่ม", reviews: "รีวิว", allergens: "สารก่อภูมิแพ้", contains: "มีส่วนผสมของ",
    heroIntro: "การพักผ่อนสู่อาหารเอเชียแท้บนถนน Nolensville Pike — ซูชิ พม่า ไทย และจีน ทั้งแบบดั้งเดิมและร่วมสมัย",
    viewMenu: "ดูเมนู", orderNow: "สั่งเลย", featured: "เมนูแนะนำ", browseCategories: "เลือกตามหมวดหมู่",
    whyUs: "ทำไมลูกค้าถึงรักเรา", whatGuestsSay: "ลูกค้าพูดถึงเรา", visitUs: "มาเยี่ยมเรา", getDirections: "ดูเส้นทาง",
    openHours: "เวลาทำการ", recommendedSection: "แนะนำสำหรับคุณ", recommended: "แนะนำ",
    sortRecommended: "แนะนำ", sortPriceLow: "ราคา: น้อยไปมาก", sortPriceHigh: "ราคา: มากไปน้อย", sortRating: "คะแนนสูงสุด",
    favorites: "รายการโปรด", favoritesEmpty: "ยังไม่มีรายการโปรด — แตะรูปหัวใจบนเมนูเพื่อบันทึก",
    footerRights: "สงวนลิขสิทธิ์",
    aboutTitle: "เกี่ยวกับ Hello Sushi",
    storyTitle: "เรื่องราวของเรา", story: "Hello Sushi เป็นร้านประจำย่านบนถนน Nolensville Pike ทางใต้ของแนชวิลล์ ที่ศิลปะการทำอาหารมาบรรจบกับรสชาติเอเชีย",
    conceptTitle: "ซูชิ พม่า ไทย และจีน — ครัวเดียว", concept: "ซูชิโรลและนิกิริ แกงพม่า ก๋วยเตี๋ยวสไตล์ไทย และเมนูจีนคลาสสิก ทั้งแบบดั้งเดิมและร่วมสมัย",
    freshTitle: "ทำสดตามสั่ง", fresh: "โรลหั่นเมื่อสั่ง และจัดจานอย่างประณีต มีเมนูมังสวิรัติตลอดทั้งเมนู",
    prepTitle: "ปรุงอย่างใส่ใจ", prep: "ไม่ว่าคุณจะเป็นขาประจำหรือลองครั้งแรก เชฟของเราใส่ใจและความประณีตในทุกจาน",
    philosophyTitle: "จัดเลี้ยงและงานอีเวนต์", philosophy: "เรารับจัดเลี้ยงซูชิสำหรับวันเกิด เทศกาล งานบริษัท และงานแต่งงาน รวมถึงรับจองปาร์ตี้ส่วนตัว",
    reserveTitle: "จองโต๊ะ", reserveIntro: "บอกเราว่าคุณจะมาเมื่อไหร่ แล้วเราจะเตรียมโต๊ะไว้ให้",
    date: "วันที่", time: "เวลา", guests: "จำนวนคน", specialRequests: "คำขอพิเศษ",
    reserveSubmit: "ขอจองโต๊ะ", reserveThanks: "ส่งคำขอจองแล้ว",
    reserveThanksBody: "เราได้รับคำขอของคุณแล้ว และจะยืนยันทางโทรศัพท์หรืออีเมลเร็ว ๆ นี้",
    reserveAnother: "ขอจองอีกครั้ง", guest: "คน", guestsWord: "คน",
  },
};

/* ------------------------------------------------------------- styles */

const CSS = `
.sn-root{
  --ink:#22252B; --ink-soft:#6A6F7A; --paper:#FBF7F1; --paper-dim:#F1EADE;
  --line:rgba(34,37,43,0.13); --wine:#D6482E; --wine-dark:#A8331D;
  --gold:#E0A73C; --gold-soft:#F3E1B8; --herb:#5E8C6A; --herb-dark:#436B4F;
  --charcoal:#1B2330; --charcoal-2:#232E3E; --charcoal-3:#2E3A4C;
  --ticket:#FBF7F1; --ticket-ink:#22252B;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink); position:relative;
}
.sn-root *{ box-sizing:border-box; }
.sn-serif{ font-family:'Cormorant Garamond',Georgia,serif; }
.sn-mono{ font-family:'JetBrains Mono','Menlo',monospace; }
.sn-btn{ cursor:pointer; border:none; font-family:inherit; }
.sn-scroll::-webkit-scrollbar{ display:none; }
.sn-scroll{ scrollbar-width:none; -ms-overflow-style:none; }
.sn-pattern{
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 16px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 16px);
}
.sn-card{ transition:transform 0.16s ease, box-shadow 0.16s ease; }
.sn-card:hover{ transform:translateY(-2px); box-shadow:0 10px 24px rgba(34,37,43,0.12); }
@keyframes sn-pop{ 0%{ transform:scale(0.9); opacity:0;} 100%{ transform:scale(1); opacity:1;} }
@keyframes sn-slide-up{ 0%{ transform:translateY(16px); opacity:0;} 100%{ transform:translateY(0); opacity:1;} }
@keyframes sn-pulse{ 0%,100%{ opacity:1;} 50%{ opacity:0.45;} }
@keyframes sn-toast-in{ 0%{ transform:translateX(-50%) translateY(-12px); opacity:0;} 100%{ transform:translateX(-50%) translateY(0); opacity:1;} }
@keyframes sn-heart{ 0%{ transform:scale(1);} 40%{ transform:scale(1.35);} 100%{ transform:scale(1);} }
@keyframes sn-spin{ 100%{ transform:rotate(360deg);} }
.sn-spin{ animation:sn-spin 0.8s linear infinite; }
@media print{
  body *{ visibility:hidden; }
  .sn-receipt, .sn-receipt *, .sn-print, .sn-print *{ visibility:visible; }
  .sn-receipt, .sn-print{ position:absolute; left:0; top:0; width:100%; }
  .sn-qr-card{ break-inside:avoid; }
}
`;

/* --------------------------------------------------------------- root */

function readTableParam() {
  try {
    const raw = new URLSearchParams(window.location.search).get("table");
    if (!raw) return null;
    const n = raw.replace(/[^0-9]/g, "").slice(0, 3);
    return n ? n.padStart(2, "0") : null;
  } catch { return null; }
}
function readOrderParam() {
  try {
    const raw = new URLSearchParams(window.location.search).get("order");
    return raw ? raw.trim().toUpperCase().slice(0, 12) : null;
  } catch { return null; }
}

export default function App() {
  const tableParam = readTableParam();
  const orderParam = readOrderParam();
  const [mode, setMode] = useState("customer");
  const [lang, setLang] = useState("en");
  const [table] = useState(tableParam || "07");
  const [tableLocked] = useState(!!tableParam);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [customerScreen, setCustomerScreen] = useState(orderParam ? "tracking" : tableParam ? "menu" : "home");
  const [lookupOrderNumber] = useState(orderParam || null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [favorites, setFavorites] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [addedToast, setAddedToast] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [menuItemsState, setMenuItemsState] = useState([]);
  const [categoriesState, setCategoriesState] = useState([]);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", email: "", instructions: "", payment: "Pay at counter", orderType: "Dine-in" });
  const [staffTab, setStaffTab] = useState("overview");
  const [staffToast, setStaffToast] = useState(null);
  const [session, setSession] = useState(null);
  const [dataReady, setDataReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // "db"  = catalog is coming from Supabase (safe to edit + accept realtime)
  // "bundled" = showing the built-in menu; the database has not been initialised
  const [catalogSource, setCatalogSource] = useState("bundled");
  const dbReadyRef = useRef(false);
  const adminAuthed = !!session;
  const seenOrderCount = useRef(0);
  const t = T[lang] || T.en;

  const useBundled = () => { setCategoriesState(CATS); setMenuItemsState(MENU_ITEMS); dbReadyRef.current = false; setCatalogSource("bundled"); };

  // ---- initial load from Supabase (falls back to the bundled menu) ----
  useEffect(() => {
    let alive = true;
    if (!supabaseConfigured) {
      useBundled();
      setLoadError("not-configured");
      setDataReady(true);
      return;
    }
    loadAll().then((d) => {
      if (!alive) return;
      // The catalog is DB-owned once at least one category row exists (the seed
      // writes categories + items together). Until then, show the bundled menu.
      const seeded = d.categories.length > 0;
      if (seeded) {
        setCategoriesState(d.categories);
        setMenuItemsState(d.menuItems);
        dbReadyRef.current = true;
        setCatalogSource("db");
      } else {
        useBundled();
      }
      setOrders(d.orders);
      setReservations(d.reservations);
      if (d.content) setContent(d.content);
      if (d.settings) setSettings(d.settings);
      seenOrderCount.current = d.orders.filter((o) => o.status !== "Cancelled").length;
      setDataReady(true);
    }).catch((e) => {
      if (!alive) return;
      // DB unreachable / schema not created yet — keep the app usable on the
      // bundled menu instead of a blocking error screen.
      console.warn("[Hello Sushi] Supabase load failed, using bundled menu:", e.message || e);
      useBundled();
      setLoadError(e.message || String(e));
      setDataReady(true);
    });
    return () => { alive = false; };
  }, []);

  // ---- realtime: refetch a table whenever it changes anywhere ----
  // Menu/category refetchers only run once the catalog is DB-owned, so a single
  // edit made while still on the bundled menu can't collapse the list.
  useEffect(() => {
    return watch({
      onOrders: () => fetchOrders().then(setOrders).catch(() => {}),
      onReservations: () => fetchReservations().then(setReservations).catch(() => {}),
      onMenu: () => { if (dbReadyRef.current) fetchMenuItems().then((r) => r.length && setMenuItemsState(r)).catch(() => {}); },
      onCategories: () => { if (dbReadyRef.current) fetchCategories().then((r) => r.length && setCategoriesState(r)).catch(() => {}); },
      onContent: () => fetchContent().then((c) => c && setContent(c)).catch(() => {}),
      onSettings: () => fetchSettings().then((s) => s && setSettings(s)).catch(() => {}),
    });
  }, []);

  // ---- auth session ---------------------------------------------
  useEffect(() => {
    auth.getSession().then(setSession);
    const { data } = auth.onChange(setSession);
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const active = orders.filter((o) => o.status !== "Cancelled");
    if (mode === "staff" && adminAuthed && active.length > seenOrderCount.current) {
      const diff = active.length - seenOrderCount.current;
      seenOrderCount.current = active.length;
      setStaffToast(`${diff === 1 ? "New order" : `${diff} new orders`} received`);
      const tm = setTimeout(() => setStaffToast(null), 3200);
      return () => clearTimeout(tm);
    }
    seenOrderCount.current = active.length;
  }, [orders, mode, adminAuthed]);

  const activeOrder = orders.find((o) => o.id === activeOrderId)
    || (lookupOrderNumber && orders.find((o) => o.orderNumber && o.orderNumber.toUpperCase() === lookupOrderNumber))
    || null;
  const activeCats = useMemo(() => categoriesState.filter((c) => c.active).sort((a, b) => a.order - b.order), [categoriesState]);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const tax = subtotal * settings.taxRate;
    const service = subtotal * (settings.serviceRate || 0);
    const deliveryFee = checkoutForm.orderType === "Delivery" && cart.length ? settings.deliveryFee : 0;
    const discount = promoApplied ? subtotal * ((Number(content.promoDiscountPct) || 0) / 100) : 0;
    const total = Math.max(0, subtotal + tax + service + deliveryFee - discount);
    return { subtotal, tax, service, deliveryFee, discount, total };
  }, [cart, promoApplied, checkoutForm.orderType, settings, content.promoDiscountPct]);

  function addToCart(line) {
    setCart((c) => [...c, line]);
    setSelectedItem(null);
    setAddedToast(line.name);
    setTimeout(() => setAddedToast(null), 1800);
  }
  function updateQty(cartId, delta) {
    setCart((c) => c.map((l) => (l.cartId === cartId ? { ...l, qty: Math.max(1, l.qty + delta) } : l)));
  }
  function toggleFavorite(itemId) {
    setFavorites((f) => (f.includes(itemId) ? f.filter((x) => x !== itemId) : [...f, itemId]));
  }
  function removeLine(cartId) {
    setCart((c) => c.filter((l) => l.cartId !== cartId));
  }
  function clearCart() {
    setCart([]);
    setPromoApplied(false);
    setPromoCode("");
  }
  function applyPromo() {
    const code = (content.promoCode || "").trim().toUpperCase();
    if (code && promoCode.trim().toUpperCase() === code) {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError((T[lang] || T.en).promoInvalid);
      setPromoApplied(false);
    }
  }

  const dbFail = (e) => window.alert("Could not save — " + (e?.message || e));

  async function placeOrder() {
    if (placing) return;
    setPlacing(true);
    try {
      const draft = {
        table: checkoutForm.orderType === "Dine-in" ? table : null,
        items: cart,
        ...checkoutForm,
        ...cartTotals,
        status: "New",
        placedAt: Date.now(),
        estMinutes: 15 + Math.floor(cart.length * 1.5),
      };
      const saved = await db.createOrder(draft);
      setOrders((o) => [...o.filter((x) => x.id !== saved.id), saved]);
      setActiveOrderId(saved.id);
      setCustomerScreen("confirmation");
      clearCart();
    } catch (e) {
      window.alert("Could not place your order — " + (e?.message || e));
    } finally {
      setPlacing(false);
    }
  }

  function advanceStatus(orderId) {
    const o = orders.find((x) => x.id === orderId);
    if (!o) return;
    const idx = STAFF_STATUSES.indexOf(o.status);
    const next = STAFF_STATUSES[Math.min(idx + 1, STAFF_STATUSES.length - 1)];
    setOrderStatus(orderId, next);
  }
  function setOrderStatus(orderId, status) {
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, status } : o)));
    db.updateOrderStatus(orderId, status).catch(dbFail);
  }
  function cancelOrder(orderId) {
    setOrderStatus(orderId, "Cancelled");
  }
  function deleteOrder(orderId) {
    setOrders((os) => os.filter((o) => o.id !== orderId));
    db.deleteOrder(orderId).catch(dbFail);
  }
  async function clearOrders(statuses) {
    const ids = orders.filter((o) => statuses.includes(o.status)).map((o) => o.id);
    if (!ids.length) return 0;
    setOrders((os) => os.filter((o) => !ids.includes(o.id)));
    try { await db.deleteOrders(ids); } catch (e) { dbFail(e); }
    return ids.length;
  }
  function toggleSoldOut(itemId) {
    const it = menuItemsState.find((i) => i.id === itemId);
    if (!it) return;
    saveMenuItem({ ...it, available: it.available === false });
  }
  function saveMenuItem(item) {
    setMenuItemsState((items) => {
      const exists = items.some((i) => i.id === item.id);
      return exists ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];
    });
    db.saveMenuItem(item).catch(dbFail);
  }
  function deleteMenuItem(id) {
    setMenuItemsState((items) => items.filter((i) => i.id !== id));
    db.deleteMenuItem(id).catch(dbFail);
  }
  function saveCategory(cat) {
    setCategoriesState((cs) => {
      const exists = cs.some((c) => c.id === cat.id);
      return exists ? cs.map((c) => (c.id === cat.id ? cat : c)) : [...cs, cat];
    });
    db.saveCategory(cat).catch(dbFail);
  }
  function deleteCategory(id) {
    setCategoriesState((cs) => cs.filter((c) => c.id !== id));
    db.deleteCategory(id).catch(dbFail);
  }
  function moveCategory(id, dir) {
    const sorted = [...categoriesState].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const a = { ...sorted[i], order: sorted[j].order };
    const b = { ...sorted[j], order: sorted[i].order };
    setCategoriesState((cs) => cs.map((c) => (c.id === a.id ? a : c.id === b.id ? b : c)));
    db.saveCategories([a, b]).catch(dbFail);
  }
  async function addReservation(res) {
    await db.createReservation(res); // let the Reserve screen surface any error
  }
  function updateReservation(id, status) {
    setReservations((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    db.updateReservation(id, status).catch(dbFail);
  }
  function saveContent(next) {
    setContent(next);
    db.saveContent(next).catch(dbFail);
  }
  function saveSettings(next) {
    setSettings(next);
    db.saveSettings(next).catch(dbFail);
  }
  async function seedDatabase() {
    await seedFromDefaults({ categories: CATS, menuItems: MENU_ITEMS, content: DEFAULT_CONTENT, settings: DEFAULT_SETTINGS });
    const d = await loadAll();
    setCategoriesState(d.categories.length ? d.categories : CATS);
    setMenuItemsState(d.menuItems.length ? d.menuItems : MENU_ITEMS);
    if (d.content) setContent(d.content);
    if (d.settings) setSettings(d.settings);
    dbReadyRef.current = d.categories.length > 0;
    setCatalogSource(d.categories.length > 0 ? "db" : "bundled");
  }

  return (
    <div className="sn-root" style={{ minHeight: 600, background: mode === "customer" ? "var(--paper-dim)" : "var(--charcoal)", padding: "18px 0 40px", transition: "background 0.2s" }}>
      <style>{CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Noto+Sans+Myanmar:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap'); .sn-root{ font-family:'Inter','Noto Sans Myanmar','Noto Sans Thai','Noto Sans SC',system-ui,sans-serif; }`}</style>

      <TopBar mode={mode} setMode={setMode} lang={lang} setLang={setLang} t={t} cart={cart} screen={customerScreen} setScreen={setCustomerScreen} settings={settings} />

      {dataReady && catalogSource === "bundled" && (
        <OfflineBanner kind={loadError === "not-configured" ? "not-configured" : loadError ? "offline" : "not-seeded"} />
      )}

      {!dataReady ? (
        <BootSplash mode={mode} />
      ) : mode === "customer" ? (
        <CustomerApp
          t={t} lang={lang} table={table} tableLocked={tableLocked} settings={settings}
          content={content}
          menuItems={menuItemsState}
          cats={activeCats}
          reviews={content.reviews}
          cart={cart}
          cartTotals={cartTotals}
          screen={customerScreen}
          setScreen={setCustomerScreen}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          search={search}
          setSearch={setSearch}
          sortBy={sortBy}
          setSortBy={setSortBy}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          addToCart={addToCart}
          updateQty={updateQty}
          removeLine={removeLine}
          clearCart={clearCart}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          promoApplied={promoApplied}
          promoError={promoError}
          applyPromo={applyPromo}
          checkoutForm={checkoutForm}
          setCheckoutForm={setCheckoutForm}
          placing={placing}
          placeOrder={placeOrder}
          activeOrder={activeOrder}
          addedToast={addedToast}
          addReservation={addReservation}
        />
      ) : adminAuthed ? (
        <AdminApp
          orders={orders}
          reservations={reservations}
          settings={settings}
          setSettings={saveSettings}
          content={content}
          setContent={saveContent}
          staffTab={staffTab}
          setStaffTab={setStaffTab}
          advanceStatus={advanceStatus}
          setOrderStatus={setOrderStatus}
          cancelOrder={cancelOrder}
          deleteOrder={deleteOrder}
          clearOrders={clearOrders}
          staffToast={staffToast}
          menuItems={menuItemsState}
          categories={categoriesState}
          toggleSoldOut={toggleSoldOut}
          saveMenuItem={saveMenuItem}
          deleteMenuItem={deleteMenuItem}
          saveCategory={saveCategory}
          deleteCategory={deleteCategory}
          moveCategory={moveCategory}
          updateReservation={updateReservation}
          seedDatabase={seedDatabase}
          dbReady={catalogSource === "db"}
          adminEmail={session?.user?.email || ""}
          onLogout={() => auth.signOut()}
        />
      ) : (
        <AdminLogin />
      )}
    </div>
  );
}

/* ---------------------------------------------------------- top bar */

const BACK_TARGET = { cart: "menu", checkout: "cart", confirmation: "menu", tracking: "menu" };

function TopBar({ mode, setMode, lang, setLang, t, cart = [], screen = "menu", setScreen, settings }) {
  const [langOpen, setLangOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const backTo = BACK_TARGET[screen];
  const iconBtn = { width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid var(--line)", color: "var(--ink-soft)" };
  return (
    <div style={{ maxWidth: mode === "customer" ? 460 : 1180, margin: "0 auto 14px", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      {mode === "customer" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {backTo && (
            <button className="sn-btn" aria-label="back" onClick={() => setScreen(backTo)} style={iconBtn}>
              <ChevronLeft size={17} />
            </button>
          )}
          <button className="sn-btn" aria-label={settings.name} onClick={() => setScreen("home")} style={{ display: "flex", alignItems: "center", background: "transparent", padding: 0 }}>
            <Logo height={30} />
          </button>
        </div>
      ) : <span />}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {mode === "customer" && (
          <div style={{ position: "relative" }}>
            <button className="sn-btn" onClick={() => setLangOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
              <Globe size={13} /> {current.label}
            </button>
            {langOpen && (
              <>
                <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 4, minWidth: 150, boxShadow: "0 8px 24px rgba(34,37,43,0.16)", zIndex: 50 }}>
                  {LANGS.map((l) => (
                    <button key={l.code} className="sn-btn" onClick={() => { setLang(l.code); setLangOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: l.code === lang ? "var(--paper-dim)" : "transparent", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      {l.label} {l.code === lang && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {mode === "customer" && (
          <button
            className="sn-btn"
            onClick={() => setScreen("cart")}
            aria-label={(t && t.yourOrder) || "Your order"}
            title={(t && t.yourOrder) || "Your order"}
            style={{
              position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34,
              background: screen === "cart" ? "var(--wine)" : "#fff",
              color: screen === "cart" ? "#fff" : "var(--ink-soft)",
              border: `1px solid ${screen === "cart" ? "var(--wine)" : "var(--line)"}`,
              borderRadius: 999,
            }}
          >
            <ShoppingCart size={15} />
            {cartCount > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 999, background: "var(--gold)", color: "var(--charcoal)", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, border: "1.5px solid var(--paper-dim)" }}>
                {cartCount}
              </span>
            )}
          </button>
        )}
        <div style={{ display: "inline-flex", background: mode === "customer" ? "#fff" : "var(--charcoal-2)", border: `1px solid ${mode === "customer" ? "var(--line)" : "rgba(255,255,255,0.14)"}`, borderRadius: 999, padding: 3, gap: 2 }}>
          {["customer", "staff"].map((m) => (
            <button
              key={m}
              className="sn-btn"
              onClick={() => setMode(m)}
              style={{
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                background: mode === m ? "var(--wine)" : "transparent",
                color: mode === m ? "#fff" : mode === "customer" ? "var(--ink-soft)" : "rgba(255,255,255,0.55)",
              }}
            >
              {m === "customer" ? "Guest" : "Admin"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomerNav({ t, screen, setScreen }) {
  const links = [
    { id: "home", label: t.navHome, icon: Home },
    { id: "menu", label: t.navMenu, icon: Utensils },
    { id: "categories", label: t.navCategories, icon: LayoutGrid },
    { id: "about", label: t.navAbout, icon: BookOpen },
    { id: "contact", label: t.navContact, icon: MapPin },
  ];
  return (
    <div style={{ display: "flex", gap: 2, padding: "9px 8px", borderBottom: "1px solid var(--line)", background: "#fff", position: "sticky", top: 0, zIndex: 30 }}>
      {links.map((l) => {
        const Icon = l.icon;
        const on = screen === l.id || (screen === "reserve" && l.id === "contact");
        return (
          <button key={l.id} className="sn-btn" onClick={() => setScreen(l.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 1px", borderRadius: 10, background: on ? "var(--paper-dim)" : "transparent", color: on ? "var(--wine)" : "var(--ink-soft)", fontSize: 10, fontWeight: 700 }}>
            <Icon size={15} /> {l.label}
          </button>
        );
      })}
    </div>
  );
}

function TableBanner({ t, table }) {
  return (
    <div style={{ background: "var(--herb)", color: "#fff", padding: "8px 16px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
      <Table2 size={13} /> {t.orderingFor} {t.table} {table}
    </div>
  );
}

/* =============================================================== */
/* CUSTOMER APP                                                     */
/* =============================================================== */

function CustomerApp(props) {
  const { screen, tableLocked, t, table } = props;
  const showNav = ["home", "menu", "categories", "about", "contact", "reserve"].includes(screen);
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", background: "var(--paper)", borderRadius: 22, overflow: "hidden", boxShadow: "0 1px 0 var(--line)", border: "1px solid var(--line)", minHeight: 640, position: "relative" }}>
      {showNav && <CustomerNav {...props} />}
      {tableLocked && ["home", "menu", "categories", "cart", "checkout"].includes(screen) && <TableBanner t={t} table={table} />}
      {screen === "home" && <HomeScreen {...props} />}
      {screen === "about" && <AboutScreen {...props} />}
      {screen === "categories" && <CategoriesScreen {...props} />}
      {screen === "contact" && <ContactScreen {...props} />}
      {screen === "reserve" && <ReserveScreen {...props} />}
      {screen === "menu" && <MenuScreen {...props} />}
      {screen === "cart" && <CartScreen {...props} />}
      {screen === "checkout" && <CheckoutScreen {...props} />}
      {screen === "confirmation" && <ConfirmationScreen {...props} />}
      {screen === "tracking" && <TrackingScreen {...props} />}
      {props.selectedItem && <ItemModal t={props.t} lang={props.lang} cats={props.cats} item={props.selectedItem} onClose={() => props.setSelectedItem(null)} onAdd={props.addToCart} fav={props.favorites.includes(props.selectedItem.id)} onFav={() => props.toggleFavorite(props.selectedItem.id)} />}
      {props.addedToast && <AddedToast name={props.addedToast} />}
    </div>
  );
}

/* Brand mark — /logo.png lives in public/. `chip` wraps it in a soft card so it
 * reads well on dark surfaces (the artwork has a cream background). */
const LOGO_SRC = "/logo.png";
function Logo({ height = 30, chip = false, style }) {
  const img = (
    <img
      src={LOGO_SRC}
      alt="Hello Sushi — Asian Cuisine"
      style={{ height, width: "auto", display: "block", objectFit: "contain", ...(chip ? null : style) }}
    />
  );
  if (!chip) return img;
  return (
    <span style={{ display: "inline-flex", background: "#F4F1E9", borderRadius: 14, padding: "10px 16px", boxShadow: "0 6px 20px rgba(0,0,0,0.18)", ...style }}>
      {img}
    </span>
  );
}

function AddedToast({ name }) {
  return (
    <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "#fff", padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, zIndex: 210, animation: "sn-toast-in 0.25s ease", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
      <Check size={14} /> {name}
    </div>
  );
}

function catOf(id, cats, lang) {
  const c = (cats || CATS).find((x) => x.id === id);
  return c ? tr(c, lang) : id;
}

/* ---------------------------------------------------------- home */

// content field with fallback to the translated default
const cf = (content, t, key) => (content && content[key] && String(content[key]).trim() ? content[key] : t[key]);

function HomeScreen({ t, lang, settings, content, menuItems, cats, reviews, setScreen, setActiveCategory, setSelectedItem, favorites, toggleFavorite }) {
  const featured = menuItems.filter((i) => (i.recommended || i.popular) && i.available).slice(0, 8);
  const popIds = (content.popularPickIds && content.popularPickIds.length ? content.popularPickIds : POPULAR_PICK_IDS);
  const popularPicks = popIds.map((id) => menuItems.find((i) => i.id === id)).filter((i) => i && i.available);
  const highlights = content.highlights && content.highlights.length ? content.highlights : DEFAULT_CONTENT.highlights;
  const goPopular = () => { setActiveCategory("Popular"); setScreen("menu"); };
  return (
    <div>
      <div className="sn-pattern" style={{ background: "linear-gradient(155deg, var(--charcoal) 0%, var(--charcoal-3) 100%)", color: "var(--paper)", padding: "40px 22px 34px", textAlign: "center" }}>
        <h1 style={{ margin: 0, display: "flex", justifyContent: "center" }}>
          <Logo height={78} chip />
          <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{settings.name} — {settings.tagline}</span>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "18px auto 0", maxWidth: 340, lineHeight: 1.6 }}>{cf(content, t, "heroIntro")}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
          <button className="sn-btn" onClick={() => setScreen("menu")} style={{ background: "var(--wine)", color: "#fff", borderRadius: 12, padding: "12px 22px", fontSize: 13.5, fontWeight: 700 }}>{t.viewMenu}</button>
          <button className="sn-btn" onClick={() => { setActiveCategory("All"); setScreen("menu"); }} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 12, padding: "12px 22px", fontSize: 13.5, fontWeight: 700 }}>{t.orderNow}</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "4px 10px", fontSize: 11.5, fontWeight: 600 }}>
            <Star size={11} fill="var(--gold)" color="var(--gold)" /> {content.ratingHeadline || DEFAULT_CONTENT.ratingHeadline}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "4px 10px", fontSize: 11.5, fontWeight: 600 }}>
            <Clock3 size={11} /> {settings.hours}
          </span>
        </div>
      </div>

      {/* Asian cuisine feature band */}
      <div style={{ background: "var(--wine)", color: "#fff", padding: "20px 22px", textAlign: "center" }}>
        <h2 className="sn-serif" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{cf(content, t, "featureBandTitle")}</h2>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.88)", margin: "6px auto 0", maxWidth: 320, lineHeight: 1.55 }}>{cf(content, t, "featureBandText")}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
          <button className="sn-btn" onClick={() => setScreen("menu")} style={{ background: "#fff", color: "var(--wine)", borderRadius: 10, padding: "10px 18px", fontSize: 12.5, fontWeight: 700 }}>{t.viewMenu}</button>
          <button className="sn-btn" onClick={goPopular} style={{ background: "rgba(255,255,255,0.16)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "10px 18px", fontSize: 12.5, fontWeight: 700 }}>{t.popularDishesBtn}</button>
        </div>
      </div>

      {/* featured */}
      <div style={{ padding: "20px 0 4px 16px" }}>
        <SectionLabel icon={<Sparkles size={13} />} text={t.featured} />
        <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingRight: 16, paddingBottom: 6 }}>
          {featured.map((item) => (
            <FoodTile key={item.id} item={item} lang={lang} cats={cats} onClick={() => setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
          ))}
        </div>
      </div>

      {/* guest favourites */}
      {popularPicks.length > 0 && (
        <div style={{ padding: "10px 0 4px 16px" }}>
          <SectionLabel icon={<Flame size={13} />} text={t.popularPicksTitle} />
          <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingRight: 16, paddingBottom: 6 }}>
            {popularPicks.map((item) => (
              <FoodTile key={item.id} item={item} lang={lang} cats={cats} onClick={() => setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
            ))}
          </div>
        </div>
      )}

      {/* categories */}
      <div style={{ padding: "16px 16px 4px" }}>
        <SectionLabel icon={<LayoutGrid size={13} />} text={t.browseCategories} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {cats.map((c) => (
            <button key={c.id} className="sn-btn sn-card" onClick={() => { setActiveCategory(c.id); setScreen("menu"); }} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 26 }}>{c.icon}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink)", textAlign: "center", lineHeight: 1.25 }}>{tr(c, lang)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* highlights */}
      <div style={{ padding: "20px 16px 4px" }}>
        <SectionLabel icon={<Star size={13} />} text={t.whyUs} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {highlights.map((h, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
              <span style={{ fontSize: 22 }}>{h.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.35 }}>{h.text || h.en}</p>
            </div>
          ))}
        </div>
      </div>

      {/* testimonials */}
      <div style={{ padding: "20px 16px 4px" }}>
        <SectionLabel icon={<Heart size={13} />} text={t.whatGuestsSay} />
        <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
          {(reviews || []).map((r, ri) => (
            <div key={ri} style={{ flexShrink: 0, width: 250, background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill={i < r.rating ? "var(--gold)" : "none"} color="var(--gold)" />
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>"{r.text}"</p>
              <p style={{ fontSize: 11.5, fontWeight: 700, margin: "10px 0 0" }}>{r.name} <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>· {r.city}</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* contact / location */}
      <div style={{ padding: "20px 16px 8px" }}>
        <SectionLabel icon={<MapPin size={13} />} text={t.visitUs} />
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 9, fontSize: 12.5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}><MapPin size={14} style={{ color: "var(--wine)" }} /> {settings.address}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}><Phone size={14} style={{ color: "var(--wine)" }} /> {settings.phone}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}><Mail size={14} style={{ color: "var(--wine)" }} /> {settings.email}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}><Clock3 size={14} style={{ color: "var(--wine)" }} /> {settings.hours}</span>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <a href={settings.mapUrl} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: "center", background: "var(--wine)", color: "#fff", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>{t.getDirections}</a>
            <button className="sn-btn" onClick={() => setScreen("reserve")} style={{ flex: 1, background: "var(--paper-dim)", color: "var(--ink)", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 700 }}>{t.navBook}</button>
          </div>
        </div>
      </div>

      <Footer t={t} settings={settings} setScreen={setScreen} />
    </div>
  );
}

/* ---------------------------------------------------------- about */

function AboutScreen({ t, settings, content }) {
  const blocks = [
    { title: cf(content, t, "storyTitle"), body: cf(content, t, "story"), icon: "📖" },
    { title: cf(content, t, "conceptTitle"), body: cf(content, t, "concept"), icon: "🥢" },
    { title: cf(content, t, "freshTitle"), body: cf(content, t, "fresh"), icon: "🐟" },
    { title: cf(content, t, "prepTitle"), body: cf(content, t, "prep"), icon: "🍚" },
    { title: cf(content, t, "philosophyTitle"), body: cf(content, t, "philosophy"), icon: "🌸" },
  ];
  return (
    <div>
      <div className="sn-pattern" style={{ background: "linear-gradient(150deg, var(--wine) 0%, var(--wine-dark) 100%)", color: "var(--paper)", padding: "30px 22px 34px", textAlign: "center" }}>
        <Logo height={60} chip />
        <h1 className="sn-serif" style={{ fontSize: 24, fontWeight: 700, margin: "16px 0 0" }}>{t.aboutTitle}</h1>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", margin: "6px 0 0", lineHeight: 1.6 }}>{settings.address}</p>
      </div>
      <div style={{ padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
        {blocks.map((b) => (
          <div key={b.title} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
            <p className="sn-serif" style={{ fontSize: 17, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}><span>{b.icon}</span> {b.title}</p>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "8px 0 0", lineHeight: 1.6 }}>{b.body}</p>
          </div>
        ))}
      </div>
      <Footer t={t} settings={settings} />
    </div>
  );
}

/* ---------------------------------------------------------- categories */

function CategoriesScreen({ t, lang, cats, menuItems, settings, setActiveCategory, setScreen }) {
  const count = (id) => menuItems.filter((i) => i.category === id && i.available).length;
  const go = (id) => { setActiveCategory(id); setScreen("menu"); };
  return (
    <div style={{ padding: "20px 16px 8px" }}>
      <h1 className="sn-serif" style={{ fontSize: 22, fontWeight: 700, margin: "0 0 14px" }}>{t.categoriesTitle}</h1>
      <button className="sn-btn sn-card" onClick={() => go("All")} style={{ width: "100%", background: "var(--wine)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>
        <span>🍽️ {t.allCategories}</span><ChevronRight size={16} />
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cats.map((c) => (
          <button key={c.id} className="sn-btn sn-card" onClick={() => go(c.id)} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
            <span style={{ fontSize: 26 }}>{c.icon}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.25, textAlign: "left" }}>{tr(c, lang)}</span>
            <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>{count(c.id)} {t.items}</span>
          </button>
        ))}
      </div>
      <Footer t={t} settings={settings} setScreen={setScreen} />
    </div>
  );
}

/* ---------------------------------------------------------- contact */

function ContactScreen({ t, settings, setScreen }) {
  const rows = [
    { icon: <MapPin size={16} />, label: settings.address, action: { href: settings.mapUrl, text: t.findUs } },
    { icon: <Phone size={16} />, label: settings.phone, action: { href: `tel:${settings.phone.replace(/[^0-9+]/g, "")}`, text: t.callUs } },
    { icon: <Mail size={16} />, label: settings.email, action: { href: `mailto:${settings.email}`, text: t.emailUs } },
    { icon: <Clock3 size={16} />, label: settings.hours },
  ];
  return (
    <div>
      <div className="sn-pattern" style={{ background: "linear-gradient(150deg, var(--charcoal) 0%, var(--charcoal-3) 100%)", color: "var(--paper)", padding: "30px 22px" }}>
        <h1 className="sn-serif" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{t.contactTitle}</h1>
        <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.75)", margin: "6px 0 0" }}>{settings.name} · {settings.tagline}</p>
      </div>
      <div style={{ padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "var(--wine)" }}>{r.icon}</span>
            <span style={{ fontSize: 13, flex: 1 }}>{r.label}</span>
            {r.action && <a href={r.action.href} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--wine)", textDecoration: "none", whiteSpace: "nowrap" }}>{r.action.text}</a>}
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="sn-btn" onClick={() => setScreen("reserve")} style={{ flex: 1, background: "var(--wine)", color: "#fff", borderRadius: 12, padding: "13px", fontSize: 13, fontWeight: 700 }}>{t.navBook}</button>
          <button className="sn-btn" onClick={() => setScreen("menu")} style={{ flex: 1, background: "var(--paper-dim)", color: "var(--ink)", borderRadius: 12, padding: "13px", fontSize: 13, fontWeight: 700 }}>{t.viewMenu}</button>
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 6, fontSize: 12, fontWeight: 600 }}>
          {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" style={{ color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}><Share2 size={13} /> Facebook</a>}
          {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" style={{ color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}><Share2 size={13} /> Instagram</a>}
        </div>
      </div>
      <Footer t={t} settings={settings} setScreen={setScreen} />
    </div>
  );
}

/* ---------------------------------------------------------- reserve */

function ReserveScreen({ t, settings, addReservation, setScreen }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", date: dayStr(0), time: "19:00", guests: 2, request: "" });
  const valid = form.name.trim() && form.phone.trim() && form.date && form.time;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setErr("");
    try {
      await addReservation(form);
      setDone(true);
    } catch (e) {
      setErr(e?.message || "Could not send your request. Please call us.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--herb)", display: "flex", alignItems: "center", justifyContent: "center", animation: "sn-pop 0.3s ease" }}>
          <Check size={28} color="#fff" />
        </div>
        <p className="sn-serif" style={{ fontSize: 21, fontWeight: 700, margin: "18px 0 4px" }}>{t.reserveThanks}</p>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, maxWidth: 300, lineHeight: 1.6 }}>{t.reserveThanksBody}</p>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginTop: 20, width: "100%", textAlign: "left", fontSize: 12.5 }}>
          <p style={{ margin: 0 }}><strong>{form.name}</strong> · {form.guests} {form.guests === 1 ? t.guest : t.guestsWord}</p>
          <p style={{ margin: "4px 0 0", color: "var(--ink-soft)" }}>{form.date} · {form.time}</p>
        </div>
        <button className="sn-btn" onClick={() => { setDone(false); setForm({ ...form, name: "", request: "" }); }} style={{ background: "var(--paper-dim)", color: "var(--ink)", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 700, marginTop: 18 }}>{t.reserveAnother}</button>
        <button className="sn-btn" onClick={() => setScreen("home")} style={{ background: "none", color: "var(--ink-soft)", fontSize: 12.5, textDecoration: "underline", marginTop: 12 }}>{t.navHome}</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 28px" }}>
      <h1 className="sn-serif" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t.reserveTitle}</h1>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "6px 0 0", lineHeight: 1.55 }}>{t.reserveIntro}</p>

      <FieldLabel>{t.name}</FieldLabel>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>{t.phone}</FieldLabel>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>{t.email}</FieldLabel>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>{t.date}</FieldLabel>
          <input type="date" value={form.date} min={dayStr(0)} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>{t.time}</FieldLabel>
          <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={inputStyle}>
            {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <FieldLabel>{t.guests}</FieldLabel>
      <select value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} style={inputStyle}>
        {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? t.guest : t.guestsWord}</option>)}
      </select>
      <FieldLabel>{t.specialRequests}</FieldLabel>
      <textarea rows={2} value={form.request} onChange={(e) => setForm({ ...form, request: e.target.value })} style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} />

      <button
        className="sn-btn"
        disabled={!valid || busy}
        onClick={submit}
        style={{ width: "100%", marginTop: 20, background: valid && !busy ? "var(--wine)" : "var(--ink-soft)", color: "#fff", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700 }}
      >
        {busy ? "…" : t.reserveSubmit}
      </button>
      {err && <p style={{ fontSize: 11.5, color: "var(--wine)", textAlign: "center", marginTop: 8 }}>{err}</p>}
      <p style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", marginTop: 12 }}>{settings.phone} · {settings.hours}</p>
    </div>
  );
}

const SORT_OPTIONS = ["recommended", "priceLow", "priceHigh", "rating"];

function MenuScreen({ t, lang, table, tableLocked, menuItems, cats, activeCategory, setActiveCategory, search, setSearch, sortBy, setSortBy, favorites, toggleFavorite, setSelectedItem, cart, cartTotals, setScreen, settings }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = menuItems.filter((i) => {
      const matchCat =
        activeCategory === "All" ? true :
        activeCategory === "Popular" ? i.popular :
        activeCategory === "Favorites" ? favorites.includes(i.id) :
        activeCategory === "Vegetarian" ? i.veg :
        activeCategory === "Spicy" ? i.spicy :
        i.category === activeCategory;
      const hay = [
        i.en, i.mm, i.zh, i.es, i.th, i.category,
        catOf(i.category, cats, lang), i.descEn, trd(i, lang), i.ingredients,
      ].filter(Boolean).join(" ").toLowerCase();
      const matchSearch = !q || hay.includes(q) || (i.mm || "").includes(search.trim());
      return matchCat && matchSearch;
    });
    const by = {
      priceLow: (a, b) => a.price - b.price,
      priceHigh: (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      recommended: (a, b) => (b.recommended - a.recommended) || (b.popular - a.popular) || ((b.rating || 0) - (a.rating || 0)),
    }[sortBy];
    return by ? [...list].sort(by) : list;
  }, [menuItems, activeCategory, search, lang, sortBy, favorites, cats]);

  const popular = menuItems.filter((i) => i.popular && i.available).slice(0, 10);
  const popularIds = new Set(popular.map((i) => i.id));
  const recommended = (() => {
    const picked = menuItems.filter((i) => i.recommended && i.available && !popularIds.has(i.id));
    const backfill = menuItems
      .filter((i) => i.available && !popularIds.has(i.id) && !picked.includes(i))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return [...picked, ...backfill].slice(0, 10);
  })();
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const showDiscovery = activeCategory === "All" && !search;
  const sectionTitle =
    activeCategory === "All" ? t.fullMenu :
    activeCategory === "Popular" ? t.popular :
    activeCategory === "Favorites" ? t.favorites :
    activeCategory === "Vegetarian" ? t.vegetarian :
    activeCategory === "Spicy" ? t.spicy :
    catOf(activeCategory, cats, lang);

  return (
    <div>
      <div className="sn-pattern" style={{ background: "linear-gradient(150deg, var(--wine) 0%, var(--wine-dark) 100%)", color: "var(--paper)", padding: "22px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Logo height={40} chip style={{ padding: "7px 12px" }} />

          <div style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
            <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.table}</p>
            <p className="sn-mono" style={{ fontSize: 15, fontWeight: 700, margin: "1px 0 0" }}>{table}</p>
          </div>
        </div>
        {tableLocked && <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.9)", margin: "10px 0 0", fontWeight: 600 }}>{t.orderingFor} {t.table} {table}</p>}
        <div style={{ marginTop: 14, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "rgba(255,255,255,0.55)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            style={{ width: "100%", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.26)", borderRadius: 10, padding: "11px 12px 11px 34px", color: "#fff", fontSize: 13.5, outline: "none" }}
          />
        </div>
      </div>

      <div className="sn-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 16px", position: "sticky", top: 55, zIndex: 20, background: "var(--paper)", borderBottom: "1px solid var(--line)" }}>
        {[
          { id: "All", icon: "", label: t.all },
          { id: "Popular", icon: "🔥", label: t.popular },
          { id: "Favorites", icon: "♥", label: t.favorites },
          { id: "Vegetarian", icon: "🌱", label: t.vegetarian },
          { id: "Spicy", icon: "🌶️", label: t.spicy },
          ...cats.map((c) => ({ id: c.id, icon: c.icon, label: tr(c, lang) })),
        ].map((c) => {
          const on = activeCategory === c.id;
          return (
            <button
              key={c.id}
              className="sn-btn"
              onClick={() => setActiveCategory(c.id)}
              style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                border: `1px solid ${on ? "var(--wine)" : "var(--line)"}`,
                background: on ? "var(--wine)" : "#fff",
                color: on ? "#fff" : "var(--ink-soft)",
              }}
            >
              {c.icon ? `${c.icon} ` : ""}{c.label}
            </button>
          );
        })}
      </div>

      {showDiscovery && popular.length > 0 && (
        <div style={{ padding: "6px 0 4px 16px" }}>
          <SectionLabel icon={<Star size={13} />} text={t.popularSection} />
          <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingRight: 16, paddingBottom: 6 }}>
            {popular.map((item) => (
              <FoodTile key={item.id} item={item} lang={lang} cats={cats} onClick={() => setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
            ))}
          </div>
        </div>
      )}
      {showDiscovery && recommended.length > 0 && (
        <div style={{ padding: "6px 0 4px 16px" }}>
          <SectionLabel icon={<Sparkles size={13} />} text={t.recommendedSection} />
          <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingRight: 16, paddingBottom: 6 }}>
            {recommended.map((item) => (
              <FoodTile key={item.id} item={item} lang={lang} cats={cats} onClick={() => setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "12px 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)" }}>
            <Utensils size={13} />
            <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>{sectionTitle} <span style={{ opacity: 0.6 }}>· {filtered.length}</span></p>
          </div>
          <SortControl t={t} value={sortBy} onChange={setSortBy} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item) => (
            <MenuCard key={item.id} lang={lang} t={t} cats={cats} item={item} onClick={() => item.available && setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", padding: "40px 0" }}>
              {activeCategory === "Favorites" ? t.favoritesEmpty : t.noMatch}
            </p>
          )}
        </div>
      </div>

      <Footer t={t} settings={settings} setScreen={setScreen} />

      {cartCount > 0 && (
        <button className="sn-btn" onClick={() => setScreen("cart")} style={{ position: "sticky", bottom: 14, left: 16, right: 16, width: "calc(100% - 32px)", margin: "0 16px 14px", background: "var(--wine)", color: "#fff", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 6px 18px rgba(183,62,22,0.35)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <ShoppingCart size={16} /> {cartCount} {t.items}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{fmt(cartTotals.subtotal)}</span>
        </button>
      )}
    </div>
  );
}

function HeartButton({ active, onClick, size = 15, light }) {
  return (
    <button
      className="sn-btn"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label="favorite"
      style={{
        width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: light ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.92)", border: "1px solid var(--line)",
        boxShadow: "0 1px 4px rgba(34,37,43,0.14)", flexShrink: 0,
      }}
    >
      <Heart size={size} strokeWidth={2.2}
        style={{ animation: active ? "sn-heart 0.3s ease" : "none" }}
        fill={active ? "var(--wine)" : "none"} color={active ? "var(--wine)" : "var(--ink-soft)"} />
    </button>
  );
}

function RatingChip({ value }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
      <Star size={11} fill="var(--gold)" color="var(--gold)" /> {Number(value || 0).toFixed(1)}
    </span>
  );
}

// Renders an item's photo when set, else its emoji. Place inside a
// position:relative, overflow:hidden, flex-centered container.
function FoodMedia({ image, icon, alt = "" }) {
  if (image) return <img src={image} alt={alt} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />;
  return <span>{icon}</span>;
}
const FOOD_GRADIENT = "radial-gradient(circle at 50% 40%, var(--gold-soft), var(--paper-dim))";

function fileToImageDataUrl(file, maxDim = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height || 1));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch { resolve(reader.result); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function FoodTile({ item, lang, cats, onClick, fav, onFav }) {
  return (
    <div className="sn-card" onClick={onClick} style={{ flexShrink: 0, width: 150, cursor: "pointer", background: "#fff", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 96, background: item.image ? "var(--paper-dim)" : FOOD_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, position: "relative", overflow: "hidden" }}>
        <FoodMedia image={item.image} icon={item.icon} alt={tr(item, lang)} />
        <div style={{ position: "absolute", top: 6, right: 6 }}><HeartButton active={fav} onClick={onFav} size={13} /></div>
        {item.popular && <span style={{ position: "absolute", top: 6, left: 6, background: "var(--gold)", color: "var(--charcoal)", fontSize: 8.5, fontWeight: 800, padding: "2px 6px", borderRadius: 999 }}>★</span>}
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tr(item, lang)}</p>
        <p style={{ fontSize: 10.5, color: "var(--wine)", fontWeight: 600, margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{catOf(item.category, cats, lang)}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--wine-dark)" }}>{fmt(item.price)}</span>
          <RatingChip value={item.rating} />
        </div>
      </div>
    </div>
  );
}

function SortControl({ t, value, onChange }) {
  const [open, setOpen] = useState(false);
  const labels = { recommended: t.sortRecommended, priceLow: t.sortPriceLow, priceHigh: t.sortPriceHigh, rating: t.sortRating };
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button className="sn-btn" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>
        <ArrowUpDown size={12} /> {labels[value]} <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 4, minWidth: 180, boxShadow: "0 8px 24px rgba(34,37,43,0.16)", zIndex: 50 }}>
            {SORT_OPTIONS.map((o) => (
              <button key={o} className="sn-btn" onClick={() => { onChange(o); setOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: o === value ? "var(--paper-dim)" : "transparent", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>
                {labels[o]}
                {o === value && <Check size={13} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Footer({ t, settings, setScreen }) {
  return (
    <div style={{ background: "var(--charcoal)", color: "rgba(255,255,255,0.7)", padding: "24px 20px 26px" }}>
      <Logo height={54} chip style={{ marginBottom: 14 }} />
      <p style={{ fontSize: 12, margin: "0 0 14px", lineHeight: 1.6 }}>{settings.tagline}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={13} /> {settings.address}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={13} /> {settings.phone}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock3 size={13} /> {settings.hours}</span>
      </div>
      {(settings.facebook || settings.instagram) && (
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11.5, fontWeight: 600 }}>
          {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}><Share2 size={13} /> Facebook</a>}
          {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}><Share2 size={13} /> Instagram</a>}
        </div>
      )}
      {setScreen && (
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11.5, fontWeight: 600 }}>
          <button className="sn-btn" onClick={() => setScreen("menu")} style={{ background: "none", color: "rgba(255,255,255,0.7)" }}>{t.navMenu}</button>
          <button className="sn-btn" onClick={() => setScreen("about")} style={{ background: "none", color: "rgba(255,255,255,0.7)" }}>{t.navAbout}</button>
          <button className="sn-btn" onClick={() => setScreen("reserve")} style={{ background: "none", color: "rgba(255,255,255,0.7)" }}>{t.navBook}</button>
        </div>
      )}
      <p style={{ fontSize: 10.5, margin: "16px 0 0", color: "rgba(255,255,255,0.4)" }}>© {new Date().getFullYear()} {settings.name} · {t.footerRights}</p>
    </div>
  );
}

function SectionLabel({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, color: "var(--ink-soft)" }}>
      {icon}
      <p style={{ fontSize: 12.5, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>{text}</p>
    </div>
  );
}

function DietTags({ item, size = 12 }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {item.veg && <span title="Vegetarian" style={{ color: "var(--herb-dark)" }}><Leaf size={size} /></span>}
      {item.spicy && <span title="Spicy" style={{ color: "var(--wine)" }}><Flame size={size} /></span>}
    </div>
  );
}

function AllergenLine({ item, t, lang }) {
  if (!item.allergens || item.allergens.length === 0) return null;
  return (
    <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: "8px 0 0" }}>
      <strong>{t.contains}:</strong> {item.allergens.map((a) => tr(ALLERGEN_LABEL[a] || { en: a }, lang)).join(", ")}
    </p>
  );
}

function MenuCard({ item, onClick, lang, t, cats, fav, onFav }) {
  const name = tr(item, lang);
  const sub = lang === "en" ? (item.mm || "") : item.en;
  const desc = trd(item, lang);
  const catName = catOf(item.category, cats, lang);
  return (
    <div
      className="sn-card"
      onClick={onClick}
      style={{
        position: "relative",
        display: "flex", gap: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 10,
        cursor: item.available ? "pointer" : "default", opacity: item.available ? 1 : 0.55,
      }}
    >
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}><HeartButton active={fav} onClick={onFav} size={13} /></div>
      <div style={{ width: 82, height: 82, borderRadius: 12, background: item.image ? "var(--paper-dim)" : FOOD_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, flexShrink: 0, position: "relative" }}>
        <FoodMedia image={item.image} icon={item.icon} alt={name} />
        {item.isNew && item.available && <span style={{ position: "absolute", top: -6, left: -6, zIndex: 1, background: "var(--herb)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>New</span>}
        {item.popular && item.available && !item.isNew && <span style={{ position: "absolute", top: -6, left: -6, zIndex: 1, background: "var(--gold)", color: "var(--charcoal)", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 999 }}>★ {t.popular}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, paddingRight: 34 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{name}</p>
          <DietTags item={item} />
        </div>
        {sub && <p style={{ fontSize: 11.5, color: "var(--wine)", margin: "2px 0 0", fontWeight: 600 }}>{sub}</p>}
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
          <RatingChip value={item.rating} />
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)", background: "var(--paper-dim)", padding: "2px 7px", borderRadius: 6 }}>{catName}</span>
          {item.prepMins && <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)", display: "inline-flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {item.prepMins} {t.min}</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--wine-dark)" }}>{fmt(item.price)}</span>
          {item.available ? (
            <span className="sn-btn" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--wine)", color: "#fff", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}><Plus size={13} /> {t.add}</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--wine)", background: "rgba(183,62,22,0.10)", padding: "3px 8px", borderRadius: 6 }}>{t.soldOut}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemModal({ item, onClose, onAdd, lang, t, cats, fav, onFav }) {
  const [size, setSize] = useState(item.sizes ? item.sizes[0] : null);
  const [spice, setSpice] = useState(item.spiceLevels ? "Medium" : null);
  const [addons, setAddons] = useState([]);
  const [qty, setQty] = useState(1);
  const [instructions, setInstructions] = useState("");
  const name = tr(item, lang);
  const desc = trd(item, lang);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const unitPrice = item.price + (size ? size.delta : 0) + addons.reduce((s, a) => s + a.price, 0);

  function toggleAddon(addon) {
    setAddons((cur) => (cur.find((a) => a.en === addon.en) ? cur.filter((a) => a.en !== addon.en) : [...cur, addon]));
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,35,48,0.55)", zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", background: "var(--paper)", borderRadius: "20px 20px 0 0", animation: "sn-slide-up 0.22s ease" }}>
        <div className="sn-pattern" style={{ position: "relative" }}>
          <div style={{ height: 160, background: item.image ? "var(--paper-dim)" : FOOD_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 76, position: "relative", overflow: "hidden" }}><FoodMedia image={item.image} icon={item.icon} alt={name} /></div>
          <button className="sn-btn" onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: "50%", background: "rgba(27,35,48,0.65)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          <div style={{ position: "absolute", top: 12, left: 12 }}><HeartButton active={fav} onClick={onFav} size={16} /></div>
          {item.isNew && <span style={{ position: "absolute", bottom: 12, left: 16, background: "var(--herb)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>New</span>}
        </div>
        <div style={{ padding: "16px 20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <p className="sn-serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{name}</p>
            <DietTags item={item} size={14} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 0" }}>
            <RatingChip value={item.rating} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", background: "var(--paper-dim)", padding: "2px 8px", borderRadius: 6 }}>{catOf(item.category, cats, lang)}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "6px 0 0", lineHeight: 1.5 }}>{desc}</p>
          {(item.prepMins || item.spicy) && (
            <div style={{ display: "flex", gap: 8, margin: "8px 0 0", flexWrap: "wrap" }}>
              {item.prepMins && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", background: "var(--paper-dim)", padding: "3px 9px", borderRadius: 999 }}><Clock size={11} /> {item.prepMins} {t.min}</span>}
              {item.spicy && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--wine)", background: "rgba(214,72,46,0.1)", padding: "3px 9px", borderRadius: 999 }}><Flame size={11} /> {t.spicy}</span>}
            </div>
          )}
          {item.ingredients && <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "8px 0 0", lineHeight: 1.5 }}><strong>{t.ingredients}:</strong> {item.ingredients}</p>}
          <AllergenLine item={item} t={t} lang={lang} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--wine-dark)", margin: "8px 0 0" }}>{fmt(item.price)}</p>

          {item.sizes && (
            <ModalSection title={t.size}>
              <PillRow options={item.sizes.map((s) => s.name)} value={size.name} onChange={(name2) => setSize(item.sizes.find((s) => s.name === name2))} extra={item.sizes.map((s) => (s.delta > 0 ? `+${fmt(s.delta)}` : s.delta < 0 ? `−${fmt(-s.delta)}` : ""))} />
            </ModalSection>
          )}

          {item.spiceLevels && (
            <ModalSection title={t.spiceLevel}>
              <PillRow options={SPICE_OPTIONS} value={spice} onChange={setSpice} />
            </ModalSection>
          )}

          {item.addons && (
            <ModalSection title={t.addOns}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.addons.map((a) => {
                  const checked = !!addons.find((x) => x.en === a.en);
                  return (
                    <label key={a.en} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", border: `1px solid ${checked ? "var(--wine)" : "var(--line)"}`, borderRadius: 10, cursor: "pointer", background: checked ? "rgba(214,72,46,0.06)" : "#fff" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleAddon(a)} style={{ accentColor: "#D6482E" }} />
                        <span style={{ fontSize: 13 }}>{tr(a, lang)}</span>
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>+{fmt(a.price)}</span>
                    </label>
                  );
                })}
              </div>
            </ModalSection>
          )}

          <ModalSection title={t.instructions}>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t.instructionsPh}
              rows={2}
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none" }}
            />
          </ModalSection>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.quantity}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button className="sn-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} /></button>
              <span style={{ fontSize: 15, fontWeight: 700, minWidth: 18, textAlign: "center" }}>{qty}</span>
              <button className="sn-btn" onClick={() => setQty((q) => q + 1)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} /></button>
            </div>
          </div>

          <button
            className="sn-btn"
            onClick={() =>
              onAdd({
                cartId: uid(), itemId: item.id, name, icon: item.icon, image: item.image || "",
                size: size ? size.name : null, spice, addons, instructions: instructions.trim(),
                unitPrice, qty,
              })
            }
            style={{ width: "100%", marginTop: 18, background: "var(--wine)", color: "#fff", borderRadius: 12, padding: "13px 18px", fontSize: 14, fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>{t.addToCart}</span>
            <span>{fmt(unitPrice * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalSection({ title, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", margin: "0 0 8px" }}>{title}</p>
      {children}
    </div>
  );
}

function PillRow({ options, value, onChange, extra }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((o, i) => (
        <button
          key={o}
          className="sn-btn"
          onClick={() => onChange(o)}
          style={{
            padding: "8px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
            border: `1px solid ${value === o ? "var(--wine)" : "var(--line)"}`,
            background: value === o ? "var(--wine)" : "#fff",
            color: value === o ? "#fff" : "var(--ink)",
          }}
        >
          {o}{extra && extra[i] ? ` ${extra[i]}` : ""}
        </button>
      ))}
    </div>
  );
}

function CartScreen({ t, lang, table, cart, cartTotals, updateQty, removeLine, clearCart, setScreen, promoCode, setPromoCode, promoApplied, promoError, applyPromo, checkoutForm }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 640 }}>
      <ScreenHeader title={t.yourOrder} onBack={() => setScreen("menu")} />
      <div style={{ padding: "0 20px", flex: 1 }}>
        {checkoutForm.orderType === "Dine-in" && (
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Table2 size={15} style={{ color: "var(--ink-soft)" }} />
            <span style={{ fontSize: 13 }}>{t.table} <strong>{table}</strong></span>
          </div>
        )}

        {cart.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "var(--ink-soft)" }}>
            <ShoppingCart size={28} style={{ opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 13.5 }}>{t.cartEmpty}</p>
            <button className="sn-btn" onClick={() => setScreen("menu")} style={{ marginTop: 8, background: "var(--wine)", color: "#fff", borderRadius: 10, padding: "10px 18px", fontSize: 12.5, fontWeight: 700 }}>{t.viewMenu}</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cart.map((line) => (
              <div key={line.cartId} style={{ display: "flex", gap: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, position: "relative", overflow: "hidden" }}><FoodMedia image={line.image} icon={line.icon} alt={line.name} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{line.name}</p>
                    <button className="sn-btn" onClick={() => removeLine(line.cartId)} style={{ background: "none", color: "var(--ink-soft)" }}><X size={14} /></button>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "3px 0 0", lineHeight: 1.5 }}>
                    {[line.size, line.spice ? `${line.spice} spice` : null, ...line.addons.map((a) => tr(a, lang))].filter(Boolean).join(" · ")}
                  </p>
                  {line.instructions && <p style={{ fontSize: 11.5, color: "var(--herb-dark)", margin: "2px 0 0", fontStyle: "italic" }}>"{line.instructions}"</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button className="sn-btn" onClick={() => updateQty(line.cartId, -1)} style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{line.qty}</span>
                      <button className="sn-btn" onClick={() => updateQty(line.cartId, 1)} style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--wine-dark)" }}>{fmt(line.unitPrice * line.qty)}</span>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder={t.promo}
                disabled={promoApplied}
                style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, outline: "none", background: promoApplied ? "var(--paper-dim)" : "#fff" }}
              />
              <button className="sn-btn" onClick={applyPromo} disabled={promoApplied} style={{ padding: "0 16px", borderRadius: 10, border: "1px solid var(--line)", background: promoApplied ? "var(--herb)" : "#fff", color: promoApplied ? "#fff" : "var(--ink)", fontSize: 12.5, fontWeight: 600 }}>
                {promoApplied ? t.applied : t.apply}
              </button>
            </div>
            {promoError && <p style={{ fontSize: 11.5, color: "var(--wine)", margin: "4px 2px 0" }}>{promoError}</p>}

            <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 14, marginTop: 6 }}>
              <TotalRow label={t.subtotal} value={cartTotals.subtotal} />
              <TotalRow label={t.tax} value={cartTotals.tax} />
              {cartTotals.deliveryFee > 0 && <TotalRow label={t.deliveryFee} value={cartTotals.deliveryFee} />}
              {cartTotals.discount > 0 && <TotalRow label={t.discount} value={-cartTotals.discount} accent />}
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8 }}>
                <TotalRow label={t.total} value={cartTotals.total} bold />
              </div>
            </div>

            <button className="sn-btn" onClick={clearCart} style={{ background: "none", color: "var(--ink-soft)", fontSize: 12.5, textDecoration: "underline", padding: "10px 0", alignSelf: "center" }}>{t.clearCart}</button>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div style={{ padding: "12px 20px 20px", position: "sticky", bottom: 0, background: "linear-gradient(to top, var(--paper) 70%, transparent)" }}>
          <button className="sn-btn" onClick={() => setScreen("checkout")} style={{ width: "100%", background: "var(--wine)", color: "#fff", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700 }}>
            {t.continueCheckout} — {fmt(cartTotals.total)}
          </button>
        </div>
      )}
    </div>
  );
}

function TotalRow({ label, value, bold, accent }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ fontSize: bold ? 14 : 12.5, fontWeight: bold ? 700 : 400, color: accent ? "var(--herb-dark)" : "var(--ink-soft)" }}>{label}</span>
      <span style={{ fontSize: bold ? 15 : 12.5, fontWeight: bold ? 700 : 600, color: accent ? "var(--herb-dark)" : "var(--ink)" }}>{value < 0 ? "−" : ""}{fmt(Math.abs(value))}</span>
    </div>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 20px 14px" }}>
      <button className="sn-btn" onClick={onBack} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={16} /></button>
      <p className="sn-serif" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</p>
    </div>
  );
}

/* ---------------------------------------------------------- payments */

const isHttpUrl = (s) => /^https?:\/\//i.test((s || "").trim());

function activePaymentMethods(settings) {
  const list = (settings && settings.paymentMethods) || DEFAULT_SETTINGS.paymentMethods;
  const on = list.filter((m) => m && m.enabled);
  return on.length ? on : [{ id: "counter", label: "Pay at counter", type: "person", note: "", url: "", image: "" }];
}
function paymentMethodByLabel(settings, label) {
  const list = (settings && settings.paymentMethods) || DEFAULT_SETTINGS.paymentMethods;
  return list.find((m) => m && m.label === label) || null;
}

// Renders a method's instructions + (for "online") a pay link button and QR / image.
function PaymentDetail({ method, t, compact = false }) {
  if (!method) return null;
  const online = method.type === "online";
  const hasImg = !!method.image;
  const hasUrl = !!(method.url && method.url.trim());
  const showMedia = online && (hasImg || hasUrl);
  return (
    <div style={{ marginTop: 10, background: "var(--paper-dim)", borderRadius: 12, padding: 14 }}>
      {method.note && <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>{method.note}</p>}
      {showMedia && (
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: method.note ? 12 : 0, flexWrap: "wrap" }}>
          {hasImg ? (
            <img src={method.image} alt="Payment QR" style={{ width: compact ? 104 : 128, height: compact ? 104 : 128, objectFit: "contain", borderRadius: 8, background: "#fff", padding: 6 }} />
          ) : (
            <div style={{ background: "#fff", padding: 8, borderRadius: 8 }}><QR text={method.url} size={compact ? 96 : 120} /></div>
          )}
          {hasUrl && isHttpUrl(method.url) && (
            <a href={method.url} target="_blank" rel="noreferrer" style={{ background: "var(--wine)", color: "#fff", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
              {t.payNow} →
            </a>
          )}
        </div>
      )}
      {online && !hasImg && !hasUrl && (
        <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: method.note ? "8px 0 0" : 0 }}>{t.qrNote}</p>
      )}
    </div>
  );
}

function CheckoutScreen({ t, settings, checkoutForm, setCheckoutForm, cart, cartTotals, placing, placeOrder, setScreen }) {
  const orderTypes = [{ id: "Dine-in", label: t.dineIn }, { id: "Takeaway", label: t.takeaway }, { id: "Delivery", label: t.delivery }];
  const methods = activePaymentMethods(settings);
  const selected = methods.find((m) => m.label === checkoutForm.payment) || methods[0];
  useEffect(() => {
    if (checkoutForm.payment !== selected.label) setCheckoutForm({ ...checkoutForm, payment: selected.label });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={{ minHeight: 640, display: "flex", flexDirection: "column" }}>
      <ScreenHeader title={t.checkout} onBack={() => setScreen("cart")} />
      <div style={{ padding: "0 20px", flex: 1 }}>
        <FieldLabel>{t.orderType}</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {orderTypes.map((o) => (
            <button key={o.id} className="sn-btn" onClick={() => setCheckoutForm({ ...checkoutForm, orderType: o.id })} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, border: `1px solid ${checkoutForm.orderType === o.id ? "var(--wine)" : "var(--line)"}`, background: checkoutForm.orderType === o.id ? "var(--wine)" : "#fff", color: checkoutForm.orderType === o.id ? "#fff" : "var(--ink)" }}>
              {o.label}
            </button>
          ))}
        </div>

        <FieldLabel>{t.name}</FieldLabel>
        <input value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} style={inputStyle} />

        <FieldLabel>{t.phone}</FieldLabel>
        <input value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} placeholder="(555) 000-0000" style={inputStyle} />

        <FieldLabel>{t.email}</FieldLabel>
        <input value={checkoutForm.email} onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })} style={inputStyle} />

        <FieldLabel>{t.kitchenNote}</FieldLabel>
        <textarea rows={2} value={checkoutForm.instructions} onChange={(e) => setCheckoutForm({ ...checkoutForm, instructions: e.target.value })} placeholder={t.instructionsPh} style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} />

        <FieldLabel>{t.payment}</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {methods.map((m) => {
            const on = checkoutForm.payment === m.label;
            return (
              <label key={m.id || m.label} onClick={() => setCheckoutForm({ ...checkoutForm, payment: m.label })} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", border: `1px solid ${on ? "var(--wine)" : "var(--line)"}`, borderRadius: 10, cursor: "pointer", background: on ? "rgba(214,72,46,0.05)" : "#fff" }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${on ? "var(--wine)" : "var(--line)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--wine)" }} />}
                </span>
                <span style={{ fontSize: 13, flex: 1 }}>{m.label}</span>
                {m.type === "online" && <QrIcon size={15} style={{ color: "var(--ink-soft)" }} />}
              </label>
            );
          })}
        </div>
        {selected && (selected.note || selected.type === "online") && <PaymentDetail method={selected} t={t} />}

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 14, marginTop: 20 }}>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 6px", fontWeight: 600 }}>{cart.length} {t.items}</p>
          <TotalRow label={t.subtotal} value={cartTotals.subtotal} />
          <TotalRow label={t.tax} value={cartTotals.tax} />
          {cartTotals.deliveryFee > 0 && <TotalRow label={t.deliveryFee} value={cartTotals.deliveryFee} />}
          {cartTotals.discount > 0 && <TotalRow label={t.discount} value={-cartTotals.discount} accent />}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 8 }}>
            <TotalRow label={t.total} value={cartTotals.total} bold />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 20px" }}>
        <button className="sn-btn" onClick={placeOrder} disabled={placing} style={{ width: "100%", background: placing ? "var(--ink-soft)" : "var(--wine)", color: "#fff", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {placing ? t.placing : `${t.placeOrder} — ${fmt(cartTotals.total)}`}
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", margin: "16px 0 6px" }}>{children}</p>;
}
const inputStyle = { width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff" };

function ConfirmationScreen({ t, activeOrder, setScreen, settings }) {
  if (!activeOrder) return null;
  const trackUrl = orderTrackUrl(settings, activeOrder.orderNumber);
  const payMethod = paymentMethodByLabel(settings, activeOrder.payment);
  const needsPayment = payMethod && payMethod.type === "online";
  return (
    <div style={{ minHeight: 640, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--herb)", display: "flex", alignItems: "center", justifyContent: "center", animation: "sn-pop 0.3s ease" }}>
        <Check size={28} color="#fff" />
      </div>
      <p className="sn-serif" style={{ fontSize: 21, fontWeight: 700, margin: "18px 0 4px" }}>{t.orderPlaced}</p>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{t.kitchenReceived}</p>

      {needsPayment && (
        <div style={{ background: "#fff", border: "1px solid var(--wine)", borderRadius: 16, padding: 16, marginTop: 18, width: "100%", textAlign: "left" }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--wine-dark)" }}>{t.completeYourPayment} — {fmt(activeOrder.total)}</p>
          <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "3px 0 0" }}>{payMethod.label}</p>
          <PaymentDetail method={payMethod} t={t} compact />
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 20, marginTop: 24, width: "100%", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--line)", paddingBottom: 12, marginBottom: 12 }}>
          <span className="sn-mono" style={{ fontSize: 17, fontWeight: 700 }}>{activeOrder.orderNumber}</span>
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{activeOrder.table ? `${t.table} ${activeOrder.table}` : activeOrder.orderType}</span>
        </div>
        {activeOrder.items.map((l) => (
          <div key={l.cartId} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ fontSize: 12.5 }}>{l.qty}× {l.name}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{fmt(l.unitPrice * l.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t.total}</span>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{fmt(activeOrder.total)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: "var(--ink-soft)" }}>
          <Clock size={13} />
          <span style={{ fontSize: 12 }}>{t.estimated} {activeOrder.estMinutes} {t.min}</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 16, marginTop: 14, width: "100%", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ padding: 6, border: "1px solid var(--line)", borderRadius: 8, flexShrink: 0 }}>
          <QR text={trackUrl} size={78} />
        </div>
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{t.trackOrder}</p>
          <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: "3px 0 0", lineHeight: 1.45 }}>{t.scanToTrack}</p>
        </div>
      </div>

      <button className="sn-btn" onClick={() => setScreen("tracking")} style={{ width: "100%", background: "var(--wine)", color: "#fff", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, marginTop: 20 }}>
        {t.trackOrder}
      </button>
      <button className="sn-btn" onClick={() => setScreen("menu")} style={{ background: "none", color: "var(--ink-soft)", fontSize: 12.5, textDecoration: "underline", marginTop: 14 }}>
        {t.backToMenu}
      </button>
    </div>
  );
}

function TrackingScreen({ t, lang, activeOrder, setScreen, settings }) {
  if (!activeOrder) {
    return (
      <div style={{ minHeight: 640, padding: "0 20px 30px" }}>
        <ScreenHeader title={t.orderTracking} onBack={() => setScreen("home")} />
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Search size={26} style={{ color: "var(--ink-soft)", marginBottom: 10 }} />
          <p style={{ fontSize: 13.5, fontWeight: 600 }}>{t.orderNotFound}</p>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>{t.orderNotFoundHelp}</p>
        </div>
      </div>
    );
  }
  const trackUrl = orderTrackUrl(settings, activeOrder.orderNumber);
  if (activeOrder.status === "Cancelled") {
    return (
      <div style={{ minHeight: 640, padding: "0 20px 30px" }}>
        <ScreenHeader title={t.orderTracking} onBack={() => setScreen("menu")} />
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Ban size={28} style={{ color: "var(--wine)", marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>{t.orderCancelled}</p>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>{t.orderCancelledHelp}</p>
        </div>
      </div>
    );
  }
  const idx = activeOrder.status === "Completed" ? CUSTOMER_STEPS.length : CUSTOMER_STEPS.indexOf(activeOrder.status);
  const payMethod = paymentMethodByLabel(settings, activeOrder.payment);
  const needsPayment = payMethod && payMethod.type === "online" && activeOrder.status !== "Completed";
  return (
    <div style={{ minHeight: 640, padding: "0 20px 30px" }}>
      <ScreenHeader title={t.orderTracking} onBack={() => setScreen("menu")} />
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <span className="sn-mono" style={{ fontSize: 22, fontWeight: 700 }}>{activeOrder.orderNumber}</span>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 0" }}>{activeOrder.table ? `${t.table} ${activeOrder.table} · ` : `${activeOrder.orderType} · `}{activeOrder.items.length} {t.items} · {fmt(activeOrder.total)}</p>
      </div>

      {needsPayment && (
        <div style={{ background: "#fff", border: "1px solid var(--wine)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--wine-dark)" }}>{t.completeYourPayment} — {fmt(activeOrder.total)}</p>
          <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "3px 0 0" }}>{payMethod.label}</p>
          <PaymentDetail method={payMethod} t={t} compact />
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 20 }}>
        {CUSTOMER_STEPS.map((step, i) => {
          const done = i < idx;
          const current = i === idx;
          const isLast = i === CUSTOMER_STEPS.length - 1;
          return (
            <div key={step} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span
                  style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: done || current ? "var(--herb)" : "var(--paper-dim)",
                    border: current ? "3px solid rgba(94,140,106,0.25)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: current ? "sn-pulse 1.6s ease infinite" : "none",
                  }}
                >
                  {done ? <Check size={12} color="#fff" /> : <CircleDot size={11} color={current ? "#fff" : "var(--ink-soft)"} />}
                </span>
                {!isLast && <span style={{ width: 2, flex: 1, minHeight: 30, background: done ? "var(--herb)" : "var(--line)" }} />}
              </div>
              <div style={{ paddingBottom: isLast ? 0 : 22 }}>
                <p style={{ fontSize: 13.5, fontWeight: current ? 700 : 500, margin: 0, color: done || current ? "var(--ink)" : "var(--ink-soft)" }}>{(CUSTOMER_STATUS_LABEL[lang] || CUSTOMER_STATUS_LABEL.en)[step]}</p>
                {current && <p style={{ fontSize: 11.5, color: "var(--herb-dark)", margin: "2px 0 0" }}>{t.inProgress}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11.5, color: "var(--ink-soft)", textAlign: "center", marginTop: 16 }}>{t.autoUpdate}</p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 14 }}>
        <div style={{ padding: 8, background: "#fff", border: "1px solid var(--line)", borderRadius: 12 }}>
          <QR text={trackUrl} size={104} />
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-soft)", margin: "8px 0 0", textAlign: "center" }}>{t.scanToTrack}</p>
      </div>

      <button className="sn-btn" onClick={() => setScreen("menu")} style={{ width: "100%", background: "var(--paper-dim)", color: "var(--ink)", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 600, marginTop: 18 }}>
        {t.orderSomethingElse}
      </button>
    </div>
  );
}

/* =============================================================== */
/* ADMIN                                                            */
/* =============================================================== */

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy || !email.trim() || !pw) return;
    setBusy(true);
    setErr("");
    const { error } = await auth.signIn(email.trim(), pw);
    if (error) { setErr(error.message || "Sign-in failed."); setBusy(false); }
    // on success the App auth listener swaps this screen for the dashboard
  }
  const field = { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "var(--charcoal-3)", color: "#fff", fontSize: 13, outline: "none", marginTop: 8 };
  return (
    <div style={{ maxWidth: 360, margin: "40px auto 0", padding: "0 16px", color: "var(--paper)" }}>
      <div style={{ background: "var(--charcoal-2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, textAlign: "center" }}>
        <Logo height={54} chip style={{ marginBottom: 14 }} />
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Lock size={12} /> Staff sign-in</p>
        <input
          type="email"
          value={email}
          autoFocus
          autoComplete="username"
          onChange={(e) => { setEmail(e.target.value); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Email"
          style={field}
        />
        <input
          type="password"
          value={pw}
          autoComplete="current-password"
          onChange={(e) => { setPw(e.target.value); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          style={{ ...field, borderColor: err ? "var(--wine)" : "rgba(255,255,255,0.18)" }}
        />
        {err && <p style={{ fontSize: 11.5, color: "#F0A5A8", margin: "6px 0 0" }}>{err}</p>}
        <button className="sn-btn" onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 14, background: "var(--wine)", color: "#fff", borderRadius: 10, padding: "12px", fontSize: 13.5, fontWeight: 700, opacity: busy ? 0.6 : 1 }}>{busy ? "Signing in…" : "Sign in"}</button>
        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", margin: "12px 0 0" }}>Accounts are created in the Supabase dashboard.</p>
      </div>
    </div>
  );
}

function BootSplash({ mode }) {
  const dark = mode !== "customer";
  return (
    <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: dark ? "rgba(255,255,255,0.7)" : "var(--ink-soft)" }}>
      <div className="sn-spin" style={{ width: 26, height: 26, border: "3px solid currentColor", borderTopColor: "transparent", borderRadius: "50%" }} />
      <p style={{ fontSize: 12.5, margin: 0 }}>Loading Hello Sushi…</p>
    </div>
  );
}

// Slim non-blocking strip shown when the app is running on the bundled menu
// because Supabase isn't reachable yet. The menu still works; edits won't save.
function OfflineBanner({ kind }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const msg = kind === "not-configured"
    ? "Preview mode — showing the built-in menu. Add your Supabase keys to .env to save changes."
    : kind === "not-seeded"
    ? "Preview mode — showing the built-in menu. Sign in as admin and run Settings → Initialize database to start editing and saving."
    : "Showing the built-in menu — can't reach the database. Run supabase/schema.sql, then use Settings → Initialize database.";
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto 10px", padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, background: "#FFF4E5", border: "1px solid #F0C98A", borderRadius: 10, fontSize: 11.5, color: "#7A4B12" }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button className="sn-btn" onClick={() => setHidden(true)} style={{ background: "none", color: "#7A4B12", fontWeight: 700, fontSize: 15, lineHeight: 1, padding: 2 }}>×</button>
    </div>
  );
}

function SeedFirst({ onGoToSettings }) {
  return (
    <div style={{ ...cardStyle, maxWidth: 520, margin: "10px auto 0", textAlign: "center" }}>
      <p className="sn-serif" style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--gold-soft)" }}>Database not initialized yet</p>
      <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "8px 0 0" }}>
        You're viewing the built-in menu. Load it into Supabase once, then this is where you edit items,
        categories and page content — and changes will save.
      </p>
      <button className="sn-btn" onClick={onGoToSettings} style={{ marginTop: 14, background: "var(--wine)", color: "#fff", borderRadius: 9, padding: "10px 18px", fontSize: 12.5, fontWeight: 700 }}>
        Go to Settings → Initialize database
      </button>
    </div>
  );
}

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "kitchen", label: "Kitchen", icon: ClipboardList },
  { id: "orders", label: "Orders", icon: ListOrdered },
  { id: "reservations", label: "Reservations", icon: CalendarDays },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "tables", label: "Tables & QR", icon: Table2 },
  { id: "customers", label: "Customers", icon: Users },
  { id: "content", label: "Content", icon: BookOpen },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function AdminApp(props) {
  const { staffTab, setStaffTab, staffToast, onLogout, settings, adminEmail, dbReady } = props;
  const needsSeed = ["menu", "categories", "content"].includes(staffTab) && !dbReady;
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 16px", color: "var(--paper)", position: "relative" }}>
      {staffToast && (
        <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: "var(--gold)", color: "#3A2607", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, zIndex: 90, animation: "sn-toast-in 0.25s ease" }}>
          <Bell size={14} /> {staffToast}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo height={38} chip style={{ padding: "6px 10px" }} />
          <div>
            <p className="sn-serif" style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--gold-soft)" }}>Admin dashboard</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>{adminEmail ? `Signed in as ${adminEmail}` : "Restaurant management"}</p>
          </div>
        </div>
        <button className="sn-btn" onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--charcoal-2)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "7px 14px", fontSize: 12, fontWeight: 600 }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>

      <div className="sn-scroll" style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.12)", overflowX: "auto" }}>
        {ADMIN_TABS.map((tb) => {
          const Icon = tb.icon;
          const active = staffTab === tb.id;
          return (
            <button key={tb.id} className="sn-btn" onClick={() => setStaffTab(tb.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", background: "none", color: active ? "var(--gold)" : "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 600, borderBottom: `2px solid ${active ? "var(--gold)" : "transparent"}`, whiteSpace: "nowrap" }}>
              <Icon size={15} /> {tb.label}
            </button>
          );
        })}
      </div>

      {needsSeed ? (
        <SeedFirst onGoToSettings={() => setStaffTab("settings")} />
      ) : (
      <>
      {staffTab === "overview" && <OverviewTab {...props} />}
      {staffTab === "kitchen" && <KitchenTab orders={props.orders} advanceStatus={props.advanceStatus} cancelOrder={props.cancelOrder} />}
      {staffTab === "orders" && <OrdersTab orders={props.orders} advanceStatus={props.advanceStatus} setOrderStatus={props.setOrderStatus} cancelOrder={props.cancelOrder} deleteOrder={props.deleteOrder} clearOrders={props.clearOrders} settings={settings} />}
      {staffTab === "reservations" && <ReservationsTab reservations={props.reservations} updateReservation={props.updateReservation} />}
      {staffTab === "menu" && <MenuManageTab menuItems={props.menuItems} categories={props.categories} toggleSoldOut={props.toggleSoldOut} saveMenuItem={props.saveMenuItem} deleteMenuItem={props.deleteMenuItem} />}
      {staffTab === "categories" && <CategoriesTab categories={props.categories} saveCategory={props.saveCategory} deleteCategory={props.deleteCategory} moveCategory={props.moveCategory} menuItems={props.menuItems} />}
      {staffTab === "tables" && <TablesTab orders={props.orders} settings={settings} />}
      {staffTab === "content" && <ContentTab content={props.content} setContent={props.setContent} menuItems={props.menuItems} />}
      {staffTab === "customers" && <CustomersTab orders={props.orders} reservations={props.reservations} />}
      {staffTab === "settings" && <SettingsTab settings={settings} setSettings={props.setSettings} seedDatabase={props.seedDatabase} dbReady={dbReady} />}
      </>
      )}
    </div>
  );
}

function EmptyNote({ text }) {
  return (
    <div style={{ border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, padding: "22px 16px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12.5 }}>
      {text}
    </div>
  );
}

const cardStyle = { background: "var(--charcoal-2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px" };
const adminInput = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.16)", background: "var(--charcoal-3)", color: "#fff", fontSize: 12.5, outline: "none", fontFamily: "inherit" };

function OverviewTab({ orders, reservations, menuItems }) {
  const active = orders.filter((o) => o.status !== "Cancelled");
  const todaysOrders = active.filter((o) => isToday(o.placedAt));
  const todaysRes = reservations.filter((r) => r.date === dayStr(0));
  const revenue = active.reduce((s, o) => s + o.total, 0);
  const aov = active.length ? revenue / active.length : 0;
  const customers = new Set(orders.map((o) => o.phone || o.name).filter(Boolean)).size;

  const stats = [
    { label: "Today's orders", value: todaysOrders.length },
    { label: "Today's reservations", value: todaysRes.length },
    { label: "Open tickets", value: orders.filter((o) => ["New", "Confirmed", "Preparing", "Ready"].includes(o.status)).length },
    { label: "Menu items", value: menuItems.length },
    { label: "Total sales", value: fmt(revenue) },
    { label: "Avg. order value", value: fmt(aov) },
    { label: "Customers", value: customers },
    { label: "Pending reservations", value: reservations.filter((r) => r.status === "Pending").length },
  ];

  const popularity = {};
  active.forEach((o) => o.items.forEach((l) => { popularity[l.name] = (popularity[l.name] || 0) + l.qty; }));
  const topItems = Object.entries(popularity).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={cardStyle}>
            <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", margin: 0 }}>{s.label}</p>
            <p className="sn-serif" style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 0" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "rgba(255,255,255,0.75)" }}>Popular dishes</p>
      {topItems.length === 0 ? (
        <EmptyNote text="No orders yet. Place one from the guest view to see it here." />
      ) : (
        <div style={{ background: "var(--charcoal-2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 6 }}>
          {topItems.map(([name, qty], i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < topItems.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <span style={{ fontSize: 13 }}>{name}</span>
              <span className="sn-mono" style={{ fontSize: 12.5, color: "var(--gold)" }}>{qty} sold</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KitchenTab({ orders, advanceStatus, cancelOrder }) {
  return (
    <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
      {STAFF_STATUSES.map((status) => {
        const list = orders.filter((o) => o.status === status).sort((a, b) => a.placedAt - b.placedAt);
        return (
          <div key={status} style={{ flexShrink: 0, width: 240 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.4 }}>{status}</p>
              <span className="sn-mono" style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", padding: "2px 7px", borderRadius: 999 }}>{list.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 60 }}>
              {list.map((order) => (
                <OrderTicket key={order.id} order={order} advanceStatus={advanceStatus} cancelOrder={cancelOrder} />
              ))}
              {list.length === 0 && <div style={{ border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10, padding: "16px", textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderTicket({ order, advanceStatus, cancelOrder }) {
  const idx = STAFF_STATUSES.indexOf(order.status);
  const isLast = idx === STAFF_STATUSES.length - 1;
  const actionLabel = KITCHEN_ACTION_LABEL[order.status];
  const time = new Date(order.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const canCancel = order.status === "New" || order.status === "Confirmed";
  return (
    <div style={{ background: "var(--ticket)", color: "var(--ticket-ink)", borderRadius: 10, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="sn-mono" style={{ fontSize: 14, fontWeight: 700 }}>{order.orderNumber}</span>
        <span style={{ fontSize: 11, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {time}</span>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "2px 0 8px" }}>
        {order.table ? `Table ${order.table}` : order.orderType}{order.name ? ` · ${order.name}` : ""}
      </p>
      <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
        {order.items.map((l) => (
          <div key={l.cartId}>
            <p style={{ fontSize: 12, margin: 0 }}><strong>{l.qty}×</strong> {l.name}</p>
            {(l.size || l.spice || l.addons.length > 0) && (
              <p style={{ fontSize: 10.5, color: "var(--ink-soft)", margin: "1px 0 0" }}>
                {[l.size, l.spice ? `${l.spice} spice` : null, ...l.addons.map((a) => a.en)].filter(Boolean).join(", ")}
              </p>
            )}
            {l.instructions && <p style={{ fontSize: 10.5, color: "var(--wine-dark)", margin: "1px 0 0", fontStyle: "italic" }}>"{l.instructions}"</p>}
          </div>
        ))}
      </div>
      {order.instructions && (
        <p style={{ fontSize: 10.5, background: "rgba(214,72,46,0.08)", color: "var(--wine-dark)", padding: "5px 8px", borderRadius: 6, margin: "8px 0 0" }}>Note: {order.instructions}</p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, borderTop: "1px dashed var(--line)", paddingTop: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{fmt(order.total)}</span>
        <span style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>{order.payment}</span>
      </div>
      {!isLast && (
        <button className="sn-btn" onClick={() => advanceStatus(order.id)} style={{ width: "100%", marginTop: 10, background: "var(--wine)", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {actionLabel} <ChevronRight size={13} />
        </button>
      )}
      {canCancel && (
        <button className="sn-btn" onClick={() => cancelOrder(order.id)} style={{ width: "100%", marginTop: 6, background: "none", color: "var(--wine)", fontSize: 11, fontWeight: 600, padding: "4px", textDecoration: "underline" }}>
          Cancel order
        </button>
      )}
    </div>
  );
}

function OrdersTab({ orders, advanceStatus, setOrderStatus, cancelOrder, deleteOrder, clearOrders, settings }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const doneCount = orders.filter((o) => o.status === "Completed" || o.status === "Cancelled").length;
  function clearHistory() {
    if (!doneCount) return;
    if (window.confirm(`Permanently delete ${doneCount} completed & cancelled order${doneCount === 1 ? "" : "s"}? Active orders are kept. This can't be undone.`)) {
      clearOrders(["Completed", "Cancelled"]);
    }
  }

  const filtered = orders
    .filter((o) => (statusFilter === "All" ? true : o.status === statusFilter))
    .filter((o) => {
      const s = q.trim().toLowerCase();
      return !s || o.orderNumber.toLowerCase().includes(s) || (o.name || "").toLowerCase().includes(s) || (o.phone || "").includes(s);
    })
    .sort((a, b) => b.placedAt - a.placedAt);

  const detailOrder = orders.find((o) => o.id === detail);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, name, phone" style={{ ...adminInput, maxWidth: 260 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...adminInput, maxWidth: 170 }}>
          {["All", ...STAFF_STATUSES, "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <button
          className="sn-btn"
          onClick={clearHistory}
          disabled={!doneCount}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--charcoal-3)", color: doneCount ? "#F0A5A8" : "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 9, padding: "9px 14px", fontSize: 12, fontWeight: 700 }}
        >
          <Trash2 size={13} /> Clear history{doneCount ? ` (${doneCount})` : ""}
        </button>
      </div>

      <div style={{ background: "var(--charcoal-2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 90px 90px 80px 120px", gap: 8, padding: "10px 14px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <span>Order</span><span>Customer</span><span>Type</span><span>Total</span><span>Items</span><span>Status</span>
        </div>
        {filtered.length === 0 && <div style={{ padding: 20 }}><EmptyNote text="No orders match." /></div>}
        {filtered.map((o) => (
          <button key={o.id} className="sn-btn" onClick={() => setDetail(o.id)} style={{ width: "100%", textAlign: "left", display: "grid", gridTemplateColumns: "90px 1fr 90px 90px 80px 120px", gap: 8, padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "none", color: "#fff", fontSize: 12.5, alignItems: "center" }}>
            <span className="sn-mono" style={{ fontWeight: 700 }}>{o.orderNumber}</span>
            <span>{o.name || "Guest"}{o.table ? ` · T${o.table}` : ""}</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{o.orderType}</span>
            <span style={{ fontWeight: 700 }}>{fmt(o.total)}</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{o.items.reduce((s, l) => s + l.qty, 0)}</span>
            <StatusPill status={o.status} />
          </button>
        ))}
      </div>

      {detailOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 150, display: "flex", justifyContent: "flex-end" }} onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, height: "100%", overflowY: "auto", background: "var(--charcoal-2)", padding: 22, borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="sn-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--gold-soft)" }}>{detailOrder.orderNumber}</span>
              <button className="sn-btn" onClick={() => setDetail(null)} style={{ background: "none", color: "rgba(255,255,255,0.6)" }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "4px 0 0" }}>
              {new Date(detailOrder.placedAt).toLocaleString()} · {detailOrder.orderType}{detailOrder.table ? ` · Table ${detailOrder.table}` : ""}
            </p>
            <p style={{ fontSize: 12.5, margin: "10px 0 0" }}>{detailOrder.name || "Guest"} {detailOrder.phone ? `· ${detailOrder.phone}` : ""}</p>
            {detailOrder.email && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "2px 0 0" }}>{detailOrder.email}</p>}

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, background: "var(--charcoal-3)", borderRadius: 10, padding: 10 }}>
              <div style={{ padding: 5, background: "#fff", borderRadius: 6, flexShrink: 0 }}>
                <QR text={orderTrackUrl(settings, detailOrder.orderNumber)} size={64} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, margin: 0 }}>Customer tracking QR</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "3px 0 0", wordBreak: "break-all" }}>{orderTrackUrl(settings, detailOrder.orderNumber)}</p>
              </div>
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {detailOrder.items.map((l) => (
                <div key={l.cartId} style={{ fontSize: 12.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{l.qty}× {l.name}</span><span style={{ fontWeight: 700 }}>{fmt(l.unitPrice * l.qty)}</span>
                  </div>
                  {(l.size || l.spice || l.addons.length > 0 || l.instructions) && (
                    <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", margin: "1px 0 0" }}>
                      {[l.size, l.spice ? `${l.spice} spice` : null, ...l.addons.map((a) => a.en), l.instructions ? `"${l.instructions}"` : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10, fontSize: 12.5 }}>
              <Row2 l="Subtotal" r={fmt(detailOrder.subtotal)} />
              <Row2 l="Tax" r={fmt(detailOrder.tax)} />
              {detailOrder.deliveryFee > 0 && <Row2 l="Delivery fee" r={fmt(detailOrder.deliveryFee)} />}
              {detailOrder.discount > 0 && <Row2 l="Discount" r={`−${fmt(detailOrder.discount)}`} />}
              <Row2 l="Total" r={fmt(detailOrder.total)} bold />
              <Row2 l="Payment" r={detailOrder.payment} />
            </div>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "16px 0 6px", fontWeight: 700, textTransform: "uppercase" }}>Status</p>
            <select value={detailOrder.status} onChange={(e) => setOrderStatus(detailOrder.id, e.target.value)} style={adminInput}>
              {[...STAFF_STATUSES, "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="sn-btn" onClick={() => setReceipt(detailOrder)} style={{ flex: 1, background: "var(--wine)", color: "#fff", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Printer size={13} /> Print receipt</button>
              {detailOrder.status !== "Cancelled" && detailOrder.status !== "Completed" && (
                <button className="sn-btn" onClick={() => cancelOrder(detailOrder.id)} style={{ background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 9, padding: "10px 14px", fontSize: 12, fontWeight: 700 }}>Cancel</button>
              )}
            </div>
            <button
              className="sn-btn"
              onClick={() => {
                if (window.confirm(`Permanently delete order ${detailOrder.orderNumber}? This can't be undone.`)) {
                  deleteOrder(detailOrder.id);
                  setDetail(null);
                }
              }}
              style={{ width: "100%", marginTop: 8, background: "none", border: "1px solid rgba(240,165,168,0.4)", color: "#F0A5A8", borderRadius: 9, padding: "9px", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Trash2 size={12} /> Delete order
            </button>
          </div>
        </div>
      )}

      {receipt && <ReceiptModal order={receipt} settings={settings} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Row2({ l, r, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontWeight: bold ? 700 : 400, color: bold ? "#fff" : "rgba(255,255,255,0.7)" }}>
      <span>{l}</span><span>{r}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    New: ["rgba(224,167,60,0.2)", "#F0CE8C"], Confirmed: ["rgba(94,140,106,0.2)", "#9FD3AC"],
    Preparing: ["rgba(94,140,106,0.2)", "#9FD3AC"], Ready: ["rgba(94,140,106,0.28)", "#B6E3C0"],
    Served: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.7)"], Completed: ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.55)"],
    Cancelled: ["rgba(214,72,46,0.2)", "#F0A5A8"],
  };
  const [bg, fg] = map[status] || map.Completed;
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: bg, color: fg, textAlign: "center" }}>{status}</span>;
}

function ReceiptModal({ order, settings, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "#1B2330", borderRadius: 12, maxWidth: 320, width: "100%", padding: 0, maxHeight: "90vh", overflowY: "auto" }}>
        <div className="sn-receipt" style={{ padding: 22, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          <img src={LOGO_SRC} alt={settings.name} style={{ height: 40, width: "auto", margin: "0 auto 6px", display: "block" }} />
          <p style={{ textAlign: "center", margin: "0 0 10px", fontSize: 10 }}>{settings.address} · {settings.phone}</p>
          <div style={{ borderTop: "1px dashed #999", borderBottom: "1px dashed #999", padding: "8px 0", margin: "8px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>{order.orderNumber}</span><span>{new Date(order.placedAt).toLocaleString()}</span></div>
            <div>{order.orderType}{order.table ? ` · Table ${order.table}` : ""}{order.name ? ` · ${order.name}` : ""}</div>
          </div>
          {order.items.map((l) => (
            <div key={l.cartId} style={{ margin: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{l.qty}× {l.name}</span><span>{fmt(l.unitPrice * l.qty)}</span></div>
              {(l.size || l.spice || l.addons.length > 0) && <div style={{ fontSize: 10, color: "#666" }}>{[l.size, l.spice, ...l.addons.map((a) => a.en)].filter(Boolean).join(", ")}</div>}
            </div>
          ))}
          <div style={{ borderTop: "1px dashed #999", marginTop: 8, paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tax</span><span>{fmt(order.tax)}</span></div>
            {order.deliveryFee > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Delivery</span><span>{fmt(order.deliveryFee)}</span></div>}
            {order.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Discount</span><span>−{fmt(order.discount)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13, marginTop: 4 }}><span>TOTAL</span><span>{fmt(order.total)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Payment</span><span>{order.payment}</span></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 12 }}>
            <QR text={orderTrackUrl(settings, order.orderNumber)} size={96} />
            <p style={{ fontSize: 9, margin: "4px 0 0" }}>Scan to track your order</p>
          </div>
          <p style={{ textAlign: "center", margin: "10px 0 0", fontSize: 10 }}>Thank you — see you again!</p>
        </div>
        <div style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid #eee" }}>
          <button className="sn-btn" onClick={() => window.print()} style={{ flex: 1, background: "var(--wine)", color: "#fff", borderRadius: 9, padding: "10px", fontSize: 12.5, fontWeight: 700 }}>Print</button>
          <button className="sn-btn" onClick={onClose} style={{ background: "#eee", color: "#1B2330", borderRadius: 9, padding: "10px 16px", fontSize: 12.5, fontWeight: 700 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ReservationsTab({ reservations, updateReservation }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [q, setQ] = useState("");

  const list = reservations
    .filter((r) => (statusFilter === "All" ? true : r.status === statusFilter))
    .filter((r) => (dateFilter ? r.date === dateFilter : true))
    .filter((r) => {
      const s = q.trim().toLowerCase();
      return !s || r.name.toLowerCase().includes(s) || (r.phone || "").includes(s) || (r.email || "").toLowerCase().includes(s);
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const actions = {
    Pending: [["Confirmed", "Confirm"], ["Rejected", "Reject"]],
    Confirmed: [["Completed", "Mark completed"], ["Cancelled", "Cancel"]],
    Completed: [], Cancelled: [["Confirmed", "Reopen"]], Rejected: [["Confirmed", "Reopen"]],
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email" style={{ ...adminInput, maxWidth: 240 }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...adminInput, maxWidth: 150 }}>
          {["All", ...RES_STATUSES].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ ...adminInput, maxWidth: 160 }} />
        {dateFilter && <button className="sn-btn" onClick={() => setDateFilter("")} style={{ ...adminInput, maxWidth: 70, cursor: "pointer" }}>Clear</button>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.length === 0 && <EmptyNote text="No reservations match." />}
        {list.map((r) => (
          <div key={r.id} style={{ ...cardStyle, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>{r.name} <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.55)" }}>· {r.guests} guests</span></p>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", margin: "3px 0 0" }}>{r.phone}{r.email ? ` · ${r.email}` : ""}</p>
              {r.request && <p style={{ fontSize: 11.5, color: "var(--gold)", margin: "3px 0 0", fontStyle: "italic" }}>"{r.request}"</p>}
            </div>
            <div style={{ textAlign: "center" }}>
              <p className="sn-mono" style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{r.date}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "2px 0 0" }}>{r.time}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <StatusPill status={r.status} />
              {(actions[r.status] || []).map(([to, label]) => (
                <button key={to} className="sn-btn" onClick={() => updateReservation(r.id, to)} style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 8, background: to === "Cancelled" || to === "Rejected" ? "var(--charcoal-3)" : "var(--wine)", color: to === "Cancelled" || to === "Rejected" ? "#F0A5A8" : "#fff" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BLANK_ITEM = () => ({ id: "n" + uid(), category: "Starters", price: 0, icon: "🍽️", image: "", rating: 4.5, popular: false, recommended: false, isNew: true, available: true, veg: false, spicy: false, allergens: [], en: "", mm: "", zh: "", es: "", th: "", descEn: "" });

function MenuManageTab({ menuItems, categories, toggleSoldOut, saveMenuItem, deleteMenuItem }) {
  const [editing, setEditing] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const list = catFilter === "All" ? menuItems : menuItems.filter((i) => i.category === catFilter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ ...adminInput, maxWidth: 200 }}>
          <option value="All">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.en}</option>)}
        </select>
        <button className="sn-btn" onClick={() => setEditing(BLANK_ITEM())} style={{ background: "var(--wine)", color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add menu item
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, ...cardStyle }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: item.image ? "var(--charcoal-3)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, position: "relative", overflow: "hidden" }}><FoodMedia image={item.image} icon={item.icon} alt={item.en} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{item.en}
                {item.popular && <span style={{ color: "var(--gold)", fontSize: 10, marginLeft: 6 }}>★ popular</span>}
                {item.veg && <span style={{ color: "#9FD3AC", fontSize: 10, marginLeft: 6 }}>veg</span>}
                {item.spicy && <span style={{ color: "#F0A5A8", fontSize: 10, marginLeft: 6 }}>spicy</span>}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>{item.category} · {fmt(item.price)}</p>
            </div>
            <button className="sn-btn" onClick={() => toggleSoldOut(item.id)} style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 999, background: item.available ? "rgba(94,140,106,0.18)" : "rgba(214,72,46,0.18)", color: item.available ? "#9FD3AC" : "#F0A5A8" }}>
              {item.available ? "Available" : "Sold out"}
            </button>
            <button className="sn-btn" onClick={() => setEditing({ ...item })} style={{ color: "rgba(255,255,255,0.7)", background: "var(--charcoal-3)", borderRadius: 8, padding: 7 }}><Pencil size={13} /></button>
            <button className="sn-btn" onClick={() => { if (confirm(`Delete "${item.en}"?`)) deleteMenuItem(item.id); }} style={{ color: "#F0A5A8", background: "var(--charcoal-3)", borderRadius: 8, padding: 7 }}><Trash2 size={13} /></button>
          </div>
        ))}
        {list.length === 0 && <EmptyNote text="No items in this category." />}
      </div>

      {editing && (
        <ItemEditor
          item={editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSave={(it) => { saveMenuItem(it); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ItemEditor({ item, categories, onCancel, onSave }) {
  const [f, setF] = useState({
    ...item,
    allergensStr: (item.allergens || []).join(", "),
    addonRows: (item.addons || []).map((a) => ({ en: a.en, price: a.price })),
    sizeRows: (item.sizes || []).map((s) => ({ name: s.name, delta: s.delta })),
  });
  const [imgBusy, setImgBusy] = useState(false);
  const [imgErr, setImgErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setRow = (key, i, patch) => set(key, f[key].map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const L = { fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "12px 0 4px", fontWeight: 600 };

  async function onPhotoFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImgErr("Please choose an image file."); return; }
    setImgErr(""); setImgBusy(true);
    try {
      const dataUrl = await fileToImageDataUrl(file);
      set("image", dataUrl);
    } catch {
      setImgErr("Couldn't read that image.");
    } finally {
      setImgBusy(false);
    }
  }

  function save() {
    const out = {
      ...f,
      price: Number(f.price) || 0,
      rating: Number(f.rating) || 4.5,
      prepMins: f.prepMins ? Number(f.prepMins) : undefined,
      allergens: f.allergensStr.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      addons: f.addonRows.filter((a) => a.en.trim()).map((a) => ({ en: a.en.trim(), price: Number(a.price) || 0 })),
      sizes: f.sizeRows.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), delta: Number(s.delta) || 0 })),
    };
    if (out.addons.length === 0) delete out.addons;
    if (out.sizes.length === 0) delete out.sizes;
    delete out.allergensStr;
    delete out.addonRows;
    delete out.sizeRows;
    onSave(out);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 16, overflowY: "auto" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--charcoal-2)", borderRadius: 14, maxWidth: 460, width: "100%", padding: 22, color: "#fff", margin: "20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p className="sn-serif" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--gold-soft)" }}>{item.en ? "Edit item" : "New item"}</p>
          <button className="sn-btn" onClick={onCancel} style={{ background: "none", color: "rgba(255,255,255,0.6)" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 64 }}>
            <p style={L}>Icon</p>
            <input value={f.icon} onChange={(e) => set("icon", e.target.value)} style={{ ...adminInput, textAlign: "center", fontSize: 20 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={L}>Name (English)</p>
            <input value={f.en} onChange={(e) => set("en", e.target.value)} style={adminInput} />
          </div>
        </div>

        <p style={L}>Photo</p>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 84, height: 84, borderRadius: 10, flexShrink: 0, background: f.image ? "var(--charcoal-3)" : "var(--charcoal-3)", border: "1px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, position: "relative", overflow: "hidden" }}>
            <FoodMedia image={f.image} icon={f.icon} alt={f.en} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="sn-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--wine)", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={13} /> {imgBusy ? "Loading…" : f.image ? "Replace photo" : "Upload photo"}
              <input type="file" accept="image/*" onChange={onPhotoFile} style={{ display: "none" }} />
            </label>
            {f.image && (
              <button className="sn-btn" onClick={() => set("image", "")} style={{ marginLeft: 8, background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>Remove</button>
            )}
            <p style={L}>…or paste an image URL</p>
            <input value={(f.image || "").startsWith("data:") ? "" : (f.image || "")} placeholder="https://…/photo.jpg" onChange={(e) => set("image", e.target.value.trim())} style={adminInput} />
            {imgErr && <p style={{ fontSize: 11, color: "#F0A5A8", margin: "4px 0 0" }}>{imgErr}</p>}
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>Uploads are resized to ~1000px and stored with the item. No photo → the emoji icon is shown.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><p style={L}>Burmese (my)</p><input value={f.mm} onChange={(e) => set("mm", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Chinese (zh)</p><input value={f.zh} onChange={(e) => set("zh", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Spanish (es)</p><input value={f.es} onChange={(e) => set("es", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Thai (th)</p><input value={f.th} onChange={(e) => set("th", e.target.value)} style={adminInput} /></div>
        </div>

        <p style={L}>Description (English)</p>
        <textarea rows={2} value={f.descEn} onChange={(e) => set("descEn", e.target.value)} style={{ ...adminInput, resize: "none" }} />

        <p style={L}>Ingredients</p>
        <textarea rows={2} value={f.ingredients || ""} onChange={(e) => set("ingredients", e.target.value)} style={{ ...adminInput, resize: "none" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <div><p style={L}>Price (USD)</p><input type="number" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Rating</p><input type="number" step="0.1" value={f.rating} onChange={(e) => set("rating", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Prep (min)</p><input type="number" value={f.prepMins || ""} onChange={(e) => set("prepMins", e.target.value)} style={adminInput} /></div>
          <div>
            <p style={L}>Category</p>
            <select value={f.category} onChange={(e) => set("category", e.target.value)} style={adminInput}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.en}</option>)}
            </select>
          </div>
        </div>

        <p style={L}>Allergens (comma separated)</p>
        <input value={f.allergensStr} onChange={(e) => set("allergensStr", e.target.value)} placeholder="fish, soy, gluten" style={adminInput} />

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
          {[["available", "Available"], ["popular", "Popular"], ["recommended", "Recommended"], ["isNew", "New"], ["veg", "Vegetarian"], ["spicy", "Spicy"], ["spiceLevels", "Spice levels"]].map(([k, label]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={!!f[k]} onChange={(e) => set(k, e.target.checked)} style={{ accentColor: "#D6482E" }} /> {label}
            </label>
          ))}
        </div>

        <p style={L}>Sizes (name + price change)</p>
        {f.sizeRows.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input value={s.name} placeholder="Regular" onChange={(e) => setRow("sizeRows", i, { name: e.target.value })} style={adminInput} />
            <input type="number" step="0.25" value={s.delta} onChange={(e) => setRow("sizeRows", i, { delta: e.target.value })} style={{ ...adminInput, width: 90 }} />
            <button className="sn-btn" onClick={() => set("sizeRows", f.sizeRows.filter((_, j) => j !== i))} style={{ background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 8, padding: "0 10px" }}><X size={13} /></button>
          </div>
        ))}
        <button className="sn-btn" onClick={() => set("sizeRows", [...f.sizeRows, { name: "", delta: 0 }])} style={{ fontSize: 11, fontWeight: 700, background: "var(--charcoal-3)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }}><Plus size={12} /> Add size</button>

        <p style={L}>Add-ons (name + price)</p>
        {f.addonRows.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input value={a.en} placeholder="Extra rice" onChange={(e) => setRow("addonRows", i, { en: e.target.value })} style={adminInput} />
            <input type="number" step="0.25" value={a.price} onChange={(e) => setRow("addonRows", i, { price: e.target.value })} style={{ ...adminInput, width: 90 }} />
            <button className="sn-btn" onClick={() => set("addonRows", f.addonRows.filter((_, j) => j !== i))} style={{ background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 8, padding: "0 10px" }}><X size={13} /></button>
          </div>
        ))}
        <button className="sn-btn" onClick={() => set("addonRows", [...f.addonRows, { en: "", price: 0 }])} style={{ fontSize: 11, fontWeight: 700, background: "var(--charcoal-3)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }}><Plus size={12} /> Add add-on</button>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button className="sn-btn" onClick={save} disabled={!f.en.trim()} style={{ flex: 1, background: f.en.trim() ? "var(--wine)" : "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 700 }}>Save</button>
          <button className="sn-btn" onClick={onCancel} style={{ background: "var(--charcoal-3)", color: "rgba(255,255,255,0.7)", borderRadius: 9, padding: "11px 18px", fontSize: 13, fontWeight: 700 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ categories, saveCategory, deleteCategory, moveCategory, menuItems }) {
  const [editing, setEditing] = useState(null);
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const count = (id) => menuItems.filter((i) => i.category === id).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="sn-btn" onClick={() => setEditing({ id: "", order: (sorted.at(-1)?.order || 0) + 1, active: true, icon: "🍽️", en: "", mm: "", zh: "", es: "", th: "" })} style={{ background: "var(--wine)", color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Add category
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((c, i) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, ...cardStyle }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <button className="sn-btn" onClick={() => moveCategory(c.id, -1)} disabled={i === 0} style={{ background: "none", color: i === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}><ArrowUp size={13} /></button>
              <button className="sn-btn" onClick={() => moveCategory(c.id, 1)} disabled={i === sorted.length - 1} style={{ background: "none", color: i === sorted.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}><ArrowDown size={13} /></button>
            </div>
            <span style={{ fontSize: 22 }}>{c.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{c.en}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "2px 0 0" }}>{count(c.id)} items · {c.zh} · {c.th}</p>
            </div>
            <button className="sn-btn" onClick={() => saveCategory({ ...c, active: !c.active })} style={{ fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 999, background: c.active ? "rgba(94,140,106,0.18)" : "rgba(255,255,255,0.1)", color: c.active ? "#9FD3AC" : "rgba(255,255,255,0.5)" }}>
              {c.active ? "Enabled" : "Disabled"}
            </button>
            <button className="sn-btn" onClick={() => setEditing({ ...c })} style={{ color: "rgba(255,255,255,0.7)", background: "var(--charcoal-3)", borderRadius: 8, padding: 7 }}><Pencil size={13} /></button>
            <button className="sn-btn" onClick={() => { if (count(c.id) > 0) alert("Move or delete its items first."); else if (confirm(`Delete "${c.en}"?`)) deleteCategory(c.id); }} style={{ color: "#F0A5A8", background: "var(--charcoal-3)", borderRadius: 8, padding: 7 }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {editing && <CategoryEditor cat={editing} onCancel={() => setEditing(null)} onSave={(c) => { saveCategory(c.id ? c : { ...c, id: c.en }); setEditing(null); }} />}
    </div>
  );
}

function CategoryEditor({ cat, onCancel, onSave }) {
  const [f, setF] = useState({ ...cat });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const L = { fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "12px 0 4px", fontWeight: 600 };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 16 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--charcoal-2)", borderRadius: 14, maxWidth: 400, width: "100%", padding: 22, color: "#fff", margin: "30px 0" }}>
        <p className="sn-serif" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "var(--gold-soft)" }}>{cat.id ? "Edit category" : "New category"}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 64 }}><p style={L}>Icon</p><input value={f.icon} onChange={(e) => set("icon", e.target.value)} style={{ ...adminInput, textAlign: "center", fontSize: 20 }} /></div>
          <div style={{ flex: 1 }}><p style={L}>Name (English)</p><input value={f.en} onChange={(e) => set("en", e.target.value)} style={adminInput} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><p style={L}>Burmese</p><input value={f.mm} onChange={(e) => set("mm", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Chinese</p><input value={f.zh} onChange={(e) => set("zh", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Spanish</p><input value={f.es} onChange={(e) => set("es", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Thai</p><input value={f.th} onChange={(e) => set("th", e.target.value)} style={adminInput} /></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button className="sn-btn" onClick={() => onSave(f)} disabled={!f.en.trim()} style={{ flex: 1, background: f.en.trim() ? "var(--wine)" : "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 700 }}>Save</button>
          <button className="sn-btn" onClick={onCancel} style={{ background: "var(--charcoal-3)", color: "rgba(255,255,255,0.7)", borderRadius: 9, padding: "11px 18px", fontSize: 13, fontWeight: 700 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ---- QR code rendering (offline, no external service) ---- */

function QR({ text, size = 128, quiet = 2, style }) {
  const qr = useMemo(() => {
    try { return QRCode.create(text || " ", { errorCorrectionLevel: "M" }); }
    catch { return null; }
  }, [text]);
  if (!qr) return null;
  const n = qr.modules.size;
  const data = qr.modules.data;
  const dim = n + quiet * 2;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (data[r * n + c]) d += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${dim} ${dim}`} shapeRendering="crispEdges" style={{ background: "#fff", display: "block", ...style }} role="img" aria-label={`QR code for ${text}`}>
      <path d={d} fill="#000" />
    </svg>
  );
}

function qrOrigin() {
  return typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://your-restaurant.example/";
}
function tableUrl(settings, number) {
  let b = (settings.siteUrl || "").trim() || qrOrigin();
  b = b.replace(/\s+/g, "");
  return b + (b.includes("?") ? "&" : "?") + "table=" + number;
}
function orderTrackUrl(settings, orderNumber) {
  let b = ((settings && settings.siteUrl) || "").trim() || qrOrigin();
  b = b.replace(/\s+/g, "");
  return b + (b.includes("?") ? "&" : "?") + "order=" + orderNumber;
}
async function downloadQrPng(text, filename) {
  try {
    const url = await QRCode.toDataURL(text, { width: 800, margin: 2, errorCorrectionLevel: "M" });
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch { /* ignore */ }
}

function QrCard({ name, tagline, number, url, qrSize = 150 }) {
  return (
    <div className="sn-qr-card" style={{ background: "#fff", color: "#1B2330", border: "1px solid #ddd", borderRadius: 14, padding: 20, textAlign: "center", width: 240 }}>
      <img src={LOGO_SRC} alt={name} style={{ height: 48, width: "auto", margin: "0 auto 10px", display: "block" }} />
      <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a8a8a", margin: "0 0 12px" }}>{tagline}</p>
      <div style={{ display: "inline-block", padding: 8, border: "1px solid #eee", borderRadius: 10 }}>
        <QR text={url} size={qrSize} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 2px" }}>Table {number}</p>
      <p style={{ fontSize: 11, color: "#555", margin: 0 }}>Scan to view the menu &amp; order from your table</p>
    </div>
  );
}

function TableQRModal({ table, url, settings, onClose }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--charcoal-2)", borderRadius: 16, padding: 22, maxWidth: 340, width: "100%", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p className="sn-serif" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--gold-soft)" }}>Table {table} QR</p>
          <button className="sn-btn" onClick={onClose} style={{ background: "none", color: "rgba(255,255,255,0.6)" }}><X size={18} /></button>
        </div>
        <div className="sn-print" style={{ display: "flex", justifyContent: "center" }}>
          <QrCard name={settings.name} tagline={settings.tagline} number={table} url={url} qrSize={190} />
        </div>
        <p className="sn-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", wordBreak: "break-all", margin: "12px 0 0" }}>{url}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <button className="sn-btn" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ background: "var(--charcoal-3)", color: "#fff", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy link"}
          </button>
          <button className="sn-btn" onClick={() => downloadQrPng(url, `hello-sushi-table-${table}.png`)} style={{ background: "var(--charcoal-3)", color: "#fff", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Download size={13} /> PNG
          </button>
          <a href={url} target="_blank" rel="noreferrer" style={{ background: "var(--charcoal-3)", color: "#fff", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
            <ExternalLink size={13} /> Open
          </a>
          <button className="sn-btn" onClick={() => window.print()} style={{ background: "var(--wine)", color: "#fff", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Printer size={13} /> Print card
          </button>
        </div>
      </div>
    </div>
  );
}

function PrintAllQR({ tables, settings, onClose }) {
  useEffect(() => {
    const tm = setTimeout(() => window.print(), 350);
    return () => clearTimeout(tm);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 220, overflowY: "auto", padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>Print preview — {tables.length} table cards</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="sn-btn" onClick={() => window.print()} style={{ background: "var(--wine)", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>Print</button>
            <button className="sn-btn" onClick={onClose} style={{ background: "#fff", color: "#1B2330", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>Close</button>
          </div>
        </div>
        <div className="sn-print" style={{ background: "#fff", borderRadius: 12, padding: 20, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          {tables.map((tb) => (
            <QrCard key={tb.number} name={settings.name} tagline={settings.tagline} number={tb.number} url={tableUrl(settings, tb.number)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TablesTab({ orders, settings }) {
  const tables = tablesList(settings.tableCount);
  const [modalTable, setModalTable] = useState(null);
  const [printAll, setPrintAll] = useState(false);
  const [copied, setCopied] = useState(null);
  const base = (settings.siteUrl || "").trim() || qrOrigin();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, maxWidth: 520, lineHeight: 1.55 }}>
          Each table has a unique QR code linking to <span className="sn-mono">{base}{base.includes("?") ? "&" : "?"}table=NN</span>. Scanning it opens the menu with the table number attached to every order. Set the public site URL in <strong>Settings</strong> so codes point at your live site.
        </p>
        <button className="sn-btn" onClick={() => setPrintAll(true)} style={{ background: "var(--wine)", color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, height: "fit-content", whiteSpace: "nowrap" }}>
          <Printer size={14} /> Print all QR cards
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {tables.map((tb) => {
          const active = orders.find((o) => o.table === tb.number && o.status !== "Completed" && o.status !== "Cancelled");
          const status = active ? (active.status === "New" ? "Ordering" : "Occupied") : "Available";
          const dot = status === "Available" ? "#8FD69B" : status === "Ordering" ? "var(--gold)" : "#F0A5A8";
          const url = tableUrl(settings, tb.number);
          return (
            <div key={tb.number} style={{ background: "var(--charcoal-2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <button className="sn-btn" onClick={() => setModalTable(tb.number)} style={{ background: "#fff", borderRadius: 8, padding: 8, margin: "0 auto 10px", display: "block", lineHeight: 0 }} title="View / print card">
                <QR text={url} size={104} />
              </button>
              <p className="sn-mono" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Table {tb.number}</p>
              <p style={{ fontSize: 10.5, margin: "5px 0 8px", color: dot, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block" }} /> {status}
              </p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <button className="sn-btn" onClick={() => { navigator.clipboard?.writeText(url); setCopied(tb.number); setTimeout(() => setCopied(null), 1400); }} style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", background: "var(--charcoal-3)", borderRadius: 7, padding: "5px 8px", display: "inline-flex", alignItems: "center", gap: 4 }} title="Copy link">
                  {copied === tb.number ? <Check size={11} /> : <Copy size={11} />}
                </button>
                <button className="sn-btn" onClick={() => downloadQrPng(url, `hello-sushi-table-${tb.number}.png`)} style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", background: "var(--charcoal-3)", borderRadius: 7, padding: "5px 8px", display: "inline-flex", alignItems: "center", gap: 4 }} title="Download PNG">
                  <Download size={11} />
                </button>
                <button className="sn-btn" onClick={() => setModalTable(tb.number)} style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", background: "var(--charcoal-3)", borderRadius: 7, padding: "5px 8px", display: "inline-flex", alignItems: "center", gap: 4 }} title="Print card">
                  <Printer size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalTable && <TableQRModal table={modalTable} url={tableUrl(settings, modalTable)} settings={settings} onClose={() => setModalTable(null)} />}
      {printAll && <PrintAllQR tables={tables} settings={settings} onClose={() => setPrintAll(false)} />}
    </div>
  );
}

function CustomersTab({ orders, reservations }) {
  const [q, setQ] = useState("");
  const customers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const key = (o.phone || o.name || o.id).trim();
      if (!map[key]) map[key] = { name: o.name || "Guest", phone: o.phone || "—", email: o.email || "", visits: 0, spent: 0, last: 0 };
      map[key].visits++;
      map[key].spent += o.total;
      map[key].last = Math.max(map[key].last, o.placedAt);
      if (o.email) map[key].email = o.email;
    });
    reservations.forEach((r) => {
      const key = (r.phone || r.name).trim();
      if (!map[key]) map[key] = { name: r.name, phone: r.phone || "—", email: r.email || "", visits: 0, spent: 0, last: r.createdAt, reservations: 0 };
      map[key].reservations = (map[key].reservations || 0) + 1;
    });
    return Object.values(map).sort((a, b) => b.last - a.last);
  }, [orders, reservations]);

  const list = customers.filter((c) => {
    const s = q.trim().toLowerCase();
    return !s || c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.email.toLowerCase().includes(s);
  });

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers" style={{ ...adminInput, maxWidth: 260, marginBottom: 14 }} />
      <div style={{ background: "var(--charcoal-2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 80px 90px 90px", gap: 8, padding: "10px 14px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <span>Customer</span><span>Phone</span><span>Orders</span><span>Spent</span><span>Bookings</span>
        </div>
        {list.map((c, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 130px 80px 90px 90px", gap: 8, padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: 12.5, alignItems: "center" }}>
            <span>{c.name}{c.email ? <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}> · {c.email}</span> : ""}</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{c.phone}</span>
            <span>{c.visits}</span>
            <span style={{ fontWeight: 700 }}>{fmt(c.spent)}</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>{c.reservations || 0}</span>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 20 }}><EmptyNote text="No customers yet." /></div>}
      </div>
    </div>
  );
}

const BLANK_PAYMENT = () => ({ id: "pm" + uid(), label: "", type: "person", note: "", url: "", image: "", enabled: true });

function PaymentMethodsEditor({ value, onChange }) {
  const list = value || [];
  const L = { fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "10px 0 4px", fontWeight: 600 };
  const patch = (i, p) => onChange(list.map((m, j) => (j === i ? { ...m, ...p } : m)));
  const remove = (i) => onChange(list.filter((_, j) => j !== i));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  async function pickImage(i, e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try { patch(i, { image: await fileToImageDataUrl(file, 800, 0.85) }); } catch { /* ignore */ }
  }
  return (
    <div style={{ ...cardStyle, marginTop: 26 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: "0 0 4px", color: "var(--gold-soft)" }}>Payment methods</p>
      <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 10px" }}>
        Shown to customers at checkout and on the order screen. <b>Pay in person</b> = label + instructions only.
        <b> Pay now</b> = add a link (Venmo, Cash App, PayPal.me, a Stripe Payment Link, a Square checkout link — anything)
        and/or upload a QR image; the app shows a tap-to-pay button and a scannable QR.
      </p>
      {list.map((m, i) => (
        <div key={m.id || i} style={{ border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: 12, marginBottom: 10, background: m.enabled ? "transparent" : "rgba(255,255,255,0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
              <input type="checkbox" checked={m.enabled !== false} onChange={(e) => patch(i, { enabled: e.target.checked })} style={{ accentColor: "#D6482E" }} /> On
            </label>
            <select value={m.type === "online" ? "online" : "person"} onChange={(e) => patch(i, { type: e.target.value })} style={{ ...adminInput, width: "auto", padding: "6px 8px" }}>
              <option value="person">Pay in person</option>
              <option value="online">Pay now (link / QR)</option>
            </select>
            <span style={{ flex: 1 }} />
            <button className="sn-btn" onClick={() => move(i, -1)} style={{ background: "var(--charcoal-3)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 12 }}>↑</button>
            <button className="sn-btn" onClick={() => move(i, 1)} style={{ background: "var(--charcoal-3)", color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 12 }}>↓</button>
            <button className="sn-btn" onClick={() => remove(i)} style={{ background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 6, padding: "4px 8px", fontSize: 12 }}><Trash2 size={12} /></button>
          </div>
          <p style={L}>Label</p>
          <input value={m.label} onChange={(e) => patch(i, { label: e.target.value })} placeholder="e.g. Pay at counter" style={adminInput} />
          <p style={L}>Instructions shown to the customer</p>
          <textarea rows={2} value={m.note} onChange={(e) => patch(i, { note: e.target.value })} style={{ ...adminInput, resize: "none" }} />
          {m.type === "online" && (
            <>
              <p style={L}>Payment link (optional)</p>
              <input value={m.url} onChange={(e) => patch(i, { url: e.target.value })} placeholder="https://venmo.com/…  ·  https://buy.stripe.com/…" style={adminInput} />
              <p style={L}>…or upload a QR image (optional — used instead of the link's QR)</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.image && <img src={m.image} alt="" style={{ width: 44, height: 44, objectFit: "contain", background: "#fff", borderRadius: 6 }} />}
                <label className="sn-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--charcoal-3)", color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  <Plus size={12} /> {m.image ? "Replace" : "Upload"} QR
                  <input type="file" accept="image/*" onChange={(e) => pickImage(i, e)} style={{ display: "none" }} />
                </label>
                {m.image && <button className="sn-btn" onClick={() => patch(i, { image: "" })} style={{ background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 8, padding: "7px 10px", fontSize: 11.5 }}>Remove</button>}
              </div>
            </>
          )}
        </div>
      ))}
      <button className="sn-btn" onClick={() => onChange([...list, BLANK_PAYMENT()])} style={{ background: "var(--charcoal-3)", color: "#fff", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700 }}>
        <Plus size={12} /> Add payment method
      </button>
    </div>
  );
}

function SettingsTab({ settings, setSettings, seedDatabase, dbReady }) {
  const [f, setF] = useState({
    ...settings,
    taxPct: (settings.taxRate * 100).toString(),
    paymentMethods: (settings.paymentMethods && settings.paymentMethods.length ? settings.paymentMethods : DEFAULT_SETTINGS.paymentMethods).map((m) => ({ ...m })),
  });
  const [saved, setSaved] = useState(false);
  const [seedState, setSeedState] = useState("idle"); // idle | busy | done | error
  const [seedErr, setSeedErr] = useState("");

  async function runSeed() {
    if (seedState === "busy") return;
    if (!window.confirm("Load the built-in menu, categories, content and settings into Supabase? Anything that already exists (including edits you've made) is kept — only missing rows are added.")) return;
    setSeedState("busy");
    setSeedErr("");
    try {
      await seedDatabase();
      setSeedState("done");
    } catch (e) {
      setSeedErr(e?.message || String(e));
      setSeedState("error");
    }
  }
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };
  const L = { fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "14px 0 4px", fontWeight: 600 };

  function save() {
    const paymentMethods = (f.paymentMethods || [])
      .map((m, i) => ({
        id: m.id || "pm" + i,
        label: (m.label || "").trim() || `Method ${i + 1}`,
        type: m.type === "online" ? "online" : "person",
        note: (m.note || "").trim(),
        url: (m.url || "").trim(),
        image: m.image || "",
        enabled: m.enabled !== false,
      }));
    setSettings({
      ...f,
      taxRate: (Number(f.taxPct) || 0) / 100,
      deliveryFee: Number(f.deliveryFee) || 0,
      tableCount: Math.max(1, Math.min(60, Number(f.tableCount) || 10)),
      paymentMethods: paymentMethods.length ? paymentMethods : DEFAULT_SETTINGS.paymentMethods,
    });
    setSaved(true);
  }

  const fields = [
    ["name", "Restaurant name"], ["tagline", "Tagline"], ["intro", "Short intro"],
    ["address", "Address"], ["phone", "Phone"], ["email", "Email"], ["hours", "Opening hours"],
    ["mapUrl", "Google Maps URL"], ["facebook", "Facebook URL"], ["instagram", "Instagram URL"],
    ["siteUrl", "Public site URL (used in table & order QR codes)"],
  ];

  return (
    <div style={{ maxWidth: 560 }}>
      {fields.map(([k, label]) => (
        <div key={k}>
          <p style={L}>{label}</p>
          {k === "intro" ? (
            <textarea rows={2} value={f[k]} onChange={(e) => set(k, e.target.value)} style={{ ...adminInput, resize: "none" }} />
          ) : (
            <input value={f[k]} onChange={(e) => set(k, e.target.value)} style={adminInput} />
          )}
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        <div><p style={L}>Tax rate (%)</p><input type="number" step="0.1" value={f.taxPct} onChange={(e) => set("taxPct", e.target.value)} style={adminInput} /></div>
        <div><p style={L}>Delivery fee ($)</p><input type="number" step="0.01" value={f.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} style={adminInput} /></div>
        <div><p style={L}>Currency</p><input value={f.currency} onChange={(e) => set("currency", e.target.value)} style={adminInput} /></div>
        <div><p style={L}>Tables (QR codes)</p><input type="number" value={f.tableCount ?? 10} onChange={(e) => set("tableCount", e.target.value)} style={adminInput} /></div>
      </div>
      <PaymentMethodsEditor value={f.paymentMethods} onChange={(v) => set("paymentMethods", v)} />

      <button className="sn-btn" onClick={save} style={{ marginTop: 20, background: saved ? "var(--herb)" : "var(--wine)", color: "#fff", borderRadius: 9, padding: "11px 22px", fontSize: 13, fontWeight: 700 }}>
        {saved ? "Saved ✓" : "Save settings"}
      </button>

      <div style={{ ...cardStyle, marginTop: 26, border: dbReady ? cardStyle.border : "1px solid var(--gold)" }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, margin: "0 0 4px", color: "var(--gold-soft)" }}>Database {dbReady ? "" : "— action needed"}</p>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>
          {dbReady
            ? "The menu is loaded and saving to Supabase. Re-run this only to backfill built-in items you deleted; existing rows (including photos you've changed) are never overwritten."
            : "The app is showing the built-in menu. Load it into Supabase to start editing and saving. Existing rows are kept — safe to run again."}
        </p>
        <button className="sn-btn" onClick={runSeed} disabled={seedState === "busy"} style={{ marginTop: 12, background: seedState === "done" ? "var(--herb)" : dbReady ? "var(--charcoal-3)" : "var(--wine)", color: "#fff", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 9, padding: "10px 18px", fontSize: 12.5, fontWeight: 700 }}>
          {seedState === "busy" ? "Initializing…" : seedState === "done" ? "Database initialized ✓" : dbReady ? "Backfill built-in menu" : "Initialize database"}
        </button>
        {seedState === "error" && <p style={{ fontSize: 11.5, color: "#F0A5A8", margin: "8px 0 0" }}>{seedErr}</p>}
      </div>
    </div>
  );
}

function ContentSection({ title, children }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 14 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, margin: "0 0 8px", color: "var(--gold-soft)" }}>{title}</p>
      {children}
    </div>
  );
}

function ContentTab({ content, setContent, menuItems }) {
  const [f, setF] = useState({ ...DEFAULT_CONTENT, ...content, highlights: (content.highlights || []).map((h) => ({ ...h })), reviews: (content.reviews || []).map((r) => ({ ...r })), popularPickIds: [...(content.popularPickIds || [])] });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setSaved(false); };
  const L = { fontSize: 11, color: "rgba(255,255,255,0.55)", margin: "10px 0 4px", fontWeight: 600 };
  const en = T.en;

  const setList = (key, i, patch) => set(key, f[key].map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const addTo = (key, blank) => set(key, [...f[key], blank]);
  const removeFrom = (key, i) => set(key, f[key].filter((_, j) => j !== i));

  const pickable = menuItems;
  const togglePop = (id) => set("popularPickIds", f.popularPickIds.includes(id) ? f.popularPickIds.filter((x) => x !== id) : [...f.popularPickIds, id]);

  function save() {
    setContent({
      ...f,
      promoDiscountPct: Number(f.promoDiscountPct) || 0,
      promoCode: (f.promoCode || "").trim(),
      reviews: f.reviews.map((r) => ({ ...r, rating: Math.max(1, Math.min(5, Number(r.rating) || 5)) })),
    });
    setSaved(true);
  }

  const txt = (k, ph, area) => area
    ? <textarea rows={2} value={f[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} style={{ ...adminInput, resize: "none" }} />
    : <input value={f[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} style={adminInput} />;

  return (
    <div style={{ maxWidth: 620 }}>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>
        Everything guests see on the Home and About pages. Leave a text box blank to use the built-in translated default.
      </p>

      <ContentSection title="Homepage">
        <p style={L}>Hero intro</p>{txt("heroIntro", en.heroIntro, true)}
        <p style={L}>Rating headline</p>{txt("ratingHeadline", DEFAULT_CONTENT.ratingHeadline)}
        <p style={L}>Feature band — title</p>{txt("featureBandTitle", en.featureBandTitle)}
        <p style={L}>Feature band — text</p>{txt("featureBandText", en.featureBandText, true)}
      </ContentSection>

      <ContentSection title="About page">
        {[["storyTitle", "story"], ["conceptTitle", "concept"], ["freshTitle", "fresh"], ["prepTitle", "prep"], ["philosophyTitle", "philosophy"]].map(([tk, bk]) => (
          <div key={tk}>
            <p style={L}>Section title</p>{txt(tk, en[tk])}
            <p style={L}>Section text</p>{txt(bk, en[bk], true)}
          </div>
        ))}
      </ContentSection>

      <ContentSection title="Highlights (“Why guests love us”)">
        {f.highlights.map((h, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={h.icon} onChange={(e) => setList("highlights", i, { icon: e.target.value })} style={{ ...adminInput, width: 54, textAlign: "center", fontSize: 18 }} />
            <input value={h.text || ""} onChange={(e) => setList("highlights", i, { text: e.target.value })} style={adminInput} />
            <button className="sn-btn" onClick={() => removeFrom("highlights", i)} style={{ background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 8, padding: "0 10px" }}><Trash2 size={13} /></button>
          </div>
        ))}
        <button className="sn-btn" onClick={() => addTo("highlights", { icon: "✨", text: "" })} style={{ fontSize: 11.5, fontWeight: 700, background: "var(--charcoal-3)", color: "rgba(255,255,255,0.75)", borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 5 }}><Plus size={13} /> Add highlight</button>
      </ContentSection>

      <ContentSection title="Testimonials">
        {f.reviews.map((r, i) => (
          <div key={i} style={{ borderTop: i ? "1px solid rgba(255,255,255,0.08)" : "none", paddingTop: i ? 10 : 0, marginTop: i ? 10 : 0 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={r.name} placeholder="Name" onChange={(e) => setList("reviews", i, { name: e.target.value })} style={adminInput} />
              <input value={r.city} placeholder="Area" onChange={(e) => setList("reviews", i, { city: e.target.value })} style={adminInput} />
              <input type="number" min="1" max="5" value={r.rating} onChange={(e) => setList("reviews", i, { rating: e.target.value })} style={{ ...adminInput, width: 60 }} />
              <button className="sn-btn" onClick={() => removeFrom("reviews", i)} style={{ background: "var(--charcoal-3)", color: "#F0A5A8", borderRadius: 8, padding: "0 10px" }}><Trash2 size={13} /></button>
            </div>
            <textarea rows={2} value={r.text} placeholder="Quote" onChange={(e) => setList("reviews", i, { text: e.target.value })} style={{ ...adminInput, resize: "none", marginTop: 6 }} />
          </div>
        ))}
        <button className="sn-btn" onClick={() => addTo("reviews", { name: "", city: "", rating: 5, text: "" })} style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, background: "var(--charcoal-3)", color: "rgba(255,255,255,0.75)", borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 5 }}><Plus size={13} /> Add testimonial</button>
      </ContentSection>

      <ContentSection title="Ordering">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><p style={L}>Promo code</p><input value={f.promoCode} onChange={(e) => set("promoCode", e.target.value)} style={adminInput} /></div>
          <div><p style={L}>Discount (%)</p><input type="number" value={f.promoDiscountPct} onChange={(e) => set("promoDiscountPct", e.target.value)} style={adminInput} /></div>
        </div>
        <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }}>Leave the code blank to disable promo codes.</p>
      </ContentSection>

      <ContentSection title="“Guest Favourites” carousel">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {pickable.map((m) => (
            <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, padding: "4px 0" }}>
              <input type="checkbox" checked={f.popularPickIds.includes(m.id)} onChange={() => togglePop(m.id)} style={{ accentColor: "#D6482E" }} />
              <span>{m.icon} {m.en}</span>
            </label>
          ))}
        </div>
      </ContentSection>

      <button className="sn-btn" onClick={save} style={{ background: saved ? "var(--herb)" : "var(--wine)", color: "#fff", borderRadius: 9, padding: "12px 24px", fontSize: 13, fontWeight: 700 }}>
        {saved ? "Saved ✓" : "Save content"}
      </button>
    </div>
  );
}

