import React from 'react';
import { GpsTelemetry, SpeedUnit } from '../../hooks/useGpsSpeedometer';
import { HudThemeConfig } from './carModeTypes';
import { Navigation, Compass, Mountain, MapPin, Activity, RotateCcw } from 'lucide-react';

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

  const distance = unit === 'km/h' ? `${telemetry.tripDistanceKm} km` : `${telemetry.tripDistanceMiles} mi`;
  const avgSpeed = unit === 'km/h' ? `${telemetry.avgSpeedKmh} km/h` : `${telemetry.avgSpeedMph} mph`;
  const altitude =
    telemetry.altitude !== null
      ? unit === 'km/h'
        ? `${telemetry.altitude} m`
        : `${telemetry.altitudeFeet} ft`
      : '—';

  const headingDeg = telemetry.heading !== null ? `${Math.round(telemetry.heading)}°` : '—';
  const coordsStr =
    telemetry.latitude !== null && telemetry.longitude !== null
      ? `${telemetry.latitude.toFixed(4)}°, ${telemetry.longitude.toFixed(4)}°`
      : 'Acquiring GPS Fix…';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-2xl mx-auto select-none">
      {/* 1. Compass & Heading */}
      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-500"
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
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Heading
          </div>
          <div className="text-xs font-bold font-mono text-white truncate">
            {telemetry.cardinalHeading} <span className="text-[10px] text-white/50">{headingDeg}</span>
          </div>
        </div>
      </div>

      {/* 2. Trip Distance Odometer */}
      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
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
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Odometer
          </div>
          <div className="text-xs font-bold font-mono text-white truncate">{distance}</div>
        </div>
      </div>

      {/* 3. Elevation / Altitude */}
      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
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
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Elevation
          </div>
          <div className="text-xs font-bold font-mono text-white truncate">{altitude}</div>
        </div>
      </div>

      {/* 4. Trip Time & Average Speed */}
      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/70 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 text-amber-400" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Trip Time
          </div>
          <div className="text-xs font-bold font-mono text-white truncate">
            {formatTripTime(tripSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
};
