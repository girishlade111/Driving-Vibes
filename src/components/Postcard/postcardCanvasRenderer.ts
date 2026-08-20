import {
  PostcardRenderState,
  SizeOption,
  TemplateConfig,
} from './postcardTypes';
import {
  TEMPLATES,
  SIZES,
  FONT_STYLES,
  CURATED_BACKDROPS,
  KANJI_STAMPS,
  TELEMETRY_PRESETS,
} from './postcardAssets';

// In-memory image cache to make rendering instantaneous
const imageCache = new Map<string, HTMLImageElement>();

/** Preload image with CORS handling */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Fallback without crossOrigin if local or blocked
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        imageCache.set(url, fallbackImg);
        resolve(fallbackImg);
      };
      fallbackImg.onerror = (err) => reject(err);
      fallbackImg.src = url;
    };
    img.src = url;
  });
}

/** Rounded rectangle stroke helper */
function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  lw: number
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
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

/** Wrap long text to multiple lines */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
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

/** Draw high-density film grain noise */
function drawFilmGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const alpha = (intensity / 100) * 0.08;
  const count = (w * h * 0.008 * intensity) / 50;

  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = Math.random() * 2 + 0.6;
    const isDark = Math.random() > 0.5;
    ctx.fillStyle = isDark
      ? `rgba(0, 0, 0, ${Math.random() * alpha * 1.2})`
      : `rgba(255, 255, 255, ${Math.random() * alpha})`;
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}

/** Draw horizontal CRT scanlines */
function drawScanlines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const alpha = (intensity / 100) * 0.12;
  const step = Math.max(3, Math.round(h * 0.003));

  ctx.save();
  for (let y = 0; y < h; y += step * 2) {
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, y, w, step);
  }
  ctx.restore();
}

/** Draw deep edge vignette */
function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const alpha = (intensity / 100) * 0.85;

  ctx.save();
  const radius = Math.max(w, h) * 0.75;
  const vig = ctx.createRadialGradient(
    w / 2,
    h / 2,
    radius * 0.25,
    w / 2,
    h / 2,
    radius
  );
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(0.65, `rgba(0, 0, 0, ${alpha * 0.4})`);
  vig.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Draw subtle warm light leak / lens flare streak */
