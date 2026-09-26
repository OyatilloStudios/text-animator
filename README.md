# 📱 Text Animator PRO — Android Application

A mobile kinetic typography studio built with Kotlin & Jetpack Compose (and available as mobile web via Vite). It enables creating animated title clips, kinetic typography videos, and motion graphics with rich entrance, exit, and loop effects.

---

## 🚀 Features

- **Kinetic Typography Engine**: Real-time rendering of 30+ kinetic motion effects:
  - **Entrance Effects**: Blur In, Typewriter, Slide Up/Down/Left/Right, Slide Fade, Scale In, Tracking In, Flip X/Y, Rotate In, Elastic In, Glitch In, Fly In, Vortex In.
  - **Kinetic Loops**: Wave, Wiggle, Float, Pulse, Font Shuffle, Glow Flicker, Marquee, Pendulum, Color Cycle, Blink, Skew Wave, Spin Loop.
  - **Exit Effects**: Blur Out, Scale Out, Slide Out, Rotate Out, Glitch Out, Fly Out, Vortex Out.
- **Stage & Aspect Ratio**: Multi-ratio support for modern social media:
  - 9:16 (Shorts, Reels, Stories)
  - 16:9 (Landscape YouTube, Video)
  - 1:1 (Square Posts)
  - Touch-based drag-and-drop to position text layers anywhere on canvas.
- **Interactive Multi-layer Timeline**:
  - Scrubbing slider, play/pause controls, timecode display (00:00.0).
  - Multi-layer visual track spans showing active intervals.
- **CapCut-style 6-Tab Bottom Panel**:
  - ✏️ **Text**: Content editing, inspirational quotes, text alignment, preset grid coordinates.
  - 🎨 **Style**: Typography fonts, font size, weight, letter spacing, line height, text color, highlight background, stroke outline, drop shadows.
  - ✨ **Effects**: Entrance, Loop, and Exit effect pickers, speed multiplier, intensity controls.
  - ⏱️ **Timing**: Start delay, lifespan duration, in/out transition durations.
  - 🖼️ **Background**: Solid color, dynamic angle linear gradients, transparent checkerboard, media backgrounds.
  - 📑 **Layers**: Add, reorder (up/down), duplicate, and delete text layers.
- **Export Studio**:
  - Resolution selector (HD 720p, Full HD 1080p, 4K UHD).
  - Frame rate options (24, 25, 30, 60 FPS).
  - Live progress encoding modal.

---

## 🏗 Android Project Architecture

```
/
├── app/
│   ├── build.gradle.kts                   # Android module Gradle configuration
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml            # App manifest & permissions
│       ├── res/
│       │   ├── values/                    # strings.xml, colors.xml, themes.xml
│       │   ├── drawable/                  # Vector adaptive launcher icons
│       │   └── mipmap-*/                  # Density-specific raster icons
│       └── java/com/example/textanimator/
│           ├── MainActivity.kt            # Edge-to-edge entry point
│           ├── model/
│           │   ├── AnimationEffect.kt     # Enums for effects & categories
│           │   ├── TextConfig.kt          # Layer state data class
│           │   └── Presets.kt             # Fonts, inspirations, palettes
│           ├── ui/
│           │   ├── theme/                 # Dark M3 color scheme, typography
│           │   ├── components/
│           │   │   ├── StageView.kt       # Kinetic canvas renderer & gestures
│           │   │   ├── TimelineView.kt    # Scrubber & layer tracks
│           │   │   ├── BottomPanel.kt     # 6-tab styling & settings panel
│           │   │   ├── EffectPickerSheet.kt # Modal effect selector
│           │   │   ├── ColorPickerSheet.kt  # Palette selector
│           │   │   └── ExportDialog.kt    # Resolution & export progress
│           │   ├── screens/
│           │   │   └── TextAnimatorScreen.kt # Root studio composable
│           │   └── viewmodel/
│           │       └── TextAnimatorViewModel.kt # StateFlow & 60fps playback engine
├── build.gradle.kts                       # Root project build script
├── settings.gradle.kts                    # Settings script with dependency resolution
├── gradle.properties
└── gradle/libs.versions.toml             # Version Catalog
```

---

## 🛠 Building the Application

### Native Android
To compile and assemble the Android APK using Gradle:
```bash
gradle assembleDebug
```
The output APK is generated at `app/build/outputs/apk/debug/app-debug.apk`.
