export type BackgroundType = 'image' | 'video' | 'canvas' | 'custom';

export type TimeOfDayMode = 'auto' | 'day' | 'sunset' | 'night' | 'cyberpunk' | 'off';

export interface BackgroundPreset {
  id: string;
  name: string;
  type: BackgroundType;
  thumbnail: string;
  tag: string;
  videoSrc?: {
    desktop: string;
    mobile?: string;
  };
  imageSrc?: {
    desktop: string;
    mobile: string;
    desktopGif?: string;
    mobileGif?: string;
  };
  overlayTint?: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'classic_cinematic',
    name: 'Classic Driving Art',
    type: 'image',
    tag: 'Original Art',
    thumbnail: '🚗',
    imageSrc: {
      desktop: '/backgrounds/desktop-background.png',
      mobile: '/backgrounds/mobile-background.png',
      desktopGif: '/backgrounds/desktop-background.gif',
      mobileGif: '/backgrounds/mobile-background.gif',
    },
  },
  {
    id: 'tokyo_night',
    name: 'Tokyo Neon Highway',
    type: 'video',
    tag: '4K Video Loop',
    thumbnail: '🌃',
    videoSrc: {
      desktop: 'https://assets.mixkit.co/videos/preview/mixkit-night-traffic-in-a-japanese-city-43403-large.mp4',
      mobile: 'https://assets.mixkit.co/videos/preview/mixkit-night-traffic-in-a-japanese-city-43403-large.mp4',
    },
    overlayTint: 'rgba(5, 5, 15, 0.35)',
  },
  {
    id: 'rainy_windshield',
    name: 'Rainy Highway Drive',
    type: 'video',
    tag: '4K Video Loop',
    thumbnail: '🌧️',
    videoSrc: {
      desktop: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-falling-on-a-glass-window-41851-large.mp4',
      mobile: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-falling-on-a-glass-window-41851-large.mp4',
    },
    overlayTint: 'rgba(5, 10, 20, 0.4)',
  },
  {
    id: 'sunset_coastline',
    name: 'Sunset Coastal Road',
    type: 'video',
    tag: 'HD Video Loop',
    thumbnail: '🌅',
    videoSrc: {
      desktop: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-crashing-on-a-rocky-shore-at-41584-large.mp4',
      mobile: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-crashing-on-a-rocky-shore-at-41584-large.mp4',
    },
    overlayTint: 'rgba(25, 10, 5, 0.3)',
  },
  {
    id: 'cyberpunk_speed',
    name: 'Synthwave Night Grid',
    type: 'video',
    tag: 'Motion Loop',
    thumbnail: '🌌',
    videoSrc: {
      desktop: 'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-neon-lights-42999-large.mp4',
      mobile: 'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-neon-lights-42999-large.mp4',
    },
    overlayTint: 'rgba(15, 0, 25, 0.35)',
  },
];
