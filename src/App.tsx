import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Background } from './components/Background/Background';
import { SettingsPanel } from './components/Background/SettingsPanel';
import { MusicWave } from './components/MiniPlayer/MusicWave';
import { MiniPlayer } from './components/MiniPlayer/MiniPlayer';
import { PlaylistPanel } from './components/Playlist/PlaylistPanel';
import { NowPlayingOverlay } from './components/NowPlayingOverlay/NowPlayingOverlay';
import { AmbientMixerModal } from './components/AmbientMixer/AmbientMixerModal';
import { AudioFxModal } from './components/AudioFx/AudioFxModal';
import { CarModeOverlay } from './components/CarMode/CarModeOverlay';
import { AiDjModal } from './components/AiDj/AiDjModal';
import { VirtualTripModal } from './components/Social/VirtualTripModal';
import { PostcardModal } from './components/Postcard/PostcardModal';
import { FocusTimerModal } from './components/Focus/FocusTimerModal';
import { RainGlassCanvas } from './components/InteractiveCanvas/RainGlassCanvas';
import { SpeedParticlesCanvas } from './components/InteractiveCanvas/SpeedParticlesCanvas';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useListeningStats } from './hooks/useListeningStats';
import { useAmbientMixer } from './hooks/useAmbientMixer';
import { useAudioEqualizer } from './hooks/useAudioEqualizer';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { useAiDjHost } from './hooks/useAiDjHost';
import { useVirtualTrip } from './hooks/useVirtualTrip';
import { BACKGROUND_PRESETS, BackgroundPreset, TimeOfDayMode } from './types/backgroundPresets';
import { AlertCircle, Radio as RadioIcon } from 'lucide-react';

export type PlayerPosition = 'center' | 'bottom';

// ── Accent color presets (must match SettingsPanel presets) ───────────────
const ACCENT_MAP: Record<string, { h: number; s: string; l: string }> = {
  White:  { h: 0,   s: '0%',   l: '100%' },
  Amber:  { h: 38,  s: '95%',  l: '68%'  },
  Cyan:   { h: 187, s: '85%',  l: '62%'  },
  Rose:   { h: 348, s: '90%',  l: '65%'  },
  Violet: { h: 262, s: '80%',  l: '68%'  },
};

const STORAGE_ACCENT_KEY      = 'driving_vibes_accent';
const STORAGE_NOW_PLAYING_KEY = 'driving_vibes_show_now_playing';
const STORAGE_BG_PRESET_KEY   = 'driving_vibes_bg_preset';
const STORAGE_TOD_KEY         = 'driving_vibes_tod_mode';
const STORAGE_CUSTOM_BG_KEY   = 'driving_vibes_custom_bg';
const STORAGE_RAIN_KEY        = 'driving_vibes_rain_glass';
const STORAGE_SPEED_KEY       = 'driving_vibes_speed_particles';

function loadAccent(): string {
  try {
    return localStorage.getItem(STORAGE_ACCENT_KEY) || 'White';
  } catch {
    return 'White';
  }
}

