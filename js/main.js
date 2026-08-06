/* ===========================================================
   PIBO — main.js
=========================================================== */
const PIBO_WHATSAPP = "989140909878";
const PIBO_TELEGRAM  = "989140909878";

document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initMobileNav();
  initReveal();
  await renderMenu();
  initOrderForm();
  initSocialLinks();
  fillPickListAndQr();
});

/* ---------- header shrink on scroll ---------- */
function initHeader(){
  const header = document.querySelector(".site-header");
  if(!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive:true });
}

/* ---------- mobile nav drawer ---------- */
function initMobileNav(){
  const toggle = document.querySelector(".menu-toggle");
  const drawer = document.querySelector(".mobile-nav");
  if(!toggle || !drawer) return;
  const closeBtn = drawer.querySelector(".close-mn");
  toggle.addEventListener("click", () => drawer.classList.add("open"));
  closeBtn?.addEventListener("click", () => drawer.classList.remove("open"));
  drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => drawer.classList.remove("open")));
}

/* ---------- scroll reveal animations ---------- */
function initReveal(){
  const items = document.querySelectorAll(".reveal, .reveal-scale, .reveal-right");
  if(!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold:.15, rootMargin:"0px 0px -60px 0px" });
  items.forEach((el,i) => { el.style.setProperty("--i", i % 8); io.observe(el); });
}

/* ---------- render pizza menu ---------- */
async function renderMenu(){
  const grid = document.querySelector("[data-menu-grid]");
  const tabsWrap = document.querySelector("[data-menu-tabs]");
  if(!grid) return;

  if(typeof PIBO_FIREBASE_PLACEHOLDER !== "undefined" && PIBO_FIREBASE_PLACEHOLDER){
    grid.innerHTML = pibo_setupNotice();
    return;
  }

  grid.innerHTML = `<p style="color:var(--ink-soft);grid-column:1/-1;text-align:center">در حال دریافت منو…</p>`;
  const products = await pibo_getProducts();

  if(!products.length){
    grid.innerHTML = `<p style="color:var(--ink-soft);grid-column:1/-1;text-align:center">
      هنوز موردی در منو ثبت نشده است. از پنل مدیریت اضافه کنید.
    </p>`;
    if(tabsWrap) tabsWrap.innerHTML = "";
    return;
  }

  const categories = ["همه", ...Array.from(new Set(products.map(p => p.category || "پیتزا")))];
  let activeCategory = "همه";

  function paintTabs(){
    if(!tabsWrap) return;
    tabsWrap.innerHTML = categories.map(c =>
      `<button type="button" class="menu-tab ${c === activeCategory ? "active" : ""}" data-tab="${c}">${c}</button>`
    ).join("");
    tabsWrap.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.tab;
        paintTabs();
        paintGrid();
      });
    });
  }

  function paintGrid(){
    const list = activeCategory === "همه" ? products : products.filter(p => (p.category || "پیتزا") === activeCategory);
    grid.innerHTML = list.map((p,i) => {
      const isPizza = (p.category || "پیتزا") === "پیتزا";
      return `
      <div class="pizza-card reveal" style="--i:${i % 6}">
        <div class="media">
          ${isPizza ? `<span class="badge-ar">✦ مشاهده در AR</span>` : ""}
          <span>${p.emoji || "🍽️"}</span>
        </div>
        <div class="body">
          <h3>${p.name} <span class="price">${pibo_formatPrice(p.price)}</span></h3>
          <p>${p.desc || ""}</p>
          <div class="actions">
            ${isPizza ? `<a class="btn btn-outline" href="ar.html?pizza=${p.id}">مشاهده سه‌بعدی</a>` : ""}
            <button class="btn btn-primary" data-add="${p.id}">افزودن به سفارش</button>
          </div>
        </div>
      </div>
    `;
    }).join("");

    grid.querySelectorAll("[data-add]").forEach(btn => {
      btn.addEventListener("click", () => addToCart(btn.dataset.add));
    });
    initReveal();
  }

  paintTabs();
  paintGrid();
}

/* ---------- cart ---------- */
let PIBO_CART = {};

function addToCart(id){
  PIBO_CART[id] = (PIBO_CART[id] || 0) + 1;
  renderCart();
  document.getElementById("order")?.scrollIntoView({ behavior:"smooth", block:"start" });
}

function changeQty(id, delta){
  if(!PIBO_CART[id]) return;
  PIBO_CART[id] += delta;
  if(PIBO_CART[id] <= 0) delete PIBO_CART[id];
  renderCart();
}

function renderCart(){
  const list = document.querySelector("[data-cart-list]");
  const summary = document.querySelector("[data-cart-summary]");
  if(!list) return;

  const entries = Object.entries(PIBO_CART);
  if(!entries.length){
    list.innerHTML = `<div class="empty-cart">هنوز پیتزایی به سفارش اضافه نکرده‌اید — از بخش منو انتخاب کنید 🍕</div>`;
    if(summary) summary.style.display = "none";
    return;
  }

  let total = 0;
  list.innerHTML = entries.map(([id, qty]) => {
    const p = PIBO_PRODUCTS.find(x => x.id === id);
    if(!p) return "";
    total += p.price * qty;
    return `
      <div class="cart-item">
        <span class="name">${p.name}</span>
        <div class="qty">
          <button type="button" data-dec="${id}">−</button>
          <span>${qty}</span>
          <button type="button" data-inc="${id}">+</button>
        </div>
      </div>
    `;
  }).join("");

  if(summary){
    summary.style.display = "flex";
    summary.innerHTML = `<span>مبلغ کل</span><span>${pibo_formatPrice(total)}</span>`;
  }

  list.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
  list.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
}

