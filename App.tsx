import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Flow } from 'flow-sdk';
import { Icon } from './components/Icon';
import { Sidebar } from './components/Sidebar';
import { Stage } from './components/Stage';
import { Timeline } from './components/Timeline';
import { TextConfig, MediaAsset, GOOGLE_FONTS_URL } from './types';
import { renderVideo, renderVideoPython } from './services/renderer';
import { timeController } from './services/TimeController';

const MemoizedSidebar = memo(Sidebar);

const INJECTED_STYLE_ID = 'typeoverlays-global-styles';
const INJECTED_FONT_ID = 'typeoverlays-material-symbols';
const INJECTED_BODY_FONT_ID = 'typeoverlays-google-sans';

function useGlobalStyles() {
    useEffect(() => {
        const id = 'flow-design-system-css';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = `
                input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; cursor: pointer; padding: 8px 0; }
                input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 3px; background: #595959; border-radius: 9999px; }
                input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: white; box-shadow: 0px 1px 3px rgba(0,0,0,0.5); margin-top: -5.5px; cursor: grab; }
                input[type=range]::-webkit-slider-thumb:active { cursor: grabbing; }
                .dark-scrollbar { scrollbar-width: thin; scrollbar-color: #595959 transparent; }
                .dark-scrollbar::-webkit-scrollbar { width: 6px; }
                .dark-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .dark-scrollbar::-webkit-scrollbar-thumb { background: #595959; border-radius: 9999px; }
                @keyframes dropdown-enter { from { opacity: 0; transform: scale(0.95) translateY(-5px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-dropdown { animation: dropdown-enter 0.15s ease-out forwards; }
                html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; background: #0e0e0e; font-family: 'Google Sans Text', 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif; letter-spacing: 0.1px; -webkit-font-smoothing: antialiased; }

                /* CapCut-style Effect Hover Previews */
                @keyframes preview-blur-in { 0% { filter: blur(3px); opacity: 0; } 100% { filter: blur(0); opacity: 1; } }
                @keyframes preview-scale-in { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes preview-slide-up { 0% { transform: translateY(6px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                @keyframes preview-slide-down { 0% { transform: translateY(-6px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                @keyframes preview-slide-left { 0% { transform: translateX(6px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
                @keyframes preview-slide-right { 0% { transform: translateX(-6px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
                @keyframes preview-rotate-in { 0% { transform: rotate(-180deg) scale(0.3); opacity: 0; } 100% { transform: rotate(0) scale(1); opacity: 1; } }
                @keyframes preview-wave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
                @keyframes preview-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
                @keyframes preview-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                @keyframes preview-wiggle { 0%, 100% { transform: translate(0,0) rotate(0); } 25% { transform: translate(-1px,1px) rotate(-3deg); } 75% { transform: translate(1px,-1px) rotate(3deg); } }
                
                .effect-card:hover .preview-blur-in { animation: preview-blur-in 0.8s ease-out infinite; }
                .effect-card:hover .preview-scale-in { animation: preview-scale-in 0.8s ease-out infinite; }
                .effect-card:hover .preview-slide-up { animation: preview-slide-up 0.8s ease-out infinite; }
                .effect-card:hover .preview-slide-down { animation: preview-slide-down 0.8s ease-out infinite; }
                .effect-card:hover .preview-slide-left { animation: preview-slide-left 0.8s ease-out infinite; }
                .effect-card:hover .preview-slide-right { animation: preview-slide-right 0.8s ease-out infinite; }
                .effect-card:hover .preview-rotate-in { animation: preview-rotate-in 0.8s ease-out infinite; }
                .effect-card:hover .preview-wave { animation: preview-wave 0.8s ease-in-out infinite; }
                .effect-card:hover .preview-pulse { animation: preview-pulse 0.8s ease-in-out infinite; }
                .effect-card:hover .preview-float { animation: preview-float 1.2s ease-in-out infinite; }
                .effect-card:hover .preview-wiggle { animation: preview-wiggle 0.5s ease-in-out infinite; }
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
    const [bgColor1, setBgColor1] = useState<string>('#27272a');
    const [bgColor2, setBgColor2] = useState<string>('#09090b');
    const [bgGradientAngle, setBgGradientAngle] = useState<number>(135);
    const [textConfigs, setTextConfigs] = useState<TextConfig[]>([
        {
            id: '1',
            content: 'Type\nOverlays',
            fontFamily: "'Instrument Sans', sans-serif",
            fontSize: 84,
            fontWeight: 500,
            letterSpacing: 0,
            lineHeight: 1,
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
            duration: 2200,
            delay: 140,
            inDuration: 800,
            outDuration: 0,
            intensity: 50,
            inDirection: 'first',
            outDirection: 'first',
            shadowColor: '#000000',
            shadowBlur: 0,
            shadowAngle: 45,
            shadowDistance: 0,
            innerShadowColor: '#000000',
            innerShadowBlur: 0,
            innerShadowAngle: 45,
            innerShadowDistance: 0,
            strokeColor: '#000050',
            strokeWidth: 0,
        }
    ]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>('1');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [renderProgress, setRenderProgress] = useState(0);
    const [exportAspectRatio, setExportAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
    const [exportQuality, setExportQuality] = useState<'HD' | 'FullHD' | 'UHD'>('FullHD');
    const [exportFps, setExportFps] = useState<24 | 25 | 30 | 60>(30);
    const [exportedMedia, setExportedMedia] = useState<{ dataUrl: string, mimeType: string } | null>(null);
    const prevExportUrl = useRef<string | null>(null);
    const prevMediaUrl = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [key, setKey] = useState(0);

    const [isPythonConnected, setIsPythonConnected] = useState(false);
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Auto-reconnecting WebSocket listener for Python rendering server
    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout>;

        const connectWS = () => {
            ws = new WebSocket('ws://localhost:8081');
            ws.onopen = () => {
                setIsPythonConnected(true);
                wsRef.current = ws;
            };
            ws.onclose = () => {
                setIsPythonConnected(false);
                wsRef.current = null;
                reconnectTimeout = setTimeout(connectWS, 2000); // Retry every 2 seconds
            };
            ws.onerror = () => {
                if (ws) ws.close();
            };
        };

        connectWS();

        return () => {
            if (ws) {
                ws.onclose = null;
                ws.close();
            }
            clearTimeout(reconnectTimeout);
        };
    }, []);

    const handleDeleteLayer = useCallback((id: string) => {
        if (textConfigs.length <= 1) return;
        if (selectedTextId === id) {
            const idx = textConfigs.findIndex(c => c.id === id);
            const next = textConfigs[idx + 1] ?? textConfigs[idx - 1];
            setSelectedTextId(next.id);
        }
        setTextConfigs(prev => prev.filter(c => c.id !== id));
    }, [textConfigs, selectedTextId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
            if (isInput) return;
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
                setIsPlaying(true);
                timeController.setTime(0);
            }
        } catch (err) {
            console.error('Failed to select media', err);
        }
    };

    const handleAddLayer = useCallback(() => {
        const newId = Math.random().toString(36).substr(2, 9);
        const lastLayer = textConfigs[textConfigs.length - 1];
        const newLayer: TextConfig = {
            ...(lastLayer || {
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: 84,
                fontWeight: 500,
                letterSpacing: 0,
                lineHeight: 1,
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
                shadowBlur: 0,
                shadowAngle: 45,
                shadowDistance: 0,
                innerShadowColor: '#000000',
                innerShadowBlur: 0,
                innerShadowAngle: 45,
                innerShadowDistance: 0,
                strokeColor: '#000050',
                strokeWidth: 0,
            }),
            id: newId,
            content: 'New Layer',
            position: { x: 50, y: 50 },
            delay: lastLayer ? lastLayer.delay + 500 : 0,
            duration: 2200,
            inDuration: 800,
            outDuration: 0,
            intensity: 50,
        };
        setTextConfigs(prev => [...prev, newLayer]);
        setSelectedTextId(newId);
    }, [textConfigs]);

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
        if (isPythonConnected && wsRef.current) {
            setIsRendering(true);
            setRenderProgress(0);
            const controller = new AbortController();
            abortControllerRef.current = controller;
            try {
                const result = await renderVideoPython(
                    wsRef.current,
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
                setExportedMedia({ dataUrl: result.dataUrl, mimeType: result.mimeType });
            } catch (err) {
                console.error('Python render failed', err);
            } finally {
                setIsRendering(false);
                abortControllerRef.current = null;
            }
        } else {
            setShowOfflineModal(true);
        }
    };

    const triggerBrowserFallbackExport = async () => {
        setShowOfflineModal(false);
        setIsRendering(true);
        setRenderProgress(0);
        const controller = new AbortController();
        abortControllerRef.current = controller;
        try {
            const result = await renderVideo(
                bgMedia, 
                textConfigs, 
                (p) => setRenderProgress(p), 
                { 
                    resolution: exportQuality === 'UHD' ? '4K' : exportQuality === 'HD' ? '720p' : '1080p', 
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
            setExportedMedia({ dataUrl: result.dataUrl, mimeType: result.mimeType });
        } catch (err) {
            console.error('Render failed', err);
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

    const selectedConfig = textConfigs.find(c => c.id === selectedTextId) || null;

    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#0e0e0e] text-white flex overflow-hidden">
            <div className="flex-1 flex flex-col p-8 lg:p-12 overflow-hidden">
                <div className="flex-1 flex items-center justify-center relative mb-8 overflow-hidden">
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
                <div className="shrink-0 w-full max-w-5xl mx-auto px-6">
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
            </div>

            <Sidebar
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
                isPythonConnected={isPythonConnected}
            />

            {exportedMedia && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8" onClick={() => setExportedMedia(null)}>
                    <div className="bg-[#1a1a1a] border border-[#595959] rounded-2xl p-5 shadow-2xl max-w-2xl w-full flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-white/40 uppercase tracking-widest">Render Complete</span>
                            <button onClick={() => setExportedMedia(null)} className="text-white/40 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div 
                            className="rounded-xl overflow-hidden border border-[#595959] relative flex items-center justify-center min-h-[300px]"
                            style={bgType === 'transparent' ? {
                                backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
                                backgroundSize: '16px 16px',
                                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                                backgroundColor: '#111'
                            } : { backgroundColor: '#000' }}
                        >
                            <video src={exportedMedia.dataUrl} controls autoPlay loop className="max-h-[60vh] w-full z-10" />
                        </div>
                        <button onClick={() => setExportedMedia(null)} className="h-[34px] rounded-xl border border-[#595959] hover:bg-white/5 text-[12px] font-medium text-white transition-all">Close</button>
                    </div>
                </div>
            )}

            {showOfflineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-8" onClick={() => setShowOfflineModal(false)}>
                    <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 animate-pulse">
                                <span className="material-symbols-outlined text-2xl">warning</span>
                            </div>
                            <h3 style={{ fontFamily: 'Google Sans Flex' }} className="text-[15px] font-bold text-white tracking-wide">Python Render Server Oflayn</h3>
                            <p className="text-[11px] text-white/50 leading-relaxed max-w-sm">
                                Yuqori sifatli, silliq 60fps va shaffof (transparent) video render qilish uchun local kompyuteringizda Python serverini ishga tushiring:
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[9px] text-white/30 font-semibold uppercase tracking-widest text-left">Konsolda ishga tushirish buyrug'i:</span>
                            <div className="bg-black/50 border border-white/5 rounded-xl p-3 font-mono text-[10px] text-emerald-400 select-all cursor-pointer break-all flex items-center justify-center gap-2 hover:bg-black/60 transition-colors" title="Nusxa olish uchun bosing">
                                <span>pip install websockets && python hd_renderer.py</span>
                            </div>
                            <span className="text-[8px] text-white/25 italic">Nusxa olib, loyiha papkasida ishga tushiring. Tizimda FFmpeg o'rnatilgan bo'lishi kerak.</span>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                            <button onClick={triggerBrowserFallbackExport} className="h-[34px] w-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[11px] font-semibold text-white transition-all">
                                Brauzer orqali render (Sifatsiz)
                            </button>
                            <button onClick={() => setShowOfflineModal(false)} className="h-[34px] w-full rounded-xl bg-white hover:bg-zinc-200 text-black text-[11px] font-bold transition-all">
                                Tushunarli (Yopish)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}