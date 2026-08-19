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
      style={{ zIndex: 30 }}
      className={[
        // Fixed position — top-right corner
        'fixed top-4 right-4',
        // Size
        'w-9 h-9 rounded-full',
        // Glassmorphism surface
        'glass-player',
        // Interactions
        'transition-all duration-300 ease-out',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
        // Colour state
        isAnimated
          ? 'text-white/90 toggle-active-glow'
          : 'text-white/45 hover:text-white/75',
      ].join(' ')}
    >
      {/*
       * IMPORTANT: the icons must be inside a `relative` positioned wrapper.
       * The button itself is `position: fixed` which does NOT create a containing
       * block for `absolute` children — the wrapper div does.
       */}
      <div className="relative w-full h-full flex items-center justify-center">

        {/* Sparkles — visible when animated ON */}
        <Sparkles
          className="absolute w-[15px] h-[15px] transition-all duration-300"
          style={{
            opacity: isAnimated ? 1 : 0,
            transform: isAnimated ? 'scale(1) rotate(0deg)' : 'scale(0.65) rotate(15deg)',
          }}
          aria-hidden="true"
        />

        {/* ImageIcon — visible when animated OFF */}
        <ImageIcon
          className="absolute w-[15px] h-[15px] transition-all duration-300"
          style={{
            opacity: isAnimated ? 0 : 1,
            transform: isAnimated ? 'scale(0.65) rotate(-15deg)' : 'scale(1) rotate(0deg)',
          }}
          aria-hidden="true"
        />
      </div>
    </button>
  );
};
