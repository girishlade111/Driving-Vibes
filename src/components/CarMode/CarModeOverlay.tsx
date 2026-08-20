import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic, MicOff,
  X, Shuffle, Repeat, Repeat1, Gauge, Clock, Navigation, Zap, Compass,
} from 'lucide-react';
import { Track } from '../../types/music';
import { RepeatMode } from '../../hooks/useAudioPlayer';

interface CarModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
  onSeek: (seconds: number) => void;
  // Voice Command Props
  isVoiceListening: boolean;
  isVoiceSupported: boolean;
  lastVoiceCommand: string | null;
  onToggleVoice: () => void;
}

export const CarModeOverlay: React.FC<CarModeOverlayProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  isShuffle,
  repeatMode,
  volume,
  isMuted,
  onTogglePlay,
  onPrevious,
  onNext,
  onToggleShuffle,
  onCycleRepeat,
  onSetVolume,
  onToggleMute,
  onSeek,
  isVoiceListening,
  isVoiceSupported,
  lastVoiceCommand,
  onToggleVoice,
}) => {
  // ── Clock & Trip Timer ──
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [tripSeconds, setTripSeconds] = useState(0);

  // ── Simulated Speedometer ──
  const [speed, setSpeed] = useState(68);
  const [unit, setUnit] = useState<'km/h' | 'mph'>('km/h');
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);

  // ── Touch / Swipe Gesture Tracking ──
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const gestureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update clock every second
  useEffect(() => {
    if (!isOpen) return;

    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Trip duration counter
  useEffect(() => {
    if (!isOpen) {
      setTripSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setTripSeconds((p) => p + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Subtle natural speed oscillation when driving / playing
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      if (isPlaying) {
        setSpeed((prev) => {
          const delta = (Math.random() - 0.48) * 3;
          const target = unit === 'km/h' ? 82 : 52;
          return Math.round(Math.max(target - 15, Math.min(target + 18, prev + delta)));
        });
      } else {
        setSpeed(0);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, unit]);

  // Format Trip Time
  const formatTripTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const showGestureToast = (msg: string) => {
    setGestureFeedback(msg);
    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = setTimeout(() => {
      setGestureFeedback(null);
    }, 1200);
  };

  // ── Handle Swipe Gestures ──
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    touchStartX.current = clientX;
    touchStartY.current = clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

    const diffX = clientX - touchStartX.current;
    const diffY = clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Minimum swipe threshold
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swipe Left -> Next
        showGestureToast('⏭ Next Track');
        onNext();
      } else {
        // Swipe Right -> Previous
        showGestureToast('⏮ Previous Track');
        onPrevious();
      }
    }
  };

  // Handle Double Tap for Play/Pause on touch background
  const handleSurfaceClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      showGestureToast(isPlaying ? '⏸ Paused' : '▶ Playing');
      onTogglePlay();
    }
    lastTapRef.current = now;
  };

  // Keyboard shortcut: Escape or C closes car mode
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'KeyC') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/85 backdrop-blur-2xl text-white select-none animate-fadeIn overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Car Driving Dashboard"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onClick={handleSurfaceClick}
    >
      {/* ── Top Bar: HUD Info & Exit Button ── */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.02]">
        {/* Digital Clock & Date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/90">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-xl font-bold font-mono tracking-wider">{timeStr}</span>
          </div>
          <span className="text-sm text-white/40 hidden sm:inline">•</span>
          <span className="text-sm text-white/60 hidden sm:inline">{dateStr}</span>
        </div>

        {/* Center: Trip Duration & Speed Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>Trip: {formatTripTime(tripSeconds)}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setUnit((p) => (p === 'km/h' ? 'mph' : 'km/h'));
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-amber-300 transition-colors"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span className="font-bold">{speed}</span>
            <span className="text-[10px] text-white/50">{unit}</span>
          </button>
        </div>

        {/* Right: Voice Mic & Exit Button */}
        <div className="flex items-center gap-3">
          {/* Voice Command Mic */}
          {isVoiceSupported && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVoice();
              }}
              aria-label="Toggle Voice Commands"
              title="Voice Commands (Say: 'Next', 'Pause', 'Play', 'Mute')"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border transition-all duration-300 ${
                isVoiceListening
                  ? 'bg-red-500/20 border-red-400/50 text-red-300 animate-pulse shadow-lg shadow-red-500/20'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:text-white'
              }`}
            >
              {isVoiceListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              <span className="text-xs font-medium hidden md:inline">
                {isVoiceListening ? 'Listening...' : 'Voice Mic'}
              </span>
            </button>
          )}

          {/* Exit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Exit Car Mode"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Gesture / Voice Feedback Toast ── */}
      {(gestureFeedback || lastVoiceCommand) && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-full glass-player border border-amber-400/30 text-amber-200 text-sm font-semibold flex items-center gap-2 shadow-2xl animate-fadeIn">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>{gestureFeedback || `Voice: ${lastVoiceCommand}`}</span>
        </div>
      )}

      {/* ── Center Area: Large Track Display & Speedometer HUD ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto w-full space-y-6">

        {/* Speedometer Glow Ring (Retro Futuristic HUD) */}
        <div className="relative flex flex-col items-center justify-center p-6">
          <div
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-700 ${
              isPlaying
                ? 'border-amber-400/50 shadow-[0_0_50px_rgba(251,191,36,0.25)] bg-amber-500/[0.04]'
                : 'border-white/10 bg-white/[0.01]'
            }`}
          >
            <Gauge className={`w-8 h-8 sm:w-10 sm:h-10 mb-1 transition-colors ${isPlaying ? 'text-amber-400' : 'text-white/30'}`} />
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
              {speed}
            </span>
            <span className="text-xs uppercase tracking-widest text-white/40">{unit}</span>
          </div>

          {isPlaying && (
            <div className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-mono text-amber-200 uppercase tracking-widest animate-pulse">
              Cruising Vibe
            </div>
          )}
        </div>

        {/* Track Title */}
        <div className="w-full max-w-2xl px-4">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md truncate">
            {currentTrack ? currentTrack.name : 'No track playing'}
          </h1>
          <p className="text-sm sm:text-base text-white/50 mt-2 font-medium">
            Swipe left/right to skip • Double tap to play/pause
          </p>
        </div>

        {/* Large Progress Bar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(ratio * duration);
          }}
          className="w-full max-w-xl h-3 bg-white/10 hover:h-4 rounded-full overflow-hidden cursor-pointer transition-all duration-200"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </main>

      {/* ── Bottom Controls: Extra-Large Tactile Buttons ── */}
      <footer className="px-6 py-6 border-t border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">

          {/* Left: Shuffle & Mute */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleShuffle();
              }}
              aria-label="Toggle Shuffle"
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                isShuffle
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shuffle className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              aria-label="Toggle Mute"
              className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-all"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>

          {/* Center: Previous / Giant Play-Pause / Next */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Previous Track */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              aria-label="Previous Track"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all shadow-lg"
            >
              <SkipBack className="w-7 h-7 sm:w-9 sm:h-9" />
            </button>

            {/* Giant Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={isLoading || !currentTrack}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center active:scale-90 transition-all duration-300 shadow-2xl ${
                isPlaying
                  ? 'bg-amber-400 text-black shadow-[0_0_40px_rgba(251,191,36,0.5)] hover:bg-amber-300'
                  : 'bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.3)]'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-10 h-10 sm:w-12 sm:h-12 fill-black" />
              ) : (
                <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-black translate-x-1" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="Next Track"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all shadow-lg"
            >
              <SkipForward className="w-7 h-7 sm:w-9 sm:h-9" />
            </button>
          </div>

          {/* Right: Repeat Mode */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCycleRepeat();
              }}
              aria-label={`Repeat: ${repeatMode}`}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                repeatMode !== 'off'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <RepeatIcon className="w-6 h-6" />
            </button>
          </div>

        </div>
      </footer>
    </div>
  );
};
