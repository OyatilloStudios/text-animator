package com.example.textanimator.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.textanimator.model.*
import kotlin.math.roundToInt

enum class PanelTab(val title: String, val icon: ImageVector) {
    TEXT("Text", Icons.Rounded.TextFields),
    STYLE("Style", Icons.Rounded.Palette),
    EFFECTS("Effects", Icons.Rounded.AutoAwesome),
    TIMING("Timing", Icons.Rounded.Timer),
    BACKGROUND("Background", Icons.Rounded.Wallpaper),
    LAYERS("Layers", Icons.Rounded.Layers)
}

@Composable
fun BottomPanel(
    modifier: Modifier = Modifier,
    selectedConfig: TextConfig?,
    allConfigs: List<TextConfig>,
    backgroundType: BackgroundType,
    bgColor1: Color,
    bgColor2: Color,
    bgGradientAngle: Float,
    totalDurationSec: Int,
    onUpdateConfig: (TextConfig) -> Unit,
    onAddLayer: () -> Unit,
    onDeleteLayer: (String) -> Unit,
    onSelectLayer: (String) -> Unit,
    onMoveLayer: (id: String, up: Boolean) -> Unit,
    onDuplicateLayer: (String) -> Unit,
    onBgTypeChange: (BackgroundType) -> Unit,
    onBgColor1Change: (Color) -> Unit,
    onBgColor2Change: (Color) -> Unit,
    onBgGradientAngleChange: (Float) -> Unit,
    onTotalDurationChange: (Int) -> Unit,
    onRequestEffectPicker: (EffectCategory) -> Unit,
    onRequestColorPicker: (title: String, initialColor: Color, onColorChosen: (Color) -> Unit) -> Unit
) {
    var activeTab by remember { mutableStateOf(PanelTab.TEXT) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
            .background(Color(0xFF141418))
            .border(1.dp, Color(0xFF24242E), RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
    ) {
        // Tab Navigation Header
        ScrollableTabRow(
            selectedTabIndex = activeTab.ordinal,
            containerColor = Color(0xFF18181F),
            contentColor = Color.White,
            edgePadding = 8.dp,
            indicator = {},
            divider = {}
        ) {
            PanelTab.entries.forEach { tab ->
                val isSelected = tab == activeTab
                Tab(
                    selected = isSelected,
                    onClick = { activeTab = tab },
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 6.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) Color(0xFF312E81) else Color.Transparent)
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.title,
                            tint = if (isSelected) Color(0xFF818CF8) else Color(0xFF94A3B8),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = tab.title,
                            color = if (isSelected) Color.White else Color(0xFF94A3B8),
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                        )
                    }
                }
            }
        }

        // Tab Content Area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(250.dp)
                .padding(12.dp)
                .verticalScroll(rememberScrollState())
        ) {
            when (activeTab) {
                PanelTab.TEXT -> {
                    if (selectedConfig != null) {
                        TextTabContent(
                            config = selectedConfig,
                            onUpdate = onUpdateConfig
                        )
                    } else {
                        NoLayerSelectedPrompt()
                    }
                }
                PanelTab.STYLE -> {
                    if (selectedConfig != null) {
                        StyleTabContent(
                            config = selectedConfig,
                            onUpdate = onUpdateConfig,
                            onRequestColorPicker = onRequestColorPicker
                        )
                    } else {
                        NoLayerSelectedPrompt()
                    }
                }
                PanelTab.EFFECTS -> {
                    if (selectedConfig != null) {
                        EffectsTabContent(
                            config = selectedConfig,
                            onUpdate = onUpdateConfig,
                            onRequestEffectPicker = onRequestEffectPicker
                        )
                    } else {
                        NoLayerSelectedPrompt()
                    }
                }
                PanelTab.TIMING -> {
                    if (selectedConfig != null) {
                        TimingTabContent(
                            config = selectedConfig,
                            totalDurationSec = totalDurationSec,
                            onUpdate = onUpdateConfig
                        )
                    } else {
                        NoLayerSelectedPrompt()
                    }
                }
                PanelTab.BACKGROUND -> {
                    BackgroundTabContent(
                        backgroundType = backgroundType,
                        bgColor1 = bgColor1,
                        bgColor2 = bgColor2,
                        angle = bgGradientAngle,
                        duration = totalDurationSec,
                        onBgTypeChange = onBgTypeChange,
                        onBgColor1Change = onBgColor1Change,
                        onBgColor2Change = onBgColor2Change,
                        onAngleChange = onBgGradientAngleChange,
                        onDurationChange = onTotalDurationChange,
                        onRequestColorPicker = onRequestColorPicker
                    )
                }
                PanelTab.LAYERS -> {
                    LayersTabContent(
                        allConfigs = allConfigs,
                        selectedId = selectedConfig?.id,
                        onSelectLayer = onSelectLayer,
                        onAddLayer = onAddLayer,
                        onMoveLayer = onMoveLayer,
                        onDuplicateLayer = onDuplicateLayer,
                        onDeleteLayer = onDeleteLayer
                    )
                }
            }
        }
    }
}

