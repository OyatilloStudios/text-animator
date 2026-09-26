package com.example.textanimator.ui.viewmodel

import androidx.compose.ui.graphics.Color
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.textanimator.model.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.UUID

data class TextAnimatorUiState(
    val textConfigs: List<TextConfig> = listOf(
        TextConfig(
            id = "layer-1",
            content = "Text\nAnimator",
            fontFamilyName = "Instrument Sans",
            fontSize = 58f,
            fontWeight = 700,
            positionX = 50f,
            positionY = 46f,
            effect = AnimationEffect.BLUR_IN,
            loopEffect = AnimationEffect.WAVE,
            outEffect = AnimationEffect.BLUR_OUT,
            delayMs = 200L,
            durationMs = 4500L,
            inDurationMs = 800L,
            outDurationMs = 400L,
            color = Color.White
        )
    ),
    val selectedTextId: String? = "layer-1",
    val currentTimeMs: Long = 0L,
    val isPlaying: Boolean = false,
    val totalDurationSec: Int = 8,
    val backgroundType: BackgroundType = BackgroundType.GRADIENT,
    val bgColor1: Color = Color(0xFF1A1A1E),
    val bgColor2: Color = Color(0xFF09090B),
    val bgGradientAngle: Float = 135f,
    val aspectRatio: AspectRatioOption = AspectRatioOption.RATIO_9_16,
    val exportQuality: ExportQuality = ExportQuality.FULL_HD,
    val exportFps: ExportFps = ExportFps.FPS_30,
    val isRendering: Boolean = false,
    val renderProgress: Int = 0,
    val showExportDialog: Boolean = false
)

class TextAnimatorViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(TextAnimatorUiState())
    val uiState: StateFlow<TextAnimatorUiState> = _uiState.asStateFlow()

    private var playbackJob: Job? = null

    val selectedConfig: TextConfig?
        get() = _uiState.value.textConfigs.find { it.id == _uiState.value.selectedTextId }

    fun togglePlayPause() {
        if (_uiState.value.isPlaying) {
            pause()
        } else {
            play()
        }
    }

    fun play() {
        _uiState.update { it.copy(isPlaying = true) }
        playbackJob?.cancel()
        playbackJob = viewModelScope.launch {
            val stepMs = 30L
            while (isActive) {
                delay(stepMs)
                _uiState.update { state ->
                    val maxMs = state.totalDurationSec * 1000L
                    val nextTime = state.currentTimeMs + stepMs
                    if (nextTime >= maxMs) {
                        state.copy(currentTimeMs = 0L)
                    } else {
                        state.copy(currentTimeMs = nextTime)
                    }
                }
            }
        }
    }

    fun pause() {
        _uiState.update { it.copy(isPlaying = false) }
        playbackJob?.cancel()
        playbackJob = null
    }

    fun rewind() {
        _uiState.update { it.copy(currentTimeMs = 0L) }
    }

    fun seek(timeMs: Long) {
        val totalMs = _uiState.value.totalDurationSec * 1000L
        _uiState.update { it.copy(currentTimeMs = timeMs.coerceIn(0L, totalMs)) }
    }

    fun selectLayer(id: String) {
        _uiState.update { it.copy(selectedTextId = id) }
    }

    fun updateConfig(updated: TextConfig) {
        _uiState.update { state ->
            val updatedList = state.textConfigs.map {
                if (it.id == updated.id) updated else it
            }
            state.copy(textConfigs = updatedList)
        }
    }

    fun updatePosition(id: String, x: Float, y: Float) {
        _uiState.update { state ->
            val updatedList = state.textConfigs.map {
                if (it.id == id) it.copy(positionX = x, positionY = y) else it
            }
            state.copy(textConfigs = updatedList)
        }
    }

    fun addLayer() {
        val newId = UUID.randomUUID().toString().take(8)
        val currentConfigs = _uiState.value.textConfigs
        val lastConfig = currentConfigs.lastOrNull()

        val newLayer = TextConfig(
            id = newId,
            content = "New Motion",
            fontFamilyName = lastConfig?.fontFamilyName ?: "Google Sans",
            fontSize = 44f,
            fontWeight = 600,
            positionX = 50f,
            positionY = ((lastConfig?.positionY ?: 40f) + 15f).coerceAtMost(80f),
            effect = AnimationEffect.SLIDE_UP,
            loopEffect = AnimationEffect.LOOP_NONE,
            outEffect = AnimationEffect.EXIT_NONE,
            delayMs = ((lastConfig?.delayMs ?: 0L) + 600L).coerceAtMost((_uiState.value.totalDurationSec * 1000L) - 1500L),
            durationMs = 3000L,
            inDurationMs = 600L,
            color = Color.White
        )

        _uiState.update {
            it.copy(
                textConfigs = it.textConfigs + newLayer,
                selectedTextId = newId
            )
        }
    }

    fun deleteLayer(id: String) {
        if (_uiState.value.textConfigs.size <= 1) return
        _uiState.update { state ->
            val filtered = state.textConfigs.filter { it.id != id }
            val nextSelected = if (state.selectedTextId == id) {
                filtered.lastOrNull()?.id
            } else state.selectedTextId
            state.copy(textConfigs = filtered, selectedTextId = nextSelected)
        }
    }

    fun moveLayer(id: String, up: Boolean) {
        _uiState.update { state ->
            val list = state.textConfigs.toMutableList()
            val idx = list.indexOfFirst { it.id == id }
            if (idx == -1) return@update state

            val targetIdx = if (up) idx - 1 else idx + 1
            if (targetIdx in list.indices) {
                val item = list.removeAt(idx)
                list.add(targetIdx, item)
            }
            state.copy(textConfigs = list)
        }
    }

    fun duplicateLayer(id: String) {
        val original = _uiState.value.textConfigs.find { it.id == id } ?: return
        val newId = UUID.randomUUID().toString().take(8)
        val duplicated = original.copy(
            id = newId,
            content = "${original.content} (Copy)",
            positionY = (original.positionY + 8f).coerceAtMost(85f),
            delayMs = (original.delayMs + 300L).coerceAtMost((_uiState.value.totalDurationSec * 1000L) - 1000L)
        )

        _uiState.update {
            it.copy(
                textConfigs = it.textConfigs + duplicated,
                selectedTextId = newId
            )
        }
    }

    fun setBackgroundType(type: BackgroundType) {
        _uiState.update { it.copy(backgroundType = type) }
    }

    fun setBgColor1(color: Color) {
        _uiState.update { it.copy(bgColor1 = color) }
    }

    fun setBgColor2(color: Color) {
        _uiState.update { it.copy(bgColor2 = color) }
    }

    fun setBgGradientAngle(angle: Float) {
        _uiState.update { it.copy(bgGradientAngle = angle) }
    }

    fun setTotalDuration(sec: Int) {
        _uiState.update { it.copy(totalDurationSec = sec.coerceIn(1, 60)) }
    }

    fun setAspectRatio(ratio: AspectRatioOption) {
        _uiState.update { it.copy(aspectRatio = ratio) }
    }

    fun setExportQuality(quality: ExportQuality) {
        _uiState.update { it.copy(exportQuality = quality) }
    }

    fun setExportFps(fps: ExportFps) {
        _uiState.update { it.copy(exportFps = fps) }
    }

    fun showExportDialog() {
        pause()
        _uiState.update { it.copy(showExportDialog = true, isRendering = false, renderProgress = 0) }
    }

    fun hideExportDialog() {
        _uiState.update { it.copy(showExportDialog = false, isRendering = false) }
    }

    fun startExport() {
        _uiState.update { it.copy(isRendering = true, renderProgress = 0) }
        viewModelScope.launch {
            for (p in 1..100) {
                delay(25L)
                _uiState.update { it.copy(renderProgress = p) }
            }
        }
    }
}
