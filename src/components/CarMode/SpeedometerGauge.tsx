import React from 'react';
import { SpeedUnit, GpsStatus } from '../../hooks/useGpsSpeedometer';
import { HudThemeConfig } from './carModeTypes';
import { Gauge, Radio, AlertTriangle } from 'lucide-react';

interface SpeedometerGaugeProps {
  speed: number;
  unit: SpeedUnit;
  status: GpsStatus;
  statusMessage: string;
  theme: HudThemeConfig;
  maxSpeed: number;
  isDemoMode: boolean;
  onToggleUnit: () => void;
  onToggleDemoMode: () => void;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  speed,
  unit,
  status,
  statusMessage,
  theme,
  maxSpeed,
  isDemoMode,
  onToggleUnit,
  onToggleDemoMode,
}) => {
  // Max scale on gauge: 240 km/h or 160 mph
  const maxScale = unit === 'km/h' ? 240 : 160;
  const clampedSpeed = Math.max(0, Math.min(maxScale, speed));

  // Gauge Arc Math: 240 degrees total sweep (from 150° to 390°)
  const startAngle = 150;
  const endAngle = 390;
  const totalSweep = endAngle - startAngle; // 240 deg
  const currentAngle = startAngle + (clampedSpeed / maxScale) * totalSweep;

  const radius = 100;
  const center = 130;
  const strokeWidth = 10;

  // Arc path generator
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const startPt = polarToCartesian(cx, cy, r, end);
    const endPt = polarToCartesian(cx, cy, r, start);
    const largeArcFlag = end - start <= 180 ? '0' : '1';
    return `M ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${endPt.x} ${endPt.y}`;
  };

  const backgroundArc = describeArc(center, center, radius, startAngle, endAngle);
  const activeArc = clampedSpeed > 0 ? describeArc(center, center, radius, startAngle, currentAngle) : '';

  // Generate tick marks
  const tickCount = 12;
  const ticks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    const tickSpeed = Math.round((i / tickCount) * maxScale);
    const angle = startAngle + (i / tickCount) * totalSweep;
    const outer = polarToCartesian(center, center, radius + 8, angle);
    const inner = polarToCartesian(center, center, radius - (i % 2 === 0 ? 8 : 4), angle);
    const labelPt = polarToCartesian(center, center, radius - 20, angle);

    const isHighSpeed = tickSpeed > (unit === 'km/h' ? 140 : 90);

    return {
      speed: tickSpeed,
      isMajor: i % 2 === 0,
      isHighSpeed,
      x1: inner.x,
      y1: inner.y,
      x2: outer.x,
      y2: outer.y,
      labelX: labelPt.x,
      labelY: labelPt.y,
    };
  });

  // Needle tip
  const needleTip = polarToCartesian(center, center, radius - 15, currentAngle);

  // Status Badge formatting
  const getStatusBadge = () => {
    if (isDemoMode) {
      return (
        <button
          onClick={onToggleDemoMode}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-mono uppercase tracking-wider hover:bg-purple-500/30 transition-colors"
          title="Click to switch back to real GPS mode"
        >
          <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
          <span>Demo Mode (Test)</span>
        </button>
      );
    }

    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>GPS Tracking Active</span>
          </div>
        );
      case 'stationary':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>GPS Fix · Stationary</span>
          </div>
        );
      case 'requesting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Acquiring Satellites…</span>
          </div>
        );
      case 'denied':
      case 'unavailable':
      default:
        return (
          <button
            onClick={onToggleDemoMode}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-400/40 text-[10px] font-mono hover:bg-red-500/30 transition-colors"
            title="GPS not active. Click to toggle Demo Simulation mode"
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>GPS Inactive (Enable Demo)</span>
          </button>
        );
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      {/* SVG Circular Vector Instrument */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        <svg
          viewBox="0 0 260 260"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
        >
          <defs>
            {/* Active Arc Glow Gradient */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.primaryColor} />
              <stop offset="70%" stopColor={theme.secondaryColor} />
              <stop offset="100%" stopColor={theme.accentColor} />
            </linearGradient>

            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dial Background Disc */}
          <circle
            cx={center}
            cy={center}
            r={radius + 18}
            fill="rgba(5, 5, 10, 0.65)"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
          />

          {/* Inner Accent Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius - 35}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Background Track Arc */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Speed Arc with Glow */}
          {activeArc && (
            <path
              d={activeArc}
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Tick marks & Numbers */}
          {ticks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={
                  t.isHighSpeed
                    ? 'rgba(239, 68, 68, 0.8)'
                    : t.isMajor
                    ? 'rgba(255, 255, 255, 0.75)'
                    : 'rgba(255, 255, 255, 0.25)'
                }
                strokeWidth={t.isMajor ? 2 : 1}
              />
              {t.isMajor && (
                <text
                  x={t.labelX}
                  y={t.labelY}
                  fill={t.isHighSpeed ? '#ef4444' : 'rgba(255, 255, 255, 0.55)'}
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="'JetBrains Mono', monospace"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {t.speed}
                </text>
              )}
            </g>
          ))}

          {/* Needle Line */}
          <line
            x1={center}
            y1={center}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={theme.primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            className="transition-all duration-300 ease-out"
          />

          {/* Center Hub */}
          <circle cx={center} cy={center} r="6" fill={theme.primaryColor} />
          <circle cx={center} cy={center} r="3" fill="#000000" />
        </svg>

        {/* Center Digital Readout Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-5">
          <div className="flex items-baseline justify-center gap-1">
            <span
              className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              style={{ color: speed > 0 ? theme.primaryColor : '#ffffff' }}
            >
              {speed}
            </span>
          </div>

          {/* Clickable Unit Switcher */}
          <button
            onClick={onToggleUnit}
            className="pointer-events-auto mt-0.5 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold font-mono tracking-widest uppercase text-white/80 transition-all active:scale-95 flex items-center gap-1"
            title="Click to toggle km/h ⇄ mph"
          >
            <Gauge className="w-2.5 h-2.5" />
            <span>{unit}</span>
          </button>
        </div>
      </div>

      {/* Status & Max Speed Footnote */}
      <div className="mt-1 flex flex-col items-center gap-1">
        {getStatusBadge()}
        <span className="text-[10px] font-mono text-white/40">
          Max: <strong className="text-white/70">{maxSpeed} {unit}</strong> · {statusMessage}
        </span>
      </div>
    </div>
  );
};
