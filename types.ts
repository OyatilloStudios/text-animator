export interface MediaAsset {
    type: 'video' | 'image';
    dataUrl: string;
    mimeType?: string;
}

export type AnimationEffect =
    // Transitions (Entrance & Exit)
    | 'none'
    | 'blur-in' | 'blur-out'
    | 'typewriter'
    | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
    | 'slide-fade'
    | 'scale-in' | 'scale-out'
    | 'tracking-in' | 'tracking-out'
    | 'flip-x' | 'flip-y'
    | 'rotate-in' | 'rotate-out'
    | 'elastic-in'
    | 'glitch-in' | 'glitch-out'
    | 'fly-in' | 'fly-out'
    | 'vortex-in' | 'vortex-out'
    | 'sequential-stack'
    // Kinetic Loops
    | 'wave'
    | 'wiggle'
    | 'font-shuffle'
    | 'float'
    | 'pulse'
    | 'jitter'
    | 'glow-flicker'
    | 'marquee'
    | 'pendulum'
    | 'color-cycle'
    | 'blink'
    | 'skew-wave'
    | 'spin-loop';

export type AnimationGranularity = 'char' | 'word' | 'line' | 'all';
export type AnimationEasing = 'linear' | 'smooth';
export type StackTransition = 'blur' | 'cut' | 'fade';

export const TRANSITION_IN_EFFECTS = new Set<AnimationEffect>([
    'none', 'blur-in', 'typewriter', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
    'slide-fade', 'scale-in', 'tracking-in', 'flip-x', 'flip-y', 'rotate-in',
    'elastic-in', 'glitch-in', 'fly-in', 'vortex-in', 'sequential-stack'
]);

export const TRANSITION_OUT_EFFECTS = new Set<AnimationEffect>([
    'none', 'blur-out', 'typewriter', 'slide-up', 'slide-down', 'slide-left', 'slide-right',
    'slide-fade', 'scale-out', 'tracking-out', 'flip-x', 'flip-y', 'rotate-out',
    'glitch-out', 'fly-out', 'vortex-out'
]);

export const KINETIC_EFFECTS = new Set<AnimationEffect>([
    'wave', 'wiggle', 'font-shuffle', 'float', 'pulse', 'jitter', 
    'glow-flicker', 'marquee', 'pendulum', 'color-cycle', 'blink', 'skew-wave', 'spin-loop'
]);

export const TRANSITION_EFFECTS = new Set<AnimationEffect>([
    ...TRANSITION_IN_EFFECTS,
    ...TRANSITION_OUT_EFFECTS
]);

export const EFFECTS_WITH_SPEED = new Set<AnimationEffect>([
    'sequential-stack', 'wave', 'wiggle', 'font-shuffle', 'float', 'pulse', 'jitter', 
    'glow-flicker', 'marquee', 'pendulum', 'color-cycle', 'blink', 'skew-wave', 'spin-loop'
]);
export const EFFECTS_WITH_AMPLITUDE = new Set<AnimationEffect>([
    'wave', 'wiggle', 'float', 'pulse', 'jitter', 'glow-flicker', 'pendulum', 'skew-wave'
]);
export const EFFECTS_WITH_EASING = new Set<AnimationEffect>([
    'blur-in', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'slide-fade', 
    'scale-in', 'tracking-in', 'flip-x', 'flip-y', 'rotate-in', 'elastic-in', 
    'fly-in', 'vortex-in', 'sequential-stack'
]);

export interface TextConfig {
    id: string;
    content: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    lineHeight: number;
    textAlign: 'left' | 'center' | 'right';
    color: string;
    backgroundColor: string;
    bgOpacity: number;
    position: { x: number; y: number };
    effect: AnimationEffect; // Entrance transition
    outEffect: AnimationEffect; // Exit transition
    loopEffect: AnimationEffect; // Kinetic loop effect
    granularity: AnimationGranularity;
    easing: AnimationEasing;
    speed: number; // 0.25 – 4, multiplier on animation speed (1 = default)
    stackTransition: StackTransition; // How sequential-stack items transition
    duration: number; // Total Lifespan on timeline (ms)
    delay: number;    // Start Time on timeline (ms)
    inDuration: number;  // Entrance Animation length (ms)
    outDuration: number; // Exit Animation length (ms)
    intensity: number;   // 0-200, kinetic effect strength (wave/wiggle amplitude)
    
