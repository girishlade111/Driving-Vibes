import React from 'react';
import { Sparkles, ImageIcon } from 'lucide-react';

interface AnimationToggleProps {
  isAnimated: boolean;
  onToggle: () => void;
}

export const AnimationToggle: React.FC<AnimationToggleProps> = ({
  isAnimated,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isAnimated ? 'Switch to static background' : 'Switch to animated background'}
      title={isAnimated ? 'Static background' : 'Animated background'}
      className={[
        // Position — top-right, above safe area
        'fixed top-4 right-4 z-30',
        // Size — compact 36×36 pill
        'w-9 h-9 flex items-center justify-center rounded-full',
        // Glassmorphism surface matching the player aesthetic
        'glass-player',
        // Interactive states
        'transition-all duration-300 ease-out',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        // Active vs inactive colour + living glow when animated
        isAnimated
          ? 'text-white/90 bg-white/15 toggle-active-glow'
          : 'text-white/40 hover:text-white/70',
      ].join(' ')}
    >
      {/* Icon morphs between Sparkles (animated) and ImageIcon (static) */}
      <span
        className={`absolute transition-all duration-300 ${
          isAnimated ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-12'
        }`}
        aria-hidden="true"
      >
        <Sparkles className="w-[15px] h-[15px]" />
      </span>
      <span
        className={`absolute transition-all duration-300 ${
          isAnimated ? 'opacity-0 scale-75 -rotate-12' : 'opacity-100 scale-100 rotate-0'
        }`}
        aria-hidden="true"
      >
        <ImageIcon className="w-[15px] h-[15px]" />
      </span>
    </button>
  );
};
