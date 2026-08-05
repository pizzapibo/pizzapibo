/* ===========================================================
   PIBO — main.js
=========================================================== */
const PIBO_WHATSAPP = "989140909878";
const PIBO_TELEGRAM  = "989140909878";

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileNav();
  initReveal();
  renderMenu();
  initOrderForm();
  initSocialLinks();
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
function renderMenu(){
  const grid = document.querySelector("[data-menu-grid]");
  if(!grid || typeof PIBO_PRODUCTS === "undefined") return;
  grid.innerHTML = PIBO_PRODUCTS.map((p,i) => `
    <div class="pizza-card reveal" style="--i:${i % 6}">
      <div class="media">
        <span class="badge-ar">✦ مشاهده در AR</span>
        <span>${p.emoji}</span>
      </div>
      <div class="body">
        <h3>${p.name} <span class="price">${pibo_formatPrice(p.price)}</span></h3>
        <p>${p.desc}</p>
        <div class="actions">
          <a class="btn btn-outline" href="ar.html?pizza=${p.id}">مشاهده سه‌بعدی</a>
          <button class="btn btn-primary" data-add="${p.id}">افزودن به سفارش</button>
        </div>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });

  // re-run reveal for freshly injected cards
  initReveal();
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
  if(!list || typeof PIBO_PRODUCTS === "undefined") return;

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

/* ---------- order form -> WhatsApp ---------- */
function initOrderForm(){
  renderCart();

  document.querySelectorAll("[data-pick]").forEach(chip => {
    chip.addEventListener("click", () => addToCart(chip.dataset.pick));
  });

  const form = document.querySelector("[data-order-form]");
  if(!form) return;

  form.addEventListener("submit", (e) => {
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

    saveOrderLocally({ name, phone, address, notes, items: entries, total, date: new Date().toISOString() });

    const url = `https://wa.me/${PIBO_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  });
}

/* store the order locally so the admin panel can list recent orders on this device */
function saveOrderLocally(order){
  try{
    const key = "pibo_orders";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(order);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  }catch(e){ /* storage unavailable, skip silently */ }
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
