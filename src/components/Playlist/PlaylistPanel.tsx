import React, { useState, useRef, useEffect } from 'react';
import { X, GripVertical, Play, Volume2 } from 'lucide-react';
import { Track } from '../../types/music';

interface PlaylistPanelProps {
  isOpen: boolean;
  playlist: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isTracksLoading: boolean;
  onClose: () => void;
  onSelectTrack: (index: number) => void;
  onReorder: (newPlaylist: Track[]) => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  isOpen,
  playlist,
  currentTrack,
  isPlaying,
  isTracksLoading,
  onClose,
  onSelectTrack,
  onReorder,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchStartY = useRef<number>(0);
  const panelRef = useRef<HTMLElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus trap: focus the panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── HTML5 Drag and Drop ──────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...playlist];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    onReorder(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // ── Mobile swipe-down to close ───────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 80) {
      onClose();
    }
  };

  return (
    <>
      {/* ── Backdrop — z-20 ─────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-20 bg-black/30 backdrop-blur-[2px] animate-fadeIn"
      />

      {/* ── Playlist Panel — z-25 ────────────────────────────────────────── */}
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Playlist"
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="fixed z-25 inset-x-3 bottom-[80px] sm:bottom-[90px] sm:left-1/2 sm:-translate-x-1/2 sm:inset-x-auto sm:w-[440px] md:w-[480px] max-h-[68vh] flex flex-col glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slideUp focus:outline-none"
        style={{ zIndex: 25 }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[11px] font-semibold tracking-[0.12em] text-white/70 uppercase">
              Playlist
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 font-mono tabular-nums">
              {playlist.length}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close playlist"
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* ── Track List ─────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-0.5"
          role="list"
          aria-label="Tracks — drag to reorder"
        >
          {isTracksLoading ? (
            <div className="py-12 text-center text-white/30 text-xs tracking-wide">
              Loading tracks…
            </div>
          ) : playlist.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-xs tracking-wide">
              No music available.
            </div>
          ) : (
            playlist.map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              const isDragging = draggedIndex === index;
              const isDropTarget = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={track.id}
                  role="listitem"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={handleDragLeave}
                  onClick={() => onSelectTrack(index)}
                  aria-label={`${track.name}${isActive ? ', currently playing' : ''}`}
                  className={[
                    'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer select-none',
                    'transition-all duration-150 ease-out',
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-white/60 hover:bg-white/8 hover:text-white',
                    isDragging ? 'opacity-25 scale-[0.98] border border-dashed border-white/30' : '',
                    isDropTarget ? 'border-t-2 border-white/50' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {/* Drag handle — click-blocked so it doesn't trigger track selection */}
                  <div
                    className="shrink-0 cursor-grab active:cursor-grabbing text-white/20 group-hover:text-white/40 transition-colors touch-none"
                    onClick={(e) => e.stopPropagation()}
                    aria-hidden="true"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Track number */}
                  <span
                    className={`text-[11px] font-mono w-5 shrink-0 tabular-nums ${
                      isActive ? 'text-white/60' : 'text-white/25 group-hover:text-white/40'
                    }`}
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Track name */}
                  <span
                    className={`text-[13px] truncate flex-1 ${
                      isActive ? 'font-medium text-white' : 'font-normal'
                    }`}
                  >
                    {track.name}
                  </span>

                  {/* Right indicator */}
                  <div className="shrink-0 w-4 flex items-center justify-center">
                    {isActive ? (
                      isPlaying ? (
                        <span
                          className="flex items-end gap-[1.5px] h-3"
                          aria-label="Now playing"
                          role="img"
                        >
                          <span className="w-[2px] bg-white rounded-full bar-1" />
                          <span className="w-[2px] bg-white rounded-full bar-2" />
                          <span className="w-[2px] bg-white rounded-full bar-3" />
                        </span>
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-white/50" />
                      )
                    ) : (
                      <Play className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="px-4 py-2 border-t border-white/5 text-[10px] text-white/25 flex items-center justify-between shrink-0">
          <span>Drag to reorder</span>
          <span className="hidden sm:inline">Esc to close</span>
        </footer>
      </section>
    </>
  );
};
