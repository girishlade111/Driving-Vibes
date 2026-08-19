import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sparkles, ImageIcon } from 'lucide-react';

interface SettingsPanelProps {
  isAnimated: boolean;
  blur: number;
  onToggleAnimated: () => void;
  onBlurChange: (value: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isAnimated,
  blur,
  onToggleAnimated,
  onBlurChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Settings trigger button ── */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((p) => !p)}
        aria-label={isOpen ? 'Close settings' : 'Open settings'}
        aria-expanded={isOpen}
        title="Settings"
        className={[
          'fixed top-4 right-4',
          'w-9 h-9 rounded-full glass-player',
          'transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          isOpen
            ? 'text-white bg-white/15'
            : 'text-white/45 hover:text-white/75',
        ].join(' ')}
        style={{ zIndex: 35 }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Settings
            className="w-[15px] h-[15px] transition-transform duration-500"
            style={{ transform: isOpen ? 'rotate(60deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* ── Settings panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Background settings"
          className="fixed top-[60px] right-4 w-56 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
          style={{ zIndex: 34 }}
        >
          <div className="px-4 py-4 space-y-4">

            {/* ── Section: Background type ── */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35 mb-2.5">
                Background
              </p>

              {/* Toggle row */}
              <button
                onClick={onToggleAnimated}
                className="w-full flex items-center justify-between group"
                aria-label={isAnimated ? 'Switch to static background' : 'Switch to animated background'}
              >
                <span className="flex items-center gap-2 text-[13px] text-white/70 group-hover:text-white/90 transition-colors">
                  {isAnimated ? (
                    <Sparkles className="w-3.5 h-3.5 text-white/60" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-white/40" />
                  )}
                  {isAnimated ? 'Animated' : 'Static'}
                </span>

                {/* Toggle pill */}
                <div
                  className={`relative w-9 h-5 rounded-full transition-all duration-300 ${
                    isAnimated ? 'bg-white/30' : 'bg-white/10'
                  }`}
                  aria-hidden="true"
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                      isAnimated ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/8" />

            {/* ── Section: Blur ── */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35">
                  Blur
                </p>
                <span className="text-[11px] font-mono text-white/40 tabular-nums">
                  {blur}px
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={blur}
                onChange={(e) => onBlurChange(Number(e.target.value))}
                aria-label="Background blur intensity"
                className="blur-slider w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.6) ${blur * 5}%, rgba(255,255,255,0.12) ${blur * 5}%)`,
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-white/20">None</span>
                <span className="text-[9px] text-white/20">Max</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
