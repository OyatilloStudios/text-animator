import React, { useRef, useEffect, useCallback, memo } from 'react';
import { timeController } from '../services/TimeController';
import { TextConfig } from '../types';
import { Icon } from './Icon';

interface TimelineProps {
    duration: number;
    configs: TextConfig[];
    selectedId: string | null;
    isPlaying: boolean;
    onPlayPause: () => void;
    onRestart: () => void;
    onSeek: (time: number) => void;
    onUpdateConfig: (updates: Partial<TextConfig>, id: string) => void;
    onBatchUpdate: (updates: Array<{ id: string; changes: Partial<TextConfig> }>) => void;
    onSelectLayer: (id: string) => void;
}

/** Minimum block duration in ms — blocks will not shrink below this */
const MIN_BLOCK_MS = 300;

/* ─── Drag state: entirely in refs for zero re-renders ─── */

interface DragState {
    mode: 'move' | 'resize-start' | 'resize-end';
    activeId: string;
    startX: number;
    startDelay: number;
    startDuration: number;
    currentDelay: number;
    currentDuration: number;
}

export const Timeline: React.FC<TimelineProps> = memo(({
    duration, configs, selectedId, isPlaying,
    onPlayPause, onRestart, onSeek, onUpdateConfig, onBatchUpdate, onSelectLayer
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const dragRef = useRef<DragState | null>(null);

    const timeTextRef = useRef<HTMLSpanElement>(null);
    const playheadRef = useRef<HTMLDivElement>(null);

    // Keep latest props in refs for closure-free access
    const durationRef = useRef(duration);
    durationRef.current = duration;
    const configsRef = useRef(configs);
    configsRef.current = configs;
    const onSeekRef = useRef(onSeek);
    onSeekRef.current = onSeek;
    const onSelectLayerRef = useRef(onSelectLayer);
    onSelectLayerRef.current = onSelectLayer;
    const onBatchUpdateRef = useRef(onBatchUpdate);
    onBatchUpdateRef.current = onBatchUpdate;

    /* ─── Playhead subscription ─── */
    useEffect(() => {
        const unsubscribe = timeController.subscribe((time) => {
            if (timeTextRef.current) timeTextRef.current.innerText = formatTime(time);
            if (durationRef.current > 0 && playheadRef.current) {
                playheadRef.current.style.left = `${(time / durationRef.current) * 100}%`;
            }
        });
        return unsubscribe;
    }, []);

    const getTimeFromX = useCallback((clientX: number) => {
        if (!containerRef.current || durationRef.current === 0) return 0;
        const rect = containerRef.current.getBoundingClientRect();
        const padding = 4;
        const width = rect.width - padding * 2;
        const x = clientX - rect.left - padding;
        return Math.max(0, Math.min(1, x / width)) * durationRef.current;
    }, []);

    /* ─── Seek (scrub playhead on track background) ─── */
    const handleTrackMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-block-id]')) return;
        onSeekRef.current(getTimeFromX(e.clientX));
        const onMove = (ev: MouseEvent) => onSeekRef.current(getTimeFromX(ev.clientX));
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [getTimeFromX]);

    /* ─── Block drag: only the dragged block moves during drag ─── */
    const startDrag = useCallback((e: React.MouseEvent, id: string, mode: 'move' | 'resize-start' | 'resize-end') => {
        e.stopPropagation();
        e.preventDefault();
        onSelectLayerRef.current(id);

        const currentConfigs = configsRef.current;
        const config = currentConfigs.find(c => c.id === id);
        if (!config || !containerRef.current) return;

        // Jump playhead for move clicks
        if (mode === 'move') {
            const visibleTime = (config.delay + config.inDuration + 100) / 1000;
            const endTime = (config.delay + config.duration) / 1000;
            onSeekRef.current(Math.min(visibleTime, endTime, durationRef.current));
        }

        dragRef.current = {
            mode,
            activeId: id,
            startX: e.clientX,
            startDelay: config.delay,
            startDuration: config.duration,
            currentDelay: config.delay,
            currentDuration: config.duration,
        };

        // Dragged block: no transition, elevated z-index, slightly transparent
        const draggedEl = blockRefs.current.get(id);
        if (draggedEl) {
            draggedEl.style.transition = 'none';
            draggedEl.style.zIndex = '25';
            draggedEl.style.opacity = '0.85';
        }

        document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ew-resize';

        const onMove = (ev: MouseEvent) => {
            const drag = dragRef.current;
            if (!drag || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const deltaX = ev.clientX - drag.startX;
            const deltaTimeMs = (deltaX / rect.width) * durationRef.current * 1000;
            const totalMs = durationRef.current * 1000;
            const dur = durationRef.current;

            let newDelay = drag.startDelay;
            let newDuration = drag.startDuration;

            if (drag.mode === 'move') {
                newDelay = Math.max(0, Math.min(totalMs - drag.startDuration, drag.startDelay + deltaTimeMs));
                newDuration = drag.startDuration;
            } else if (drag.mode === 'resize-start') {
                const rawDelay = drag.startDelay + deltaTimeMs;
                const maxDelay = (drag.startDelay + drag.startDuration) - MIN_BLOCK_MS;
                newDelay = Math.max(0, Math.min(maxDelay, rawDelay));
                newDuration = (drag.startDelay + drag.startDuration) - newDelay;
            } else {
                // resize-end
                const rawEnd = (drag.startDelay + drag.startDuration) + deltaTimeMs;
                newDuration = Math.max(MIN_BLOCK_MS, Math.min(totalMs - drag.startDelay, rawEnd - drag.startDelay));
                newDelay = drag.startDelay;
            }

            // Update ONLY the dragged block's DOM — everything else stays put
            const el = blockRefs.current.get(drag.activeId);
            if (el) {
                el.style.left = `${(newDelay / 1000 / dur) * 100}%`;
                el.style.width = `${(newDuration / 1000 / dur) * 100}%`;
            }

            drag.currentDelay = newDelay;
            drag.currentDuration = newDuration;
        };

        const onUp = () => {
            const drag = dragRef.current;

            if (drag) {
                const dur = durationRef.current;

                // Reset all block styles
                blockRefs.current.forEach((el) => {
                    el.style.transition = 'left 150ms ease-out, width 150ms ease-out, opacity 150ms ease-out';
                    el.style.opacity = '';
                    el.style.zIndex = '';
                });

                // Animate dragged block to final position
                const el = blockRefs.current.get(drag.activeId);
                if (el) {
                    el.style.left = `${(drag.currentDelay / 1000 / dur) * 100}%`;
                    el.style.width = `${(drag.currentDuration / 1000 / dur) * 100}%`;
                }

                // After animation, commit to React state
                setTimeout(() => {
                    blockRefs.current.forEach((el) => {
                        el.style.transition = '';
                    });

                    const updates = [{
                        id: drag.activeId,
                        changes: { delay: drag.currentDelay, duration: drag.currentDuration } as Partial<TextConfig>,
                    }];
                    onBatchUpdateRef.current(updates);
                }, 160);
            }

            document.body.style.cursor = '';
            dragRef.current = null;

            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    /* ─── Block ref callback ─── */
    const setBlockRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
        if (el) blockRefs.current.set(id, el);
        else blockRefs.current.delete(id);
    }, []);

    if (duration === 0) return null;

    return (
        <div className="w-full space-y-2 select-none flex flex-col">
            {/* Controls */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button onClick={onPlayPause}
                            className="w-[34px] h-[34px] flex items-center justify-center rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-white">
                            <Icon name={isPlaying ? 'pause' : 'play_arrow'} size={18} filled />
                        </button>
                        <button onClick={onRestart}
                            className="w-[34px] h-[34px] flex items-center justify-center rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-white">
                            <Icon name="replay" size={16} />
                        </button>
                    </div>
                    <span ref={timeTextRef} style={{ fontFamily: 'Google Sans Flex' }} className="text-[12px] font-medium tracking-[0.1px] text-[rgba(255,255,255,0.35)] tabular-nums">
                        {formatTime(timeController.getTime())}
                    </span>
                </div>
                <span style={{ fontFamily: 'Google Sans Flex' }} className="text-[12px] font-medium tracking-[0.1px] text-[rgba(255,255,255,0.35)] tabular-nums">
                    {formatTime(duration)}
                </span>
            </div>

            {/* Hit area wrapper — extends above the visible tracks for easier scrubbing */}
            <div
                ref={containerRef}
                onMouseDown={handleTrackMouseDown}
                className="relative w-full cursor-pointer border border-[#595959] rounded-xl p-1 bg-transparent flex flex-col gap-1.5 overflow-hidden"
            >
                {configs.map((config, idx) => {
                    const startPercent = ((config.delay || 0) / 1000 / duration) * 100;
                    const widthPercent = ((config.duration || 0) / 1000 / duration) * 100;
                    const isSelected = selectedId === config.id;
                    const inW = (config.inDuration / config.duration) * 100;
                    const outW = (config.outDuration / config.duration) * 100;

                    return (
                        <div
                            key={config.id}
                            className={`relative h-[34px] w-full bg-white/5 rounded-lg border border-white/5 transition-colors overflow-hidden ${
                                isSelected ? 'bg-white/[0.08] border-white/10' : 'hover:bg-white/[0.07]'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectLayerRef.current(config.id);
                            }}
                        >
                            <div
                                ref={setBlockRef(config.id)}
                                data-block-id={config.id}
                                onMouseDown={(e) => startDrag(e, config.id, 'move')}
                                className={`absolute top-0.5 bottom-0.5 rounded-md z-10 cursor-grab active:cursor-grabbing border overflow-hidden group/clip will-change-[left,width] transition-colors ${
                                    isSelected
                                        ? 'bg-[#969696] border-[#969696]'
                                        : 'bg-transparent border-[#595959] hover:bg-white/5 hover:border-[#7a7a7a]'
                                }`}
                                style={{ left: `${startPercent}%`, width: `${widthPercent}%`, opacity: 0.85 }}
                            >
                                {/* In/Out fade zones */}
                                <div className={`absolute left-0 top-0 bottom-0 pointer-events-none ${isSelected ? 'bg-black/10' : 'bg-white/5'}`} style={{ width: `${inW}%` }} />
                                <div className={`absolute right-0 top-0 bottom-0 pointer-events-none ${isSelected ? 'bg-black/10' : 'bg-white/5'}`} style={{ width: `${outW}%` }} />

                                {/* Resize handles */}
                                <div onMouseDown={(e) => startDrag(e, config.id, 'resize-start')}
                                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-30 transition-colors" />
                                <div onMouseDown={(e) => startDrag(e, config.id, 'resize-end')}
                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-30 transition-colors" />

                                {/* Label */}
                                <div className="absolute inset-0 flex items-center px-3 pointer-events-none overflow-hidden">
                                    <span style={{ fontFamily: 'Google Sans Flex' }} className={`text-[11px] font-medium tracking-[0.1px] whitespace-nowrap truncate ${isSelected ? 'text-black font-semibold' : 'text-white/80'}`}>
                                        {config.content.replace(/\n/g, ' ') || `Layer ${idx + 1}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Unified vertical Playhead line spanning full height of multi-track timeline */}
                <div
                    ref={playheadRef}
                    className="absolute top-0 bottom-0 w-px bg-white/70 z-40 pointer-events-none"
                    style={{ left: `${(timeController.getTime() / duration) * 100}%` }}
                >
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                </div>
            </div>
        </div>
    );
});

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}