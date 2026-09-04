import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, ShoppingCart, X, Plus, Minus, Leaf, Flame, ChevronLeft,
  Clock, Check, Bell, QrCode, LayoutGrid, ClipboardList, Table2,
  Utensils, Star, CircleDot, Printer, ChevronRight, Globe, Ban,
  Heart, ChevronDown, ArrowUpDown, Sparkles, MapPin, Phone, Clock3
} from "lucide-react";

/* ---------------------------------------------------------- languages */

const LANGS = [
  { code: "en", label: "English" },
  { code: "mm", label: "မြန်မာ" },
  { code: "es", label: "Español" },
  { code: "th", label: "ไทย" },
  { code: "zh", label: "中文" },
];
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// localized name: obj[lang] with English fallback
const tr = (obj, lang) => (obj && (obj[lang] || obj.en)) || "";
// localized description: obj["desc" + Lang] with English fallback
const trd = (obj, lang) => (obj && (obj["desc" + capFirst(lang)] || obj.descEn)) || "";

/* ---------------------------------------------------------------- data */

const CATS = [
  { id: "Soups", en: "Soups", mm: "ဟင်းချို", es: "Sopas", th: "ซุป", zh: "汤类", icon: "🍲" },
  { id: "Curry & Main Dishes", en: "Curry & Main Dishes", mm: "ဟင်းလျာများ", es: "Curris y platos principales", th: "แกงและอาหารจานหลัก", zh: "咖喱与主食", icon: "🍛" },
  { id: "Fried Foods", en: "Fried Foods", mm: "အကြော်များ", es: "Frituras", th: "ของทอด", zh: "炸物", icon: "🍤" },
  { id: "Fried Rice", en: "Fried Rice", mm: "ထမင်းကြော်", es: "Arroz frito", th: "ข้าวผัด", zh: "炒饭", icon: "🍚" },
  { id: "Rice Dishes", en: "Steamed Rice & Rice Dishes", mm: "ထမင်းနှင့် ထမင်းဟင်း", es: "Arroz y platos de arroz", th: "ข้าวและอาหารจานข้าว", zh: "米饭主食", icon: "🍱" },
  { id: "Noodles", en: "Noodles", mm: "ခေါက်ဆွဲ / မုန့်ဖတ်", es: "Fideos", th: "ก๋วยเตี๋ยว", zh: "面食", icon: "🍜" },
  { id: "Salads", en: "Salads", mm: "အသုပ်များ", es: "Ensaladas", th: "ยำและสลัด", zh: "沙拉", icon: "🥗" },
  { id: "Snacks & Street Food", en: "Snacks & Street Food", mm: "မုန့်နှင့် အဆာပြေ", es: "Aperitivos y comida callejera", th: "ของว่างและสตรีทฟู้ด", zh: "小吃与街食", icon: "🥟" },
  { id: "Desserts", en: "Desserts", mm: "အချိုပွဲများ", es: "Postres", th: "ของหวาน", zh: "甜点", icon: "🍮" },
  { id: "Drinks", en: "Drinks", mm: "အဖျော်ယမကာများ", es: "Bebidas", th: "เครื่องดื่ม", zh: "饮料", icon: "🥤" },
];

const ADDON_EXTRA_RICE = { en: "Extra rice", mm: "ထမင်းထပ်", es: "Arroz extra", th: "เพิ่มข้าว", zh: "加饭", price: 500 };
const ADDON_BOILED_EGG = { en: "Boiled egg", mm: "ကြက်ဥပြုတ်", es: "Huevo cocido", th: "ไข่ต้ม", zh: "加水煮蛋", price: 500 };
const ADDON_FRIED_SHALLOTS = { en: "Crispy shallots", mm: "ကြက်သွန်ကြော်", es: "Chalota crujiente", th: "หอมเจียว", zh: "酪葱酥", price: 300 };

