import React, { useEffect, useRef, useMemo, memo } from 'react';
import { createTimeline, stagger, splitText, steps, spring } from 'animejs';
import { TextConfig, FONTS, KINETIC_EFFECTS } from '../types';
import { timeController } from '../services/TimeController';

interface AnimatedTextProps {
    config: TextConfig;
    isPlaying: boolean;
    animationKey: number;
    selectedId: string | null;
    onSelectLayer: (e: React.MouseEvent, id: string) => void;
    zIndex: number;
}

const FONT_FAMILIES = FONTS.map(f => f.family);

// Module-level style injection
const STYLE_ID = 'typestroke-animation-styles';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.innerHTML = `
        .stack-container { display: grid; place-items: center; width: 100%; height: 100%; }
        .stack-item { grid-area: 1 / 1 / 2 / 2; opacity: 0; }
        .line-wrap { display: block; }
    `;
    document.head.appendChild(styleEl);
}

function seededRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function applyKineticFrame(effect: string, elements: HTMLElement[], localTimeMs: number, speed: number, intensity: number, lineIndices: number[] = []) {
    const n = elements.length;
    if (n === 0) return;
    const s = speed || 1;
    const amp = (intensity || 50) / 50;

    if (effect === 'wave') {
        const freq = s * 0.008;
        const maxY = amp * 12;
        elements.forEach((el, i) => {
            const idx = lineIndices.length > 0 ? lineIndices[i] : i;
            const y = Math.sin(localTimeMs * freq + idx * 0.7) * maxY;
            el.style.transform = `translateY(${y}px)`;
        });
    } else if (effect === 'wiggle') {
        const updateRate = Math.max(30, 200 / s);
        const tick = Math.floor(localTimeMs / updateRate);
        const maxShift = amp * 4;
        elements.forEach((el, i) => {
            const sx = seededRandom(tick * 137 + i * 31);
            const sy = seededRandom(tick * 251 + i * 53);
            el.style.transform = `translate(${(sx - 0.5) * maxShift * 2}px, ${(sy - 0.5) * maxShift * 2}px)`;
        });
    } else if (effect === 'font-shuffle') {
        const interval = Math.max(50, 400 / s);
        const tick = Math.floor(localTimeMs / interval);
        elements.forEach((el, i) => {
            const fontIdx = Math.floor(seededRandom(tick * 73 + i * 17) * FONT_FAMILIES.length);
            el.style.fontFamily = FONT_FAMILIES[fontIdx];
        });
    } else if (effect === 'float') {
        const freq = s * 0.003;
        const y = Math.sin(localTimeMs * freq) * amp * 15;
        elements.forEach((el) => {
            el.style.transform = `translateY(${y}px)`;
        });
    } else if (effect === 'pulse') {
        const freq = s * 0.004;
        const scale = 1 + Math.sin(localTimeMs * freq) * amp * 0.15;
        elements.forEach((el) => {
            el.style.transform = `scale(${scale})`;
        });
    } else if (effect === 'jitter') {
        const maxShift = amp * 6;
        elements.forEach((el, i) => {
            const sx = seededRandom(localTimeMs * 1.3 + i * 31) - 0.5;
            const sy = seededRandom(localTimeMs * 1.7 + i * 53) - 0.5;
            el.style.transform = `translate(${sx * maxShift * 2}px, ${sy * maxShift * 2}px)`;
        });
    } else if (effect === 'glow-flicker') {
        const flicker = seededRandom(Math.floor(localTimeMs / 60) * 11) > 0.15 ? 1 : 0.2;
        elements.forEach((el) => {
            el.style.textShadow = `0 0 ${amp * 12 * flicker}px ${el.style.color || '#fff'}`;
        });
    } else if (effect === 'marquee') {
        const width = 300;
        const x = ((localTimeMs * s * 0.08) % (width * 2)) - width;
        elements.forEach((el) => {
            el.style.transform = `translateX(${x}px)`;
        });
    } else if (effect === 'pendulum') {
        const freq = s * 0.003;
        const angle = Math.sin(localTimeMs * freq) * amp * 20;
        elements.forEach((el) => {
            el.style.transform = `rotate(${angle}deg)`;
            el.style.transformOrigin = 'top center';
        });
    } else if (effect === 'color-cycle') {
        const hue = (localTimeMs * s * 0.05) % 360;
        elements.forEach((el, i) => {
            el.style.color = `hsl(${(hue + i * 15) % 360}, 100%, 65%)`;
        });
    } else if (effect === 'blink') {
        const isVisible = Math.floor(localTimeMs * s * 0.003) % 2 === 0;
        elements.forEach((el) => {
            el.style.opacity = isVisible ? '1' : '0.15';
        });
    } else if (effect === 'skew-wave') {
        const freq = s * 0.004;
        elements.forEach((el, i) => {
            const skew = Math.sin(localTimeMs * freq + i * 0.5) * amp * 15;
            el.style.transform = `skewX(${skew}deg)`;
        });
    } else if (effect === 'spin-loop') {
        const angle = (localTimeMs * s * 0.05) % 360;
        elements.forEach((el) => {
            el.style.transform = `rotate(${angle}deg)`;
        });
    }
}

