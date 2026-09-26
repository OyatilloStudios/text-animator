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

const MIN_BLOCK_MS = 300;

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
    onPlayPause, onRestart, onSeek, onBatchUpdate, onSelectLayer
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const dragRef = useRef<DragState | null>(null);

    const timeTextRef = useRef<HTMLSpanElement>(null);
    const playheadRef = useRef<HTMLDivElement>(null);

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

    const handleTrackStart = useCallback((clientX: number, isDirectTarget: boolean) => {
        if (!isDirectTarget) return;
        onSeekRef.current(getTimeFromX(clientX));

        const onMove = (ev: MouseEvent) => onSeekRef.current(getTimeFromX(ev.clientX));
        const onTouchMove = (ev: TouchEvent) => {
            if (ev.touches.length > 0) onSeekRef.current(getTimeFromX(ev.touches[0].clientX));
        };
        const onEnd = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onEnd);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    }, [getTimeFromX]);

    const handleTrackMouseDown = useCallback((e: React.MouseEvent) => {
        const isBlock = !!(e.target as HTMLElement).closest('[data-block-id]');
        handleTrackStart(e.clientX, !isBlock);
    }, [handleTrackStart]);

    const handleTrackTouchStart = useCallback((e: React.TouchEvent) => {
        const isBlock = !!(e.target as HTMLElement).closest('[data-block-id]');
        if (!isBlock && e.touches.length > 0) {
            handleTrackStart(e.touches[0].clientX, true);
        }
    }, [handleTrackStart]);

    const startDrag = useCallback((clientX: number, id: string, mode: 'move' | 'resize-start' | 'resize-end') => {
        onSelectLayerRef.current(id);

        const currentConfigs = configsRef.current;
        const config = currentConfigs.find(c => c.id === id);
        if (!config || !containerRef.current) return;

        if (mode === 'move') {
            const visibleTime = (config.delay + config.inDuration + 100) / 1000;
            const endTime = (config.delay + config.duration) / 1000;
            onSeekRef.current(Math.min(visibleTime, endTime, durationRef.current));
        }

        dragRef.current = {
            mode,
            activeId: id,
            startX: clientX,
            startDelay: config.delay,
            startDuration: config.duration,
            currentDelay: config.delay,
            currentDuration: config.duration,
        };

        const draggedEl = blockRefs.current.get(id);
        if (draggedEl) {
            draggedEl.style.transition = 'none';
            draggedEl.style.zIndex = '25';
            draggedEl.style.opacity = '0.9';
        }

        const onDragMove = (currentX: number) => {
            const drag = dragRef.current;
            if (!drag || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const deltaX = currentX - drag.startX;
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
                const rawEnd = (drag.startDelay + drag.startDuration) + deltaTimeMs;
                newDuration = Math.max(MIN_BLOCK_MS, Math.min(totalMs - drag.startDelay, rawEnd - drag.startDelay));
                newDelay = drag.startDelay;
            }

            const el = blockRefs.current.get(drag.activeId);
            if (el) {
                el.style.left = `${(newDelay / 1000 / dur) * 100}%`;
                el.style.width = `${(newDuration / 1000 / dur) * 100}%`;
            }

            drag.currentDelay = newDelay;
            drag.currentDuration = newDuration;
        };

        const onMouseMove = (ev: MouseEvent) => onDragMove(ev.clientX);
        const onTouchMove = (ev: TouchEvent) => {
            if (ev.touches.length > 0) onDragMove(ev.touches[0].clientX);
        };

        const onEnd = () => {
            const drag = dragRef.current;
            if (drag) {
                const dur = durationRef.current;
                blockRefs.current.forEach((el) => {
                    el.style.transition = 'left 150ms ease-out, width 150ms ease-out, opacity 150ms ease-out';
                    el.style.opacity = '';
                    el.style.zIndex = '';
                });

                const el = blockRefs.current.get(drag.activeId);
                if (el) {
                    el.style.left = `${(drag.currentDelay / 1000 / dur) * 100}%`;
                    el.style.width = `${(drag.currentDuration / 1000 / dur) * 100}%`;
                }

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

            dragRef.current = null;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onEnd);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onEnd);
    }, []);

    const setBlockRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
        if (el) blockRefs.current.set(id, el);
        else blockRefs.current.delete(id);
    }, []);

    if (duration === 0) return null;

    return (
        <div className="w-full select-none flex flex-col gap-1.5 px-2">
            {/* Controls Bar */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onPlayPause}
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white shadow-sm"
                    >
                        <Icon name={isPlaying ? 'pause' : 'play_arrow'} size={18} filled />
                    </button>
                    <button 
                        onClick={onRestart}
                        type="button"
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/80"
                    >
                        <Icon name="replay" size={16} />
                    </button>
                    <span ref={timeTextRef} className="text-[12px] font-mono font-medium text-white/80 tabular-nums ml-1">
                        {formatTime(timeController.getTime())}
                    </span>
                </div>
                <span className="text-[12px] font-mono font-medium text-white/40 tabular-nums">
                    {formatTime(duration)}
                </span>
            </div>

            {/* Timeline Tracks */}
            <div
                ref={containerRef}
                onMouseDown={handleTrackMouseDown}
                onTouchStart={handleTrackTouchStart}
                className="relative w-full cursor-pointer border border-[#333] rounded-xl p-1 bg-[#121212] flex flex-col gap-1 overflow-hidden"
                style={{ touchAction: 'none' }}
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
                            className={`relative h-[30px] w-full bg-white/[0.03] rounded-lg border transition-colors overflow-hidden ${
                                isSelected ? 'border-white/30 bg-white/[0.06]' : 'border-white/5'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectLayerRef.current(config.id);
                            }}
                        >
                            <div
                                ref={setBlockRef(config.id)}
                                data-block-id={config.id}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    startDrag(e.clientX, config.id, 'move');
                                }}
                                onTouchStart={(e) => {
                                    e.stopPropagation();
                                    if (e.touches.length > 0) startDrag(e.touches[0].clientX, config.id, 'move');
                                }}
                                className={`absolute top-0.5 bottom-0.5 rounded-md z-10 cursor-grab active:cursor-grabbing border overflow-hidden group/clip transition-colors ${
                                    isSelected
                                        ? 'bg-white text-black font-semibold border-white shadow-md'
                                        : 'bg-[#222] text-white/90 border-[#444]'
                                }`}
                                style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                            >
                                {/* Fade zones */}
                                <div className={`absolute left-0 top-0 bottom-0 pointer-events-none ${isSelected ? 'bg-black/15' : 'bg-white/10'}`} style={{ width: `${inW}%` }} />
                                <div className={`absolute right-0 top-0 bottom-0 pointer-events-none ${isSelected ? 'bg-black/15' : 'bg-white/10'}`} style={{ width: `${outW}%` }} />

                                {/* Resize handles with wide touch targets */}
                                <div 
                                    onMouseDown={(e) => { e.stopPropagation(); startDrag(e.clientX, config.id, 'resize-start'); }}
                                    onTouchStart={(e) => { e.stopPropagation(); if (e.touches.length > 0) startDrag(e.touches[0].clientX, config.id, 'resize-start'); }}
                                    className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/10 hover:bg-black/30 z-30 flex items-center justify-center"
                                >
                                    <div className="w-0.5 h-3 bg-white/40 rounded-full" />
                                </div>
                                <div 
                                    onMouseDown={(e) => { e.stopPropagation(); startDrag(e.clientX, config.id, 'resize-end'); }}
                                    onTouchStart={(e) => { e.stopPropagation(); if (e.touches.length > 0) startDrag(e.touches[0].clientX, config.id, 'resize-end'); }}
                                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/10 hover:bg-black/30 z-30 flex items-center justify-center"
                                >
                                    <div className="w-0.5 h-3 bg-white/40 rounded-full" />
                                </div>

                                {/* Layer label */}
                                <div className="absolute inset-0 flex items-center px-4 pointer-events-none overflow-hidden">
                                    <span className="text-[10px] font-medium truncate">
                                        {config.content.replace(/\n/g, ' ') || `Qatlam ${idx + 1}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Playhead */}
                <div
                    ref={playheadRef}
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    style={{ left: `${(timeController.getTime() / duration) * 100}%` }}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full shadow" />
                </div>
            </div>
        </div>
    );
});

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}
