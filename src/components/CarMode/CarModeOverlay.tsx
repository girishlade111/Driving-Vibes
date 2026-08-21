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
  ListMusic,
  Gauge,
  Music,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { CarModeOverlayProps, HUD_THEMES, HudThemeId, HudLayoutMode } from './carModeTypes';
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
  playlist = [],
  onSelectTrack,
}) => {
  // ── Clock & Trip Timer ──
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [tripSeconds, setTripSeconds] = useState(0);

  // ── HUD Preferences & State ──
  const [themeId, setThemeId] = useState<HudThemeId>('cyber_neon');
  const [unit, setUnit] = useState<SpeedUnit>('km/h');
  const [layoutMode, setLayoutMode] = useState<HudLayoutMode>('cluster');
  const [isHudMirrored, setIsHudMirrored] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState<boolean>(false);

  // ── Real High-Accuracy GPS Speedometer Hook ──
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
    }, 1600);
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
    if (Math.abs(diffX) > 65 && Math.abs(diffX) > Math.abs(diffY)) {
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

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Keyboard shortcuts: ESC to close
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

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-between text-white select-none overflow-hidden transition-all duration-300 ${
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
      {/* ── Top Bar: HUD Info, Mode Switches, Theme & System Controls ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/10 bg-black/60 backdrop-blur-2xl shrink-0 z-30">
        {/* Left: Clock, Date & Theme Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white/90">
            <Clock className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
            <span className="text-lg sm:text-xl font-black font-mono tracking-wider">{timeStr}</span>
          </div>
          <span className="text-sm text-white/25 hidden sm:inline">•</span>
          <span className="text-xs text-white/60 font-medium hidden sm:inline">{dateStr}</span>

          {/* Theme Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowThemeSelector((p) => !p);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono font-bold text-white transition-all shadow-sm"
              title="Switch Cockpit Theme"
            >
              <span>{currentTheme.emoji}</span>
              <span className="hidden md:inline">{currentTheme.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </button>

            {/* Theme Dropdown Menu */}
            {showThemeSelector && (
              <div className="absolute top-full left-0 mt-2 w-60 rounded-2xl bg-neutral-950/95 border border-white/20 p-2 shadow-2xl backdrop-blur-2xl z-50 space-y-1">
                <div className="text-[10px] font-mono text-white/40 uppercase px-2 py-1 tracking-wider">
                  Cockpit Colorways
                </div>
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
                        ? 'bg-white/20 text-white font-bold'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">{thm.emoji}</span>
                    <span className="flex-1 truncate">{thm.name}</span>
                    <span
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: thm.primaryColor }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: HUD View Switcher (Cluster vs Minimal) */}
        <div className="hidden sm:flex items-center p-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLayoutMode('cluster');
              showGestureToast('Cockpit Cluster View');
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              layoutMode === 'cluster'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Cluster HUD
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLayoutMode('minimal');
              showGestureToast('Minimal Speed HUD');
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              layoutMode === 'minimal'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Minimal HUD
          </button>
        </div>

        {/* Right: Windshield Projection Mirror, Voice Mic, Fullscreen & Exit */}
        <div className="flex items-center gap-2">
          {/* Windshield Reflection Flip */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHudMirrored((p) => !p);
              showGestureToast(isHudMirrored ? 'Normal View' : '🪞 Windshield HUD Mode Active');
            }}
            aria-label="Toggle Windshield Projection Mode"
            title="Windshield HUD Mode (Inverts display for night windshield projection)"
            className={`p-2.5 rounded-xl border transition-all ${
              isHudMirrored
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/25'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:text-white'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
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
                  ? 'bg-red-500/25 border-red-400 text-red-200 animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:text-white'
              }`}
            >
              {isVoiceListening ? <Mic className="w-4 h-4 text-red-300" /> : <MicOff className="w-4 h-4" />}
              <span className="text-xs font-bold hidden lg:inline">
                {isVoiceListening ? 'Listening…' : 'Voice'}
              </span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFullscreen();
            }}
            aria-label="Toggle Fullscreen"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-colors hidden sm:flex"
            title="Toggle Fullscreen Dashboard"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Exit HUD Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Exit Car Mode"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all active:scale-95 shadow-md"
            title="Exit Car Dashboard HUD (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Gesture / Voice Feedback Toast ── */}
      {(gestureFeedback || lastVoiceCommand) && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-full bg-neutral-900/95 border border-amber-400/60 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xl animate-fadeIn backdrop-blur-2xl">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>{gestureFeedback || `Voice: ${lastVoiceCommand}`}</span>
        </div>
      )}

      {/* ── Center Stage: Cockpit Speedometer & Cluster HUD ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-2 text-center max-w-4xl mx-auto w-full space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar z-10">
        {/* Speedometer Instrument Gauge */}
        <SpeedometerGauge
          speed={telemetry.currentSpeed}
          unit={unit}
          status={telemetry.status}
          statusMessage={telemetry.statusMessage}
          theme={currentTheme}
          maxSpeed={unit === 'km/h' ? telemetry.maxSpeedKmh : telemetry.maxSpeedMph}
          avgSpeed={unit === 'km/h' ? telemetry.avgSpeedKmh : telemetry.avgSpeedMph}
          heading={telemetry.heading}
          cardinalHeading={telemetry.cardinalHeading}
          isDemoMode={telemetry.isDemoMode}
          onToggleUnit={() => setUnit((p) => (p === 'km/h' ? 'mph' : 'km/h'))}
          onToggleDemoMode={telemetry.toggleDemoMode}
        />

        {layoutMode === 'cluster' && (
          <>
            {/* Tachometer Bar with Gear Shifter */}
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
          </>
        )}
      </main>

      {/* ── Bottom Section: Integrated Automotive Media Deck (Cockpit Infotainment) ── */}
      <footer className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-white/10 bg-black/75 backdrop-blur-2xl shrink-0 z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {/* Top Row of Deck: Album Art, Track Marquee, Visualizer & Seekbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {/* Track Info Banner */}
            <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
              {/* Glowing Track Artwork / Disc */}
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border shrink-0 relative overflow-hidden shadow-lg transition-transform duration-300"
                style={{
                  backgroundColor: `${currentTheme.primaryColor}15`,
                  borderColor: `${currentTheme.primaryColor}50`,
                }}
              >
                <Music className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: currentTheme.primaryColor }} />
                {isPlaying && (
                  <span
                    className="absolute inset-0 rounded-xl animate-pulse opacity-40 pointer-events-none"
                    style={{ backgroundColor: currentTheme.primaryColor }}
                  />
                )}
              </div>

              {/* Title & Subtitle with Live Equalizer */}
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate drop-shadow-md">
                    {currentTrack ? currentTrack.name : 'Driving Vibes Ready'}
                  </h2>
                  {isPlaying && (
                    <div className="flex items-end gap-0.5 h-3 shrink-0">
                      <span className="w-0.5 h-full bg-emerald-400 animate-bounce" />
                      <span className="w-0.5 h-2/3 bg-emerald-400 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-0.5 h-4/5 bg-emerald-400 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-white/50 font-medium truncate">
                  {currentTrack ? 'High Fidelity Drive Audio' : 'Swipe left/right to skip tracks'}
                </p>
              </div>

              {/* In-HUD Playlist Drawer Toggle */}
              {playlist.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaylistDrawer((p) => !p);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    showPlaylistDrawer
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
                  }`}
                  title="Browse tracks in HUD"
                >
                  <ListMusic className="w-4 h-4" />
                  <span className="hidden md:inline">Playlist ({playlist.length})</span>
                </button>
              )}
            </div>

            {/* Time Indicators & Scrubber Bar */}
            <div className="flex items-center gap-2.5 w-full sm:w-80">
              <span className="text-[11px] font-mono text-white/50 shrink-0">
                {formatTime(currentTime)}
              </span>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  onSeek(ratio * duration);
                }}
                className="flex-1 h-3 hover:h-4 bg-white/10 rounded-full overflow-hidden cursor-pointer transition-all duration-200 relative group flex items-center"
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
                    boxShadow: `0 0 12px ${currentTheme.primaryColor}`,
                  }}
                />
              </div>
              <span className="text-[11px] font-mono text-white/50 shrink-0">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Bottom Row of Deck: Driver-Safe Extra-Large Controls */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Left Deck: Shuffle & Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShuffle();
                  showGestureToast(isShuffle ? 'Shuffle Off' : 'Shuffle On');
                }}
                aria-label="Toggle Shuffle"
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  isShuffle
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/15'
                }`}
                title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute();
                }}
                aria-label="Toggle Mute"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-all"
                title="Mute / Unmute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
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
                className="w-20 sm:w-28 h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white hidden md:block"
                aria-label="Car mode volume"
              />
            </div>

            {/* Center Deck: Skip Back / Giant Illuminated Play-Pause / Skip Forward */}
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Previous Track */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious();
                }}
                aria-label="Previous Track"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all shadow-lg"
                title="Previous Track (←)"
              >
                <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </button>

              {/* Giant Play/Pause Primary Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                disabled={isLoading || !currentTrack}
                className="w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center active:scale-90 transition-all duration-300 shadow-2xl text-black"
                style={{
                  backgroundColor: isPlaying ? currentTheme.primaryColor : '#ffffff',
                  boxShadow: isPlaying
                    ? `0 0 35px ${currentTheme.glowColor}`
                    : '0 0 25px rgba(255,255,255,0.3)',
                }}
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-black" />
                ) : (
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black translate-x-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                aria-label="Next Track"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/15 transition-all shadow-lg"
                title="Next Track (→)"
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </button>
            </div>

            {/* Right Deck: Repeat Cycle Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCycleRepeat();
                }}
                aria-label={`Repeat: ${repeatMode}`}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  repeatMode !== 'off'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/15'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                <RepeatIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Slide-up In-HUD Playlist Drawer ── */}
      {showPlaylistDrawer && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-4 bottom-28 top-20 sm:top-24 max-w-xl mx-auto rounded-3xl bg-neutral-950/95 border border-white/20 p-4 shadow-2xl backdrop-blur-3xl z-40 flex flex-col animate-fadeIn"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
              <span className="font-extrabold text-base text-white">Cockpit Playlist</span>
              <span className="text-xs font-mono text-white/40">({playlist.length} tracks)</span>
            </div>
            <button
              onClick={() => setShowPlaylistDrawer(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-1.5">
            {playlist.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <button
                  key={track.id || idx}
                  onClick={() => {
                    if (onSelectTrack) onSelectTrack(idx);
                    setShowPlaylistDrawer(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all ${
                    isCurrent
                      ? 'bg-white/20 text-white font-bold border border-white/30 shadow-md'
                      : 'hover:bg-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <span className="w-6 text-center font-mono text-xs text-white/40">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate font-semibold">{track.name}</div>
                    <div className="text-xs text-white/40 truncate">{track.filename || 'Audio Track'}</div>
                  </div>
                  {isCurrent && isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
