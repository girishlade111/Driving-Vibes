import { Track } from '../../types/music';
import { RepeatMode } from '../../hooks/useAudioPlayer';
import { SpeedUnit } from '../../hooks/useGpsSpeedometer';

export type HudThemeId = 'cyber_neon' | 'sport_gt' | 'stealth_oled' | 'golden_touring';

export interface HudThemeConfig {
  id: HudThemeId;
  name: string;
  tag: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  gaugeBorder: string;
  trackTextColor: string;
  desc: string;
}

export const HUD_THEMES: HudThemeConfig[] = [
  {
    id: 'cyber_neon',
    name: 'Cyberpunk Neon',
    tag: 'Holo HUD',
    emoji: '⚡',
    primaryColor: '#00ffff',
    secondaryColor: '#ec4899',
    accentColor: '#38bdf8',
    glowColor: 'rgba(0, 255, 255, 0.45)',
    bgGradient: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.08) 0%, rgba(2, 6, 23, 0.95) 75%)',
    gaugeBorder: 'border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.35)]',
    trackTextColor: 'text-white',
    desc: 'Electric cyan telemetry, neon magenta highlights & holographic HUD aesthetics.',
  },
  {
    id: 'sport_gt',
    name: 'Sport GT Track',
    tag: 'Race Cluster',
    emoji: '🏎️',
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    accentColor: '#fbbf24',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    bgGradient: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.07) 0%, rgba(10, 5, 5, 0.96) 80%)',
    gaugeBorder: 'border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.35)]',
    trackTextColor: 'text-amber-100',
    desc: 'Amber & racing red tachometer arc, G-Force indicators, and high-contrast sport dials.',
  },
  {
    id: 'stealth_oled',
    name: 'Midnight Stealth',
    tag: 'Pure OLED',
    emoji: '🌙',
    primaryColor: '#ffffff',
    secondaryColor: '#94a3b8',
    accentColor: '#e2e8f0',
    glowColor: 'rgba(255, 255, 255, 0.25)',
    bgGradient: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.98) 85%)',
    gaugeBorder: 'border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.15)]',
    trackTextColor: 'text-white',
    desc: 'Monochrome high-contrast typography designed for zero glare during pitch-black night drives.',
  },
  {
    id: 'golden_touring',
    name: 'Golden Vista Touring',
    tag: 'Grand Tourer',
    emoji: '🌅',
    primaryColor: '#fbbf24',
    secondaryColor: '#f97316',
    accentColor: '#fde047',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    bgGradient: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.08) 0%, rgba(15, 8, 4, 0.96) 80%)',
    gaugeBorder: 'border-amber-300/50 shadow-[0_0_45px_rgba(251,191,36,0.3)]',
    trackTextColor: 'text-amber-50',
    desc: 'Warm sunset titanium dials, analog scale marks, and luxury cruiser telemetry.',
  },
];

export interface CarModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
  onSeek: (seconds: number) => void;
  isVoiceListening: boolean;
  isVoiceSupported: boolean;
  lastVoiceCommand: string | null;
  onToggleVoice: () => void;
}
