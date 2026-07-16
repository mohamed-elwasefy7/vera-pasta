# VERA PASTA — Flagship Digital Experience

تجربة منيو رقمية فاخرة — موبايل أولاً، عربي/إنجليزي مع RTL كامل، كل طبق شاشة كاملة بأسلوب snap (سحبة واحدة = طبق واحد).

Vanilla HTML/CSS/JS + GSAP. بدون frameworks. بدون build step.

---

## 🚀 التشغيل (Run it)

الموقع يحتاج سيرفر محلي (فتح `index.html` مباشرة لن يعمل — المتصفحات تمنع ES modules و`fetch` على `file://`).

**أسهل طريقة:** دبل كليك على `start.bat`

أو يدوياً من داخل مجلد المشروع:

```bash
python -m http.server 4173
# أو
npx serve -l 4173 .
```

ثم افتح: `http://localhost:4173`

---

## 🍝 إضافة / تعديل طبق (خطوتان فقط)

1. أضف object جديد في `data/menu.json` تحت `dishes` (انسخ أي طبق وعدّله).
2. ضع صورة الطبق في `assets/images/dishes/` باسم مطابق لحقل `image`.

**بدون أي تعديل في HTML أو JavaScript.**

### قواعد الصور

- حقل `"image"` في JSON = اسم الملف **بدون امتداد** وبحروف صغيرة: `"image": "pollo-alfredo"`
- الصيغ المدعومة (بترتيب الأفضلية التلقائي): `avif` ← `webp` ← `jpg` ← `png` ← `svg`
- ضع نسخة أفضل (مثلاً `.avif` بجانب `.jpg` الموجودة) وستُستخدم تلقائياً في الزيارة التالية
- لو الصورة غير موجودة نهائياً يظهر placeholder أنيق بألوان البراند — الموقع لا ينكسر أبداً
- نسخة `-sm` اختيارية للموبايل (مثل `pollo-alfredo-sm.webp`) — تُستخدم تلقائياً لو وجدت

### ضغط الصور (مهم للأداء)

الصور الأصلية بحجم 10MB+ يجب ضغطها. السكريبت الجاهز:

```bash
python tools/optimize-images.py
```

يقرأ من مجلد صور المصدر (المسار داخل السكريبت) ويكتب WebP + JPEG + AVIF مضغوطة بحجمين. شغّله مرة بعد كل إضافة/تغيير صورة.

### حقول الطبق

| الحقل | الوظيفة |
|---|---|
| `name`, `description`, `ingredients` | ثنائية اللغة: `{"en": "...", "ar": "..."}` |
| `subtitle` | سطر إيطالي (يبقى لاتيني في العربي — مقصود) |
| `background` | جو الشاشة: `cream` `sage` `rose` `olive` `terracotta` `espresso` |
| `presentation` | `plate` (دائري) أو `card` (زوايا مستديرة — للبوكسات) |
| `available` | `false` = يختفي من المنيو فوراً |
| `chefChoice` / `vegetarian` / `spicy` | البادجات |
| `orderLinks` | روابط جاهز/هنقرستيشن/كيتا للطبق (تتجاوز روابط المطعم العامة) |

### بيانات المطعم

في `menu.json` تحت `restaurant`: روابط الطلب العامة، إنستجرام، واتساب، الموقع، المواعيد.
**⚠️ استبدل كل `REPLACE_ME` بالروابط الحقيقية** — الروابط غير المستبدلة تُخفى تلقائياً.

### نصوص الواجهة

كل نصوص الأزرار والعناوين في `data/i18n.json` (عربي + إنجليزي).

---

## 🏗️ قرارات معمارية (ADR)

**لماذا لا يوجد Lenis؟** Lenis يحاكي التمرير بتحويل المحتوى مع تثبيت الـ scroll الحقيقي، وهذا يكسر `scroll-snap-type` تماماً. كل شاشة هنا صفحة snap — لا يوجد محتوى طويل يستفيد من Lenis. بديله: GSAP Observer يعترض عجلة الماوس على الديسكتوب ويعمل tween لصفحة واحدة بالضبط (نفس إحساس الفخامة)، واللمس native بالكامل (أداء 60fps مضمون).

**لماذا probe للامتدادات بدلاً من `<picture>`؟** عنصر `<picture>` لا يتجاوز ملف 404 — يعرض صورة مكسورة. الـ probe يجرب الصيغ بالترتيب ويستخدم أول ملف موجود، وهذا ما يسمح باستبدال الصور بمجرد رمي الملف في المجلد.

**التقنيات:** CSS Scroll Snap (اللمس) · GSAP + ScrollTrigger + Observer (الأنيميشن والديسكتوب) · IntersectionObserver (تتبع الشاشة النشطة + lazy loading) · localStorage (المفضلة واللغة) · native `<dialog>` (نافذة الطلب).

---

## 📱 الميزات

- 12 شاشة snap: Hero → 6 باستا → 2 سلطة → PastaNine Box → المشروبات → الخاتمة
- خلفية الجو تتغير مع كل طبق (crossfade على الـ compositor — بدون jank)
- عربي/إنجليزي بزر واحد، RTL كامل، اللغة محفوظة
- خطوط: Playfair Display + Cormorant + Inter (EN) · Amiri + IBM Plex Sans Arabic (AR)
- مفضلة (قلب) محفوظة محلياً · مشاركة (native share / نسخ رابط) · deep-links لكل طبق (`#gamberi-rosa`)
- Reduced motion كامل · كيبورد كامل · screen reader announcements
- Lazy loading + preload للطبق التالي فقط

## 🗺️ خارطة الطريق الجاهزة

- **منيو موسمي:** أضف حقل `season` وفلتر في `menu.js`
- **PWA:** أضف manifest + service worker (البنية جاهزة — static بالكامل)
- **CMS خارجي:** استبدل `fetch("data/menu.json")` برابط API بنفس الـ schema
