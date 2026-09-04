/* =====================================================================
   PIBO · install-prompt.js
   Android/Chrome → native beforeinstallprompt.
   iOS Safari → manual Share ▸ Add to Home Screen hint (no API exists).
   Shown once per browser.
   ===================================================================== */
(function () {
    const KEY = 'pibo_install_hint_v1';
    let deferred = null;

    const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    if (standalone) return;

    function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } }
    function markSeen() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }

    function sheet(title, body, actions) {
        const s = document.createElement('div');
        s.className = 'hint-sheet';
        s.innerHTML = `<h4>${title}</h4><p>${body}</p><div class="hint-actions"></div>`;
        const bar = s.querySelector('.hint-actions');
        actions.forEach(a => {
            const b = document.createElement('button');
            b.className = 'btn ' + (a.primary ? 'btn-primary' : 'btn-glass');
            b.textContent = a.label;
            b.addEventListener('click', () => { a.onClick && a.onClick(); dismiss(s); });
            bar.appendChild(b);
        });
        document.body.appendChild(s);
        requestAnimationFrame(() => s.classList.add('show'));
        return s;
    }
    function dismiss(s) {
        s.classList.remove('show');
        setTimeout(() => s.remove(), 700);
        markSeen();
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferred = e;
        if (seen()) return;
        setTimeout(() => {
            sheet('پیبو را نصب کن 🍕', 'برای دسترسی سریع‌تر، سایت را مثل یک اپلیکیشن روی گوشی نصب کن.', [
                { label: 'بعداً' },
                { label: 'نصب کن', primary: true, onClick: async () => {
                    if (!deferred) return;
                    deferred.prompt();
                    await deferred.userChoice;
                    deferred = null;
                }}
            ]);
        }, 6000);
    });

    // iOS Safari has no install API — tell the user how to do it manually
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

    if (isIOS && isSafari && !seen()) {
        window.addEventListener('load', () => setTimeout(() => {
            sheet('پیبو را به هوم‌اسکرین اضافه کن 🍕',
                  'دکمه‌ی «اشتراک‌گذاری» پایین سافاری را بزن و بعد «Add to Home Screen» را انتخاب کن.',
                  [{ label: 'باشه، فهمیدم', primary: true }]);
        }, 7000));
    }
})();
