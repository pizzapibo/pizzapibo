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
