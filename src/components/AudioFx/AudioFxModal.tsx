import React, { useEffect, useRef } from 'react';
import {
  Sliders, Sparkles, X, RotateCcw, Activity, Gauge, Compass,
} from 'lucide-react';
import { EQ_PRESETS, EqPreset } from '../../hooks/useAudioEqualizer';

interface AudioFxModalProps {
  isOpen: boolean;
  onClose: () => void;
  bass: number;
  mid: number;
  treble: number;
  speed: number;
  presetId: string;
  isSpatial: boolean;
  onApplyPreset: (preset: EqPreset) => void;
  onSetBandGain: (band: 'bass' | 'mid' | 'treble', value: number) => void;
  onSetPlaybackSpeed: (speed: number) => void;
  onToggleSpatial: () => void;
  onReset: () => void;
}

const SPEED_OPTIONS = [0.75, 0.9, 1.0, 1.1, 1.25, 1.5];

export const AudioFxModal: React.FC<AudioFxModalProps> = ({
  isOpen,
  onClose,
  bass,
  mid,
  treble,
  speed,
  presetId,
  isSpatial,
  onApplyPreset,
  onSetBandGain,
  onSetPlaybackSpeed,
  onToggleSpatial,
  onReset,
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
        aria-label="Audio Equalizer and Sound FX"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Equalizer & Sound FX
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Web Audio HD
                </span>
              </h2>
              <p className="text-xs text-white/50">Custom sound curves, bass boost & tempo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              title="Reset EQ to Flat"
              aria-label="Reset EQ"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close Equalizer"
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

          {/* Presets Grid */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-2.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Audio Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EQ_PRESETS.map((preset) => {
                const active = presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onApplyPreset(preset)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                      active
                        ? 'bg-amber-500/20 border-amber-400/50 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/8 text-white/70 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{preset.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-medium truncate ${active ? 'text-amber-200' : 'text-white'}`}>
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">{preset.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Band Equalizer Sliders */}
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-white/60 mb-3 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                3-Band Parametric Equalizer
              </span>
              <span className="text-[11px] text-white/40 normal-case">-12dB to +12dB</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Bass Slider */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col items-center gap-3">
                <span className="text-xs font-medium text-white/80">Bass (100Hz)</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={bass}
                  onChange={(e) => onSetBandGain('bass', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  aria-label="Bass gain"
                />
                <span className={`text-xs font-mono font-semibold ${bass > 0 ? 'text-amber-300' : bass < 0 ? 'text-sky-300' : 'text-white/50'}`}>
                  {bass > 0 ? `+${bass}` : bass} dB
                </span>
              </div>

              {/* Mid Slider */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col items-center gap-3">
                <span className="text-xs font-medium text-white/80">Mids (1kHz)</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={mid}
                  onChange={(e) => onSetBandGain('mid', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  aria-label="Mid gain"
                />
                <span className={`text-xs font-mono font-semibold ${mid > 0 ? 'text-amber-300' : mid < 0 ? 'text-sky-300' : 'text-white/50'}`}>
                  {mid > 0 ? `+${mid}` : mid} dB
                </span>
              </div>

              {/* Treble Slider */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col items-center gap-3">
                <span className="text-xs font-medium text-white/80">Treble (4kHz)</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={treble}
                  onChange={(e) => onSetBandGain('treble', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  aria-label="Treble gain"
                />
                <span className={`text-xs font-mono font-semibold ${treble > 0 ? 'text-amber-300' : treble < 0 ? 'text-sky-300' : 'text-white/50'}`}>
                  {treble > 0 ? `+${treble}` : treble} dB
                </span>
              </div>
            </div>
          </div>

          {/* Playback Speed & Spatial Vibe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Speed */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white/80 mb-3">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Playback Speed</span>
                <span className="ml-auto text-xs font-mono text-amber-300 font-semibold">{speed}x</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetPlaybackSpeed(s)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      speed === s
                        ? 'bg-amber-500/25 border-amber-400/50 text-amber-200'
                        : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Spatial 8D Toggle */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>8D Spatial Panning</span>
                </div>
                <div className="text-[10px] text-white/40 mt-1">Simulates audio moving around head</div>
              </div>

              <button
                onClick={onToggleSpatial}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isSpatial
                    ? 'bg-purple-500/25 border-purple-400/40 text-purple-200 shadow-sm'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
              >
                {isSpatial ? 'Active' : 'Off'}
              </button>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
