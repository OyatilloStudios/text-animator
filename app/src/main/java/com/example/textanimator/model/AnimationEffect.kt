package com.example.textanimator.model

enum class AnimationEffect(val displayName: String, val category: EffectCategory) {
    // None
    NONE("None (Instant)", EffectCategory.ENTRANCE),

    // Entrance transitions
    BLUR_IN("Blur In", EffectCategory.ENTRANCE),
    TYPEWRITER("Typewriter", EffectCategory.ENTRANCE),
    SLIDE_UP("Slide Up", EffectCategory.ENTRANCE),
    SLIDE_DOWN("Slide Down", EffectCategory.ENTRANCE),
    SLIDE_LEFT("Slide Left", EffectCategory.ENTRANCE),
    SLIDE_RIGHT("Slide Right", EffectCategory.ENTRANCE),
    SLIDE_FADE("Slide Fade", EffectCategory.ENTRANCE),
    SCALE_IN("Scale In", EffectCategory.ENTRANCE),
    TRACKING_IN("Tracking In", EffectCategory.ENTRANCE),
    FLIP_X("Flip X", EffectCategory.ENTRANCE),
    FLIP_Y("Flip Y", EffectCategory.ENTRANCE),
    ROTATE_IN("Rotate In", EffectCategory.ENTRANCE),
    ELASTIC_IN("Elastic In", EffectCategory.ENTRANCE),
    GLITCH_IN("Glitch In", EffectCategory.ENTRANCE),
    FLY_IN("Fly In", EffectCategory.ENTRANCE),
    VORTEX_IN("Vortex In", EffectCategory.ENTRANCE),
    SEQUENTIAL_STACK("Sequential Stack", EffectCategory.ENTRANCE),

    // Kinetic Loops
    LOOP_NONE("None (Still)", EffectCategory.LOOP),
    WAVE("Wave", EffectCategory.LOOP),
    WIGGLE("Wiggle", EffectCategory.LOOP),
    FLOAT("Float", EffectCategory.LOOP),
    PULSE("Pulse", EffectCategory.LOOP),
    FONT_SHUFFLE("Font Shuffle", EffectCategory.LOOP),
    GLOW_FLICKER("Glow Flicker", EffectCategory.LOOP),
    MARQUEE("Marquee", EffectCategory.LOOP),
    PENDULUM("Pendulum", EffectCategory.LOOP),
    COLOR_CYCLE("Color Cycle", EffectCategory.LOOP),
    BLINK("Blink", EffectCategory.LOOP),
    SKEW_WAVE("Skew Wave", EffectCategory.LOOP),
    SPIN_LOOP("Spin Loop", EffectCategory.LOOP),

    // Exit transitions
    EXIT_NONE("None (Instant)", EffectCategory.EXIT),
    BLUR_OUT("Blur Out", EffectCategory.EXIT),
    SCALE_OUT("Scale Out", EffectCategory.EXIT),
    SLIDE_OUT_UP("Slide Up", EffectCategory.EXIT),
    SLIDE_OUT_DOWN("Slide Down", EffectCategory.EXIT),
    SLIDE_OUT_LEFT("Slide Left", EffectCategory.EXIT),
    SLIDE_OUT_RIGHT("Slide Right", EffectCategory.EXIT),
    ROTATE_OUT("Rotate Out", EffectCategory.EXIT),
    GLITCH_OUT("Glitch Out", EffectCategory.EXIT),
    FLY_OUT("Fly Out", EffectCategory.EXIT),
    VORTEX_OUT("Vortex Out", EffectCategory.EXIT);

    companion object {
        fun entranceEffects() = entries.filter { it.category == EffectCategory.ENTRANCE }
        fun loopEffects() = entries.filter { it.category == EffectCategory.LOOP }
        fun exitEffects() = entries.filter { it.category == EffectCategory.EXIT }
    }
}

enum class EffectCategory {
    ENTRANCE,
    LOOP,
    EXIT
}

enum class AnimationGranularity(val displayName: String) {
    CHAR("Character"),
    WORD("Word"),
    LINE("Line"),
    ALL("All Text")
}

enum class AnimationEasing(val displayName: String) {
    SMOOTH("Smooth"),
    LINEAR("Linear")
}

enum class BackgroundType(val displayName: String) {
    GRADIENT("Gradient"),
    SOLID("Solid Color"),
    TRANSPARENT("Transparent"),
    MEDIA("Media Asset")
}

enum class AspectRatioOption(val displayName: String, val ratio: Float, val widthRatio: Int, val heightRatio: Int) {
    RATIO_9_16("9:16 (Reels/Shorts)", 9f / 16f, 9, 16),
    RATIO_16_9("16:9 (Landscape)", 16f / 9f, 16, 9),
    RATIO_1_1("1:1 (Square)", 1f, 1, 1)
}

enum class ExportQuality(val displayName: String, val resolution: String) {
    HD("HD", "720p (1280x720)"),
    FULL_HD("Full HD", "1080p (1920x1080)"),
    UHD("4K UHD", "2160p (3840x2160)")
}

enum class ExportFps(val fps: Int) {
    FPS_24(24),
    FPS_25(25),
    FPS_30(30),
    FPS_60(60)
}
