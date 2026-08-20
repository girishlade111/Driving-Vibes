import { Track } from '../../types/music';
import { BackgroundPreset } from '../../types/backgroundPresets';

export type TemplateId =
  | 'neo_tokyo'
  | 'film_portra'
  | 'golden_hour'
  | 'swiss_minimal'
  | 'synthwave_84'
  | 'rainy_windshield'
  | 'cosmic_odyssey';

export interface TemplateConfig {
  id: TemplateId;
  label: string;
  subtitle: string;
  emoji: string;
  tag: string;
  primaryColor: string;
  secondaryColor: string;
  defaultFilter: ColorFilterId;
  defaultFont: FontStyleId;
  defaultBadges: BadgeId[];
  desc: string;
}

export type SizeId = 'desktop_4k' | 'mobile_story' | 'postcard' | 'square_album' | 'ultrawide';

export interface SizeOption {
  id: SizeId;
  label: string;
  aspect: string;
  w: number;
  h: number;
  hint: string;
  iconName: 'monitor' | 'smartphone' | 'mail' | 'square' | 'tv';
}

export type FontStyleId =
  | 'outfit'
  | 'cinzel'
  | 'playfair'
  | 'mono'
  | 'syne'
  | 'caveat';

export interface FontStyleOption {
  id: FontStyleId;
  label: string;
  fontFamily: string;
  previewSample: string;
  styleDesc: string;
}

export type ColorFilterId =
  | 'natural'
  | 'teal_orange'
  | 'cyber_neon'
  | 'vintage_sepia'
  | 'golden_hour'
  | 'noir_bw'
  | 'vaporwave';

export interface ColorFilterOption {
  id: ColorFilterId;
  label: string;
  previewGradient: string;
  cssFilter?: string;
}

export type BadgeId =
  | 'kanji_stamp'
  | 'telemetry_hud'
  | 'film_border'
  | 'postmark_stamp'
  | 'audio_waveform'
  | 'sound_barcode'
  | 'color_palette'
  | 'orange_date_stamp';

export interface BadgeOption {
  id: BadgeId;
  label: string;
  desc: string;
  category: 'cyber' | 'retro' | 'minimal' | 'audio';
  icon: string;
}

export type BackdropSource = 'app_current' | 'curated' | 'custom_upload' | 'procedural';

export interface CuratedBackdrop {
  id: string;
  title: string;
  subtitle: string;
  category: 'Night' | 'Sunset' | 'Rain' | 'Retro' | 'Nature';
  url: string;
  thumbnail: string;
}

export interface KanjiStampPreset {
  id: string;
  kanji: string;
  romaji: string;
  english: string;
}

export interface TelemetryPreset {
  id: string;
  title: string;
  coordinates: string;
  speed: string;
  altitude: string;
  heading: string;
  frequency: string;
}

export interface PostcardRenderState {
  template: TemplateId;
  size: SizeId;
  backdropSource: BackdropSource;
  curatedBackdropId: string;
  customBackdropUrl: string | null;
  trackTitle: string;
  artistName: string;
  quote: string;
  customMessage: string;
  fontStyle: FontStyleId;
  colorFilter: ColorFilterId;
  activeBadges: Record<BadgeId, boolean>;
  selectedKanjiId: string;
  selectedTelemetryId: string;
  
  // FX Sliders (0 - 100)
  grainIntensity: number;
  scanlinesIntensity: number;
  vignetteIntensity: number;
  blurIntensity: number;
  contrastAmount: number;
  saturationAmount: number;
  lightLeakIntensity: number;
}

export interface PostcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  accentColor?: string;
  activeBgPreset?: BackgroundPreset;
  customBgUrl?: string;
  onApplyWallpaper?: (imageUrl: string) => void;
}
