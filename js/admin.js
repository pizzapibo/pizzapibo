/* =====================================================================
   PIBO · admin.js
   Edits data/store.json in memory, publishes it to GitHub as a commit.
   No backend. Password gate is sessionStorage-based (obscurity, not security —
   the real gate is the GitHub token, which never leaves this browser).
   ===================================================================== */
(function () {
    const $  = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));

    const PASS = 'Arshiakamali2898';
    const SESS = 'pibo_admin_ok';
    const GH_KEY = 'pibo_gh_cfg_v1';

    let data = { settings: {}, products: [], faq: [] };
    let editingId = null;

    /* ---------------- toast ---------------- */
    let tTimer;
    function toast(msg, type) {
        const old = $('.toast'); if (old) old.remove();
        clearTimeout(tTimer);
        const t = document.createElement('div');
        t.className = 'toast' + (type === 'error' ? ' err' : '');
        t.innerHTML = `<span class="toast-ico">${type === 'error' ? '!' : '✓'}</span><span></span>`;
        t.lastElementChild.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.classList.add('show'));
        tTimer = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 450); }, 2800);
    }

    /* ---------------- auth ---------------- */
    function unlock() {
        $('#authScreen').style.display = 'none';
        $('#adminShell').style.display = 'block';
        boot();
    }

    $('#authForm').addEventListener('submit', e => {
        e.preventDefault();
        const val = $('#authPass').value;
        if (val === PASS) {
            try { sessionStorage.setItem(SESS, '1'); } catch (err) {}
            unlock();
        } else {
            $('#authErr').textContent = 'رمز عبور اشتباه است';
            $('#authPass').value = '';
            (window.pibo_shake || (() => {}))($('#authCard'));
        }
    });

    $('#logoutBtn').addEventListener('click', () => {
        try { sessionStorage.removeItem(SESS); } catch (e) {}
        location.reload();
    });

    try { if (sessionStorage.getItem(SESS) === '1') unlock(); } catch (e) {}

    /* ---------------- tabs ---------------- */
    $$('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.admin-tab').forEach(t => t.classList.remove('active'));
            $$('.pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            $('#pane-' + tab.dataset.pane).classList.add('active');
        });
    });

    /* ---------------- render ---------------- */
    function fa(n) { return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); }
    function money(n) { return Number(n || 0).toLocaleString('fa-IR'); }

    function catName(id) {
        const c = (data.settings.categories || []).find(c => c.id === id);
        return c ? c.name : id;
    }

    function renderStats() {
        $('#stProducts').textContent = fa(data.products.length);
        $('#stCats').textContent     = fa((data.settings.categories || []).length);
        $('#stAR').textContent       = fa(data.products.filter(p => p.ar && (p.modelGLB || p.modelUSDZ)).length);
        $('#stOut').textContent      = fa(data.products.filter(p => p.available === false).length);
    }

    function renderCatSelect() {
        const sel = $('#pCat');
        sel.innerHTML = (data.settings.categories || [])
            .map(c => `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`).join('');
    }

    function renderProducts() {
        const list = $('#prodList');
        if (!data.products.length) {
            list.innerHTML = '<p style="color:var(--ink-soft);padding:14px 0">هنوز محصولی ثبت نشده.</p>';
            return;
        }
        list.innerHTML = data.products.map((p, i) => `
            <div class="pitem">
                <img src="${p.image || ''}" alt="" loading="lazy">
                <div class="pi-info">
                    <b>${p.name}</b>
                    <span>${catName(p.category)} · ${money(p.price)} تومان</span>
                </div>
                <span class="pill ${p.available === false ? 'off' : 'ok'}">${p.available === false ? 'تمام' : 'موجود'}</span>
                ${p.ar && (p.modelGLB || p.modelUSDZ) ? '<span class="pill ok">AR</span>' : ''}
                <div class="pi-tools">
                    <button class="btn-icon" data-up="${i}"   aria-label="بالا">↑</button>
                    <button class="btn-icon" data-down="${i}" aria-label="پایین">↓</button>
                    <button class="btn-icon" data-edit="${p.id}" aria-label="ویرایش">✏️</button>
                    <button class="btn-icon danger" data-del="${p.id}" aria-label="حذف">🗑️</button>
                </div>
            </div>`).join('');
    }

    function renderCats() {
        const list = $('#catList');
        const cats = data.settings.categories || [];
        list.innerHTML = cats.length
            ? cats.map((c, i) => `
                <div class="pitem">
                    <div style="width:58px;height:58px;flex:0 0 58px;display:grid;place-items:center;border-radius:13px;background:var(--cream);font-size:1.5rem">${c.icon || '🍽️'}</div>
                    <div class="pi-info"><b>${c.name}</b><span>${c.id} · ${fa(data.products.filter(p => p.category === c.id).length)} محصول</span></div>
                    <div class="pi-tools">
                        <button class="btn-icon" data-cup="${i}" aria-label="بالا">↑</button>
                        <button class="btn-icon" data-cdown="${i}" aria-label="پایین">↓</button>
                        <button class="btn-icon danger" data-cdel="${c.id}" aria-label="حذف">🗑️</button>
                    </div>
                </div>`).join('')
            : '<p style="color:var(--ink-soft);padding:14px 0">دسته‌بندی‌ای وجود ندارد.</p>';
    }

    function renderFaq() {
        const list = $('#faqList');
        list.innerHTML = data.faq.length
            ? data.faq.map((f, i) => `
                <div class="pitem">
                    <div class="pi-info"><b>${f.q}</b><span>${f.a}</span></div>
                    <div class="pi-tools"><button class="btn-icon danger" data-fdel="${i}" aria-label="حذف">🗑️</button></div>
                </div>`).join('')
            : '<p style="color:var(--ink-soft);padding:14px 0">سوالی ثبت نشده.</p>';
    }

    function renderSettings() {
        const s = data.settings;
        $('#sPhone').value = s.phone || '';
        $('#sWa').value    = s.whatsapp || '';
        $('#sTg').value    = s.telegram || '';
        $('#sAbout').value = s.about || '';
    }

    function renderAll() {
        renderStats(); renderCatSelect(); renderProducts(); renderCats(); renderFaq();
    }

    /* ---------------- product form ---------------- */
    function resetForm() {
        editingId = null;
        $('#formTitle').textContent = 'افزودن محصول';
        $('#prodForm').reset();
        $('#pId').value = '';
        $('#pAvail').checked = true;
        $('#pAr').checked = false;
    }
    $('#resetForm').addEventListener('click', resetForm);

    $('#prodForm').addEventListener('submit', e => {
        e.preventDefault();
        const p = {
            id:          $('#pId').value || 'p' + Date.now().toString(36),
            name:        $('#pName').value.trim(),
            description: $('#pDesc').value.trim(),
            price:       Number($('#pPrice').value) || 0,
            category:    $('#pCat').value,
            size:        $('#pSize').value.trim(),
            image:       $('#pImage').value.trim(),
            badge:       $('#pBadge').value.trim(),
            available:   $('#pAvail').checked,
            ar:          $('#pAr').checked,
            modelGLB:    $('#pGlb').value.trim(),
            modelUSDZ:   $('#pUsdz').value.trim()
        };

        if (!p.category) { toast('اول یک دسته‌بندی بساز', 'error'); return; }

        const idx = data.products.findIndex(x => x.id === p.id);
        if (idx >= 0) data.products[idx] = p;
        else data.products.push(p);

        resetForm();
        renderAll();
        toast('ذخیره شد — یادت نرود «انتشار روی گیت‌هاب» را بزنی');
    });

    $('#prodList').addEventListener('click', e => {
        const ed = e.target.closest('[data-edit]');
        const dl = e.target.closest('[data-del]');
        const up = e.target.closest('[data-up]');
        const dn = e.target.closest('[data-down]');

        if (ed) {
            const p = data.products.find(x => x.id === ed.dataset.edit);
            if (!p) return;
            editingId = p.id;
            $('#formTitle').textContent = 'ویرایش: ' + p.name;
            $('#pId').value = p.id;
            $('#pName').value = p.name || '';
            $('#pDesc').value = p.description || '';
            $('#pPrice').value = p.price || 0;
            $('#pCat').value = p.category || '';
            $('#pSize').value = p.size || '';
            $('#pImage').value = p.image || '';
            $('#pBadge').value = p.badge || '';
            $('#pGlb').value = p.modelGLB || '';
            $('#pUsdz').value = p.modelUSDZ || '';
            $('#pAvail').checked = p.available !== false;
            $('#pAr').checked = !!p.ar;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (dl) {
            const p = data.products.find(x => x.id === dl.dataset.del);
            if (p && confirm(`«${p.name}» حذف شود؟`)) {
                data.products = data.products.filter(x => x.id !== dl.dataset.del);
                renderAll(); toast('حذف شد');
            }
        }
        if (up) {
            const i = +up.dataset.up;
            if (i > 0) { [data.products[i - 1], data.products[i]] = [data.products[i], data.products[i - 1]]; renderProducts(); }
        }
        if (dn) {
            const i = +dn.dataset.down;
            if (i < data.products.length - 1) { [data.products[i + 1], data.products[i]] = [data.products[i], data.products[i + 1]]; renderProducts(); }
        }
    });

    /* ---------------- categories ---------------- */
    $('#catForm').addEventListener('submit', e => {
        e.preventDefault();
        data.settings.categories = data.settings.categories || [];
        const id = $('#cId').value.trim().toLowerCase();
        if (data.settings.categories.some(c => c.id === id)) { toast('این شناسه قبلاً ثبت شده', 'error'); return; }
        data.settings.categories.push({ id, name: $('#cName').value.trim(), icon: $('#cIcon').value.trim() });
        $('#catForm').reset();
        renderAll();
        toast('دسته‌بندی اضافه شد');
    });

    $('#catList').addEventListener('click', e => {
        const del = e.target.closest('[data-cdel]');
        const up  = e.target.closest('[data-cup]');
        const dn  = e.target.closest('[data-cdown]');
        const cats = data.settings.categories || [];

        if (del) {
            const id = del.dataset.cdel;
            const n = data.products.filter(p => p.category === id).length;
            if (n) { toast(`اول ${fa(n)} محصول این دسته را جابه‌جا کن`, 'error'); return; }
            data.settings.categories = cats.filter(c => c.id !== id);
            renderAll(); toast('حذف شد');
        }
        if (up)  { const i = +up.dataset.cup;   if (i > 0) { [cats[i-1], cats[i]] = [cats[i], cats[i-1]]; renderCats(); renderCatSelect(); } }
        if (dn)  { const i = +dn.dataset.cdown; if (i < cats.length - 1) { [cats[i+1], cats[i]] = [cats[i], cats[i+1]]; renderCats(); renderCatSelect(); } }
    });

    /* ---------------- faq ---------------- */
    $('#faqForm').addEventListener('submit', e => {
        e.preventDefault();
        data.faq.push({ q: $('#fQ').value.trim(), a: $('#fA').value.trim() });
        $('#faqForm').reset(); renderFaq(); toast('سوال اضافه شد');
    });
    $('#faqList').addEventListener('click', e => {
        const d = e.target.closest('[data-fdel]');
        if (d) { data.faq.splice(+d.dataset.fdel, 1); renderFaq(); toast('حذف شد'); }
    });

    /* ---------------- settings ---------------- */
    $('#setForm').addEventListener('submit', e => {
        e.preventDefault();
        data.settings.phone    = $('#sPhone').value.trim();
        data.settings.whatsapp = $('#sWa').value.trim();
        data.settings.telegram = $('#sTg').value.trim();
        data.settings.about    = $('#sAbout').value.trim();
        toast('ذخیره شد — برای اعمال، «انتشار» را بزن');
    });

    /* ---------------- github ---------------- */
    function ghCfg() {
        try { return JSON.parse(localStorage.getItem(GH_KEY)) || {}; } catch (e) { return {}; }
    }
    function loadGhForm() {
        const c = ghCfg();
        $('#ghOwner').value  = c.owner  || 'pizzapibo';
        $('#ghRepo').value   = c.repo   || 'pizzapibo';
        $('#ghBranch').value = c.branch || 'main';
        $('#ghToken').value  = c.token  || '';
    }
    $('#ghSave').addEventListener('click', () => {
        const cfg = {
            owner:  $('#ghOwner').value.trim(),
            repo:   $('#ghRepo').value.trim(),
            branch: $('#ghBranch').value.trim() || 'main',
            token:  $('#ghToken').value.trim()
        };
        try { localStorage.setItem(GH_KEY, JSON.stringify(cfg)); } catch (e) {}
        toast('تنظیمات ذخیره شد');
    });

    function ghHeaders(token) {
        return {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
    }

    $('#ghTest').addEventListener('click', async () => {
        const c = ghCfg();
        const st = $('#ghStatus');
        if (!c.token || !c.owner || !c.repo) { st.textContent = '⚠️ اول تنظیمات را کامل و ذخیره کن.'; return; }
        st.textContent = '⏳ در حال تست…';
        try {
            const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}`, { headers: ghHeaders(c.token) });
            st.textContent = r.ok ? '✅ اتصال برقرار است.' : `❌ خطا: ${r.status} — توکن یا نام ریپو را بررسی کن.`;
        } catch (e) { st.textContent = '❌ خطای شبکه — شاید نیاز به VPN باشد.'; }
    });

    /* base64 that survives Persian text */
    function b64(str) {
        const bytes = new TextEncoder().encode(str);
        let bin = '';
        bytes.forEach(b => { bin += String.fromCharCode(b); });
        return btoa(bin);
    }

    $('#publishBtn').addEventListener('click', async () => {
        const c = ghCfg();
        const st = $('#ghStatus');
        if (!c.token || !c.owner || !c.repo) {
            toast('اول تب گیت‌هاب را تنظیم کن', 'error');
            $$('.admin-tab').forEach(t => t.classList.remove('active'));
            $$('.pane').forEach(p => p.classList.remove('active'));
            document.querySelector('[data-pane="github"]').classList.add('active');
            $('#pane-github').classList.add('active');
            return;
        }

        const btn = $('#publishBtn');
        btn.disabled = true;
        btn.textContent = 'در حال انتشار…';
        const path = 'data/store.json';
        const api = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${path}`;

        try {
            // current sha (needed to update an existing file)
            let sha;
            const cur = await fetch(`${api}?ref=${encodeURIComponent(c.branch)}`, { headers: ghHeaders(c.token) });
            if (cur.ok) sha = (await cur.json()).sha;

            const body = {
                message: 'admin: update store.json',
                content: b64(JSON.stringify(data, null, 2) + '\n'),
                branch: c.branch
            };
            if (sha) body.sha = sha;

            const put = await fetch(api, { method: 'PUT', headers: ghHeaders(c.token), body: JSON.stringify(body) });

            if (put.ok) {
                toast('منتشر شد ✅ چند دقیقه تا آپدیت سایت صبر کن');
                st.textContent = '✅ آخرین انتشار: ' + new Date().toLocaleString('fa-IR');
            } else {
                const err = await put.json().catch(() => ({}));
                toast('انتشار ناموفق: ' + (err.message || put.status), 'error');
                st.textContent = '❌ ' + (err.message || put.status);
            }
        } catch (e) {
            toast('خطای شبکه هنگام انتشار', 'error');
            st.textContent = '❌ خطای شبکه — شاید نیاز به VPN باشد.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'انتشار روی گیت‌هاب';
        }
    });

    $('#dlJson').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'store.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    /* ---------------- boot ---------------- */
    async function boot() {
        loadGhForm();
        try {
            await PIBO.loadStore();
            data = {
                settings: PIBO.store.settings || {},
                products: PIBO.store.products || [],
                faq:      PIBO.store.faq || []
            };
            data.settings.categories = data.settings.categories || [];
        } catch (e) {
            toast('store.json خوانده نشد — با داده‌ی خالی شروع می‌کنیم', 'error');
            data = { settings: { categories: [] }, products: [], faq: [] };
        }
        renderAll();
        renderSettings();
    }
})();
