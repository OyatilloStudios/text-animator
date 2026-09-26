package com.example.textanimator.model

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import java.util.UUID

data class TextConfig(
    val id: String = UUID.randomUUID().toString(),
    val content: String = "Text\nAnimator",
    val fontFamilyName: String = "Instrument Sans",
    val fontSize: Float = 48f,
    val fontWeight: Int = 700,
    val letterSpacing: Float = 0f,
    val lineHeight: Float = 1.1f,
    val textAlign: TextAlign = TextAlign.Center,
    val color: Color = Color.White,
    val backgroundColor: Color = Color.Black,
    val bgOpacity: Float = 0f,
    val positionX: Float = 50f, // 0..100 percentage
    val positionY: Float = 50f, // 0..100 percentage
    val effect: AnimationEffect = AnimationEffect.BLUR_IN,
    val loopEffect: AnimationEffect = AnimationEffect.LOOP_NONE,
    val outEffect: AnimationEffect = AnimationEffect.EXIT_NONE,
    val granularity: AnimationGranularity = AnimationGranularity.WORD,
    val easing: AnimationEasing = AnimationEasing.SMOOTH,
    val speed: Float = 1.0f,
    val intensity: Float = 50f,
    val delayMs: Long = 200L,
    val durationMs: Long = 3500L,
    val inDurationMs: Long = 800L,
    val outDurationMs: Long = 400L,
    // Drop Shadow
    val shadowColor: Color = Color.Black,
    val shadowBlur: Float = 8f,
    val shadowDistance: Float = 4f,
    val shadowAngle: Float = 45f,
    // Stroke / Outline
    val strokeColor: Color = Color.Transparent,
    val strokeWidth: Float = 0f
) {
    val endTimeMs: Long get() = delayMs + durationMs

    fun isVisibleAt(timeMs: Long): Boolean {
        return timeMs >= delayMs && timeMs <= endTimeMs
    }
}