@Composable
private fun TextTabContent(
    config: TextConfig,
    onUpdate: (TextConfig) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        OutlinedTextField(
            value = config.content,
            onValueChange = { onUpdate(config.copy(content = it)) },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Text Content", color = Color(0xFF94A3B8), fontSize = 12.sp) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = Color(0xFF6366F1),
                unfocusedBorderColor = Color(0xFF2E2E38)
            ),
            shape = RoundedCornerShape(8.dp)
        )

        // Text Inspo Presets
        Text("Inspirations", color = Color(0xFF94A3B8), fontSize = 11.sp)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(Presets.TEXT_INSPIRATIONS) { inspo ->
                SuggestionChip(
                    onClick = { onUpdate(config.copy(content = inspo)) },
                    label = { Text(inspo.replace("\n", " "), fontSize = 11.sp, color = Color(0xFFE2E8F0)) },
                    colors = SuggestionChipDefaults.suggestionChipColors(containerColor = Color(0xFF1E1E28)),
                    border = SuggestionChipDefaults.suggestionChipBorder(enabled = true, borderColor = Color(0xFF333344))
                )
            }
        }

        // Text Alignment & Position Presets
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Alignment", color = Color(0xFF94A3B8), fontSize = 12.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                listOf(
                    Pair(TextAlign.Left, Icons.Rounded.FormatAlignLeft),
                    Pair(TextAlign.Center, Icons.Rounded.FormatAlignCenter),
                    Pair(TextAlign.Right, Icons.Rounded.FormatAlignRight)
                ).forEach { (align, icon) ->
                    val isSelected = config.textAlign == align
                    IconButton(
                        onClick = { onUpdate(config.copy(textAlign = align)) },
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) Color(0xFF312E81) else Color(0xFF1E1E26))
                    ) {
                        Icon(imageVector = icon, contentDescription = null, tint = if (isSelected) Color.White else Color(0xFF94A3B8), modifier = Modifier.size(18.dp))
                    }
                }
            }
        }

        // Position presets
        Text("Position Presets", color = Color(0xFF94A3B8), fontSize = 11.sp)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(Presets.POSITION_PRESETS) { pos ->
                SuggestionChip(
                    onClick = { onUpdate(config.copy(positionX = pos.x, positionY = pos.y)) },
                    label = { Text(pos.name, fontSize = 11.sp, color = Color(0xFFE2E8F0)) },
                    colors = SuggestionChipDefaults.suggestionChipColors(containerColor = Color(0xFF1E1E28)),
                    border = SuggestionChipDefaults.suggestionChipBorder(enabled = true, borderColor = Color(0xFF333344))
                )
            }
        }
    }
}

