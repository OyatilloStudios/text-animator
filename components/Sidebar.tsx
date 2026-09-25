import React, { useState, useEffect, useMemo } from 'react';
import { TextConfig, FONTS, POSITION_PRESETS, KINETIC_EFFECTS, DONATION_URL } from '../types';
import { Icon } from './Icon';
import { Plus, Download, ImagePlus, ArrowUp, ArrowDown } from 'lucide-react';
import {
    SectionLabel, PillButton, FieldDropdown,
    RangeSlider, SegmentedToggle, IconToggleBar, TextInput,
    AngleSlider
} from './Primitives';

interface SidebarProps {
    config: TextConfig | null;
    allConfigs: TextConfig[];
    onUpdate: (updates: Partial<TextConfig>, id?: string) => void;
    onSelectMedia: () => void;
    onDeleteLayer: (id: string) => void;
    onSelectLayer: (id: string) => void;
    onAddLayer: () => void;
    onExport: () => void;
    onCancelExport?: () => void;
    isRendering: boolean;
    renderProgress: number;
    hasMedia: boolean;
    aspectRatio: '16:9' | '9:16' | '1:1';
    quality: 'HD' | 'FullHD' | 'UHD';
    fps: 24 | 25 | 30 | 60;
    onAspectRatioChange: (a: '16:9' | '9:16' | '1:1') => void;
    onQualityChange: (q: 'HD' | 'FullHD' | 'UHD') => void;
    onFpsChange: (f: 24 | 25 | 30 | 60) => void;
    bgType: 'transparent' | 'solid' | 'gradient' | 'media';
    onBgTypeChange: (t: 'transparent' | 'solid' | 'gradient' | 'media') => void;
    bgColor1: string;
    onBgColor1Change: (c: string) => void;
    bgColor2: string;
    onBgColor2Change: (c: string) => void;
    bgGradientAngle: number;
    onBgGradientAngleChange: (a: number) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
    duration: number;
    onDurationChange: (d: number) => void;
    isPythonConnected: boolean;
}

const ENTRANCE_EFFECTS = [
    { value: 'none', label: 'Instant', preview: 'preview-none' },
    { value: 'blur-in', label: 'Blur In', preview: 'preview-blur-in' },
    { value: 'typewriter', label: 'Typewriter', preview: 'preview-wiggle' },
    { value: 'scale-in', label: 'Scale In', preview: 'preview-scale-in' },
    { value: 'slide-up', label: 'Slide Up', preview: 'preview-slide-up' },
    { value: 'slide-down', label: 'Slide Down', preview: 'preview-slide-down' },
    { value: 'slide-left', label: 'Slide Left', preview: 'preview-slide-left' },
    { value: 'slide-right', label: 'Slide Right', preview: 'preview-slide-right' },
    { value: 'rotate-in', label: 'Rotate In', preview: 'preview-rotate-in' },
    { value: 'elastic-in', label: 'Elastic', preview: 'preview-scale-in' },
    { value: 'glitch-in', label: 'Glitch In', preview: 'preview-wiggle' },
    { value: 'fly-in', label: 'Fly In', preview: 'preview-slide-down' },
    { value: 'vortex-in', label: 'Vortex', preview: 'preview-rotate-in' },
    { value: 'sequential-stack', label: 'Seq Stack', preview: 'preview-scale-in' }
];

const EXIT_EFFECTS = [
    { value: 'none', label: 'Instant', preview: 'preview-none' },
    { value: 'blur-out', label: 'Blur Out', preview: 'preview-blur-in' },
    { value: 'scale-out', label: 'Scale Out', preview: 'preview-scale-in' },
    { value: 'slide-up', label: 'Slide Up', preview: 'preview-slide-up' },
    { value: 'slide-down', label: 'Slide Down', preview: 'preview-slide-down' },
    { value: 'slide-left', label: 'Slide Left', preview: 'preview-slide-left' },
    { value: 'slide-right', label: 'Slide Right', preview: 'preview-slide-right' },
    { value: 'rotate-out', label: 'Rotate Out', preview: 'preview-rotate-in' },
    { value: 'glitch-out', label: 'Glitch Out', preview: 'preview-wiggle' },
    { value: 'fly-out', label: 'Fly Out', preview: 'preview-slide-down' },
    { value: 'vortex-out', label: 'Vortex', preview: 'preview-rotate-in' }
];