const MENU_ITEMS = [
  { id: "d1", en: "Mohinga", mm: "မုန့်ဟင်းခါး", category: "Soups", price: 3000, icon: "🍜", descEn: "Traditional rice-noodle and fish soup with lemongrass and crispy fritters.", descMm: "ဆန်ခေါက်ဆွဲနှင့် ငါးဟင်းရည်ချို", rating: 4.9, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, es: "Mohinga", th: "โมฮิงก้า", zh: "缅式鱼汤米线", spiceLevels: true, addons: [ADDON_FRIED_SHALLOTS, ADDON_BOILED_EGG] },
  { id: "d2", en: "Shan Tofu Soup", mm: "ရှမ်းတို့ဖူးနွေး", category: "Soups", price: 2500, icon: "🥣", descEn: "Warm Shan chickpea-tofu soup, silky and comforting.", descMm: "ရှမ်းတို့ဖူး နွေးနွေးထွေးထွေး", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d3", en: "Chicken Soup", mm: "ကြက်သားဟင်းချို", category: "Soups", price: 2800, icon: "🍲", descEn: "Clear chicken broth simmered with herbs and vegetables.", descMm: "ကြက်သား ဟင်းရည်ကြည်ချို", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d4", en: "Pork Soup", mm: "ဝက်သားဟင်းချို", category: "Soups", price: 2800, icon: "🍲", descEn: "Light pork broth with radish and coriander.", descMm: "ဝက်သား မုန်လာဥ ဟင်းချို", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d5", en: "Fish Soup", mm: "ငါးဟင်းချို", category: "Soups", price: 3000, icon: "🐟", descEn: "Delicate river-fish soup with tomato and roselle leaves.", descMm: "ငါး ခရမ်းချဉ် ချဉ်ပေါင် ဟင်းချို", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d6", en: "Vegetable Soup", mm: "ဟင်းသီးဟင်းရွက်ဟင်းချို", category: "Soups", price: 2200, icon: "🥬", descEn: "Seasonal mixed vegetables in a clear, gentle broth.", descMm: "ရာသီ ဟင်းသီးဟင်းရွက် ဟင်းချို", rating: 4.3, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d7", en: "Sour Leaf Soup", mm: "ချဉ်ပေါင်ဟင်းချို", category: "Soups", price: 2400, icon: "🌿", descEn: "Tangy roselle-leaf soup with dried shrimp.", descMm: "ချဉ်ပေါင်ရွက် ပုစွန်ခြောက် ဟင်းချို", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d8", en: "Burmese Chicken Curry", mm: "မြန်မာကြက်သားဟင်း", category: "Curry & Main Dishes", price: 4500, icon: "🍗", descEn: "Slow-cooked chicken in onion, turmeric and Burmese spices.", descMm: "ကြက်သားဟင်း၊ ဆီပြန်", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: true, es: "Curry de pollo birmano", th: "แกงไก่พม่า", zh: "缅式鸡肉咖喱", spiceLevels: true, addons: [ADDON_EXTRA_RICE, ADDON_BOILED_EGG] },
  { id: "d9", en: "Pork Curry", mm: "ဝက်သားဟင်း", category: "Curry & Main Dishes", price: 4700, icon: "🍖", descEn: "Rich, slow-braised pork curry, deeply savoury.", descMm: "ဝက်သားဟင်း ဆီပြန်", rating: 4.7, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, es: "Curry de cerdo", th: "แกงหมู", zh: "猪肉咖喱", addons: [ADDON_EXTRA_RICE] },
  { id: "d10", en: "Beef Curry", mm: "အမဲသားဟင်း", category: "Curry & Main Dishes", price: 5200, icon: "🥩", descEn: "Tender beef simmered in a dark, aromatic curry.", descMm: "အမဲသားဟင်း အနှစ်", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, es: "Curry de ternera", th: "แกงเนื้อ", zh: "牛肉咖喱", addons: [ADDON_EXTRA_RICE] },
  { id: "d11", en: "Fish Curry", mm: "ငါးဟင်း", category: "Curry & Main Dishes", price: 4800, icon: "🐟", descEn: "River fish in a light turmeric-garlic curry.", descMm: "ငါးဟင်း နနွင်း ကြက်သွန်ဖြူ", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false, es: "Curry de pescado", th: "แกงปลา", zh: "鱼肉咖喱" },
  { id: "d12", en: "Mutton Curry", mm: "ဆိတ်သားဟင်း", category: "Curry & Main Dishes", price: 6000, icon: "🍲", descEn: "Fragrant goat curry, slow-cooked until falling apart.", descMm: "ဆိတ်သားဟင်း အမွှေးအကြိုင်", rating: 4.7, popular: false, recommended: true, isNew: false, available: true, veg: false, spicy: true, spiceLevels: true },
  { id: "d13", en: "Pork Belly Curry", mm: "ဝက်သားသုံးထပ်သားဟင်း", category: "Curry & Main Dishes", price: 5500, icon: "🥓", descEn: "Melting three-layer pork belly in a caramelised curry.", descMm: "ဝက်သားသုံးထပ်သား ဆီပြန်ဟင်း", rating: 4.8, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, addons: [ADDON_EXTRA_RICE] },
  { id: "d14", en: "Fish Potato Curry", mm: "ငါးအာလူးဟင်း", category: "Curry & Main Dishes", price: 4600, icon: "🥔", descEn: "Fish and potato stewed together in a mild curry.", descMm: "ငါးနှင့် အာလူး ဟင်းချက်", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d15", en: "Tomato Fish Curry", mm: "ခရမ်းချဉ်သီးငါးဟင်း", category: "Curry & Main Dishes", price: 4700, icon: "🍅", descEn: "Fish simmered with fresh tomato and onion.", descMm: "ခရမ်းချဉ်သီးနှင့် ငါးဟင်း", rating: 4.5, popular: false, recommended: false, isNew: true, available: true, veg: false, spicy: false },
  { id: "d16", en: "Burmese Fried Chicken", mm: "မြန်မာကြက်ကြော်", category: "Fried Foods", price: 4000, icon: "🍗", descEn: "Crisp turmeric-marinated fried chicken.", descMm: "နနွင်းနယ် ကြက်ကြော် ကြွပ်ကြွပ်", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, spiceLevels: true },
  { id: "d17", en: "Fried Fish", mm: "ငါးကြော်", category: "Fried Foods", price: 4200, icon: "🐟", descEn: "Whole fish fried until golden and crisp.", descMm: "ငါးအကြီး ကြွပ်ကြွပ်ကြော်", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d18", en: "Fried Prawns", mm: "ပုစွန်ကြော်", category: "Fried Foods", price: 5000, icon: "🦐", descEn: "Batter-fried prawns with a garlic-chili dip.", descMm: "ပုစွန် ဂရမ်ကြော် ချဉ်စပ်", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: true },
  { id: "d19", en: "Fried Tofu", mm: "တို့ဖူးကြော်", category: "Fried Foods", price: 2200, icon: "🧈", descEn: "Golden Shan tofu fritters with tamarind dip.", descMm: "ရှမ်းတို့ဖူးကြော် မန်ကျည်းရည်", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d20", en: "Vegetable Fritters", mm: "ဟင်းသီးဟင်းရွက်အကြော်", category: "Fried Foods", price: 2000, icon: "🥦", descEn: "Assorted seasonal vegetables in a light, crisp batter.", descMm: "ရာသီ ဟင်းသီးဟင်းရွက် အကြော်", rating: 4.3, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d21", en: "Akyaw (Mixed Fritters)", mm: "အကြော်စုံ", category: "Fried Foods", price: 2500, icon: "🧅", descEn: "A mixed platter of Burmese fritters, hot and crunchy.", descMm: "အကြော်စုံ ပူပူနွေးနွေး", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d22", en: "Fried Eggplant", mm: "ခရမ်းသီးကြော်", category: "Fried Foods", price: 2000, icon: "🍆", descEn: "Soft fried eggplant with a savoury bean dip.", descMm: "ခရမ်းသီးကြော် ပဲငံပြာရည်", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d23", en: "Fried Bitter Melon", mm: "ကြက်ဟင်းခါးသီးကြော်", category: "Fried Foods", price: 2000, icon: "🥒", descEn: "Crisp bitter-melon rings, lightly battered.", descMm: "ကြက်ဟင်းခါးသီး အကြော်", rating: 4.2, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d24", en: "Burmese Fried Rice", mm: "မြန်မာထမင်းကြော်", category: "Fried Rice", price: 3000, icon: "🍚", descEn: "Wok-fried rice with egg, onion and soy.", descMm: "ကြက်ဥ ကြက်သွန် ထမင်းကြော်", rating: 4.5, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d25", en: "Chicken Fried Rice", mm: "ကြက်သားထမင်းကြော်", category: "Fried Rice", price: 3500, icon: "🍗", descEn: "Fried rice tossed with chicken and spring onion.", descMm: "ကြက်သား ထမင်းကြော်", rating: 4.6, popular: false, recommended: true, isNew: false, available: true, veg: false, spicy: false },
  { id: "d26", en: "Pork Fried Rice", mm: "ဝက်သားထမင်းကြော်", category: "Fried Rice", price: 3500, icon: "🍖", descEn: "Fried rice with tender pork and garlic.", descMm: "ဝက်သား ကြက်သွန်ဖြူ ထမင်းကြော်", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d27", en: "Beef Fried Rice", mm: "အမဲသားထမင်းကြော်", category: "Fried Rice", price: 4000, icon: "🥩", descEn: "Smoky wok-fried rice with sliced beef.", descMm: "အမဲသားလွှာ ထမင်းကြော်", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d28", en: "Seafood Fried Rice", mm: "ပင်လယ်စာထမင်းကြော်", category: "Fried Rice", price: 4500, icon: "🦐", descEn: "Fried rice with prawns, squid and fish.", descMm: "ပုစွန်၊ ကင်းမွန်၊ ငါး ထမင်းကြော်", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d29", en: "Egg Fried Rice", mm: "ကြက်ဥထမင်းကြော်", category: "Fried Rice", price: 2500, icon: "🥚", descEn: "Simple, fragrant egg fried rice.", descMm: "ကြက်ဥ ထမင်းကြော် ရိုးရိုး", rating: 4.3, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d30", en: "Vegetable Fried Rice", mm: "ဟင်းသီးဟင်းရွက်ထမင်းကြော်", category: "Fried Rice", price: 2800, icon: "🥕", descEn: "Fried rice with mixed garden vegetables.", descMm: "ဟင်းသီးဟင်းရွက် ထမင်းကြော်", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d31", en: "Steamed Rice", mm: "ထမင်းဖြူ", category: "Rice Dishes", price: 800, icon: "🍚", descEn: "Freshly steamed jasmine rice.", descMm: "ထမင်းဖြူ လတ်လတ်ဆတ်ဆတ်", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d32", en: "Shan Rice", mm: "ရှမ်းထမင်း", category: "Rice Dishes", price: 3500, icon: "🍛", descEn: "Turmeric rice with fish, garlic oil and spring onion.", descMm: "ရှမ်းထမင်း ငါး ကြက်သွန်ဖြူဆီ", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false },
  { id: "d33", en: "Fish Rice", mm: "ငါးထမင်း", category: "Rice Dishes", price: 3800, icon: "🐟", descEn: "Rice cooked with flaked fish and herbs.", descMm: "ငါးသားနှင့် ချက်ထားသော ထမင်း", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d34", en: "Chicken Rice", mm: "ကြက်သားထမင်း", category: "Rice Dishes", price: 3800, icon: "🍗", descEn: "Poached chicken over seasoned rice with broth.", descMm: "ကြက်သားပြုတ် ဆီထမင်း ဟင်းရည်", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d35", en: "Coconut Rice", mm: "အုန်းထမင်း", category: "Rice Dishes", price: 2000, icon: "🥥", descEn: "Rice steamed in coconut milk, mildly sweet.", descMm: "အုန်းနို့ဖြင့် ပေါင်းထားသော ထမင်း", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d36", en: "Sticky Rice", mm: "ကောက်ညှင်းထမင်း", category: "Rice Dishes", price: 1500, icon: "🍙", descEn: "Steamed glutinous rice, a hearty staple.", descMm: "ကောက်ညှင်းထမင်း ပေါင်း", rating: 4.3, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d37", en: "Rice with Burmese Curry", mm: "ထမင်းနှင့် မြန်မာဟင်း", category: "Rice Dishes", price: 4500, icon: "🍛", descEn: "Steamed rice with your choice of Burmese curry and sides.", descMm: "ထမင်းနှင့် မြန်မာဟင်း၊ အသုပ်၊ ဟင်းချို", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false },
  { id: "d38", en: "Shan Noodles", mm: "ရှမ်းခေါက်ဆွဲ", category: "Noodles", price: 3800, icon: "🍝", descEn: "Rice noodles with marinated pork, pickled greens and peanut oil.", descMm: "ရှမ်းခေါက်ဆွဲ ဝက်သားနှင့်", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: true, es: "Fideos Shan", th: "ก๋วยเตี๋ยวชาน", zh: "掸邦米线", spiceLevels: true },
  { id: "d39", en: "Nan Gyi Thoke", mm: "နန်းကြီးသုပ်", category: "Noodles", price: 3500, icon: "🥘", descEn: "Thick rice noodles tossed with chicken curry and chickpea flour.", descMm: "နန်းကြီးသုပ် ကြက်သားဟင်း", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, es: "Nan Gyi Thoke", th: "นานจีโต๊ะ", zh: "粗米线沙拉" },
  { id: "d40", en: "Coconut Noodles", mm: "အုန်းနို့ခေါက်ဆွဲ", category: "Noodles", price: 4000, icon: "🍛", descEn: "Coconut chicken noodle soup, a Mandalay favourite.", descMm: "အုန်းနို့ခေါက်ဆွဲ ကြက်သား", rating: 4.7, popular: false, recommended: true, isNew: false, available: true, veg: false, spicy: false, es: "Ohn No Khao Swe", th: "อองโนเข้าซแว", zh: "椰浆鸡肉面", sizes: [{ name: "Regular", delta: 0 }, { name: "Large", delta: 800 }] },
  { id: "d41", en: "Ohn No Khao Swe", mm: "အွန်နိုခေါက်ဆွဲ", category: "Noodles", price: 4000, icon: "🍜", descEn: "Silky coconut broth over wheat noodles with chicken and crispy toppings.", descMm: "အုန်းနို့ရည်ဖြင့် ခေါက်ဆွဲ", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: false, spicy: false },
  { id: "d42", en: "Kyay Oh", mm: "ကြေးအိုး", category: "Noodles", price: 4200, icon: "🍲", descEn: "Hotpot-style noodle soup with pork, egg and meatballs.", descMm: "ကြေးအိုး ဝက်သား ကြက်ဥ လုံးတီး", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: false, spicy: false, sizes: [{ name: "Regular", delta: 0 }, { name: "Special", delta: 1000 }] },
  { id: "d43", en: "Khauk Swe Thoke", mm: "ခေါက်ဆွဲသုပ်", category: "Noodles", price: 3000, icon: "🥗", descEn: "Cold noodle salad with chickpea flour, lime and chili.", descMm: "ခေါက်ဆွဲသုပ် ပဲမှုန့် သံပုရာ", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: true },
  { id: "d44", en: "Tea Leaf Salad (Lahpet Thoke)", mm: "လက်ဖက်သုပ်", category: "Salads", price: 3200, icon: "🍵", descEn: "Fermented tea leaves with crunchy nuts, beans and lime.", descMm: "လက်ဖက်သုပ် အခြောက်စုံ သံပုရာ", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: false, spicy: false, es: "Laphet Thoke", th: "ละเพ็ตโต๊ะ", zh: "腌茶叶沙拉" },
  { id: "d45", en: "Ginger Salad", mm: "ဂျင်းသုပ်", category: "Salads", price: 2800, icon: "🫚", descEn: "Shredded pickled ginger with sesame, nuts and beans.", descMm: "ဂျင်းသုပ် နှမ်း အခြောက်စုံ", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d46", en: "Tomato Salad", mm: "ခရမ်းချဉ်သီးသုပ်", category: "Salads", price: 2500, icon: "🍅", descEn: "Ripe tomato with crispy shallots, peanuts and lime.", descMm: "ခရမ်းချဉ်သီးသုပ် ကြက်သွန်ကြော်", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d47", en: "Avocado Salad", mm: "ထောပတ်သီးသုပ်", category: "Salads", price: 3200, icon: "🥑", descEn: "Creamy avocado tossed with onion, chili and lime.", descMm: "ထောပတ်သီးသုပ် ကြက်သွန် ငရုတ်", rating: 4.6, popular: false, recommended: true, isNew: true, available: true, veg: true, spicy: false },
  { id: "d48", en: "Egg Salad", mm: "ကြက်ဥသုပ်", category: "Salads", price: 2400, icon: "🥚", descEn: "Boiled egg salad with fried onion and chili oil.", descMm: "ကြက်ဥသုပ် ကြက်သွန်ကြော် ငရုတ်ဆီ", rating: 4.3, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d49", en: "Tofu Salad", mm: "တို့ဖူးသုပ်", category: "Salads", price: 2600, icon: "🧈", descEn: "Shan tofu with chili oil, garlic and crushed peanuts.", descMm: "ရှမ်းတို့ဖူးသုပ် ငရုတ်ဆီ မြေပဲ", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: true, es: "Ensalada de tofu Shan", th: "ยำเต้าหู้ชาน", zh: "掸邦豆腐沙拉" },
  { id: "d50", en: "Noodle Salad", mm: "ခေါက်ဆွဲသုပ်", category: "Salads", price: 2800, icon: "🍜", descEn: "Rice noodles tossed with herbs, lime and roasted chili.", descMm: "ခေါက်ဆွဲသုပ် ဟင်းနုနွယ် သံပုရာ", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d51", en: "Pennywort Salad", mm: "မြင်းခွာရွက်သုပ်", category: "Salads", price: 2800, icon: "🌿", descEn: "Fresh pennywort leaves with toasted rice powder and lime.", descMm: "မြင်းခွာရွက်သုပ် ဆန်ကြော်မှုန့်", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d52", en: "Samosa", mm: "ဆာမူဆာ", category: "Snacks & Street Food", price: 1500, icon: "🥟", descEn: "Crisp pastry filled with spiced potato, served with soup dip.", descMm: "အာလူးနယ် ဆာမူဆာ ဟင်းရည်", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false, es: "Samosa", th: "ซามูซา", zh: "咖喱角" },
  { id: "d53", en: "Spring Rolls", mm: "ကော်ပြန့်", category: "Snacks & Street Food", price: 1800, icon: "🌯", descEn: "Golden fried rolls with vegetable and glass-noodle filling.", descMm: "ကော်ပြန့်ကြော် ဟင်းသီးဟင်းရွက်", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d54", en: "Burmese Gourd Fritter", mm: "ဘူးသီးကြော်", category: "Snacks & Street Food", price: 1600, icon: "🥞", descEn: "Bottle-gourd fritters in a savoury rice batter.", descMm: "ဘူးသီးကြော် ဆန်မှုန့်", rating: 4.3, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d55", en: "Mont Lin Ma Yar", mm: "မုန့်လင်မယား", category: "Snacks & Street Food", price: 1800, icon: "🍡", descEn: "Husband-and-wife rice-batter cakes with a quail egg centre.", descMm: "မုန့်လင်မယား ငုံးဥ", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false, es: "Mont Lin Ma Yar", th: "มงลินมะยา", zh: "夫妻糕" },
  { id: "d56", en: "Mont Pyar Tha Let", mm: "မုန့်ပျားသလက်", category: "Snacks & Street Food", price: 1600, icon: "🥮", descEn: "Steamed sticky rice cake with jaggery and coconut.", descMm: "မုန့်ပျားသလက် ထန်းလျက် အုန်း", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d57", en: "Pe Byouk", mm: "ပဲပြုတ်", category: "Snacks & Street Food", price: 1200, icon: "🫘", descEn: "Boiled buttered peas, a classic breakfast snack.", descMm: "ပဲပြုတ် ထောပတ်", rating: 4.2, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d58", en: "Fried Dough (Mont Kyaw)", mm: "မုန့်ကြော်", category: "Snacks & Street Food", price: 1000, icon: "🍩", descEn: "Crunchy sweet fried dough, best with tea.", descMm: "မုန့်ကြော် ကြွပ်ကြွပ် ချိုချို", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d59", en: "Steamed Sticky Rice Cakes", mm: "ကောက်ညှင်းမုန့်", category: "Snacks & Street Food", price: 1400, icon: "🍙", descEn: "Banana-leaf-wrapped sticky rice with coconut.", descMm: "ငှက်ပျောရွက်ထုပ် ကောက်ညှင်းမုန့်", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d60", en: "Shwe Yin Aye", mm: "ရွှေရင်အေး", category: "Desserts", price: 2500, icon: "🍧", descEn: "Chilled coconut-milk dessert with sago, bread and jelly.", descMm: "ရွှေရင်အေး အုန်းနို့ သာကူ ကျောက်ကျော", rating: 4.8, popular: true, recommended: true, isNew: false, available: true, veg: true, spicy: false },
  { id: "d61", en: "Mont Lone Yay Paw", mm: "မုန့်လုံးရေပေါ်", category: "Desserts", price: 1800, icon: "🍡", descEn: "Floating glutinous rice balls with a jaggery centre.", descMm: "မုန့်လုံးရေပေါ် ထန်းလျက်အနှစ်", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d62", en: "Banana Sticky Rice", mm: "ငှက်ပျောကောက်ညှင်း", category: "Desserts", price: 2000, icon: "🍌", descEn: "Sticky rice steamed with banana and coconut.", descMm: "ငှက်ပျောသီးနှင့် ကောက်ညှင်းပေါင်း", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d63", en: "Coconut Jelly", mm: "အုန်းနို့ကျောက်ကျော", category: "Desserts", price: 1800, icon: "🥥", descEn: "Silky agar jelly set in coconut milk.", descMm: "အုန်းနို့ ကျောက်ကျော ချောချော", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d64", en: "Sticky Rice with Coconut", mm: "အုန်းသီးကောက်ညှင်း", category: "Desserts", price: 1800, icon: "🍚", descEn: "Warm glutinous rice with fresh grated coconut and sugar.", descMm: "ကောက်ညှင်းပေါင်း အုန်းသီးခြစ် သကြား", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d65", en: "Burmese Semolina Cake", mm: "ဆီထမင်းမုန့်", category: "Desserts", price: 2000, icon: "🍰", descEn: "Dense semolina-coconut cake with poppy seeds.", descMm: "ဆီထမင်းမုန့် အုန်းနှင့် ဘိန်းစေ့", rating: 4.7, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false, es: "Pastel de sémola", th: "เค้กเซโมลินา", zh: "粗面椰香糕" },
  { id: "d66", en: "Burmese Milk Tea", mm: "လက်ဖက်ရည်", category: "Drinks", price: 1500, icon: "🧋", descEn: "Strong black tea with condensed and evaporated milk.", descMm: "လက်ဖက်ရည် နို့ဆီ နို့ဆီပြင်း", rating: 4.7, popular: true, recommended: true, isNew: false, available: true, veg: true, spicy: false, es: "Té con leche birmano", th: "ชานมพม่า", zh: "缅式奶茶", sizes: [{ name: "Regular", delta: 0 }, { name: "Large", delta: 300 }] },
  { id: "d67", en: "Green Tea", mm: "လက်ဖက်ရည်ကြမ်း", category: "Drinks", price: 500, icon: "🍵", descEn: "Free-flowing roasted green tea, lightly bitter.", descMm: "လက်ဖက်ရည်ကြမ်း အခမဲ့", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d68", en: "Lime Juice", mm: "သံပုရာဖျော်ရည်", category: "Drinks", price: 1200, icon: "🍋", descEn: "Fresh lime juice, sweet and sour.", descMm: "သံပုရာဖျော်ရည် ချိုချဉ်", rating: 4.5, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d69", en: "Sugarcane Juice", mm: "ကြံဖျော်ရည်", category: "Drinks", price: 1500, icon: "🥤", descEn: "Cold-pressed sugarcane juice with a squeeze of lime.", descMm: "ကြံဖျော်ရည် သံပုရာ", rating: 4.6, popular: true, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d70", en: "Tamarind Juice", mm: "မန်ကျည်းဖျော်ရည်", category: "Drinks", price: 1300, icon: "🟤", descEn: "Tangy-sweet tamarind cooler.", descMm: "မန်ကျည်းဖျော်ရည် ချိုချဉ်", rating: 4.4, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d71", en: "Coconut Juice", mm: "အုန်းရည်", category: "Drinks", price: 2000, icon: "🥥", descEn: "Chilled young coconut water, served in the shell.", descMm: "အုန်းရည် အအေး အုန်းအိုးထဲ", rating: 4.6, popular: false, recommended: false, isNew: false, available: true, veg: true, spicy: false },
  { id: "d72", en: "Avocado Smoothie", mm: "ထောပတ်သီးဖျော်ရည်", category: "Drinks", price: 2500, icon: "🥑", descEn: "Rich blended avocado with milk and a little sugar.", descMm: "ထောပတ်သီးဖျော်ရည် နို့ သကြား", rating: 4.7, popular: true, recommended: false, isNew: true, available: true, veg: true, spicy: false },
];

const STAFF_STATUSES = ["New", "Confirmed", "Preparing", "Ready", "Served", "Completed"];
const CUSTOMER_STEPS = ["New", "Confirmed", "Preparing", "Ready", "Served"];
const CUSTOMER_STATUS_LABEL = {
  en: { New: "Order received", Confirmed: "Restaurant confirmed", Preparing: "Preparing your food", Ready: "Ready", Served: "Served" },
  mm: { New: "အော်ဒါလက်ခံပြီး", Confirmed: "စားသောက်ဆိုင်အတည်ပြုပြီး", Preparing: "ချက်ပြုတ်နေသည်", Ready: "အသင့်ဖြစ်ပါပြီ", Served: "ပြီးစီးပါပြီ" },
  es: { New: "Pedido recibido", Confirmed: "Restaurante confirmó", Preparing: "Preparando tu comida", Ready: "Listo", Served: "Servido" },
  th: { New: "รับออร์เดอร์แล้ว", Confirmed: "ร้านยืนยันแล้ว", Preparing: "กำลังทำอาหาร", Ready: "พร้อมเสิร์ฟ", Served: "เสิร์ฟแล้ว" },
  zh: { New: "已收到订单", Confirmed: "餐厅已确认", Preparing: "正在备餐", Ready: "已就绪", Served: "已上菜" },
};
const KITCHEN_ACTION_LABEL = { New: "Accept", Confirmed: "Start preparing", Preparing: "Mark ready", Ready: "Serve", Served: "Complete" };

const TABLES = Array.from({ length: 10 }, (_, i) => ({ number: String(i + 1).padStart(2, "0") }));

const T = {
  en: {
    search: "Search the menu", table: "Table", all: "All", popular: "Popular",
    popularSection: "Popular right now", fullMenu: "Full menu", noMatch: "No dishes match your search.",
    addToCart: "Add to cart", size: "Size", spiceLevel: "Spice level", addOns: "Add-ons",
    instructions: "Special instructions", instructionsPh: "e.g. no coriander, please",
    quantity: "Quantity", soldOut: "Sold out", yourOrder: "Your order", cartEmpty: "Your cart is empty.",
    clearCart: "Clear cart", subtotal: "Subtotal", service: "Service charge (5%)", total: "Total",
    continueCheckout: "Continue to checkout", checkout: "Checkout", orderType: "Order type",
    dineIn: "Dine-in", takeaway: "Takeaway", delivery: "Delivery", name: "Name (optional)",
    phone: "Phone (optional)", kitchenNote: "Note for the kitchen (optional)", payment: "Payment",
    placeOrder: "Place order", placing: "Placing order\u2026", orderPlaced: "Order placed",
    kitchenReceived: "The kitchen has received your order.", estimated: "Estimated", min: "min",
    trackOrder: "Track my order", backToMenu: "Back to menu", orderTracking: "Order tracking",
    autoUpdate: "This screen updates automatically \u2014 no need to refresh.", orderSomethingElse: "Order something else",
    items: "items", promo: "Promo code", apply: "Apply", applied: "Applied",
    promoInvalid: "That code isn't valid.", inProgress: "In progress",
    orderCancelled: "This order was cancelled.", orderCancelledHelp: "Please speak with a staff member if you have questions.",
    qrNote: "The restaurant's payment QR code will be shown at checkout.", selectLanguage: "Language",
    add: "Add", reviews: "reviews", heroTagline: "Authentic Burmese kitchen — soups, curries, salads & street food",
    recommendedSection: "Recommended for you", recommended: "Recommended",
    sortRecommended: "Recommended", sortPriceLow: "Price: low to high", sortPriceHigh: "Price: high to low", sortRating: "Top rated",
    favorites: "Favorites", favoritesEmpty: "No favorites yet — tap the heart on a dish to save it.",
    footerHours: "Open daily · 10:00–22:00", footerRights: "All rights reserved.",
  },
  mm: {
    search: "မီနူးရှာရန်", table: "စားပွဲ", all: "အားလုံး", popular: "လူကြိုက်များ",
    popularSection: "လူကြိုက်များသော", fullMenu: "မီနူးအပြည့်", noMatch: "ရှာဖွေမှုနှင့် ကိုက်ညီသော ဟင်းမရှိပါ။",
    addToCart: "ခြင်းထဲထည့်ရန်", size: "အရွယ်အစား", spiceLevel: "စပ်ဆလိုအဆင့်", addOns: "ထပ်ဆောင်းများ",
    instructions: "အထူးညွှန်ကြားချက်", instructionsPh: "ဥပမာ - နံနံပင်မထည့်ပါနှင့်",
    quantity: "အရေအတွက်", soldOut: "ကုန်သွားပါပြီ", yourOrder: "သင့်အော်ဒါ", cartEmpty: "ခြင်းထဲတွင် ဘာမျှမရှိပါ။",
    clearCart: "ခြင်းရှင်းရန်", subtotal: "စုစုပေါင်း", service: "ဝန်ဆောင်ခ (၅%)", total: "စုစုပေါင်းငွေ",
    continueCheckout: "ငွေရှင်းရန်ဆက်လုပ်ရန်", checkout: "ငွေရှင်းရန်", orderType: "အော်ဒါအမျိုးအစား",
    dineIn: "ဆိုင်တွင်စား", takeaway: "ယူသွားရန်", delivery: "ပို့ဆောင်ရန်", name: "အမည် (ရွေးချယ်ခွင့်)",
    phone: "ဖုန်းနံပါတ် (ရွေးချယ်ခွင့်)", kitchenNote: "မီးဖိုဆီးအတွက်မှတ်ချက် (ရွေးချယ်ခွင့်)", payment: "ငွေပေးချေမှု",
    placeOrder: "အော်ဒါတင်ရန်", placing: "အော်ဒါတင်နေသည်\u2026", orderPlaced: "အော်ဒါတင်ပြီးပါပြီ",
    kitchenReceived: "မီးဖိုဆီးမှ သင့်အော်ဒါကို လက်ခံရရှိပါပြီ။", estimated: "ခန့်မှန်းချိန်", min: "မိနစ်",
    trackOrder: "အော်ဒါခြေရာခံရန်", backToMenu: "မီနူးသို့ပြန်သွားရန်", orderTracking: "အော်ဒါခြေရာခံခြင်း",
    autoUpdate: "ဒီစာမျက်နှာသည် အလိုအလျောက်အပ်ဒိတ်ဖြစ်ပါသည်။", orderSomethingElse: "နောက်ထပ်မှာယူရန်",
    items: "မျိုး", promo: "ပရိုမိုကုတ်", apply: "သုံးမည်", applied: "သုံးပြီး",
    promoInvalid: "ကုတ်မှန်ကန်မှုမရှိပါ။", inProgress: "လုပ်ဆောင်နေဆဲ",
    orderCancelled: "ဒီအော်ဒါကို ပယ်ဖျက်လိုက်ပါသည်။", orderCancelledHelp: "မေးခွန်းရှိပါက ဝန်ထမ်းတစ်ဦးဦးအား ပြောပါ။",
    qrNote: "ဆိုင်၏ ငွေပေးချေမှု QR ကုဒ်ကို ငွေရှင်းချိန်တွင် ပြသပါမည်။", selectLanguage: "ဘာသာစကား",
    add: "ထည့်ရန်", reviews: "သုံးသပ်ချက်", heroTagline: "စစ်မှန်သော မြန်မာမီးဖိုချောင် — ဟင်းချို၊ ဟင်းလျာ၊ အသုပ်နှင့် လမ်းဘေးစား",
    recommendedSection: "သင့်အတွက် အကြံပြုချက်", recommended: "အကြံပြုထား",
    sortRecommended: "အကြံပြုထား", sortPriceLow: "ဈေးနှုန်း - နည်းမှများ", sortPriceHigh: "ဈေးနှုန်း - များမှနည်း", sortRating: "အဆင့်သတ်မှတ်ချက် အမြင့်ဆုံး",
    favorites: "အနှစ်သက်ဆုံး", favoritesEmpty: "အနှစ်သက်ဆုံး မရှိသေးပါ — ဟင်းတစ်ခုပေါ်ရှိ နှလုံးကို နှိပ်၍ သိမ်းဆည်းပါ။",
    footerHours: "နေ့စဉ်ဖွင့် · 10:00–22:00", footerRights: "မူပိုင်ခွင့်အားလုံး ရယူထားသည်။",
  },
  es: {
    search: "Buscar en el menú", table: "Mesa", all: "Todo", popular: "Popular",
    popularSection: "Popular ahora", fullMenu: "Menú completo", noMatch: "Ningún plato coincide con tu búsqueda.",
    addToCart: "Añadir al carrito", size: "Tamaño", spiceLevel: "Nivel de picante", addOns: "Extras",
    instructions: "Instrucciones especiales", instructionsPh: "p. ej. sin cilantro, por favor",
    quantity: "Cantidad", soldOut: "Agotado", yourOrder: "Tu pedido", cartEmpty: "Tu carrito está vacío.",
    clearCart: "Vaciar carrito", subtotal: "Subtotal", service: "Cargo por servicio (5%)", total: "Total",
    continueCheckout: "Continuar al pago", checkout: "Pago", orderType: "Tipo de pedido",
    dineIn: "Para comer aquí", takeaway: "Para llevar", delivery: "Entrega a domicilio", name: "Nombre (opcional)",
    phone: "Teléfono (opcional)", kitchenNote: "Nota para la cocina (opcional)", payment: "Pago",
    placeOrder: "Realizar pedido", placing: "Realizando pedido…", orderPlaced: "Pedido realizado",
    kitchenReceived: "La cocina ha recibido tu pedido.", estimated: "Estimado", min: "min",
    trackOrder: "Seguir mi pedido", backToMenu: "Volver al menú", orderTracking: "Seguimiento del pedido",
    autoUpdate: "Esta pantalla se actualiza automáticamente, no necesitas recargar.", orderSomethingElse: "Pedir algo más",
    items: "artículos", promo: "Código promocional", apply: "Aplicar", applied: "Aplicado",
    promoInvalid: "Ese código no es válido.", inProgress: "En curso",
    orderCancelled: "Este pedido fue cancelado.", orderCancelledHelp: "Habla con un miembro del personal si tienes preguntas.",
    qrNote: "El código QR de pago del restaurante se mostrará al finalizar la compra.", selectLanguage: "Idioma",
    add: "Añadir", reviews: "reseñas", heroTagline: "Auténtica cocina birmana — sopas, curris, ensaladas y comida callejera",
    recommendedSection: "Recomendado para ti", recommended: "Recomendado",
    sortRecommended: "Recomendado", sortPriceLow: "Precio: de menor a mayor", sortPriceHigh: "Precio: de mayor a menor", sortRating: "Mejor valorados",
    favorites: "Favoritos", favoritesEmpty: "Aún no hay favoritos: toca el corazón de un plato para guardarlo.",
    footerHours: "Abierto todos los días · 10:00–22:00", footerRights: "Todos los derechos reservados.",
  },
  th: {
    search: "ค้นหาเมนู", table: "โต๊ะ", all: "ทั้งหมด", popular: "ยอดนิยม",
    popularSection: "ยอดนิยมตอนนี้", fullMenu: "เมนูทั้งหมด", noMatch: "ไม่พบเมนูที่ตรงกับการค้นหา",
    addToCart: "ใส่ตะกร้า", size: "ขนาด", spiceLevel: "ระดับความเผ็ด", addOns: "เพิ่มเติม",
    instructions: "คำสั่งพิเศษ", instructionsPh: "เช่น ไม่ใส่ผักชี",
    quantity: "จำนวน", soldOut: "ของหมด", yourOrder: "ออร์เดอร์ของคุณ", cartEmpty: "ตะกร้าของคุณว่างเปล่า",
    clearCart: "ล้างตะกร้า", subtotal: "ยอดรวมย่อย", service: "ค่าบริการ (5%)", total: "ยอดรวม",
    continueCheckout: "ดำเนินการชำระเงิน", checkout: "ชำระเงิน", orderType: "ประเภทออร์เดอร์",
    dineIn: "ทานที่ร้าน", takeaway: "กลับบ้าน", delivery: "จัดส่ง", name: "ชื่อ (ไม่บังคับ)",
    phone: "เบอร์โทร (ไม่บังคับ)", kitchenNote: "หมายเหตุถึงครัว (ไม่บังคับ)", payment: "การชำระเงิน",
    placeOrder: "สั่งอาหาร", placing: "กำลังสั่ง…", orderPlaced: "สั่งอาหารแล้ว",
    kitchenReceived: "ครัวได้รับออร์เดอร์ของคุณแล้ว", estimated: "โดยประมาณ", min: "นาที",
    trackOrder: "ติดตามออร์เดอร์", backToMenu: "กลับไปที่เมนู", orderTracking: "การติดตามออร์เดอร์",
    autoUpdate: "หน้านี้อัปเดตอัตโนมัติ ไม่ต้องรีเฟรช", orderSomethingElse: "สั่งเพิ่ม",
    items: "รายการ", promo: "โค้ดส่วนลด", apply: "ใช้", applied: "ใช้แล้ว",
    promoInvalid: "โค้ดนี้ใช้ไม่ได้", inProgress: "กำลังดำเนินการ",
    orderCancelled: "ออร์เดอร์นี้ถูกยกเลิก", orderCancelledHelp: "หากมีคำถามกรุณาติดต่อพนักงาน",
    qrNote: "คิวอาร์โค้ดสำหรับชำระเงินของร้านจะแสดงตอนชำระเงิน", selectLanguage: "ภาษา",
    add: "เพิ่ม", reviews: "รีวิว", heroTagline: "ครัวพม่าแท้ — ซุป แกง ยำ และสตรีทฟู้ด",
    recommendedSection: "แนะนำสำหรับคุณ", recommended: "แนะนำ",
    sortRecommended: "แนะนำ", sortPriceLow: "ราคา: น้อยไปมาก", sortPriceHigh: "ราคา: มากไปน้อย", sortRating: "คะแนนสูงสุด",
    favorites: "รายการโปรด", favoritesEmpty: "ยังไม่มีรายการโปรด — แตะรูปหัวใจบนเมนูเพื่อบันทึก",
    footerHours: "เปิดทุกวัน · 10:00–22:00", footerRights: "สงวนลิขสิทธิ์",
  },
  zh: {
    search: "搜索菜单", table: "餐桌", all: "全部", popular: "热门",
    popularSection: "当前热门", fullMenu: "完整菜单", noMatch: "没有符合搜索的菜品。",
    addToCart: "加入购物车", size: "份量", spiceLevel: "辣度", addOns: "加料",
    instructions: "特殊要求", instructionsPh: "例如：请不要香菜",
    quantity: "数量", soldOut: "售罄", yourOrder: "您的订单", cartEmpty: "您的购物车是空的。",
    clearCart: "清空购物车", subtotal: "小计", service: "服务费 (5%)", total: "合计",
    continueCheckout: "继续结算", checkout: "结算", orderType: "订单类型",
    dineIn: "堂食", takeaway: "外带", delivery: "外送", name: "姓名（选填）",
    phone: "电话（选填）", kitchenNote: "给厨房的备注（选填）", payment: "支付",
    placeOrder: "下单", placing: "正在下单…", orderPlaced: "已下单",
    kitchenReceived: "厨房已收到您的订单。", estimated: "预计", min: "分钟",
    trackOrder: "追踪我的订单", backToMenu: "返回菜单", orderTracking: "订单追踪",
    autoUpdate: "此页面自动更新，无需刷新。", orderSomethingElse: "再点些别的",
    items: "项", promo: "优惠码", apply: "应用", applied: "已应用",
    promoInvalid: "该优惠码无效。", inProgress: "进行中",
    orderCancelled: "此订单已取消。", orderCancelledHelp: "如有疑问请联系工作人员。",
    qrNote: "餐厅的付款二维码将在结算时显示。", selectLanguage: "语言",
    add: "添加", reviews: "条评价", heroTagline: "正宗缅甸厨房 — 汤品、咖喱、沙拉与街头小吃",
    recommendedSection: "为你推荐", recommended: "推荐",
    sortRecommended: "推荐", sortPriceLow: "价格：从低到高", sortPriceHigh: "价格：从高到低", sortRating: "评分最高",
    favorites: "收藏", favoritesEmpty: "还没有收藏 — 点击菜品上的爱心即可保存。",
    footerHours: "每日营业 · 10:00–22:00", footerRights: "版权所有。",
  },
};

/* ------------------------------------------------------------- helpers */

// Menu amounts are authored in one base unit; prices are shown in Thai Baht (THB).
const THB_RATE = 25;
function fmt(n) {
  const baht = Math.round(n / THB_RATE / 5) * 5;
  return `฿${baht.toLocaleString()}`;
}
let orderSeq = 214;
function nextOrderNumber() {
  return `SN${orderSeq++}`;
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------- styles */

/* Burmese food palette:
   primary #B73E16 · secondary #D89B32 · background #FFF8ED · dark text #2B2118 · accent green #557A46 */
const CSS = `
.sn-root{
  --ink:#2B2118; --ink-soft:#6E5C48; --paper:#FFF8ED; --paper-dim:#F6E9D2;
  --line:rgba(43,33,24,0.14); --wine:#B73E16; --wine-dark:#8F2E0F;
  --gold:#D89B32; --gold-soft:#F0D9A6; --herb:#557A46; --herb-dark:#3F5C33;
  --charcoal:#241812; --charcoal-2:#301F16; --charcoal-3:#3D281C;
  --ticket:#FFF8ED; --ticket-ink:#2B2118;
  font-family:'Inter',system-ui,sans-serif; color:var(--ink); position:relative;
}
.sn-root *{ box-sizing:border-box; }
.sn-serif{ font-family:'Cormorant Garamond',Georgia,serif; }
.sn-mono{ font-family:'JetBrains Mono','Menlo',monospace; }
.sn-btn{ cursor:pointer; border:none; font-family:inherit; }
.sn-scroll::-webkit-scrollbar{ display:none; }
.sn-scroll{ scrollbar-width:none; -ms-overflow-style:none; }
/* subtle Myanmar-inspired diamond lattice */
.sn-pattern{
  background-image:
    repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0 2px, transparent 2px 14px);
}
.sn-card{ transition:transform 0.16s ease, box-shadow 0.16s ease; }
.sn-card:hover{ transform:translateY(-2px); box-shadow:0 10px 24px rgba(43,33,24,0.12); }
@keyframes sn-pop{ 0%{ transform:scale(0.9); opacity:0;} 100%{ transform:scale(1); opacity:1;} }
@keyframes sn-slide-up{ 0%{ transform:translateY(16px); opacity:0;} 100%{ transform:translateY(0); opacity:1;} }
@keyframes sn-pulse{ 0%,100%{ opacity:1;} 50%{ opacity:0.45;} }
@keyframes sn-toast-in{ 0%{ transform:translateX(-50%) translateY(-12px); opacity:0;} 100%{ transform:translateX(-50%) translateY(0); opacity:1;} }
@keyframes sn-heart{ 0%{ transform:scale(1);} 40%{ transform:scale(1.35);} 100%{ transform:scale(1);} }
`;

/* --------------------------------------------------------------- root */

export default function App() {
  const [mode, setMode] = useState("customer");
  const [lang, setLang] = useState("en");
  const [table] = useState("07");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerScreen, setCustomerScreen] = useState("menu");
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
  const [menuItemsState, setMenuItemsState] = useState(MENU_ITEMS);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", instructions: "", payment: "Pay at counter", orderType: "Dine-in" });
  const [staffTab, setStaffTab] = useState("kitchen");
  const [staffToast, setStaffToast] = useState(null);
  const seenOrderCount = useRef(0);
  const t = T[lang] || T.en;

  useEffect(() => {
    const active = orders.filter((o) => o.status !== "Cancelled");
    if (mode === "staff" && active.length > seenOrderCount.current) {
      const diff = active.length - seenOrderCount.current;
      seenOrderCount.current = active.length;
      setStaffToast(`${diff === 1 ? "New order" : `${diff} new orders`} received`);
      const tm = setTimeout(() => setStaffToast(null), 3200);
      return () => clearTimeout(tm);
    }
    seenOrderCount.current = active.length;
  }, [orders, mode]);

  const activeOrder = orders.find((o) => o.id === activeOrderId) || null;

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const service = subtotal * 0.05;
    const discount = promoApplied ? subtotal * 0.1 : 0;
    const total = subtotal + service - discount;
    return { subtotal, service, discount, total };
  }, [cart, promoApplied]);

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
    if (promoCode.trim().toUpperCase() === "SHWE10") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError((T[lang] || T.en).promoInvalid);
      setPromoApplied(false);
    }
  }

  function placeOrder() {
    if (placing) return;
    setPlacing(true);
    setTimeout(() => {
      const orderNumber = nextOrderNumber();
      const order = {
        id: uid(),
        orderNumber,
        table: checkoutForm.orderType === "Dine-in" ? table : null,
        items: cart,
        ...checkoutForm,
        ...cartTotals,
        status: "New",
        placedAt: Date.now(),
        estMinutes: 15 + Math.floor(cart.length * 1.5),
      };
      setOrders((o) => [...o, order]);
      setActiveOrderId(order.id);
      setPlacing(false);
      setCustomerScreen("confirmation");
      clearCart();
    }, 700);
  }

  function advanceStatus(orderId) {
    setOrders((os) =>
      os.map((o) => {
        if (o.id !== orderId) return o;
        const idx = STAFF_STATUSES.indexOf(o.status);
        const next = STAFF_STATUSES[Math.min(idx + 1, STAFF_STATUSES.length - 1)];
        return { ...o, status: next };
      })
    );
  }
  function cancelOrder(orderId) {
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" } : o)));
  }

  function toggleSoldOut(itemId) {
    setMenuItemsState((items) => items.map((i) => (i.id === itemId ? { ...i, available: !i.available } : i)));
  }

  return (
    <div className="sn-root" style={{ minHeight: 600, background: mode === "customer" ? "var(--paper-dim)" : "var(--charcoal)", padding: "18px 0 40px", transition: "background 0.2s" }}>
      <style>{CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Noto+Sans+Myanmar:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap'); .sn-root{ font-family:'Inter','Noto Sans Myanmar','Noto Sans Thai','Noto Sans SC',system-ui,sans-serif; }`}</style>

      <TopBar mode={mode} setMode={setMode} lang={lang} setLang={setLang} t={t} cart={cart} screen={customerScreen} setScreen={setCustomerScreen} />

      {mode === "customer" ? (
        <CustomerApp
          t={t} lang={lang} table={table}
          menuItems={menuItemsState}
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
        />
      ) : (
        <StaffApp
          orders={orders}
          staffTab={staffTab}
          setStaffTab={setStaffTab}
          advanceStatus={advanceStatus}
          cancelOrder={cancelOrder}
          staffToast={staffToast}
          menuItems={menuItemsState}
          toggleSoldOut={toggleSoldOut}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------- top bar */

const BACK_TARGET = { cart: "menu", checkout: "cart", confirmation: "menu", tracking: "menu" };

function TopBar({ mode, setMode, lang, setLang, t, cart = [], screen = "menu", setScreen }) {
  const [langOpen, setLangOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const backTo = BACK_TARGET[screen];
  const iconBtn = { width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid var(--line)", color: "var(--ink-soft)" };
  return (
    <div style={{ maxWidth: mode === "customer" ? 420 : 1180, margin: "0 auto 14px", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      {mode === "customer" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {backTo && (
            <button className="sn-btn" aria-label="back" onClick={() => setScreen(backTo)} style={iconBtn}>
              <ChevronLeft size={17} />
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button className="sn-btn" onClick={() => setLangOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
              <Globe size={13} /> {current.label}
            </button>
            {langOpen && (
              <>
                <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 4, minWidth: 150, boxShadow: "0 8px 24px rgba(43,33,24,0.16)", zIndex: 50 }}>
                  {LANGS.map((l) => (
                    <button key={l.code} className="sn-btn" onClick={() => { setLang(l.code); setLangOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: l.code === lang ? "var(--paper-dim)" : "transparent", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      {l.label} {l.code === lang && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : <span />}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
        <div style={{ display: "inline-flex", background: mode === "customer" ? "#fff" : "var(--charcoal-2)", border: `1px solid ${mode === "customer" ? "var(--line)" : "rgba(251,245,233,0.14)"}`, borderRadius: 999, padding: 3, gap: 2 }}>
          {["customer", "staff"].map((m) => (
            <button
              key={m}
              className="sn-btn"
              onClick={() => setMode(m)}
              style={{
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                background: mode === m ? "var(--wine)" : "transparent",
                color: mode === m ? "#fff" : mode === "customer" ? "var(--ink-soft)" : "rgba(251,245,233,0.55)",
              }}
            >
              {m === "customer" ? "Customer" : "Staff"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =============================================================== */
/* CUSTOMER APP                                                     */
/* =============================================================== */

function CustomerApp(props) {
  const { screen } = props;
  return (
    <div style={{ maxWidth: 420, margin: "0 auto", background: "var(--paper)", borderRadius: 22, overflow: "hidden", boxShadow: "0 1px 0 var(--line)", border: "1px solid var(--line)", minHeight: 640, position: "relative" }}>
      {screen === "menu" && <MenuScreen {...props} />}
      {screen === "cart" && <CartScreen {...props} />}
      {screen === "checkout" && <CheckoutScreen {...props} />}
      {screen === "confirmation" && <ConfirmationScreen {...props} />}
      {screen === "tracking" && <TrackingScreen {...props} />}
      {props.selectedItem && <ItemModal t={props.t} lang={props.lang} item={props.selectedItem} onClose={() => props.setSelectedItem(null)} onAdd={props.addToCart} fav={props.favorites.includes(props.selectedItem.id)} onFav={() => props.toggleFavorite(props.selectedItem.id)} />}
      {props.addedToast && <AddedToast name={props.addedToast} />}
    </div>
  );
}

function AddedToast({ name }) {
  return (
    <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "#fff", padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, zIndex: 210, animation: "sn-toast-in 0.25s ease", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
      <Check size={14} /> {name}
    </div>
  );
}

const SORT_OPTIONS = ["recommended", "priceLow", "priceHigh", "rating"];

function MenuScreen({ t, lang, table, menuItems, activeCategory, setActiveCategory, search, setSearch, sortBy, setSortBy, favorites, toggleFavorite, setSelectedItem, cart, cartTotals, setScreen }) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = menuItems.filter((i) => {
      const matchCat =
        activeCategory === "All" ? true :
        activeCategory === "Popular" ? i.popular :
        activeCategory === "Favorites" ? favorites.includes(i.id) :
        i.category === activeCategory;
      const matchSearch = !q || tr(i, lang).toLowerCase().includes(q) || i.en.toLowerCase().includes(q) || (i.mm || "").includes(search.trim());
      return matchCat && matchSearch;
    });
    const by = {
      priceLow: (a, b) => a.price - b.price,
      priceHigh: (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      recommended: (a, b) => (b.recommended - a.recommended) || (b.popular - a.popular) || ((b.rating || 0) - (a.rating || 0)),
    }[sortBy];
    return by ? [...list].sort(by) : list;
  }, [menuItems, activeCategory, search, lang, sortBy, favorites]);

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
    (CATS.find((c) => c.id === activeCategory) ? tr(CATS.find((c) => c.id === activeCategory), lang) : t.fullMenu);

  return (
    <div>
      {/* ---- hero ---- */}
      <div className="sn-pattern" style={{ background: "linear-gradient(150deg, var(--wine) 0%, var(--wine-dark) 100%)", color: "var(--paper)", padding: "22px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="sn-serif" style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: 0.2, color: "var(--gold-soft)" }}>Shwe Nyar</p>
            <p style={{ fontSize: 12.5, color: "rgba(255,248,237,0.8)", margin: "4px 0 0" }}>{t.heroTagline}</p>
          </div>
          <div style={{ background: "rgba(255,248,237,0.14)", border: "1px solid rgba(255,248,237,0.28)", borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
            <p style={{ fontSize: 9.5, color: "rgba(255,248,237,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.table}</p>
            <p className="sn-mono" style={{ fontSize: 15, fontWeight: 700, margin: "1px 0 0" }}>{table}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,248,237,0.14)", borderRadius: 999, padding: "4px 10px", fontSize: 11.5, fontWeight: 600 }}>
            <Star size={11} fill="var(--gold)" color="var(--gold)" /> {"4.8 \u00b7 1.2k "}{t.reviews}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,248,237,0.14)", borderRadius: 999, padding: "4px 10px", fontSize: 11.5, fontWeight: 600 }}>
            <Clock3 size={11} /> {"10:00 \u2013 22:00"}
          </span>
        </div>
        <div style={{ marginTop: 14, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "rgba(255,248,237,0.55)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            style={{ width: "100%", background: "rgba(255,248,237,0.14)", border: "1px solid rgba(255,248,237,0.26)", borderRadius: 10, padding: "11px 12px 11px 34px", color: "#fff", fontSize: 13.5, outline: "none" }}
          />
        </div>
      </div>

      {/* ---- category nav ---- */}
      <div className="sn-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 16px 12px" }}>
        {[
          { id: "All", icon: "", label: t.all },
          { id: "Popular", icon: "\u2b50", label: t.popular },
          { id: "Favorites", icon: "\u2665", label: t.favorites },
          ...CATS.map((c) => ({ id: c.id, icon: c.icon, label: tr(c, lang) })),
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

      {/* ---- discovery rows ---- */}
      {showDiscovery && popular.length > 0 && (
        <div style={{ padding: "6px 0 4px 16px" }}>
          <SectionLabel icon={<Star size={13} />} text={t.popularSection} />
          <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingRight: 16, paddingBottom: 6 }}>
            {popular.map((item) => (
              <FoodTile key={item.id} item={item} lang={lang} onClick={() => setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
            ))}
          </div>
        </div>
      )}
      {showDiscovery && recommended.length > 0 && (
        <div style={{ padding: "6px 0 4px 16px" }}>
          <SectionLabel icon={<Sparkles size={13} />} text={t.recommendedSection} />
          <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingRight: 16, paddingBottom: 6 }}>
            {recommended.map((item) => (
              <FoodTile key={item.id} item={item} lang={lang} onClick={() => setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
            ))}
          </div>
        </div>
      )}

      {/* ---- full list ---- */}
      <div style={{ padding: "12px 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-soft)" }}>
            <Utensils size={13} />
            <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>{sectionTitle} <span style={{ opacity: 0.6 }}>{"\u00b7 "}{filtered.length}</span></p>
          </div>
          <SortControl t={t} value={sortBy} onChange={setSortBy} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item) => (
            <MenuCard key={item.id} lang={lang} t={t} item={item} onClick={() => item.available && setSelectedItem(item)} fav={favorites.includes(item.id)} onFav={() => toggleFavorite(item.id)} />
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", padding: "40px 0" }}>
              {activeCategory === "Favorites" ? t.favoritesEmpty : t.noMatch}
            </p>
          )}
        </div>
      </div>

      <Footer t={t} />

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
        boxShadow: "0 1px 4px rgba(43,33,24,0.14)", flexShrink: 0,
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

function FoodTile({ item, lang, onClick, fav, onFav }) {
  return (
    <div className="sn-card" onClick={onClick} style={{ flexShrink: 0, width: 150, cursor: "pointer", background: "#fff", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 96, background: "radial-gradient(circle at 50% 40%, var(--gold-soft), var(--paper-dim))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, position: "relative" }}>
        {item.icon}
        <div style={{ position: "absolute", top: 6, right: 6 }}><HeartButton active={fav} onClick={onFav} size={13} /></div>
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tr(item, lang)}</p>
        <p style={{ fontSize: 10.5, color: "var(--gold)", fontWeight: 600, margin: "1px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lang === "en" ? item.mm : item.en}</p>
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
  const label = { recommended: t.sortRecommended, priceLow: t.sortPriceLow, priceHigh: t.sortPriceHigh, rating: t.sortRating }[value];
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button className="sn-btn" onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>
        <ArrowUpDown size={12} /> {label} <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 4, minWidth: 180, boxShadow: "0 8px 24px rgba(43,33,24,0.16)", zIndex: 50 }}>
            {SORT_OPTIONS.map((o) => (
              <button key={o} className="sn-btn" onClick={() => { onChange(o); setOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: o === value ? "var(--paper-dim)" : "transparent", borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>
                {{ recommended: t.sortRecommended, priceLow: t.sortPriceLow, priceHigh: t.sortPriceHigh, rating: t.sortRating }[o]}
                {o === value && <Check size={13} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Footer({ t }) {
  return (
    <div style={{ background: "var(--charcoal)", color: "rgba(255,248,237,0.7)", padding: "24px 20px 26px" }}>
      <p className="sn-serif" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--gold-soft)" }}>Shwe Nyar</p>
      <p style={{ fontSize: 12, margin: "6px 0 14px", lineHeight: 1.6 }}>{t.heroTagline}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={13} /> No. 88, 26th Street, Yangon</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={13} /> 09 123 456 789</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock3 size={13} /> {t.footerHours}</span>
      </div>
      <p style={{ fontSize: 10.5, margin: "16px 0 0", color: "rgba(255,248,237,0.4)" }}>{"\u00a9 "}{new Date().getFullYear()}{" Shwe Nyar \u00b7 "}{t.footerRights}</p>
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

function MenuCard({ item, onClick, lang, t, fav, onFav }) {
  const name = tr(item, lang);
  const subtitle = lang === "en" ? item.mm : item.en;
  const desc = trd(item, lang);
  const catName = tr(CATS.find((c) => c.id === item.category) || {}, lang);
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
      <div style={{ width: 82, height: 82, borderRadius: 12, background: "radial-gradient(circle at 50% 40%, var(--gold-soft), var(--paper-dim))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, flexShrink: 0, position: "relative" }}>
        {item.icon}
        {item.isNew && item.available && <span style={{ position: "absolute", top: -6, left: -6, background: "var(--herb)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>New</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, paddingRight: 34 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{name}</p>
          <DietTags item={item} />
        </div>
        <p style={{ fontSize: 11.5, color: "var(--gold)", margin: "2px 0 0", fontWeight: 600 }}>{subtitle}</p>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 0", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          <RatingChip value={item.rating} />
          <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-soft)", background: "var(--paper-dim)", padding: "2px 7px", borderRadius: 6 }}>{catName}</span>
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

function ItemModal({ item, onClose, onAdd, lang, t, fav, onFav }) {
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(36,24,18,0.55)", zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", background: "var(--paper)", borderRadius: "20px 20px 0 0", animation: "sn-slide-up 0.22s ease" }}>
        <div className="sn-pattern" style={{ position: "relative" }}>
          <div style={{ height: 160, background: "radial-gradient(circle at 50% 40%, var(--gold-soft), var(--paper-dim))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 76 }}>{item.icon}</div>
          <button className="sn-btn" onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: "50%", background: "rgba(36,24,18,0.65)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
          <div style={{ position: "absolute", top: 12, left: 12 }}><HeartButton active={fav} onClick={onFav} size={16} /></div>
          {item.isNew && <span style={{ position: "absolute", bottom: 12, left: 16, background: "var(--herb)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>New</span>}
        </div>
        <div style={{ padding: "16px 20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <p className="sn-serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{name}</p>
            <DietTags item={item} size={14} />
          </div>
          <p style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600, margin: "2px 0 0" }}>{lang === "en" ? item.mm : item.en}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 0" }}>
            <RatingChip value={item.rating} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-soft)", background: "var(--paper-dim)", padding: "2px 8px", borderRadius: 6 }}>{tr(CATS.find((c) => c.id === item.category) || {}, lang)}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "6px 0 0", lineHeight: 1.5 }}>{desc}</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--wine-dark)", margin: "8px 0 0" }}>{fmt(item.price)}</p>

          {item.sizes && (
            <ModalSection title={t.size}>
              <PillRow options={item.sizes.map((s) => s.name)} value={size.name} onChange={(name2) => setSize(item.sizes.find((s) => s.name === name2))} extra={item.sizes.map((s) => (s.delta ? `+${fmt(s.delta)}` : ""))} />
            </ModalSection>
          )}

          {item.spiceLevels && (
            <ModalSection title={t.spiceLevel}>
              <PillRow options={["Mild", "Medium", "Spicy", "Extra spicy"]} value={spice} onChange={setSpice} />
            </ModalSection>
          )}

          {item.addons && (
            <ModalSection title={t.addOns}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.addons.map((a) => {
                  const checked = !!addons.find((x) => x.en === a.en);
                  return (
                    <label key={a.en} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", border: `1px solid ${checked ? "var(--wine)" : "var(--line)"}`, borderRadius: 10, cursor: "pointer", background: checked ? "rgba(122,31,43,0.05)" : "#fff" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleAddon(a)} style={{ accentColor: "#7A1F2B" }} />
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
                cartId: uid(), itemId: item.id, name, icon: item.icon,
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
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cart.map((line) => (
              <div key={line.cartId} style={{ display: "flex", gap: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, background: "var(--paper-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{line.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{line.name}</p>
                    <button className="sn-btn" onClick={() => removeLine(line.cartId)} style={{ background: "none", color: "var(--ink-soft)" }}><X size={14} /></button>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "3px 0 0", lineHeight: 1.5 }}>
                    {[line.size, line.spice ? `${line.spice} spice` : null, ...line.addons.map((a) => tr(a, lang))].filter(Boolean).join(" \u00b7 ")}
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
              <TotalRow label={t.service} value={cartTotals.service} />
              {cartTotals.discount > 0 && <TotalRow label="Discount" value={-cartTotals.discount} accent />}
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
            {t.continueCheckout} {"\u2014 "}{fmt(cartTotals.total)}
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
      <span style={{ fontSize: bold ? 15 : 12.5, fontWeight: bold ? 700 : 600, color: accent ? "var(--herb-dark)" : "var(--ink)" }}>{value < 0 ? "\u2212" : ""}{fmt(Math.abs(value))}</span>
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

function CheckoutScreen({ t, checkoutForm, setCheckoutForm, cart, cartTotals, placing, placeOrder, setScreen }) {
  const orderTypes = [{ id: "Dine-in", label: t.dineIn }, { id: "Takeaway", label: t.takeaway }, { id: "Delivery", label: t.delivery }];
  const payments = ["Pay at counter", "Cash", "QR payment", "Online payment"];
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
        <input value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} placeholder={t.name} style={inputStyle} />

        <FieldLabel>{t.phone}</FieldLabel>
        <input value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })} placeholder="09xxxxxxxxx" style={inputStyle} />

        <FieldLabel>{t.kitchenNote}</FieldLabel>
        <textarea rows={2} value={checkoutForm.instructions} onChange={(e) => setCheckoutForm({ ...checkoutForm, instructions: e.target.value })} placeholder={t.instructionsPh} style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} />

        <FieldLabel>{t.payment}</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {payments.map((p) => (
            <label key={p} onClick={() => setCheckoutForm({ ...checkoutForm, payment: p })} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", border: `1px solid ${checkoutForm.payment === p ? "var(--wine)" : "var(--line)"}`, borderRadius: 10, cursor: "pointer", background: checkoutForm.payment === p ? "rgba(122,31,43,0.05)" : "#fff" }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${checkoutForm.payment === p ? "var(--wine)" : "var(--line)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {checkoutForm.payment === p && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--wine)" }} />}
              </span>
              <span style={{ fontSize: 13 }}>{p}</span>
            </label>
          ))}
        </div>
        {checkoutForm.payment === "QR payment" && (
          <div style={{ marginTop: 10, background: "var(--paper-dim)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <QrCode size={28} />
            <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: 0 }}>{t.qrNote}</p>
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 14, marginTop: 20 }}>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "0 0 6px", fontWeight: 600 }}>{cart.length} {t.items}</p>
          <TotalRow label={t.total} value={cartTotals.total} bold />
        </div>
      </div>

      <div style={{ padding: "16px 20px 20px" }}>
        <button className="sn-btn" onClick={placeOrder} disabled={placing} style={{ width: "100%", background: placing ? "var(--ink-soft)" : "var(--wine)", color: "#fff", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {placing ? t.placing : `${t.placeOrder} \u2014 ${fmt(cartTotals.total)}`}
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", margin: "16px 0 6px" }}>{children}</p>;
}
const inputStyle = { width: "100%", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none" };

function ConfirmationScreen({ t, activeOrder, setScreen }) {
  if (!activeOrder) return null;
  return (
    <div style={{ minHeight: 640, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--herb)", display: "flex", alignItems: "center", justifyContent: "center", animation: "sn-pop 0.3s ease" }}>
        <Check size={28} color="#fff" />
      </div>
      <p className="sn-serif" style={{ fontSize: 21, fontWeight: 700, margin: "18px 0 4px" }}>{t.orderPlaced}</p>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>{t.kitchenReceived}</p>

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 20, marginTop: 24, width: "100%", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed var(--line)", paddingBottom: 12, marginBottom: 12 }}>
          <span className="sn-mono" style={{ fontSize: 17, fontWeight: 700 }}>{activeOrder.orderNumber}</span>
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{activeOrder.table ? `${t.table} ${activeOrder.table}` : activeOrder.orderType}</span>
        </div>
        {activeOrder.items.map((l) => (
          <div key={l.cartId} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
            <span style={{ fontSize: 12.5 }}>{l.qty}\u00d7 {l.name}</span>
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

      <button className="sn-btn" onClick={() => setScreen("tracking")} style={{ width: "100%", background: "var(--wine)", color: "#fff", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, marginTop: 20 }}>
        {t.trackOrder}
      </button>
      <button className="sn-btn" onClick={() => setScreen("menu")} style={{ background: "none", color: "var(--ink-soft)", fontSize: 12.5, textDecoration: "underline", marginTop: 14 }}>
        {t.backToMenu}
      </button>
    </div>
  );
}

function TrackingScreen({ t, lang, activeOrder, setScreen }) {
  if (!activeOrder) return null;
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
  return (
    <div style={{ minHeight: 640, padding: "0 20px 30px" }}>
      <ScreenHeader title={t.orderTracking} onBack={() => setScreen("menu")} />
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <span className="sn-mono" style={{ fontSize: 22, fontWeight: 700 }}>{activeOrder.orderNumber}</span>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 0" }}>{activeOrder.table ? `${t.table} ${activeOrder.table} \u00b7 ` : `${activeOrder.orderType} \u00b7 `}{activeOrder.items.length} {t.items} \u00b7 {fmt(activeOrder.total)}</p>
      </div>

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
                    border: current ? "3px solid rgba(75,127,82,0.25)" : "none",
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
      <button className="sn-btn" onClick={() => setScreen("menu")} style={{ width: "100%", background: "var(--paper-dim)", color: "var(--ink)", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 600, marginTop: 18 }}>
        {t.orderSomethingElse}
      </button>
    </div>
  );
}

/* =============================================================== */
/* STAFF APP                                                        */
/* =============================================================== */

function StaffApp({ orders, staffTab, setStaffTab, advanceStatus, cancelOrder, staffToast, menuItems, toggleSoldOut }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "kitchen", label: "Kitchen display", icon: ClipboardList },
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "tables", label: "Tables", icon: Table2 },
  ];
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 16px", color: "var(--paper)", position: "relative" }}>
      {staffToast && (
        <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: "var(--gold)", color: "#3A2607", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, zIndex: 90, animation: "sn-toast-in 0.25s ease" }}>
          <Bell size={14} /> {staffToast}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <p className="sn-serif" style={{ fontSize: 21, fontWeight: 700, margin: 0, color: "var(--gold-soft)" }}>{"Shwe Nyar \u2014 staff"}</p>
          <p style={{ fontSize: 12, color: "rgba(251,245,233,0.5)", margin: "2px 0 0" }}>Restaurant Manager view</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid rgba(251,245,233,0.12)" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = staffTab === t.id;
          return (
            <button key={t.id} className="sn-btn" onClick={() => setStaffTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", background: "none", color: active ? "var(--gold)" : "rgba(251,245,233,0.55)", fontSize: 13, fontWeight: 600, borderBottom: `2px solid ${active ? "var(--gold)" : "transparent"}` }}>
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {staffTab === "dashboard" && <DashboardTab orders={orders} />}
      {staffTab === "kitchen" && <KitchenTab orders={orders} advanceStatus={advanceStatus} cancelOrder={cancelOrder} />}
      {staffTab === "menu" && <MenuTab menuItems={menuItems} toggleSoldOut={toggleSoldOut} />}
      {staffTab === "tables" && <TablesTab orders={orders} />}
    </div>
  );
}

function DashboardTab({ orders }) {
  const active = orders.filter((o) => o.status !== "Cancelled");
  const pending = orders.filter((o) => o.status === "New").length;
  const preparing = orders.filter((o) => o.status === "Preparing").length;
  const ready = orders.filter((o) => o.status === "Ready").length;
  const completed = orders.filter((o) => o.status === "Completed").length;
  const cancelled = orders.filter((o) => o.status === "Cancelled").length;
  const revenue = active.reduce((s, o) => s + o.total, 0);
  const aov = active.length ? revenue / active.length : 0;

  const stats = [
    { label: "Today's orders", value: active.length },
    { label: "Pending", value: pending },
    { label: "Preparing", value: preparing },
    { label: "Ready", value: ready },
    { label: "Completed", value: completed },
    { label: "Cancelled", value: cancelled },
    { label: "Today's revenue", value: fmt(revenue) },
    { label: "Avg. order value", value: fmt(aov) },
  ];

  const popularity = {};
  active.forEach((o) => o.items.forEach((l) => { popularity[l.name] = (popularity[l.name] || 0) + l.qty; }));
  const topItems = Object.entries(popularity).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "var(--charcoal-2)", border: "1px solid rgba(251,245,233,0.1)", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 11.5, color: "rgba(251,245,233,0.55)", margin: 0 }}>{s.label}</p>
            <p className="sn-serif" style={{ fontSize: 22, fontWeight: 700, margin: "6px 0 0" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "rgba(251,245,233,0.75)" }}>Best-selling dishes today</p>
      {topItems.length === 0 ? (
        <EmptyNote text="No orders yet. Place one from the customer view to see it here." />
      ) : (
        <div style={{ background: "var(--charcoal-2)", border: "1px solid rgba(251,245,233,0.1)", borderRadius: 12, padding: 6 }}>
          {topItems.map(([name, qty], i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < topItems.length - 1 ? "1px solid rgba(251,245,233,0.08)" : "none" }}>
              <span style={{ fontSize: 13 }}>{name}</span>
              <span className="sn-mono" style={{ fontSize: 12.5, color: "var(--gold)" }}>{qty} sold</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyNote({ text }) {
  return (
    <div style={{ border: "1px dashed rgba(251,245,233,0.2)", borderRadius: 12, padding: "22px 16px", textAlign: "center", color: "rgba(251,245,233,0.5)", fontSize: 12.5 }}>
      {text}
    </div>
  );
}

function KitchenTab({ orders, advanceStatus, cancelOrder }) {
  const columns = STAFF_STATUSES;
  return (
    <div className="sn-scroll" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
      {columns.map((status) => {
        const list = orders.filter((o) => o.status === status).sort((a, b) => a.placedAt - b.placedAt);
        return (
          <div key={status} style={{ flexShrink: 0, width: 240 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: "rgba(251,245,233,0.7)", textTransform: "uppercase", letterSpacing: 0.4 }}>{status}</p>
              <span className="sn-mono" style={{ fontSize: 11, background: "rgba(251,245,233,0.1)", padding: "2px 7px", borderRadius: 999 }}>{list.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 60 }}>
              {list.map((order) => (
                <OrderTicket key={order.id} order={order} advanceStatus={advanceStatus} cancelOrder={cancelOrder} />
              ))}
              {list.length === 0 && <div style={{ border: "1px dashed rgba(251,245,233,0.15)", borderRadius: 10, padding: "16px", textAlign: "center", fontSize: 11.5, color: "rgba(251,245,233,0.35)" }}>Empty</div>}
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
        {order.table ? `Table ${order.table}` : order.orderType}{order.name ? ` \u00b7 ${order.name}` : ""}
      </p>

      <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
        {order.items.map((l) => (
          <div key={l.cartId}>
            <p style={{ fontSize: 12, margin: 0 }}><strong>{l.qty}\u00d7</strong> {l.name}</p>
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
        <p style={{ fontSize: 10.5, background: "rgba(122,31,43,0.08)", color: "var(--wine-dark)", padding: "5px 8px", borderRadius: 6, margin: "8px 0 0" }}>Note: {order.instructions}</p>
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

function MenuTab({ menuItems, toggleSoldOut }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: "rgba(251,245,233,0.5)", marginBottom: 12 }}>Toggle availability the same way kitchen staff would mark an item unavailable mid-service.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {menuItems.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--charcoal-2)", border: "1px solid rgba(251,245,233,0.1)", borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{item.en} <span style={{ color: "var(--gold)", fontWeight: 500 }}>\u00b7 {item.mm}</span></p>
              <p style={{ fontSize: 11, color: "rgba(251,245,233,0.45)", margin: "2px 0 0" }}>{item.category} \u00b7 {fmt(item.price)}</p>
            </div>
            <button
              className="sn-btn"
              onClick={() => toggleSoldOut(item.id)}
              style={{
                fontSize: 11.5, fontWeight: 700, padding: "6px 12px", borderRadius: 999,
                background: item.available ? "rgba(75,127,82,0.18)" : "rgba(122,31,43,0.18)",
                color: item.available ? "#8FD69B" : "#F0A5A8",
                border: "none",
              }}
            >
              {item.available ? "Available" : "Sold out"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TablesTab({ orders }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: "rgba(251,245,233,0.5)", marginBottom: 12 }}>Each table's QR code opens the menu with its table number attached automatically.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {TABLES.map((t) => {
          const activeOrder = orders.find((o) => o.table === t.number && o.status !== "Completed" && o.status !== "Cancelled");
          const status = activeOrder ? (activeOrder.status === "New" ? "Ordering" : "Occupied") : "Available";
          const dot = status === "Available" ? "#5DCAA5" : status === "Ordering" ? "var(--gold)" : "var(--wine)";
          return (
            <div key={t.number} style={{ background: "var(--charcoal-2)", border: "1px solid rgba(251,245,233,0.1)", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, margin: "0 auto 10px", background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <QrCode size={38} color="#221512" />
              </div>
              <p className="sn-mono" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Table {t.number}</p>
              <p style={{ fontSize: 11, margin: "5px 0 8px", color: dot, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot, display: "inline-block" }} /> {status}
              </p>
              <button className="sn-btn" style={{ fontSize: 10.5, color: "rgba(251,245,233,0.55)", background: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Printer size={11} /> Print QR card
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
