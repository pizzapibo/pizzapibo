/* ===========================================================
   PIBO — Firebase connection
   این پروژه از Firebase Realtime Database استفاده می‌کند تا هر
   تغییری که در پنل مدیریت انجام می‌دهید (افزودن/ویرایش/حذف پیتزا،
   سفارش‌ها) روی همه مرورگرها و دستگاه‌ها یکسان دیده شود — نه فقط
   روی همان مرورگری که تغییر را داده‌اید.

   راه‌اندازی (رایگان، ۵ دقیقه):
   ۱. به آدرس https://console.firebase.google.com بروید و یک پروژه جدید بسازید.
   ۲. از منوی سمت چپ Build → Realtime Database → Create Database را بزنید
      (منطقه هرچه باشد مشکلی ندارد).
   ۳. در تب Rules مقدار زیر را قرار دهید و Publish کنید:
      {
        "rules": { ".read": true, ".write": true }
      }
      (این حالت ساده برای شروع سریع است؛ چون پنل با رمز محافظت می‌شود
      برای یک فروشگاه کوچک کفایت می‌کند.)
   ۴. از Project settings → General → Your apps → Web app یک اپ وب بسازید
      و مقادیر config را کپی کرده و در پایین همین فایل جای‌گزین کنید.
   ۵. فایل را ذخیره و روی گیت‌هاب Push کنید.

   تا وقتی این مقادیر را جای‌گزین نکنید، سایت هیچ پیتزایی نشان نمی‌دهد
   و در پنل پیام خطای اتصال می‌بینید — چون هیچ داده پیش‌فرضی در پروژه
   ذخیره نشده است.
=========================================================== */
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "PASTE_YOUR_PROJECT",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

let pibo_db = null;
try{
  firebase.initializeApp(firebaseConfig);
  pibo_db = firebase.database();
}catch(e){
  console.error("Firebase غیرفعال است — مقادیر firebase-config.js را تکمیل کنید.", e);
}
