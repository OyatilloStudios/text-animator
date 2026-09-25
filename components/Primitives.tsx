import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center px-2">
    <span className="text-[11px] font-medium text-[rgba(218,220,224,0.9)] tracking-[0.1px]">
      {children}
    </span>
  </div>
);

export const PillButton: React.FC<{
  icon?: React.ReactNode; children: React.ReactNode;
  variant?: 'filled' | 'outline' | 'solid'; onClick?: () => void;
  disabled?: boolean;
}> = ({ icon, children, variant = 'filled', onClick, disabled }) => {
  const base = 'flex items-center gap-[2px] justify-center w-full h-[34px] rounded-xl font-medium tracking-[0.1px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    filled: 'bg-[#969696] hover:bg-[#a6a6a6] active:bg-[#868686] text-black text-[11px] pl-[8px] pr-[24px] py-1 select-none',
    outline: 'border border-[#595959] hover:bg-white/5 hover:text-white active:bg-white/10 backdrop-blur-[40px] text-[11px] font-medium text-[rgba(255,255,255,0.35)] pl-[8px] pr-[16px] py-1.5 select-none transition-colors',
    solid: 'bg-white hover:bg-gray-200 active:bg-gray-300 text-black text-[12px] pl-[8px] pr-[16px] py-2 select-none',
  };
  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick} disabled={disabled}>
      {icon && <span className="flex items-center justify-center w-6 h-6">{icon}</span>}
      <span>{children}</span>
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
    return () => { document.removeEventListener('mousedown', listener); document.removeEventListener('touchstart', listener); };
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
        className="w-full text-left border border-[#595959] hover:border-[#7a7a7a] transition-colors rounded-xl flex flex-col gap-0.5 justify-center pb-2 pl-2.5 pr-1 pt-[5px] select-none focus:outline-none">
        <p className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] tracking-[0.1px]">{label}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-white tracking-[0.1px] truncate flex-1 mr-1" style={selectedStyle || { fontFamily: 'Google Sans Flex' }}>{selectedLabel}</span>
          <ChevronDown size={16} className={`text-[rgba(218,220,224,0.5)] shrink-0 mr-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className={`absolute z-50 left-0 w-full bg-[#0e0e0e] border border-[#595959] rounded-xl overflow-hidden shadow-xl backdrop-blur-md animate-dropdown ${alignUp ? 'bottom-[calc(100%+4px)] origin-bottom' : 'top-[calc(100%+4px)] origin-top'}`}>
          <div className="max-h-[300px] overflow-y-auto dark-scrollbar">
            {options.map((opt) => (
              <button key={opt.value} type="button"
                className={`w-full text-left px-2.5 py-2 text-[11px] font-medium tracking-[0.1px] hover:bg-[#1a1a1a] transition-colors flex items-center justify-between gap-4 ${String(value) === opt.value ? 'bg-[#1a1a1a] text-white' : 'text-[rgba(218,220,224,0.9)]'}`}
                style={opt.style || { fontFamily: 'Google Sans Flex' }}
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
  <div className="flex flex-col gap-2 pt-2 pb-[5px] w-full">
    <div className="flex items-center justify-between px-2 select-none">
      <span className="text-[11px] font-medium text-[rgba(218,220,224,0.9)] tracking-[0.1px]">{label}</span>
      <span className="text-[11px] font-medium text-[#c7c9cd] tracking-[0.1px]">{formatValue(value)}</span>
    </div>
    <div className="px-2 w-full h-2 relative" onPointerDown={e => e.stopPropagation()}>
      <input type="range" min={min} max={max} step={step} value={value}
        className="absolute top-1/2 left-2 w-[calc(100%-16px)] -translate-y-1/2 h-6 cursor-pointer bg-transparent"
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  </div>
);

export const SegmentedToggle: React.FC<{
  value: string; items: { value: string; label: string; icon?: React.ReactNode }[];
  onChange: (val: string) => void;
}> = ({ value, items, onChange }) => (
  <div className="flex w-full items-center border border-[#595959] rounded-xl overflow-hidden bg-transparent">
    {items.map((item) => (
      <button key={item.value} type="button" onClick={() => onChange(item.value)}
        className={`flex-1 flex items-center justify-center gap-1 h-[34px] px-3 py-2 rounded-xl text-[12px] font-medium tracking-[0.1px] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer active:scale-95 ${
          value === item.value ? 'bg-[#969696] text-black' : 'text-[rgba(218,220,224,0.75)] hover:text-white hover:bg-white/5'
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
  <div className={`flex w-full items-center border border-[#595959] rounded-xl overflow-hidden bg-transparent ${className}`}>
    {items.map((item) => (
      <button key={item.value} type="button" onClick={() => onChange(item.value)} title={item.title}
        className={`flex-1 flex items-center justify-center h-[34px] rounded-xl transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer active:scale-95 ${
          value === item.value ? 'bg-[#969696] text-black' : 'text-[rgba(218,220,224,0.55)] hover:text-white hover:bg-white/5'
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

    // Run synchronously after DOM paint so the container is fully laid out
    useLayoutEffect(() => {
        resize();
    }, [value, autoResize]);

    // Also run after two animation frames as a fallback for deferred/flex layouts
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
        className="border border-[#595959] hover:border-[#7a7a7a] focus:border-[#969696] rounded-xl w-full px-3 py-2.5 resize-none overflow-hidden bg-transparent text-[11px] font-medium text-white placeholder-[rgba(218,220,224,0.75)] tracking-[0.1px] focus:outline-none transition-colors" />
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
    <div className="flex items-center justify-between w-full px-2 py-1 select-none">
      <span className="text-[11px] font-medium text-[rgba(218,220,224,0.9)] tracking-[0.1px]">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-[#c7c9cd] w-8 text-right">{value}°</span>
        <div
          ref={circleRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="w-8 h-8 rounded-full border border-[#595959] bg-white/[0.03] hover:border-white/40 active:border-white transition-colors relative cursor-grab active:cursor-grabbing shrink-0"
        >
          {/* Rotating Indicator Line */}
          <div
            className="absolute top-1/2 left-1/2 w-3.5 h-[1.5px] bg-white origin-left"
            style={{
              transform: `translate(0, -50%) rotate(${value}deg)`,
              transformOrigin: 'left center'
            }}
          />
          {/* Rotating Dot */}
          <div
            className="absolute w-1.5 h-1.5 rounded-full bg-white -translate-x-1/2 -translate-y-1/2 shadow-md"
            style={{
              left: `calc(50% + ${Math.cos((value * Math.PI) / 180) * 11}px)`,
              top: `calc(50% + ${Math.sin((value * Math.PI) / 180) * 11}px)`
            }}
          />
          {/* Center tiny dot */}
          <div className="absolute w-[3px] h-[3px] rounded-full bg-white/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    </div>
  );
};