function getEntranceAnimationProps(effect: string, inEase: any, inDur: number) {
    const props: any = { ease: inEase, duration: inDur };
    switch (effect) {
        case 'blur-in':
            return { ...props, opacity: [0, 1], y: [20, 0], filter: ['blur(10px)', 'blur(0px)'] };
        case 'slide-up':
            return { ...props, opacity: [0, 1], y: ['150%', '0%'] };
        case 'slide-down':
            return { ...props, opacity: [0, 1], y: ['-150%', '0%'] };
        case 'slide-left':
            return { ...props, opacity: [0, 1], x: ['150%', '0%'] };
        case 'slide-right':
            return { ...props, opacity: [0, 1], x: ['-150%', '0%'] };
        case 'scale-in':
            return { ...props, opacity: [0, 1], scale: [0.3, 1] };
        case 'tracking-in':
            return { ...props, opacity: [0, 1], letterSpacing: ['20px', 'inherit'] };
        case 'flip-x':
            return { ...props, opacity: [0, 1], rotateX: [90, 0] };
        case 'flip-y':
            return { ...props, opacity: [0, 1], rotateY: [90, 0] };
        case 'rotate-in':
            return { ...props, opacity: [0, 1], rotate: [180, 0] };
        case 'elastic-in':
            return { ...props, opacity: [0, 1], scale: [0.3, 1], y: [50, 0], ease: spring({ bounce: 0.7, duration: 800 }) };
        case 'glitch-in':
            return { ...props, opacity: [0, 0.5, 0.2, 1], x: [10, -10, 5, 0], duration: inDur };
        case 'fly-in':
            return { ...props, opacity: [0, 1], y: [-200, 0], scale: [3, 1] };
        case 'vortex-in':
            return { ...props, opacity: [0, 1], rotate: [360, 0], scale: [0, 1] };
        case 'slide-fade':
        default:
            return { ...props, opacity: [0, 1] };
    }
}

function getExitAnimationProps(effect: string, outEase: any, outDur: number) {
    const props: any = { ease: outEase, duration: outDur };
    switch (effect) {
        case 'blur-out':
            return { ...props, opacity: [1, 0], y: [0, -20], filter: ['blur(0px)', 'blur(10px)'] };
        case 'slide-up':
            return { ...props, opacity: [1, 0], y: ['0%', '-150%'] };
        case 'slide-down':
            return { ...props, opacity: [1, 0], y: ['0%', '150%'] };
        case 'slide-left':
            return { ...props, opacity: [1, 0], x: ['0%', '-150%'] };
        case 'slide-right':
            return { ...props, opacity: [1, 0], x: ['0%', '150%'] };
        case 'scale-out':
            return { ...props, opacity: [1, 0], scale: [1, 0.3] };
        case 'tracking-out':
            return { ...props, opacity: [1, 0], letterSpacing: ['inherit', '20px'] };
        case 'flip-x':
            return { ...props, opacity: [1, 0], rotateX: [0, 90] };
        case 'flip-y':
            return { ...props, opacity: [1, 0], rotateY: [0, 90] };
        case 'rotate-out':
            return { ...props, opacity: [1, 0], rotate: [0, 180] };
        case 'glitch-out':
            return { ...props, opacity: [1, 0.2, 0.6, 0], x: [0, 15, -15, 0], duration: outDur };
        case 'fly-out':
            return { ...props, opacity: [1, 0], y: [0, 200], scale: [1, 3] };
        case 'vortex-out':
            return { ...props, opacity: [1, 0], rotate: [0, 360], scale: [1, 0] };
        case 'slide-fade':
        default:
            return { ...props, opacity: [1, 0] };
    }
}

