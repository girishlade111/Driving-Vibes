import React, { useEffect, useRef } from 'react';

interface RainGlassCanvasProps {
  isEnabled: boolean;
}

interface Drop {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
}

export const RainGlassCanvas: React.FC<RainGlassCanvasProps> = ({ isEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dropsRef = useRef<Drop[]>([]);
  const wipedTrailsRef = useRef<{ x: number; y: number; age: number }[]>([]);
  const animFrameRef = useRef<number | null>(null);

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

    // Initialize 100 raindrops
    dropsRef.current = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.5 + Math.random() * 3.5,
      vy: 0.2 + Math.random() * 0.8,
      alpha: 0.3 + Math.random() * 0.45,
    }));

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      wipedTrailsRef.current.push({ x: clientX, y: clientY, age: 0 });

      // Wipe nearby drops
      dropsRef.current = dropsRef.current.filter((d) => {
        const dist = Math.hypot(d.x - clientX, d.y - clientY);
        return dist > 45; // Wipe radius
      });
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Spawn new drops occasionally
      if (dropsRef.current.length < 110 && Math.random() < 0.35) {
        dropsRef.current.push({
          x: Math.random() * width,
          y: -10,
          r: 1.5 + Math.random() * 3,
          vy: 0.3 + Math.random() * 0.9,
          alpha: 0.25 + Math.random() * 0.45,
        });
      }

      // Draw & Update Raindrops
      dropsRef.current.forEach((d) => {
        d.y += d.vy;
        if (d.y > height + 10) {
          d.y = -5;
          d.x = Math.random() * width;
        }

        // Draw refractive water drop
        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha})`;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
        ctx.restore();
      });

      // Age and clear wiped trails
      wipedTrailsRef.current = wipedTrailsRef.current
        .map((t) => ({ ...t, age: t.age + 1 }))
        .filter((t) => t.age < 60);

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
