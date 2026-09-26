# 📱 Text Animator PRO — Mobile & Android (APK)

A modern mobile web & native Android application for creating kinetic text animations, motion graphics, and video rendering directly on smart devices.

---

## 🏗 Arxitektura (Mobile Architecture)

Loyiha smartfonlar va Android operatsion tizimi uchun to'liq moslashtirilgan:

```
┌──────────────────────────────────────────────────────────┐
│             React + TypeScript + Capacitor               │
│  - UI: Mobile Stage (9:16 / 16:9 / 1:1), Touch Timeline  │
│  - Navigation: CapCut-style 6-tab Mobile Bottom Panel    │
│  - Touch Engine: Finger Drag & Scrubbing                 │
│  - Motion Engine: Anime.js (30+ kinetic animations)      │
│  - Renderer: In-Device WebCodecs (MP4 & WebM)            │
└────────────────────────────┬─────────────────────────────┘
                             │ Build
┌────────────────────────────▼─────────────────────────────┐
│                 Android Native (.APK)                    │
│  - Capacitor Native Bridge                               │
│  - In-device Gallery Export                              │
│  - Cloud CI/CD (GitHub Actions — 0MB on local PC)        │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Loyiha Tuzilishi

- `App.tsx` — Mobil interfeys, 9:16 standart vertikal format, yuqori menyu va eksport oynasi
- `components/Stage.tsx` — Sensor ekran (Touch Drag) orqali matnlarni erkin surish sahnasi
- `components/Timeline.tsx` — Barmoq bilan vaqtni surish (Touch Scrubbing) va qatlamlarni cho'zish
- `components/MobileBottomPanel.tsx` — CapCut uslubidagi 6 ta mobil boshqaruv bo'limi:
  - ✏️ **Matn** — Shriftlar, o'lcham, qalinlik, tekislash, tezkor joylashuv
  - 🎨 **Uslub** — Rang, fon shaffofligi, hoshiya (stroke), tashqi va ichki soyalar
  - ✨ **Effekt** — 30+ kinetik, kirish va chiqish animatsiyalari
  - ⏱️ **Vaqt** — Qatlam davomiyligi, boshlanish vaqti, tezlik va intensivlik
  - 🖼️ **Fon** — Gradient, rangli, shaffof yoki media fon
  - ⚙️ **Qatlam** — Qatlamlarni tartiblash va boshqarish
- `components/AnimatedText.tsx` — Anime.js kinetik dvigateli
- `services/renderer.ts` — Telefonda to'g'ridan-to'g'ri MP4 render qiluvchi WebCodecs mexanizmi
- `capacitor.config.json` — Android konfiguratsiyasi
- `.github/workflows/build-apk.yml` — GitHub Actions orqali bulutda avtomatik APK yig'ish

---

## 🚀 Qanday Qilib APK Olinadi? (GitHub Actions orqali)

Ushbu loyiha kompyuteringiz xotirasidan **0 MB** sarflagan holda GitHub bulutida avtomatik `.apk` chiqarib beradi:

1. Ushbu loyihani GitHub omboriga push qiling:
   ```bash
   git push origin main
   ```
2. GitHub sahifangizga kiring: [https://github.com/OyatilloStudios/text-animator](https://github.com/OyatilloStudios/text-animator)
3. Yuqoridagi **"Actions"** tabiga bosing.
4. **"Build Android APK (Cloud - 0MB Disk on PC)"** ishlayotganini ko'rasiz.
5. Jarayon tugagach (taxminan 2 daqiqa), **"Artifacts"** bo'limida tayyor **`TextAnimator-PRO-Android-APK`** fayli paydo bo'ladi.
6. Uni to'g'ridan-to'g'ri telefoningizga yuklab olib, o'rnatasiz!
