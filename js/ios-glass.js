/* =====================================================================
   PIBO · ios-glass.js
   Global iOS-style press feedback + shared shake helper.
   Adds .is-pressed on pointerdown, removes on up/leave/cancel.
   ===================================================================== */
window.PIBO = window.PIBO || {};

(function () {
    const PRESSABLE = [
        '.btn', '.icon-btn', '.menu-tab', '.pizza-card', '.co-btn',
        '.q-btn', '.sticky-cart-summary', '.contact-card', '.feat',
        '.ios-switch', '.ar-launch-btn', '.mn-close', '.faq-item summary',
        '.hero-stat', '.admin-tab', '.btn-icon', '.mobile-nav a'
    ].join(',');

    let pressed = null;

    function down(e) {
        const el = e.target.closest(PRESSABLE);
        if (!el || el.hasAttribute('disabled')) return;
        pressed = el;
        el.classList.add('is-pressed');
    }
    function up() {
        if (!pressed) return;
        pressed.classList.remove('is-pressed');
        pressed = null;
    }

    document.addEventListener('pointerdown', down, { passive: true });
    document.addEventListener('pointerup', up, { passive: true });
    document.addEventListener('pointercancel', up, { passive: true });
    document.addEventListener('pointerleave', up, { passive: true });
    window.addEventListener('blur', up);

    /* shared shake for invalid actions */
    PIBO.shake = function (el) {
        if (!el) return;
        el.classList.remove('shake-x');
        void el.offsetWidth;          // restart the animation
        el.classList.add('shake-x');
        setTimeout(() => el.classList.remove('shake-x'), 500);
    };
    window.pibo_shake = PIBO.shake;
})();
