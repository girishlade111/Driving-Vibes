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
      {/*
       * <picture> with <source media> ensures the browser only downloads
       * the image that matches the current viewport — never both.
       *
       * No `type` attribute on <source> so it works with .jpg, .png, .webp, etc.
       * without requiring changes here when the file format changes.
       */}
      <picture className="block w-full h-full">
        {/* Mobile portrait screens — loads ONLY mobile-background */}
        <source media="(max-width: 767px)" srcSet={mobileSrc} />
        {/* Desktop, laptops, landscape tablets — loads ONLY desktop-background */}
        <source media="(min-width: 768px)" srcSet={desktopSrc} />
        {/* Fallback <img> — also the element whose `onLoad` we listen to */}
        <img
          src={desktopSrc}
          alt=""
          role="presentation"
          className={`w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-700 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      </picture>

      {/*
       * Minimal bottom gradient — only enough to guarantee player readability.
       * Keeps 95%+ of the background image visually pure.
       */}
      <div
        className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.12) 60%, transparent 100%)',
        }}
      />
    </div>
  );
};
