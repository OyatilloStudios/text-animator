package com.example.textanimator.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.textanimator.model.*
import kotlin.math.*

@Composable
fun StageView(
    modifier: Modifier = Modifier,
    aspectRatio: AspectRatioOption,
    backgroundType: BackgroundType,
    bgColor1: Color,
    bgColor2: Color,
    bgGradientAngle: Float,
    textConfigs: List<TextConfig>,
    selectedTextId: String?,
    currentTimeMs: Long,
    onSelectLayer: (String) -> Unit,
    onUpdatePosition: (id: String, x: Float, y: Float) -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF070709))
            .border(1.dp, Color(0xFF2A2A34), RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center
    ) {
        // Stage Canvas with aspect ratio
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxHeight(0.96f)
                .aspectRatio(aspectRatio.ratio)
                .clip(RoundedCornerShape(8.dp))
                .drawBehind {
                    drawStageBackground(
                        backgroundType = backgroundType,
                        color1 = bgColor1,
                        color2 = bgColor2,
                        angle = bgGradientAngle
                    )
                },
            contentAlignment = Alignment.TopStart
        ) {
            val stageWidth = maxWidth
            val stageHeight = maxHeight

            // Render all layers in order
            textConfigs.forEach { config ->
                if (config.isVisibleAt(currentTimeMs)) {
                    val isSelected = config.id == selectedTextId
                    val animState = remember(config, currentTimeMs) {
                        computeAnimationState(config, currentTimeMs)
                    }

                    if (animState.isVisible) {
                        val posX = (config.positionX / 100f) * stageWidth.value
                        val posY = (config.positionY / 100f) * stageHeight.value

                        Box(
                            modifier = Modifier
                                .offset {
                                    IntOffset(
                                        x = (posX + animState.translationX).roundToInt(),
                                        y = (posY + animState.translationY).roundToInt()
                                    )
                                }
                                .graphicsLayer {
                                    scaleX = animState.scaleX
                                    scaleY = animState.scaleY
                                    alpha = animState.alpha
                                    rotationZ = animState.rotationZ
                                }
                                .pointerInput(config.id) {
                                    detectDragGestures(
                                        onDragStart = { onSelectLayer(config.id) },
                                        onDrag = { change, dragAmount ->
                                            change.consume()
                                            val newX = (config.positionX + (dragAmount.x / stageWidth.toPx()) * 100f).coerceIn(5f, 95f)
                                            val newY = (config.positionY + (dragAmount.y / stageHeight.toPx()) * 100f).coerceIn(5f, 95f)
                                            onUpdatePosition(config.id, newX, newY)
                                        }
                                    )
                                }
                                .then(
                                    if (isSelected) {
                                        Modifier.border(
                                            width = 1.5.dp,
                                            color = Color(0xFF6366F1),
                                            shape = RoundedCornerShape(6.dp)
                                        ).padding(4.dp)
                                    } else Modifier.padding(4.dp)
                                )
                                .then(
                                    if (config.bgOpacity > 0f) {
                                        Modifier.background(
                                            color = config.backgroundColor.copy(alpha = config.bgOpacity),
                                            shape = RoundedCornerShape(4.dp)
                                        ).padding(horizontal = 6.dp, vertical = 2.dp)
                                    } else Modifier
                                )
                        ) {
                            Text(
                                text = animState.displayedText,
                                color = config.color,
                                fontSize = (config.fontSize * animState.fontScale).sp,
                                fontWeight = FontWeight(config.fontWeight.coerceIn(100, 900)),
                                letterSpacing = config.letterSpacing.sp,
                                lineHeight = (config.fontSize * config.lineHeight).sp,
                                textAlign = config.textAlign,
                                fontFamily = getFontFamilyByName(config.fontFamilyName)
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun DrawScope.drawStageBackground(
    backgroundType: BackgroundType,
    color1: Color,
    color2: Color,
    angle: Float
) {
    when (backgroundType) {
        BackgroundType.TRANSPARENT -> {
            // Checkerboard pattern
            val checkSize = 16f
            val numX = ceil(size.width / checkSize).toInt()
            val numY = ceil(size.height / checkSize).toInt()
            drawRect(Color(0xFF1E1E24))
            for (x in 0 until numX) {
                for (y in 0 until numY) {
                    if ((x + y) % 2 == 0) {
                        drawRect(
                            color = Color(0xFF2B2B36),
                            topLeft = Offset(x * checkSize, y * checkSize),
                            size = androidx.compose.ui.geometry.Size(checkSize, checkSize)
                        )
                    }
                }
            }
        }
        BackgroundType.SOLID -> {
            drawRect(color1)
        }
        BackgroundType.GRADIENT -> {
            val rad = Math.toRadians(angle.toDouble())
            val length = sqrt(size.width.pow(2) + size.height.pow(2))
            val xOffset = (cos(rad) * length / 2).toFloat()
            val yOffset = (sin(rad) * length / 2).toFloat()
            val center = Offset(size.width / 2f, size.height / 2f)

            val brush = Brush.linearGradient(
                colors = listOf(color1, color2),
                start = Offset(center.x - xOffset, center.y - yOffset),
                end = Offset(center.x + xOffset, center.y + yOffset)
            )
            drawRect(brush)
        }
        BackgroundType.MEDIA -> {
            // Media placeholder gradient with cinematic bars
            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF020617))
                )
            )
        }
    }
}

data class AnimationRenderState(
    val displayedText: String,
    val translationX: Float = 0f,
    val translationY: Float = 0f,
    val scaleX: Float = 1f,
    val scaleY: Float = 1f,
    val alpha: Float = 1f,
    val rotationZ: Float = 0f,
    val fontScale: Float = 1f,
    val isVisible: Boolean = true
)

private fun computeAnimationState(config: TextConfig, timeMs: Long): AnimationRenderState {
    if (timeMs < config.delayMs || timeMs > config.endTimeMs) {
        return AnimationRenderState(displayedText = "", isVisible = false)
    }

    val elapsed = timeMs - config.delayMs
    val remaining = config.endTimeMs - timeMs

    var text = config.content
    var tx = 0f
    var ty = 0f
    var sx = 1f
    var sy = 1f
    var a = 1f
    var rz = 0f

    // 1. Entrance Transition
    if (elapsed < config.inDurationMs && config.inDurationMs > 0) {
        val p = (elapsed.toFloat() / config.inDurationMs).coerceIn(0f, 1f)
        val eased = if (config.easing == AnimationEasing.SMOOTH) {
            1f - (1f - p).pow(3)
        } else p

        when (config.effect) {
            AnimationEffect.NONE -> {}
            AnimationEffect.BLUR_IN -> {
                a = eased
            }
            AnimationEffect.TYPEWRITER -> {
                val charsToShow = (text.length * eased).roundToInt().coerceIn(0, text.length)
                text = text.take(charsToShow)
            }
            AnimationEffect.SLIDE_UP -> {
                ty = (1f - eased) * 60f
                a = eased
            }
            AnimationEffect.SLIDE_DOWN -> {
                ty = -(1f - eased) * 60f
                a = eased
            }
            AnimationEffect.SLIDE_LEFT -> {
                tx = (1f - eased) * 80f
                a = eased
            }
            AnimationEffect.SLIDE_RIGHT -> {
                tx = -(1f - eased) * 80f
                a = eased
            }
            AnimationEffect.SLIDE_FADE -> {
                ty = (1f - eased) * 35f
                a = eased
            }
            AnimationEffect.SCALE_IN -> {
                sx = 0.2f + 0.8f * eased
                sy = sx
                a = eased
            }
            AnimationEffect.ROTATE_IN -> {
                rz = (1f - eased) * -90f
                sx = eased
                sy = eased
                a = eased
            }
            AnimationEffect.ELASTIC_IN -> {
                val bounce = if (p >= 1f) 1f else 2.0.pow(-10 * p) * sin((p - 0.075) * (2 * PI) / 0.3) + 1
                sx = bounce.toFloat()
                sy = bounce.toFloat()
                a = p.coerceIn(0f, 1f)
            }
            AnimationEffect.GLITCH_IN -> {
                if (p < 0.8f && (elapsed / 60) % 2L == 0L) {
                    tx = ((elapsed % 17) - 8).toFloat()
                    a = 0.7f
                }
            }
            AnimationEffect.FLY_IN -> {
                ty = (1f - eased) * 120f
                sx = 1.5f - 0.5f * eased
                sy = sx
                a = eased
            }
            AnimationEffect.VORTEX_IN -> {
                rz = (1f - eased) * 360f
                sx = eased
                sy = eased
                a = eased
            }
            else -> {
                a = eased
            }
        }
    }

    // 2. Exit Transition
    if (remaining < config.outDurationMs && config.outDurationMs > 0 && config.outEffect != AnimationEffect.EXIT_NONE) {
        val outP = (remaining.toFloat() / config.outDurationMs).coerceIn(0f, 1f)
        when (config.outEffect) {
            AnimationEffect.BLUR_OUT -> {
                a = min(a, outP)
            }
            AnimationEffect.SCALE_OUT -> {
                sx *= outP
                sy *= outP
                a = min(a, outP)
            }
            AnimationEffect.SLIDE_OUT_UP -> {
                ty -= (1f - outP) * 60f
                a = min(a, outP)
            }
            AnimationEffect.SLIDE_OUT_DOWN -> {
                ty += (1f - outP) * 60f
                a = min(a, outP)
            }
            AnimationEffect.SLIDE_OUT_LEFT -> {
                tx -= (1f - outP) * 80f
                a = min(a, outP)
            }
            AnimationEffect.SLIDE_OUT_RIGHT -> {
                tx += (1f - outP) * 80f
                a = min(a, outP)
            }
            AnimationEffect.ROTATE_OUT -> {
                rz += (1f - outP) * 90f
                a = min(a, outP)
            }
            else -> {}
        }
    }

    // 3. Kinetic Loops
    if (config.loopEffect != AnimationEffect.LOOP_NONE) {
        val loopTime = (elapsed * config.speed) / 1000.0
        val amp = (config.intensity / 100f)

        when (config.loopEffect) {
            AnimationEffect.WAVE -> {
                ty += (sin(loopTime * 4.0) * 12.0 * amp).toFloat()
            }
            AnimationEffect.WIGGLE -> {
                tx += (sin(loopTime * 12.0) * 6.0 * amp).toFloat()
                ty += (cos(loopTime * 15.0) * 4.0 * amp).toFloat()
            }
            AnimationEffect.FLOAT -> {
                ty += (sin(loopTime * 2.0) * 10.0 * amp).toFloat()
            }
            AnimationEffect.PULSE -> {
                val pScale = 1f + (sin(loopTime * 5.0) * 0.08 * amp).toFloat()
                sx *= pScale
                sy *= pScale
            }
            AnimationEffect.GLOW_FLICKER -> {
                val flicker = 0.85f + (sin(loopTime * 18.0) * 0.15 * amp).toFloat()
                a = (a * flicker).coerceIn(0.1f, 1f)
            }
            AnimationEffect.PENDULUM -> {
                rz += (sin(loopTime * 3.0) * 15.0 * amp).toFloat()
            }
            AnimationEffect.BLINK -> {
                val blinkPhase = (loopTime * 3.0) % 1.0
                if (blinkPhase > 0.8) a = 0.2f
            }
            AnimationEffect.SKEW_WAVE -> {
                tx += (sin(loopTime * 3.5) * 10.0 * amp).toFloat()
                rz += (cos(loopTime * 3.5) * 5.0 * amp).toFloat()
            }
            AnimationEffect.SPIN_LOOP -> {
                rz += ((loopTime * 60.0) % 360.0).toFloat()
            }
            else -> {}
        }
    }

    return AnimationRenderState(
        displayedText = text,
        translationX = tx,
        translationY = ty,
        scaleX = sx,
        scaleY = sy,
        alpha = a.coerceIn(0f, 1f),
        rotationZ = rz,
        isVisible = true
    )
}

private fun getFontFamilyByName(name: String): FontFamily {
    return when (name) {
        "Space Mono" -> FontFamily.Monospace
        "Baskervville" -> FontFamily.Serif
        "Google Sans", "Instrument Sans" -> FontFamily.SansSerif
        else -> FontFamily.Default
    }
}
