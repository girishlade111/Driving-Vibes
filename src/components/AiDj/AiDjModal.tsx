import React, { useEffect, useRef } from 'react';
import {
  Radio, Sparkles, X, Volume2, Mic, Bell,
} from 'lucide-react';
import { DjSettings, DjPersona } from '../../hooks/useAiDjHost';

interface AiDjModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DjSettings;
  isSpeaking: boolean;
  onToggleMaster: () => void;
  onSetPersona: (persona: DjPersona) => void;
  onUpdateSetting: <K extends keyof DjSettings>(key: K, val: DjSettings[K]) => void;
  onTestSpeak: () => void;
}

const PERSONAS: { id: DjPersona; name: string; icon: string; desc: string }[] = [
  { id: 'latenight', name: 'Late Night Cruise Host', icon: '🌃', desc: 'Calm, deep-night cinematic radio announcer' },
  { id: 'chill', name: 'Chill Lo-Fi Companion', icon: '☕', desc: 'Relaxed, soothing voice for focus & study' },
  { id: 'retro', name: 'FM 80s Synthwave DJ', icon: '📻', desc: 'Vintage cassette / 80s highway radio vibe' },
];

export const AiDjModal: React.FC<AiDjModalProps> = ({
  isOpen,
  onClose,
  settings,
  isSpeaking,
  onToggleMaster,
  onSetPersona,
  onUpdateSetting,
  onTestSpeak,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn select-none">
      <div
        ref={modalRef}
        className="glass-panel w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="AI DJ Host Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-pink-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                AI DJ & Radio Host
                {isSpeaking && (
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">
                    On Air 🎙️
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/50">Cinematic voice introductions for your tracks</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMaster}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                settings.isEnabled
                  ? 'bg-pink-500/20 border-pink-400/40 text-pink-200'
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
              }`}
            >
              {settings.isEnabled ? 'Active' : 'Muted'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

          {/* Persona Selection */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-2.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              DJ Voice Style
            </div>
            <div className="space-y-2">
              {PERSONAS.map((p) => {
                const active = settings.persona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSetPersona(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-pink-500/15 border-pink-400/40 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/8 text-white/60 hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-medium ${active ? 'text-pink-200 font-semibold' : 'text-white'}`}>
                        {p.name}
                      </div>
                      <div className="text-[11px] text-white/40">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-white/80">
                <Mic className="w-3.5 h-3.5 text-pink-400" />
                Announce on Track Change
              </span>
              <input
                type="checkbox"
                checked={settings.announceOnTrackChange}
                onChange={(e) => onUpdateSetting('announceOnTrackChange', e.target.checked)}
                className="accent-pink-400 cursor-pointer w-4 h-4"
              />
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-white/80">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Radio Chime Effect
              </span>
              <input
                type="checkbox"
                checked={settings.chimeEnabled}
                onChange={(e) => onUpdateSetting('chimeEnabled', e.target.checked)}
                className="accent-pink-400 cursor-pointer w-4 h-4"
              />
            </div>
          </div>

          {/* Volume Slider */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-white/70 w-24">DJ Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => onUpdateSetting('volume', parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-pink-400"
            />
            <span className="text-xs font-mono text-white/50 w-8 text-right">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={onTestSpeak}
            className="px-4 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-400/30 text-xs font-medium transition-all"
          >
            🔊 Test Voice
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
