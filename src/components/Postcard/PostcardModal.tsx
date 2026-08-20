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


// ── Template: Midnight Drive ────────────────────────────────────────────────
function drawMidnight(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  trackName: string, quote: string, customMsg: string
) {
  const pad = Math.round(w * 0.05);

  // Deep background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#04071a');
  bg.addColorStop(0.5, '#080c1e');
  bg.addColorStop(1, '#02040e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Amber radial glow top-right
  const g1 = ctx.createRadialGradient(w * 0.82, h * 0.18, 10, w * 0.82, h * 0.18, w * 0.45);
  g1.addColorStop(0, 'rgba(245,158,11,0.22)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  // Cyan glow bottom-left
  const g2 = ctx.createRadialGradient(w * 0.1, h * 0.8, 10, w * 0.1, h * 0.8, w * 0.35);
  g2.addColorStop(0, 'rgba(56,189,248,0.14)');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  // Outer border frame
  strokeRoundRect(ctx, pad * 0.5, pad * 0.5, w - pad, h - pad, 18, 'rgba(255,255,255,0.12)', 1.5);

  // Top label
  const labelSize = Math.round(w * 0.012);
  ctx.font = `600 ${labelSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'left';
  ctx.fillText('DRIVING VIBES  ·  CINEMATIC SOUNDSCAPE', pad, pad * 1.5);
  ctx.letterSpacing = '0px';

  // Thin divider
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad * 1.7);
  ctx.lineTo(w - pad, pad * 1.7);
  ctx.stroke();

  // Track name
  const titleSize = Math.min(Math.round(w * 0.052), 72);
  ctx.font = `800 ${titleSize}px Outfit, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  const wrappedTitle = wrapText(ctx, trackName, w - pad * 2.5);
  const titleY = h * 0.44;
  wrappedTitle.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, pad, titleY + i * (titleSize * 1.15));
  });

  // Quote
  const quoteSize = Math.round(w * 0.022);
  ctx.font = `300 italic ${quoteSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(245,158,11,0.9)';
  ctx.fillText(`"${quote}"`, pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 1.6);

  // Custom message
  if (customMsg.trim()) {
    const msgSize = Math.round(w * 0.018);
    ctx.font = `400 ${msgSize}px Outfit, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(customMsg.trim(), pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 3.4);
  }

  // Waveform
  drawWaveform(ctx, pad, h * 0.82, w - pad * 2, 'rgba(245,158,11,0.7)', Math.round(w * 0.003), Math.round(w * 0.005), 1.4);

  // Footer
  drawFooter(ctx, w, h, pad, 'rgba(255,255,255,0.28)', trackName);

  // Film grain & scan lines
  drawGrain(ctx, w, h, 0.035);
  drawScanLines(ctx, w, h, 0.04);
}