function getAnimParts(
    h2: HTMLElement,
    granularity: string,
    root: HTMLElement,
    effect: string
): { parts: HTMLElement[] | null; splitter: any } {
    if (granularity === 'line') {
        const lineEls = root.querySelectorAll('.line-wrap');
        return {
            parts: lineEls.length > 0 ? Array.from(lineEls) as HTMLElement[] : null,
            splitter: null
        };
    }

    const needsClip = false; // Disables clip wrapping to prevent character descenders/caps cutting off
    const splitKey = granularity === 'word' ? 'words' : 'chars';

    const splitOpts: any = {};
    if (splitKey === 'words') {
        splitOpts.words = needsClip ? { wrap: 'clip' } : true;
    } else {
        splitOpts.chars = needsClip ? { wrap: 'clip' } : true;
    }

    const splitter = splitText(h2, splitOpts);
    const parts = splitter[splitKey as 'chars' | 'words'];
    return {
        parts: (parts && parts.length > 0) ? Array.from(parts) as HTMLElement[] : null,
        splitter
    };
}

function computeStagger(n: number, inDur: number, granularity: string) {
    const perDur = Math.min(
        granularity === 'line' ? Math.max(200, inDur * 0.5)
        : granularity === 'char' ? Math.max(80, inDur * 0.3)
        : Math.max(150, inDur * 0.4),
        inDur
    );
    const sd = n > 1 ? Math.max(0, (inDur - perDur) / (n - 1)) : 0;
    return { perDur, sd };
}

interface RichToken {
    text: string;
    color?: string;
}

function parseRichText(text: string): RichToken[] {
    const tokens: RichToken[] = [];
    const regex = /<color=([^>]+)>(.*?)<\/color>/gs;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ text: text.slice(lastIndex, match.index) });
        }
        tokens.push({ text: match[2], color: match[1] });
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        tokens.push({ text: text.slice(lastIndex) });
    }
    return tokens;
}