const LOOP_EFFECTS = [
    { value: 'none', label: 'Still', preview: 'preview-none' },
    { value: 'wave', label: 'Wave', preview: 'preview-wave' },
    { value: 'wiggle', label: 'Wiggle', preview: 'preview-wiggle' },
    { value: 'float', label: 'Float', preview: 'preview-float' },
    { value: 'pulse', label: 'Pulse', preview: 'preview-pulse' },
    { value: 'font-shuffle', label: 'Font Mix', preview: 'preview-wiggle' },
    { value: 'glow-flicker', label: 'Flicker', preview: 'preview-pulse' },
    { value: 'pendulum', label: 'Pendulum', preview: 'preview-wiggle' },
    { value: 'blink', label: 'Blink', preview: 'preview-none animate-pulse' },
    { value: 'skew-wave', label: 'Skew', preview: 'preview-wiggle' },
    { value: 'spin-loop', label: 'Spin', preview: 'preview-rotate-in' }
];

const WEIGHT_LABELS: Record<number, string> = {
    100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular',
    500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
};

const POSITION_ICONS: Record<string, string> = {
    ArrowUpLeft: 'north_west', ArrowUp: 'north', ArrowUpRight: 'north_east',
    ArrowLeft: 'west', Crosshair: 'center_focus_strong', ArrowRight: 'east',
    ArrowDownLeft: 'south_west', ArrowDown: 'south', ArrowDownRight: 'south_east',
};

