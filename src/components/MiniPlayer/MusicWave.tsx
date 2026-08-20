import React from 'react';
import { PlayerPosition } from '../../App';

interface MusicWaveProps {
  isVisible: boolean;      // settings toggle
  isPlaying: boolean;      // audio state
  playerPosition: PlayerPosition;
}

const NUM_BARS = 38;

// Player pill height ≈ 60px, gap above player = 14px
const PLAYER_HEIGHT_PX  = 60;
const WAVE_GAP_PX       = 14;

/**
 * Deterministic bar configs — no randomness so the wave is consistent
 * across re-renders. Uses a bell-curve height distribution so centre bars
 * are tallest, giving a natural equalizer silhouette.
 */
const BAR_CONFIGS = Array.from({ length: NUM_BARS }, (_, i) => {
  const center   = (NUM_BARS - 1) / 2;
  const dist     = Math.abs(i - center) / center;           // 0 = center, 1 = edge
  const maxH     = Math.round(54 * (1 - dist * 0.58));     // 54 → 23 px
  const minH     = Math.max(3, Math.round(maxH * 0.14));   // resting height
  // Spread durations & delays across prime-number-based cycles for variety
  const duration = +(0.55 + (i % 7) * 0.11).toFixed(2);   // 0.55 → 1.21 s
  const delay    = +((i % 11) * 0.06).toFixed(2);          // 0 → 0.60 s
  // Bar opacity — centre bars slightly brighter
  const opacity  = 0.28 + (1 - dist) * 0.42;              // 0.28 → 0.70

  return { maxH, minH, duration, delay, opacity };
});

export const MusicWave: React.FC<MusicWaveProps> = ({ isVisible, isPlaying, playerPosition }) => {
  /**
   * bottom position calculation:
   *
   * center mode → player is vertically centred (top: 50vh, -translate-y-1/2).
   *   Wave sits just above it:
   *   bottom = 50vh + (playerHeight / 2) + gap  ≈  50vh + 44px
   *
   * bottom mode → player bottom edge is at: calc(20px + safe-area).
   *   Wave sits just above the player top edge:
   *   bottom = playerBottomOffset + playerHeight + gap
   *          = (20px + safe-area) + 60px + 14px
   *          = calc(94px + env(safe-area-inset-bottom, 0px))
   */
  const bottomStyle: React.CSSProperties =
    playerPosition === 'bottom'
      ? {
          bottom: `calc(${PLAYER_HEIGHT_PX + WAVE_GAP_PX + 20}px + env(safe-area-inset-bottom, 0px))`,
          transition: 'bottom 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        }
      : {
          bottom: `calc(50vh + ${Math.round(PLAYER_HEIGHT_PX / 2) + WAVE_GAP_PX}px)`,
          transition: 'bottom 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        };

  return (
    <div
      aria-hidden="true"
      className="fixed left-1/2 -translate-x-1/2 flex items-end gap-[2.5px]"
      style={{
        ...bottomStyle,
        zIndex: 29,
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'none',
        transition: `bottom 500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 500ms ease`,
      }}
    >
      {BAR_CONFIGS.map((cfg, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: '2.5px',
            '--min-h': `${cfg.minH}px`,
            '--max-h': `${cfg.maxH}px`,
            height: isPlaying ? `${cfg.maxH}px` : `${cfg.minH}px`,
            background: `rgba(255, 255, 255, ${cfg.opacity})`,
            animation: isPlaying
              ? `waveBar ${cfg.duration}s ease-in-out ${cfg.delay}s infinite alternate`
              : 'none',
            transition: 'height 400ms ease-out',
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
