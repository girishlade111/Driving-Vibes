import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Download, Sparkles, X, Check, Share2,
} from 'lucide-react';
import { Track } from '../../types/music';

interface PostcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  accentColor: string;
}

const QUOTES = [
  "Late night drives with nowhere to go.",
  "Chasing neon lights and quiet highways.",
  "Raindrops on the glass, peace in the mind.",
  "Lost in the rhythm of the open road.",
  "Moments when the music feels like home.",
];

export const PostcardModal: React.FC<PostcardModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState(QUOTES[0]);
  const [downloaded, setDownloaded] = useState(false);

  // Generate canvas postcard
  const renderPostcard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 750;
    canvas.width = width;
    canvas.height = height;

    // Background Gradient / Texture
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(0.5, '#07080d');
    bgGrad.addColorStop(1, '#050508');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient glow circles
    const radGrad = ctx.createRadialGradient(width * 0.75, height * 0.3, 10, width * 0.75, height * 0.3, 450);
    radGrad.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);

    const radGrad2 = ctx.createRadialGradient(width * 0.2, height * 0.7, 10, width * 0.2, height * 0.7, 400);
    radGrad2.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
    radGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad2;
    ctx.fillRect(0, 0, width, height);

    // Outer Glass border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Top Header
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 16px Outfit, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('DRIVING VIBES  •  CINEMATIC SOUNDSCAPE', 65, 80);

    // Current Date / Time
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.textAlign = 'right';
    ctx.fillText(`${dateString}  |  ${timeString}`, width - 65, 80);
    ctx.textAlign = 'left';

    // Decorative center lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(65, 110);
    ctx.lineTo(width - 65, 110);
    ctx.stroke();

    // Now Playing Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 48px Outfit, sans-serif';
    ctx.letterSpacing = '-0.5px';
    const trackName = currentTrack ? currentTrack.name : 'Late Night Ambient Voyage';
    ctx.fillText(trackName, 65, 340);

    // Subtitle Quote
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '400 24px Outfit, sans-serif';
    ctx.fillText(`"${selectedQuote}"`, 65, 410);

    // Waveform lines at bottom
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 65; x < width - 65; x += 12) {
      const h = Math.sin(x * 0.05) * 20 + Math.cos(x * 0.1) * 15;
      ctx.moveTo(x, 560 - h);
      ctx.lineTo(x, 560 + h);
    }
    ctx.stroke();

    // Bottom Badges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '500 15px Outfit, sans-serif';
    ctx.fillText('SPEED: 80 KM/H   •   GPS: HIGHWAY 101   •   VIBE: 100%', 65, 670);

    ctx.textAlign = 'right';
    ctx.fillText('ladestack.in/driving-vibes', width - 65, 670);

    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [currentTrack, selectedQuote]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(renderPostcard, 100);
    }
  }, [isOpen, renderPostcard]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `driving-vibes-postcard-${Date.now()}.png`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn select-none">
      <div
        ref={modalRef}
        className="glass-panel w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Wallpaper and Postcard Generator"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Cinematic Postcard & Wallpaper
              </h2>
              <p className="text-xs text-white/50">Capture your current music vibe as an HD image</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">

          {/* Preview Canvas Image */}
          {previewUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/40">
              <img src={previewUrl} alt="Postcard preview" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* Select Quote Mood */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wider">
              Choose Postcard Quote
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUOTES.map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuote(q)}
                  className={`p-2.5 rounded-xl text-left text-xs border transition-all truncate ${
                    selectedQuote === q
                      ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={renderPostcard}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Regenerate Card</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              {downloaded ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Download className="w-4 h-4 stroke-[2.5]" />}
              <span>{downloaded ? 'Downloaded!' : 'Download HD Image'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