// ── Template: Neon Highway ──────────────────────────────────────────────────
function drawNeon(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  trackName: string, quote: string, customMsg: string
) {
  const pad = Math.round(w * 0.05);

  // Pure black background
  ctx.fillStyle = '#000005';
  ctx.fillRect(0, 0, w, h);

  // Cyan glow center-top
  const g1 = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, h * 0.75);
  g1.addColorStop(0, 'rgba(0,255,255,0.10)');
  g1.addColorStop(0.5, 'rgba(168,85,247,0.08)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  // Magenta glow bottom-right
  const g2 = ctx.createRadialGradient(w * 0.85, h * 0.85, 0, w * 0.85, h * 0.85, w * 0.5);
  g2.addColorStop(0, 'rgba(236,72,153,0.18)');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  // Grid lines perspective
  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    const x = (w / 12) * i;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let j = 0; j <= 8; j++) {
    const y = (h / 8) * j;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();

  // Neon border — cyan
  strokeRoundRect(ctx, pad * 0.5, pad * 0.5, w - pad, h - pad, 12,
    'rgba(0,255,255,0.45)', 2);
  // inner glow repeat
  strokeRoundRect(ctx, pad * 0.5 + 4, pad * 0.5 + 4, w - pad - 8, h - pad - 8, 10,
    'rgba(0,255,255,0.12)', 1);

  // Label
  const labelSize = Math.round(w * 0.012);
  ctx.font = `700 ${labelSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(0,255,255,0.7)';
  ctx.letterSpacing = '5px';
  ctx.textAlign = 'left';
  ctx.fillText('DRIVING VIBES  ·  NEON HIGHWAY', pad, pad * 1.5);
  ctx.letterSpacing = '0px';

  // Track name — magenta neon
  const titleSize = Math.min(Math.round(w * 0.052), 72);
  ctx.font = `900 ${titleSize}px Outfit, sans-serif`;
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = 'rgba(255,0,255,0.6)';
  ctx.shadowBlur = Math.round(w * 0.018);
  const wrappedTitle = wrapText(ctx, trackName, w - pad * 2.5);
  const titleY = h * 0.44;
  wrappedTitle.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, pad, titleY + i * (titleSize * 1.15));
  });
  ctx.shadowBlur = 0;

  // Quote — cyan
  const quoteSize = Math.round(w * 0.022);
  ctx.font = `300 italic ${quoteSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(0,255,255,0.85)';
  ctx.fillText(`"${quote}"`, pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 1.6);

  if (customMsg.trim()) {
    const msgSize = Math.round(w * 0.018);
    ctx.font = `400 ${msgSize}px Outfit, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(customMsg.trim(), pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 3.4);
  }

  // Waveform — cyan+magenta alternating
  drawWaveform(ctx, pad, h * 0.82, (w - pad * 2) / 2, 'rgba(0,255,255,0.75)',
    Math.round(w * 0.003), Math.round(w * 0.005), 2.1);
  drawWaveform(ctx, pad + (w - pad * 2) / 2, h * 0.82, (w - pad * 2) / 2, 'rgba(236,72,153,0.75)',
    Math.round(w * 0.003), Math.round(w * 0.005), 0.8);

  drawFooter(ctx, w, h, pad, 'rgba(0,255,255,0.35)', trackName);
  drawGrain(ctx, w, h, 0.025);
  drawScanLines(ctx, w, h, 0.05);
}

// ── Template: Film Grain ────────────────────────────────────────────────────
function drawFilm(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  trackName: string, quote: string, customMsg: string
) {
  const pad = Math.round(w * 0.05);

  // Sepia warm background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#1a1108');
  bg.addColorStop(0.6, '#120d06');
  bg.addColorStop(1, '#0c0803');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Warm amber vignette center
  const g1 = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, w * 0.65);
  g1.addColorStop(0, 'rgba(210,140,40,0.14)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  // Heavy vignette corners
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, w * 0.8);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Film sprocket holes decoration (top)
  ctx.fillStyle = 'rgba(255,220,120,0.08)';
  for (let i = 0; i < 12; i++) {
    const x = (w / 12) * i + w / 24;
    fillRoundRect(ctx, x - 12, 12, 24, 22, 4, 'rgba(0,0,0,0.5)');
    strokeRoundRect(ctx, x - 12, 12, 24, 22, 4, 'rgba(200,160,60,0.3)', 1);
  }
  // Film sprocket holes (bottom)
  for (let i = 0; i < 12; i++) {
    const x = (w / 12) * i + w / 24;
    fillRoundRect(ctx, x - 12, h - 34, 24, 22, 4, 'rgba(0,0,0,0.5)');
    strokeRoundRect(ctx, x - 12, h - 34, 24, 22, 4, 'rgba(200,160,60,0.3)', 1);
  }

  // Label
  const labelSize = Math.round(w * 0.012);
  ctx.font = `600 ${labelSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(210,170,80,0.55)';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'left';
  ctx.fillText('DRIVING VIBES  ·  ANALOG SESSIONS', pad, pad * 1.6);
  ctx.letterSpacing = '0px';

  // Track name — warm white
  const titleSize = Math.min(Math.round(w * 0.052), 72);
  ctx.font = `800 ${titleSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,240,200,0.92)';
  const wrappedTitle = wrapText(ctx, trackName, w - pad * 2.5);
  const titleY = h * 0.44;
  wrappedTitle.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, pad, titleY + i * (titleSize * 1.15));
  });

  // Quote — warm gold
  const quoteSize = Math.round(w * 0.022);
  ctx.font = `300 italic ${quoteSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(210,160,60,0.85)';
  ctx.fillText(`"${quote}"`, pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 1.6);

  if (customMsg.trim()) {
    const msgSize = Math.round(w * 0.018);
    ctx.font = `400 ${msgSize}px Outfit, sans-serif`;
    ctx.fillStyle = 'rgba(255,230,180,0.5)';
    ctx.fillText(customMsg.trim(), pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 3.4);
  }

  // Waveform — amber
  drawWaveform(ctx, pad, h * 0.82, w - pad * 2, 'rgba(210,140,40,0.7)',
    Math.round(w * 0.003), Math.round(w * 0.005), 3.2);

  drawFooter(ctx, w, h, pad, 'rgba(200,160,60,0.35)', trackName);

  // Heavy grain for film look
  drawGrain(ctx, w, h, 0.065);
  drawScanLines(ctx, w, h, 0.035);
}

// ── Template: Golden Hour ───────────────────────────────────────────────────
function drawDawn(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  trackName: string, quote: string, customMsg: string
) {
  const pad = Math.round(w * 0.05);

  // Warm sunrise gradient
  const bg = ctx.createLinearGradient(0, 0, w * 0.3, h);
  bg.addColorStop(0, '#1a0800');
  bg.addColorStop(0.3, '#3d1200');
  bg.addColorStop(0.6, '#6b2700');
  bg.addColorStop(1, '#0d0504');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Orange-gold sun glow upper-center
  const sun = ctx.createRadialGradient(w * 0.55, h * 0.2, 0, w * 0.55, h * 0.2, w * 0.55);
  sun.addColorStop(0, 'rgba(255,180,40,0.35)');
  sun.addColorStop(0.4, 'rgba(255,100,10,0.18)');
  sun.addColorStop(1, 'transparent');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  // Rose glow bottom-left
  const g2 = ctx.createRadialGradient(0, h, 0, 0, h, w * 0.5);
  g2.addColorStop(0, 'rgba(225,50,80,0.22)');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);

  // Vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.82);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Decorative horizontal bars top & bottom
  const barH = Math.round(h * 0.06);
  const barGrad = ctx.createLinearGradient(0, 0, w, 0);
  barGrad.addColorStop(0, 'rgba(255,120,20,0.22)');
  barGrad.addColorStop(0.5, 'rgba(255,180,40,0.12)');
  barGrad.addColorStop(1, 'rgba(255,80,10,0.22)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  // Label
  const labelSize = Math.round(w * 0.012);
  ctx.font = `600 ${labelSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,200,80,0.65)';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'left';
  ctx.fillText('DRIVING VIBES  ·  GOLDEN HOUR', pad, pad * 1.6);
  ctx.letterSpacing = '0px';

  // Track name
  const titleSize = Math.min(Math.round(w * 0.052), 72);
  ctx.font = `800 ${titleSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,240,180,0.95)';
  const wrappedTitle = wrapText(ctx, trackName, w - pad * 2.5);
  const titleY = h * 0.44;
  wrappedTitle.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, pad, titleY + i * (titleSize * 1.15));
  });

  // Quote — rose
  const quoteSize = Math.round(w * 0.022);
  ctx.font = `300 italic ${quoteSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,140,80,0.9)';
  ctx.fillText(`"${quote}"`, pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 1.6);

  if (customMsg.trim()) {
    const msgSize = Math.round(w * 0.018);
    ctx.font = `400 ${msgSize}px Outfit, sans-serif`;
    ctx.fillStyle = 'rgba(255,220,160,0.55)';
    ctx.fillText(customMsg.trim(), pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 3.4);
  }

  // Dual waveform
  drawWaveform(ctx, pad, h * 0.82, w - pad * 2, 'rgba(255,140,40,0.72)',
    Math.round(w * 0.003), Math.round(w * 0.005), 4.7);

  drawFooter(ctx, w, h, pad, 'rgba(255,180,80,0.3)', trackName);
  drawGrain(ctx, w, h, 0.03);
  drawScanLines(ctx, w, h, 0.03);
}

// ── Template: Monochrome ────────────────────────────────────────────────────
function drawMono(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  trackName: string, quote: string, customMsg: string
) {
  const pad = Math.round(w * 0.05);

  // Pure black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  // Subtle center glow
  const g1 = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.55);
  g1.addColorStop(0, 'rgba(255,255,255,0.06)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);

  // Strong white border
  strokeRoundRect(ctx, pad * 0.5, pad * 0.5, w - pad, h - pad, 0,
    'rgba(255,255,255,0.85)', 2.5);
  // Inner thin border
  strokeRoundRect(ctx, pad * 0.5 + 8, pad * 0.5 + 8, w - pad - 16, h - pad - 16, 0,
    'rgba(255,255,255,0.15)', 1);

  // Corner crosshair marks
  const cs = 20;
  const corners = [
    [pad * 0.5, pad * 0.5], [w - pad * 0.5 - cs, pad * 0.5],
    [pad * 0.5, h - pad * 0.5 - cs], [w - pad * 0.5 - cs, h - pad * 0.5 - cs],
  ] as [number, number][];
  corners.forEach(([cx, cy]) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx + cs, cy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + cs); ctx.stroke();
  });

  // Label
  const labelSize = Math.round(w * 0.012);
  ctx.font = `600 ${labelSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'left';
  ctx.fillText('DRIVING VIBES  ·  MONOCHROME', pad, pad * 1.6);
  ctx.letterSpacing = '0px';

  // Horizontal rule
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad * 1.9);
  ctx.lineTo(w - pad, pad * 1.9);
  ctx.stroke();

  // Track name
  const titleSize = Math.min(Math.round(w * 0.052), 72);
  ctx.font = `900 ${titleSize}px Outfit, sans-serif`;
  ctx.fillStyle = '#ffffff';
  const wrappedTitle = wrapText(ctx, trackName, w - pad * 2.5);
  const titleY = h * 0.44;
  wrappedTitle.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, pad, titleY + i * (titleSize * 1.15));
  });

  // Quote — white 60%
  const quoteSize = Math.round(w * 0.022);
  ctx.font = `300 italic ${quoteSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(`"${quote}"`, pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 1.6);

  if (customMsg.trim()) {
    const msgSize = Math.round(w * 0.018);
    ctx.font = `400 ${msgSize}px Outfit, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(customMsg.trim(), pad, titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + quoteSize * 3.4);
  }

  // Waveform — white
  drawWaveform(ctx, pad, h * 0.82, w - pad * 2, 'rgba(255,255,255,0.6)',
    Math.round(w * 0.003), Math.round(w * 0.005), 6.0);

  drawFooter(ctx, w, h, pad, 'rgba(255,255,255,0.25)', trackName);
  drawGrain(ctx, w, h, 0.04);
}


