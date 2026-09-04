# PIBO — Italian Heart, Napolitan Soul

پیتزافروشی PIBO. سایت static (HTML/CSS/JS خالص، بدون فریم‌ورک)، فارسی و RTL، قابل نصب به‌عنوان PWA.

## ساختار

```
index.html          صفحه‌ی اصلی / منو
ar.html             نمایش سه‌بعدی و واقعیت‌افزوده (?id=<product-id>)
admin.html          پنل مدیریت (محافظت‌شده با رمز)
data/store.json     تنها منبع داده — محصولات، دسته‌بندی‌ها، تنظیمات، سوالات
css/style.css       سیستم طراحی Liquid Glass
js/store.js         بارگذاری store.json + helperها
js/cart.js          سبد خرید (localStorage) + odometer + fly-to-cart
js/app.js           هدر، تب‌ها، رندر منو، پارالاکس، reveal، FAQ
js/ios-glass.js     فشردگی فنری سراسری + shake
js/admin.js         پنل ادمین + انتشار روی GitHub
js/install-prompt.js  راهنمای نصب PWA
js/vpn-hint.js      هشدار فیلترینگ
models/             فایل‌های GLB / USDZ
icons/              آیکون‌های PWA
```

## داده

همه‌چیز از `data/store.json` می‌آید. پنل ادمین این فایل را با GitHub Contents API
مستقیماً کامیت می‌کند — هیچ بک‌اندی در کار نیست.

## AR

- **اندروید:** فایل `.glb` → Scene Viewer با `intent://` و `mode=ar_only`
- **آیفون:** فایل `.usdz` → Quick Look با `<a rel="ar">` که یک `<img>` واقعی به‌عنوان فرزند دارد (الزام اپل)
- فایل‌ها را در `models/` بگذارید و مسیرشان را در فرم محصول وارد کنید.

## اجرای محلی

```bash
python3 -m http.server 8080
```

## انتشار

GitHub Pages روی برنچ اصلی. برای انتشار تغییرات منو کافی است در پنل ادمین
دکمه‌ی «انتشار روی گیت‌هاب» را بزنید.
