package com.example.textanimator.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.FileDownload
import androidx.compose.material.icons.rounded.PlayCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.textanimator.model.AspectRatioOption
import com.example.textanimator.model.EffectCategory
import com.example.textanimator.ui.components.*
import com.example.textanimator.ui.viewmodel.TextAnimatorViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TextAnimatorScreen(
    viewModel: TextAnimatorViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedConfig = viewModel.selectedConfig

    var activeEffectCategory by remember { mutableStateOf<EffectCategory?>(null) }
    var colorPickerState by remember {
        mutableStateOf<Triple<String, Color, (Color) -> Unit>?>(null)
    }

    Scaffold(
        containerColor = Color(0xFF0C0C0E),
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Text Animator",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = Color(0xFF312E81)
                        ) {
                            Text(
                                text = "PRO",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF818CF8),
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                },
                actions = {
                    // Aspect ratio dropdown / toggle button
                    AssistChip(
                        onClick = {
                            val nextRatio = when (uiState.aspectRatio) {
                                AspectRatioOption.RATIO_9_16 -> AspectRatioOption.RATIO_16_9
                                AspectRatioOption.RATIO_16_9 -> AspectRatioOption.RATIO_1_1
                                AspectRatioOption.RATIO_1_1 -> AspectRatioOption.RATIO_9_16
                            }
                            viewModel.setAspectRatio(nextRatio)
                        },
                        label = {
                            Text(
                                text = when (uiState.aspectRatio) {
                                    AspectRatioOption.RATIO_9_16 -> "9:16"
                                    AspectRatioOption.RATIO_16_9 -> "16:9"
                                    AspectRatioOption.RATIO_1_1 -> "1:1"
                                },
                                fontSize = 11.sp,
                                color = Color(0xFFCBD5E1)
                            )
                        },
                        colors = AssistChipDefaults.assistChipColors(containerColor = Color(0xFF1E1E26)),
                        border = AssistChipDefaults.assistChipBorder(enabled = true, borderColor = Color(0xFF333344))
                    )

                    Spacer(modifier = Modifier.width(6.dp))

                    IconButton(
                        onClick = { viewModel.addLayer() },
                        modifier = Modifier.testTag("add_layer_button")
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Add,
                            contentDescription = "Add Layer",
                            tint = Color(0xFF818CF8)
                        )
                    }

                    Button(
                        onClick = { viewModel.showExportDialog() },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .testTag("export_button")
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.FileDownload,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Export", fontSize = 12.sp)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF101014),
                    titleContentColor = Color.White
                )
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFF0C0C0E))
        ) {
            // Stage Area (Live Animation Canvas)
            StageView(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(8.dp)
                    .testTag("stage_view"),
                aspectRatio = uiState.aspectRatio,
                backgroundType = uiState.backgroundType,
                bgColor1 = uiState.bgColor1,
                bgColor2 = uiState.bgColor2,
                bgGradientAngle = uiState.bgGradientAngle,
                textConfigs = uiState.textConfigs,
                selectedTextId = uiState.selectedTextId,
                currentTimeMs = uiState.currentTimeMs,
                onSelectLayer = { viewModel.selectLayer(it) },
                onUpdatePosition = { id, x, y -> viewModel.updatePosition(id, x, y) }
            )

            // Timeline Area
            TimelineView(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 4.dp)
                    .testTag("timeline_view"),
                currentTimeMs = uiState.currentTimeMs,
                totalDurationSec = uiState.totalDurationSec,
                isPlaying = uiState.isPlaying,
                textConfigs = uiState.textConfigs,
                selectedTextId = uiState.selectedTextId,
                onPlayPauseToggle = { viewModel.togglePlayPause() },
                onRewind = { viewModel.rewind() },
                onSeek = { viewModel.seek(it) },
                onSelectLayer = { viewModel.selectLayer(it) }
            )

            // Bottom Control Panel
            BottomPanel(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("bottom_panel"),
                selectedConfig = selectedConfig,
                allConfigs = uiState.textConfigs,
                backgroundType = uiState.backgroundType,
                bgColor1 = uiState.bgColor1,
                bgColor2 = uiState.bgColor2,
                bgGradientAngle = uiState.bgGradientAngle,
                totalDurationSec = uiState.totalDurationSec,
                onUpdateConfig = { viewModel.updateConfig(it) },
                onAddLayer = { viewModel.addLayer() },
                onDeleteLayer = { viewModel.deleteLayer(it) },
                onSelectLayer = { viewModel.selectLayer(it) },
                onMoveLayer = { id, up -> viewModel.moveLayer(id, up) },
                onDuplicateLayer = { viewModel.duplicateLayer(it) },
                onBgTypeChange = { viewModel.setBackgroundType(it) },
                onBgColor1Change = { viewModel.setBgColor1(it) },
                onBgColor2Change = { viewModel.setBgColor2(it) },
                onBgGradientAngleChange = { viewModel.setBgGradientAngle(it) },
                onTotalDurationChange = { viewModel.setTotalDuration(it) },
                onRequestEffectPicker = { activeEffectCategory = it },
                onRequestColorPicker = { title, initCol, callback ->
                    colorPickerState = Triple(title, initCol, callback)
                }
            )
        }

        // Effect Picker Bottom Sheet
        activeEffectCategory?.let { category ->
            EffectPickerSheet(
                targetCategory = category,
                currentEffect = when (category) {
                    EffectCategory.ENTRANCE -> selectedConfig?.effect ?: com.example.textanimator.model.AnimationEffect.BLUR_IN
                    EffectCategory.LOOP -> selectedConfig?.loopEffect ?: com.example.textanimator.model.AnimationEffect.LOOP_NONE
                    EffectCategory.EXIT -> selectedConfig?.outEffect ?: com.example.textanimator.model.AnimationEffect.EXIT_NONE
                },
                onEffectSelected = { newEffect ->
                    selectedConfig?.let { cfg ->
                        val updated = when (category) {
                            EffectCategory.ENTRANCE -> cfg.copy(effect = newEffect)
                            EffectCategory.LOOP -> cfg.copy(loopEffect = newEffect)
                            EffectCategory.EXIT -> cfg.copy(outEffect = newEffect)
                        }
                        viewModel.updateConfig(updated)
                    }
                },
                onDismiss = { activeEffectCategory = null }
            )
        }

        // Color Picker Bottom Sheet
        colorPickerState?.let { (title, initialColor, onColorChosen) ->
            ColorPickerSheet(
                title = title,
                currentColor = initialColor,
                onColorSelected = onColorChosen,
                onDismiss = { colorPickerState = null }
            )
        }

        // Export Dialog
        if (uiState.showExportDialog) {
            ExportDialog(
                aspectRatio = uiState.aspectRatio,
                quality = uiState.exportQuality,
                fps = uiState.exportFps,
                isRendering = uiState.isRendering,
                renderProgress = uiState.renderProgress,
                onAspectRatioChange = { viewModel.setAspectRatio(it) },
                onQualityChange = { viewModel.setExportQuality(it) },
                onFpsChange = { viewModel.setExportFps(it) },
                onStartExport = { viewModel.startExport() },
                onDismiss = { viewModel.hideExportDialog() }
            )
        }
    }
}
