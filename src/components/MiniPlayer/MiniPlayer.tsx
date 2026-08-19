import React, { useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ListMusic, Loader2 } from 'lucide-react';
import { Track } from '../../types/music';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  isTracksLoading: boolean;
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
  isTracksLoading,
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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  // Central play button state
  const showSpinner = isLoading || isTracksLoading;
  const playDisabled = isTracksLoading || !currentTrack;

  return (
    <nav
      aria-label="Audio player controls"
      className="fixed bottom-safe left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-24px)] sm:w-[440px] md:w-[480px] select-none animate-fadeIn"
    >
      <div className="glass-player relative flex items-center px-3 sm:px-4 py-2.5 rounded-full overflow-hidden group shadow-2xl">

        {/* ── Thin progress bar along bottom edge ── */}
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Playback progress"
          title={`${Math.round(progressPercent)}% played`}
          className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10 hover:h-[4px] cursor-pointer transition-all duration-200 group/bar"
        >
          <div
            className="h-full bg-white/80 rounded-r-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── Left: Prev / Play / Next ── */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Previous */}
          <button
            onClick={onPrevious}
            disabled={playDisabled}
            aria-label="Previous song"
            title="Previous (←)"
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-30 disabled:pointer-events-none"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* Play / Pause — slightly larger */}
          <button
            onClick={onTogglePlay}
            disabled={playDisabled}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-40 disabled:pointer-events-none"
          >
            {showSpinner ? (
              <Loader2 className="w-4 h-4 animate-spin text-black/70" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-black stroke-black" />
            ) : (
              <Play className="w-4 h-4 fill-black stroke-black translate-x-[1px]" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            disabled={playDisabled}
            aria-label="Next song"
            title="Next (→)"
            className="w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-30 disabled:pointer-events-none"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* ── Center: Song info ── */}
        <div className="flex items-center min-w-0 flex-1 px-2 sm:px-3">
          {/* Animated equalizer bars when playing */}
          {isPlaying && !showSpinner && (
            <span className="flex items-end gap-[2px] h-3 mr-2 shrink-0" aria-hidden="true">
              <span className="w-[2px] bg-white/80 rounded-full bar-1" />
              <span className="w-[2px] bg-white/80 rounded-full bar-2" />
              <span className="w-[2px] bg-white/80 rounded-full bar-3" />
            </span>
          )}

          <p
            className="text-xs sm:text-[13px] font-medium tracking-wide text-white/90 truncate leading-none"
            title={currentTrack?.name ?? 'No track selected'}
          >
            {isTracksLoading
              ? 'Loading…'
              : currentTrack
              ? currentTrack.name
              : 'Select a track'}
          </p>
        </div>

        {/* ── Right: Playlist toggle ── */}
        <div className="shrink-0">
          <button
            onClick={onTogglePlaylist}
            aria-label={isPlaylistOpen ? 'Close playlist' : 'Open playlist'}
            aria-expanded={isPlaylistOpen}
            title="Playlist (Esc to close)"
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90 ${
              isPlaylistOpen
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
