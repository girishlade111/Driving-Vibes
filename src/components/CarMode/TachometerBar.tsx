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

  // Compute realistic RPM & Gear shifts based on actual speed
  useEffect(() => {
    if (speed === 0) {
      if (isPlaying) {
        setGear('N');
        // Idle heartbeat while parked listening to music
        setRpm(850);
      } else {
        setGear('P');
        setRpm(0);
      }
      return;
    }

    // Determine virtual automotive transmission gear from real velocity
    let currentGear = 'D1';
    let baseRpm = 1400;

    if (speed < 20) {
      currentGear = 'D1';
      baseRpm = 1400 + (speed / 20) * 2200;
    } else if (speed < 45) {
      currentGear = 'D2';
      baseRpm = 1700 + ((speed - 20) / 25) * 2400;
    } else if (speed < 75) {
      currentGear = 'D3';
      baseRpm = 1900 + ((speed - 45) / 30) * 2500;
    } else if (speed < 110) {
      currentGear = 'D4';
      baseRpm = 2100 + ((speed - 75) / 35) * 2700;
    } else if (speed < 150) {
      currentGear = 'D5';
      baseRpm = 2300 + ((speed - 110) / 40) * 2900;
    } else {
      currentGear = 'D6';
      baseRpm = 2600 + Math.min(4600, ((speed - 150) / 60) * 3800);
    }

    setGear(currentGear);
    setRpm(Math.round(baseRpm));
  }, [isPlaying, speed]);

  const maxRpm = 8000;
  const isRedline = rpm > 6200;

  // Segment blocks count
  const segments = 28;
  const activeSegments = Math.round((rpm / maxRpm) * segments);

  return (
    <div
      className="w-full max-w-3xl mx-auto flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border backdrop-blur-xl transition-all select-none shadow-lg"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      {/* Gear Selector Badge */}
      <div
        className="w-13 h-10 px-2 rounded-xl flex flex-col items-center justify-center border font-mono font-black text-sm shrink-0 shadow-md transition-all duration-300"
        style={{
          backgroundColor: isRedline ? 'rgba(239, 68, 68, 0.25)' : `${theme.primaryColor}20`,
          borderColor: isRedline ? '#ef4444' : `${theme.primaryColor}60`,
          color: isRedline ? '#ef4444' : theme.primaryColor,
        }}
      >
        <span className="leading-none text-base">{gear}</span>
        <span className="text-[8px] font-sans font-semibold text-white/50 uppercase tracking-tighter">GEAR</span>
      </div>

      {/* Tachometer Strip & Segmented Bar */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono px-0.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-white/70">TACHOMETER</span>
            <span className="text-[10px] text-white/30 hidden sm:inline">8,000 RPM REDLINE</span>
          </div>
          <span className={`font-mono font-extrabold ${isRedline ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {rpm.toLocaleString()} <span className="text-[9px] text-white/50 font-normal">RPM</span>
          </span>
        </div>

        {/* Segmented LED Bar */}
        <div className="flex gap-1 h-3.5 p-1 rounded-xl bg-black/70 border border-white/10 overflow-hidden shadow-inner">
          {Array.from({ length: segments }).map((_, i) => {
            const isFilled = i < activeSegments;
            const isRedSegment = i >= 22;
            const isYellowSegment = i >= 16 && i < 22;

            let segColor = theme.primaryColor;
            if (isRedSegment) segColor = '#ef4444';
            else if (isYellowSegment) segColor = '#f59e0b';

            return (
              <div
                key={i}
                className="flex-1 h-full rounded-sm transition-all duration-150"
                style={{
                  backgroundColor: isFilled ? segColor : 'rgba(255, 255, 255, 0.05)',
                  boxShadow: isFilled ? `0 0 8px ${segColor}` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
