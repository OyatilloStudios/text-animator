# ✨ Text Animator PRO

A native desktop application & offline video renderer for creating kinetic text animations and motion graphics in real-time.

---

## 🏗 Arxitektura (Architecture)

Loyiha ikki asosiy qismdan tashkil topgan:

```
┌──────────────────────────────────────────────────────────┐
│                   React + TypeScript                     │
│  - UI: Stage, Timeline, Effects, Sidebar, Primitives     │
│  - Engine: Anime.js, html-to-image, Mediabunny           │
│  - Canvas: Real-time kinetic preview & frame capture     │
└────────────────────────────┬─────────────────────────────┘
                             │ WebSocket (ws://localhost:8081)
┌────────────────────────────▼─────────────────────────────┐
│                 Python Native Backend                    │
│  - Launcher: PyWebView (Native desktop window)          │
│  - Server: Deno/Vite local dev server & static server    │
│  - Offline Renderer: FFmpeg with GPU acceleration       │
│    (NVENC / Intel QSV / AMD AMF / CPU fallback)          │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Loyiha tuzilishi

- `App.tsx` — Asosiy dastur interfeysi va state boshqaruvi
- `components/` — UI komponentlari (`Stage`, `Timeline`, `EffectPicker`, `Sidebar`, `AnimatedText`, `Primitives`)
- `services/` — Vaqt boshqaruvi (`TimeController.ts`) va render xizmati (`renderer.ts`)
- `hd_renderer.py` — Python ishga tushiruvchi, WebSocket server va FFmpeg offline video rendereri
- `build_dist.py` — Dasturni to'liq mustaqil (standalone `.exe`) dastur qilib yig'ish skripti
- `package.json` / `deno.json` — Frontend bog'liqliklari (dependencies)

---

## 🚀 O'rnatish va Ishga tushirish

### 1. Talablar:
- **Node.js** (yoki **Deno**)
- **Python 3.10+**
- **FFmpeg** (tizimda o'rnatilgan yoki `ffmpeg.exe` fayli)

### 2. Bog'liqliklarni o'rnatish:
```bash
# Frontend paketlarini o'rnatish
npm install

# Python paketlarini o'rnatish
pip install pywebview websockets
```

### 3. Dasturni ishga tushirish:
```bash
# Desktop dastur sifatida (Python orqali):
python hd_renderer.py

# Yoki brauzerda ishlab chiqish uchun (Vite dev):
npm run dev
```

### 4. Standalone (.exe) dastur yaratish:
```bash
python build_dist.py
```
Natijada `dist/TextAnimator/` papkasida mustaqil ishlaydigan tayyor dastur hosil bo'ladi.
