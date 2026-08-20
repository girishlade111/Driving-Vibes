import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Background } from './components/Background/Background';
import { SettingsPanel } from './components/Background/SettingsPanel';
import { MusicWave } from './components/MiniPlayer/MusicWave';
import { MiniPlayer } from './components/MiniPlayer/MiniPlayer';
import { PlaylistPanel } from './components/Playlist/PlaylistPanel';
import { NowPlayingOverlay } from './components/NowPlayingOverlay/NowPlayingOverlay';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useFavorites } from './hooks/useFavorites';
import { useListeningStats } from './hooks/useListeningStats';
import { AlertCircle } from 'lucide-react';

export type PlayerPosition = 'center' | 'bottom';

// ── Accent color presets (must match SettingsPanel presets) ───────────────
const ACCENT_MAP: Record<string, { h: number; s: string; l: string }> = {
  White:  { h: 0,   s: '0%',   l: '100%' },
  Amber:  { h: 38,  s: '95%',  l: '68%'  },
  Cyan:   { h: 187, s: '85%',  l: '62%'  },
  Rose:   { h: 348, s: '90%',  l: '65%'  },
  Violet: { h: 262, s: '80%',  l: '68%'  },
};

const STORAGE_ACCENT_KEY     = 'driving_vibes_accent';
const STORAGE_NOW_PLAYING_KEY = 'driving_vibes_show_now_playing';

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

function applyAccentToCss(colorName: string) {
  const preset = ACCENT_MAP[colorName] ?? ACCENT_MAP['White'];
  const root = document.documentElement;
  root.style.setProperty('--accent-h', String(preset.h));
  root.style.setProperty('--accent-s', preset.s);
  root.style.setProperty('--accent-l', preset.l);
}

export const App: React.FC = () => {
  // ── Background / visual settings ─────────────────────────────────────
  const [isAnimated, setIsAnimated]         = useState<boolean>(false);
  const [blur, setBlur]                     = useState<number>(0);
  const [showWave, setShowWave]             = useState<boolean>(true);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>('center');
  const [showNowPlaying, setShowNowPlaying] = useState<boolean>(() => loadShowNowPlaying());
  const [accentColor, setAccentColorState]  = useState<string>(() => loadAccent());

  // Apply accent color on mount
  useEffect(() => {
    applyAccentToCss(accentColor);
  }, []);

  const handleAccentChange = useCallback((color: string) => {
    setAccentColorState(color);
    applyAccentToCss(color);
    try { localStorage.setItem(STORAGE_ACCENT_KEY, color); } catch { /* ignore */ }
  }, []);

  const toggleAnimation    = useCallback(() => setIsAnimated((p) => !p), []);
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
  } = useAudioPlayer(startTracking, pauseTracking, resumeTracking);

  // Cleanup stats tracking on unmount
  useEffect(() => {
    return () => { stopTracking(); };
  }, [stopTracking]);

  // ── Favorites hook ────────────────────────────────────────────────────
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // ── Keyboard shortcut: L = toggle favorite, F = toggle faves filter ───
  // (F filter is handled inside PlaylistPanel; L is here for the current track)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'KeyL' && currentTrack) {
        e.preventDefault();
        toggleFavorite(currentTrack.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, toggleFavorite]);

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

      {/* z-0  — Background (PNG / GIF + blur overlay) */}
      <Background
        desktopSrc="/backgrounds/desktop-background.png"
        mobileSrc="/backgrounds/mobile-background.png"
        desktopGif="/backgrounds/desktop-background.gif"
        mobileGif="/backgrounds/mobile-background.gif"
        isAnimated={isAnimated}
        blur={blur}
      />

      {/* z-35 — Settings button + panel */}
      <SettingsPanel
        isAnimated={isAnimated}
        blur={blur}
        showWave={showWave}
        playerPosition={playerPosition}
        showNowPlaying={showNowPlaying}
        onToggleAnimated={toggleAnimation}
        onBlurChange={handleBlurChange}
        onToggleWave={toggleWave}
        onPositionChange={handlePositionChange}
        onToggleNowPlaying={toggleNowPlaying}
        sleepTimer={sleepTimer}
        sleepRemaining={sleepRemaining}
        onSetSleepTimer={handleSetSleepTimer}
        stats={stats}
        mostPlayed={mostPlayed}
        formatTime={formatTime}
        onResetStats={resetStats}
        accentColor={accentColor}
        onAccentChange={handleAccentChange}
      />

      {/* z-29 — Music wave visualizer (above background, below player) */}
      <MusicWave isVisible={showWave} isPlaying={isPlaying} playerPosition={playerPosition} />

      {/* z-50 — Now Playing overlay (top-left, auto-hides) */}
      <NowPlayingOverlay
        trackName={currentTrack?.name ?? null}
        isPlaying={isPlaying}
        isEnabled={showNowPlaying}
      />

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
        favorites={favorites}
        getTrackStat={getTrackStat}
        onClose={closePlaylist}
        onSelectTrack={(index) => {
          selectTrack(index, true);
          if (window.innerWidth < 640) closePlaylist();
        }}
        onReorder={reorderPlaylist}
        onToggleFavorite={toggleFavorite}
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
        isFavorite={currentTrack ? isFavorite(currentTrack.id) : false}
        onTogglePlay={togglePlay}
        onPrevious={previous}
        onNext={next}
        onTogglePlaylist={togglePlaylist}
        onSeek={seek}
        onToggleShuffle={toggleShuffle}
        onCycleRepeat={cycleRepeat}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onToggleFavorite={() => currentTrack && toggleFavorite(currentTrack.id)}
        onShare={handleShare}
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
