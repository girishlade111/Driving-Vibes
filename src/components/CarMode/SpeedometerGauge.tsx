import React from 'react';
import { SpeedUnit, GpsStatus } from '../../hooks/useGpsSpeedometer';
import { HudThemeConfig } from './carModeTypes';
import { Gauge, Radio, AlertTriangle, ShieldCheck, Satellite, Compass } from 'lucide-react';

interface SpeedometerGaugeProps {
  speed: number;
  unit: SpeedUnit;
  status: GpsStatus;
  statusMessage: string;
  theme: HudThemeConfig;
  maxSpeed: number;
  avgSpeed: number;
  heading: number | null;
  cardinalHeading: string;
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
  avgSpeed,
  heading,
  cardinalHeading,
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

  const radius = 108;
  const center = 135;
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

  // Generate tick marks (16 ticks)
  const tickCount = 16;
  const ticks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    const tickSpeed = Math.round((i / tickCount) * maxScale);
    const angle = startAngle + (i / tickCount) * totalSweep;
    const isMajor = i % 2 === 0;
    const isHighSpeed = tickSpeed > (unit === 'km/h' ? 140 : 90);

    const outer = polarToCartesian(center, center, radius + (isMajor ? 10 : 6), angle);
    const inner = polarToCartesian(center, center, radius - (isMajor ? 8 : 4), angle);
    const labelPt = polarToCartesian(center, center, radius - 22, angle);

