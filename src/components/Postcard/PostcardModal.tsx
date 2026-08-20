import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Download, Sparkles, X, Check, RefreshCw, Type, Image as ImageIcon,
} from 'lucide-react';
import { Track } from '../../types/music';

interface PostcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  accentColor: string;
}

// ── Template definitions ────────────────────────────────────────────────────
type TemplateId = 'midnight' | 'neon' | 'film' | 'dawn' | 'mono';

interface Template {
  id: TemplateId;
  label: string;
  emoji: string;
  desc: string;
}

const TEMPLATES: Template[] = [
  { id: 'midnight', label: 'Midnight Drive',  emoji: '🌙', desc: 'Deep navy • amber glow' },
  { id: 'neon',     label: 'Neon Highway',    emoji: '⚡', desc: 'Electric cyan • magenta' },
  { id: 'film',     label: 'Film Grain',       emoji: '🎞', desc: 'Sepia • analog warmth' },
  { id: 'dawn',     label: 'Golden Hour',      emoji: '🌅', desc: 'Sunrise • warm gradients' },
  { id: 'mono',     label: 'Monochrome',       emoji: '◼', desc: 'Pure black & white' },
];

// ── Size definitions ────────────────────────────────────────────────────────
type SizeId = 'postcard' | 'desktop' | 'mobile' | 'square';

interface SizeOption {
  id: SizeId;
  label: string;
  w: number;
  h: number;
  hint: string;
}

const SIZES: SizeOption[] = [
  { id: 'postcard', label: 'Postcard',      w: 1200, h: 750,  hint: '1200 × 750' },
  { id: 'desktop',  label: 'Desktop HD',    w: 1920, h: 1080, hint: '1920 × 1080' },
  { id: 'mobile',   label: 'Mobile',        w: 1080, h: 1920, hint: '1080 × 1920' },
  { id: 'square',   label: 'Square',        w: 1080, h: 1080, hint: '1080 × 1080' },
];

// ── Mood quotes ─────────────────────────────────────────────────────────────
const QUOTES = [
  'Late night drives with nowhere to go.',
  'Chasing neon lights and quiet highways.',
  'Raindrops on the glass, peace in the mind.',
  'Lost in the rhythm of the open road.',
  'Moments when the music feels like home.',
  'Every mile feels like a memory.',
  'The city fades — only the music remains.',
  'Where the road ends, the vibe begins.',
];
