/* ===========================================================
   PIBO — Product catalogue
   To add a real pizza:
   1) Scan it in Luma AI, export GLB + USDZ
   2) Put the two files inside /models  (e.g. margherita.glb, margherita.usdz)
   3) Add an entry below with matching glb / usdz file names
=========================================================== */
const PIBO_PRODUCTS = [
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

function pibo_formatPrice(n){
  return n.toLocaleString("fa-IR") + " تومان";
}
