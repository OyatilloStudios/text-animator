import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center px-1">
    <span className="text-[11px] font-semibold text-[rgba(218,220,224,0.9)] uppercase tracking-wider">
      {children}
    </span>
  </div>
);

export const PillButton: React.FC<{
  icon?: React.ReactNode; children: React.ReactNode;
  variant?: 'filled' | 'outline' | 'solid' | 'danger'; onClick?: () => void;
  disabled?: boolean;
}> = ({ icon, children, variant = 'filled', onClick, disabled }) => {
  const base = 'flex items-center gap-1.5 justify-center w-full h-[36px] rounded-xl font-medium tracking-[0.1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const variants: Record<string, string> = {
    filled: 'bg-[#333] hover:bg-[#444] text-white text-[12px] px-3 py-1 select-none',
    outline: 'border border-[#444] hover:bg-white/5 hover:text-white text-[12px] font-medium text-[rgba(255,255,255,0.7)] px-3 py-1.5 select-none transition-colors',
    solid: 'bg-white hover:bg-gray-200 text-black text-[12px] font-semibold px-3 py-2 select-none shadow-md',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[12px] px-3 py-1',
  };
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled} type="button">
      {icon && <span className="flex items-center justify-center shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: (e: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => { 
      document.removeEventListener('mousedown', listener); 
      document.removeEventListener('touchstart', listener); 
    };
  }, [ref, handler]);
}

