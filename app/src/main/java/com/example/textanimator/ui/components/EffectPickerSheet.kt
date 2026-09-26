package com.example.textanimator.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.textanimator.model.AnimationEffect
import com.example.textanimator.model.EffectCategory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EffectPickerSheet(
    targetCategory: EffectCategory,
    currentEffect: AnimationEffect,
    onEffectSelected: (AnimationEffect) -> Unit,
    onDismiss: () -> Unit
) {
    val title = when (targetCategory) {
        EffectCategory.ENTRANCE -> "Entrance Effect"
        EffectCategory.LOOP -> "Kinetic Loop Effect"
        EffectCategory.EXIT -> "Exit Effect"
    }

    val effects = when (targetCategory) {
        EffectCategory.ENTRANCE -> AnimationEffect.entranceEffects()
        EffectCategory.LOOP -> AnimationEffect.loopEffects()
        EffectCategory.EXIT -> AnimationEffect.exitEffects()
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF16161A),
        contentColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = Color.White
                )
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Rounded.Close,
                        contentDescription = "Close",
                        tint = Color(0xFF94A3B8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(effects) { effect ->
                    val isSelected = effect == currentEffect
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) Color(0xFF2E2E42) else Color(0xFF1F1F26))
                            .border(
                                width = 1.dp,
                                color = if (isSelected) Color(0xFF6366F1) else Color(0xFF2C2C38),
                                shape = RoundedCornerShape(10.dp)
                            )
                            .clickable {
                                onEffectSelected(effect)
                                onDismiss()
                            }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = effect.displayName,
                            color = if (isSelected) Color.White else Color(0xFFE2E8F0),
                            fontSize = 15.sp
                        )

                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Rounded.Check,
                                contentDescription = "Selected",
                                tint = Color(0xFF818CF8),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
