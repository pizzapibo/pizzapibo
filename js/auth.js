/* ===========================================================
   PIBO — admin.html logic
   Change the password below whenever you like.
=========================================================== */
const PIBO_ADMIN_PASSWORD = "Arshiakamali2898";

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
    renderQrGrid();
    renderOrders();
    initProductManager();
  }
});

function renderQrGrid(){
  const grid = document.querySelector("[data-qr-grid]");
  if(!grid || typeof PIBO_PRODUCTS === "undefined") return;
  const base = location.href.replace(/admin\.html.*$/, "");

  grid.innerHTML = PIBO_PRODUCTS.map(p => {
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

/* ---------- product manager (add / edit / delete / price) ---------- */
let pibo_editingId = null;

function initProductManager(){
  const form = document.querySelector("[data-product-form]");
  const cancelBtn = document.querySelector("[data-product-cancel]");
  const resetBtn = document.querySelector("[data-product-reset]");
  if(!form) return;

  renderProductTable();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.querySelector("[name=name]").value.trim();
    const desc = form.querySelector("[name=desc]").value.trim();
    const price = parseInt(form.querySelector("[name=price]").value, 10) || 0;
    const emoji = form.querySelector("[name=emoji]").value.trim() || "🍕";
    const glbName = form.querySelector("[name=glb]").value.trim();
    const usdzName = form.querySelector("[name=usdz]").value.trim();

    if(!name || !price){
      alert("لطفاً نام و قیمت پیتزا را وارد کنید.");
      return;
    }

    const products = pibo_getProducts().slice();

    if(pibo_editingId){
      const idx = products.findIndex(p => p.id === pibo_editingId);
      if(idx > -1){
        products[idx] = {
          ...products[idx],
          name, desc, price, emoji,
          glb: glbName || products[idx].glb,
          usdz: usdzName || products[idx].usdz
        };
      }
    }else{
      let id = pibo_slugify(name);
      if(products.some(p => p.id === id)) id = id + "-" + Date.now().toString(36);
      products.push({
        id, name, desc, price, emoji,
        glb: glbName || `models/${id}.glb`,
        usdz: usdzName || `models/${id}.usdz`
      });
    }

    pibo_saveProducts(products);
    PIBO_PRODUCTS = products;
    resetProductForm();
    renderProductTable();
    renderQrGrid();
  });

  cancelBtn?.addEventListener("click", resetProductForm);

  resetBtn?.addEventListener("click", () => {
    if(!confirm("منوی پیتزاها به حالت اولیه بازگردانده شود؟ تغییرات شما پاک می‌شود.")) return;
    pibo_resetProducts();
    PIBO_PRODUCTS = pibo_getProducts();
    resetProductForm();
    renderProductTable();
    renderQrGrid();
  });
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

function pibo_slugify(text){
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || ("pizza-" + Date.now().toString(36));
}

function renderProductTable(){
  const body = document.querySelector("[data-products-body]");
  if(!body) return;
  const products = pibo_getProducts();

  body.innerHTML = products.map(p => `
    <tr>
      <td>${p.emoji || "🍕"} ${p.name}</td>
      <td>${pibo_formatPrice(p.price)}</td>
      <td style="font-size:.75rem;color:var(--ink-soft)">${p.glb}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="btn btn-outline btn-sm" data-edit="${p.id}">ویرایش</button>
          <button type="button" class="btn btn-sm" style="background:#FDEAE3;color:var(--orange-dark)" data-delete="${p.id}">حذف</button>
        </div>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => startEditProduct(btn.dataset.edit));
  });
  body.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteProduct(btn.dataset.delete));
  });
}

function startEditProduct(id){
  const product = pibo_getProducts().find(p => p.id === id);
  if(!product) return;
  pibo_editingId = id;

  const form = document.querySelector("[data-product-form]");
  const title = document.querySelector("[data-product-form-title]");
  const cancelBtn = document.querySelector("[data-product-cancel]");
  if(!form) return;

  form.querySelector("[name=name]").value = product.name;
  form.querySelector("[name=desc]").value = product.desc || "";
  form.querySelector("[name=price]").value = product.price;
  form.querySelector("[name=emoji]").value = product.emoji || "🍕";
  form.querySelector("[name=glb]").value = product.glb || "";
  form.querySelector("[name=usdz]").value = product.usdz || "";

  if(title) title.textContent = `ویرایش «${product.name}»`;
  cancelBtn?.removeAttribute("hidden");
  form.scrollIntoView({ behavior:"smooth", block:"center" });
}

function deleteProduct(id){
  const product = pibo_getProducts().find(p => p.id === id);
  if(!product) return;
  if(!confirm(`پیتزای «${product.name}» حذف شود؟`)) return;

  const products = pibo_getProducts().filter(p => p.id !== id);
  pibo_saveProducts(products);
  PIBO_PRODUCTS = products;
  if(pibo_editingId === id) resetProductForm();
  renderProductTable();
  renderQrGrid();
}

function renderOrders(){
  const tbody = document.querySelector("[data-orders-body]");
  const empty = document.querySelector("[data-orders-empty]");
  if(!tbody) return;

  let list = [];
  try{ list = JSON.parse(localStorage.getItem("pibo_orders") || "[]"); }catch(e){ list = []; }

  if(!list.length){
    tbody.innerHTML = "";
    if(empty) empty.style.display = "block";
    return;
  }
  if(empty) empty.style.display = "none";

  tbody.innerHTML = list.map(o => {
    const itemsText = (o.items || []).map(([id, qty]) => {
      const p = PIBO_PRODUCTS.find(x => x.id === id);
      return p ? `${p.name}×${qty}` : "";
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
