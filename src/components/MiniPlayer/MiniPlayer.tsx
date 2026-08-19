import React, { useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ListMusic, Loader2 } from 'lucide-react';
import { Track } from '../../types/music';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isPlaylistOpen: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlaylist: () => void;
  onSeek: (seconds: number) => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  isPlaylistOpen,
  onTogglePlay,
  onPrevious,
  onNext,
  onTogglePlaylist,
  onSeek,
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(clickRatio * duration);
  };

  return (
    <nav
      aria-label="Audio player controls"
      className="fixed bottom-safe left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-24px)] sm:w-[420px] md:w-[460px] select-none"
    >
      <div 
        className="glass-player relative flex items-center justify-between px-3.5 py-2.5 rounded-full overflow-hidden transition-all duration-300 hover:border-white/25 group shadow-2xl"
      >
        {/* Subtle Micro-Progress Bar along bottom edge */}
        <div
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="absolute inset-x-0 bottom-0 h-[2.5px] bg-white/10 hover:h-[4px] cursor-pointer transition-all duration-150 group/progress"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Playback progress"
        >
          <div
            className="h-full bg-gradient-to-r from-white/70 to-white/95 rounded-r-full transition-all duration-100 ease-out group-hover/progress:brightness-125"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Left Side: Playback Controls (Previous, Play/Pause, Next) */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Previous Button */}
          <button
            onClick={onPrevious}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Previous song"
            title="Previous (Left Arrow)"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Central Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-black hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50 disabled:pointer-events-none"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black stroke-black" />
            ) : (
              <Play className="w-4 h-4 fill-black stroke-black translate-x-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Next song"
            title="Next (Right Arrow)"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Center: Song Name & Playing Pulse */}
        <div className="flex items-center min-w-0 flex-1 px-2.5 sm:px-3 text-left">
          {/* Subtle Equalizer Animation when playing */}
          {isPlaying && (
            <div className="flex items-end gap-[2px] h-3 mr-2 shrink-0 opacity-80" aria-hidden="true">
              <span className="w-[2px] bg-white rounded-full bar-1" />
              <span className="w-[2px] bg-white rounded-full bar-2" />
              <span className="w-[2px] bg-white rounded-full bar-3" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p 
              className="text-xs sm:text-sm font-medium tracking-wide text-neutral-100 truncate drop-shadow-sm"
              title={currentTrack?.name || 'No song selected'}
            >
              {currentTrack ? currentTrack.name : 'Select a track'}
            </p>
          </div>
        </div>

        {/* Right Side: Playlist Toggle Button */}
        <div className="shrink-0 pl-1">
          <button
            onClick={onTogglePlaylist}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95 ${
              isPlaylistOpen 
                ? 'bg-white/20 text-white shadow-inner' 
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            aria-label={isPlaylistOpen ? 'Close playlist' : 'Open playlist'}
            aria-expanded={isPlaylistOpen}
            title="Playlist (Esc to close)"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
