import React from 'react';
import { GpsTelemetry, SpeedUnit } from '../../hooks/useGpsSpeedometer';
import { HudThemeConfig } from './carModeTypes';
import { Navigation, Compass, Mountain, Timer, RotateCcw, MapPin, Activity } from 'lucide-react';

interface GpsTelemetryPanelProps {
  telemetry: GpsTelemetry;
  unit: SpeedUnit;
  theme: HudThemeConfig;
  tripSeconds: number;
}

export const GpsTelemetryPanel: React.FC<GpsTelemetryPanelProps> = ({
  telemetry,
  unit,
  theme,
  tripSeconds,
}) => {
  const formatTripTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const distance =
    unit === 'km/h'
      ? `${telemetry.tripDistanceKm.toFixed(2)} km`
      : `${telemetry.tripDistanceMiles.toFixed(2)} mi`;

  const altitude =
    telemetry.altitude !== null
      ? unit === 'km/h'
        ? `${telemetry.altitude} m`
        : `${telemetry.altitudeFeet} ft`
      : '—';

  const headingDeg = telemetry.heading !== null ? `${Math.round(telemetry.heading)}°` : '—';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full max-w-3xl mx-auto select-none">
      {/* 1. Compass & Realtime Heading */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-lg"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-500 shadow-inner"
          style={{
            backgroundColor: `${theme.primaryColor}15`,
            borderColor: `${theme.primaryColor}40`,
            color: theme.primaryColor,
          }}
        >
          <Compass
            className="w-5 h-5 transition-transform duration-300"
            style={{
              transform: telemetry.heading !== null ? `rotate(${telemetry.heading}deg)` : 'none',
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Heading
          </div>
          <div className="text-sm font-extrabold font-mono text-white truncate flex items-baseline gap-1.5">
            <span>{telemetry.cardinalHeading}</span>
            <span className="text-[11px] font-medium text-white/50">{headingDeg}</span>
          </div>
        </div>
      </div>

      {/* 2. Trip Distance Odometer */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-lg group"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
          style={{
            backgroundColor: `${theme.secondaryColor}15`,
            borderColor: `${theme.secondaryColor}40`,
            color: theme.secondaryColor,
          }}
        >
          <Navigation className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
              Odometer
            </span>
            <button
              onClick={telemetry.resetTrip}
              title="Reset Trip Odometer"
              className="text-white/30 hover:text-white/80 transition-colors p-0.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
          <div className="text-sm font-extrabold font-mono text-white truncate">
            {distance}
          </div>
        </div>
      </div>

      {/* 3. Elevation & GPS Accuracy */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-lg"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
          style={{
            backgroundColor: `${theme.accentColor}15`,
            borderColor: `${theme.accentColor}40`,
            color: theme.accentColor,
          }}
        >
          <Mountain className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Elevation MSL
          </div>
          <div className="text-sm font-extrabold font-mono text-white truncate flex items-baseline gap-1.5">
            <span>{altitude}</span>
            {telemetry.accuracyMeters !== null && (
              <span className="text-[10px] text-white/40 font-normal">
                ±{telemetry.accuracyMeters}m
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Trip Duration Timer */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-lg"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 flex items-center justify-center shrink-0">
          <Timer className="w-5 h-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Trip Time
          </div>
          <div className="text-sm font-extrabold font-mono text-white truncate">
            {formatTripTime(tripSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
};
