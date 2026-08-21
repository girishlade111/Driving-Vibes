export type BackgroundType = 'image' | 'video' | 'canvas' | 'custom';

export type TimeOfDayMode = 'auto' | 'day' | 'sunset' | 'night' | 'cyberpunk' | 'off';

export interface BackgroundPreset {
  id: string;
  name: string;
  type: BackgroundType;
  thumbnail: string;
  tag: string;
  description?: string;
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
    tag: 'Default Art',
    thumbnail: '🚗',
    description: 'Iconic aesthetic lo-fi driving illustration',
    imageSrc: {
      desktop: '/backgrounds/desktop-background.png',
      mobile: '/backgrounds/mobile-background.png',
      desktopGif: '/backgrounds/desktop-background.gif',
      mobileGif: '/backgrounds/mobile-background.gif',
    },
  },
  {
    id: 'tokyo_neon',
    name: 'Tokyo Neon Highway',
    type: 'image',
    tag: 'Neon City',
    thumbnail: '🌃',
    description: 'Rainy asphalt reflections & illuminated skyscrapers',
    imageSrc: {
      desktop: '/backgrounds/tokyo-neon-desktop.jpg',
      mobile: '/backgrounds/tokyo-neon-mobile.jpg',
    },
    overlayTint: 'rgba(5, 5, 20, 0.2)',
  },
  {
    id: 'sunset_coast',
    name: 'Pacific Coastal Sunset',
    type: 'image',
    tag: 'Golden Coast',
    thumbnail: '🌅',
    description: 'Golden hour sunset over scenic ocean cliffs',
    imageSrc: {
      desktop: '/backgrounds/sunset-coast-desktop.jpg',
      mobile: '/backgrounds/sunset-coast-mobile.jpg',
    },
    overlayTint: 'rgba(25, 10, 5, 0.15)',
  },
  {
    id: 'rainy_windshield',
    name: 'Rainy Windshield Bokeh',
    type: 'image',
    tag: 'Moody Rain',
    thumbnail: '🌧️',
    description: 'Night traffic blurred through windshield rain',
    imageSrc: {
      desktop: '/backgrounds/rainy-drive-desktop.jpg',
      mobile: '/backgrounds/rainy-drive-mobile.jpg',
    },
    overlayTint: 'rgba(5, 10, 20, 0.2)',
  },
  {
    id: 'mountain_pass',
    name: 'Midnight Mountain Pass',
    type: 'image',
    tag: 'Alpine Mist',
    thumbnail: '⛰️',
    description: 'Foggy pine forest serpentines under moonlight',
    imageSrc: {
      desktop: '/backgrounds/mountain-pass-desktop.jpg',
      mobile: '/backgrounds/mountain-pass-mobile.jpg',
    },
    overlayTint: 'rgba(8, 12, 22, 0.2)',
  },
  {
    id: 'synthwave_outrun',
    name: 'Synthwave Sunset Grid',
    type: 'image',
    tag: "Synthwave '84",
    thumbnail: '🌌',
    description: 'Neon wireframe horizon & retro dusk highway',
    imageSrc: {
      desktop: '/backgrounds/synthwave-outrun-desktop.jpg',
      mobile: '/backgrounds/synthwave-outrun-mobile.jpg',
    },
    overlayTint: 'rgba(18, 5, 28, 0.2)',
  },
  {
    id: 'desert_stars',
    name: '4AM Desert Starlight',
    type: 'image',
    tag: 'Milky Way',
    thumbnail: '✨',
    description: 'Open desert highway beneath cosmic starlight',
    imageSrc: {
      desktop: '/backgrounds/desert-stars-desktop.jpg',
      mobile: '/backgrounds/desert-stars-mobile.jpg',
    },
    overlayTint: 'rgba(2, 6, 20, 0.2)',
  },
];
