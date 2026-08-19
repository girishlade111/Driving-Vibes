import React, { useState, useCallback } from 'react';
import { Background } from './components/Background/Background';
import { SettingsPanel } from './components/Background/SettingsPanel';
import { MiniPlayer } from './components/MiniPlayer/MiniPlayer';
import { PlaylistPanel } from './components/Playlist/PlaylistPanel';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // ── Background settings state ─────────────────────────────────────────
  const [isAnimated, setIsAnimated] = useState<boolean>(false);
  const [blur, setBlur] = useState<number>(0);

  const toggleAnimation = useCallback(() => setIsAnimated((prev) => !prev), []);
  const handleBlurChange = useCallback((value: number) => setBlur(value), []);

  // ── Audio player state ────────────────────────────────────────────────
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
    togglePlay,
    previous,
    next,
    selectTrack,
    seek,
    reorderPlaylist,
    togglePlaylist,
    closePlaylist,
  } = useAudioPlayer();

  return (
    <main className="relative w-full h-full min-h-[100dvh] overflow-hidden select-none">

      {/* Layer 0 — Cinematic background (static PNG + animated GIF + blur overlay) */}
      <Background
        desktopSrc="/backgrounds/desktop-background.png"
        mobileSrc="/backgrounds/mobile-background.png"
        desktopGif="/backgrounds/desktop-background.gif"
        mobileGif="/backgrounds/mobile-background.gif"
        isAnimated={isAnimated}
        blur={blur}
      />

      {/* Layer 35 — Settings button + panel (top-right) */}
      <SettingsPanel
        isAnimated={isAnimated}
        blur={blur}
        onToggleAnimated={toggleAnimation}
        onBlurChange={handleBlurChange}
      />

      {/* Layer 40 — Error toast */}
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

      {/* Layer 25 — Expanded playlist panel */}
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

      {/* Layer 30 — Mini player (centered) */}
      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isLoading={isLoading}
        isTracksLoading={isTracksLoading}
        currentTime={currentTime}
        duration={duration}
        isPlaylistOpen={isPlaylistOpen}
        onTogglePlay={togglePlay}
        onPrevious={previous}
        onNext={next}
        onTogglePlaylist={togglePlaylist}
        onSeek={seek}
      />

    </main>
  );
};

export default App;
