/* =====================================================================
   PIBO · app.js
   Header, drawer, segmented tabs + scroll-spy, menu rendering,
   card parallax, reveal-on-scroll, FAQ, contact, toast.
   ===================================================================== */
window.PIBO = window.PIBO || {};

(function () {
    const $  = (s, r) => (r || document).querySelector(s);
    const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

    /* =================================================================
       TOAST
       ================================================================= */
    let toastTimer = null;
    PIBO.toast = function (msg, type) {
        const old = $('.toast');
        if (old) old.remove();
        clearTimeout(toastTimer);

        const t = document.createElement('div');
        t.className = 'toast' + (type === 'error' ? ' err' : '');
        t.innerHTML = `<span class="toast-ico">${type === 'error' ? '!' : '✓'}</span><span></span>`;
        t.lastElementChild.textContent = msg;
        document.body.appendChild(t);

        requestAnimationFrame(() => t.classList.add('show'));
        toastTimer = setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 450);
        }, 2600);
    };

    /* =================================================================
       HEADER + DRAWER
       ================================================================= */
    function initHeader() {
        const header = $('#siteHeader');
        const toggle = $('#navToggle');
        const drawer = $('#mobileNav');
        const close  = $('#navClose');

        if (header) {
            const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 16);
            window.addEventListener('scroll', onScroll, { passive: true });
            onScroll();
        }

        if (!toggle || !drawer) return;

        const setOpen = open => {
            drawer.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
        };

        toggle.addEventListener('click', e => { e.stopPropagation(); setOpen(!drawer.classList.contains('open')); });
        close && close.addEventListener('click', () => setOpen(false));
        $$('a', drawer).forEach(a => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('click', e => {
            if (!drawer.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    }

    /* =================================================================
       MENU RENDERING
       ================================================================= */
    function cardHTML(p) {
        const ar   = PIBO.hasAR(p);
        const out  = p.available === false;
        const img  = p.image || '';
        const size = p.size ? `<small style="opacity:.75">${p.size}</small>` : '';

        return `
        <article class="pizza-card reveal" data-id="${p.id}" style="--i:0">
            <div class="media">
                <img src="${img}" alt="${p.name}" loading="lazy" decoding="async">
            </div>
            ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
            ${ar ? `<span class="card-ar-badge">🥽 سه‌بعدی</span>` : ''}
            ${out ? `<div class="card-out">تمام شد</div>` : ''}
            <div class="card-overlay">
                <div class="co-top">
                    <span class="co-name">${p.name}</span>
                    <span class="co-price">${PIBO.fmt(p.price)}<small>تومان</small></span>
                </div>
                <p class="co-desc">${p.description || ''} ${size}</p>
                <div class="co-actions">
                    ${ar ? `<a class="co-btn co-btn-ar" href="ar.html?id=${encodeURIComponent(p.id)}">🥽 مشاهده سه‌بعدی</a>` : ''}
                    <button class="co-btn co-btn-add" data-add="${p.id}" ${out ? 'disabled style="opacity:.5"' : ''}>افزودن +</button>
                </div>
            </div>
        </article>`;
    }

    function renderMenu() {
        const body = $('#menuBody');
        const tabs = $('#menuTabs');
        if (!body || !tabs) return;

        const cats = PIBO.activeCategories();

        if (!cats.length) {
            body.innerHTML = '<div class="empty-state"><div class="es-ico">📭</div><p>هنوز محصولی ثبت نشده است.</p></div>';
            return;
        }

        // tabs (indicator stays as first child)
        const indicator = $('#tabsIndicator');
        tabs.innerHTML = '';
        if (indicator) tabs.appendChild(indicator);
        cats.forEach((c, i) => {
            const b = document.createElement('button');
            b.className = 'menu-tab' + (i === 0 ? ' active' : '');
            b.dataset.cat = c.id;
            b.setAttribute('role', 'tab');
            b.innerHTML = `<span class="t-icon">${c.icon || '🍽️'}</span>${c.name}<span class="t-count">${PIBO.toFa(PIBO.byCategory(c.id).length)}</span>`;
            tabs.appendChild(b);
        });

        // category blocks
        body.innerHTML = cats.map(c => `
            <section class="cat-block" id="cat-${c.id}" data-cat="${c.id}">
                <h3 class="cat-title reveal"><span class="c-ico">${c.icon || '🍽️'}</span>${c.name}</h3>
                <div class="card-grid stagger">
                    ${PIBO.byCategory(c.id).map(cardHTML).join('')}
                </div>
            </section>
        `).join('');

        // stagger index per grid
        $$('.card-grid').forEach(g => $$('.pizza-card', g).forEach((c, i) => c.style.setProperty('--i', i % 6)));

        wireTabs();
        wireAddButtons();
        observeReveals();
        requestAnimationFrame(() => { moveIndicator($('.menu-tab.active')); parallax(); });
    }

    /* =================================================================
       SEGMENTED TABS — indicator + scroll-spy
       ================================================================= */
    function moveIndicator(tab) {
        const ind = $('#tabsIndicator');
        if (!ind || !tab) return;
        // offsetLeft is physical-left based and relative to .menu-tabs (position:relative),
        // so this stays correct in RTL and scrolls together with the strip.
        ind.style.width = tab.offsetWidth + 'px';
        ind.style.transform = `translateX(${tab.offsetLeft}px)`;
    }

    let spyLock = false;

    function setActiveTab(catId, scrollTabIntoView) {
        const tabs = $$('.menu-tab');
        const tab = tabs.find(t => t.dataset.cat === catId);
        if (!tab || tab.classList.contains('active')) { moveIndicator(tab); return; }
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        moveIndicator(tab);
        if (scrollTabIntoView) tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    function wireTabs() {
        $$('.menu-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = document.getElementById('cat-' + tab.dataset.cat);
                setActiveTab(tab.dataset.cat, true);
                spyLock = true;                       // don't fight the smooth scroll
                setTimeout(() => { spyLock = false; }, 700);
                target && target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // scroll-spy across category blocks
        const blocks = $$('.cat-block');
        if (!blocks.length) return;

        const spy = new IntersectionObserver(entries => {
            if (spyLock) return;
            const visible = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) setActiveTab(visible.target.dataset.cat, true);
        }, {
            rootMargin: '-45% 0px -45% 0px',
            threshold: [0, .01, .25, .5]
        });
        blocks.forEach(b => spy.observe(b));

        window.addEventListener('resize', () => moveIndicator($('.menu-tab.active')), { passive: true });
        // re-measure once webfonts settle, otherwise the pill can be a few px off
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => moveIndicator($('.menu-tab.active')));
        }
    }

    /* =================================================================
       ADD TO CART
       ================================================================= */
    function wireAddButtons() {
        $$('[data-add]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.add;
                const card = btn.closest('.pizza-card');
                PIBO.cart.add(id, { fromCard: card });
            });
        });
    }

    /* =================================================================
       CARD PARALLAX — throttled to one rAF per scroll frame
       ================================================================= */
    let parallaxTicking = false;
    function parallax() {
        const vh = window.innerHeight;
        $$('.pizza-card').forEach(card => {
            const r = card.getBoundingClientRect();
            if (r.bottom < -160 || r.top > vh + 160) return;
            const centreDelta = (r.top + r.height / 2) - vh / 2;
            const y = Math.max(-14, Math.min(14, (centreDelta / vh) * -28));
            card.style.setProperty('--parallax-y', y.toFixed(2) + 'px');
        });
        parallaxTicking = false;
    }
    function onScrollParallax() {
        if (parallaxTicking) return;
        parallaxTicking = true;
        requestAnimationFrame(parallax);
    }

    /* =================================================================
       REVEAL ON SCROLL
       ================================================================= */
    let revealObserver = null;
    function observeReveals() {
        if (!revealObserver) {
            revealObserver = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        revealObserver.unobserve(e.target);
                    }
                });
            }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
        }
        $$('.reveal:not(.in), .reveal-scale:not(.in), .reveal-right:not(.in)')
            .forEach(el => revealObserver.observe(el));
    }

    /* =================================================================
       FAQ + CONTACT + FOOTER
       ================================================================= */
    function renderFaq() {
        const list = $('#faqList');
        if (!list) return;
        const faq = PIBO.store.faq || [];
        if (!faq.length) { list.closest('section').style.display = 'none'; return; }

        list.innerHTML = faq.map((f, i) => `
            <details class="faq-item reveal" style="--i:${i}">
                <summary>${f.q}</summary>
                <div class="faq-a">${f.a}</div>
            </details>
        `).join('');
    }

    function renderContact() {
        const grid = $('#contactGrid');
        const s = PIBO.store.settings || {};
        const phone = s.phone || '';
        const wa = (s.whatsapp || '').replace(/^0/, '');
        const tg = (s.telegram || '').replace(/^0/, '');

        if (grid) {
            const cards = [];
            if (wa)    cards.push(`<a class="contact-card reveal" style="--i:0" href="https://wa.me/98${wa}" target="_blank" rel="noopener"><span class="cc-ico wa">💬</span><span><span class="cc-t">واتس‌اپ</span><span class="cc-v">${s.whatsapp}</span></span></a>`);
            if (tg)    cards.push(`<a class="contact-card reveal" style="--i:1" href="https://t.me/+98${tg}" target="_blank" rel="noopener"><span class="cc-ico tg">✈️</span><span><span class="cc-t">تلگرام</span><span class="cc-v">${s.telegram}</span></span></a>`);
            if (phone) cards.push(`<a class="contact-card reveal" style="--i:2" href="tel:${phone}"><span class="cc-ico ph">📞</span><span><span class="cc-t">تماس تلفنی</span><span class="cc-v">${phone}</span></span></a>`);
            grid.innerHTML = cards.join('');
        }

        const fc = $('#footerContact');
        if (fc) {
            fc.innerHTML = '<h4>تماس</h4>' +
                (phone ? `<a href="tel:${phone}">📞 ${phone}</a>` : '') +
                (wa ? `<a href="https://wa.me/98${wa}" target="_blank" rel="noopener">💬 واتس‌اپ</a>` : '') +
                (tg ? `<a href="https://t.me/+98${tg}" target="_blank" rel="noopener">✈️ تلگرام</a>` : '');
        }

        const about = $('#footerAbout');
        if (about && s.about) about.textContent = s.about;
    }

    /* =================================================================
       BOOT
       ================================================================= */
    async function boot() {
        initHeader();
        observeReveals();
        window.addEventListener('scroll', onScrollParallax, { passive: true });

        try {
            await PIBO.loadStore();
        } catch (e) {
            const body = $('#menuBody');
            if (body) body.innerHTML =
                '<div class="empty-state"><div class="es-ico">📡</div>' +
                '<p>منو بارگذاری نشد. اتصال اینترنت را بررسی کن و صفحه را دوباره باز کن.</p></div>';
            document.dispatchEvent(new CustomEvent('pibo:ready'));
            return;
        }

        renderMenu();
        renderFaq();
        renderContact();
        observeReveals();

        document.dispatchEvent(new CustomEvent('pibo:ready'));
    }

    document.addEventListener('DOMContentLoaded', boot);
})();
