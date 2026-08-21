import React, { useEffect, useRef } from 'react';

interface AuroraCanvasProps {
  isEnabled: boolean;
  isPlaying: boolean;
}

export const AuroraCanvas: React.FC<AuroraCanvasProps> = ({
  isEnabled,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; factor: number }>({
    x: 0,
    y: 0,
    factor: 0,
  });

  useEffect(() => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mouseRef.current = {
        x: clientX,
        y: clientY,
        factor: (clientX / width - 0.5) * 2,
      };
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let t = 0;

    const ribbons = [
      { baseHue: 155, heightFactor: 0.28, speed: 0.008, waveCount: 3, amplitude: 45, alpha: 0.35 },
      { baseHue: 185, heightFactor: 0.24, speed: 0.011, waveCount: 4, amplitude: 55, alpha: 0.3 },
      { baseHue: 275, heightFactor: 0.32, speed: 0.006, waveCount: 2.5, amplitude: 60, alpha: 0.25 },
      { baseHue: 320, heightFactor: 0.20, speed: 0.013, waveCount: 5, amplitude: 40, alpha: 0.2 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      t += isPlaying ? 1.4 : 0.8;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      ribbons.forEach((ribbon, idx) => {
        const mouseShift = mouseRef.current.factor * (idx + 1) * 20;
        const baseY = height * ribbon.heightFactor;

        ctx.beginPath();
        ctx.moveTo(0, 0);

        const segments = 40;
        const step = width / segments;

        const points: { x: number; y: number }[] = [];

        for (let i = 0; i <= segments; i++) {
          const x = i * step;
          const nx = (i / segments) * Math.PI * ribbon.waveCount;
          const wave1 = Math.sin(nx + t * ribbon.speed + mouseShift * 0.01) * ribbon.amplitude;
          const wave2 = Math.cos(nx * 1.5 - t * ribbon.speed * 0.7) * (ribbon.amplitude * 0.4);
          const y = baseY + wave1 + wave2;
          points.push({ x, y });
        }

        // Draw top path
        ctx.lineTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const xc = (points[i].x + points[i - 1].x) / 2;
          const yc = (points[i].y + points[i - 1].y) / 2;
          ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.lineTo(width, points[points.length - 1].y);
        ctx.lineTo(width, 0);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, baseY + ribbon.amplitude * 2);
        const hue = (ribbon.baseHue + Math.sin(t * 0.005) * 15) % 360;
        grad.addColorStop(0, `hsla(${hue}, 85%, 60%, 0)`);
        grad.addColorStop(0.4, `hsla(${hue}, 90%, 65%, ${ribbon.alpha * 0.7})`);
        grad.addColorStop(0.8, `hsla(${hue + 25}, 95%, 70%, ${ribbon.alpha})`);
        grad.addColorStop(1, `hsla(${hue + 45}, 95%, 75%, 0)`);

        ctx.fillStyle = grad;
        ctx.filter = 'blur(14px)';
        ctx.fill();
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEnabled, isPlaying]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      aria-hidden="true"
    />
  );
};
