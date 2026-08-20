import React, { useState, useEffect, useRef } from 'react';
import {
  Timer, Play, Pause, RotateCcw, Sparkles, X, FileText, Check, Copy, Volume2, Moon, Sun,
} from 'lucide-react';
import { usePomodoroTimer, PomodoroMode } from '../../hooks/usePomodoroTimer';
import { useBinauralFrequencies, FrequencyType } from '../../hooks/useBinauralFrequencies';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_NOTES_KEY = 'driving_vibes_scratchpad_notes';

function loadScratchpad(): string {
  try {
    return localStorage.getItem(STORAGE_NOTES_KEY) || '';
  } catch {
    return '';
  }
}

const FREQS: { id: FrequencyType; name: string; icon: string; desc: string }[] = [
  { id: '432hz', name: '432Hz Healing', icon: '✨', desc: 'Calms anxiety, natural vibration' },
  { id: '528hz', name: '528Hz Miracle', icon: '🌟', desc: 'Focus, clarity & creative flow' },
  { id: 'brown', name: 'Brown Noise', icon: '🌊', desc: 'Deep warm low rumble for deep work' },
  { id: 'green', name: 'Green Noise', icon: '🍃', desc: 'Mid-frequency gentle nature wash' },
];

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'timer' | 'binaural' | 'scratchpad'>('timer');
  const [notes, setNotes] = useState(loadScratchpad);
  const [copiedNotes, setCopiedNotes] = useState(false);

  const pomodoro = usePomodoroTimer();
  const binaural = useBinauralFrequencies();

  // Auto-save notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTES_KEY, notes);
    } catch {
      /* ignore */
    }
  }, [notes]);

  const handleCopyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2000);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn select-none">
      <div
        ref={modalRef}
        className="glass-panel w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Focus and Zen Productivity Suite"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-emerald-400">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Focus & Zen Suite
                {pomodoro.isRunning && (
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    {pomodoro.formattedTime}
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/50">Pomodoro highway drive, miracle tones & notes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/[0.02] px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('timer')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'timer'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            ⏱️ Focus Drive
          </button>
          <button
            onClick={() => setActiveTab('binaural')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'binaural'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            ✨ Miracle Tones (432Hz)
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'scratchpad'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            📝 Zen Scratchpad
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">

          {/* TAB 1: Pomodoro Timer */}
          {activeTab === 'timer' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-2">
              {/* Mode Switcher */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => pomodoro.switchMode('focus')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pomodoro.mode === 'focus'
                      ? 'bg-emerald-500/25 text-emerald-200 shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  🚀 25m Focus Drive
                </button>
                <button
                  onClick={() => pomodoro.switchMode('break')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pomodoro.mode === 'break'
                      ? 'bg-sky-500/25 text-sky-200 shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  ☕ 5m Pit Stop
                </button>
              </div>

              {/* Big Timer Clock */}
              <div className="text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {pomodoro.formattedTime}
              </div>

              <div className="text-xs text-white/45">
                Completed Sessions: <span className="font-mono text-emerald-300 font-bold">{pomodoro.completedSessions}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={pomodoro.toggleTimer}
                  className={`px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all shadow-xl active:scale-95 ${
                    pomodoro.isRunning
                      ? 'bg-amber-400 text-black hover:bg-amber-300'
                      : 'bg-emerald-400 text-black hover:bg-emerald-300'
                  }`}
                >
                  {pomodoro.isRunning ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                  <span>{pomodoro.isRunning ? 'Pause Drive' : 'Start Focus'}</span>
                </button>

                <button
                  onClick={pomodoro.resetTimer}
                  title="Reset Timer"
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Binaural Frequencies */}
          {activeTab === 'binaural' && (
            <div className="space-y-4">
              <div className="text-xs text-white/60">
                Layer harmonic frequencies over your music for meditation, healing & focus.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FREQS.map((f) => {
                  const active = binaural.activeType === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => binaural.selectFrequency(f.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-white shadow-lg'
                          : 'bg-white/[0.03] border-white/8 text-white/70 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg">{f.icon}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${active ? 'bg-emerald-400 text-black font-bold' : 'bg-white/10 text-white/50'}`}>
                          {active ? 'PLAYING' : 'OFF'}
                        </span>
                      </div>
                      <div className={`text-xs font-semibold ${active ? 'text-emerald-200' : 'text-white'}`}>
                        {f.name}
                      </div>
                      <div className="text-[11px] text-white/45 mt-0.5">{f.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Volume */}
              {binaural.activeType && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center gap-3 animate-fadeIn">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/70">Tone Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={binaural.volume}
                    onChange={(e) => binaural.setFrequencyVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <span className="text-xs font-mono text-white/50 w-8 text-right">
                    {Math.round(binaural.volume * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Scratchpad */}
          {activeTab === 'scratchpad' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Auto-saved to your browser</span>
                <button
                  onClick={handleCopyNotes}
                  className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                >
                  {copiedNotes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNotes ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your thoughts, coding ideas, or road trip notes here..."
                rows={8}
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-white/25 focus:border-emerald-400/50 outline-none resize-none custom-scrollbar leading-relaxed font-sans"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end">
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
