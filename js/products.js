/* ===========================================================
   PIBO — Product catalogue
   These are just the starting pizzas. Everything (add / edit /
   delete / price changes) can be managed from admin.html — those
   changes are saved in the browser and override the list below.

   To add a real pizza 3D model:
   1) Scan it in Luma AI, export GLB + USDZ
   2) Put the two files inside /models  (e.g. margherita.glb, margherita.usdz)
   3) Set the glb / usdz file names for that pizza from admin.html
=========================================================== */
const PIBO_STORAGE_KEY = "pibo_products";

const PIBO_DEFAULT_PRODUCTS = [
  {
    id: "margherita",
    name: "مارگاریتا",
    desc: "سس گوجه تازه، موزارلا و ریحان تازه روی خمیر نازک",
    price: 185000,
    emoji: "🍕",
    glb: "models/margherita.glb",
    usdz: "models/margherita.usdz"
  },
  {
    id: "pepperoni",
    name: "پپرونی",
    desc: "پپرونی تند، موزارلا دوبل و سس مخصوص پیبو",
    price: 235000,
    emoji: "🍕",
    glb: "models/pepperoni.glb",
    usdz: "models/pepperoni.usdz"
  },
  {
    id: "mix-special",
    name: "میکس ویژه پیبو",
    desc: "مرغ، قارچ، فلفل دلمه، زیتون و پنیر چهارگانه",
    price: 275000,
    emoji: "🍕",
    glb: "models/mix-special.glb",
    usdz: "models/mix-special.usdz"
  },
  {
    id: "veggie",
    name: "سبزیجات",
    desc: "قارچ، فلفل، ذرت، زیتون و گوجه گیلاسی",
    price: 195000,
    emoji: "🍕",
    glb: "models/veggie.glb",
    usdz: "models/veggie.usdz"
  },
  {
    id: "bbq-chicken",
    name: "مرغ و سس باربیکیو",
    desc: "مرغ گریل‌شده، سس باربیکیو دودی و پیاز کاراملی",
    price: 245000,
    emoji: "🍕",
    glb: "models/bbq-chicken.glb",
    usdz: "models/bbq-chicken.usdz"
  },
  {
    id: "four-cheese",
    name: "چهار پنیر",
    desc: "موزارلا، چدار، پارمزان و گورگونزولا",
    price: 255000,
    emoji: "🍕",
    glb: "models/four-cheese.glb",
    usdz: "models/four-cheese.usdz"
  }
];

/* ---------- read / write the live catalogue ---------- */
function pibo_getProducts(){
  try{
    const raw = localStorage.getItem(PIBO_STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length) return parsed;
    }
  }catch(e){ /* storage unavailable, fall back to defaults */ }
  return PIBO_DEFAULT_PRODUCTS;
}

function pibo_saveProducts(products){
  try{ localStorage.setItem(PIBO_STORAGE_KEY, JSON.stringify(products)); }catch(e){ /* storage unavailable */ }
}

function pibo_resetProducts(){
  try{ localStorage.removeItem(PIBO_STORAGE_KEY); }catch(e){}
}

function pibo_formatPrice(n){
  return Number(n || 0).toLocaleString("fa-IR") + " تومان";
}

/* live catalogue used across all pages — reflects admin panel edits */
let PIBO_PRODUCTS = pibo_getProducts();
