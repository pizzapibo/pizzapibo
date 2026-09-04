/* =====================================================================
   PIBO · cart.js
   localStorage cart + sticky sheet + odometer total + fly-to-cart.
   Storage key: pibo_cart_v1 → { id: { name, price, qty } }
   ===================================================================== */
window.PIBO = window.PIBO || {};

(function () {
    const KEY = 'pibo_cart_v1';

    let cart = {};
    let lastTotal = 0;
    let lastRenderedTotal = null;
    let peekTimer = null;
    let justAddedId = null;

    /* ---------- persistence ---------- */
    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            cart = raw ? JSON.parse(raw) : {};
            if (typeof cart !== 'object' || cart === null) cart = {};
        } catch (e) { cart = {}; }
    }
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    }

    /* ---------- derived ---------- */
    function count() { return Object.values(cart).reduce((s, i) => s + i.qty, 0); }
    function total() { return Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0); }
    function isEmpty() { return count() === 0; }

    /* ---------- DOM refs (resolved lazily; some pages have no cart) ---------- */
    const el = {};
    function refs() {
        el.bar    = el.bar    || document.getElementById('stickyCart');
        el.scrim  = el.scrim  || document.getElementById('cartScrim');
        el.icon   = el.icon   || document.getElementById('scsIcon');
        el.badge  = el.badge  || document.getElementById('scsBadge');
        el.totalE = el.totalE || document.getElementById('scsTotal');
        el.rows   = el.rows   || document.getElementById('cartRows');
        el.send   = el.send   || document.getElementById('sendOrder');
        el.clear  = el.clear  || document.getElementById('clearCart');
        return el.bar;
    }

    /* =================================================================
       ODOMETER
       Count up with ease-out cubic, then split the number into per-char
       spans so only the characters that actually changed slide in.
       ================================================================= */
    function renderOdometer(node, value) {
        const faNum = PIBO.fmt(value);
        const prev  = lastRenderedTotal === null ? '' : PIBO.fmt(lastRenderedTotal);

        const bdi = document.createElement('bdi');
        bdi.style.unicodeBidi = 'isolate';

        for (let i = 0; i < faNum.length; i++) {
            const s = document.createElement('span');
            s.className = 'odo-char';
            s.textContent = faNum[i];
            // align comparison from the right (least-significant side)
            const prevChar = prev[prev.length - faNum.length + i];
            if (prevChar !== faNum[i]) {
                s.classList.add('odo-in');
                s.style.animationDelay = (faNum.length - 1 - i) * 22 + 'ms';
            }
            bdi.appendChild(s);
        }

        node.innerHTML = '';
        node.appendChild(bdi);
        node.appendChild(document.createTextNode(' تومان'));
        lastRenderedTotal = value;
    }

    function animateNumber(node, from, to, dur) {
        if (!node) return;
        if (from === to) { renderOdometer(node, to); return; }
        const t0 = performance.now();
        dur = dur || 450;

        function step(now) {
            const p = Math.min(1, (now - t0) / dur);
            const e = 1 - Math.pow(1 - p, 3);           // ease-out cubic
            const v = Math.round(from + (to - from) * e);
            node.textContent = PIBO.fmt(v) + ' تومان';   // cheap during the count
            if (p < 1) {
                requestAnimationFrame(step);
            } else {
                renderOdometer(node, to);                // odometer only at rest
            }
        }
        requestAnimationFrame(step);
    }
    PIBO.animateNumber = animateNumber;

    /* =================================================================
       RENDER
       ================================================================= */
    function renderRows() {
        if (!el.rows) return;
        const ids = Object.keys(cart);

        if (!ids.length) {
            el.rows.innerHTML = '<div class="cart-empty">سبد خالی است — یک پیتزا انتخاب کن 🍕</div>';
            return;
        }

        el.rows.innerHTML = ids.map(id => {
            const it = cart[id];
            const pop = (id === justAddedId) ? ' just-added' : '';
            return `
            <div class="cart-row${pop}" data-row="${id}">
                <span class="cr-name">${it.name}</span>
                <span class="cr-price">${PIBO.fmt(it.price * it.qty)}</span>
                <span class="cr-qty">
                    <button class="q-btn" data-dec="${id}" aria-label="کم کردن">−</button>
                    <b>${PIBO.toFa(it.qty)}</b>
                    <button class="q-btn" data-inc="${id}" aria-label="زیاد کردن">+</button>
                </span>
            </div>`;
        }).join('');

        justAddedId = null;   // one-shot class
    }

    function buildOrderLink() {
        if (!el.send) return;
        const s = PIBO.store.settings || {};
        const lines = Object.values(cart).map(i => `• ${i.name} × ${PIBO.toFa(i.qty)} — ${PIBO.fmt(i.price * i.qty)} تومان`);
        const text = `سلام PIBO 🍕%0A%0Aسفارش من:%0A${lines.join('%0A')}%0A%0Aجمع کل: ${PIBO.fmt(total())} تومان`;
        const wa = (s.whatsapp || '').replace(/^0/, '');
        el.send.href = wa ? `https://wa.me/98${wa}?text=${text}` : '#contact';
    }

    function render(opts) {
        if (!refs()) return;
        opts = opts || {};

        const n = count();
        const t = total();
        const wasEmpty = lastTotal === 0 && !el.bar.classList.contains('show');

        if (el.badge) el.badge.textContent = PIBO.toFa(n);

        // bar visibility
        el.bar.classList.toggle('show', n > 0);
        document.body.classList.toggle('has-cart', n > 0);
        if (n === 0) closePanel();

        // cart icon morph — only on the empty → non-empty transition
        if (opts.morph && wasEmpty && n > 0 && el.icon) {
            el.icon.classList.remove('morph');
            void el.icon.offsetWidth;
            el.icon.classList.add('morph');
        }

        animateNumber(el.totalE, lastTotal, t, 450);
        lastTotal = t;

        renderRows();
        buildOrderLink();
        save();
    }

    /* =================================================================
       PANEL open / close / peek
       ================================================================= */
    function openPanel() {
        if (!refs()) return;
        el.bar.classList.add('open');
        el.scrim && el.scrim.classList.add('show');
        const sum = el.bar.querySelector('[data-cart-toggle]');
        sum && sum.setAttribute('aria-expanded', 'true');
    }
    function closePanel() {
        if (!el.bar) return;
        el.bar.classList.remove('open');
        el.scrim && el.scrim.classList.remove('show');
        const sum = el.bar.querySelector('[data-cart-toggle]');
        sum && sum.setAttribute('aria-expanded', 'false');
    }
    function togglePanel() {
        if (!refs()) return;
        el.bar.classList.contains('open') ? closePanel() : openPanel();
    }

    /* auto-peek: flash the panel open for 1.4s so you see what landed */
    function flashNewestCartItem() {
        if (!refs()) return;
        if (el.bar.classList.contains('open')) return;
        openPanel();
        clearTimeout(peekTimer);
        peekTimer = setTimeout(closePanel, 1400);
    }
    PIBO.flashNewestCartItem = flashNewestCartItem;

    function bounceCartBar() {
        if (!refs()) return;
        el.bar.classList.remove('bounce');
        void el.bar.offsetWidth;
        el.bar.classList.add('bounce');
        setTimeout(() => el.bar.classList.remove('bounce'), 520);
    }
    PIBO.bounceCartBar = bounceCartBar;

    /* =================================================================
       FLY TO CART
       Clone the card's .media (real product photo) and shrink it into
       the cart bar, morphing to a 46px circle on the way.
       ================================================================= */
    function flyToCart(cardEl) {
        if (!cardEl || !refs()) return;
        const media = cardEl.querySelector('.media');
        const target = el.icon;
        if (!media || !target) return;

        const a = media.getBoundingClientRect();
        const b = target.getBoundingClientRect();

        const clone = document.createElement('div');
        clone.className = 'fly-clone';
        clone.style.left   = a.left + 'px';
        clone.style.top    = a.top + 'px';
        clone.style.width  = a.width + 'px';
        clone.style.height = a.height + 'px';

        const img = media.querySelector('img');
        if (img) {
            const c = document.createElement('img');
            c.src = img.currentSrc || img.src;
            c.alt = '';
            clone.appendChild(c);
        }
        document.body.appendChild(clone);

        // force layout so the transition actually runs
        void clone.offsetWidth;

        const scale = 46 / Math.max(a.width, 1);
        const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
        const dy = (b.top + b.height / 2) - (a.top + a.height / 2);

        clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        clone.style.opacity = '.35';
        clone.style.borderRadius = '50%';

        setTimeout(() => {
            clone.remove();
            bounceCartBar();
            flashNewestCartItem();
        }, 700);
    }
    PIBO.flyToCart = flyToCart;

    /* =================================================================
       PUBLIC API
       ================================================================= */
    PIBO.cart = {
        add(id, opts) {
            const p = PIBO.findProduct(id);
            if (!p) return;
            opts = opts || {};

            if (cart[id]) cart[id].qty++;
            else cart[id] = { name: p.name, price: Number(p.price) || 0, qty: 1 };

            justAddedId = String(id);
            render({ morph: true });

            if (opts.fromCard) flyToCart(opts.fromCard);
            else { bounceCartBar(); flashNewestCartItem(); }
        },
        inc(id) { if (cart[id]) { cart[id].qty++; justAddedId = null; render(); } },
        dec(id) {
            if (!cart[id]) return;
            cart[id].qty--;
            if (cart[id].qty <= 0) delete cart[id];
            render();
        },
        remove(id) { delete cart[id]; render(); },
        clear() { cart = {}; render(); },
        count, total, isEmpty,
        items() { return JSON.parse(JSON.stringify(cart)); },
        open: openPanel,
        close: closePanel
    };

    /* =================================================================
       WIRING
       ================================================================= */
    document.addEventListener('DOMContentLoaded', () => {
        load();
        if (!refs()) return;

        // toggle
        const sum = el.bar.querySelector('[data-cart-toggle]');
        if (sum) {
            sum.addEventListener('click', togglePanel);
            sum.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(); }
            });
        }
        el.scrim && el.scrim.addEventListener('click', closePanel);

        // qty buttons (delegated)
        el.rows && el.rows.addEventListener('click', e => {
            const dec = e.target.closest('[data-dec]');
            const inc = e.target.closest('[data-inc]');
            if (dec) { clearTimeout(peekTimer); PIBO.cart.dec(dec.dataset.dec); }
            if (inc) { clearTimeout(peekTimer); PIBO.cart.inc(inc.dataset.inc); }
        });

        el.clear && el.clear.addEventListener('click', () => {
            PIBO.cart.clear();
            PIBO.toast && PIBO.toast('سبد خالی شد');
        });

        document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

        // first paint once products are known (prices come from store.json)
        document.addEventListener('pibo:ready', () => render());
        render();
    });
})();
