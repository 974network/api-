# 🏠 نظام إدارة العقارات — دليل الإعداد

## هيكل المشروع

```
real-estate/
├── index.html          ← لوحة الإدارة (أنت ورفيقك)
├── property.html       ← صفحة العقار للعميل
├── config.js           ← الإعدادات (غيّر هنا فقط)
├── apps-script.js      ← كود Google Sheets API
├── css/
│   └── style.css       ← التصميم
└── js/
    └── app.js          ← المنطق العام
```

---

## خطوات الإعداد

### الخطوة 1 — إعداد Google Apps Script

1. افتح الشيت على Google Sheets
2. من القائمة: **Extensions → Apps Script**
3. احذف الكود الموجود وألصق محتوى ملف `apps-script.js`
4. تأكد من تغيير `SHEET_NAME` ليطابق اسم شيت المعروض عندك
5. تأكد أن أسماء الأعمدة في `COL` تطابق أعمدة الشيت
6. احفظ ثم اضغط **Deploy → New deployment**
7. اختر نوع: **Web app**
8. اختر: Execute as: **Me** — Who has access: **Anyone**
9. انسخ الرابط الناتج (Web app URL)

### الخطوة 2 — إعداد config.js

افتح `config.js` وعدّل:

```javascript
const CONFIG = {
  API_URL: "الصق رابط Apps Script هنا",
  SITE_NAME: "اسم مكتبك",
  SITE_URL: "https://اسمك.netlify.app",
  WHATSAPP_NUMBER: "97455555555",
};
```

### الخطوة 3 — رفع على Netlify

1. اذهب إلى [netlify.com](https://netlify.com) وسجّل دخول
2. اضغط **Add new site → Deploy manually**
3. اسحب مجلد `real-estate` كاملاً وأفلته
4. انتظر دقيقة — سيعطيك رابطاً جاهزاً
5. حدّث `SITE_URL` في `config.js` بالرابط الجديد ثم أعد الرفع

---

## كيفية مشاركة عقار مع العميل

1. افتح `index.html` (لوحة الإدارة)
2. ابحث عن العقار المطلوب
3. اضغط زر **📤 مشاركة**
4. سيفتح واتساب مع رابط العقار جاهز للإرسال

رابط العقار سيكون بهذا الشكل:
```
https://اسمك.netlify.app/property.html?id=PR-0001
```

---

## تهيئة أعمدة الشيت

تأكد أن الصف الأول في شيت المعروض يحتوي على هذه الأعمدة بالضبط:

| ID | النوع | الحالة | الموقع | الإيجار | الدور | مفروشة | موقف | اسم المالك | هاتف المالك | واتساب المالك | الصور | ملاحظات |

---

## الصور

- ارفع الصور على Google Drive
- شارك كل صورة: **Anyone with the link can view**
- انسخ الرابط وضعه في عمود الصور، مفصولاً بفاصلة لو عندك أكثر من صورة

مثال:
```
https://drive.google.com/file/d/ABC123/view, https://drive.google.com/file/d/XYZ789/view
```
