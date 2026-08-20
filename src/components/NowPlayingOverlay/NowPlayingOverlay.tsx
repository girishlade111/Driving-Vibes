import React, { useEffect, useState, useRef } from 'react';
import { Music2 } from 'lucide-react';

interface NowPlayingOverlayProps {
  trackName: string | null;
  isPlaying: boolean;
  isEnabled: boolean;
}

/**
 * Animated "Now Playing" overlay that briefly appears when a track changes.
 * Slides in from the left at the top of the screen for ~3 seconds then fades out.
 */
export const NowPlayingOverlay: React.FC<NowPlayingOverlayProps> = ({
  trackName,
  isPlaying,
  isEnabled,
}) => {
  const [visible, setVisible] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTrackRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isEnabled || !trackName || !isPlaying) return;

    // Only trigger when track actually changes
    if (trackName === prevTrackRef.current && visible) return;
    prevTrackRef.current = trackName;

    // Clear any running timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setDisplayName(trackName);
    setExiting(false);
    setVisible(true);

    // Start exit animation after 2.8s, fully hide at 3.2s
    timerRef.current = setTimeout(() => {
      setExiting(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 320);
    }, 2800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trackName, isPlaying, isEnabled]);

  if (!visible || !displayName) return null;

  return (
    <div
      aria-live="polite"
      aria-label={`Now playing: ${displayName}`}
      className={`fixed top-4 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2.5 glass-player rounded-2xl shadow-xl max-w-[calc(100vw-88px)] sm:max-w-xs ${
        exiting ? 'animate-slideOutLeft' : 'animate-slideInLeft'
      }`}
      style={{ pointerEvents: 'none' }}
    >
      {/* Pulsing music icon */}
      <span className="shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
        <Music2 className="w-3.5 h-3.5 text-white/70" />
      </span>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-white/35 leading-none mb-0.5">
          Now Playing
        </p>
        <p className="text-[13px] font-medium text-white/90 truncate leading-tight">
          {displayName}
        </p>
      </div>
    </div>
  );
};
