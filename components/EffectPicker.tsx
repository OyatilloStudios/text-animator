import React, { useEffect, useRef, memo } from 'react';
import { AnimationEffect, AnimationGranularity, AnimationEasing, StackTransition, TextConfig,
         KINETIC_EFFECTS, TRANSITION_EFFECTS, EFFECTS_WITH_SPEED, EFFECTS_WITH_AMPLITUDE, EFFECTS_WITH_EASING } from '../types';
import { SegmentedToggle, RangeSlider, SectionLabel } from './Primitives';

interface EffectPickerProps {
    config: TextConfig;
    onUpdate: (updates: Partial<TextConfig>) => void;
}

const TRANSITION_LIST: { id: AnimationEffect; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'blur-in', label: 'Blur' },
    { id: 'slide-up', label: 'Slide Up' },
    { id: 'slide-fade', label: 'Fade' },
    { id: 'typewriter', label: 'Appear' },
];

const KINETIC_LIST: { id: AnimationEffect; label: string }[] = [
    { id: 'sequential-stack', label: 'Stack' },
    { id: 'wave', label: 'Wave' },
    { id: 'wiggle', label: 'Wiggle' },
    { id: 'font-shuffle', label: 'Shuffle' },
];

/* ─── Mini Preview ─── */
const EffectPreview: React.FC<{
    effect: AnimationEffect; text: string; fontFamily: string; isSelected: boolean; onClick: () => void;
}> = memo(({ effect, text, fontFamily, isSelected, onClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const words = text.split(' ').filter(w => w.length > 0);
    const previewWords = words.length >= 2 ? words.slice(0, 3) : ['Text', 'Here'];
    const previewText = (words[0] || 'Text').slice(0, 6);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const styleId = 'effect-preview-keyframes-v3';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes ep-blur { 0%{opacity:0;filter:blur(6px);transform:translateY(4px)} 20%{opacity:1;filter:blur(0);transform:translateY(0)} 80%{opacity:1} 100%{opacity:0;filter:blur(6px);transform:translateY(-4px)} }
                @keyframes ep-type { 0%{opacity:0} 12%{opacity:1} 75%{opacity:1} 76%{opacity:0} 100%{opacity:0} }
                @keyframes ep-slide { 0%{opacity:0;transform:translateY(150%)} 20%{opacity:1;transform:translateY(0)} 80%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-150%)} }
                @keyframes ep-fade { 0%{opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
                @keyframes ep-stack-2 { 0%{opacity:0} 0.1%{opacity:1} 50%{opacity:1} 50.1%{opacity:0} 100%{opacity:0} }
                @keyframes ep-stack-3 { 0%{opacity:0} 0.1%{opacity:1} 33.3%{opacity:1} 33.4%{opacity:0} 100%{opacity:0} }
                @keyframes ep-wave { 0%{transform:translateY(0)} 25%{transform:translateY(-4px)} 50%{transform:translateY(0)} 75%{transform:translateY(4px)} 100%{transform:translateY(0)} }
                @keyframes ep-wiggle { 0%{transform:translate(0,0)} 20%{transform:translate(2px,-1px)} 40%{transform:translate(-1px,2px)} 60%{transform:translate(1px,1px)} 80%{transform:translate(-2px,0)} 100%{transform:translate(0,0)} }
                @keyframes ep-shuffle { 0%{font-family:'Instrument Sans',sans-serif} 20%{font-family:'Instrument Serif',serif} 40%{font-family:'Space Mono',monospace} 60%{font-family:'Danfo',serif} 80%{font-family:'Faculty Glyphic',sans-serif} 100%{font-family:'Instrument Sans',sans-serif} }
            `;
            document.head.appendChild(style);
        }

        const chars = previewText.split('');
        const dur = 2500;
        let html = '';

        const charAnim = (kf: string, addStyle = '') =>
            chars.map((c, i) => {
                const d = (i / chars.length) * (dur * 0.3);
                return `<span style="display:inline-block;animation:${kf} ${dur}ms ${d}ms ease-out infinite;opacity:0;${addStyle}">${c === ' ' ? '&nbsp;' : c}</span>`;
            }).join('');

        const stackAnim = (kf: string) => {
            const sw = previewWords.map(w => w.slice(0, 8));
            return `<div style="display:grid;place-items:center;width:100%;height:100%">` +
                sw.map((w, i) => `<span style="grid-area:1/1/2/2;animation:${kf} ${dur}ms ${(i / sw.length) * dur}ms ease-out infinite;opacity:0">${w}</span>`).join('') + `</div>`;
        };

        if (effect === 'none') html = `<span>${previewText}</span>`;
        else if (effect === 'blur-in') html = charAnim('ep-blur');
        else if (effect === 'typewriter') html = charAnim('ep-type');
        else if (effect === 'slide-up') html = charAnim('ep-slide');
        else if (effect === 'slide-fade') html = charAnim('ep-fade');
        else if (effect === 'sequential-stack') html = stackAnim(`ep-stack-${previewWords.length}`);

        else if (effect === 'wave') html = chars.map((c, i) => `<span style="display:inline-block;animation:ep-wave 800ms ${i * 100}ms ease-in-out infinite">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
        else if (effect === 'wiggle') html = chars.map((c, i) => `<span style="display:inline-block;animation:ep-wiggle 300ms ${i * 30}ms linear infinite">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
        else if (effect === 'font-shuffle') html = chars.map((c) => `<span style="display:inline-block;animation:ep-shuffle 1200ms linear infinite">${c === ' ' ? '&nbsp;' : c}</span>`).join('');

        el.innerHTML = html;
    }, [effect, previewText, previewWords]);

    return (
        <button onClick={onClick} type="button"
            className={`flex flex-col items-center gap-1.5 rounded-xl border transition-all p-2 active:scale-95
                ${isSelected ? 'border-white bg-white/10 ring-1 ring-white/30' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
            <div ref={containerRef}
                className="w-full h-[36px] flex items-center justify-center overflow-hidden rounded-md text-[13px] text-white"
                style={{ fontFamily, letterSpacing: '-0.5px', fontWeight: 500 }} />
            <span className={`text-[10px] tracking-wide font-medium transition-colors ${isSelected ? 'text-white font-semibold' : 'text-white/40'}`}>
                {[...TRANSITION_LIST, ...KINETIC_LIST].find(e => e.id === effect)?.label}
            </span>
        </button>
    );
});

const EFFECT_DEFAULTS: Partial<Record<AnimationEffect, Partial<TextConfig>>> = {
    'none':             { granularity: 'word', easing: 'smooth', speed: 1, intensity: 50 },
    'blur-in':          { granularity: 'word', easing: 'smooth', speed: 1, intensity: 50 },
    'typewriter':       { granularity: 'char', easing: 'linear', speed: 1, intensity: 50 },
    'slide-up':         { granularity: 'word', easing: 'smooth', speed: 1, intensity: 50 },
    'slide-fade':       { granularity: 'word', easing: 'smooth', speed: 1, intensity: 50 },
    'sequential-stack': { granularity: 'word', easing: 'smooth', speed: 1, intensity: 50, stackTransition: 'cut' },
    'wave':             { granularity: 'char', easing: 'smooth', speed: 1, intensity: 50 },
    'wiggle':           { granularity: 'char', easing: 'linear', speed: 1, intensity: 50 },
    'font-shuffle':     { granularity: 'char', easing: 'linear', speed: 2, intensity: 50 },
};

export const EffectPicker: React.FC<EffectPickerProps> = ({ config, onUpdate }) => {
    const showSpeed = EFFECTS_WITH_SPEED.has(config.effect);
    const showAmplitude = EFFECTS_WITH_AMPLITUDE.has(config.effect);
    const showEasing = EFFECTS_WITH_EASING.has(config.effect);
    const showControls = config.effect !== 'none';
    const isStack = config.effect === 'sequential-stack';

    const handleEffectClick = (id: AnimationEffect) => {
        const updates: Partial<TextConfig> = { effect: id, ...(EFFECT_DEFAULTS[id] || {}) };
        if (KINETIC_EFFECTS.has(id) || id === 'sequential-stack') {
            updates.inDuration = 0;
            updates.outDuration = 0;
        }
        if (TRANSITION_EFFECTS.has(id) && config.inDuration === 0 && config.outDuration === 0) {
            updates.inDuration = 800;
        }
        onUpdate(updates);
    };

    return (
        <div className="space-y-3 w-full">
            <SectionLabel>Kirish Animatsiyasi (Transitions)</SectionLabel>
            <div className="grid grid-cols-3 gap-2 w-full">
                {TRANSITION_LIST.map(eff => (
                    <EffectPreview key={eff.id} effect={eff.id} text={config.content} fontFamily={config.fontFamily}
                        isSelected={config.effect === eff.id} onClick={() => handleEffectClick(eff.id)} />
                ))}
            </div>

            <SectionLabel>Aylanish Animatsiyasi (Kinetic Loops)</SectionLabel>
            <div className="grid grid-cols-3 gap-2 w-full">
                {KINETIC_LIST.map(eff => (
                    <EffectPreview key={eff.id} effect={eff.id} text={config.content} fontFamily={config.fontFamily}
                        isSelected={config.effect === eff.id} onClick={() => handleEffectClick(eff.id)} />
                ))}
            </div>

            {showControls && (
                <div className="space-y-2 pt-1 border-t border-white/5">
                    <div className="flex flex-col gap-1 w-full">
                        <span className="text-[10px] font-medium text-white/50 px-1">Qo'llash (Granularity)</span>
                        <SegmentedToggle
                            items={[{ value: 'char', label: 'Harf' }, { value: 'word', label: 'So\'z' }, { value: 'line', label: 'Qator' }]}
                            value={config.granularity}
                            onChange={(val) => onUpdate({ granularity: val as AnimationGranularity })}
                        />
                    </div>

                    {showEasing && (
                        <div className="flex flex-col gap-1 pt-1 w-full">
                            <span className="text-[10px] font-medium text-white/50 px-1">Silliqlik (Smoothing)</span>
                            <SegmentedToggle
                                items={[{ value: 'linear', label: 'Chiziqli' }, { value: 'smooth', label: 'Silliq' }]}
                                value={config.easing}
                                onChange={(val) => onUpdate({ easing: val as AnimationEasing })}
                            />
                        </div>
                    )}

                    {showSpeed && (
                        <RangeSlider label="Tezlik (Speed)" min={0.25} max={4} step={0.25} formatValue={v => `${v}×`} value={config.speed} onChange={(val) => onUpdate({ speed: val })} />
                    )}

                    {showAmplitude && (
                        <RangeSlider label="Kuchlilik (Amplitude)" min={5} max={200} step={5} formatValue={v => `${v}%`} value={config.intensity} onChange={(val) => onUpdate({ intensity: val })} />
                    )}

                    {isStack && (
                        <div className="flex flex-col gap-1 pt-1 w-full">
                            <span className="text-[10px] font-medium text-white/50 px-1">O'tish Turi (Transition)</span>
                            <SegmentedToggle
                                items={[{ value: 'blur', label: 'Blur' }, { value: 'cut', label: 'Kesish' }, { value: 'fade', label: 'Fade' }]}
                                value={config.stackTransition || 'cut'}
                                onChange={(val) => onUpdate({ stackTransition: val as StackTransition })}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
