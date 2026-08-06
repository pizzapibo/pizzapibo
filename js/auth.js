/* ===========================================================
   PIBO — admin.html logic
   Change the password below whenever you like.
=========================================================== */
const PIBO_ADMIN_PASSWORD = "Arshiakamali2898";
let pibo_editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  const authScreen = document.querySelector(".auth-screen");
  const adminShell = document.querySelector(".admin-shell");
  const form = document.querySelector("[data-auth-form]");
  const errorBox = document.querySelector("[data-auth-error]");
  const logoutBtn = document.querySelector("[data-logout]");

  if(sessionStorage.getItem("pibo_admin_ok") === "1"){
    unlock();
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = form.querySelector("input[name=password]").value;
    if(value === PIBO_ADMIN_PASSWORD){
      sessionStorage.setItem("pibo_admin_ok", "1");
      unlock();
    }else{
      errorBox.textContent = "رمز عبور اشتباه است.";
      form.querySelector("input[name=password]").value = "";
    }
  });

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem("pibo_admin_ok");
    location.reload();
  });

  function unlock(){
    authScreen?.remove();
    adminShell?.classList.add("show");

    if(typeof PIBO_FIREBASE_PLACEHOLDER !== "undefined" && PIBO_FIREBASE_PLACEHOLDER){
      const grid = document.querySelector("[data-qr-grid]");
      const body = document.querySelector("[data-products-body]");
      const notice = `
        <div style="background:var(--cream);border:1.5px dashed var(--orange);border-radius:18px;padding:26px;text-align:center">
          <p style="font-weight:900;margin-bottom:8px">پایگاه‌داده وصل نشده — افزودن پیتزا غیرفعال است</p>
          <p style="color:var(--ink-soft);font-size:.9rem;line-height:1.9">
            فایل <code>js/firebase-config.js</code> را طبق راهنمای README تکمیل کنید (ساخت یک پروژه رایگان Firebase، ۵ دقیقه). بعد از آن، این پنل فعال می‌شود.
          </p>
        </div>`;
      if(grid) grid.innerHTML = notice;
      if(body) body.innerHTML = `<tr><td colspan="4">${notice}</td></tr>`;

      const form = document.querySelector("[data-product-form]");
      form?.querySelectorAll("input, textarea, button").forEach(el => el.disabled = true);
      form?.addEventListener("submit", (e) => e.preventDefault());
      return;
    }

    initProductManager();
    renderOrders();
  }
});

/* ---------- product manager (add / edit / delete / price) ---------- */
async function initProductManager(){
  const form = document.querySelector("[data-product-form]");
  const cancelBtn = document.querySelector("[data-product-cancel]");
  if(!form) return;

  await refreshProductViews();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.querySelector("[name=name]").value.trim();
    const category = form.querySelector("[name=category]").value;
    const desc = form.querySelector("[name=desc]").value.trim();
    const price = parseInt(form.querySelector("[name=price]").value, 10) || 0;
    const emoji = form.querySelector("[name=emoji]").value.trim() || pibo_defaultEmoji(category);
    const glbName = form.querySelector("[name=glb]").value.trim();
    const usdzName = form.querySelector("[name=usdz]").value.trim();

    if(!name || !price){
      alert("لطفاً نام و قیمت را وارد کنید.");
      return;
    }

    const submitBtn = form.querySelector("button[type=submit]");
    if(submitBtn) submitBtn.disabled = true;

    try{
      const id = pibo_editingId || pibo_slugify(name);
      await pibo_saveProduct({
        name, category, desc, price, emoji,
        glb: glbName || (category === "پیتزا" ? `models/${id}.glb` : ""),
        usdz: usdzName || (category === "پیتزا" ? `models/${id}.usdz` : "")
      }, pibo_editingId || id);

      resetProductForm();
      await refreshProductViews();
    }catch(err){
      alert("ذخیره با خطا مواجه شد. اتصال اینترنت و تنظیمات Firebase را بررسی کنید.");
      console.error(err);
    }finally{
      if(submitBtn) submitBtn.disabled = false;
    }
  });

  cancelBtn?.addEventListener("click", resetProductForm);
}

function pibo_defaultEmoji(category){
  return { "پیتزا":"🍕", "نوشیدنی":"🥤", "سیب‌زمینی":"🍟", "دسر":"🍰" }[category] || "🍽️";
}

async function refreshProductViews(){
  const products = await pibo_getProducts();
  renderProductTable(products);
  renderQrGrid(products);
}

