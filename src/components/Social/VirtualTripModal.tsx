import React, { useEffect, useRef } from 'react';
import {
  Users, Copy, Check, X, RefreshCw, Radio, Compass,
} from 'lucide-react';

interface VirtualTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  travelerCount: number;
  copiedToast: boolean;
  onCopyTripLink: () => void;
  onGenerateNewRoom: () => void;
}

export const VirtualTripModal: React.FC<VirtualTripModalProps> = ({
  isOpen,
  onClose,
  tripId,
  travelerCount,
  copiedToast,
  onCopyTripLink,
  onGenerateNewRoom,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}#trip=${tripId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn select-none">
      <div
        ref={modalRef}
        className="glass-panel w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Virtual Road Trip"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Virtual Road Trip
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live Synced
                </span>
              </h2>
              <p className="text-xs text-white/50">Listen together with friends in real-time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

          {/* Live Travelers Counter */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/25 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>🚗 {travelerCount} Travelers Cruising</span>
                </div>
                <div className="text-[10px] text-indigo-200/60">Currently on the virtual highway</div>
              </div>
            </div>
            <div className="text-xs font-mono text-indigo-300 font-bold px-2 py-1 rounded-lg bg-indigo-500/20">
              Room #{tripId.toUpperCase()}
            </div>
          </div>

          {/* Shareable Room Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/70">Your Private Trip Link:</label>
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.04] border border-white/10">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-xs text-white/80 font-mono outline-none px-2 truncate"
              />
              <button
                onClick={onCopyTripLink}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  copiedToast
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {copiedToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToast ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-white/40">
              Send this link to anyone. When they open it, they will join your road trip session!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onGenerateNewRoom}
              className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Create New Private Room</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
