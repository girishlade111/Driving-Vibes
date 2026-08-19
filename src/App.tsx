import React from 'react';
import { Background } from './components/Background/Background';
import { MiniPlayer } from './components/MiniPlayer/MiniPlayer';
import { PlaylistPanel } from './components/Playlist/PlaylistPanel';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
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
      {/* Layer 0 — Full-screen Cinematic Responsive Background */}
      <Background
        desktopSrc="/backgrounds/desktop-background.png"
        mobileSrc="/backgrounds/mobile-background.png"
      />

      {/* Layer 10 — Transient Error / Status Toast */}
      {error && (
        <aside
          aria-live="polite"
          role="alert"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full glass-player border-red-500/30 text-red-200 text-xs flex items-center space-x-2 animate-fadeIn shadow-lg"
          style={{ background: 'rgba(30, 5, 5, 0.55)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{error}</span>
        </aside>
      )}

      {/* Layer 20 — Expanded Playlist Panel */}
      <PlaylistPanel
        isOpen={isPlaylistOpen}
        playlist={playlist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isTracksLoading={isTracksLoading}
        onClose={closePlaylist}
        onSelectTrack={(index) => {
          selectTrack(index, true);
          // Auto-close on mobile to keep UI minimal
          if (window.innerWidth < 640) {
            closePlaylist();
          }
        }}
        onReorder={reorderPlaylist}
      />

      {/* Layer 30 — Mini Floating Music Player */}
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