function resetProductForm(){
  pibo_editingId = null;
  const form = document.querySelector("[data-product-form]");
  const title = document.querySelector("[data-product-form-title]");
  const cancelBtn = document.querySelector("[data-product-cancel]");
  form?.reset();
  if(title) title.textContent = "افزودن پیتزای جدید";
  cancelBtn?.setAttribute("hidden", "true");
}

function renderProductTable(products){
  const body = document.querySelector("[data-products-body]");
  if(!body) return;

  if(!products.length){
    body.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--ink-soft)">هنوز موردی اضافه نشده است.</td></tr>`;
    return;
  }

  body.innerHTML = products.map(p => `
    <tr>
      <td>${p.emoji || "🍽️"} ${p.name}</td>
      <td style="font-size:.8rem;color:var(--ink-soft)">${p.category || "پیتزا"}</td>
      <td>${pibo_formatPrice(p.price)}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="btn btn-outline btn-sm" data-edit="${p.id}">ویرایش</button>
          <button type="button" class="btn btn-sm" style="background:#FDEAE3;color:var(--orange-dark)" data-delete="${p.id}">حذف</button>
        </div>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => startEditProduct(btn.dataset.edit, products));
  });
  body.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.delete));
  });
}

function startEditProduct(id, products){
  const product = products.find(p => p.id === id);
  if(!product) return;
  pibo_editingId = id;

  const form = document.querySelector("[data-product-form]");
  const title = document.querySelector("[data-product-form-title]");
  const cancelBtn = document.querySelector("[data-product-cancel]");
  if(!form) return;

  form.querySelector("[name=name]").value = product.name;
  form.querySelector("[name=category]").value = product.category || "پیتزا";
  form.querySelector("[name=desc]").value = product.desc || "";
  form.querySelector("[name=price]").value = product.price;
  form.querySelector("[name=emoji]").value = product.emoji || "";
  form.querySelector("[name=glb]").value = product.glb || "";
  form.querySelector("[name=usdz]").value = product.usdz || "";

  if(title) title.textContent = `ویرایش «${product.name}»`;
  cancelBtn?.removeAttribute("hidden");
  form.scrollIntoView({ behavior:"smooth", block:"center" });
}

async function deleteProduct(id){
  if(!confirm("این پیتزا حذف شود؟")) return;
  try{
    await pibo_deleteProduct(id);
    if(pibo_editingId === id) resetProductForm();
    await refreshProductViews();
  }catch(err){
    alert("حذف پیتزا با خطا مواجه شد.");
    console.error(err);
  }
}

/* ---------- QR codes (pizza items only — AR is pizza-specific) ---------- */
function renderQrGrid(products){
  const grid = document.querySelector("[data-qr-grid]");
  if(!grid) return;
  const base = location.href.replace(/admin\.html.*$/, "");
  const pizzas = products.filter(p => (p.category || "پیتزا") === "پیتزا");

  if(!pizzas.length){
    grid.innerHTML = `<p style="color:var(--ink-soft)">بعد از افزودن پیتزا، کد QR آن اینجا نمایش داده می‌شود.</p>`;
    return;
  }

  grid.innerHTML = pizzas.map(p => {
    const arUrl = `${base}ar.html?pizza=${p.id}`;
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(arUrl)}`;
    return `
      <div class="qr-tile">
        <img src="${qrImg}" alt="کد QR ${p.name}" width="140" height="140" loading="lazy">
        <b>${p.name}</b>
        <span>${arUrl}</span>
      </div>
    `;
  }).join("");
}

/* ---------- orders (shared, read from Firebase) ---------- */
async function renderOrders(){
  const tbody = document.querySelector("[data-orders-body]");
  const empty = document.querySelector("[data-orders-empty]");
  if(!tbody || !pibo_db) return;

  let list = [];
  try{
    const snap = await pibo_db.ref("orders").once("value");
    const val = snap.val() || {};
    list = Object.values(val).sort((a, b) => new Date(b.date) - new Date(a.date));
  }catch(e){
    console.error("خطا در دریافت سفارش‌ها:", e);
  }

  if(!list.length){
    tbody.innerHTML = "";
    if(empty) empty.style.display = "block";
    return;
  }
  if(empty) empty.style.display = "none";

  const products = await pibo_getProducts();

  tbody.innerHTML = list.map(o => {
    const itemsText = (o.items || []).map(item => {
      const p = products.find(x => x.id === item.id);
      return p ? `${p.name}×${item.qty}` : "";
    }).filter(Boolean).join("، ");
    const date = new Date(o.date).toLocaleString("fa-IR");
    return `
      <tr>
        <td>${o.name}</td>
        <td>${o.phone}</td>
        <td>${itemsText}</td>
        <td>${pibo_formatPrice(o.total)}</td>
        <td>${date}</td>
      </tr>
    `;
  }).join("");
}
