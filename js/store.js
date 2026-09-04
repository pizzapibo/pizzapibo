/* =====================================================================
   PIBO · store.js
   Loads data/store.json — the single source of truth for the whole site.
   Admin publishes this file straight to GitHub, no backend involved.
   ===================================================================== */
window.PIBO = window.PIBO || {};

PIBO.store = {
    settings: {},
    products: [],
    faq: [],
    loaded: false
};

PIBO.STORE_URL = 'data/store.json';

/* Persian digits + thousands separators */
PIBO.fmt = function (n) {
    return Number(n || 0).toLocaleString('fa-IR');
};

PIBO.toFa = function (n) {
    return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
};

PIBO.loadStore = async function () {
    try {
        const res = await fetch(PIBO.STORE_URL + '?v=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        PIBO.store.settings = data.settings || {};
        PIBO.store.products = Array.isArray(data.products) ? data.products : [];
        PIBO.store.faq      = Array.isArray(data.faq) ? data.faq : [];
        PIBO.store.loaded   = true;
        return PIBO.store;
    } catch (err) {
        console.error('[PIBO] store.json load failed:', err);
        PIBO.store.loaded = false;
        document.dispatchEvent(new CustomEvent('pibo:store-error', { detail: err }));
        throw err;
    }
};

/* Products of one category, in file order, hiding nothing (admin controls availability) */
PIBO.byCategory = function (catId) {
    return PIBO.store.products.filter(p => p.category === catId);
};

/* Categories that actually have at least one product */
PIBO.activeCategories = function () {
    const cats = PIBO.store.settings.categories || [];
    return cats.filter(c => PIBO.byCategory(c.id).length > 0);
};

PIBO.findProduct = function (id) {
    return PIBO.store.products.find(p => String(p.id) === String(id));
};

/* Does this product have a usable AR asset? */
PIBO.hasAR = function (p) {
    return !!(p && p.ar !== false && (p.modelGLB || p.modelUSDZ));
};
