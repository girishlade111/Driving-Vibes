import React, { useEffect, useRef } from 'react';

interface ShootingStarsCanvasProps {
  isEnabled: boolean;
  isPlaying: boolean;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // in radians
  alpha: number;
  decay: number;
  headSize: number;
  color: string;
}

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  hue: number;
  rotation: number;
  spin: number;
}

export const ShootingStarsCanvas: React.FC<ShootingStarsCanvasProps> = ({
  isEnabled,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const meteorsRef = useRef<Meteor[]>([]);
  const particlesRef = useRef<StarParticle[]>([]);
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

    const spawnMeteor = () => {
      const colors = ['#ffffff', '#a5f3fc', '#fef08a', '#e9d5ff', '#fed7aa'];
      const angle = (Math.PI / 180) * (30 + Math.random() * 25); // 30-55 degrees down-right
      meteorsRef.current.push({
        x: Math.random() * width * 1.2 - width * 0.2,
        y: Math.random() * (height * 0.45) - 50,
        length: 80 + Math.random() * 160,
        speed: 12 + Math.random() * 18,
        angle,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.015,
        headSize: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    // Interactive Starburst Click Effect
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // Spawn burst of 22 sparkling cosmic particles
      for (let i = 0; i < 22; i++) {
        const spd = 1.5 + Math.random() * 5.5;
        const ang = Math.random() * Math.PI * 2;
        particlesRef.current.push({
          x: clientX,
          y: clientY,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 1.5 + Math.random() * 3,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.03,
          hue: [45, 190, 280, 340, 210][Math.floor(Math.random() * 5)],
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.2,
        });
      }
    };

    // Interactive soft stardust trail on pointer move
    let lastMoveTime = 0;
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 35) return;
      lastMoveTime = now;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      particlesRef.current.push({
        x: clientX + (Math.random() - 0.5) * 12,
        y: clientY + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2 - 0.5,
        size: 1.2 + Math.random() * 2,
        alpha: 0.8,
        decay: 0.035 + Math.random() * 0.03,
        hue: 195,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.1,
      });
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    let lastMeteorTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const now = Date.now();

      // Trigger meteors randomly (more frequently if music is playing)
      const meteorInterval = isPlaying ? 2200 : 3800;
      if (now - lastMeteorTime > meteorInterval + Math.random() * 2500) {
        spawnMeteor();
        lastMeteorTime = now;
      }

      // Update & draw meteors
      meteorsRef.current = meteorsRef.current.filter((m) => {
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;
        m.alpha -= m.decay;

        if (m.alpha <= 0 || m.x > width + 100 || m.y > height + 100) return false;

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        // Gradient trail
        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.7, `${m.color}${Math.floor(m.alpha * 180).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, `#ffffff${Math.floor(m.alpha * 255).toString(16).padStart(2, '0')}`);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.headSize * m.alpha;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Meteor Head Spark
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.headSize * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${m.alpha})`;
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();

        return true;
      });

      // Update & draw interactive star particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.rotation += p.spin;
        p.alpha -= p.decay;

        if (p.alpha <= 0) return false;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Draw 4-point twinkling star
        const s = p.size * (p.alpha * 0.7 + 0.3);
        ctx.beginPath();
        ctx.moveTo(0, -s * 2);
        ctx.quadraticCurveTo(0, 0, s * 2, 0);
        ctx.quadraticCurveTo(0, 0, 0, s * 2);
        ctx.quadraticCurveTo(0, 0, -s * 2, 0);
        ctx.quadraticCurveTo(0, 0, 0, -s * 2);
        ctx.closePath();

        ctx.fillStyle = `hsla(${p.hue}, 95%, 75%, ${p.alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, 1)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        return true;
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
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
