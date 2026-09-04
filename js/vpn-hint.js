/* =====================================================================
   PIBO · vpn-hint.js
   If Google Fonts / model-viewer fail to load (filtering), suggest a VPN
   instead of leaving the user with a silently broken page.
   ===================================================================== */
(function () {
    const KEY = 'pibo_vpn_hint_v1';
    let shown = false;

    function seen() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return true; } }
    function markSeen() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }

    function show(reason) {
        if (shown || seen()) return;
        shown = true;
        markSeen();

        const s = document.createElement('div');
        s.className = 'hint-sheet';
        s.innerHTML = `
            <h4>بخشی از سایت بارگذاری نشد</h4>
            <p>${reason} احتمالاً به‌خاطر محدودیت دسترسی است. با روشن کردن VPN دوباره امتحان کن.</p>
            <div class="hint-actions">
                <button class="btn btn-glass" data-x>بستن</button>
                <button class="btn btn-primary" data-r>تلاش دوباره</button>
            </div>`;
        document.body.appendChild(s);
        requestAnimationFrame(() => s.classList.add('show'));

        s.querySelector('[data-x]').addEventListener('click', () => {
            s.classList.remove('show');
            setTimeout(() => s.remove(), 700);
        });
        s.querySelector('[data-r]').addEventListener('click', () => location.reload());
    }

    // 1) Google Fonts
    if (document.fonts && document.fonts.ready) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const ok = Array.from(document.fonts).some(f => /Vazirmatn/i.test(f.family) && f.status === 'loaded');
                if (!ok) show('فونت فارسی سایت لود نشد.');
            }, 4000);
        });
    }

    // 2) model-viewer (AR page only)
    window.addEventListener('load', () => {
        if (!document.querySelector('model-viewer')) return;
        setTimeout(() => {
            if (!customElements.get('model-viewer')) show('کتابخانه‌ی نمایش سه‌بعدی لود نشد.');
        }, 6000);
    });
})();
