import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sparkles, ImageIcon, AudioLines } from 'lucide-react';

interface SettingsPanelProps {
  isAnimated: boolean;
  blur: number;
  showWave: boolean;
  onToggleAnimated: () => void;
  onBlurChange: (value: number) => void;
  onToggleWave: () => void;
}

/** Reusable inline toggle pill */
const ToggleRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  ariaLabel: string;
  onClick: () => void;
}> = ({ icon, label, active, ariaLabel, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between group"
    aria-label={ariaLabel}
    aria-pressed={active}
  >
    <span className="flex items-center gap-2 text-[13px] text-white/65 group-hover:text-white/85 transition-colors">
      {icon}
      {label}
    </span>
    {/* Toggle pill */}
    <div
      className={`relative w-9 h-5 rounded-full transition-all duration-300 ${
        active ? 'bg-white/30' : 'bg-white/10'
      }`}
      aria-hidden="true"
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
          active ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </div>
  </button>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isAnimated,
  blur,
  showWave,
  onToggleAnimated,
  onBlurChange,
  onToggleWave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape
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
      {/* ── Gear trigger button ──────────────────────────────────────────── */}
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
          isOpen ? 'text-white bg-white/15' : 'text-white/45 hover:text-white/75',
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

      {/* ── Settings panel ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="App settings"
          className="fixed top-[60px] right-4 w-56 glass-panel rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
          style={{ zIndex: 34 }}
        >
          <div className="px-4 py-4 space-y-4">

            {/* ── Background type ── */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35 mb-2.5">
                Background
              </p>
              <ToggleRow
                icon={
                  isAnimated
                    ? <Sparkles className="w-3.5 h-3.5 text-white/55" />
                    : <ImageIcon className="w-3.5 h-3.5 text-white/35" />
                }
                label={isAnimated ? 'Animated' : 'Static'}
                active={isAnimated}
                ariaLabel={isAnimated ? 'Switch to static background' : 'Switch to animated background'}
                onClick={onToggleAnimated}
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-white/8" />

            {/* ── Blur slider ── */}
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

            {/* Divider */}
            <div className="h-px bg-white/8" />

            {/* ── Music Wave ── */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35 mb-2.5">
                Visualizer
              </p>
              <ToggleRow
                icon={<AudioLines className="w-3.5 h-3.5 text-white/45" />}
                label="Music Wave"
                active={showWave}
                ariaLabel={showWave ? 'Hide music wave' : 'Show music wave'}
                onClick={onToggleWave}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
};
