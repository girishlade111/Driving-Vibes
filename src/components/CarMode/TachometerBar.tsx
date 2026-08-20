import React, { useState, useEffect } from 'react';
import { HudThemeConfig } from './carModeTypes';

interface TachometerBarProps {
  isPlaying: boolean;
  speed: number;
  theme: HudThemeConfig;
}

export const TachometerBar: React.FC<TachometerBarProps> = ({
  isPlaying,
  speed,
  theme,
}) => {
  const [rpm, setRpm] = useState<number>(0);
  const [gear, setGear] = useState<string>('P');

  // Compute realistic RPM & Gear shifts based on speed and music activity
  useEffect(() => {
    if (!isPlaying && speed === 0) {
      setRpm(0);
      setGear('P');
      return;
    }

    // Determine virtual gear from speed
    let currentGear = 'D';
    let baseRpm = 1200; // Idle RPM

    if (speed > 0) {
      if (speed < 25) {
        currentGear = 'D1';
        baseRpm = 1500 + (speed / 25) * 2200;
      } else if (speed < 50) {
        currentGear = 'D2';
        baseRpm = 1800 + ((speed - 25) / 25) * 2400;
      } else if (speed < 80) {
        currentGear = 'D3';
        baseRpm = 2000 + ((speed - 50) / 30) * 2500;
      } else if (speed < 115) {
        currentGear = 'D4';
        baseRpm = 2200 + ((speed - 80) / 35) * 2600;
      } else if (speed < 155) {
        currentGear = 'D5';
        baseRpm = 2400 + ((speed - 115) / 40) * 2800;
      } else {
        currentGear = 'D6';
        baseRpm = 2800 + Math.min(4200, ((speed - 155) / 60) * 3500);
      }
    } else if (isPlaying) {
      currentGear = 'N';
      baseRpm = 1100 + Math.sin(Date.now() / 400) * 200;
    }

    setGear(currentGear);
    setRpm(Math.round(baseRpm));

    const interval = setInterval(() => {
      if (isPlaying) {
        // Audio vibration pulsation
        const audioJitter = (Math.random() - 0.48) * 160;
        setRpm((prev) => Math.max(800, Math.min(7800, Math.round(prev + audioJitter))));
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const maxRpm = 8000;
  const rpmPercent = Math.min(100, (rpm / maxRpm) * 100);
  const isRedline = rpm > 6200;

  // Segment blocks count
  const segments = 24;
  const activeSegments = Math.round((rpm / maxRpm) * segments);

  return (
    <div className="w-full max-w-xl mx-auto flex items-center gap-3 select-none">
      {/* Gear Selector Badge */}
      <div
        className="w-12 h-9 rounded-xl flex flex-col items-center justify-center border font-mono font-black text-sm shrink-0 shadow-md transition-all duration-300"
        style={{
          backgroundColor: isRedline ? 'rgba(239, 68, 68, 0.25)' : `${theme.primaryColor}18`,
          borderColor: isRedline ? '#ef4444' : `${theme.primaryColor}50`,
          color: isRedline ? '#ef4444' : theme.primaryColor,
        }}
      >
        <span className="leading-none">{gear}</span>
        <span className="text-[8px] font-sans text-white/40 uppercase">GEAR</span>
      </div>

      {/* Tachometer Strip & Segmented Bar */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-white/50 px-0.5">
          <span className="font-bold tracking-wider">TACHOMETER</span>
          <span className={`font-mono font-bold ${isRedline ? 'text-red-400 animate-pulse' : 'text-white/80'}`}>
            {rpm} <span className="text-[8px] text-white/40 font-normal">RPM</span>
          </span>
        </div>

        {/* Segmented LED Bar */}
        <div className="flex gap-1 h-3 p-1 rounded-lg bg-black/60 border border-white/10 overflow-hidden">
          {Array.from({ length: segments }).map((_, i) => {
            const isFilled = i < activeSegments;
            const isRedSegment = i >= 18;
            const isYellowSegment = i >= 13 && i < 18;

            let segColor = theme.primaryColor;
            if (isRedSegment) segColor = '#ef4444';
            else if (isYellowSegment) segColor = '#fbbf24';

            return (
              <div
                key={i}
                className="flex-1 h-full rounded-sm transition-all duration-100"
                style={{
                  backgroundColor: isFilled ? segColor : 'rgba(255, 255, 255, 0.06)',
                  boxShadow: isFilled ? `0 0 6px ${segColor}` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
