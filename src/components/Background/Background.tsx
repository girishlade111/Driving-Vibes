import React, { useState } from 'react';

interface BackgroundProps {
  desktopSrc?: string;
  mobileSrc?: string;
}

export const Background: React.FC<BackgroundProps> = ({
  desktopSrc = '/backgrounds/desktop-background.png',
  mobileSrc = '/backgrounds/mobile-background.png',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div 
      className="fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden pointer-events-none select-none z-0 bg-black"
      aria-hidden="true"
    >
      {/* Responsive Picture Element */}
      <picture className="w-full h-full">
        {/* Mobile portrait & narrow screens (under 768px) */}
        <source
          media="(max-width: 767px)"
          srcSet={mobileSrc}
          type="image/png"
        />
        {/* Desktop / tablet landscape (768px and wider) */}
        <source
          media="(min-width: 768px)"
          srcSet={desktopSrc}
          type="image/png"
        />
        {/* Fallback image */}
        <img
          src={desktopSrc}
          alt="Cinematic background atmosphere"
          className={`w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-700 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          decoding="async"
          loading="eager"
        />
      </picture>

      {/* Subtle bottom gradient to ensure player readability while keeping 95% of background pure */}
      <div 
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 via-black/15 to-transparent pointer-events-none"
      />
    </div>
  );
};
