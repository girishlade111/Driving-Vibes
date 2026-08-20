import React, { useState, useRef, useEffect } from 'react';
import {
  Settings, Sparkles, ImageIcon, AudioLines, AlignCenter, PanelBottom,
  Moon, BarChart2, Trash2, Palette, CloudRain, Sliders, Car, Film, SunMedium,
} from 'lucide-react';
import { PlayerPosition } from '../../App';
import { SleepTimerOption } from '../../hooks/useAudioPlayer';
import { ListeningStats } from '../../hooks/useListeningStats';
import { BACKGROUND_PRESETS, BackgroundPreset, TimeOfDayMode } from '../../types/backgroundPresets';

interface SettingsPanelProps {
  isAnimated: boolean;
  blur: number;
  showWave: boolean;
  playerPosition: PlayerPosition;
  showNowPlaying: boolean;
  onToggleAnimated: () => void;
  onBlurChange: (value: number) => void;
  onToggleWave: () => void;
  onPositionChange: (pos: PlayerPosition) => void;
  onToggleNowPlaying: () => void;
  // Background presets
  currentBgPreset: BackgroundPreset;
  timeOfDayMode: TimeOfDayMode;
  customBgUrl: string;
  onSelectBgPreset: (preset: BackgroundPreset) => void;
  onSelectTimeOfDay: (mode: TimeOfDayMode) => void;
  onSetCustomBgUrl: (url: string) => void;
  // Sleep timer
  sleepTimer: SleepTimerOption;
  sleepRemaining: number;
  onSetSleepTimer: (minutes: SleepTimerOption) => void;
  // Stats
  stats: ListeningStats;
  mostPlayed: { name: string; count: number } | null;
  formatTime: (seconds: number) => string;
  onResetStats: () => void;
  // Accent color
  accentColor: string;
  onAccentChange: (color: string) => void;
  // Modal triggers
  onOpenAmbientMixer?: () => void;
  onOpenAudioFx?: () => void;
  onOpenCarMode?: () => void;
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

/** Two-option segmented control */
const SegmentedControl: React.FC<{
  value: PlayerPosition;
  onChange: (v: PlayerPosition) => void;
}> = ({ value, onChange }) => {
  const options: { key: PlayerPosition; icon: React.ReactNode; label: string }[] = [
    { key: 'center', icon: <AlignCenter className="w-3.5 h-3.5" />, label: 'Center' },
    { key: 'bottom', icon: <PanelBottom className="w-3.5 h-3.5" />, label: 'Bottom' },
  ];

  return (
    <div role="radiogroup" aria-label="Player position" className="flex gap-1.5 w-full">
      {options.map(({ key, icon, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            aria-label={`Player position: ${label}`}
            onClick={() => onChange(key)}
            className={[
              'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              active
                ? 'bg-white/18 border-white/25 text-white shadow-inner'
                : 'bg-white/5 border-white/8 text-white/45 hover:bg-white/10 hover:text-white/70 hover:border-white/15',
            ].join(' ')}
          >
            {icon}
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ── Accent color presets ──────────────────────────────────────────────────
const ACCENT_PRESETS: { label: string; h: number; s: string; l: string; preview: string }[] = [
  { label: 'White',   h: 0,   s: '0%',   l: '100%', preview: '#ffffff' },
  { label: 'Amber',   h: 38,  s: '95%',  l: '68%',  preview: '#f9c63a' },
  { label: 'Cyan',    h: 187, s: '85%',  l: '62%',  preview: '#35d4e8' },
  { label: 'Rose',    h: 348, s: '90%',  l: '65%',  preview: '#f96f88' },
  { label: 'Violet',  h: 262, s: '80%',  l: '68%',  preview: '#b87cf9' },
];

const TIME_OF_DAY_OPTIONS: { id: TimeOfDayMode; label: string }[] = [
  { id: 'auto', label: 'Auto (Live)' },
  { id: 'day', label: 'Day' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'night', label: 'Night' },
  { id: 'cyberpunk', label: 'Neon' },
  { id: 'off', label: 'Off' },
];

function formatSleepRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isAnimated,
  blur,
  showWave,
  playerPosition,
  showNowPlaying,
  onToggleAnimated,
  onBlurChange,
  onToggleWave,
  onPositionChange,
  onToggleNowPlaying,
  currentBgPreset,
  timeOfDayMode,
  customBgUrl,
  onSelectBgPreset,
  onSelectTimeOfDay,
  onSetCustomBgUrl,
  sleepTimer,
  sleepRemaining,
  onSetSleepTimer,
  stats,
  mostPlayed,
  formatTime,
  onResetStats,
  accentColor,
  onAccentChange,
  onOpenAmbientMixer,
  onOpenAudioFx,
  onOpenCarMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState(customBgUrl);
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

  const sleepOptions: SleepTimerOption[] = [0, 15, 30, 45, 60];

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
          className="fixed top-[60px] right-4 w-72 glass-panel rounded-3xl shadow-2xl overflow-hidden animate-fadeIn overflow-y-auto custom-scrollbar border border-white/15"
          style={{ zIndex: 34, maxHeight: 'calc(100dvh - 80px)' }}
        >
          <div className="px-4 py-4 space-y-4 text-white">

            {/* ── Quick Feature Shortcuts ── */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40 mb-2">
                Quick Features
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {onOpenAmbientMixer && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenAmbientMixer();
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/8 hover:border-sky-400/30 text-white/70 hover:text-sky-300 transition-all text-center"
                  >
                    <CloudRain className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-medium">Ambient</span>
                  </button>
                )}

                {onOpenAudioFx && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenAudioFx();
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/8 hover:border-amber-400/30 text-white/70 hover:text-amber-300 transition-all text-center"
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-medium">Equalizer</span>
                  </button>
                )}

                {onOpenCarMode && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenCarMode();
                    }}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/8 hover:border-emerald-400/30 text-white/70 hover:text-emerald-300 transition-all text-center"
                  >
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-medium">Car Mode</span>
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-white/8" />

            {/* ── Background Presets (Video & Images) ── */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Film className="w-3.5 h-3.5 text-white/40" />
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40">
                  Cinematic Backgrounds
                </p>
              </div>

              <div className="space-y-1.5">
                {BACKGROUND_PRESETS.map((preset) => {
                  const active = currentBgPreset.id === preset.id && !customBgUrl;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onSetCustomBgUrl('');
                        onSelectBgPreset(preset);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-white/15 border-white/30 text-white font-medium shadow-sm'
                          : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{preset.thumbnail}</span>
                        <span className="text-xs truncate">{preset.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 shrink-0">
                        {preset.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom URL Input */}
              <div className="mt-2.5 pt-2 border-t border-white/5">
                <div className="text-[10px] text-white/40 mb-1">Custom Video / Image URL:</div>
                <div className="flex gap-1">
                  <input
                    type="url"
                    placeholder="https://...mp4 or image"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder-white/25 focus:border-white/30"
                  />
                  <button
                    onClick={() => onSetCustomBgUrl(customInputUrl)}
                    className="px-2 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[10px] font-medium"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/8" />

            {/* ── Time-of-Day / Weather Tint ── */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <SunMedium className="w-3.5 h-3.5 text-white/40" />
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/40">
                  Time-of-Day Lighting
                </p>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {TIME_OF_DAY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onSelectTimeOfDay(opt.id)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-medium border transition-all text-center ${
                      timeOfDayMode === opt.id
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/5 border-white/5 text-white/45 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

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

            <div className="h-px bg-white/8" />

            {/* ── Now Playing Overlay ── */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35 mb-2.5">
                Overlays
              </p>
              <ToggleRow
                icon={<Sparkles className="w-3.5 h-3.5 text-white/45" />}
                label="Now Playing"
                active={showNowPlaying}
                ariaLabel={showNowPlaying ? 'Hide now playing overlay' : 'Show now playing overlay'}
                onClick={onToggleNowPlaying}
              />
            </div>

            <div className="h-px bg-white/8" />

            {/* ── Player Position ── */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35 mb-2.5">
                Player Position
              </p>
              <SegmentedControl value={playerPosition} onChange={onPositionChange} />
            </div>

            <div className="h-px bg-white/8" />

            {/* ── Theme Accent Color ── */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Palette className="w-3 h-3 text-white/35" />
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35">
                  Accent Color
                </p>
              </div>
              <div className="flex gap-2">
                {ACCENT_PRESETS.map((preset) => {
                  const active = accentColor === preset.label;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => onAccentChange(preset.label)}
                      aria-label={`Accent color: ${preset.label}`}
                      aria-pressed={active}
                      title={preset.label}
                      className={`w-7 h-7 rounded-full transition-all duration-200 ${
                        active
                          ? 'ring-2 ring-offset-1 ring-offset-transparent scale-110'
                          : 'opacity-60 hover:opacity-90 hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: preset.preview,
                        boxShadow: active
                          ? `0 0 0 2px rgba(0,0,0,0.6), 0 0 0 4px ${preset.preview}`
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-white/8" />

            {/* ── Sleep Timer ── */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3 h-3 text-white/35" />
                  <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35">
                    Sleep Timer
                  </p>
                </div>
                {sleepTimer > 0 && sleepRemaining > 0 && (
                  <span className="text-[10px] font-mono text-white/50 tabular-nums sleep-active">
                    {formatSleepRemaining(sleepRemaining)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sleepOptions.map((m) => (
                  <button
                    key={m}
                    onClick={() => onSetSleepTimer(m as SleepTimerOption)}
                    aria-pressed={sleepTimer === m}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                      sleepTimer === m
                        ? 'bg-white/20 text-white border border-white/25'
                        : 'bg-white/6 text-white/45 hover:bg-white/12 hover:text-white/70 border border-transparent'
                    }`}
                  >
                    {m === 0 ? 'Off' : `${m}m`}
                  </button>
                ))}
              </div>
              {sleepTimer > 0 && (
                <p className="mt-2 text-[10px] text-white/30">
                  Music stops in {formatSleepRemaining(sleepRemaining)}
                </p>
              )}
            </div>

            <div className="h-px bg-white/8" />

            {/* ── Listening Stats ── */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-3 h-3 text-white/35" />
                  <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/35">
                    Stats
                  </p>
                </div>
                <button
                  onClick={onResetStats}
                  aria-label="Reset listening stats"
                  title="Reset stats"
                  className="text-white/25 hover:text-white/50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/45">Total listened</span>
                  <span className="text-[11px] font-mono text-white/65 tabular-nums">
                    {formatTime(stats.totalSeconds)}
                  </span>
                </div>
                {mostPlayed && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-white/45 shrink-0">Most played</span>
                    <span className="text-[11px] text-white/65 text-right truncate max-w-[120px]">
                      {mostPlayed.name}
                      <span className="text-white/35 ml-1">×{mostPlayed.count}</span>
                    </span>
                  </div>
                )}
                {stats.totalSeconds === 0 && (
                  <p className="text-[10px] text-white/25 italic">No stats yet. Start listening!</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
