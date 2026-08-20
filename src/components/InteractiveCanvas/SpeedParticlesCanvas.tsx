import React, { useEffect, useRef } from 'react';

interface SpeedParticlesCanvasProps {
  isEnabled: boolean;
  isPlaying: boolean;
  accentColor: string;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  pz: number;
}

export const SpeedParticlesCanvas: React.FC<SpeedParticlesCanvasProps> = ({
  isEnabled,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

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

    const count = 180;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      pz: Math.random() * width,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const speed = isPlaying ? 12 : 2.5;

      particlesRef.current.forEach((p) => {
        p.pz = p.z;
        p.z -= speed;

        if (p.z <= 0) {
          p.z = width;
          p.pz = width;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 250 / p.z;
        const pk = 250 / p.pz;

        const sx = p.x * k + cx;
        const sy = p.y * k + cy;

        const psx = p.x * pk + cx;
        const psy = p.y * pk + cy;

        const alpha = Math.max(0, Math.min(0.8, (1 - p.z / width) * 0.9));

        ctx.beginPath();
        ctx.moveTo(psx, psy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(0.8, (1 - p.z / width) * 2.5);
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
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
