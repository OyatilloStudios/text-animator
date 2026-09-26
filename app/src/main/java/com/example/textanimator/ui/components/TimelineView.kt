package com.example.textanimator.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.FastRewind
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.textanimator.model.TextConfig
import java.util.Locale

@Composable
fun TimelineView(
    modifier: Modifier = Modifier,
    currentTimeMs: Long,
    totalDurationSec: Int,
    isPlaying: Boolean,
    textConfigs: List<TextConfig>,
    selectedTextId: String?,
    onPlayPauseToggle: () -> Unit,
    onRewind: () -> Unit,
    onSeek: (Long) -> Unit,
    onSelectLayer: (String) -> Unit
) {
    val totalDurationMs = totalDurationSec * 1000L

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF141418))
            .border(1.dp, Color(0xFF262630), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        // Controls Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = onRewind,
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.FastRewind,
                        contentDescription = "Rewind",
                        tint = Color.White
                    )
                }

                Spacer(modifier = Modifier.width(4.dp))

                FilledIconButton(
                    onClick = onPlayPauseToggle,
                    modifier = Modifier.size(36.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = Color(0xFF6366F1),
                        contentColor = Color.White
                    )
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Rounded.Pause else Icons.Rounded.PlayArrow,
                        contentDescription = if (isPlaying) "Pause" else "Play"
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Text(
                    text = "${formatTime(currentTimeMs)} / ${formatTime(totalDurationMs)}",
                    color = Color(0xFFCBD5E1),
                    fontSize = 12.sp,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                )
            }
        }

        // Time Scrubber Slider
        Slider(
            value = currentTimeMs.toFloat(),
            onValueChange = { onSeek(it.toLong()) },
            valueRange = 0f..totalDurationMs.toFloat().coerceAtLeast(1000f),
            colors = SliderDefaults.colors(
                thumbColor = Color.White,
                activeTrackColor = Color(0xFF6366F1),
                inactiveTrackColor = Color(0xFF33333F)
            ),
            modifier = Modifier
                .fillMaxWidth()
                .height(28.dp)
        )

        // Visual Layer Tracks
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            textConfigs.forEach { config ->
                val isSelected = config.id == selectedTextId
                val startFraction = (config.delayMs.toFloat() / totalDurationMs).coerceIn(0f, 1f)
                val durationFraction = (config.durationMs.toFloat() / totalDurationMs).coerceIn(0.05f, 1f - startFraction)

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(18.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(0xFF1E1E26))
                        .clickable {
                            onSelectLayer(config.id)
                            onSeek(config.delayMs)
                        }
                ) {
                    // Active layer block on timeline
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .fillMaxWidth(fraction = durationFraction)
                            .offset(x = 0.dp) // Layout fraction handles width; let's use weighted or padding
                            .padding(
                                start = (startFraction * 260).dp.coerceAtMost(220.dp)
                            )
                            .clip(RoundedCornerShape(3.dp))
                            .background(
                                if (isSelected) Color(0xFF6366F1) else Color(0xFF4338CA)
                            )
                            .padding(horizontal = 4.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Text(
                            text = config.content.replace("\n", " ").take(14),
                            color = Color.White,
                            fontSize = 9.sp,
                            maxLines = 1
                        )
                    }

                    // Playhead indicator cursor
                    val playheadFraction = (currentTimeMs.toFloat() / totalDurationMs).coerceIn(0f, 1f)
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .width(2.dp)
                            .padding(start = (playheadFraction * 280).dp.coerceAtMost(280.dp))
                            .background(Color.Red)
                    )
                }
            }
        }
    }
}

private fun formatTime(ms: Long): String {
    val totalSec = ms / 1000
    val min = totalSec / 60
    val sec = totalSec % 60
    val tenths = (ms % 1000) / 100
    return String.format(Locale.US, "%02d:%02d.%d", min, sec, tenths)
}
