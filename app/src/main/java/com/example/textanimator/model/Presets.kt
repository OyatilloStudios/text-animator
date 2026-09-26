package com.example.textanimator.model

import androidx.compose.ui.graphics.Color

object Presets {
    val FONTS = listOf(
        "Instrument Sans",
        "Google Sans",
        "Baskervville",
        "Space Mono",
        "Michroma",
        "Sofia Sans",
        "Faculty Glyphic",
        "Tasa Orbiter",
        "Ballet",
        "Danfo",
        "Pirata One",
        "Astloch"
    )

    val TEXT_INSPIRATIONS = listOf(
        "Text\nAnimator",
        "Kinetic\nTypography",
        "Break\nThe Rules",
        "Next Gen\nMotion",
        "Design\nIn Motion",
        "Create\nWithout Limits",
        "Level Up\nYour Story",
        "Bold & Punchy"
    )

    data class PositionPreset(val name: String, val x: Float, val y: Float)

    val POSITION_PRESETS = listOf(
        PositionPreset("Top Left", 15f, 15f),
        PositionPreset("Top Center", 50f, 15f),
        PositionPreset("Top Right", 85f, 15f),
        PositionPreset("Center Left", 15f, 50f),
        PositionPreset("Center", 50f, 50f),
        PositionPreset("Center Right", 85f, 50f),
        PositionPreset("Bottom Left", 15f, 85f),
        PositionPreset("Bottom Center", 50f, 85f),
        PositionPreset("Bottom Right", 85f, 85f)
    )

    val COLOR_PALETTE = listOf(
        Color(0xFFFFFFFF),
        Color(0xFF000000),
        Color(0xFF6366F1),
        Color(0xFF8B5CF6),
        Color(0xFFEC4899),
        Color(0xFFF43F5E),
        Color(0xFFEF4444),
        Color(0xFFF97316),
        Color(0xFFF59E0B),
        Color(0xFFEAB308),
        Color(0xFF10B981),
        Color(0xFF06B6D4),
        Color(0xFF3B82F6),
        Color(0xFF94A3B8)
    )

    val BACKGROUND_GRADIENTS = listOf(
        Pair(Color(0xFF1A1A1E), Color(0xFF09090B)),
        Pair(Color(0xFF1E1B4B), Color(0xFF0F172A)),
        Pair(Color(0xFF2E1065), Color(0xFF020617)),
        Pair(Color(0xFF701A75), Color(0xFF0F172A)),
        Pair(Color(0xFF1C1917), Color(0xFF0C0A09)),
        Pair(Color(0xFF0F172A), Color(0xFF020617)),
        Pair(Color(0xFF064E3B), Color(0xFF022C22)),
        Pair(Color(0xFF312E81), Color(0xFF4C1D95))
    )
}
