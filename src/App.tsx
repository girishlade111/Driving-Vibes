import React, { useState, useCallback } from 'react';
import { Background } from './components/Background/Background';
import { SettingsPanel } from './components/Background/SettingsPanel';
import { MusicWave } from './components/MiniPlayer/MusicWave';
import { MiniPlayer } from './components/MiniPlayer/MiniPlayer';
import { PlaylistPanel } from './components/Playlist/PlaylistPanel';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // ── Background / visual settings ─────────────────────────────────────
  const [isAnimated, setIsAnimated]   = useState<boolean>(false);
  const [blur, setBlur]               = useState<number>(0);
  const [showWave, setShowWave]       = useState<boolean>(true);

  const toggleAnimation = useCallback(() => setIsAnimated((p) => !p), []);
  const handleBlurChange = useCallback((v: number) => setBlur(v), []);
  const toggleWave = useCallback(() => setShowWave((p) => !p), []);

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
  } = useAudioPlayer();

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
        onToggleAnimated={toggleAnimation}
        onBlurChange={handleBlurChange}
        onToggleWave={toggleWave}
      />

      {/* z-29 — Music wave visualizer (above background, below player) */}
      <MusicWave isVisible={showWave} isPlaying={isPlaying} />

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

      {/* z-25 — Playlist panel */}
      <PlaylistPanel
        isOpen={isPlaylistOpen}
        playlist={playlist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isTracksLoading={isTracksLoading}
        onClose={closePlaylist}
        onSelectTrack={(index) => {
          selectTrack(index, true);
          if (window.innerWidth < 640) closePlaylist();
        }}
        onReorder={reorderPlaylist}
      />

      {/* z-30 — Mini player (centered) */}
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
        onTogglePlay={togglePlay}
        onPrevious={previous}
        onNext={next}
        onTogglePlaylist={togglePlaylist}
        onSeek={seek}
        onToggleShuffle={toggleShuffle}
        onCycleRepeat={cycleRepeat}
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