@Composable
private fun StyleTabContent(
    config: TextConfig,
    onUpdate: (TextConfig) -> Unit,
    onRequestColorPicker: (title: String, initialColor: Color, onColorChosen: (Color) -> Unit) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Font Selection
        Text("Typography Font", color = Color(0xFF94A3B8), fontSize = 11.sp)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            items(Presets.FONTS) { font ->
                val isSelected = config.fontFamilyName == font
                FilterChip(
                    selected = isSelected,
                    onClick = { onUpdate(config.copy(fontFamilyName = font)) },
                    label = { Text(font, fontSize = 11.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Color(0xFF312E81),
                        selectedLabelColor = Color.White,
                        containerColor = Color(0xFF1E1E28),
                        labelColor = Color(0xFF94A3B8)
                    )
                )
            }
        }

        // Font Size Slider
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Font Size: ${config.fontSize.roundToInt()}sp", color = Color(0xFFE2E8F0), fontSize = 12.sp)
        }
        Slider(
            value = config.fontSize,
            onValueChange = { onUpdate(config.copy(fontSize = it)) },
            valueRange = 18f..110f,
            colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF6366F1))
        )

        // Text Colors & Background Highlighting
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Text Color
            Column(modifier = Modifier.weight(1f)) {
                Text("Text Color", color = Color(0xFF94A3B8), fontSize = 11.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF1E1E28))
                        .border(1.dp, Color(0xFF333344), RoundedCornerShape(8.dp))
                        .clickable {
                            onRequestColorPicker("Text Color", config.color) { newCol ->
                                onUpdate(config.copy(color = newCol))
                            }
                        }
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(20.dp).clip(CircleShape).background(config.color))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Choose", color = Color.White, fontSize = 12.sp)
                }
            }

            // Text Highlight Background
            Column(modifier = Modifier.weight(1f)) {
                Text("Highlight BG", color = Color(0xFF94A3B8), fontSize = 11.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF1E1E28))
                        .border(1.dp, Color(0xFF333344), RoundedCornerShape(8.dp))
                        .clickable {
                            val newOpacity = if (config.bgOpacity > 0f) 0f else 0.85f
                            onUpdate(config.copy(bgOpacity = newOpacity))
                        }
                        .padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        if (config.bgOpacity > 0f) "Enabled" else "None",
                        color = if (config.bgOpacity > 0f) Color(0xFF818CF8) else Color(0xFF94A3B8),
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun EffectsTabContent(
    config: TextConfig,
    onUpdate: (TextConfig) -> Unit,
    onRequestEffectPicker: (EffectCategory) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Entrance Effect Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFF1E1E28))
                .border(1.dp, Color(0xFF333344), RoundedCornerShape(10.dp))
                .clickable { onRequestEffectPicker(EffectCategory.ENTRANCE) }
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Entrance Effect", color = Color(0xFF94A3B8), fontSize = 11.sp)
                Text(config.effect.displayName, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
            Icon(imageVector = Icons.Rounded.ChevronRight, contentDescription = null, tint = Color(0xFF818CF8))
        }

        // Loop Kinetic Effect Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFF1E1E28))
                .border(1.dp, Color(0xFF333344), RoundedCornerShape(10.dp))
                .clickable { onRequestEffectPicker(EffectCategory.LOOP) }
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Kinetic Loop Effect", color = Color(0xFF94A3B8), fontSize = 11.sp)
                Text(config.loopEffect.displayName, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
            Icon(imageVector = Icons.Rounded.ChevronRight, contentDescription = null, tint = Color(0xFF818CF8))
        }

        // Exit Effect Button
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFF1E1E28))
                .border(1.dp, Color(0xFF333344), RoundedCornerShape(10.dp))
                .clickable { onRequestEffectPicker(EffectCategory.EXIT) }
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Exit Effect", color = Color(0xFF94A3B8), fontSize = 11.sp)
                Text(config.outEffect.displayName, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            }
            Icon(imageVector = Icons.Rounded.ChevronRight, contentDescription = null, tint = Color(0xFF818CF8))
        }

        // Speed & Intensity Sliders
        Text("Effect Speed: ${(config.speed * 100).roundToInt()}%", color = Color(0xFFE2E8F0), fontSize = 12.sp)
        Slider(
            value = config.speed,
            onValueChange = { onUpdate(config.copy(speed = it)) },
            valueRange = 0.25f..3.0f,
            colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF6366F1))
        )
    }
}

@Composable
private fun TimingTabContent(
    config: TextConfig,
    totalDurationSec: Int,
    onUpdate: (TextConfig) -> Unit
) {
    val maxMs = (totalDurationSec * 1000).toFloat()

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Start Delay Slider
        Text("Start Delay: ${config.delayMs}ms", color = Color(0xFFE2E8F0), fontSize = 12.sp)
        Slider(
            value = config.delayMs.toFloat(),
            onValueChange = { onUpdate(config.copy(delayMs = it.toLong())) },
            valueRange = 0f..(maxMs - 500f).coerceAtLeast(100f),
            colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF6366F1))
        )

        // Duration Slider
        Text("Lifespan Duration: ${config.durationMs}ms", color = Color(0xFFE2E8F0), fontSize = 12.sp)
        Slider(
            value = config.durationMs.toFloat(),
            onValueChange = { onUpdate(config.copy(durationMs = it.toLong())) },
            valueRange = 500f..maxMs,
            colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF6366F1))
        )

        // In-Duration Slider
        Text("In Transition Length: ${config.inDurationMs}ms", color = Color(0xFFE2E8F0), fontSize = 12.sp)
        Slider(
            value = config.inDurationMs.toFloat(),
            onValueChange = { onUpdate(config.copy(inDurationMs = it.toLong())) },
            valueRange = 100f..2000f,
            colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF6366F1))
        )
    }
}