function drawLightLeak(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const alpha = (intensity / 100) * 0.35;

  ctx.save();
  // Top-left orange/magenta leak
  const leak1 = ctx.createRadialGradient(
    0,
    0,
    0,
    0,
    0,
    Math.max(w, h) * 0.65
  );
  leak1.addColorStop(0, `rgba(255, 120, 40, ${alpha})`);
  leak1.addColorStop(0.4, `rgba(236, 72, 153, ${alpha * 0.5})`);
  leak1.addColorStop(1, 'transparent');
  ctx.fillStyle = leak1;
  ctx.fillRect(0, 0, w, h);

  // Bottom-right amber glow
  const leak2 = ctx.createRadialGradient(
    w,
    h,
    0,
    w,
    h,
    Math.max(w, h) * 0.5
  );
  leak2.addColorStop(0, `rgba(245, 158, 11, ${alpha * 0.7})`);
  leak2.addColorStop(1, 'transparent');
  ctx.fillStyle = leak2;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Color grading wash according to selected filter */
function applyColorFilter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  filterId: string
) {
  ctx.save();
  switch (filterId) {
    case 'teal_orange': {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(2, 132, 199, 0.22)');
      g.addColorStop(0.5, 'rgba(15, 23, 42, 0.15)');
      g.addColorStop(1, 'rgba(249, 115, 22, 0.28)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'cyber_neon': {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      g.addColorStop(0.5, 'rgba(168, 85, 247, 0.18)');
      g.addColorStop(1, 'rgba(236, 72, 153, 0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'vintage_sepia': {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(120, 53, 15, 0.35)');
      g.addColorStop(0.7, 'rgba(245, 158, 11, 0.2)');
      g.addColorStop(1, 'rgba(67, 20, 7, 0.4)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'golden_hour': {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(234, 88, 12, 0.3)');
      g.addColorStop(0.4, 'rgba(251, 191, 36, 0.25)');
      g.addColorStop(1, 'rgba(225, 29, 72, 0.28)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'noir_bw': {
      // Dark grayscale wash
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'vaporwave': {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(168, 85, 247, 0.28)');
      g.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
      g.addColorStop(1, 'rgba(56, 189, 248, 0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/** Draw audio waveform visualizer */
function drawDynamicWaveform(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  totalW: number,
  totalH: number,
  primaryColor: string,
  secondaryColor: string,
  seed = 1
) {
  ctx.save();
  const barW = Math.max(3, Math.round(totalW * 0.005));
  const gap = Math.max(3, Math.round(totalW * 0.004));
  const count = Math.floor(totalW / (barW + gap));

  for (let i = 0; i < count; i++) {
    const t = i / count;
    // Harmonized multi-frequency wave curve
    const wave =
      Math.sin(t * Math.PI * 4 + seed) * 0.35 +
      Math.sin(t * Math.PI * 11 + seed * 1.5) * 0.25 +
      Math.cos(t * Math.PI * 18 + seed * 2.2) * 0.15 +
      0.35;
    const h = Math.max(6, wave * totalH);

    // Color gradient across bars
    const grad = ctx.createLinearGradient(0, y0 - h / 2, 0, y0 + h / 2);
    grad.addColorStop(0, primaryColor);
    grad.addColorStop(1, secondaryColor);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x0 + i * (barW + gap), y0 - h / 2, barW, h, barW / 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Draw 35mm film negative borders with sprocket perforations */
function drawFilmBorders(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: number
) {
  ctx.save();
  const barH = Math.round(h * 0.075);
  const holeW = Math.round(w * 0.022);
  const holeH = Math.round(barH * 0.52);
  const holeRadius = Math.round(holeW * 0.22);
  const count = 16;
  const step = w / count;

  // Black bars top & bottom
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  // Perforations & edge text
  for (let i = 0; i < count; i++) {
    const cx = i * step + step / 2;
    // Top sprocket hole
    fillRoundRect(
      ctx,
      cx - holeW / 2,
      (barH - holeH) / 2,
      holeW,
      holeH,
      holeRadius,
      'rgba(255, 255, 255, 0.92)'
    );
    // Bottom sprocket hole
    fillRoundRect(
      ctx,
      cx - holeW / 2,
      h - barH + (barH - holeH) / 2,
      holeW,
      holeH,
      holeRadius,
      'rgba(255, 255, 255, 0.92)'
    );

    // Frame numbering between holes
    if (i % 2 === 0) {
      ctx.font = `700 ${Math.round(barH * 0.24)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      const frameNum = 24 + i / 2;
      ctx.fillText(`KODAK 400 ▸ ${frameNum}A`, cx + step / 2, barH * 0.65);
      ctx.fillText(`ISO 400 · 36 EXP`, cx + step / 2, h - barH * 0.35);
    }
  }

  // Thin golden border line inside
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad * 0.5, barH);
  ctx.lineTo(w - pad * 0.5, barH);
  ctx.moveTo(pad * 0.5, h - barH);
  ctx.lineTo(w - pad * 0.5, h - barH);
  ctx.stroke();

  ctx.restore();
}

/** Draw Japanese Kanji calligraphy stamp */
function drawKanjiStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  kanjiPreset: (typeof KANJI_STAMPS)[0],
  primaryColor = '#ff0055'
) {
  ctx.save();
  const boxW = size * 2.8;
  const boxH = size * 1.15;
  const r = 8;

  // Background badge
  fillRoundRect(ctx, x, y, boxW, boxH, r, 'rgba(0, 0, 0, 0.65)');
  strokeRoundRect(ctx, x, y, boxW, boxH, r, primaryColor, 1.5);

  // Red seal box on left
  const sealSize = boxH - 8;
  fillRoundRect(
    ctx,
    x + 4,
    y + 4,
    sealSize,
    sealSize,
    4,
    'rgba(239, 68, 68, 0.85)'
  );
  strokeRoundRect(ctx, x + 4, y + 4, sealSize, sealSize, 4, '#ffffff', 1);

  ctx.font = `900 ${Math.round(sealSize * 0.52)}px "Noto Sans JP", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('音', x + 4 + sealSize / 2, y + 4 + sealSize / 2);

  // Kanji text
  ctx.font = `700 ${Math.round(boxH * 0.36)}px "Noto Sans JP", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(kanjiPreset.kanji, x + sealSize + 12, y + 8);

  // Subtitle (Romaji / English)
  ctx.font = `500 ${Math.round(boxH * 0.22)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(
    `${kanjiPreset.romaji} · ${kanjiPreset.english}`,
    x + sealSize + 12,
    y + boxH - 16
  );

  ctx.restore();
}

/** Draw Cyberpunk HUD Telemetry widget */
function drawTelemetryHud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  telemetry: (typeof TELEMETRY_PRESETS)[0],
  primaryColor: string
) {
  ctx.save();
  const pad = 12;
  const h = 72;

  // Cyber glass container
  fillRoundRect(ctx, x, y, w, h, 8, 'rgba(5, 10, 20, 0.75)');
  strokeRoundRect(ctx, x, y, w, h, 8, primaryColor, 1.2);

  // Corner brackets
  const bSize = 10;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2.5;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x - 2, y + bSize);
  ctx.lineTo(x - 2, y - 2);
  ctx.lineTo(x + bSize, y - 2);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w + 2, y + h - bSize);
  ctx.lineTo(x + w + 2, y + h + 2);
  ctx.lineTo(x + w - bSize, y + h + 2);
  ctx.stroke();

  // Content
  ctx.font = `700 11px "JetBrains Mono", monospace`;
  ctx.fillStyle = primaryColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SYS_TELEMETRY // ${telemetry.title.toUpperCase()}`, x + pad, y + pad);

  ctx.font = `500 12px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(telemetry.coordinates, x + pad, y + pad + 18);

  ctx.font = `600 11px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText(
    `SPD: ${telemetry.speed}   ${telemetry.altitude}   ${telemetry.heading}   FREQ: ${telemetry.frequency}`,
    x + pad,
    y + pad + 36
  );

  ctx.restore();
}

/** Draw vintage postal cancellation mark */
function drawPostmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r = 50,
  primaryColor = '#fbbf24'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.14); // slightly tilted stamp angle

  // Outer circle
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r - 6, 0, Math.PI * 2);
  ctx.stroke();

  // Center stars and text
  ctx.font = `700 ${Math.round(r * 0.22)}px "Outfit", sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ DRIVING VIBES ★', 0, -r * 0.42);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  ctx.font = `600 ${Math.round(r * 0.24)}px "JetBrains Mono", monospace`;
  ctx.fillText(dateStr.toUpperCase(), 0, 0);

  ctx.font = `700 ${Math.round(r * 0.2)}px "Outfit", sans-serif`;
  ctx.fillText('SCENIC AIRMAIL', 0, r * 0.45);

  // Wavy cancellation lines extending to the right
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    const lineY = i * (r * 0.22);
    ctx.beginPath();
    for (let lx = r + 10; lx < r + 110; lx += 10) {
      const waveY = lineY + Math.sin(lx * 0.2) * 3;
      if (lx === r + 10) ctx.moveTo(lx, waveY);
      else ctx.lineTo(lx, waveY);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw 90s digital orange camera date stamp */
function drawOrangeDateStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 20
) {
  ctx.save();
  const now = new Date();
  const yr = String(now.getFullYear()).slice(-2);
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const da = String(now.getDate()).padStart(2, '0');
  const hr = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const stampStr = `'${yr} ${mo} ${da}  ${hr}:${mi}`;

  ctx.font = `700 ${size}px "JetBrains Mono", monospace`;
  ctx.fillStyle = '#ff6b00';
  ctx.shadowColor = 'rgba(255, 107, 0, 0.85)';
  ctx.shadowBlur = size * 0.4;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(stampStr, x, y);
  ctx.restore();
}

/** Draw soundwave barcode badge */
function drawSoundBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  trackId: string
) {
  ctx.save();
  fillRoundRect(ctx, x, y, w, h, 6, 'rgba(0,0,0,0.5)');
  strokeRoundRect(ctx, x, y, w, h, 6, 'rgba(255,255,255,0.1)', 1);

  const pad = 10;
  const barCount = 38;
  const barW = (w - pad * 2) / (barCount * 1.6);
  const gap = barW * 0.6;
  const startX = x + pad;
  const maxH = h - pad * 2 - 14;

  ctx.fillStyle = color;
  for (let i = 0; i < barCount; i++) {
    // Generate pseudorandom barcode heights based on track title & index
    const seed = (i * 13 + trackId.charCodeAt(i % trackId.length)) % 100;
    const barH = 6 + (seed / 100) * maxH;
    ctx.fillRect(
      startX + i * (barW + gap),
      y + h - pad - 14 - barH,
      barW,
      barH
    );
  }

  // Scannable release serial
  ctx.font = `600 9px "JetBrains Mono", monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'left';
  ctx.fillText(`DV-${trackId.toUpperCase().slice(0, 8)}-HIRES`, startX, y + h - pad + 2);

  ctx.restore();
}

/** Draw 4-color palette swatch chips with hex codes */
function drawColorPaletteSwatches(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colors: string[]
) {
  ctx.save();
  const chipSize = 22;
  const gap = 12;

  colors.forEach((hex, i) => {
    const cx = x + i * (chipSize + gap + 40);
    fillRoundRect(ctx, cx, y, chipSize, chipSize, 4, hex);
    strokeRoundRect(ctx, cx, y, chipSize, chipSize, 4, 'rgba(255,255,255,0.3)', 1);

    ctx.font = `600 10px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(hex.toUpperCase(), cx + chipSize + 6, y + chipSize / 2);
  });
  ctx.restore();
}

/** Main Master Render Function */
export async function renderPostcardStudioCanvas(
  canvas: HTMLCanvasElement,
  state: PostcardRenderState,
  activeBgPresetImage?: string
): Promise<string> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Ensure fonts are fully loaded
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const sizeOpt = SIZES.find((s) => s.id === state.size) ?? SIZES[0];
  const templateConfig =
    TEMPLATES.find((t) => t.id === state.template) ?? TEMPLATES[0];
  const fontOpt =
    FONT_STYLES.find((f) => f.id === state.fontStyle) ?? FONT_STYLES[0];
  const kanjiPreset =
    KANJI_STAMPS.find((k) => k.id === state.selectedKanjiId) ?? KANJI_STAMPS[0];
  const telemetryPreset =
    TELEMETRY_PRESETS.find((t) => t.id === state.selectedTelemetryId) ??
    TELEMETRY_PRESETS[0];

  const w = sizeOpt.w;
  const h = sizeOpt.h;

  canvas.width = w;
  canvas.height = h;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // 2. Draw Backdrop (Image / Curated / Custom / Procedural)
  let backdropDrawn = false;
  let targetImageUrl: string | null = null;

  if (state.backdropSource === 'custom_upload' && state.customBackdropUrl) {
    targetImageUrl = state.customBackdropUrl;
  } else if (state.backdropSource === 'app_current' && activeBgPresetImage) {
    targetImageUrl = activeBgPresetImage;
  } else if (state.backdropSource === 'curated') {
    const curated =
      CURATED_BACKDROPS.find((b) => b.id === state.curatedBackdropId) ??
      CURATED_BACKDROPS[0];
    targetImageUrl = curated.url;
  }

  if (targetImageUrl && state.backdropSource !== 'procedural') {
    try {
      const img = await preloadImage(targetImageUrl);
      // Cover-fit image maintaining aspect ratio
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;
      let drawW = w;
      let drawH = h;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > canvasAspect) {
        drawH = h;
        drawW = h * imgAspect;
        drawX = (w - drawW) / 2;
      } else {
        drawW = w;
        drawH = w / imgAspect;
        drawY = (h - drawH) / 2;
      }

      ctx.save();
      if (state.blurIntensity > 0) {
        ctx.filter = `blur(${Math.round((state.blurIntensity / 100) * 16)}px)`;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
      backdropDrawn = true;
    } catch {
      backdropDrawn = false;
    }
  }

  // If no image or procedural mode, draw deep moody gradient background
  if (!backdropDrawn) {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    if (state.template === 'neo_tokyo') {
      bg.addColorStop(0, '#04071a');
      bg.addColorStop(0.5, '#0c0728');
      bg.addColorStop(1, '#02040e');
    } else if (state.template === 'film_portra') {
      bg.addColorStop(0, '#1c120c');
      bg.addColorStop(0.5, '#120c06');
      bg.addColorStop(1, '#080503');
    } else if (state.template === 'golden_hour') {
      bg.addColorStop(0, '#2d0e04');
      bg.addColorStop(0.5, '#4a1503');
      bg.addColorStop(1, '#130401');
    } else if (state.template === 'synthwave_84') {
      bg.addColorStop(0, '#0b001a');
      bg.addColorStop(0.5, '#240046');
      bg.addColorStop(1, '#050010');
    } else {
      bg.addColorStop(0, '#0a0a0f');
      bg.addColorStop(0.5, '#050508');
      bg.addColorStop(1, '#000002');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  // 3. Dark Overlay / Contrast Tint for readability
  ctx.save();
  const darkGrad = ctx.createLinearGradient(0, 0, 0, h);
  darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  darkGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)');
  darkGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.65)');
  darkGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = darkGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 4. Color Grading Filter
  applyColorFilter(ctx, w, h, state.colorFilter);

  // 5. Template-Specific Procedural Graphics
  const pad = Math.round(w * 0.055);

  if (state.template === 'synthwave_84') {
    // Horizon wireframe grid
    ctx.save();
    const horizonY = h * 0.65;
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
    ctx.lineWidth = 1.5;

    // Horizontal receding lines
    for (let i = 0; i < 10; i++) {
      const y = horizonY + Math.pow(i / 10, 1.8) * (h - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Perspective vanishing lines
    const vanishX = w / 2;
    for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.1) {
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Neon sliced sun in center
    const sunR = Math.min(w, h) * 0.22;
    const sunY = horizonY - sunR * 0.3;
    const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sunGrad.addColorStop(0, '#fde047');
    sunGrad.addColorStop(0.5, '#f43f5e');
    sunGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(vanishX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal cutout slices through the sun
    ctx.fillStyle = '#0b001a';
    for (let s = 0; s < 6; s++) {
      const sliceY = sunY + s * (sunR * 0.25);
      const sliceH = Math.max(2, s * 2.5);
      ctx.fillRect(vanishX - sunR, sliceY, sunR * 2, sliceH);
    }
    ctx.restore();
  }

  if (state.template === 'cosmic_odyssey') {
    // Starfield particles & constellation lines
    ctx.save();
    for (let i = 0; i < 90; i++) {
      const sx = (Math.sin(i * 99 + 12) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 77 + 34) * 0.5 + 0.5) * (h * 0.7);
      const sr = (i % 3 === 0 ? 2 : 1) * Math.random() + 0.5;
      ctx.fillStyle = i % 5 === 0 ? '#c084fc' : 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Constellation lines
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.2);
    ctx.lineTo(w * 0.28, h * 0.15);
    ctx.lineTo(w * 0.42, h * 0.28);
    ctx.lineTo(w * 0.35, h * 0.45);
    ctx.stroke();
    ctx.restore();
  }

  // 6. 35mm Film Border Perforations (if enabled or film template)
  if (state.activeBadges.film_border || state.template === 'film_portra') {
    drawFilmBorders(ctx, w, h, pad);
  } else {
    // Elegant frame border
    strokeRoundRect(
      ctx,
      pad * 0.4,
      pad * 0.4,
      w - pad * 0.8,
      h - pad * 0.8,
      16,
      'rgba(255, 255, 255, 0.12)',
      1.5
    );
  }

  // 7. Top Header Label & Branding
  const labelSize = Math.round(w * 0.012);
  ctx.font = `700 ${labelSize}px ${fontOpt.fontFamily}`;
  ctx.fillStyle = templateConfig.primaryColor;
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const brandHeader = `DRIVING VIBES  ·  ${templateConfig.label.toUpperCase()}`;
  ctx.fillText(brandHeader, pad, pad * 1.3);
  ctx.letterSpacing = '0px';

  // Thin header rule
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, pad * 1.8);
  ctx.lineTo(w - pad, pad * 1.8);
  ctx.stroke();

  // 8. Typography: Track Title, Artist, and Quote
  const titleSize = Math.min(Math.round(w * 0.048), 84);
  ctx.font = `800 ${titleSize}px ${fontOpt.fontFamily}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (state.template === 'neo_tokyo') {
    ctx.shadowColor = templateConfig.primaryColor;
    ctx.shadowBlur = Math.round(w * 0.015);
  }

  const trackTitle = state.trackTitle || 'Midnight Highway Drift';
  const wrappedTitle = wrapText(ctx, trackTitle, w - pad * 2.2);
  const titleY = h * 0.42;

  wrappedTitle.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, pad, titleY + i * (titleSize * 1.15));
  });
  ctx.shadowBlur = 0;

  // Artist / Soundscape subtitle
  const artistSize = Math.round(w * 0.018);
  const artistY = titleY + wrappedTitle.slice(0, 2).length * (titleSize * 1.15) + 4;
  ctx.font = `600 ${artistSize}px Outfit, sans-serif`;
  ctx.fillStyle = templateConfig.secondaryColor;
  ctx.fillText(state.artistName || 'Driving Vibes Radio', pad, artistY);

  // Quote
  const quoteSize = Math.round(w * 0.02);
  const quoteY = artistY + quoteSize * 2.2;
  ctx.font = `400 italic ${quoteSize}px ${
    state.fontStyle === 'caveat' ? 'Caveat, cursive' : 'Outfit, sans-serif'
  }`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(`"${state.quote}"`, pad, quoteY);

  // Optional Custom Note
  let nextContentY = quoteY;
  if (state.customMessage && state.customMessage.trim()) {
    const customSize = Math.round(w * 0.016);
    nextContentY = quoteY + customSize * 2.2;
    ctx.font = `500 ${customSize}px ${fontOpt.fontFamily}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText(state.customMessage.trim(), pad, nextContentY);
  }

  // 9. Active Badges & Dynamic Overlays

  // A. Japanese Kanji Stamp (Top Right)
  if (state.activeBadges.kanji_stamp) {
    const kanjiSize = Math.round(w * 0.045);
    drawKanjiStamp(
      ctx,
      w - pad - kanjiSize * 2.8,
      pad * 1.1,
      kanjiSize,
      kanjiPreset,
      templateConfig.primaryColor
    );
  }

  // B. Postmark Stamp (Top Right alternative / scenic)
  if (state.activeBadges.postmark_stamp && !state.activeBadges.kanji_stamp) {
    drawPostmark(
      ctx,
      w - pad - 60,
      pad * 2.2,
      Math.round(w * 0.038),
      templateConfig.primaryColor
    );
  }

  // C. Cyber HUD Telemetry (Middle Right or Bottom)
  if (state.activeBadges.telemetry_hud) {
    const hudW = Math.min(w * 0.44, 460);
    const hudX = w - pad - hudW;
    const hudY = h * 0.52;
    drawTelemetryHud(ctx, hudX, hudY, hudW, telemetryPreset, templateConfig.primaryColor);
  }

  // D. Audio Waveform
  if (state.activeBadges.audio_waveform) {
    const waveY = h * 0.78;
    const waveW = state.activeBadges.sound_barcode ? (w - pad * 2) * 0.55 : w - pad * 2;
    drawDynamicWaveform(
      ctx,
      pad,
      waveY,
      waveW,
      Math.round(h * 0.07),
      templateConfig.primaryColor,
      templateConfig.secondaryColor,
      3.8
    );
  }

  // E. Soundwave Barcode (Bottom Right)
  if (state.activeBadges.sound_barcode) {
    const barcodeW = Math.min(w * 0.35, 340);
    const barcodeH = Math.round(h * 0.08);
    const barcodeX = w - pad - barcodeW;
    const barcodeY = h * 0.74;
    drawSoundBarcode(
      ctx,
      barcodeX,
      barcodeY,
      barcodeW,
      barcodeH,
      templateConfig.primaryColor,
      state.trackTitle || 'VIBES'
    );
  }

  // F. Color Palette Swatches (Bottom Left above footer)
  if (state.activeBadges.color_palette) {
    const paletteColors = [
      templateConfig.primaryColor,
      templateConfig.secondaryColor,
      '#ffffff',
      '#050508',
    ];
    drawColorPaletteSwatches(ctx, pad, h * 0.86, paletteColors);
  }

  // G. 90s Orange Date Stamp (Bottom Right above footer)
  if (state.activeBadges.orange_date_stamp) {
    drawOrangeDateStamp(
      ctx,
      w - pad,
      h * 0.88,
      Math.round(w * 0.016)
    );
  }

  // 10. Footer: Metadata & Branding
  const footerSize = Math.round(w * 0.012);
  const now = new Date();
  const dateStr = now.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.font = `500 ${footerSize}px Outfit, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    `${dateStr}  ·  ${timeStr}  ·  ${trackTitle}  ·  48kHz FLAC`,
    pad,
    h - pad * 0.7
  );

  ctx.textAlign = 'right';
  ctx.fillText('ladestack.in/driving-vibes', w - pad, h - pad * 0.7);

  // 11. Final FX Passes (Film Grain, CRT Scanlines, Light Leaks, Vignette)
  drawLightLeak(ctx, w, h, state.lightLeakIntensity);
  drawFilmGrain(ctx, w, h, state.grainIntensity);
  drawScanlines(ctx, w, h, state.scanlinesIntensity);
  drawVignette(ctx, w, h, state.vignetteIntensity);

  return canvas.toDataURL('image/png', 0.95);
}