export const Sidebar: React.FC<SidebarProps> = ({
    config, allConfigs, onUpdate, onSelectMedia,
    onDeleteLayer, onSelectLayer, onAddLayer, onExport, onCancelExport,
    isRendering, renderProgress, hasMedia,
    aspectRatio, quality, fps, onAspectRatioChange, onQualityChange, onFpsChange,
    bgType, onBgTypeChange, bgColor1, onBgColor1Change,
    bgColor2, onBgColor2Change, bgGradientAngle, onBgGradientAngleChange,
    onMoveLayer, duration, onDurationChange, isPythonConnected
}) => {
    const [activeTab, setActiveTab] = useState<'design' | 'animate'>('design');
    const [localFonts, setLocalFonts] = useState<Array<{ name: string; family: string }>>([]);

    useEffect(() => {
        async function loadLocalFonts() {
            try {
                if ('queryLocalFonts' in navigator) {
                    const fonts = await (navigator as any).queryLocalFonts();
                    const uniqueFonts = new Map<string, string>();
                    for (const f of fonts) {
                        if (f.family && !uniqueFonts.has(f.family)) {
                            uniqueFonts.set(f.family, f.family);
                        }
                    }
                    const list = Array.from(uniqueFonts.keys()).map(family => ({
                        name: family,
                        family: `"${family}"`
                     })).sort((a, b) => a.name.localeCompare(b.name));
                     setLocalFonts(list);
                }
            } catch (err) {
                console.warn("Local fonts query failed", err);
            }
        }
        loadLocalFonts();
    }, []);

    const combinedFontOptions = useMemo(() => {
        if (!config) return [];

        // Compute style values based on current config for the styled preview
        const shadowAngleRad = ((config.shadowAngle || 0) * Math.PI) / 180;
        const shadowX = Math.cos(shadowAngleRad) * (config.shadowDistance || 0);
        const shadowY = Math.sin(shadowAngleRad) * (config.shadowDistance || 0);
        const dropShadowCSS = config.shadowColor ? `${shadowX}px ${shadowY}px ${config.shadowBlur || 0}px ${config.shadowColor}` : '';

        const innerAngleRad = ((config.innerShadowAngle || 0) * Math.PI) / 180;
        const innerX = Math.cos(innerAngleRad) * (config.innerShadowDistance || 0);
        const innerY = Math.sin(innerAngleRad) * (config.innerShadowDistance || 0);
        const innerShadowCSS = config.innerShadowColor 
            ? `-${innerX}px -${innerY}px ${config.innerShadowBlur || 0}px ${config.innerShadowColor}, ${innerX}px ${innerY}px 0.5px rgba(255,255,255,0.15)` 
            : '';

        const textShadow = [dropShadowCSS, innerShadowCSS].filter(Boolean).join(', ') || undefined;
        const textStroke = config.strokeWidth && config.strokeColor 
            ? `${config.strokeWidth}px ${config.strokeColor}` 
            : undefined;

        const basePreviewStyle: React.CSSProperties = {
            color: config.color || '#ffffff',
            textShadow,
            WebkitTextStroke: textStroke,
            fontSize: '12px',
            fontWeight: config.fontWeight || 500,
            letterSpacing: '0px',
            lineHeight: 1.1,
            whiteSpace: 'nowrap'
        };

        const stdOpts = FONTS.map(f => ({
            value: f.family,
            label: f.name,
            style: { fontFamily: f.family },
            previewText: 'Lorem Ipsum',
            previewStyle: { ...basePreviewStyle, fontFamily: f.family }
        }));
        const locOpts = localFonts.map(f => ({
            value: f.family,
            label: f.name,
            style: { fontFamily: f.family },
            previewText: 'Lorem Ipsum',
            previewStyle: { ...basePreviewStyle, fontFamily: f.family }
        }));
        return [...stdOpts, ...locOpts];
    }, [localFonts, config]);

    if (!config) return null;

    const selectedFont = FONTS.find(f => f.family === config.fontFamily);
    const availableWeights = selectedFont?.weights || [400];

    return (
        <div className="relative border border-[rgba(218,220,224,0.15)] flex flex-col items-start justify-between overflow-clip px-[10px] py-[12px] w-[300px] h-full min-h-0 bg-[#0e0e0e] z-10 shrink-0">
            {/* Content Sidebar with scrolling */}
            <div className="flex-1 flex flex-col gap-[24px] items-start w-full overflow-y-auto overflow-x-hidden dark-scrollbar pb-[180px] pr-1">
                
                {/* Project Settings */}
                <div className="flex flex-col gap-2 items-start w-full border-b border-[#333]/50 pb-4 shrink-0">
                    <SectionLabel>Loyiha Sozlamalari (Project Settings)</SectionLabel>
                    <div className="flex flex-col gap-3 w-full px-1">
                        <FieldDropdown
                            label="Ekran Nisbati (Aspect Ratio)"
                            value={aspectRatio}
                            options={[
                                { value: '16:9', label: '📺 Gorizontal (16:9)' },
                                { value: '9:16', label: '📱 Vertikal (9:16) Reels' },
                                { value: '1:1', label: '🔲 Kvadrat (1:1) Instagram' }
                            ]}
                            onChange={(v) => onAspectRatioChange(v as any)}
                            className="w-full"
                        />
                        <RangeSlider
                            label="Video Davomiyligi (Soniya)"
                            value={duration}
                            min={1}
                            max={300}
                            step={1}
                            formatValue={v => `${Math.round(v)}s`}
                            onChange={onDurationChange}
                        />
                    </div>
                </div>

                {/* Layers Section */}
                <div className="flex flex-col gap-2 items-start w-full">
                    <SectionLabel>Text Layers</SectionLabel>
                    <div className="flex flex-col gap-1 w-full">
                        {allConfigs.map((c, i) => {
                            const isSelected = config.id === c.id;
                            return (
                                <div key={c.id} className={`flex gap-1.5 w-full items-center p-1 rounded-xl transition-all border ${isSelected ? 'border-white/10 bg-white/5' : 'border-transparent'}`}>
                                    <div className="flex-1 min-w-0" onClick={() => onSelectLayer(c.id)}>
                                        <TextInput
                                            value={c.content}
                                            autoResize
                                            placeholder={`Layer ${i + 1}`}
                                            onFocus={() => onSelectLayer(c.id)}
                                            onChange={val => onUpdate({ content: val }, c.id)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5 select-none shrink-0">
                                        <button disabled={i === allConfigs.length - 1} onClick={() => onMoveLayer(c.id, 'up')}
                                            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors p-0.5 flex items-center justify-center" title="Bring Forward">
                                            <Icon name="keyboard_arrow_up" size={14} />
                                        </button>
                                        <button disabled={i === 0} onClick={() => onMoveLayer(c.id, 'down')}
                                            className="text-white/40 hover:text-white disabled:opacity-20 transition-colors p-0.5 flex items-center justify-center" title="Send Backward">
                                            <Icon name="keyboard_arrow_down" size={14} />
                                        </button>
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${allConfigs.length > 1 ? 'w-7 opacity-100' : 'w-0 opacity-0'}`}>
                                        <button onClick={() => onDeleteLayer(c.id)} className="text-[rgba(218,220,224,0.35)] hover:text-red-450 transition-colors p-[5px] flex items-center justify-center">
                                            <Icon name="delete" size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="pt-1">
                            <PillButton variant="outline" onClick={onAddLayer} icon={<Plus size={16} strokeWidth={1.5} />}>Add Text</PillButton>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex shrink-0 border-b border-[#333] w-full">
                    {(['design', 'animate'] as const).map(id => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex-1 flex items-center justify-center py-2 text-[11px] font-medium tracking-wide transition-all duration-150 relative active:scale-95
                                ${activeTab === id ? 'text-white/90 font-bold' : 'text-white/25 hover:text-white/45'}`}
                        >
                            {id.charAt(0).toUpperCase() + id.slice(1)}
                            {activeTab === id && <span className="absolute bottom-[-1px] left-4 right-4 h-[2px] bg-white rounded-full" />}
                        </button>
                    ))}
                </div>

                {activeTab === 'design' ? (
                    <>
                        {/* Background Settings */}
                        <div className="flex flex-col gap-2 items-start w-full">
                            <SectionLabel>Stage Background</SectionLabel>
                            <div className="flex flex-col gap-2.5 items-start w-full">
                                <SegmentedToggle
                                    value={bgType}
                                    onChange={(v) => onBgTypeChange(v as any)}
                                    items={[
                                        { value: 'transparent', label: 'Transp' },
                                        { value: 'solid', label: 'Solid' },
                                        { value: 'gradient', label: 'Grad' },
                                        { value: 'media', label: 'Media' }
                                    ]}
                                />
                                
                                {bgType === 'solid' && (
                                    <div className="flex items-center h-[34px] border border-[#595959] rounded-xl px-2.5 gap-2.5 w-full">
                                        <input type="color" value={bgColor1} onChange={e => onBgColor1Change(e.target.value)}
                                            className="w-[18px] h-[18px] rounded-full bg-transparent cursor-pointer overflow-hidden border border-[#595959] shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full" />
                                        <span className="text-[11px] text-white/80 font-mono flex-1">{bgColor1.toUpperCase()}</span>
                                    </div>
                                )}
                                
                                {bgType === 'gradient' && (
                                    <div className="flex flex-col gap-2.5 w-full">
                                        <div className="flex gap-2 w-full">
                                            <div className="flex-1 flex items-center h-[34px] border border-[#595959] rounded-xl px-2 gap-2">
                                                <input type="color" value={bgColor1} onChange={e => onBgColor1Change(e.target.value)}
                                                    className="w-[18px] h-[18px] rounded-full bg-transparent cursor-pointer overflow-hidden border border-[#595959] shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full" />
                                                <span className="text-[10px] text-white/85 font-mono truncate">{bgColor1.toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1 flex items-center h-[34px] border border-[#595959] rounded-xl px-2 gap-2">
                                                <input type="color" value={bgColor2} onChange={e => onBgColor2Change(e.target.value)}
                                                    className="w-[18px] h-[18px] rounded-full bg-transparent cursor-pointer overflow-hidden border border-[#595959] shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full" />
                                                <span className="text-[10px] text-white/85 font-mono truncate">{bgColor2.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <RangeSlider label="Angle" value={bgGradientAngle} min={0} max={360} formatValue={v => `${Math.round(v)}°`} onChange={onBgGradientAngleChange} />
                                    </div>
                                )}
                                
                                {bgType === 'media' && (
                                    <PillButton variant="outline" onClick={onSelectMedia} icon={<ImagePlus size={16} strokeWidth={1.5} />}>
                                        {hasMedia ? 'Change Video/Image' : 'Import Media'}
                                    </PillButton>
                                )}
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="flex flex-col gap-2 items-start w-full">
                            <SectionLabel>Typography</SectionLabel>
                            <div className="flex flex-col gap-1.5 items-start w-full">
                                <div className="flex gap-1.5 w-full">
                                    <FieldDropdown
                                        label="Font"
                                        value={config.fontFamily}
                                        options={combinedFontOptions}
                                        onChange={(v) => {
                                            const newFont = FONTS.find(f => f.family === v);
                                            const updates: Partial<TextConfig> = { fontFamily: v };
                                            if (newFont && !newFont.weights.includes(config.fontWeight)) {
                                                updates.fontWeight = newFont.weights.includes(400) ? 400 : newFont.weights[0];
                                            }
                                            onUpdate(updates);
                                        }}
                                        className="flex-1 w-[50%]"
                                    />
                                    <FieldDropdown
                                        label="Weight"
                                        value={String(config.fontWeight)}
                                        options={availableWeights.map(w => ({ value: String(w), label: WEIGHT_LABELS[w] }))}
                                        onChange={(v) => onUpdate({ fontWeight: Number(v) })}
                                        className="flex-1 w-[50%]"
                                    />
                                </div>
                                <RangeSlider label="Size" value={config.fontSize} min={12} max={300} onChange={v => onUpdate({ fontSize: v })} formatValue={v => `${Math.round(v)}px`} />
                                <RangeSlider label="Line Height" value={config.lineHeight} min={0.5} max={3} step={0.1} onChange={v => onUpdate({ lineHeight: v })} formatValue={v => v.toFixed(1)} />
                                <RangeSlider label="Letter Spacing" value={config.letterSpacing} min={-20} max={100} onChange={v => onUpdate({ letterSpacing: v })} formatValue={v => `${Math.round(v)}px`} />
                                <IconToggleBar
                                    value={config.textAlign}
                                    onChange={v => onUpdate({ textAlign: v })}
                                    items={[
                                        { value: 'left', icon: <Icon name="format_align_left" size={16} /> },
                                        { value: 'center', icon: <Icon name="format_align_center" size={16} /> },
                                        { value: 'right', icon: <Icon name="format_align_right" size={16} /> }
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Styles & Shadows */}
                        <div className="flex flex-col gap-3 items-start w-full border-t border-[#333]/50 pt-3">
                            <SectionLabel>Text Styling & Outline</SectionLabel>
                            <div className="flex flex-col gap-3 w-full">
                                {/* Text Color */}
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider px-2">Matn Rangi</span>
                                    <div className="flex items-center h-[34px] border border-[#595959] rounded-xl px-2.5 gap-2.5 w-full">
                                        <input type="color" value={config.color} onChange={e => onUpdate({ color: e.target.value })}
                                            className="w-[18px] h-[18px] rounded-full bg-transparent cursor-pointer overflow-hidden border border-[#595959] shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full" />
                                        <span className="text-[11px] text-white/80 font-mono flex-1">{config.color.toUpperCase()}</span>
                                    </div>
                                </div>

                                {/* Outline/Stroke */}
                                <div className="flex flex-col gap-1 w-full border-t border-[#333]/30 pt-2.5">
                                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider px-2">Stroke (Hoshiya)</span>
                                    <div className="flex items-center h-[34px] border border-[#595959] rounded-xl px-2.5 gap-2.5 w-full mb-1">
                                        <input type="color" value={config.strokeColor || '#000000'} onChange={e => onUpdate({ strokeColor: e.target.value })}
                                            className="w-[18px] h-[18px] rounded-full bg-transparent cursor-pointer overflow-hidden border border-[#595959] shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full" />
                                        <span className="text-[11px] text-white/80 font-mono flex-1">{(config.strokeColor || '#000000').toUpperCase()}</span>
                                    </div>
                                    <RangeSlider label="Outline Thickness" value={config.strokeWidth || 0} min={0} max={20} formatValue={v => `${v}px`} onChange={v => onUpdate({ strokeWidth: v })} />
                                </div>

                                {/* Drop Shadow */}
                                <div className="flex flex-col gap-1 w-full border-t border-[#333]/30 pt-2.5">
                                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider px-2">Drop Shadow (Soyabon)</span>
                                    <div className="flex items-center h-[34px] border border-[#595959] rounded-xl px-2.5 gap-2.5 w-full mb-1">
                                        <input type="color" value={config.shadowColor || '#000000'} onChange={e => onUpdate({ shadowColor: e.target.value })}
                                            className="w-[18px] h-[18px] rounded-full bg-transparent cursor-pointer overflow-hidden border border-[#595959] shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full" />
                                        <span className="text-[11px] text-white/80 font-mono flex-1">{(config.shadowColor || '#000000').toUpperCase()}</span>
                                    </div>
                                    <RangeSlider label="Shadow Blur" value={config.shadowBlur || 0} min={0} max={100} formatValue={v => `${v}px`} onChange={v => onUpdate({ shadowBlur: v })} />
                                    <AngleSlider label="Shadow Angle" value={config.shadowAngle || 45} onChange={v => onUpdate({ shadowAngle: v })} />
                                    <RangeSlider label="Shadow Distance" value={config.shadowDistance || 0} min={0} max={100} formatValue={v => `${v}px`} onChange={v => onUpdate({ shadowDistance: v })} />
                                </div>

                                {/* Inner Shadow */}
                                <div className="flex flex-col gap-1 w-full border-t border-[#333]/30 pt-2.5">
                                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider px-2">Inner Shadow (Ichki Soya)</span>
                                    <div className="flex items-center h-[34px] border border-[#595959] rounded-xl px-2.5 gap-2.5 w-full mb-1">
                                        <input type="color" value={config.innerShadowColor || '#000000'} onChange={e => onUpdate({ innerShadowColor: e.target.value })}
                                            className="w-[18px] h-[18px] rounded-full bg-transparent cursor-pointer overflow-hidden border border-[#595959] shrink-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full" />
                                        <span className="text-[11px] text-white/80 font-mono flex-1">{(config.innerShadowColor || '#000000').toUpperCase()}</span>
                                    </div>
                                    <RangeSlider label="Inner Shadow Blur" value={config.innerShadowBlur || 0} min={0} max={100} formatValue={v => `${v}px`} onChange={v => onUpdate({ innerShadowBlur: v })} />
                                    <AngleSlider label="Inner Shadow Angle" value={config.innerShadowAngle || 45} onChange={v => onUpdate({ innerShadowAngle: v })} />
                                    <RangeSlider label="Inner Shadow Distance" value={config.innerShadowDistance || 0} min={0} max={100} formatValue={v => `${v}px`} onChange={v => onUpdate({ innerShadowDistance: v })} />
                                </div>

                                {/* Opacity */}
                                <div className="flex flex-col gap-1 w-full border-t border-[#333]/30 pt-2.5">
                                    <RangeSlider label="Layer Background Opacity" value={config.bgOpacity} min={0} max={100} formatValue={v => `${Math.round(v)}%`} onChange={v => onUpdate({ bgOpacity: v })} />
                                </div>
                            </div>
                        </div>

                        {/* Position */}
                        <div className="flex flex-col gap-2 items-start w-full">
                            <SectionLabel>Position</SectionLabel>
                            <div className="w-full rounded-xl border border-[#595959] overflow-hidden grid grid-cols-3 grid-rows-3 bg-transparent"
                                style={{ aspectRatio: '16 / 9' }}>
                                {POSITION_PRESETS.map((p, idx) => {
                                    const isSelected = config.position.x === p.x && config.position.y === p.y;
                                    const borderRight = (idx % 3 !== 2) ? 'border-r border-[#595959]' : '';
                                    const borderBottom = (Math.floor(idx / 3) !== 2) ? 'border-b border-[#595959]' : '';
                                    return (
                                        <button key={p.name} onClick={() => onUpdate({ position: { x: p.x, y: p.y } })}
                                            className={`flex justify-center items-center ${borderRight} ${borderBottom} transition-all duration-150 active:scale-95
                                                ${isSelected ? 'bg-[#969696] text-black' : 'text-[rgba(218,220,224,0.55)] hover:text-white hover:bg-white/5'}`}
                                            title={p.name}>
                                            <Icon name={POSITION_ICONS[p.icon] || 'center_focus_strong'} size={16} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Timeline Placement */}
                        <div className="flex flex-col gap-3.5 items-start w-full pb-3">
                            <SectionLabel>Timeline Placement (Joylashuv)</SectionLabel>
                            <div className="flex flex-col gap-1.5 w-full">
                                <RangeSlider
                                    label="Boshlanish vaqti (Delay)"
                                    value={config.delay}
                                    min={0}
                                    max={duration * 1000}
                                    step={100}
                                    formatValue={v => `${(v / 1000).toFixed(1)}s`}
                                    onChange={v => {
                                        const newDelay = v;
                                        const maxDur = (duration * 1000) - newDelay;
                                        const newDur = Math.min(config.duration, maxDur);
                                        onUpdate({ delay: newDelay, duration: newDur });
                                    }}
                                />
                                <RangeSlider
                                    label="Faol bo'lish vaqti (Lifespan)"
                                    value={config.duration}
                                    min={300}
                                    max={(duration * 1000) - config.delay}
                                    step={100}
                                    formatValue={v => `${(v / 1000).toFixed(1)}s`}
                                    onChange={v => onUpdate({ duration: v })}
                                />
                            </div>
                        </div>

                        {/* Transitions (Entrance and Exit) */}
                        <div className="flex flex-col gap-3.5 items-start w-full">
                            <SectionLabel>Entrance Effect (Kirish)</SectionLabel>
                            <div className="grid grid-cols-2 gap-1.5 w-full max-h-[190px] overflow-y-auto dark-scrollbar pr-1 pb-1">
                                {ENTRANCE_EFFECTS.map(opt => {
                                    const isSelected = config.effect === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onUpdate({ effect: opt.value as any })}
                                            className={`effect-card flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-150 relative active:scale-95 h-[58px] gap-1 select-none
                                                ${isSelected ? 'bg-white text-black border-white font-semibold' : 'bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/[0.07] hover:border-white/10'}`}
                                        >
                                            <span className={`text-[10px] font-bold tracking-wider opacity-60 ${opt.preview}`}>
                                                Aa
                                            </span>
                                            <span className="text-[9px] font-medium leading-tight">
                                                {opt.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {config.effect !== 'none' && (
                                <FieldDropdown
                                    label="Kirish Yo'nalishi (Stagger Direction)"
                                    value={config.inDirection || 'first'}
                                    options={[
                                        { value: 'first', label: 'Chapdan O\'ngga (Chap)' },
                                        { value: 'last', label: 'O\'ngdan Chapga (O\'ng)' },
                                        { value: 'center', label: 'Markazdan (Center)' },
                                        { value: 'random', label: 'Tasodifiy (Random)' }
                                    ]}
                                    onChange={(v) => onUpdate({ inDirection: v as any })}
                                    className="w-full mt-1.5"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-3.5 items-start w-full border-t border-[#333] pt-3">
                            <SectionLabel>Exit Effect (Chiqish)</SectionLabel>
                            <div className="grid grid-cols-2 gap-1.5 w-full max-h-[150px] overflow-y-auto dark-scrollbar pr-1 pb-1">
                                {EXIT_EFFECTS.map(opt => {
                                    const isSelected = config.outEffect === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onUpdate({ outEffect: opt.value as any })}
                                            className={`effect-card flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-150 relative active:scale-95 h-[58px] gap-1 select-none
                                                ${isSelected ? 'bg-white text-black border-white font-semibold' : 'bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/[0.07] hover:border-white/10'}`}
                                        >
                                            <span className={`text-[10px] font-bold tracking-wider opacity-60 ${opt.preview}`}>
                                                Aa
                                            </span>
                                            <span className="text-[9px] font-medium leading-tight">
                                                {opt.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {config.outEffect && config.outEffect !== 'none' && (
                                <FieldDropdown
                                    label="Chiqish Yo'nalishi (Stagger Direction)"
                                    value={config.outDirection || 'first'}
                                    options={[
                                        { value: 'first', label: 'Chapdan O\'ngga (Chap)' },
                                        { value: 'last', label: 'O\'ngdan Chapga (O\'ng)' },
                                        { value: 'center', label: 'Markazdan (Center)' },
                                        { value: 'random', label: 'Tasodifiy (Random)' }
                                    ]}
                                    onChange={(v) => onUpdate({ outDirection: v as any })}
                                    className="w-full mt-1.5"
                                />
                            )}
                        </div>

                        <div className="flex flex-col gap-3 w-full border-t border-[#333] pt-3">
                            <SectionLabel>Transitions Speed (Tezlik)</SectionLabel>
                            <div className="flex flex-col gap-1 w-full">
                                <RangeSlider label="Entrance Duration" value={config.inDuration} min={0} max={5000} step={100} formatValue={v => `${Math.round(v)}ms`} onChange={v => onUpdate({ inDuration: v })} />
                                <RangeSlider label="Exit Duration" value={config.outDuration} min={0} max={5000} step={100} formatValue={v => `${Math.round(v)}ms`} onChange={v => onUpdate({ outDuration: v })} />
                            </div>
                        </div>

                        {/* Text Segmentation (Granularity) */}
                        <div className="flex flex-col gap-3.5 items-start w-full border-t border-[#333] pt-3">
                            <SectionLabel>Text Segmentation</SectionLabel>
                            <div className="flex flex-col gap-3 w-full">
                                <FieldDropdown
                                    label="Segmentation Rejimi"
                                    value={config.granularity || 'word'}
                                    options={[
                                        { value: 'char', label: '🔤 Harfma-harf' },
                                        { value: 'word', label: '📝 So\'zma-so\'z' },
                                        { value: 'line', label: '➖ Qator-qator' },
                                        { value: 'all', label: '📦 Umumiy (Yaxlit)' }
                                    ]}
                                    onChange={(v) => onUpdate({ granularity: v as any })}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Kinetic Loop Animations */}
                        <div className="flex flex-col gap-3.5 items-start w-full border-t border-[#333] pt-3">
                            <SectionLabel>Loop Effect (Doimiy)</SectionLabel>
                            <div className="grid grid-cols-2 gap-1.5 w-full max-h-[150px] overflow-y-auto dark-scrollbar pr-1 pb-1">
                                {LOOP_EFFECTS.map(opt => {
                                    const isSelected = config.loopEffect === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => onUpdate({ loopEffect: opt.value as any })}
                                            className={`effect-card flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-150 relative active:scale-95 h-[58px] gap-1 select-none
                                                ${isSelected ? 'bg-white text-black border-white font-semibold' : 'bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/[0.07] hover:border-white/10'}`}
                                        >
                                            <span className={`text-[10px] font-bold tracking-wider opacity-60 ${opt.preview}`}>
                                                Aa
                                            </span>
                                            <span className="text-[9px] font-medium leading-tight">
                                                {opt.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {config.loopEffect && config.loopEffect !== 'none' && (
                                <div className="flex flex-col gap-1 w-full border-t border-[#333] pt-2">
                                    <RangeSlider label="Loop Speed" value={config.speed} min={0.25} max={4} step={0.05} formatValue={v => `${v.toFixed(2)}x`} onChange={v => onUpdate({ speed: v })} />
                                    <RangeSlider label="Loop Intensity" value={config.intensity} min={0} max={200} step={5} formatValue={v => `${Math.round(v)}%`} onChange={v => onUpdate({ intensity: v })} />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Neon Developer & Donate Banner */}
                <div className="w-[calc(100%-4px)] mx-[2px] border border-pink-500/20 bg-[#160d16]/40 rounded-2xl p-3 flex flex-col gap-2.5 shadow-[0_0_15px_rgba(236,72,153,0.1)] mt-4">
                    <span className="text-[9px] font-bold text-pink-400 tracking-wider uppercase text-center animate-pulse">Dasturchi va Qo'llab-quvvatlash</span>
                    <div className="flex gap-2">
                        <a href="https://t.me/OyatilloErkinov" target="_blank" rel="noopener noreferrer" 
                           className="flex-1 h-8 rounded-xl border border-pink-500/30 hover:bg-pink-500/10 text-[10px] font-bold text-white flex items-center justify-center gap-1 transition-all shadow-[0_0_8px_rgba(236,72,153,0.05)] active:scale-95">
                            <span>Dasturchi</span>
                        </a>
                        <a href={DONATION_URL} target="_blank" rel="noopener noreferrer" 
                           className="flex-1 h-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-650 hover:from-pink-450 hover:to-purple-550 text-[10px] font-extrabold text-white flex items-center justify-center gap-1 transition-all shadow-[0_0_10px_rgba(236,72,153,0.25)] active:scale-95">
                            <span>Donat</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Actions - Pinned */}
            <div className="flex flex-col gap-3 items-start w-full pt-2 mt-auto border-t border-[rgba(218,220,224,0.15)] bg-[#0e0e0e] z-10 shrink-0">
                {/* Python Server Connection Badge */}
                <div className="flex items-center gap-2 px-1 select-none w-full justify-between pb-1">
                    <span className="text-[9px] font-medium text-white/35 uppercase tracking-widest">Render Mode</span>
                    <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 py-0.5 px-2 rounded-full">
                        <span className={`w-1.5 h-1.5 rounded-full ${isPythonConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-500'}`} />
                        <span className="text-[9px] font-semibold text-white/70 tracking-wide font-mono">
                            {isPythonConnected ? 'Python Active' : 'Browser Mode'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 w-full">
                    <FieldDropdown
                        label="Eksport Sifati"
                        value={quality}
                        alignUp={true}
                        options={[
                            { value: 'HD', label: 'HD (720p)' },
                            { value: 'FullHD', label: 'FullHD (1080p)' },
                            { value: 'UHD', label: 'UHD (4K)' }
                        ]}
                        onChange={(v) => onQualityChange(v as any)}
                        className="flex-1 w-[50%]"
                    />
                    <FieldDropdown
                        label="FPS"
                        value={String(fps)}
                        alignUp={true}
                        options={[
                            { value: '24', label: '24 FPS' },
                            { value: '25', label: '25 FPS' },
                            { value: '30', label: '30 FPS' },
                            { value: '60', label: '60 FPS' }
                        ]}
                        onChange={(v) => onFpsChange(Number(v) as 24 | 25 | 30 | 60)}
                        className="flex-1 w-[50%]"
                    />
                </div>
                {isRendering ? (
                    <PillButton 
                        variant="solid" 
                        onClick={onCancelExport} 
                        className="bg-red-650 hover:bg-red-600 border-red-650 hover:border-red-600 text-white font-bold w-full"
                        icon={<Icon name="close" size={16} className="opacity-80 text-white" />}
                    >
                        Stop Render ({Math.round(renderProgress * 100)}%)
                    </PillButton>
                ) : (
                    <PillButton 
                        variant="solid" 
                        onClick={onExport} 
                        icon={<Download size={16} strokeWidth={1.5} className="opacity-80" />}
                    >
                        Render Video
                    </PillButton>
                )}
            </div>
        </div>
    );
};