// ── Main component ──────────────────────────────────────────────────────────
export const PostcardModal: React.FC<PostcardModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
}) => {
  const canvasRef              = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [template, setTemplate]         = useState<TemplateId>('midnight');
  const [size, setSize]                 = useState<SizeId>('postcard');
  const [selectedQuote, setSelectedQuote] = useState(QUOTES[0]);
  const [customMsg, setCustomMsg]       = useState('');
  const [activeTab, setActiveTab]       = useState<'template' | 'text' | 'size'>('template');
  const [downloaded, setDownloaded]     = useState(false);
  const [isRendering, setIsRendering]   = useState(false);

  const renderPostcard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRendering(true);

    const sizeOpt = SIZES.find((s) => s.id === size) ?? SIZES[0];
    canvas.width  = sizeOpt.w;
    canvas.height = sizeOpt.h;

    const trackName = currentTrack ? currentTrack.name : 'Late Night Ambient Voyage';

    switch (template) {
      case 'midnight': drawMidnight(ctx, sizeOpt.w, sizeOpt.h, trackName, selectedQuote, customMsg); break;
      case 'neon':     drawNeon(ctx, sizeOpt.w, sizeOpt.h, trackName, selectedQuote, customMsg);     break;
      case 'film':     drawFilm(ctx, sizeOpt.w, sizeOpt.h, trackName, selectedQuote, customMsg);     break;
      case 'dawn':     drawDawn(ctx, sizeOpt.w, sizeOpt.h, trackName, selectedQuote, customMsg);     break;
      case 'mono':     drawMono(ctx, sizeOpt.w, sizeOpt.h, trackName, selectedQuote, customMsg);     break;
    }

    setPreviewUrl(canvas.toDataURL('image/png'));
    setIsRendering(false);
  }, [currentTrack, template, size, selectedQuote, customMsg]);

  // Re-render whenever any design option changes
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(renderPostcard, 80);
      return () => clearTimeout(id);
    }
  }, [isOpen, renderPostcard]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    const sizeOpt = SIZES.find((s) => s.id === size) ?? SIZES[0];
    a.download = `driving-vibes-${template}-${sizeOpt.id}-${Date.now()}.png`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="glass-panel w-full max-w-2xl max-h-[93vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Cinematic Postcard & Wallpaper Generator"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center border border-amber-400/25 text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Cinematic Postcard & Wallpaper</h2>
              <p className="text-xs text-white/45">Capture your vibe as an HD export-ready image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Hidden canvas ── */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Preview */}
          <div className="px-5 pt-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/60 postcard-preview-container">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Postcard preview"
                  className="w-full h-auto object-contain block"
                  style={{ maxHeight: '260px' }}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-white/30 text-xs">
                  Generating preview…
                </div>
              )}
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              )}
              {/* Shimmer overlay */}
              <div className="postcard-shimmer" aria-hidden="true" />
            </div>
          </div>

          {/* ── Tab Bar ── */}
          <div className="flex gap-1 mx-5 mt-4 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            {([['template', ImageIcon, 'Templates'], ['text', Type, 'Text & Quote'], ['size', Sparkles, 'Size']] as const).map(
              ([tab, Icon, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-white/12 text-white shadow'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              )
            )}
          </div>

          {/* ── Tab Panels ── */}
          <div className="px-5 py-4 space-y-3">

            {/* Templates tab */}
            {activeTab === 'template' && (
              <div className="grid grid-cols-1 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      template === t.id
                        ? 'bg-amber-500/15 border-amber-400/40 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/65 hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    <span className="text-lg leading-none">{t.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{t.label}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{t.desc}</div>
                    </div>
                    {template === t.id && (
                      <Check className="w-3.5 h-3.5 text-amber-400 ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Text & Quote tab */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-2">
                    Mood Quote
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUOTES.map((q) => (
                      <button
                        key={q}
                        onClick={() => setSelectedQuote(q)}
                        className={`px-3 py-2 rounded-xl text-left text-xs border transition-all ${
                          selectedQuote === q
                            ? 'bg-amber-500/15 border-amber-400/35 text-amber-200'
                            : 'bg-white/[0.03] border-white/[0.05] text-white/55 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-2">
                    Personal Message <span className="text-white/25 normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value.slice(0, 80))}
                    placeholder="Add your own caption…"
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-amber-400/40 focus:bg-white/[0.06] transition-all custom-scrollbar"
                    style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                    maxLength={80}
                  />
                  <p className="text-[10px] text-white/25 mt-1 text-right">{customMsg.length}/80</p>
                </div>
              </div>
            )}

            {/* Size tab */}
            {activeTab === 'size' && (
              <div className="grid grid-cols-2 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSize(s.id)}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border transition-all ${
                      size === s.id
                        ? 'bg-amber-500/15 border-amber-400/40 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="text-[10px] text-white/35 mt-0.5">{s.hint}</span>
                    {size === s.id && (
                      <Check className="w-3 h-3 text-amber-400 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
          <button
            onClick={renderPostcard}
            disabled={isRendering}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
            aria-label="Regenerate postcard"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRendering ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/65 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={!previewUrl || isRendering}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              {downloaded
                ? <Check className="w-4 h-4 stroke-[2.5]" />
                : <Download className="w-4 h-4 stroke-[2.5]" />}
              <span>{downloaded ? 'Saved!' : 'Download HD'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