export const FieldDropdown: React.FC<{
  label: string; value: string; options: { value: string; label: string; style?: React.CSSProperties; previewText?: string; previewStyle?: React.CSSProperties }[];
  onChange: (val: string) => void; className?: string;
  alignUp?: boolean;
}> = ({ label, value, options, onChange, className = '', alignUp = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const selectedOpt = options.find(o => o.value === String(value));
  const selectedLabel = selectedOpt?.label || value;
  const selectedStyle = selectedOpt?.style;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border border-[#444] hover:border-[#666] transition-colors rounded-xl flex flex-col gap-0.5 justify-center pb-2 pl-3 pr-2 pt-[5px] select-none focus:outline-none bg-[#181818]">
        <p className="text-[10px] font-medium text-[rgba(255,255,255,0.4)] tracking-[0.1px]">{label}</p>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-white tracking-[0.1px] truncate flex-1 mr-1" style={selectedStyle}>{selectedLabel}</span>
          <ChevronDown size={16} className={`text-[rgba(218,220,224,0.5)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className={`absolute z-50 left-0 w-full bg-[#181818] border border-[#555] rounded-xl overflow-hidden shadow-2xl backdrop-blur-md ${alignUp ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]'}`}>
          <div className="max-h-[220px] overflow-y-auto">
            {options.map((opt) => (
              <button key={opt.value} type="button"
                className={`w-full text-left px-3 py-2 text-[12px] font-medium tracking-[0.1px] hover:bg-[#252525] active:bg-[#333] transition-colors flex items-center justify-between gap-2 border-b border-white/5 last:border-none ${String(value) === opt.value ? 'bg-[#2a2a2a] text-white font-semibold' : 'text-[rgba(218,220,224,0.85)]'}`}
                style={opt.style}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}>
                <span className="truncate flex-1">{opt.label}</span>
                {opt.previewText && (
                  <span style={opt.previewStyle} className="shrink-0 text-right opacity-90">{opt.previewText}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const RangeSlider: React.FC<{
  label: string; value: number; min: number; max: number;
  step?: number; formatValue?: (val: number) => string;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step = 1, formatValue = (v) => String(v), onChange }) => (
  <div className="flex flex-col gap-1.5 py-1 w-full">
    <div className="flex items-center justify-between px-1 select-none">
      <span className="text-[11px] font-medium text-[rgba(218,220,224,0.8)]">{label}</span>
      <span className="text-[11px] font-mono text-[#c7c9cd] bg-white/5 px-1.5 py-0.5 rounded">{formatValue(value)}</span>
    </div>
    <div className="px-1 w-full relative flex items-center h-6" onPointerDown={e => e.stopPropagation()}>
      <input type="range" min={min} max={max} step={step} value={value}
        className="w-full cursor-pointer bg-transparent accent-white"
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  </div>
);

export const SegmentedToggle: React.FC<{
  value: string; items: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (val: string) => void;
}> = ({ value, items, onChange }) => (
  <div className="flex w-full items-center border border-[#444] rounded-xl overflow-hidden bg-[#161616] p-0.5">
    {items.map((item) => (
      <button key={item.value} type="button" onClick={() => onChange(item.value)}
        className={`flex-1 flex items-center justify-center gap-1 h-[32px] px-2 rounded-lg text-[11px] font-medium tracking-[0.1px] transition-all cursor-pointer active:scale-95 ${
          value === item.value ? 'bg-white text-black font-semibold shadow' : 'text-[rgba(218,220,224,0.7)] hover:text-white'
        }`}>
        {item.icon}<span>{item.label}</span>
      </button>
    ))}
  </div>
);

export const IconToggleBar: React.FC<{
  value: string | number; items: { value: string | number; icon: React.ReactNode; title?: string }[];
  onChange: (val: any) => void;
  className?: string;
}> = ({ value, items, onChange, className = '' }) => (
  <div className={`flex w-full items-center border border-[#444] rounded-xl overflow-hidden bg-[#161616] p-0.5 ${className}`}>
    {items.map((item) => (
      <button key={item.value} type="button" onClick={() => onChange(item.value)} title={item.title}
        className={`flex-1 flex items-center justify-center h-[32px] rounded-lg transition-all cursor-pointer active:scale-95 ${
          value === item.value ? 'bg-white text-black shadow' : 'text-[rgba(218,220,224,0.5)] hover:text-white'
        }`}>
        {item.icon}
      </button>
    ))}
  </div>
);

export const TextInput: React.FC<{
  value: string; onChange: (val: string) => void; placeholder?: string; autoResize?: boolean; onFocus?: () => void;
}> = ({ value, onChange, placeholder, autoResize, onFocus }) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    const resize = () => {
        if (autoResize && ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = ref.current.scrollHeight + 'px';
        }
    };

    useLayoutEffect(() => {
        resize();
    }, [value, autoResize]);

    useEffect(() => {
        let raf1: number, raf2: number;
        raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => resize());
        });
        return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    }, [value, autoResize]);

    return (
      <textarea ref={ref} value={value} onFocus={onFocus} onChange={(e) => {
          onChange(e.target.value);
        }} 
        placeholder={placeholder}
        rows={1}
        className="border border-[#444] hover:border-[#666] focus:border-white rounded-xl w-full px-3 py-2 resize-none overflow-hidden bg-[#181818] text-[13px] font-medium text-white placeholder-[rgba(218,220,224,0.4)] tracking-[0.1px] focus:outline-none transition-colors" />
    );
};

export const AngleSlider: React.FC<{
  label: string; value: number; onChange: (val: number) => void;
}> = ({ label, value, onChange }) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handlePointer = (clientX: number, clientY: number) => {
    if (!circleRef.current) return;
    const rect = circleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (angle < 0) angle += 360;
    onChange(angle);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    handlePointer(e.clientX, e.clientY);
    circleRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    circleRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex items-center justify-between w-full px-1 py-1 select-none">
      <span className="text-[11px] font-medium text-[rgba(218,220,224,0.8)]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-[#c7c9cd] w-8 text-right bg-white/5 px-1 py-0.5 rounded">{value}°</span>
        <div
          ref={circleRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="w-8 h-8 rounded-full border border-[#555] bg-white/[0.05] hover:border-white transition-colors relative cursor-grab active:cursor-grabbing shrink-0"
        >
          <div
            className="absolute top-1/2 left-1/2 w-3.5 h-[1.5px] bg-white origin-left"
            style={{
              transform: `translate(0, -50%) rotate(${value}deg)`,
              transformOrigin: 'left center'
            }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-white -translate-x-1/2 -translate-y-1/2 shadow-md"
            style={{
              left: `calc(50% + ${Math.cos((value * Math.PI) / 180) * 11}px)`,
              top: `calc(50% + ${Math.sin((value * Math.PI) / 180) * 11}px)`
            }}
          />
          <div className="absolute w-[3px] h-[3px] rounded-full bg-white/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
};
