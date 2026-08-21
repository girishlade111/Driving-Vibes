import React, { useEffect, useRef } from 'react';

interface FilmGrainCanvasProps {
  isEnabled: boolean;
}

export const FilmGrainCanvas: React.FC<FilmGrainCanvasProps> = ({ isEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
      mouseRef.current = { x: clientX, y: clientY };
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Pre-render a tiny repeating noise pattern for 60fps performance
    const noiseSize = 128;
    const nCanvas = document.createElement('canvas');
    nCanvas.width = noiseSize;
    nCanvas.height = noiseSize;
    const nCtx = nCanvas.getContext('2d');
    noiseCanvasRef.current = nCanvas;

    const generateNoise = () => {
      if (!nCtx) return;
      const imgData = nCtx.createImageData(noiseSize, noiseSize);
      const buffer = new Uint32Array(imgData.data.buffer);
      const len = buffer.length;
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.18) {
          const val = Math.floor(Math.random() * 255);
          buffer[i] = (22 << 24) | (val << 16) | (val << 8) | val;
        }
      }
      nCtx.putImageData(imgData, 0, 0);
    };

    let frame = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;

      if (frame % 3 === 0) {
        generateNoise();
      }

      // Draw subtle analog noise tile
      if (noiseCanvasRef.current) {
        const ptrn = ctx.createPattern(noiseCanvasRef.current, 'repeat');
        if (ptrn) {
          ctx.fillStyle = ptrn;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Draw subtle CRT Scanlines (high performance)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1.5);
      }

      // Dynamic Interactive Vignette (shifts gently with mouse)
      const mouse = mouseRef.current;
      const mx = mouse.x || width / 2;
      const my = mouse.y || height / 2;
      const vx = width / 2 + (mx - width / 2) * 0.15;
      const vy = height / 2 + (my - height / 2) * 0.15;
      const maxR = Math.hypot(width, height) * 0.7;

      const vignette = ctx.createRadialGradient(vx, vy, maxR * 0.35, vx, vy, maxR);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.18)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.48)');

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      aria-hidden="true"
    />
  );
};
