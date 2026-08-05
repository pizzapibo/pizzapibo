/* ===========================================================
   PIBO — Product catalogue (shared, cross-browser)
   No sample pizzas are built in — everything is added from
   admin.html and stored centrally in Firebase, so every browser
   and device reads the same list. Data is fetched on each page
   load (no live/real-time connection is kept open).

   To add a real pizza 3D model:
   1) Scan it in Luma AI, export GLB + USDZ
   2) Put the two files inside /models (e.g. margherita.glb, margherita.usdz)
   3) Set the glb / usdz file names for that pizza from admin.html
=========================================================== */

let PIBO_PRODUCTS = [];

/* fetch the full catalogue once from Firebase */
async function pibo_getProducts(){
  if(!pibo_db) return [];
  try{
    const snap = await pibo_db.ref("products").once("value");
    const val = snap.val() || {};
    const list = Object.keys(val).map(id => ({ id, ...val[id] }));
    PIBO_PRODUCTS = list;
    return list;
  }catch(e){
    console.error("خطا در دریافت لیست پیتزاها:", e);
    return [];
  }
}

/* fetch a single pizza by id */
async function pibo_getProduct(id){
  if(!pibo_db || !id) return null;
  try{
    const snap = await pibo_db.ref("products/" + id).once("value");
    const val = snap.val();
    return val ? { id, ...val } : null;
  }catch(e){
    console.error("خطا در دریافت پیتزا:", e);
    return null;
  }
}

/* create or update a pizza. pass an id to update, omit to create */
async function pibo_saveProduct(product, existingId){
  if(!pibo_db) throw new Error("اتصال Firebase برقرار نیست.");
  const id = existingId || pibo_slugify(product.name) + "-" + Date.now().toString(36);
  const data = { ...product };
  delete data.id;
  await pibo_db.ref("products/" + id).set(data);
  return id;
}

async function pibo_deleteProduct(id){
  if(!pibo_db) throw new Error("اتصال Firebase برقرار نیست.");
  await pibo_db.ref("products/" + id).remove();
}

function pibo_slugify(text){
  return (text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || ("pizza-" + Date.now().toString(36));
}

function pibo_formatPrice(n){
  return Number(n || 0).toLocaleString("fa-IR") + " تومان";
}
