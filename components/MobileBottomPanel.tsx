import React, { useState, useMemo } from 'react';
import { TextConfig, FONTS, POSITION_PRESETS } from '../types';
import {
    SectionLabel, PillButton, FieldDropdown,
    RangeSlider, SegmentedToggle, IconToggleBar, TextInput,
    AngleSlider
} from './Primitives';
import { EffectPicker } from './EffectPicker';
import { Type, Palette, Sparkles, Clock, Image, Settings2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface MobileBottomPanelProps {
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
}

const ENTRANCE_EFFECTS = [
    { value: 'none', label: 'Yo\'q (Instant)' },
    { value: 'blur-in', label: 'Blur In (Xiralik)' },
    { value: 'typewriter', label: 'Typewriter (Yozuv)' },
    { value: 'scale-in', label: 'Scale In (Kattalashuv)' },
    { value: 'slide-up', label: 'Slide Up (Tepaga)' },
    { value: 'slide-down', label: 'Slide Down (Pastga)' },
    { value: 'slide-left', label: 'Slide Left (Chapga)' },
    { value: 'slide-right', label: 'Slide Right (O\'ngga)' },
    { value: 'rotate-in', label: 'Rotate (Aylanish)' },
    { value: 'elastic-in', label: 'Elastic (Prujina)' },
    { value: 'glitch-in', label: 'Glitch (Glik)' },
    { value: 'fly-in', label: 'Fly In (Uchish)' },
    { value: 'vortex-in', label: 'Vortex (Girdob)' },
    { value: 'sequential-stack', label: 'Seq Stack (Ketma-ket)' }
];

const EXIT_EFFECTS = [
    { value: 'none', label: 'Yo\'q (Instant)' },
    { value: 'blur-out', label: 'Blur Out' },
    { value: 'scale-out', label: 'Scale Out' },
    { value: 'slide-up', label: 'Slide Up' },
    { value: 'slide-down', label: 'Slide Down' },
    { value: 'slide-left', label: 'Slide Left' },
    { value: 'slide-right', label: 'Slide Right' },
    { value: 'rotate-out', label: 'Rotate Out' },
    { value: 'glitch-out', label: 'Glitch Out' },
    { value: 'fly-out', label: 'Fly Out' },
    { value: 'vortex-out', label: 'Vortex Out' }
];

const LOOP_EFFECTS = [
    { value: 'none', label: 'Tinch (Still)' },
    { value: 'wave', label: 'To\'lqin (Wave)' },
    { value: 'wiggle', label: 'Qaltirash (Wiggle)' },
    { value: 'float', label: 'Suzish (Float)' },
    { value: 'pulse', label: 'Puls (Pulse)' },
    { value: 'font-shuffle', label: 'Shrift almashishi (Shuffle)' },
    { value: 'glow-flicker', label: 'Yaltillash (Flicker)' },
    { value: 'pendulum', label: 'Mayatnik (Pendulum)' },
    { value: 'blink', label: 'Miltillash (Blink)' },
    { value: 'skew-wave', label: 'Qiyalik to\'lqini (Skew)' },
    { value: 'spin-loop', label: 'Doimiy aylanish (Spin)' }
];

type TabType = 'text' | 'style' | 'effects' | 'timing' | 'bg' | 'layers';

export const MobileBottomPanel: React.FC<MobileBottomPanelProps> = ({
    config, allConfigs, onUpdate, onSelectMedia,
    onDeleteLayer, onSelectLayer, onAddLayer, onExport, onCancelExport,
    isRendering, renderProgress, hasMedia,
    aspectRatio, quality, fps, onAspectRatioChange, onQualityChange, onFpsChange,
    bgType, onBgTypeChange, bgColor1, onBgColor1Change,
    bgColor2, onBgColor2Change, bgGradientAngle, onBgGradientAngleChange,
    onMoveLayer, duration, onDurationChange
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('text');

    const fontOptions = useMemo(() => {
        return FONTS.map(f => ({
            value: f.family,
            label: f.name,
            style: { fontFamily: f.family }
        }));
    }, []);

    const selectedFont = FONTS.find(f => f.family === config?.fontFamily);
    const availableWeights = selectedFont?.weights || [400, 700];

    return (
        <div className="w-full bg-[#141414] border-t border-white/10 flex flex-col shrink-0 z-30 shadow-2xl">
            {/* Scrollable Content Area */}
            <div className="h-[210px] overflow-y-auto px-4 py-3 space-y-4">
                {activeTab === 'text' && config && (
                    <div className="space-y-3">
                        <SectionLabel>Matn Tahriri</SectionLabel>
                        <TextInput
                            value={config.content}
                            onChange={(val) => onUpdate({ content: val })}
                            placeholder="Matn kiriting..."
                            autoResize
                        />

                        <div className="grid grid-cols-2 gap-2">
                            <FieldDropdown
                                label="Shrift (Font)"
                                value={config.fontFamily}
                                options={fontOptions}
                                onChange={(val) => onUpdate({ fontFamily: val })}
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-medium text-white/40 px-1">Qalinlik</span>
                                <SegmentedToggle
                                    value={String(config.fontWeight)}
                                    items={availableWeights.map(w => ({ value: String(w), label: String(w) }))}
                                    onChange={(val) => onUpdate({ fontWeight: Number(val) })}
                                />
                            </div>
                        </div>

                        <RangeSlider
                            label="O'lcham (Size)"
                            min={16}
                            max={180}
                            value={config.fontSize}
                            formatValue={v => `${v}px`}
                            onChange={(val) => onUpdate({ fontSize: val })}
                        />

                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-medium text-white/40 px-1">Tekislash (Alignment)</span>
                            <SegmentedToggle
                                value={config.textAlign}
                                items={[
                                    { value: 'left', label: 'Chap' },
                                    { value: 'center', label: 'Markaz' },
                                    { value: 'right', label: 'O\'ng' }
                                ]}
                                onChange={(val) => onUpdate({ textAlign: val as any })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <RangeSlider
                                label="Harf oralig'i"
                                min={-5}
                                max={40}
                                value={config.letterSpacing}
                                formatValue={v => `${v}px`}
                                onChange={(val) => onUpdate({ letterSpacing: val })}
                            />
                            <RangeSlider
                                label="Qator balandligi"
                                min={0.6}
                                max={2}
                                step={0.1}
                                value={config.lineHeight}
                                formatValue={v => `${v}×`}
                                onChange={(val) => onUpdate({ lineHeight: val })}
                            />
                        </div>

                        {/* Position Presets */}
                        <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-[10px] font-medium text-white/40 px-1">Tezkor Joylashuv</span>
                            <div className="grid grid-cols-3 gap-1.5">
                                {POSITION_PRESETS.map(p => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => onUpdate({ position: { x: p.x, y: p.y } })}
                                        className="h-8 bg-white/5 hover:bg-white/10 active:scale-95 rounded-lg text-[10px] font-medium text-white/80 transition-all border border-white/5"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'style' && config && (
                    <div className="space-y-3">
                        <SectionLabel>Rang va Bezaklar</SectionLabel>

                        {/* Text Color & Background Color */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[11px] font-medium text-white/70">Matn rangi</span>
                                <input
                                    type="color"
                                    value={config.color}
                                    onChange={(e) => onUpdate({ color: e.target.value })}
                                    className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[11px] font-medium text-white/70">Fon xiraligi</span>
                                <input
                                    type="color"
                                    value={config.backgroundColor || '#000000'}
                                    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                                    className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                                />
                            </div>
                        </div>

                        <RangeSlider
                            label="Fon shaffofligi (Dimming)"
                            min={0}
                            max={100}
                            value={config.bgOpacity || 0}
                            formatValue={v => `${v}%`}
                            onChange={(val) => onUpdate({ bgOpacity: val })}
                        />

                        {/* Stroke (Outline) */}
                        <SectionLabel>Hoshiya (Stroke)</SectionLabel>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[11px] font-medium text-white/70">Hoshiya rangi</span>
                            <input
                                type="color"
                                value={config.strokeColor || '#000000'}
                                onChange={(e) => onUpdate({ strokeColor: e.target.value })}
                                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                            />
                        </div>
                        <RangeSlider
                            label="Hoshiya qalinligi"
                            min={0}
                            max={15}
                            value={config.strokeWidth || 0}
                            formatValue={v => `${v}px`}
                            onChange={(val) => onUpdate({ strokeWidth: val })}
                        />

                        {/* Drop Shadow */}
                        <SectionLabel>Tashqi Soya (Drop Shadow)</SectionLabel>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[11px] font-medium text-white/70">Soya rangi</span>
                            <input
                                type="color"
                                value={config.shadowColor || '#000000'}
                                onChange={(e) => onUpdate({ shadowColor: e.target.value })}
                                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                            />
                        </div>
                        <RangeSlider
                            label="Soya xiraligi (Blur)"
                            min={0}
                            max={40}
                            value={config.shadowBlur || 0}
                            formatValue={v => `${v}px`}
                            onChange={(val) => onUpdate({ shadowBlur: val })}
                        />
                        <RangeSlider
                            label="Soya masofasi (Distance)"
                            min={0}
                            max={40}
                            value={config.shadowDistance || 0}
                            formatValue={v => `${v}px`}
                            onChange={(val) => onUpdate({ shadowDistance: val })}
                        />
                        <AngleSlider
                            label="Soya burchagi (Angle)"
                            value={config.shadowAngle || 45}
                            onChange={(val) => onUpdate({ shadowAngle: val })}
                        />

                        {/* Inner Shadow */}
                        <SectionLabel>Ichki Soya (Inner Shadow)</SectionLabel>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[11px] font-medium text-white/70">Ichki soya rangi</span>
                            <input
                                type="color"
                                value={config.innerShadowColor || '#000000'}
                                onChange={(e) => onUpdate({ innerShadowColor: e.target.value })}
                                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                            />
                        </div>
                        <RangeSlider
                            label="Ichki soya xiraligi"
                            min={0}
                            max={30}
                            value={config.innerShadowBlur || 0}
                            formatValue={v => `${v}px`}
                            onChange={(val) => onUpdate({ innerShadowBlur: val })}
                        />
                        <RangeSlider
                            label="Ichki soya masofasi"
                            min={0}
                            max={30}
                            value={config.innerShadowDistance || 0}
                            formatValue={v => `${v}px`}
                            onChange={(val) => onUpdate({ innerShadowDistance: val })}
                        />
                        <AngleSlider
                            label="Ichki soya burchagi"
                            value={config.innerShadowAngle || 45}
                            onChange={(val) => onUpdate({ innerShadowAngle: val })}
                        />
                    </div>
                )}

                {activeTab === 'effects' && config && (
                    <div className="space-y-3">
                        <SectionLabel>Animatsiya Effektlari</SectionLabel>
                        <EffectPicker config={config} onUpdate={onUpdate} />

                        {/* Exit Effect Dropdown */}
                        <div className="pt-2 border-t border-white/5 space-y-2">
                            <SectionLabel>Chiqish Animatsiyasi (Exit)</SectionLabel>
                            <FieldDropdown
                                label="Chiqish effekti"
                                value={config.outEffect || 'none'}
                                options={EXIT_EFFECTS}
                                onChange={(val) => onUpdate({ outEffect: val as any, outDuration: val === 'none' ? 0 : 800 })}
                            />
                        </div>

                        {/* Full Kinetic Loop Dropdown */}
                        <div className="pt-2 border-t border-white/5 space-y-2">
                            <SectionLabel>Aylanish Effekti (Loop)</SectionLabel>
                            <FieldDropdown
                                label="Loop effekti"
                                value={config.loopEffect || 'none'}
                                options={LOOP_EFFECTS}
                                onChange={(val) => onUpdate({ loopEffect: val as any })}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'timing' && config && (
                    <div className="space-y-3">
                        <SectionLabel>Vaqt va Davomiylik</SectionLabel>
                        <RangeSlider
                            label="Umumiy umr davomiyligi"
                            min={500}
                            max={10000}
                            step={100}
                            value={config.duration}
                            formatValue={v => `${(v / 1000).toFixed(1)}s`}
                            onChange={(val) => onUpdate({ duration: val })}
                        />
                        <RangeSlider
                            label="Boshlanish vaqti (Delay)"
                            min={0}
                            max={duration * 1000}
                            step={100}
                            value={config.delay}
                            formatValue={v => `${(v / 1000).toFixed(1)}s`}
                            onChange={(val) => onUpdate({ delay: val })}
                        />
                        <RangeSlider
                            label="Kirish davomiyligi (In)"
                            min={0}
                            max={config.duration}
                            step={50}
                            value={config.inDuration}
                            formatValue={v => `${(v / 1000).toFixed(1)}s`}
                            onChange={(val) => onUpdate({ inDuration: val })}
                        />
                        <RangeSlider
                            label="Chiqish davomiyligi (Out)"
                            min={0}
                            max={config.duration}
                            step={50}
                            value={config.outDuration}
                            formatValue={v => `${(v / 1000).toFixed(1)}s`}
                            onChange={(val) => onUpdate({ outDuration: val })}
                        />
                        <RangeSlider
                            label="Tezlik ko'paytiruvchisi"
                            min={0.25}
                            max={4}
                            step={0.25}
                            value={config.speed}
                            formatValue={v => `${v}×`}
                            onChange={(val) => onUpdate({ speed: val })}
                        />
                    </div>
                )}

                {activeTab === 'bg' && (
                    <div className="space-y-3">
                        <SectionLabel>Fon Sozlamalari (Background)</SectionLabel>
                        <SegmentedToggle
                            value={bgType}
                            items={[
                                { value: 'gradient', label: 'Gradient' },
                                { value: 'solid', label: 'Rangli' },
                                { value: 'transparent', label: 'Shaffof' },
                                { value: 'media', label: 'Media' }
                            ]}
                            onChange={(val) => onBgTypeChange(val as any)}
                        />

                        {bgType === 'gradient' && (
                            <div className="space-y-2 pt-1">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                        <span className="text-[11px] font-medium text-white/70">1-Rang</span>
                                        <input
                                            type="color"
                                            value={bgColor1}
                                            onChange={(e) => onBgColor1Change(e.target.value)}
                                            className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                        <span className="text-[11px] font-medium text-white/70">2-Rang</span>
                                        <input
                                            type="color"
                                            value={bgColor2}
                                            onChange={(e) => onBgColor2Change(e.target.value)}
                                            className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                                        />
                                    </div>
                                </div>
                                <AngleSlider
                                    label="Gradient burchagi"
                                    value={bgGradientAngle}
                                    onChange={onBgGradientAngleChange}
                                />
                            </div>
                        )}

                        {bgType === 'solid' && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[11px] font-medium text-white/70">Fon rangi</span>
                                <input
                                    type="color"
                                    value={bgColor1}
                                    onChange={(e) => onBgColor1Change(e.target.value)}
                                    className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-none"
                                />
                            </div>
                        )}

                        {bgType === 'media' && (
                            <div className="pt-2">
                                <PillButton onClick={onSelectMedia} variant="solid">
                                    {hasMedia ? "Boshqa Media Tanlash" : "Rasm / Video Yuklash"}
                                </PillButton>
                            </div>
                        )}

                        {/* Project Duration */}
                        <div className="pt-2 border-t border-white/5">
                            <RangeSlider
                                label="Loyiha umumiy vaqti"
                                min={3}
                                max={60}
                                step={1}
                                value={duration}
                                formatValue={v => `${v}s`}
                                onChange={onDurationChange}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'layers' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <SectionLabel>Qatlamlar ({allConfigs.length})</SectionLabel>
                            <button
                                onClick={onAddLayer}
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-medium text-white flex items-center gap-1"
                            >
                                <Plus size={14} /> Yangi Qatlam
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            {allConfigs.map((c, i) => (
                                <div
                                    key={c.id}
                                    onClick={() => onSelectLayer(c.id)}
                                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                        config?.id === c.id
                                            ? 'bg-white/10 border-white/40 shadow-sm'
                                            : 'bg-white/[0.02] border-white/5'
                                    }`}
                                >
                                    <span className="text-[12px] font-medium text-white truncate max-w-[150px]">
                                        {c.content.replace(/\n/g, ' ') || `Qatlam ${i + 1}`}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMoveLayer(c.id, 'up'); }}
                                            type="button"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMoveLayer(c.id, 'down'); }}
                                            type="button"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/60"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                        {allConfigs.length > 1 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteLayer(c.id); }}
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Tab Bar (CapCut style) */}
            <div className="flex items-center justify-around border-t border-white/10 py-1.5 px-2 bg-[#0d0d0d]">
                <button
                    onClick={() => setActiveTab('text')}
                    type="button"
                    className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                        activeTab === 'text' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Type size={18} />
                    <span className="text-[9px]">Matn</span>
                </button>

                <button
                    onClick={() => setActiveTab('style')}
                    type="button"
                    className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                        activeTab === 'style' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Palette size={18} />
                    <span className="text-[9px]">Uslub</span>
                </button>

                <button
                    onClick={() => setActiveTab('effects')}
                    type="button"
                    className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                        activeTab === 'effects' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Sparkles size={18} />
                    <span className="text-[9px]">Effekt</span>
                </button>

                <button
                    onClick={() => setActiveTab('timing')}
                    type="button"
                    className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                        activeTab === 'timing' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Clock size={18} />
                    <span className="text-[9px]">Vaqt</span>
                </button>

                <button
                    onClick={() => setActiveTab('bg')}
                    type="button"
                    className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                        activeTab === 'bg' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Image size={18} />
                    <span className="text-[9px]">Fon</span>
                </button>

                <button
                    onClick={() => setActiveTab('layers')}
                    type="button"
                    className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                        activeTab === 'layers' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70'
                    }`}
                >
                    <Settings2 size={18} />
                    <span className="text-[9px]">Qatlam</span>
                </button>
            </div>
        </div>
    );
};
