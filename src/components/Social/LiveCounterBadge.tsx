import React from 'react';
import { Users, Radio } from 'lucide-react';
import { useLiveCounter } from '../../hooks/useLiveCounter';

interface LiveCounterBadgeProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Premium Live Listener Counter Badge
 * Displays the real-time active user count with live pulsation indicator
 */
export const LiveCounterBadge: React.FC<LiveCounterBadgeProps> = ({
  className = '',
  onClick,
}) => {
  const { activeUsers, status, reconnect } = useLiveCounter();

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div
      onClick={!isConnected ? reconnect : onClick}
      title={
        isConnected
          ? `${activeUsers ?? 1} listeners tuning in right now`
          : isConnecting
          ? 'Connecting to live room...'
          : 'Disconnected. Click to reconnect.'
      }
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full glass-player cursor-pointer select-none transition-all duration-300 hover:scale-105 hover:bg-white/12 active:scale-95 border border-white/10 ${className}`}
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Status glowing dot indicator */}
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-300 ${
            isConnected
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : isConnecting
              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse'
              : 'bg-white/30'
          }`}
        />
      </span>

      {/* User icon */}
      <Users className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80 transition-colors" />

      {/* Live Count Number with exact id="live-count" */}
      <span
        id="live-count"
        className="font-mono text-xs font-semibold text-white/90 tabular-nums leading-none tracking-tight"
      >
        {activeUsers !== null && isConnected ? activeUsers.toLocaleString() : '—'}
      </span>

      {/* Label (hidden on small mobile screens to keep layout clean) */}
      <span className="hidden sm:inline-block text-[11px] font-medium text-white/50 group-hover:text-white/75 transition-colors tracking-wide">
        live
      </span>
    </div>
  );
};