const AnimatedTextComponent: React.FC<AnimatedTextProps> = ({ config, isPlaying, animationKey, selectedId, onSelectLayer, zIndex }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<any>(null);
    const kineticPartsRef = useRef<HTMLElement[]>([]);
    const kineticTypeRef = useRef<string | null>(null);
    const kineticLineIndicesRef = useRef<number[]>([]);
    const configRef = useRef(config);
    configRef.current = config;

    const styles = useMemo(() => {
        // Drop Shadow offset calculation
        const shadowAngleRad = ((config.shadowAngle || 0) * Math.PI) / 180;
        const shadowX = Math.cos(shadowAngleRad) * (config.shadowDistance || 0);
        const shadowY = Math.sin(shadowAngleRad) * (config.shadowDistance || 0);
        const dropShadowCSS = config.shadowColor ? `${shadowX}px ${shadowY}px ${config.shadowBlur || 0}px ${config.shadowColor}` : '';

        // Inner Shadow offset calculation (simulated via multiple compatible text-shadows)
        const innerAngleRad = ((config.innerShadowAngle || 0) * Math.PI) / 180;
        const innerX = Math.cos(innerAngleRad) * (config.innerShadowDistance || 0);
        const innerY = Math.sin(innerAngleRad) * (config.innerShadowDistance || 0);
        const innerShadowCSS = config.innerShadowColor 
            ? `-${innerX}px -${innerY}px ${config.innerShadowBlur || 0}px ${config.innerShadowColor}, ${innerX}px ${innerY}px 0.5px rgba(255,255,255,0.15)` 
            : '';

        const textShadow = [dropShadowCSS, innerShadowCSS].filter(Boolean).join(', ') || undefined;

        // Stroke (Outline)
        const textStroke = config.strokeWidth && config.strokeColor 
            ? `${config.strokeWidth}px ${config.strokeColor}` 
            : undefined;

        return {
            fontFamily: config.fontFamily,
            fontSize: `${config.fontSize}px`,
            fontWeight: config.fontWeight,
            letterSpacing: `${config.letterSpacing}px`,
            textAlign: config.textAlign as any,
            color: config.color,
            lineHeight: config.lineHeight,
            whiteSpace: 'pre-wrap' as const,
            textShadow,
            WebkitTextStroke: textStroke,
        };
    }, [
        config.fontFamily, config.fontSize, config.fontWeight, config.letterSpacing, config.textAlign, config.color, config.lineHeight,
        config.shadowColor, config.shadowBlur, config.shadowAngle, config.shadowDistance,
        config.innerShadowColor, config.innerShadowBlur, config.innerShadowAngle, config.innerShadowDistance,
        config.strokeColor, config.strokeWidth
    ]);

    // Build animation
    useEffect(() => {
        if (!rootRef.current) return;

        const content = config.content || '';
        const speedMul = 1 / (config.speed || 1);
        const inEase = config.easing === 'linear' ? 'linear' : spring({ bounce: 0.5, duration: 628 });
        const outEase = config.easing === 'linear' ? 'linear' : spring({ bounce: 0, duration: 400 });
        const granularity = config.granularity || 'word';
        const isKinetic = config.loopEffect && config.loopEffect !== 'none';
        const isStackLayout = config.effect === 'sequential-stack';

        // Reset
        kineticPartsRef.current = [];
        kineticTypeRef.current = null;
        kineticLineIndicesRef.current = [];
        timelineRef.current = null;

        // === HTML Generation ===
        if (isStackLayout) {
            let segments: string[];
            if (granularity === 'char') {
                segments = content.split('').filter(c => c.trim().length > 0);
            } else if (granularity === 'line') {
                segments = content.split(String.fromCharCode(10)).filter(l => l.trim().length > 0);
                if (segments.length < 2) segments = content.split(' ').filter(w => w.length > 0);
            } else {
                segments = content.split(' ').filter(w => w.length > 0);
            }
            rootRef.current.innerHTML = '<' + 'div class="stack-container">' + segments.map(s => '<' + 'h2 class="stack-item">' + s + '<' + '/h2>').join('') + '<' + '/div>';
        } else {
            let html = '';
            if (granularity === 'line') {
                const lines = content.split('\n');
                html = lines.map(line => {
                    const tokens = parseRichText(line);
                    const innerHTML = tokens.map(token => {
                        const colorStyle = token.color ? `style="color: ${token.color};"` : '';
                        return `<span ${colorStyle}>${token.text}</span>`;
                    }).join('');
                    const inner = innerHTML || '&nbsp;';
                    return `<span class="anim-wrapper" style="display: block;"><span class="kinetic-target" style="display: block;">${inner}</span></span>`;
                }).join('');
            } else if (granularity === 'word') {
                const lines = content.split('\n');
                html = lines.map(line => {
                    const tokens = parseRichText(line);
                    const words: { text: string; color?: string }[][] = [[]];
                    tokens.forEach(token => {
                        const parts = token.text.split(' ');
                        parts.forEach((part, idx) => {
                            if (idx > 0) {
                                words.push([]);
                            }
                            if (part) {
                                words[words.length - 1].push({ text: part, color: token.color });
                            }
                        });
                    });
                    
                    return words.map(wordParts => {
                        if (wordParts.length === 0) return '';
                        const innerHTML = wordParts.map(part => {
                            const colorStyle = part.color ? `style="color: ${part.color};"` : '';
                            return `<span ${colorStyle}>${part.text}</span>`;
                        }).join('');
                        
                        return `<span class="anim-wrapper" style="display: inline-block; white-space: pre;"><span class="kinetic-target" style="display: inline-block;">${innerHTML}</span></span>`;
                    }).join('<span style="display: inline-block; white-space: pre;"> </span>');
                }).join('<br/>');
            } else if (granularity === 'char') { // 'char'
                const lines = content.split('\n');
                html = lines.map(line => {
                    const tokens = parseRichText(line);
                    return tokens.map(token => {
                        const chars = token.text.split('');
                        return chars.map(char => {
                            if (char === ' ') {
                                return `<span style="display: inline-block; white-space: pre;"> </span>`;
                            }
                            const colorStyle = token.color ? `style="color: ${token.color};"` : '';
                            return `<span class="anim-wrapper" style="display: inline-block;"><span class="kinetic-target" style="display: inline-block; ${colorStyle}">${char}</span></span>`;
                        }).join('');
                    }).join('');
                }).join('<br/>');
            } else { // 'all'
                const tokens = parseRichText(content);
                const innerHTML = tokens.map(token => {
                    const colorStyle = token.color ? `style="color: ${token.color};"` : '';
                    return `<span ${colorStyle}>${token.text.replace(/\n/g, '<br/>')}</span>`;
                }).join('');
                const inner = innerHTML || '&nbsp;';
                html = `<span class="anim-wrapper" style="display: inline-block; text-align: inherit;"><span class="kinetic-target" style="display: inline-block; text-align: inherit;">${inner}</span></span>`;
            }
            rootRef.current.innerHTML = '<h2>' + html + '</h2>';
        }

        const h2 = rootRef.current.querySelector('h2')!;
        const applyStyles = (el: HTMLElement) => {
            el.style.margin = '0'; el.style.padding = '0';
            el.style.fontSize = 'inherit'; el.style.fontWeight = 'inherit';
            el.style.fontFamily = 'inherit'; el.style.color = 'inherit';
            el.style.textAlign = 'inherit'; el.style.letterSpacing = 'inherit';
            el.style.lineHeight = config.lineHeight.toString();
            el.style.whiteSpace = 'pre-wrap';
        };
        if (isStackLayout) {
            rootRef.current.querySelectorAll('.stack-item').forEach(el => applyStyles(el as HTMLElement));
        } else if (h2) {
            applyStyles(h2);
        }

        // Determine transition parts
        let parts: HTMLElement[] = [];
        if (isStackLayout) {
            parts = Array.from(rootRef.current.querySelectorAll('.stack-item')) as HTMLElement[];
        } else {
            parts = Array.from(rootRef.current.querySelectorAll('.anim-wrapper')) as HTMLElement[];
        }

        // === Kinetic loops: store refs, no timeline ===
        if (isKinetic) {
            kineticTypeRef.current = config.loopEffect;
            kineticPartsRef.current = Array.from(rootRef.current.querySelectorAll('.kinetic-target')) as HTMLElement[];

            if (config.loopEffect === 'wave' && kineticPartsRef.current.length > 0) {
                const indices: number[] = [];
                let currentTop = -Infinity;
                let lineIdx = 0;
                kineticPartsRef.current.forEach(el => {
                    const top = el.offsetTop;
                    if (Math.abs(top - currentTop) > 2) {
                        currentTop = top;
                        lineIdx = 0;
                    }
                    indices.push(lineIdx);
                    lineIdx++;
                });
                kineticLineIndicesRef.current = indices;
            } else {
                kineticLineIndicesRef.current = [];
            }
        }

        if (config.effect === 'none' && (!config.outEffect || config.outEffect === 'none')) {
            // Instantly visible if no transitions are active
            const tl = createTimeline({ autoplay: false });
            tl.add(parts, { opacity: [1, 1], duration: 1 }, config.delay);
            timelineRef.current = tl;
            tl.seek(timeController.getTime() * 1000);
            return;
        }

        // === Timeline-based effects (Transitions) ===
        const tl = createTimeline({ autoplay: false });
        const inDur = config.inDuration * speedMul;
        const outDur = config.outDuration * speedMul;
        const inStart = config.delay;
        const outStart = config.delay + config.duration - outDur;

        if (config.effect === 'sequential-stack') {
            const items = rootRef.current.querySelectorAll('.stack-item');
            const effectiveDuration = config.duration / (config.speed || 1);
            const step = effectiveDuration / Math.max(items.length, 1);
            const transition = config.stackTransition || 'blur';

            if (transition === 'blur') {
                tl.add(items, { opacity: [0, 1], scale: [0.8, 1], filter: ['blur(10px)', 'blur(0px)'], duration: Math.min(300, step * 0.4), ease: inEase, delay: stagger(step, { start: config.delay }) });
                items.forEach((item, i) => { if (i < items.length - 1) tl.add(item, { opacity: 0, scale: 1.2, filter: 'blur(5px)', duration: Math.min(200, step * 0.3), ease: outEase }, config.delay + (step * (i + 1)) - Math.min(100, step * 0.15)); });
            } else if (transition === 'cut') {
                tl.add(items, { opacity: [0, 1], duration: 1, ease: steps(1), delay: stagger(step, { start: config.delay }) });
                items.forEach((item, i) => { if (i < items.length - 1) tl.add(item, { opacity: 0, duration: 1, ease: steps(1) }, config.delay + (step * (i + 1))); });
            } else if (transition === 'fade') {
                tl.add(items, { opacity: [0, 1], duration: Math.min(250, step * 0.4), ease: inEase, delay: stagger(step, { start: config.delay }) });
                items.forEach((item, i) => { if (i < items.length - 1) tl.add(item, { opacity: 0, duration: Math.min(200, step * 0.3), ease: outEase }, config.delay + (step * (i + 1)) - Math.min(100, step * 0.15)); });
            }
        } else {
            if (parts && parts.length > 0) {
                const n = parts.length;
                const { perDur, sd } = computeStagger(n, inDur, granularity);

                // 1. Entrance Transition
                if (config.effect !== 'none') {
                    if (config.effect === 'typewriter') {
                        const stepDur = 1;
                        const staggerInt = n > 1 ? (inDur - stepDur) / (n - 1) : 0;
                        tl.add(parts, { opacity: [0, 1], ease: steps(1), duration: stepDur, delay: stagger(staggerInt, { from: config.inDirection || 'first' }) }, inStart);
                    } else {
                        const entryProps = getEntranceAnimationProps(config.effect, inEase, perDur);
                        tl.add(parts, { ...entryProps, delay: stagger(sd, { from: config.inDirection || 'first' }) }, inStart);
                    }
                } else {
                    // Instantly visible
                    tl.add(parts, { opacity: [1, 1], duration: 1 }, inStart);
                }
 
                // 2. Exit Transition
                if (config.outEffect && config.outEffect !== 'none' && outDur > 0) {
                    const { perDur: od, sd: osd } = computeStagger(n, outDur, granularity);
                    if (config.outEffect === 'typewriter') {
                        const stepDur = 1;
                        const outStagger = n > 1 ? (outDur - stepDur) / (n - 1) : 0;
                        tl.add(parts, { opacity: [1, 0], duration: stepDur, ease: steps(1), delay: stagger(outStagger, { from: config.outDirection || 'first' }) }, outStart);
                    } else {
                        const exitProps = getExitAnimationProps(config.outEffect, outEase, od);
                        tl.add(parts, { ...exitProps, delay: stagger(osd, { from: config.outDirection || 'first' }) }, outStart);
                    }
                }
            }
        }

        timelineRef.current = tl;
        tl.seek(timeController.getTime() * 1000);

        return () => {
            if (timelineRef.current) timelineRef.current.pause();
        };
    }, [config.content, config.effect, config.outEffect, config.loopEffect, config.granularity, config.easing, config.speed, config.stackTransition, config.inDuration, config.outDuration, config.delay, config.duration, config.intensity, config.lineHeight, config.fontSize, config.fontFamily, config.fontWeight, config.letterSpacing, config.color, config.textAlign, config.inDirection, config.outDirection, config.shadowColor, config.shadowBlur, config.shadowAngle, config.shadowDistance, config.innerShadowColor, config.innerShadowBlur, config.innerShadowAngle, config.innerShadowDistance, config.strokeColor, config.strokeWidth, animationKey]);

    // Time subscription
    useEffect(() => {
        const update = (time: number) => {
            const c = configRef.current;
            const timeMs = time * 1000;
            if (timelineRef.current) timelineRef.current.seek(timeMs);

            // Kinetic per-frame loop computation
            const kType = kineticTypeRef.current;
            if (kType && kineticPartsRef.current.length > 0) {
                const localTime = timeMs - c.delay;
                if (localTime >= 0 && localTime <= c.duration) {
                    applyKineticFrame(kType, kineticPartsRef.current, localTime, c.speed, c.intensity, kineticLineIndicesRef.current);
                }
            }

            if (containerRef.current) {
                const isVisible = timeMs >= c.delay && timeMs <= (c.delay + c.duration);
                containerRef.current.style.opacity = isVisible ? '1' : '0';
                containerRef.current.style.pointerEvents = isVisible ? 'auto' : 'none';
            }
        };
        update(timeController.getTime());
        const unsubscribe = timeController.subscribe(update);
        return unsubscribe;
    }, [config.delay, config.duration]);

    return (
        <div
            ref={containerRef}
            onMouseDown={(e) => onSelectLayer(e, config.id)}
            className="absolute cursor-move active:cursor-grabbing p-2 transition-shadow"
            style={{
                left: `${config.position.x}%`,
                top: `${config.position.y}%`,
                transform: `translate(-${config.position.x}%, -${config.position.y}%)`,
                width: 'max-content',
                zIndex: zIndex,
                opacity: 0,
                pointerEvents: 'none'
            }}
        >
            <div ref={rootRef} style={styles} />
        </div>
    );
};

export const AnimatedText = memo(AnimatedTextComponent);
