import React, { useState, useEffect, useRef } from 'react';
import { BackgroundPreset, TimeOfDayMode } from '../../types/backgroundPresets';

interface BackgroundProps {
  currentPreset?: BackgroundPreset;
  customMediaUrl?: string;
  desktopSrc?: string;
  mobileSrc?: string;
  desktopGif?: string;
  mobileGif?: string;
  isAnimated?: boolean;
  blur?: number; // 0–20
  timeOfDayMode?: TimeOfDayMode;
}

export const Background: React.FC<BackgroundProps> = ({
  currentPreset,
  customMediaUrl,
  desktopSrc = '/backgrounds/desktop-background.png',
  mobileSrc = '/backgrounds/mobile-background.png',
  desktopGif = '/backgrounds/desktop-background.gif',
  mobileGif = '/backgrounds/mobile-background.gif',
  isAnimated = false,
  blur = 0,
  timeOfDayMode = 'auto',
}) => {
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeDesktopSrc = currentPreset?.imageSrc?.desktop || desktopSrc;
  const activeMobileSrc = currentPreset?.imageSrc?.mobile || mobileSrc;
  const activeDesktopGif = currentPreset?.imageSrc?.desktopGif || desktopGif;
  const activeMobileGif = currentPreset?.imageSrc?.mobileGif || mobileGif;

  // Preload GIF if in animated mode
  useEffect(() => {
    if (!activeDesktopGif) return;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const gifSrc = isMobile ? activeMobileGif : activeDesktopGif;
    const img = new Image();
    img.onload = () => setGifLoaded(true);
    img.src = gifSrc;
  }, [activeDesktopGif, activeMobileGif]);

  // Restart video if preset changes
  useEffect(() => {
    setVideoLoaded(false);
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {/* ignore autoplay restrictions */});
    }
  }, [currentPreset?.id, customMediaUrl]);

  // Reset image load state on preset switch for smooth fade
  useEffect(() => {
    setStaticLoaded(false);
  }, [currentPreset?.id, customMediaUrl]);

  // Determine active time of day tint
  const getTimeOfDayTint = (): string => {
    if (timeOfDayMode === 'off') return 'transparent';
    if (timeOfDayMode === 'day') return 'rgba(255, 240, 200, 0.08)';
    if (timeOfDayMode === 'sunset') return 'linear-gradient(to top, rgba(235, 90, 40, 0.22) 0%, rgba(120, 30, 80, 0.2) 60%, transparent 100%)';
    if (timeOfDayMode === 'night') return 'rgba(5, 10, 25, 0.35)';
    if (timeOfDayMode === 'cyberpunk') return 'linear-gradient(to top, rgba(147, 51, 234, 0.25) 0%, rgba(6, 182, 212, 0.2) 100%)';

    // Auto mode: calculate by current hour
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      // Dawn / Sunrise
      return 'linear-gradient(to top, rgba(249, 115, 22, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%)';
    } else if (hour >= 9 && hour < 17) {
      // Day
      return 'rgba(255, 255, 255, 0.04)';
    } else if (hour >= 17 && hour < 20) {
      // Sunset
      return 'linear-gradient(to top, rgba(225, 29, 72, 0.25) 0%, rgba(217, 119, 6, 0.2) 60%, transparent 100%)';
    } else {
      // Night Drive
      return 'rgba(2, 6, 23, 0.38)';
    }
  };

  const isVideo = currentPreset?.type === 'video' || (customMediaUrl && (customMediaUrl.endsWith('.mp4') || customMediaUrl.endsWith('.webm')));
  const videoSrc = customMediaUrl && (customMediaUrl.endsWith('.mp4') || customMediaUrl.endsWith('.webm'))
    ? customMediaUrl
    : currentPreset?.videoSrc?.desktop;

  return (
    <div
      className="fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden pointer-events-none select-none z-0 bg-black"
      aria-hidden="true"
    >
      {/* ── Base Ambient Glow Gradient (Prevents pitch-black flash) ── */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(35, 20, 50, 0.45) 0%, rgba(10, 8, 18, 0.85) 65%, #050508 100%)',
        }}
      />

      {/* ── Layer: Video Background ── */}
      {isVideo && videoSrc && !videoError ? (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => {
            console.warn('Video background failed to load, falling back to artwork.');
            setVideoError(true);
          }}
          className={`absolute inset-0 w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-1000 ease-out ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <>
          {/* ── Layer 1: Static Image (Dual Screen: Desktop 16:9 & Mobile 9:16) ── */}
          <picture
            className="absolute inset-0 w-full h-full block"
            style={{ opacity: isAnimated && activeDesktopGif ? 0 : 1, transition: 'opacity 600ms ease-in-out' }}
          >
            <source media="(max-width: 767px)" srcSet={activeMobileSrc} />
            <source media="(min-width: 768px)" srcSet={activeDesktopSrc} />
            <img
              src={customMediaUrl || activeDesktopSrc}
              alt=""
              role="presentation"
              className="w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-500 ease-out"
              style={{ opacity: staticLoaded ? 1 : 0.8 }}
              onLoad={() => setStaticLoaded(true)}
              onError={() => setStaticLoaded(true)}
              decoding="async"
              loading="eager"
              fetchPriority="high"
            />
          </picture>

          {/* ── Layer 2: Animated GIF (fades in when animated mode active) ── */}
          {activeDesktopGif && (
            <picture
              className="absolute inset-0 w-full h-full block"
              style={{ opacity: isAnimated ? 1 : 0, transition: 'opacity 600ms ease-in-out' }}
            >
              <source media="(max-width: 767px)" srcSet={activeMobileGif} />
              <source media="(min-width: 768px)" srcSet={activeDesktopGif} />
              <img
                src={activeDesktopGif}
                alt=""
                role="presentation"
                className={`w-full h-full min-h-[100dvh] object-cover object-center transition-opacity duration-500 ease-out ${
                  gifLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                decoding="async"
                loading="lazy"
              />
            </picture>
          )}
        </>
      )}

      {/* ── Layer 3: Time-of-Day / Weather Tint ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: getTimeOfDayTint(),
        }}
      />

      {/* ── Layer 4: Custom Preset Overlay Tint ── */}
      {currentPreset?.overlayTint && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: currentPreset.overlayTint }}
        />
      )}

      {/* ── Layer 5: Blur overlay (user-adjustable, 0–20px) ── */}
      {blur > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            transition: 'backdrop-filter 200ms ease-out, -webkit-backdrop-filter 200ms ease-out',
          }}
        />
      )}

      {/* ── Layer 6: Bottom vignette for player readability ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
        }}
      />
    </div>
  );
};
