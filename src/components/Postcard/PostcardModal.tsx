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


// ── Canvas helpers ──────────────────────────────────────────────────────────

/** Draw a subtle noise/film-grain texture using tiny random rects */
function drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.04) {
  for (let i = 0; i < w * h * 0.012; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = Math.random() * 2 + 0.5;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * alpha})`;
    ctx.fillRect(x, y, s, s);
  }
}

/** Horizontal scan lines */
function drawScanLines(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.06) {
  ctx.save();
  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, y, w, 2);
  }
  ctx.restore();
}

/** Draw an animated-looking waveform bar strip */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  x0: number, y: number, totalW: number,
  color: string, barW = 4, gap = 6, seed = 1
) {
  ctx.save();
  const count = Math.floor(totalW / (barW + gap));
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const h = (Math.sin(t * Math.PI * 6 + seed) * 0.4 + Math.cos(t * Math.PI * 11 + seed * 2) * 0.3 + 0.3) * 36 + 6;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x0 + i * (barW + gap), y - h / 2, barW, h, 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Rounded rectangle stroke helper */
function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, color: string, lw: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

/** Filled rounded rectangle helper */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

/** Wrap long text to multiple lines, returns array of lines */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Shared meta footer (date, branding) */
function drawFooter(
  ctx: CanvasRenderingContext2D, w: number, h: number, pad: number,
  metaColor: string, trackName: string
) {
  const now = new Date();
  const date = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.font = `500 ${Math.round(w * 0.013)}px Outfit, sans-serif`;
  ctx.fillStyle = metaColor;
  ctx.textAlign = 'left';
  ctx.fillText(`${date}  ·  ${time}  ·  ${trackName}`, pad, h - pad + 4);
  ctx.textAlign = 'right';
  ctx.fillText('ladestack.in/driving-vibes', w - pad, h - pad + 4);
  ctx.textAlign = 'left';
}
