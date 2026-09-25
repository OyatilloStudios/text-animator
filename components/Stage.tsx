import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MediaAsset, TextConfig } from '../types';
import { AnimatedText } from './AnimatedText';
import { timeController } from '../services/TimeController';

interface StageProps {
    media: MediaAsset | null;
    configs: TextConfig[];
    selectedId: string | null;
    isPlaying: boolean;
    animationKey: number;
    onUpdatePosition: (pos: { x: number; y: number }) => void;
    onMetadataLoaded: (duration: number) => void;
    onSelectLayer: (id: string) => void;
    placeholderDuration?: number;
    bgType: 'transparent' | 'solid' | 'gradient' | 'media';
    bgColor1: string;
    bgColor2: string;
    bgGradientAngle: number;
    aspectRatio: '16:9' | '9:16' | '1:1';
}

export const Stage: React.FC<StageProps> = ({
    media,
    configs,
    selectedId,
    isPlaying,
    animationKey,
    onUpdatePosition,
    onMetadataLoaded,
    onSelectLayer,
    placeholderDuration = 8,
    bgType,
    bgColor1,
    bgColor2,
    bgGradientAngle,
    aspectRatio
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [mediaAspectRatio, setMediaAspectRatio] = useState(1920 / 1080);
    const rafId = useRef<number>();
    const lastTime = useRef<number>(performance.now());

    const ratioValue = aspectRatio === '9:16' ? 9 / 16 : aspectRatio === '1:1' ? 1 / 1 : 16 / 9;

    const updateLoop = useCallback(() => {
        if (isPlaying) {
            const now = performance.now();
            const delta = (now - lastTime.current) / 1000;
            lastTime.current = now;

            if (videoRef.current) {
                timeController.setTime(videoRef.current.currentTime);
            } else {
                const nextTime = (timeController.getTime() + delta) % placeholderDuration;
                timeController.setTime(nextTime);
            }
            rafId.current = requestAnimationFrame(updateLoop);
        }
    }, [isPlaying, placeholderDuration]);

    useEffect(() => {
        lastTime.current = performance.now();
        if (isPlaying) {
            rafId.current = requestAnimationFrame(updateLoop);
        } else {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        }
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [isPlaying, updateLoop]);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isPlaying && bgType === 'media') {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
        }
    }, [isPlaying, bgType]);

    // High-performance scrubbing synchronization
    useEffect(() => {
        const unsubscribe = timeController.subscribe((time) => {
            if (!videoRef.current || isPlaying || bgType !== 'media') return;
            videoRef.current.currentTime = time;
        });

        return unsubscribe;
    }, [isPlaying, bgType]);

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onSelectLayer(id);
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            onUpdatePosition({
                x: Math.max(0, Math.min(100, x)),
                y: Math.max(0, Math.min(100, y))
            });
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onUpdatePosition]);

    const handleMediaLoad = (e: React.SyntheticEvent<HTMLVideoElement | HTMLImageElement>) => {
        const target = e.currentTarget;
        let w = 0, h = 0;
        if (target instanceof HTMLVideoElement) {
            w = target.videoWidth;
            h = target.videoHeight;
            onMetadataLoaded(target.duration);
        } else if (target instanceof HTMLImageElement) {
            w = target.naturalWidth;
            h = target.naturalHeight;
        }
        if (w && h) setMediaAspectRatio(w / h);
    };

    const bgOpacity = configs.reduce((max, c) => Math.max(max, c.bgOpacity || 0), 0);

    return (
        <div
            ref={containerRef}
            className="relative shadow-2xl bg-black group overflow-hidden select-none border border-white/5 transition-all duration-500 ease-in-out rounded-xl"
            style={{
                aspectRatio: `${ratioValue}`,
                ...(ratioValue > 1
                    ? { width: '100%', height: 'auto', maxWidth: '100%', maxHeight: '100%' }
                    : { height: '100%', width: 'auto', maxWidth: '100%', maxHeight: '100%' }),
                flexShrink: 1,
                minWidth: 0,
                minHeight: 0
            }}
        >
            {/* Background Layer */}
            {bgType === 'transparent' ? (
                <div className="w-full h-full bg-[#151515]" style={{
                    backgroundImage: 'linear-gradient(45deg, #0e0e0e 25%, transparent 25%), linear-gradient(-45deg, #0e0e0e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0e0e0e 75%), linear-gradient(-45deg, transparent 75%, #0e0e0e 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }} />
            ) : bgType === 'solid' ? (
                <div className="w-full h-full transition-colors duration-300" style={{ backgroundColor: bgColor1 }} />
            ) : bgType === 'gradient' ? (
                <div className="w-full h-full transition-all duration-300" style={{
                    background: `linear-gradient(${bgGradientAngle}deg, ${bgColor1}, ${bgColor2})`
                }} />
            ) : (
                !media ? (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                ) : media.type === 'video' ? (
                    <video
                        ref={videoRef}
                        src={media.dataUrl}
                        className="w-full h-full object-cover pointer-events-none opacity-80"
                        muted loop playsInline
                        onLoadedMetadata={handleMediaLoad}
                    />
                ) : (
                    <img
                        src={media.dataUrl}
                        className="w-full h-full object-cover pointer-events-none opacity-80"
                        onLoad={handleMediaLoad}
                    />
                )
            )}

            {/* Overlays for DOM Capture */}
            <div id="stage-overlays" className="absolute inset-0 z-10 pointer-events-none">
                {/* Dim Overlay */}
                <div
                    className="absolute inset-0 bg-black pointer-events-none"
                    style={{ opacity: bgOpacity / 100 }}
                />

                {/* Text Layers rendered in direct array stacking order */}
                {configs.map((config, index) => {
                    const zIndex = (configs.length - index) + (selectedId === config.id ? 100 : 0);
                    return (
                        <AnimatedText
                            key={config.id}
                            config={config}
                            isPlaying={isPlaying}
                            animationKey={animationKey}
                            selectedId={selectedId}
                            onSelectLayer={handleMouseDown}
                            zIndex={zIndex}
                        />
                    );
                })}
            </div>
        </div>
    );
};