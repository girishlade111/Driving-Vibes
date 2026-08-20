import React, { useEffect, useRef } from 'react';
import {
  CloudRain, Zap, Flame, Wind, Moon, Disc, X, Volume2, VolumeX, Sparkles, Sliders,
} from 'lucide-react';
import {
  AmbientSoundType,
  AMBIENT_PRESETS,
  AmbientPreset,
} from '../../hooks/useAmbientMixer';

interface AmbientMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  masterVolume: number;
  volumes: Record<AmbientSoundType, number>;
  enabledSounds: Record<AmbientSoundType, boolean>;
  activeCount: number;
  onToggleMaster: () => void;
  onToggleSound: (type: AmbientSoundType) => void;
  onSetSoundVolume: (type: AmbientSoundType, vol: number) => void;
  onSetMasterVolume: (vol: number) => void;
  onApplyPreset: (preset: AmbientPreset) => void;
}

const SOUND_ICON_MAP: Record<AmbientSoundType, React.ReactNode> = {
  rain: <CloudRain className="w-5 h-5" />,
  thunder: <Zap className="w-5 h-5" />,
  campfire: <Flame className="w-5 h-5" />,
  wind: <Wind className="w-5 h-5" />,
  crickets: <Moon className="w-5 h-5" />,
  vinyl: <Disc className="w-5 h-5" />,
};

const SOUND_INFO: { id: AmbientSoundType; name: string; desc: string }[] = [
  { id: 'rain', name: 'Rain Shower', desc: 'Soothing rain on glass' },
  { id: 'thunder', name: 'Thunder', desc: 'Distant rolling thunder' },
  { id: 'campfire', name: 'Campfire', desc: 'Warm crackling wood fire' },
  { id: 'wind', name: 'Gentle Wind', desc: 'Calm night breeze' },
  { id: 'crickets', name: 'Night Crickets', desc: 'Summer forest ambiance' },
  { id: 'vinyl', name: 'Vinyl Crackle', desc: 'Analog lo-fi texture' },
];

export const AmbientMixerModal: React.FC<AmbientMixerModalProps> = ({
  isOpen,
  onClose,
  isEnabled,
  masterVolume,
  volumes,
  enabledSounds,
  activeCount,
  onToggleMaster,
  onToggleSound,
  onSetSoundVolume,
  onSetMasterVolume,
  onApplyPreset,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none">
      <div
        ref={modalRef}
        className="glass-panel w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Ambient Sound Mixer"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-sky-400">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Ambient Sound Mixer
                {activeCount > 0 && isEnabled && (
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {activeCount} active
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/50">Layer nature and ambient noise over your music</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Master Toggle */}
            <button
              onClick={onToggleMaster}
              aria-label="Toggle Ambient Master"
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                isEnabled
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 shadow-sm'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-sky-400 animate-pulse' : 'bg-white/20'}`} />
              {isEnabled ? 'Enabled' : 'Muted'}
            </button>

            <button
              onClick={onClose}
              aria-label="Close mixer"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

          {/* Presets Row */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-2.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Vibe Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMBIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/8 hover:border-white/20 text-left transition-all active:scale-[0.98] group"
                >
                  <span className="text-lg">{preset.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-white/90 truncate group-hover:text-white">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-white/40 truncate">{preset.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sound Channels Grid */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-white/60 mb-2.5 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Sound Channels
              </span>
              <span className="text-[11px] text-white/40 normal-case">Individual volume</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SOUND_INFO.map(({ id, name, desc }) => {
                const active = isEnabled && enabledSounds[id];
                const vol = volumes[id] ?? 0.5;

                return (
                  <div
                    key={id}
                    className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                      active
                        ? 'bg-white/[0.08] border-white/25 shadow-lg'
                        : 'bg-white/[0.02] border-white/8 opacity-75 hover:opacity-100 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => onToggleSound(id)}
                          aria-label={`Toggle ${name}`}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            active
                              ? 'bg-sky-500/25 border border-sky-400/40 text-sky-300 shadow-inner'
                              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/80'
                          }`}
                        >
                          {SOUND_ICON_MAP[id]}
                        </button>
                        <div>
                          <div className={`text-xs font-medium ${active ? 'text-white' : 'text-white/70'}`}>
                            {name}
                          </div>
                          <div className="text-[10px] text-white/40">{desc}</div>
                        </div>
                      </div>

                      {/* On/Off Switch */}
                      <button
                        onClick={() => onToggleSound(id)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                          active
                            ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
                            : 'bg-white/5 text-white/35 hover:text-white/60'
                        }`}
                      >
                        {active ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onToggleSound(id)}
                        className="text-white/30 hover:text-white/70 transition-colors"
                        aria-label="Toggle mute"
                      >
                        {vol === 0 || !active ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={vol}
                        onChange={(e) => onSetSoundVolume(id, parseFloat(e.target.value))}
                        disabled={!active && !isEnabled}
                        className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 disabled:opacity-40"
                        aria-label={`${name} volume`}
                      />
                      <span className="text-[10px] font-mono text-white/45 w-7 text-right">
                        {Math.round(vol * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Modal Footer: Master Volume ── */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-white/60 font-medium shrink-0">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>Master Ambient:</span>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => onSetMasterVolume(parseFloat(e.target.value))}
              disabled={!isEnabled}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300 disabled:opacity-40"
              aria-label="Master ambient volume"
            />
            <span className="text-xs font-mono text-white/60 w-8 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
