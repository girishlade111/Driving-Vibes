import React from 'react';

interface MusicWaveProps {
  isVisible: boolean;  // settings toggle
  isPlaying: boolean;  // audio state
}

const NUM_BARS = 38;

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

export const MusicWave: React.FC<MusicWaveProps> = ({ isVisible, isPlaying }) => {
  return (
    <div
      aria-hidden="true"
      className="fixed left-1/2 -translate-x-1/2 flex items-end gap-[2.5px] transition-opacity duration-500"
      style={{
        // Sit just above the centred player (player height ≈ 60 px, gap 14 px)
        bottom: 'calc(50vh + 44px)',
        zIndex: 29,
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      {BAR_CONFIGS.map((cfg, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: '2.5px',
            // CSS custom properties drive the keyframe animation
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
