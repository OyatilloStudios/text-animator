# Implementation Plan - Text Animator PRO Enhancements

Ushbu reja dasturni professional darajaga ko'tarish, foydalanuvchi tajribasini boyitish va yangi ilg'or funksiyalarni (GPU render, boyitilgan matn stillari, alohida so'zlarni ranglash, tizim shriftlari, transition yo'nalishlari va reklama) qo'shishni ko'zda tutadi.

---

## User Review Required

> [!IMPORTANT]
> **GPU renderlashni tanlash:** GPU orqali videoni tezkor yig'ish (encoding) avtomatik tarzda kompyuteringizdagi grafik karta drayverini (NVIDIA NVENC, Intel QSV, yoki AMD AMF) aniqlaydi. Agar grafik karta mavjud bo'lmasa, dastur avtomatik va xavfsiz tarzda CPU (libx264) rejimiga o'tadi.
>
> **Reklama va Donat ssilkalari:** Dasturchi linki sifatida `https://t.me/OyatilloErkinov` (Oyatillo Erkinov) o'rnatiladi. "Donat" ssilkasi uchun esa o'zingiz xohlagan vaqtda tahrirlashingiz uchun `App.tsx` faylida alohida o'zgaruvchi (`DONATION_URL`) qoldiramiz. Skriptni build qilganingizda, u avtomatik ravishda o'sha ssilkaga ulanadi.

---

## Proposed Changes

### 1. [Matn tuzilishi & Stillarni boyitish] `types.ts`
Dasturda yangi xususiyatlarni (text shadow, stroke, transition yo'nalishlari) saqlash uchun `TextConfig` interfeysini kengaytiramiz.
* **Qo'shiladigan maydonlar:**
  * `inDirection?: 'first' | 'last' | 'center' | 'random';` (Kirish yo'nalishi)
  * `outDirection?: 'first' | 'last' | 'center' | 'random';` (Chiqish yo'nalishi)
  * `shadowColor?: string;` (Soya rangi)
  * `shadowBlur?: number;` (Soya xiraligi)
  * `shadowOffsetX?: number;` (Soya X surilishi)
  * `shadowOffsetY?: number;` (Soya Y surilishi)
  * `strokeColor?: string;` (Kontur rangi)
  * `strokeWidth?: number;` (Kontur qalinligi)

---

### 2. [Aspect Ratio 1:1 tuzatish] [Stage.tsx](file:///d:/Oyatillo/Dasturlash/O'yinlar/text%20animator/components/Stage.tsx)
* **Muammo:** `1:1` kvadrat rejimi tanlanganda, CSS eni `width: 100%` ga tortilgani uchun balandlik ham eniga teng bo'lib ketadi va ekran balandligidan oshib ketib, flex sig'imda `16:9` kabi ezilib qoladi.
* **Yechim:** `ratioValue > 1` (gorizontal) va `ratioValue <= 1` (kvadrat yoki vertikal) shartlarini optimallashtiramiz. `1:1` rejimi `height: 100%, width: auto` qoidasiga bo'ysunadi va ekranga mukammal sig'adi.

---

### 3. [Alohida so'zlarni ranglash, soya va transitionlar] [AnimatedText.tsx](file:///d:/Oyatillo/Dasturlash/O'yinlar/text%20animator/components/AnimatedText.tsx)
* **Alohida so'z/harf ranglash:** Matnda yozilgan `<color=#ff0000>so'z</color>` shaklidagi teglarni parser yordamida ajratib olamiz. Har bir segment o'ziga xos CSS `color` xossasiga ega bo'ladi.
* **Transition yo'nalishlari:** `animejs` stagger mexanizmiga yo'nalishlarni (`from: config.inDirection` va `from: config.outDirection`) uzatamiz.
* **Soya va Kontur (Shadow & Stroke):** `styles` obyektiga `textShadow` va `-webkit-text-stroke` qoidalarini dinamik ravishda bog'laymiz.

---

### 4. [GPU Render Probing] [hd_renderer.py](file:///d:/Oyatillo/Dasturlash/O'yinlar/text%20animator/hd_renderer.py)
* Dastur ishga tushganda FFmpeg-ning qo'llab-quvvatlaydigan video-enkoderlarini tekshiramiz (`ffmpeg -encoders`).
* NVIDIA (`h264_nvenc`), Intel QuickSync (`h264_qsv`) yoki AMD (`h264_amf`) mavjudligini aniqlab, renderlash tezligini keskin oshirish uchun GPU rejimini faollashtiramiz. Topilmasa, avtomatik ravishda standart CPU (`libx264`) ga qaytadi.

---

### 5. [UI Sozlamalari, Shriftlar va Neon Banner] [Sidebar.tsx](file:///d:/Oyatillo/Dasturlash/O'yinlar/text%20animator/components/Sidebar.tsx) va [App.tsx](file:///d:/Oyatillo/Dasturlash/O'yinlar/text%20animator/App.tsx)
* **Neon Reklama bloki:** Sidebar ning pastki qismiga chiroyli yorug'lik effektiga ega neon kontur ichida dasturchi **"Oyatillo Erkinov"** (bosganda Telegram-ga kiradi) va **"Donat"** havolalarini joylashtiramiz.
* **Tizim shriftlari (Local Fonts):** Brauzerning `navigator.queryLocalFonts()` funksiyasi orqali kompyuterdagi barcha o'rnatilgan shriftlarni o'qib, ularni dropdownda o'z stili bilan ko'rsatamiz.
* **Shriftlar vizual ko'rinishi:** Dropdown ichida Google Fonts shriftlarining nomlarini o'sha shrift uslubida chiroyli qilib chizamiz.
* **Yangi sozlash slayderlari:** Kirish/chiqish yo'nalishi dropdownlari, Shadow (color, blur, offset X, Y) va Stroke (outline color, width) sozlamalarini Sidebar dizayn bo'limiga kiritamiz.

---

## Verification Plan

### Automated Tests & Manual Verification
1. **Aspect Ratio Test:** 1:1, 9:16 va 16:9 rejimlariga o'tib, sahnaning ezilmasdan o'zgarishini ko'rish.
2. **Rich Text Color Test:** Matnda `<color=#FFD700>Oltin</color> rang` deb yozib, faqat ko'rsatilgan so'zning rangi o'zgarishini tekshirish.
3. **GPU Render Test:** Python konsolidagi GPU yoki CPU aniqlanganligi to'g'risidagi xabarni ko'rish va render tezligini solishtirish.
4. **Custom Styling Test:** Soya va kontur slayderlarini surib, matn real-vaqtda chiroyli qalinlashishini va soya tushishini tekshirish.
5. **System Fonts Test:** Mahalliy kompyuter shriftlari (masalan, Arial, Tahoma) ro'yxatda chiqishini va stil berishini tekshirish.