/* ---------- order form -> WhatsApp + shared order log ---------- */
function initOrderForm(){
  renderCart();

  const form = document.querySelector("[data-order-form]");
  if(!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const entries = Object.entries(PIBO_CART);
    const name = form.querySelector("[name=name]").value.trim();
    const phone = form.querySelector("[name=phone]").value.trim();
    const address = form.querySelector("[name=address]").value.trim();
    const notes = form.querySelector("[name=notes]").value.trim();

    if(!entries.length){
      alert("لطفاً حداقل یک پیتزا از منو به سفارش اضافه کنید.");
      return;
    }
    if(!name || !phone || !address){
      alert("لطفاً نام، شماره تماس و آدرس را وارد کنید.");
      return;
    }

    let total = 0;
    const lines = entries.map(([id, qty]) => {
      const p = PIBO_PRODUCTS.find(x => x.id === id);
      total += p.price * qty;
      return `• ${p.name} × ${qty} — ${pibo_formatPrice(p.price * qty)}`;
    });

    const message = [
      "سلام پیبو 👋 سفارش جدید:",
      "",
      ...lines,
      "",
      `مبلغ کل: ${pibo_formatPrice(total)}`,
      "",
      `نام: ${name}`,
      `تماس: ${phone}`,
      `آدرس: ${address}`,
      notes ? `توضیحات: ${notes}` : ""
    ].filter(Boolean).join("\n");

    const submitBtn = form.querySelector("button[type=submit]");
    if(submitBtn) submitBtn.disabled = true;

    await saveOrderShared({
      name, phone, address, notes,
      items: entries.map(([id, qty]) => ({ id, qty })),
      total,
      date: new Date().toISOString()
    });

    if(submitBtn) submitBtn.disabled = false;

    const url = `https://wa.me/${PIBO_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  });
}

/* save the order centrally so it shows up in admin.html from any browser */
async function saveOrderShared(order){
  if(!pibo_db) return;
  try{
    await pibo_db.ref("orders").push(order);
  }catch(e){
    console.error("سفارش در پایگاه‌داده ذخیره نشد:", e);
  }
}

/* ---------- social links ---------- */
function initSocialLinks(){
  document.querySelectorAll("[data-whatsapp-link]").forEach(a => {
    a.href = `https://wa.me/${PIBO_WHATSAPP}?text=${encodeURIComponent("سلام پیبو 👋")}`;
  });
  document.querySelectorAll("[data-telegram-link]").forEach(a => {
    a.href = `https://t.me/+${PIBO_TELEGRAM}`;
  });
}

/* ---------- shared "connect the database" notice ---------- */
function pibo_setupNotice(){
  return `
    <div style="grid-column:1/-1;background:var(--cream);border:1.5px dashed var(--orange);border-radius:18px;padding:26px;text-align:center">
      <p style="font-weight:900;margin-bottom:8px">سایت هنوز به پایگاه‌داده وصل نشده</p>
      <p style="color:var(--ink-soft);font-size:.9rem;line-height:1.9;max-width:480px;margin:0 auto">
        فایل <code>js/firebase-config.js</code> هنوز مقدار پیش‌فرض دارد. طبق راهنمای README یک پروژه رایگان Firebase بسازید و مقادیر آن را جای‌گزین کنید — تا زمانی که این کار انجام نشود نه پیتزایی نمایش داده می‌شود و نه امکان افزودن پیتزا در پنل وجود دارد.
      </p>
    </div>
  `;
}

/* ---------- quick-add chips + hero QR (index.html only) ---------- */
function fillPickListAndQr(){
  const pickList = document.querySelector("[data-pick-list]");
  if(pickList){
    if(PIBO_PRODUCTS.length){
      pickList.innerHTML = PIBO_PRODUCTS.map(p => `<button type="button" class="pick-chip" data-pick="${p.id}">${p.name}</button>`).join("");
      pickList.querySelectorAll("[data-pick]").forEach(chip => chip.addEventListener("click", () => addToCart(chip.dataset.pick)));
    }else{
      pickList.innerHTML = `<span style="color:var(--ink-soft);font-size:.85rem">هنوز پیتزایی اضافه نشده</span>`;
    }
  }

  const qrHolder = document.getElementById("home-qr");
  if(qrHolder){
    const firstPizza = PIBO_PRODUCTS.find(p => (p.category || "پیتزا") === "پیتزا");
    if(firstPizza){
      const url = location.href.replace(/index\.html.*$/, "").replace(/\/?$/, "/") + `ar.html?pizza=${firstPizza.id}`;
      qrHolder.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(url)}" width="160" height="160" alt="کد QR مشاهده سه‌بعدی">`;
    }else{
      qrHolder.innerHTML = `<span style="color:var(--ink-soft);font-size:.85rem;padding:20px">پس از افزودن یک پیتزا، کد QR اینجا نمایش داده می‌شود</span>`;
    }
  }
}
