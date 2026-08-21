import React, { useEffect, useRef } from 'react';

interface FirefliesCanvasProps {
  isEnabled: boolean;
  isPlaying: boolean;
  accentColor?: string;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulseOffset: number;
  hue: number;
  trail: { x: number; y: number; alpha: number }[];
}

export const FirefliesCanvas: React.FC<FirefliesCanvasProps> = ({
  isEnabled,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const firefliesRef = useRef<Firefly[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; time: number }>({
    x: -1000,
    y: -1000,
    active: false,
    time: 0,
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

    const count = Math.min(65, Math.floor((width * height) / 22000));
    firefliesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: 1.8 + Math.random() * 2.6,
      baseAlpha: 0.35 + Math.random() * 0.45,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      pulseOffset: Math.random() * Math.PI * 2,
      // warm amber, gold, neon emerald, cyan hues
      hue: [42, 50, 160, 185, 38][Math.floor(Math.random() * 5)],
      trail: [],
    }));

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mouseRef.current = {
        x: clientX,
        y: clientY,
        active: true,
        time: Date.now(),
      };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    let frame = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;

      const mouse = mouseRef.current;
      const isMouseFresh = mouse.active && Date.now() - mouse.time < 3000;
      const speedMultiplier = isPlaying ? 1.3 : 0.85;

      firefliesRef.current.forEach((f) => {
        // Natural organic floating drift
        f.vx += (Math.random() - 0.5) * 0.08;
        f.vy += (Math.random() - 0.5) * 0.08;

        // Interactive mouse gravity & gentle swirl
        if (isMouseFresh) {
          const dx = mouse.x - f.x;
          const dy = mouse.y - f.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 220 && dist > 10) {
            const force = (1 - dist / 220) * 0.28;
            // Swirl around mouse
            f.vx += (dx / dist) * force * 0.4 + (-dy / dist) * force * 0.6;
            f.vy += (dy / dist) * force * 0.4 + (dx / dist) * force * 0.6;
          }
        }

        // Clamp speed
        const maxSpd = 2.2 * speedMultiplier;
        f.vx = Math.max(-maxSpd, Math.min(maxSpd, f.vx * 0.96));
        f.vy = Math.max(-maxSpd, Math.min(maxSpd, f.vy * 0.96));

        f.x += f.vx;
        f.y += f.vy;

        // Screen boundary wrap
        if (f.x < -20) f.x = width + 20;
        if (f.x > width + 20) f.x = -20;
        if (f.y < -20) f.y = height + 20;
        if (f.y > height + 20) f.y = -20;

        // Trail recording
        if (frame % 3 === 0) {
          f.trail.unshift({ x: f.x, y: f.y, alpha: 0.6 });
          if (f.trail.length > 5) f.trail.pop();
        }

        // Glow pulse
        const pulse = Math.sin(frame * f.pulseSpeed + f.pulseOffset);
        const currentAlpha = Math.max(0.1, f.baseAlpha + pulse * 0.35);

        // Draw trail
        f.trail.forEach((pt, idx) => {
          pt.alpha *= 0.88;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, f.size * (1 - idx * 0.16), 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${f.hue}, 95%, 70%, ${pt.alpha * currentAlpha * 0.3})`;
          ctx.fill();
        });

        // Outer glow
        const glowRad = f.size * 5;
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowRad);
        grad.addColorStop(0, `hsla(${f.hue}, 100%, 75%, ${currentAlpha * 0.7})`);
        grad.addColorStop(0.4, `hsla(${f.hue}, 90%, 65%, ${currentAlpha * 0.25})`);
        grad.addColorStop(1, `hsla(${f.hue}, 90%, 60%, 0)`);

        ctx.beginPath();
        ctx.arc(f.x, f.y, glowRad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Firefly core
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${f.hue}, 100%, 95%, ${Math.min(1, currentAlpha * 1.2)})`;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
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
