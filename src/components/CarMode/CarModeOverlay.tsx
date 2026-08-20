import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  Shuffle,
  Repeat,
  Repeat1,
  Clock,
  Zap,
  Maximize,
  Minimize,
  FlipHorizontal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CarModeOverlayProps, HUD_THEMES, HudThemeId } from './carModeTypes';
import { useGpsSpeedometer, SpeedUnit } from '../../hooks/useGpsSpeedometer';
import { SpeedometerGauge } from './SpeedometerGauge';
import { GpsTelemetryPanel } from './GpsTelemetryPanel';
import { TachometerBar } from './TachometerBar';

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

  // ── HUD Preferences & State ──
  const [themeId, setThemeId] = useState<HudThemeId>('cyber_neon');
  const [unit, setUnit] = useState<SpeedUnit>('km/h');
  const [isHudMirrored, setIsHudMirrored] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);

  // ── Real GPS Speedometer Hook (100% Real Geolocation Data) ──
  const telemetry = useGpsSpeedometer(unit, isOpen);

  // ── Touch / Swipe Gesture Tracking ──
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const gestureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTheme = HUD_THEMES.find((t) => t.id === themeId) ?? HUD_THEMES[0];

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

  // Show Gesture Toast
  const showGestureToast = (msg: string) => {
    setGestureFeedback(msg);
    if (gestureTimerRef.current) clearTimeout(gestureTimerRef.current);
    gestureTimerRef.current = setTimeout(() => {
      setGestureFeedback(null);
    }, 1500);
  };

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
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
      className={`fixed inset-0 z-50 flex flex-col justify-between text-white select-none animate-fadeIn overflow-hidden transition-transform duration-300 ${
        isHudMirrored ? 'scale-x-[-1]' : ''
      }`}
      style={{ background: currentTheme.bgGradient }}
      role="dialog"
      aria-modal="true"
      aria-label="Car Driving Dashboard HUD"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onClick={handleSurfaceClick}
    >
      {/* ── Top Bar: HUD Info, Theme Switcher & Actions ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl shrink-0 z-20">
        {/* Left: Clock, Date & Theme Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white/90">
            <Clock className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
            <span className="text-lg sm:text-xl font-bold font-mono tracking-wider">{timeStr}</span>
          </div>
          <span className="text-sm text-white/30 hidden sm:inline">•</span>
          <span className="text-xs text-white/60 hidden sm:inline">{dateStr}</span>

          {/* Theme Selector Toggle */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowThemeSelector((p) => !p);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-mono text-white/80 transition-colors"
              title="Switch HUD Theme"
            >
              <span>{currentTheme.emoji}</span>
              <span className="hidden md:inline">{currentTheme.name}</span>
              <Layers className="w-3 h-3 text-white/40" />
            </button>

            {/* Theme Dropdown */}
            {showThemeSelector && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-black/90 border border-white/20 p-1.5 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                {HUD_THEMES.map((thm) => (
                  <button
                    key={thm.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setThemeId(thm.id);
                      setShowThemeSelector(false);
                      showGestureToast(`Theme: ${thm.name}`);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-all ${
                      themeId === thm.id
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{thm.emoji}</span>
                    <span className="flex-1 truncate">{thm.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: thm.primaryColor }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: GPS Status Pill */}
        <div className="hidden sm:flex items-center gap-2">
          {telemetry.isDemoMode && (
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-mono uppercase tracking-wider animate-pulse">
              Demo Mode Active
            </span>
          )}
        </div>

        {/* Right: HUD Mirror, Voice Mic, Fullscreen & Exit Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Windshield Reflection Flip */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHudMirrored((p) => !p);
              showGestureToast(isHudMirrored ? 'HUD Mirror Disabled' : '🪞 Windshield HUD Mode Active');
            }}
            aria-label="Toggle Windshield Reflection"
            title="Windshield HUD Mode (Inverts display for night dashboard projection)"
            className={`p-2 rounded-xl border transition-all ${
              isHudMirrored
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:text-white'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFullscreen();
            }}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-colors hidden sm:flex"
            title="Toggle Fullscreen Dashboard"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Voice Command Mic */}
          {isVoiceSupported && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVoice();
              }}
              aria-label="Toggle Voice Commands"
              title="Voice Commands (Say: 'Next', 'Pause', 'Play', 'Mute')"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-300 ${
                isVoiceListening
                  ? 'bg-red-500/20 border-red-400/50 text-red-300 animate-pulse shadow-lg shadow-red-500/20'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:text-white'
              }`}
            >
              {isVoiceListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span className="text-xs font-medium hidden md:inline">
                {isVoiceListening ? 'Listening…' : 'Voice'}
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
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10 transition-all active:scale-95"
            title="Exit Car HUD Mode (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Gesture / Voice Feedback Toast ── */}
      {(gestureFeedback || lastVoiceCommand) && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-full bg-black/90 border border-amber-400/50 text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xl animate-fadeIn backdrop-blur-xl">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>{gestureFeedback || `Voice: ${lastVoiceCommand}`}</span>
        </div>
      )}

      {/* ── Center Area: Automotive Speedometer & Cluster HUD ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-2 text-center max-w-4xl mx-auto w-full space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar z-10">
        {/* Speedometer Instrument Cluster */}
        <SpeedometerGauge
          speed={telemetry.currentSpeed}
          unit={unit}
          status={telemetry.status}
          statusMessage={telemetry.statusMessage}
          theme={currentTheme}
          maxSpeed={unit === 'km/h' ? telemetry.maxSpeedKmh : telemetry.maxSpeedMph}
          isDemoMode={telemetry.isDemoMode}
          onToggleUnit={() => setUnit((p) => (p === 'km/h' ? 'mph' : 'km/h'))}
          onToggleDemoMode={telemetry.toggleDemoMode}
        />

        {/* Tachometer Bar with Gear Selector */}
        <TachometerBar
          isPlaying={isPlaying}
          speed={telemetry.currentSpeed}
          theme={currentTheme}
        />

        {/* Live GPS Telemetry Panel (Heading, Odometer, Elevation, Trip Time) */}
        <GpsTelemetryPanel
          telemetry={telemetry}
          unit={unit}
          theme={currentTheme}
          tripSeconds={tripSeconds}
        />

        {/* Track Title & Artist */}
        <div className="w-full max-w-xl px-2 pt-1">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md truncate">
            {currentTrack ? currentTrack.name : 'No track playing'}
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-medium">
            Swipe left/right to skip • Double-tap anywhere to play/pause
          </p>
        </div>

        {/* Progress Bar Seeker */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(ratio * duration);
          }}
          className="w-full max-w-xl h-2.5 hover:h-3.5 bg-white/10 rounded-full overflow-hidden cursor-pointer transition-all duration-200"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-100 ease-linear"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: currentTheme.primaryColor,
              boxShadow: `0 0 10px ${currentTheme.primaryColor}`,
            }}
          />
        </div>
      </main>

      {/* ── Bottom Controls: Extra-Large Tactile Buttons ── */}
      <footer className="px-4 sm:px-6 py-4 sm:py-5 border-t border-white/10 bg-black/50 backdrop-blur-2xl shrink-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Shuffle & Mute/Volume */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleShuffle();
              }}
              aria-label="Toggle Shuffle"
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all ${
                isShuffle
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shuffle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute();
                }}
                aria-label="Toggle Mute"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-all"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  e.stopPropagation();
                  onSetVolume(parseFloat(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-16 sm:w-24 h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400 hidden md:block"
                aria-label="Car mode volume"
              />
            </div>
          </div>

          {/* Center: Previous / Giant Play-Pause / Next */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Previous Track */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              aria-label="Previous Track"
              className="w-14 h-14 sm:w-18 sm:h-18 rounded-3xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all shadow-lg"
            >
              <SkipBack className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            {/* Giant Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              disabled={isLoading || !currentTrack}
              className="w-16 h-16 sm:w-22 sm:h-22 rounded-full flex items-center justify-center active:scale-90 transition-all duration-300 shadow-2xl text-black"
              style={{
                backgroundColor: isPlaying ? currentTheme.primaryColor : '#ffffff',
                boxShadow: isPlaying ? `0 0 35px ${currentTheme.glowColor}` : '0 0 25px rgba(255,255,255,0.3)',
              }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-black" />
              ) : (
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-black translate-x-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="Next Track"
              className="w-14 h-14 sm:w-18 sm:h-18 rounded-3xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all shadow-lg"
            >
              <SkipForward className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>

          {/* Right: Repeat Mode */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCycleRepeat();
              }}
              aria-label={`Repeat: ${repeatMode}`}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all ${
                repeatMode !== 'off'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              <RepeatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