function loadShowNowPlaying(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_NOW_PLAYING_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

function loadBgPreset(): BackgroundPreset {
  try {
    const id = localStorage.getItem(STORAGE_BG_PRESET_KEY);
    const found = BACKGROUND_PRESETS.find((p) => p.id === id);
    if (found) return found;
  } catch {
    /* ignore */
  }
  return BACKGROUND_PRESETS[0];
}

function loadTimeOfDay(): TimeOfDayMode {
  try {
    return (localStorage.getItem(STORAGE_TOD_KEY) as TimeOfDayMode) || 'auto';
  } catch {
    return 'auto';
  }
}

function loadCustomBg(): string {
  try {
    return localStorage.getItem(STORAGE_CUSTOM_BG_KEY) || '';
  } catch {
    return '';
  }
}

function applyAccentToCss(colorName: string) {
  const preset = ACCENT_MAP[colorName] ?? ACCENT_MAP['White'];
  const root = document.documentElement;
  root.style.setProperty('--accent-h', String(preset.h));
  root.style.setProperty('--accent-s', preset.s);
  root.style.setProperty('--accent-l', preset.l);
}

export const App: React.FC = () => {
  // ── Background / visual settings ─────────────────────────────────────
  const [isAnimated]                        = useState<boolean>(false);
  const [blur, setBlur]                     = useState<number>(0);
  const [showWave, setShowWave]             = useState<boolean>(true);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>('center');
  const [showNowPlaying, setShowNowPlaying] = useState<boolean>(() => loadShowNowPlaying());
  const [accentColor, setAccentColorState]  = useState<string>(() => loadAccent());
  const [bgPreset, setBgPreset]             = useState<BackgroundPreset>(() => loadBgPreset());
  const [timeOfDayMode, setTimeOfDayMode]   = useState<TimeOfDayMode>(() => loadTimeOfDay());
  const [customBgUrl, setCustomBgUrl]       = useState<string>(() => loadCustomBg());

  // ── Interactive Screen Effects ────────────────────────────────────────
  const [showRainGlass, setShowRainGlass]   = useState<boolean>(() => localStorage.getItem(STORAGE_RAIN_KEY) === 'true');
  const [showSpeedParticles, setShowSpeedParticles] = useState<boolean>(() => localStorage.getItem(STORAGE_SPEED_KEY) === 'true');

  // ── Modals State ──────────────────────────────────────────────────────
  const [isCarModeOpen, setIsCarModeOpen]   = useState<boolean>(false);
  const [isPostcardOpen, setIsPostcardOpen] = useState<boolean>(false);
  const [isFocusOpen, setIsFocusOpen]       = useState<boolean>(false);

  // Apply accent color on mount
  useEffect(() => {
    applyAccentToCss(accentColor);
  }, [accentColor]);

  const handleAccentChange = useCallback((color: string) => {
    setAccentColorState(color);
    applyAccentToCss(color);
    try { localStorage.setItem(STORAGE_ACCENT_KEY, color); } catch { /* ignore */ }
  }, []);

  const handleSelectBgPreset = useCallback((preset: BackgroundPreset) => {
    setBgPreset(preset);
    try { localStorage.setItem(STORAGE_BG_PRESET_KEY, preset.id); } catch { /* ignore */ }
  }, []);

  const handleSelectTimeOfDay = useCallback((mode: TimeOfDayMode) => {
    setTimeOfDayMode(mode);
    try { localStorage.setItem(STORAGE_TOD_KEY, mode); } catch { /* ignore */ }
  }, []);

  const handleSetCustomBgUrl = useCallback((url: string) => {
    setCustomBgUrl(url);
    try { localStorage.setItem(STORAGE_CUSTOM_BG_KEY, url); } catch { /* ignore */ }
  }, []);

  const toggleRainGlass = useCallback(() => {
    setShowRainGlass((p) => {
      const next = !p;
      try { localStorage.setItem(STORAGE_RAIN_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const toggleSpeedParticles = useCallback(() => {
    setShowSpeedParticles((p) => {
      const next = !p;
      try { localStorage.setItem(STORAGE_SPEED_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleBlurChange   = useCallback((v: number) => setBlur(v), []);
  const toggleWave         = useCallback(() => setShowWave((p) => !p), []);
  const handlePositionChange = useCallback((pos: PlayerPosition) => setPlayerPosition(pos), []);
  const toggleNowPlaying   = useCallback(() => {
    setShowNowPlaying((p) => {
      const next = !p;
      try { localStorage.setItem(STORAGE_NOW_PLAYING_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Stats hook ────────────────────────────────────────────────────────
  const {
    stats,
    getTrackStat,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetStats,
    formatTime,
    getMostPlayed,
  } = useListeningStats();

  // ── Audio player ──────────────────────────────────────────────────────
  const {
    playlist,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    isTracksLoading,
    error,
    isPlaylistOpen,
    isShuffle,
    repeatMode,
    volume,
    isMuted,
    sleepTimer,
    sleepRemaining,
    togglePlay,
    previous,
    next,
    selectTrack,
    seek,
    reorderPlaylist,
    togglePlaylist,
    closePlaylist,
    toggleShuffle,
    cycleRepeat,
    setVolume,
    toggleMute,
    setSleepTimerOption,
    cancelSleepTimer,
    shareCurrentTrack,
    audioRef,
  } = useAudioPlayer(startTracking, pauseTracking, resumeTracking);

  // Cleanup stats tracking on unmount
  useEffect(() => {
    return () => { stopTracking(); };
  }, [stopTracking]);

  // ── Flagship Features ─────────────────────────────────────────────────
  // Local file upload disabled — only R2 songs are allowed.
  const handleLocalFiles = useCallback(() => {}, []);
  
  // Radio station selection disabled — only R2 songs are allowed.
  const handleSelectRadioStation = useCallback(() => {}, []);

  // Global drag-and-drop disabled — only R2 songs are allowed.

  const ambient = useAmbientMixer();
  const eq = useAudioEqualizer(audioRef);
  const dj = useAiDjHost();
  const trip = useVirtualTrip({
    currentTrack,
    isPlaying,
    currentTime,
    playlist,
    onSelectTrack: (index: number) => selectTrack(index, true),
    onTogglePlay: togglePlay,
    onSeek: seek,
  });

  // Announce track when changed if AI DJ enabled
  const announceTrackFn = dj.announceTrack;
  const isDjEnabled = dj.settings.isEnabled;
  useEffect(() => {
    if (currentTrack && isDjEnabled) {
      announceTrackFn(currentTrack.name, currentTrack.id);
    }
  }, [currentTrack?.id, isDjEnabled, announceTrackFn]);

  // ── Voice Commands ────────────────────────────────────────────────────
  const voice = useVoiceCommands({
    onPlay: () => {
      if (!isPlaying) togglePlay();
    },
    onPause: () => {
      if (isPlaying) togglePlay();
    },
    onTogglePlay: togglePlay,
    onNext: next,
    onPrevious: previous,
    onToggleMute: toggleMute,
    onVolumeUp: () => setVolume(Math.min(1, volume + 0.1)),
    onVolumeDown: () => setVolume(Math.max(0, volume - 0.1)),
    onToggleShuffle: toggleShuffle,
    onExitCarMode: () => setIsCarModeOpen(false),
  });

  // ── Global Keyboard Shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.code === 'KeyA') {
        e.preventDefault();
        ambient.toggleMixer();
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        eq.toggleEq();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCarModeOpen((p) => !p);
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        setIsFocusOpen((p) => !p);
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        dj.toggleDjModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, ambient, eq, dj]);

  // ── Sleep timer cancel shortcut wrapper ───────────────────────────────
  const handleSetSleepTimer = useCallback(
    (minutes: Parameters<typeof setSleepTimerOption>[0]) => {
      if (minutes === 0) {
        cancelSleepTimer();
      } else {
        setSleepTimerOption(minutes);
      }
    },
    [setSleepTimerOption, cancelSleepTimer]
  );

  // ── Share toast state ─────────────────────────────────────────────────
  const [shareToast, setShareToast] = useState<string | null>(null);
  const shareToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShare = useCallback(async (): Promise<boolean> => {
    const ok = await shareCurrentTrack();
    if (ok) {
      if (shareToastTimer.current) clearTimeout(shareToastTimer.current);
      setShareToast('Link copied!');
      shareToastTimer.current = setTimeout(() => setShareToast(null), 2500);
    }
    return ok;
  }, [shareCurrentTrack]);

  const mostPlayed = getMostPlayed(playlist);

  return (
    <main className="relative w-full h-full min-h-[100dvh] overflow-hidden select-none">

      {/* z-0 — Background (Videos / Image / GIF + Blur + Time of Day) */}
      <Background
        currentPreset={bgPreset}
        customMediaUrl={customBgUrl}
        desktopSrc="/backgrounds/desktop-background.png"
        mobileSrc="/backgrounds/mobile-background.png"
        desktopGif="/backgrounds/desktop-background.gif"
        mobileGif="/backgrounds/mobile-background.gif"
        isAnimated={isAnimated}
        blur={blur}
        timeOfDayMode={timeOfDayMode}
      />

      {/* z-10 — Interactive Screen Canvases */}
      <RainGlassCanvas isEnabled={showRainGlass} />
      <SpeedParticlesCanvas isEnabled={showSpeedParticles} isPlaying={isPlaying} accentColor={accentColor} />

      {/* z-35 — Settings button + panel */}
      <SettingsPanel
        blur={blur}
        showWave={showWave}
        playerPosition={playerPosition}
        showNowPlaying={showNowPlaying}
        onBlurChange={handleBlurChange}
        onToggleWave={toggleWave}
        onPositionChange={handlePositionChange}
        onToggleNowPlaying={toggleNowPlaying}
        showRainGlass={showRainGlass}
        showSpeedParticles={showSpeedParticles}
        onToggleRainGlass={toggleRainGlass}
        onToggleSpeedParticles={toggleSpeedParticles}
        currentBgPreset={bgPreset}
        timeOfDayMode={timeOfDayMode}
        customBgUrl={customBgUrl}
        onSelectBgPreset={handleSelectBgPreset}
        onSelectTimeOfDay={handleSelectTimeOfDay}
        onSetCustomBgUrl={handleSetCustomBgUrl}
        sleepTimer={sleepTimer}
        sleepRemaining={sleepRemaining}
        onSetSleepTimer={handleSetSleepTimer}
        stats={stats}
        mostPlayed={mostPlayed}
        formatTime={formatTime}
        onResetStats={resetStats}
        accentColor={accentColor}
        onAccentChange={handleAccentChange}
        onOpenAmbientMixer={ambient.openMixer}
        onOpenAudioFx={eq.openEq}
        onOpenCarMode={() => setIsCarModeOpen(true)}
        onOpenDjModal={dj.openDjModal}
        onOpenFocusModal={() => setIsFocusOpen(true)}
        onOpenPostcardModal={() => setIsPostcardOpen(true)}
        onOpenTripModal={trip.openTripModal}
      />

      {/* z-29 — Music wave visualizer */}
      <MusicWave isVisible={showWave} isPlaying={isPlaying} playerPosition={playerPosition} />

      {/* z-50 — Now Playing overlay (top-left, auto-hides) */}
      <NowPlayingOverlay
        trackName={currentTrack?.name ?? null}
        isPlaying={isPlaying}
        isEnabled={showNowPlaying}
      />

      {/* AI DJ Live Announcement banner */}
      {dj.currentAnnouncement && (
        <aside
          aria-live="polite"
          className="fixed top-14 left-1/2 -translate-x-1/2 z-45 px-5 py-2 rounded-full glass-player border border-pink-400/40 text-pink-200 text-xs flex items-center space-x-2 animate-slideUp shadow-xl"
        >
          <RadioIcon className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span className="font-medium">AI DJ: {dj.currentAnnouncement}</span>
        </aside>
      )}

      {/* z-40 — Error toast */}
      {error && (
        <aside
          aria-live="polite"
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full glass-player text-red-200 text-xs flex items-center space-x-2 animate-fadeIn shadow-lg"
          style={{ background: 'rgba(30, 5, 5, 0.55)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{error}</span>
        </aside>
      )}

      {/* Share toast */}
      {shareToast && (
        <aside
          aria-live="polite"
          className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full glass-player text-white/80 text-xs flex items-center space-x-2 toast-enter shadow-lg"
        >
          <span>🔗 {shareToast}</span>
        </aside>
      )}

      {/* z-25 — Playlist panel */}
      <PlaylistPanel
        isOpen={isPlaylistOpen}
        playlist={playlist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isTracksLoading={isTracksLoading}
        getTrackStat={getTrackStat}
        onClose={closePlaylist}
        onSelectTrack={(index) => {
          selectTrack(index, true);
          if (window.innerWidth < 640) closePlaylist();
        }}
        onReorder={reorderPlaylist}
      />

      {/* z-30 — Mini player */}
      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isLoading={isLoading}
        isTracksLoading={isTracksLoading}
        currentTime={currentTime}
        duration={duration}
        isPlaylistOpen={isPlaylistOpen}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        playerPosition={playerPosition}
        volume={volume}
        isMuted={isMuted}
        ambientActiveCount={ambient.activeCount}
        onTogglePlay={togglePlay}
        onPrevious={previous}
        onNext={next}
        onTogglePlaylist={togglePlaylist}
        onSeek={seek}
        onToggleShuffle={toggleShuffle}
        onCycleRepeat={cycleRepeat}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onShare={handleShare}
        onToggleAmbientMixer={ambient.toggleMixer}
        onToggleAudioFx={eq.toggleEq}
        onOpenCarMode={() => setIsCarModeOpen(true)}
        onOpenFocusModal={() => setIsFocusOpen(true)}
        onOpenPostcardModal={() => setIsPostcardOpen(true)}
        onOpenTripModal={trip.openTripModal}
      />

      {/* ── Feature Modals ── */}

      {/* 1. Ambient Sound Mixer Modal */}
      <AmbientMixerModal
        isOpen={ambient.isMixerOpen}
        onClose={ambient.closeMixer}
        isEnabled={ambient.isEnabled}
        masterVolume={ambient.masterVolume}
        volumes={ambient.volumes}
        enabledSounds={ambient.enabledSounds}
        activeCount={ambient.activeCount}
        onToggleMaster={ambient.toggleAmbientMaster}
        onToggleSound={ambient.toggleSound}
        onSetSoundVolume={ambient.setSoundVolume}
        onSetMasterVolume={ambient.setMasterVolume}
        onApplyPreset={ambient.applyPreset}
      />

      {/* 2. Audio Equalizer & FX Modal */}
      <AudioFxModal
        isOpen={eq.isEqOpen}
        onClose={eq.closeEq}
        bass={eq.bass}
        mid={eq.mid}
        treble={eq.treble}
        speed={eq.speed}
        presetId={eq.presetId}
        isSpatial={eq.isSpatial}
        onApplyPreset={eq.applyPreset}
        onSetBandGain={eq.setBandGain}
        onSetPlaybackSpeed={eq.setPlaybackSpeed}
        onToggleSpatial={eq.toggleSpatial}
        onReset={eq.resetEq}
      />

      {/* 3. Car / Drive Mode Fullscreen HUD */}
      <CarModeOverlay
        isOpen={isCarModeOpen}
        onClose={() => setIsCarModeOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isLoading={isLoading}
        currentTime={currentTime}
        duration={duration}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        volume={volume}
        isMuted={isMuted}
        onTogglePlay={togglePlay}
        onPrevious={previous}
        onNext={next}
        onToggleShuffle={toggleShuffle}
        onCycleRepeat={cycleRepeat}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onSeek={seek}
        isVoiceListening={voice.isListening}
        isVoiceSupported={voice.isSupported}
        lastVoiceCommand={voice.lastCommand}
        onToggleVoice={voice.toggleListening}
      />

      {/* 4. AI DJ & Radio Host Modal */}
      <AiDjModal
        isOpen={dj.isDjModalOpen}
        onClose={dj.closeDjModal}
        settings={dj.settings}
        isSpeaking={dj.isSpeaking}
        onToggleMaster={dj.toggleDjMaster}
        onSetPersona={dj.setPersona}
        onUpdateSetting={dj.updateSetting}
        onTestSpeak={dj.testSpeak}
      />

      {/* 5. Virtual Road Trip (Listen Together) */}
      <VirtualTripModal tripState={trip} />

      {/* 6. Postcard & Wallpaper Generator */}
      <PostcardModal
        isOpen={isPostcardOpen}
        onClose={() => setIsPostcardOpen(false)}
        currentTrack={currentTrack}
        accentColor={accentColor}
        activeBgPreset={bgPreset}
        customBgUrl={customBgUrl}
        onApplyWallpaper={handleSetCustomBgUrl}
      />

      {/* 7. Focus & Zen Productivity Suite */}
      <FocusTimerModal
        isOpen={isFocusOpen}
        onClose={() => setIsFocusOpen(false)}
      />



      {/* Backlink — bottom-left, minimal */}
      <a
        href="https://ladestack.in"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-safe left-4 z-30 text-[10px] tracking-wide text-white/30 hover:text-white/60 transition-colors duration-300 select-none"
        style={{ fontFamily: 'Outfit, Inter, sans-serif', letterSpacing: '0.06em' }}
      >
        ladestack.in
      </a>

    </main>
  );
};

export default App;
