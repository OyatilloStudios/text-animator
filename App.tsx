import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Flow } from 'flow-sdk';
import { Stage } from './components/Stage';
import { Timeline } from './components/Timeline';
import { MobileBottomPanel } from './components/MobileBottomPanel';
import { TextConfig, MediaAsset, GOOGLE_FONTS_URL } from './types';
import { renderVideoMobile } from './services/renderer';
import { timeController } from './services/TimeController';
import { Download, Plus, Film, X, Check, Loader2 } from 'lucide-react';

function useGlobalStyles() {
    useEffect(() => {
        const id = 'flow-design-system-css';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = `
                input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; cursor: pointer; padding: 6px 0; }
                input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #444; border-radius: 9999px; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: white; box-shadow: 0px 1px 4px rgba(0,0,0,0.6); margin-top: -6px; }
                html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; height: 100dvh; background: #0e0e0e; font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing: antialiased; }
            `;
            document.head.appendChild(style);
        }

        const fontId = 'dynamic-google-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = GOOGLE_FONTS_URL;
            document.head.appendChild(link);
        }
    }, []);
}

export default function App() {
    useGlobalStyles();

    const [bgMedia, setBgMedia] = useState<MediaAsset | null>(null);
    const [duration, setDuration] = useState(8);
    const [bgType, setBgType] = useState<'transparent' | 'solid' | 'gradient' | 'media'>('gradient');
    const [bgColor1, setBgColor1] = useState<string>('#1a1a1e');
    const [bgColor2, setBgColor2] = useState<string>('#09090b');
    const [bgGradientAngle, setBgGradientAngle] = useState<number>(135);
    const [textConfigs, setTextConfigs] = useState<TextConfig[]>([
        {
            id: '1',
            content: 'Text\nAnimator',
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: 1.1,
            textAlign: 'center',
            color: '#ffffff',
            backgroundColor: '#000000',
            bgOpacity: 0,
            position: { x: 50, y: 50 },
            effect: 'blur-in',
            outEffect: 'none',
            loopEffect: 'none',
            granularity: 'word',
            easing: 'smooth',
            speed: 1,
            stackTransition: 'blur',
            duration: 3500,
            delay: 200,
            inDuration: 800,
            outDuration: 0,
            intensity: 50,
            inDirection: 'first',
            outDirection: 'first',
            shadowColor: '#000000',
            shadowBlur: 10,
            shadowAngle: 45,
            shadowDistance: 4,
            innerShadowColor: '#000000',
            innerShadowBlur: 0,
            innerShadowAngle: 45,
            innerShadowDistance: 0,
            strokeColor: '#000000',
            strokeWidth: 0,
        }
    ]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>('1');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState(0);
    const [exportAspectRatio, setExportAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('9:16');
    const [exportQuality, setExportQuality] = useState<'HD' | 'FullHD' | 'UHD'>('FullHD');
    const [exportFps, setExportFps] = useState<24 | 25 | 30 | 60>(30);
    const [exportedMedia, setExportedMedia] = useState<{ dataUrl: string, mimeType: string, fileName?: string } | null>(null);
    const [showExportSettings, setShowExportSettings] = useState(false);
    const prevExportUrl = useRef<string | null>(null);
    const prevMediaUrl = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [key] = useState(0);

    const handleDeleteLayer = useCallback((id: string) => {
        if (textConfigs.length <= 1) return;
        if (selectedTextId === id) {
            const idx = textConfigs.findIndex(c => c.id === id);
            const next = textConfigs[idx + 1] ?? textConfigs[idx - 1];
            setSelectedTextId(next.id);
        }
        setTextConfigs(prev => prev.filter(c => c.id !== id));
    }, [textConfigs, selectedTextId]);

    const handleSelectMedia = async () => {
        try {
            const media = await Flow.media.select();
            if (media) {
                const bytes = Uint8Array.from(atob(media.base64), c => c.charCodeAt(0));
                const blob = new Blob([bytes], { type: media.mimeType });
                const blobUrl = URL.createObjectURL(blob);
                if (prevMediaUrl.current) URL.revokeObjectURL(prevMediaUrl.current);
                prevMediaUrl.current = blobUrl;
                setBgMedia({ type: media.type, dataUrl: blobUrl, mimeType: media.mimeType });
                setBgType('media');
                setIsPlaying(true);
                timeController.setTime(0);
            }
        } catch (err) {
            console.error('Media tanlashda xatolik', err);
        }
    };

    const handleAddLayer = useCallback(() => {
        const newId = Math.random().toString(36).substr(2, 9);
        const lastLayer = textConfigs[textConfigs.length - 1];
        const newLayer: TextConfig = {
            ...(lastLayer || {
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 54,
                fontWeight: 600,
                letterSpacing: 0,
                lineHeight: 1.1,
                textAlign: 'center',
                color: '#ffffff',
                backgroundColor: '#000000',
                bgOpacity: 0,
                effect: 'blur-in',
                outEffect: 'none',
                loopEffect: 'none',
                granularity: 'word',
                easing: 'smooth',
                speed: 1,
                stackTransition: 'blur',
                intensity: 50,
                inDirection: 'first',
                outDirection: 'first',
                shadowColor: '#000000',
                shadowBlur: 8,
                shadowAngle: 45,
                shadowDistance: 3,
                innerShadowColor: '#000000',
                innerShadowBlur: 0,
                innerShadowAngle: 45,
                innerShadowDistance: 0,
                strokeColor: '#000000',
                strokeWidth: 0,
            }),
            id: newId,
            content: 'Yangi Matn',
            position: { x: 50, y: Math.min(80, (lastLayer ? lastLayer.position.y + 15 : 50)) },
            delay: lastLayer ? Math.min(lastLayer.delay + 600, duration * 1000 - 1500) : 0,
            duration: 2500,
            inDuration: 700,
            outDuration: 0,
            intensity: 50,
        };
        setTextConfigs(prev => [...prev, newLayer]);
        setSelectedTextId(newId);
    }, [textConfigs, duration]);

    const handleMoveLayer = useCallback((id: string, direction: 'up' | 'down') => {
        setTextConfigs(prev => {
            const index = prev.findIndex(c => c.id === id);
            if (index === -1) return prev;
            const nextIndex = direction === 'up' ? index + 1 : index - 1;
            if (nextIndex < 0 || nextIndex >= prev.length) return prev;
            const newConfigs = [...prev];
            const temp = newConfigs[index];
            newConfigs[index] = newConfigs[nextIndex];
            newConfigs[nextIndex] = temp;
            return newConfigs;
        });
    }, []);

    const handleExport = async () => {
        setIsPlaying(false);
        setIsRendering(true);
        setRenderProgress(0);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const result = await renderVideoMobile(
                bgMedia,
                textConfigs,
                (p) => setRenderProgress(p),
                {
                    aspectRatio: exportAspectRatio,
                    quality: exportQuality,
                    fps: exportFps,
                    bgType,
                    bgColor1,
                    bgColor2,
                    bgGradientAngle
                },
                controller.signal,
                duration
            );

            if (prevExportUrl.current) URL.revokeObjectURL(prevExportUrl.current);
            prevExportUrl.current = result.dataUrl;
            setExportedMedia({ dataUrl: result.dataUrl, mimeType: result.mimeType, fileName: result.fileName });
        } catch (err: any) {
            if (err?.message !== "Render cancelled") {
                console.error('Render xatosi', err);
            }
        } finally {
            setIsRendering(false);
            abortControllerRef.current = null;
        }
    };

    const updateTextConfig = useCallback((updates: Partial<TextConfig>, id?: string) => {
        const targetId = id || selectedTextId;
        setTextConfigs(prev => prev.map(c => c.id === targetId ? { ...c, ...updates } : c));
    }, [selectedTextId]);

    const batchUpdateTextConfigs = useCallback((updates: Array<{ id: string; changes: Partial<TextConfig> }>) => {
        setTextConfigs(prev => prev.map(c => {
            const update = updates.find(u => u.id === c.id);
            return update ? { ...c, ...update.changes } : c;
        }));
    }, []);

    const selectedConfig = textConfigs.find(c => c.id === selectedTextId) || textConfigs[0] || null;

    return (
        <div className="fixed inset-0 w-screen h-[100dvh] bg-[#0a0a0a] text-white flex flex-col overflow-hidden select-none">
            {/* Top Navigation Bar */}
            <div className="h-12 w-full bg-[#121212] border-b border-white/10 px-3 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-1.5">
                    <span className="text-base">🎬</span>
                    <span className="text-[13px] font-bold tracking-tight text-white">Text Animator</span>
                    <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-1">PRO</span>
                </div>

                {/* Aspect Ratio Switcher */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                    <button
                        onClick={() => setExportAspectRatio('9:16')}
                        type="button"
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                            exportAspectRatio === '9:16' ? 'bg-white text-black shadow' : 'text-white/60'
                        }`}
                        title="Vertikal (Shorts / Reels)"
                    >
                        9:16
                    </button>
                    <button
                        onClick={() => setExportAspectRatio('16:9')}
                        type="button"
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                            exportAspectRatio === '16:9' ? 'bg-white text-black shadow' : 'text-white/60'
                        }`}
                        title="Gorizontal (YouTube)"
                    >
                        16:9
                    </button>
                    <button
                        onClick={() => setExportAspectRatio('1:1')}
                        type="button"
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                            exportAspectRatio === '1:1' ? 'bg-white text-black shadow' : 'text-white/60'
                        }`}
                        title="Kvadrat (Post)"
                    >
                        1:1
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleAddLayer}
                        type="button"
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
                        title="Qatlam qo'shish"
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        onClick={() => setShowExportSettings(true)}
                        type="button"
                        className="h-7 px-2.5 rounded-lg bg-white text-black text-[11px] font-bold flex items-center gap-1 active:scale-95 shadow transition-all"
                    >
                        <Download size={13} />
                        <span>Eksport</span>
                    </button>
                </div>
            </div>

            {/* Central Stage Canvas */}
            <div className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 overflow-hidden bg-[#070707]">
                <Stage
                    media={bgMedia}
                    configs={textConfigs}
                    selectedId={isRendering ? null : selectedTextId}
                    isPlaying={isPlaying}
                    animationKey={key}
                    onUpdatePosition={(pos) => updateTextConfig({ position: pos })}
                    onMetadataLoaded={(d) => setDuration(d)}
                    onSelectLayer={setSelectedTextId}
                    bgType={bgType}
                    bgColor1={bgColor1}
                    bgColor2={bgColor2}
                    bgGradientAngle={bgGradientAngle}
                    aspectRatio={exportAspectRatio}
                />
            </div>

            {/* Mobile Touch Timeline */}
            <div className="w-full shrink-0 bg-[#0e0e0e] py-1 border-t border-white/5">
                <Timeline
                    duration={duration}
                    configs={textConfigs}
                    selectedId={selectedTextId}
                    isPlaying={isPlaying}
                    onPlayPause={() => setIsPlaying(!isPlaying)}
                    onRestart={() => timeController.setTime(0)}
                    onSeek={(t) => timeController.setTime(t)}
                    onUpdateConfig={updateTextConfig}
                    onBatchUpdate={batchUpdateTextConfigs}
                    onSelectLayer={setSelectedTextId}
                />
            </div>

            {/* Mobile Bottom Control Panel (Tabs & Settings) */}
            <MobileBottomPanel
                config={selectedConfig}
                allConfigs={textConfigs}
                onUpdate={updateTextConfig}
                onSelectMedia={handleSelectMedia}
                onDeleteLayer={handleDeleteLayer}
                onSelectLayer={setSelectedTextId}
                onAddLayer={handleAddLayer}
                onExport={handleExport}
                onCancelExport={() => abortControllerRef.current?.abort()}
                isRendering={isRendering}
                renderProgress={renderProgress}
                hasMedia={!!bgMedia}
                aspectRatio={exportAspectRatio}
                quality={exportQuality}
                fps={exportFps}
                onAspectRatioChange={setExportAspectRatio}
                onQualityChange={setExportQuality}
                onFpsChange={setExportFps}
                bgType={bgType}
                onBgTypeChange={setBgType}
                bgColor1={bgColor1}
                onBgColor1Change={setBgColor1}
                bgColor2={bgColor2}
                onBgColor2Change={setBgColor2}
                bgGradientAngle={bgGradientAngle}
                onBgGradientAngleChange={setBgGradientAngle}
                onMoveLayer={handleMoveLayer}
                duration={duration}
                onDurationChange={setDuration}
            />

            {/* Render Progress Modal */}
            {isRendering && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
                    <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-xs w-full flex flex-col items-center gap-4 text-center">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            <Loader2 className="w-14 h-14 text-white animate-spin opacity-80" />
                            <span className="absolute text-[12px] font-bold font-mono">
                                {Math.round(renderProgress * 100)}%
                            </span>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[14px] font-bold text-white">Video Render Qilinmoqda</h4>
                            <p className="text-[11px] text-white/50">Har bir kadr yuqori sifatda tayyorlanmoqda, iltimos kuting...</p>
                        </div>
                        <button
                            onClick={() => abortControllerRef.current?.abort()}
                            type="button"
                            className="mt-2 text-[11px] text-red-400 hover:text-red-300 font-medium py-1 px-4 rounded-lg bg-red-500/10 border border-red-500/20 active:scale-95"
                        >
                            Bekor qilish
                        </button>
                    </div>
                </div>
            )}

            {/* Export Settings Dialog */}
            {showExportSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowExportSettings(false)}>
                    <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <Film size={18} className="text-white" />
                                <span className="text-[13px] font-bold text-white">Eksport Sozlamalari</span>
                            </div>
                            <button onClick={() => setShowExportSettings(false)} className="text-white/40 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-white/60">Ekran Nisbati (Aspect Ratio)</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(['9:16', '16:9', '1:1'] as const).map(ratio => (
                                        <button
                                            key={ratio}
                                            onClick={() => setExportAspectRatio(ratio)}
                                            type="button"
                                            className={`h-9 rounded-xl text-[11px] font-semibold border transition-all ${
                                                exportAspectRatio === ratio ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70'
                                            }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-white/60">Sifat (Quality)</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(['HD', 'FullHD', 'UHD'] as const).map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setExportQuality(q)}
                                            type="button"
                                            className={`h-9 rounded-xl text-[11px] font-semibold border transition-all ${
                                                exportQuality === q ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70'
                                            }`}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-white/60">Kadrlar Tezligi (FPS)</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {([24, 25, 30, 60] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setExportFps(f)}
                                            type="button"
                                            className={`h-9 rounded-xl text-[11px] font-semibold border transition-all ${
                                                exportFps === f ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70'
                                            }`}
                                        >
                                            {f} FPS
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setShowExportSettings(false);
                                    handleExport();
                                }}
                                type="button"
                                className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 text-black text-[13px] font-bold shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
                            >
                                <Download size={16} />
                                <span>Videoni Saqlash</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Complete Preview Modal */}
            {exportedMedia && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setExportedMedia(null)}>
                    <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 shadow-2xl max-w-sm w-full flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <Check size={16} />
                                <span className="text-[12px] font-bold text-white">Video Tayyor!</span>
                            </div>
                            <button onClick={() => setExportedMedia(null)} className="text-white/40 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center max-h-[50vh]">
                            <video src={exportedMedia.dataUrl} controls autoPlay loop className="max-h-[50vh] w-full" />
                        </div>

                        <button
                            onClick={() => setExportedMedia(null)}
                            type="button"
                            className="w-full h-9 rounded-xl bg-white text-black text-[12px] font-bold active:scale-98 transition-all"
                        >
                            Yopish
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}