    return {
      speed: tickSpeed,
      isMajor,
      isHighSpeed,
      x1: inner.x,
      y1: inner.y,
      x2: outer.x,
      y2: outer.y,
      labelX: labelPt.x,
      labelY: labelPt.y,
    };
  });

  // Needle pointer tip & base
  const needleTip = polarToCartesian(center, center, radius - 12, currentAngle);
  const needleBaseLeft = polarToCartesian(center, center, 8, currentAngle - 90);
  const needleBaseRight = polarToCartesian(center, center, 8, currentAngle + 90);

  // Status Badge formatting
  const renderStatusBadge = () => {
    if (isDemoMode) {
      return (
        <button
          onClick={onToggleDemoMode}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[11px] font-mono tracking-wider hover:bg-purple-500/30 transition-all active:scale-95 shadow-lg shadow-purple-500/20"
          title="Click to switch back to real GPS mode"
        >
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Simulation Active (Click for Real GPS)</span>
        </button>
      );
    }

    switch (status) {
      case 'active':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-mono shadow-lg shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPS Tracking Active</span>
          </div>
        );
      case 'stationary':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[11px] font-mono shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>GPS Fixed · Stationary (0 {unit})</span>
          </div>
        );
      case 'requesting':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-mono shadow-md">
            <Satellite className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Acquiring GPS Fix…</span>
          </div>
        );
      case 'denied':
        return (
          <button
            onClick={onToggleDemoMode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/40 text-[11px] font-mono hover:bg-red-500/30 transition-all active:scale-95 shadow-md"
            title="Location permission denied. Click to try test simulation."
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>GPS Denied (Enable Simulation)</span>
          </button>
        );
      case 'unavailable':
      default:
        return (
          <button
            onClick={onToggleDemoMode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/40 text-[11px] font-mono hover:bg-red-500/30 transition-all active:scale-95 shadow-md"
            title="No GPS available. Click to toggle Simulation."
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>GPS Inactive (Enable Simulation)</span>
          </button>
        );
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full">
      {/* Supercar Instrument Gauge Container */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Ambient Backlight Glow */}
        <div
          className="absolute inset-4 rounded-full filter blur-2xl opacity-30 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: theme.primaryColor }}
        />

        <svg
          viewBox="0 0 270 270"
          className="w-full h-full drop-shadow-[0_0_25px_rgba(0,0,0,0.85)]"
        >
          <defs>
            {/* Speedometer Active Arc Gradient */}
            <linearGradient id="speedGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.primaryColor} />
              <stop offset="60%" stopColor={theme.secondaryColor} />
              <stop offset="100%" stopColor={theme.accentColor} />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="gaugeGlowEffect" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Needle Gradient */}
            <linearGradient id="needleGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor={theme.primaryColor} />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Outer Bezel Rim */}
          <circle
            cx={center}
            cy={center}
            r={radius + 20}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1.5"
          />

          {/* Gauge Center Dial Base */}
          <circle
            cx={center}
            cy={center}
            r={radius + 17}
            fill="rgba(8, 12, 20, 0.85)"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Inner Accent Ring with Dash Pattern */}
          <circle
            cx={center}
            cy={center}
            r={radius - 40}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Background Track Arc */}
          <path
            d={backgroundArc}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Speed Arc with Dynamic Glow */}
          {activeArc && (
            <path
              d={activeArc}
              fill="none"
              stroke="url(#speedGaugeGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gaugeGlowEffect)"
              className="transition-all duration-200 ease-out"
            />
          )}

          {/* Tick marks & Speed Graduations */}
          {ticks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={
                  t.isHighSpeed
                    ? 'rgba(239, 68, 68, 0.85)'
                    : t.isMajor
                    ? 'rgba(255, 255, 255, 0.8)'
                    : 'rgba(255, 255, 255, 0.25)'
                }
                strokeWidth={t.isMajor ? 2.5 : 1.2}
                strokeLinecap="round"
              />
              {t.isMajor && (
                <text
                  x={t.labelX}
                  y={t.labelY}
                  fill={t.isHighSpeed ? '#ef4444' : 'rgba(255, 255, 255, 0.65)'}
                  fontSize="8.5"
                  fontWeight="700"
                  fontFamily="'Outfit', 'Inter', monospace"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {t.speed}
                </text>
              )}
            </g>
          ))}

          {/* Needle Pointer (Polygon Triangle) */}
          <polygon
            points={`${needleBaseLeft.x},${needleBaseLeft.y} ${needleTip.x},${needleTip.y} ${needleBaseRight.x},${needleBaseRight.y}`}
            fill="url(#needleGrad)"
            filter="url(#gaugeGlowEffect)"
            className="transition-all duration-200 ease-out opacity-90"
          />

          {/* Center Hub Outer Ring */}
          <circle cx={center} cy={center} r="9" fill="rgba(15, 23, 42, 0.9)" stroke={theme.primaryColor} strokeWidth="2" />
          <circle cx={center} cy={center} r="4" fill={theme.primaryColor} />
        </svg>

        {/* ── Center Digital LCD Readout ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-7">
          {/* Real Speed Number */}
          <div className="flex items-baseline justify-center">
            <span
              className="text-5xl sm:text-6xl font-black font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-200"
              style={{
                color: speed > 0 ? theme.primaryColor : '#ffffff',
                textShadow: speed > 0 ? `0 0 25px ${theme.glowColor}` : '0 0 10px rgba(255,255,255,0.3)',
              }}
            >
              {speed}
            </span>
          </div>

          {/* Interactive Unit Badge */}
          <button
            onClick={onToggleUnit}
            className="pointer-events-auto mt-1 px-3 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-black font-mono tracking-widest uppercase text-white/90 transition-all active:scale-95 flex items-center gap-1.5 shadow-md hover:border-white/40"
            title="Click to toggle KM/H ⇄ MPH"
          >
            <Gauge className="w-3 h-3" style={{ color: theme.primaryColor }} />
            <span>{unit}</span>
          </button>
        </div>
      </div>

      {/* ── Status & Telemetry Summary Footnote ── */}
      <div className="mt-1 flex flex-col items-center gap-1.5 text-center px-4">
        {renderStatusBadge()}
        
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-mono text-white/50">
          <span>
            Top Speed: <strong className="text-white/80">{maxSpeed} {unit}</strong>
          </span>
          <span className="text-white/20">•</span>
          <span>
            Avg: <strong className="text-white/80">{avgSpeed} {unit}</strong>
          </span>
          {heading !== null && (
            <>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-white/60" />
                <strong className="text-white/80">{cardinalHeading} {Math.round(heading)}°</strong>
              </span>
            </>
          )}
        </div>
        
        <p className="text-[10px] font-mono text-white/40 max-w-md truncate">
          {statusMessage}
        </p>
      </div>
    </div>
  );
};