    // Transitions direction
    inDirection?: 'first' | 'last' | 'center' | 'random';
    outDirection?: 'first' | 'last' | 'center' | 'random';
    
    // Drop Shadow
    shadowColor?: string;
    shadowBlur?: number;
    shadowAngle?: number;
    shadowDistance?: number;
    
    // Inner Shadow
    innerShadowColor?: string;
    innerShadowBlur?: number;
    innerShadowAngle?: number;
    innerShadowDistance?: number;
    
    // Stroke (Outline)
    strokeColor?: string;
    strokeWidth?: number;
}

export const DONATION_URL = 'https://oyatillo-donat.netlify.app/';

export const FONTS = [
    { name: 'Instrument Sans', family: "'Instrument Sans', sans-serif", google: 'Instrument+Sans:wght@400;500;600;700', weights: [400, 500, 600, 700] },
    { name: 'Google Sans', family: "'Google Sans', sans-serif", google: 'Google+Sans:wght@400;500;700', weights: [400, 500, 700] },
    { name: 'Stack Sans', family: "'Stack Sans Notch', sans-serif", google: 'Stack+Sans+Notch:wght@200;300;400;500;600;700', weights: [200, 300, 400, 500, 600, 700] },
    { name: 'Instrument Serif', family: "'Instrument Serif', serif", google: 'Instrument+Serif:ital@0;1', weights: [400] },
    { name: 'Baskervville', family: "'Baskervville', serif", google: 'Baskervville:wght@400;500;600;700', weights: [400, 500, 600, 700] },
    { name: 'Space Mono', family: "'Space Mono', monospace", google: 'Space+Mono:ital,wght@0,400;0,700;1,400;1,700', weights: [400, 700] },
    { name: 'Michroma', family: "'Michroma', sans-serif", google: 'Michroma', weights: [400] },
    { name: 'Sofia Sans', family: "'Sofia Sans', sans-serif", google: 'Sofia+Sans:wght@400;500;600;700', weights: [400, 500, 600, 700] },
    { name: 'Faculty Glyphic', family: "'Faculty Glyphic', sans-serif", google: 'Faculty+Glyphic', weights: [400] },
    { name: 'Tasa Orbiter', family: "'Tasa Orbiter', sans-serif", google: 'Tasa+Orbiter:wght@400;700', weights: [400, 700] },
    { name: 'Ballet', family: "'Ballet', cursive", google: 'Ballet', weights: [400] },
    { name: 'Danfo', family: "'Danfo', serif", google: 'Danfo', weights: [400] },
    { name: 'Pirata One', family: "'Pirata One', system-ui", google: 'Pirata+One', weights: [400] },
    { name: 'Astloch', family: "'Astloch', display", google: 'Astloch:wght@400;700', weights: [400, 700] },
    { name: 'Bitcount Grid', family: "'Bitcount Grid Double', monospace", google: 'Bitcount+Grid+Double', weights: [400] },
];

/** Derived Google Fonts URL — add a font to FONTS and it auto-loads */
export const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?${FONTS.map(f => `family=${f.google}`).join('&')}&display=swap`;

export const POSITION_PRESETS = [
    { name: 'Top Left', x: 10, y: 10, icon: 'ArrowUpLeft' },
    { name: 'Top Center', x: 50, y: 10, icon: 'ArrowUp' },
    { name: 'Top Right', x: 90, y: 10, icon: 'ArrowUpRight' },
    { name: 'Center Left', x: 10, y: 50, icon: 'ArrowLeft' },
    { name: 'Center', x: 50, y: 50, icon: 'Crosshair' },
    { name: 'Center Right', x: 90, y: 50, icon: 'ArrowRight' },
    { name: 'Bottom Left', x: 10, y: 90, icon: 'ArrowDownLeft' },
    { name: 'Bottom Center', x: 50, y: 90, icon: 'ArrowDown' },
    { name: 'Bottom Right', x: 90, y: 90, icon: 'ArrowDownRight' },
];

export type ExportAspectRatio = '16:9' | '9:16' | '1:1';
export type ExportQuality = 'HD' | 'FullHD' | 'UHD';