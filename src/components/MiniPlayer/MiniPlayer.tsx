import React, { useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ListMusic, Loader2,
  Shuffle, Repeat, Repeat1,
} from 'lucide-react';
import { Track } from '../../types/music';
import { RepeatMode } from '../../hooks/useAudioPlayer';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  isTracksLoading: boolean;
  currentTime: number;
  duration: number;
  isPlaylistOpen: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlaylist: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  isLoading,
  isTracksLoading,
  currentTime,
  duration,
  isPlaylistOpen,
  isShuffle,
  repeatMode,
  onTogglePlay,
  onPrevious,
  onNext,
  onTogglePlaylist,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const showSpinner = isLoading || isTracksLoading;
  const playDisabled = isTracksLoading || !currentTrack;

  // ── Repeat icon & tooltip ─────────────────────────────────────────────
  const repeatTitle =
    repeatMode === 'off' ? 'Repeat: Off (R)' :
    repeatMode === 'all' ? 'Repeat: All (R)' :
                           'Repeat: One (R)';

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  // ── Shared icon-button class factory ─────────────────────────────────
  const iconBtn = (active: boolean, extra = '') =>
    [
      'w-8 h-8 flex items-center justify-center rounded-full',
      'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-90',
      active
        ? 'text-white bg-white/18 shadow-inner'
        : 'text-white/45 hover:text-white hover:bg-white/10',
      extra,
    ].join(' ');

  return (
    <nav
      aria-label="Audio player controls"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[calc(100vw-24px)] sm:w-[480px] md:w-[520px] select-none animate-fadeIn"
    >
      <div className="glass-player relative flex items-center px-2.5 sm:px-3.5 py-2.5 rounded-full overflow-hidden group shadow-2xl">

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
          className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10 hover:h-[4px] cursor-pointer transition-all duration-200"
        >
          <div
            className="h-full bg-white/80 rounded-r-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── Far-Left: Shuffle ── */}
        <div className="shrink-0 mr-0.5">
          <button
            onClick={onToggleShuffle}
            disabled={playDisabled}
            aria-label={isShuffle ? 'Shuffle: On' : 'Shuffle: Off'}
            aria-pressed={isShuffle}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'} (S)`}
            className={iconBtn(isShuffle, 'disabled:opacity-30 disabled:pointer-events-none')}
          >
            {/* Active dot indicator under icon */}
            <span className="relative">
              <Shuffle className="w-3.5 h-3.5" />
              {isShuffle && (
                <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </span>
          </button>
        </div>

        {/* ── Playback Controls: Prev / Play / Next ── */}
        <div className="flex items-center gap-0.5 shrink-0">
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

          {/* Play / Pause */}
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

        {/* ── Right controls: Repeat + Playlist ── */}
        <div className="flex items-center gap-0.5 shrink-0 ml-0.5">
          {/* Repeat */}
          <button
            onClick={onCycleRepeat}
            disabled={playDisabled}
            aria-label={repeatTitle}
            aria-pressed={repeatMode !== 'off'}
            title={repeatTitle}
            className={iconBtn(repeatMode !== 'off', 'disabled:opacity-30 disabled:pointer-events-none')}
          >
            <span className="relative">
              <RepeatIcon className="w-3.5 h-3.5" />
              {repeatMode !== 'off' && (
                <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </span>
          </button>

          {/* Playlist */}
          <button
            onClick={onTogglePlaylist}
            aria-label={isPlaylistOpen ? 'Close playlist' : 'Open playlist'}
            aria-expanded={isPlaylistOpen}
            title="Playlist (Esc to close)"
            className={iconBtn(isPlaylistOpen)}
          >
            <ListMusic className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </nav>
  );
};
