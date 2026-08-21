import React, { useRef, useState, useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ListMusic, Loader2,
  Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX, Share2, Check,
  CloudRain, Sliders, Car, Timer, Camera, Users,
} from 'lucide-react';
import { Track } from '../../types/music';
import { RepeatMode } from '../../hooks/useAudioPlayer';
import { PlayerPosition } from '../../App';

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
  playerPosition: PlayerPosition;
  volume: number;
  isMuted: boolean;
  ambientActiveCount?: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlaylist: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
  onShare: () => Promise<boolean>;
  onToggleAmbientMixer?: () => void;
  onToggleAudioFx?: () => void;
  onOpenCarMode?: () => void;
  onOpenFocusModal?: () => void;
  onOpenPostcardModal?: () => void;
  onOpenTripModal?: () => void;
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
  playerPosition,
  volume,
  isMuted,
  ambientActiveCount = 0,
  onTogglePlay,
  onPrevious,
  onNext,
  onTogglePlaylist,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onSetVolume,
  onToggleMute,
  onShare,
  onToggleAmbientMixer,
  onToggleAudioFx,
  onOpenCarMode,
  onOpenFocusModal,
  onOpenPostcardModal,
  onOpenTripModal,
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const volumeHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Progress bar click ─────────────────────────────────────────────────
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  // ── Volume slider hover logic ──────────────────────────────────────────
  const handleVolumeEnter = useCallback(() => {
    if (volumeHideTimer.current) clearTimeout(volumeHideTimer.current);
    setShowVolumeSlider(true);
  }, []);

  const handleVolumeLeave = useCallback(() => {
    volumeHideTimer.current = setTimeout(() => setShowVolumeSlider(false), 600);
  }, []);

  // ── Share button ───────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const ok = await onShare();
    if (ok) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [onShare]);

  const showSpinner = isLoading || isTracksLoading;
  const playDisabled = isTracksLoading || !currentTrack;

  // ── Repeat icon & tooltip ─────────────────────────────────────────────
  const repeatTitle =
    repeatMode === 'off' ? 'Repeat: Off (R)' :
    repeatMode === 'all' ? 'Repeat: All (R)' :
                           'Repeat: One (R)';

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  // ── Volume icon ───────────────────────────────────────────────────────
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

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

  // ── Position classes ──────────────────────────────────────────────────
  const positionClass =
    playerPosition === 'bottom'
      ? 'fixed bottom-player-safe left-1/2 -translate-x-1/2'
      : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';

  return (
    <nav
      aria-label="Audio player controls"
      className={`${positionClass} z-30 w-[calc(100vw-20px)] sm:w-[620px] md:w-[680px] select-none animate-fadeIn transition-all duration-500 ease-in-out`}
    >
      <div className="glass-player relative flex items-center px-2 sm:px-3 py-2.5 rounded-full overflow-visible group shadow-2xl">

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
          className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10 hover:h-[4px] cursor-pointer transition-all duration-200 rounded-b-full"
        >
          <div
            className="h-full rounded-r-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progressPercent}%`, background: 'var(--accent, rgba(255,255,255,0.8))' }}
          />
        </div>

        {/* ── Far-Left: Shuffle ── */}
        <div className="shrink-0">
          <button
            onClick={onToggleShuffle}
            disabled={playDisabled}
            aria-label={isShuffle ? 'Shuffle: On' : 'Shuffle: Off'}
            aria-pressed={isShuffle}
            title={`Shuffle: ${isShuffle ? 'On' : 'Off'} (S)`}
            className={iconBtn(isShuffle, 'disabled:opacity-30 disabled:pointer-events-none')}
          >
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
          {isPlaying && !showSpinner && (
            <span className="flex items-end gap-[2px] h-3 mr-1.5 shrink-0" aria-hidden="true">
              <span className="w-[2px] bg-white/80 rounded-full bar-1" />
              <span className="w-[2px] bg-white/80 rounded-full bar-2" />
              <span className="w-[2px] bg-white/80 rounded-full bar-3" />
            </span>
          )}

          <p
            className="text-xs sm:text-[13px] font-medium tracking-wide text-white/90 truncate leading-none flex-1"
            title={currentTrack?.name ?? 'No track selected'}
          >
            {isTracksLoading
              ? 'Loading…'
              : currentTrack
              ? currentTrack.name
              : 'Select a track'}
          </p>
        </div>

        {/* ── Right Feature Buttons: Ambient Mixer + Audio FX + Focus + Postcard + Trip + Car Mode ── */}
        <div className="flex items-center gap-0.5 shrink-0">

          {/* Ambient Mixer */}
          {onToggleAmbientMixer && (
            <button
              onClick={onToggleAmbientMixer}
              aria-label="Ambient Sound Mixer"
              title="Ambient Sound Mixer [A]"
              className={iconBtn(ambientActiveCount > 0)}
            >
              <span className="relative">
                <CloudRain className="w-3.5 h-3.5 text-sky-300" />
                {ambientActiveCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                )}
              </span>
            </button>
          )}

          {/* Audio Equalizer */}
          {onToggleAudioFx && (
            <button
              onClick={onToggleAudioFx}
              aria-label="Equalizer & Sound FX"
              title="Equalizer & Audio FX [E]"
              className={iconBtn(false)}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}

          {/* Focus & Zen Suite */}
          {onOpenFocusModal && (
            <button
              onClick={onOpenFocusModal}
              aria-label="Focus & Zen Suite"
              title="Focus Drive & 432Hz Tones [P]"
              className={iconBtn(false, 'hidden sm:flex')}
            >
              <Timer className="w-3.5 h-3.5 text-emerald-300" />
            </button>
          )}



          {/* Postcard Generator */}
          {onOpenPostcardModal && (
            <button
              onClick={onOpenPostcardModal}
              aria-label="Generate Wallpaper Postcard"
              title="Aesthetic Postcard & Wallpaper"
              className={iconBtn(false, 'hidden md:flex')}
            >
              <Camera className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          )}

          {/* Virtual Road Trip */}
          {onOpenTripModal && (
            <button
              onClick={onOpenTripModal}
              aria-label="Virtual Road Trip"
              title="Listen Together Room"
              className={iconBtn(false, 'hidden md:flex')}
            >
              <Users className="w-3.5 h-3.5 text-indigo-300" />
            </button>
          )}

          {/* Car Driving Mode */}
          {onOpenCarMode && (
            <button
              onClick={onOpenCarMode}
              aria-label="Car Driving Mode"
              title="Car Dashboard HUD [C]"
              className={iconBtn(false, 'hidden sm:flex')}
            >
              <Car className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}

          {/* Volume control with clean floating popup (zero overlap) */}
          <div
            className="relative flex items-center"
            onMouseEnter={handleVolumeEnter}
            onMouseLeave={handleVolumeLeave}
          >
            {showVolumeSlider && (
              <div
                className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl bg-black/90 border border-white/15 shadow-2xl backdrop-blur-xl flex items-center gap-2 z-50 animate-fadeIn min-w-[120px]"
                style={{ pointerEvents: 'auto' }}
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onSetVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className="volume-slider w-20"
                  style={{
                    background: `linear-gradient(to right, rgba(255,255,255,0.85) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.15) ${(isMuted ? 0 : volume) * 100}%)`,
                  }}
                />
                <span className="text-[10px] font-mono text-white/70 min-w-[28px] text-right">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            )}

            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              aria-pressed={isMuted}
              title={isMuted ? 'Unmute (M)' : `Volume ${Math.round(volume * 100)}% (M)`}
              className={iconBtn(isMuted)}
            >
              <VolumeIcon className="w-3.5 h-3.5" />
            </button>
          </div>

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

          {/* Share */}
          {currentTrack && (
            <button
              onClick={handleShare}
              aria-label="Share current track"
              title="Copy link to this track"
              className={iconBtn(shareCopied)}
            >
              {shareCopied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

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
