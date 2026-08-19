import React, { useState, useEffect } from 'react';

interface BackgroundProps {
  desktopSrc?: string;
  mobileSrc?: string;
  desktopGif?: string;
  mobileGif?: string;
  isAnimated?: boolean;
}

export const Background: React.FC<BackgroundProps> = ({
  desktopSrc = '/backgrounds/desktop-background.png',
  mobileSrc = '/backgrounds/mobile-background.png',
  desktopGif = '/backgrounds/desktop-background.gif',
  mobileGif = '/backgrounds/mobile-background.gif',
  isAnimated = false,
}) => {
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);

  /**
   * Preload GIFs as soon as the component mounts so the toggle feels instant.
   * We detect the device type once and only preload the relevant GIF.
   */
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const gifSrc = isMobile ? mobileGif : desktopGif;

    const img = new Image();
    img.onload = () => setGifLoaded(true);
    img.onerror = () => setGifLoaded(false);
    img.src = gifSrc;
  }, [desktopGif, mobileGif]);

  return (
    <div
      className="fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden pointer-events-none select-none z-0 bg-black"
      aria-hidden="true"
    >
      {/* ── Static PNG layer (always mounted, fades out when animated is on) ── */}
      <picture
        className="absolute inset-0 w-full h-full block"
        style={{
          opacity: isAnimated ? 0 : 1,
          transition: 'opacity 600ms ease-in-out',
        }}
      >
        <source media="(max-width: 767px)" srcSet={mobileSrc} />
        <source media="(min-width: 768px)" srcSet={desktopSrc} />
        <img
          src={desktopSrc}
          alt=""
          role="presentation"
          className={`w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-700 ease-out ${
            staticLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setStaticLoaded(true)}
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      </picture>

      {/* ── Animated GIF layer (fades in when animated is on) ── */}
      <picture
        className="absolute inset-0 w-full h-full block"
        style={{
          opacity: isAnimated ? 1 : 0,
          transition: 'opacity 600ms ease-in-out',
        }}
      >
        {/* Mobile portrait — mobile GIF only */}
        <source media="(max-width: 767px)" srcSet={mobileGif} />
        {/* Desktop / landscape — desktop GIF only */}
        <source media="(min-width: 768px)" srcSet={desktopGif} />
        <img
          src={desktopGif}
          alt=""
          role="presentation"
          className={`w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-500 ease-out ${
            gifLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          decoding="async"
          loading="lazy"
        />
      </picture>

      {/* ── Minimal bottom vignette for player readability ── */}
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