@Composable
private fun BackgroundTabContent(
    backgroundType: BackgroundType,
    bgColor1: Color,
    bgColor2: Color,
    angle: Float,
    duration: Int,
    onBgTypeChange: (BackgroundType) -> Unit,
    onBgColor1Change: (Color) -> Unit,
    onBgColor2Change: (Color) -> Unit,
    onAngleChange: (Float) -> Unit,
    onDurationChange: (Int) -> Unit,
    onRequestColorPicker: (title: String, initialColor: Color, onColorChosen: (Color) -> Unit) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Background Type", color = Color(0xFF94A3B8), fontSize = 11.sp)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            BackgroundType.entries.forEach { type ->
                val isSelected = type == backgroundType
                OutlinedButton(
                    onClick = { onBgTypeChange(type) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (isSelected) Color(0xFF312E81) else Color(0xFF1E1E28)
                    ),
                    border = ButtonDefaults.outlinedButtonBorder.copy(
                        brush = androidx.compose.ui.graphics.SolidColor(
                            if (isSelected) Color(0xFF6366F1) else Color(0xFF333344)
                        )
                    ),
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                ) {
                    Text(type.displayName.take(8), fontSize = 11.sp, color = if (isSelected) Color.White else Color(0xFF94A3B8))
                }
            }
        }

        // Color Picks
        if (backgroundType == BackgroundType.GRADIENT || backgroundType == BackgroundType.SOLID) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Color 1", color = Color(0xFF94A3B8), fontSize = 11.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFF1E1E28))
                            .clickable {
                                onRequestColorPicker("Background Color 1", bgColor1, onBgColor1Change)
                            }
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.size(20.dp).clip(CircleShape).background(bgColor1))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Pick", color = Color.White, fontSize = 12.sp)
                    }
                }

                if (backgroundType == BackgroundType.GRADIENT) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Color 2", color = Color(0xFF94A3B8), fontSize = 11.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF1E1E28))
                                .clickable {
                                    onRequestColorPicker("Background Color 2", bgColor2, onBgColor2Change)
                                }
                                .padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(modifier = Modifier.size(20.dp).clip(CircleShape).background(bgColor2))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Pick", color = Color.White, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Total Duration Slider
        Text("Total Project Duration: ${duration}s", color = Color(0xFFE2E8F0), fontSize = 12.sp)
        Slider(
            value = duration.toFloat(),
            onValueChange = { onDurationChange(it.roundToInt()) },
            valueRange = 2f..30f,
            colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = Color(0xFF6366F1))
        )
    }
}

@Composable
private fun LayersTabContent(
    allConfigs: List<TextConfig>,
    selectedId: String?,
    onSelectLayer: (String) -> Unit,
    onAddLayer: () -> Unit,
    onMoveLayer: (id: String, up: Boolean) -> Unit,
    onDuplicateLayer: (String) -> Unit,
    onDeleteLayer: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Text Layers (${allConfigs.size})", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Button(
                onClick = onAddLayer,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Icon(imageVector = Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add", fontSize = 12.sp)
            }
        }

        allConfigs.forEachIndexed { index, config ->
            val isSelected = config.id == selectedId
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (isSelected) Color(0xFF2B2B3C) else Color(0xFF1A1A22))
                    .border(1.dp, if (isSelected) Color(0xFF6366F1) else Color(0xFF2C2C36), RoundedCornerShape(8.dp))
                    .clickable { onSelectLayer(config.id) }
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = config.content.replace("\n", " "),
                        color = if (isSelected) Color.White else Color(0xFFE2E8F0),
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                        maxLines = 1
                    )
                    Text(
                        text = "${config.effect.displayName} • ${config.loopEffect.displayName}",
                        color = Color(0xFF94A3B8),
                        fontSize = 10.sp
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (index > 0) {
                        IconButton(onClick = { onMoveLayer(config.id, true) }, modifier = Modifier.size(28.dp)) {
                            Icon(imageVector = Icons.Rounded.ArrowUpward, contentDescription = "Move Up", tint = Color(0xFF94A3B8), modifier = Modifier.size(16.dp))
                        }
                    }
                    if (index < allConfigs.size - 1) {
                        IconButton(onClick = { onMoveLayer(config.id, false) }, modifier = Modifier.size(28.dp)) {
                            Icon(imageVector = Icons.Rounded.ArrowDownward, contentDescription = "Move Down", tint = Color(0xFF94A3B8), modifier = Modifier.size(16.dp))
                        }
                    }
                    IconButton(onClick = { onDuplicateLayer(config.id) }, modifier = Modifier.size(28.dp)) {
                        Icon(imageVector = Icons.Rounded.ContentCopy, contentDescription = "Duplicate", tint = Color(0xFF94A3B8), modifier = Modifier.size(16.dp))
                    }
                    if (allConfigs.size > 1) {
                        IconButton(onClick = { onDeleteLayer(config.id) }, modifier = Modifier.size(28.dp)) {
                            Icon(imageVector = Icons.Rounded.Delete, contentDescription = "Delete", tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NoLayerSelectedPrompt() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text("No layer selected. Tap a layer or add one to edit.", color = Color(0xFF94A3B8), fontSize = 13.sp)
    }
}
