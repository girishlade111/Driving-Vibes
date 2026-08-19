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
      {/* 1. Full-screen Cinematic Responsive Background Layer */}
      <Background
        desktopSrc="/backgrounds/desktop-background.png"
        mobileSrc="/backgrounds/mobile-background.png"
      />

      {/* 2. Transient Error / Status Toast */}
      {error && (
        <aside 
          aria-live="polite"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full glass-player bg-red-950/40 border-red-500/30 text-red-200 text-xs flex items-center space-x-2 animate-fadeIn shadow-lg backdrop-blur-md"
        >
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{error}</span>
        </aside>
      )}

      {/* 3. Expanded Playlist Bottom Sheet / Modal */}
      <PlaylistPanel
        isOpen={isPlaylistOpen}
        playlist={playlist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onClose={closePlaylist}
        onSelectTrack={(index) => {
          selectTrack(index, true);
          // Auto close on small devices to keep UI minimal
          if (window.innerWidth < 640) {
            closePlaylist();
          }
        }}
        onReorder={reorderPlaylist}
      />

      {/* 4. Mini Floating Music Player */}
      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isLoading={isLoading}
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
