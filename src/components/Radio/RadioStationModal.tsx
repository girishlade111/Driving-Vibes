import React, { useEffect, useRef } from 'react';
import {
  Radio, Upload, Music, X, Disc, Sparkles,
} from 'lucide-react';
import { RADIO_STATIONS, RadioStation } from '../../types/radioStreams';
import { Track } from '../../types/music';

interface RadioStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  onSelectStation: (station: RadioStation) => void;
  onAddLocalFiles: (files: FileList | File[]) => void;
}

export const RadioStationModal: React.FC<RadioStationModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  onSelectStation,
  onAddLocalFiles,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddLocalFiles(e.dataTransfer.files);
      onClose();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn select-none">
      <div
        ref={modalRef}
        className="glass-panel w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="24/7 Live Radio and Local Music Files"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 text-rose-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                24/7 Live Radio & Local Music
              </h2>
              <p className="text-xs text-white/50">Global Lo-Fi streams + Offline local files</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddLocalFiles(e.target.files);
              onClose();
            }
          }}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">

          {/* Radio Stations List */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-2.5 uppercase tracking-wider">
              <Disc className="w-3.5 h-3.5 text-rose-400" />
              Live 24/7 Radio Streams
            </div>
            <div className="space-y-2">
              {RADIO_STATIONS.map((st) => {
                const active = currentTrack?.id === `radio_${st.id}`;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSelectStation(st);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-rose-500/20 border-rose-400/40 text-white shadow-sm'
                        : 'bg-white/[0.03] border-white/8 text-white/70 hover:bg-white/[0.07] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{st.icon}</span>
                      <div>
                        <div className={`text-xs font-medium ${active ? 'text-rose-200 font-bold' : 'text-white'}`}>
                          {st.name}
                        </div>
                        <div className="text-[10px] text-white/40">{st.genre}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                      {st.bitrate}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Local Audio File Dropzone */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/60 mb-2.5 uppercase tracking-wider">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              Play Local Offline Music
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-sky-400/50 bg-white/[0.02] hover:bg-sky-500/[0.04] transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-sky-500/20 flex items-center justify-center text-white/60 group-hover:text-sky-300 transition-colors">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">Drag & drop your MP3/FLAC files here</div>
                <div className="text-[10px] text-white/40 mt-0.5">Or click to browse from your computer (100% private & offline)</div>
              </div>
            </div>
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
