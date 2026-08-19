import React, { useState, useRef } from 'react';
import { X, GripVertical, Play, Volume2 } from 'lucide-react';
import { Track } from '../../types/music';

interface PlaylistPanelProps {
  isOpen: boolean;
  playlist: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onClose: () => void;
  onSelectTrack: (index: number) => void;
  onReorder: (newPlaylist: Track[]) => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  isOpen,
  playlist,
  currentTrack,
  isPlaying,
  onClose,
  onSelectTrack,
  onReorder,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchStartY = useRef<number>(0);

  if (!isOpen) return null;

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or custom drag preview
    if (e.dataTransfer.setData) {
      e.dataTransfer.setData('text/plain', index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
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

  // Mobile Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    if (currentY - touchStartY.current > 80) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop overlay for focus & easy closing */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 transition-opacity duration-300 animate-fadeIn"
        aria-hidden="true"
      />

      {/* Playlist Dialog Container */}
      <section
        role="dialog"
        aria-label="Playlist"
        aria-modal="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="fixed z-20 inset-x-3 bottom-[82px] sm:bottom-[88px] md:bottom-[96px] sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] md:w-[480px] max-h-[65vh] flex flex-col glass-panel rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-slideUp transition-all duration-300"
      >
        {/* Mobile drag handle bar */}
        <div className="sm:hidden w-full flex justify-center pt-2 pb-1" aria-hidden="true">
          <div className="w-9 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 select-none">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Playlist</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-mono">
              {playlist.length} {playlist.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Close playlist"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Track List */}
        <div 
          className="overflow-y-auto custom-scrollbar p-2 space-y-1 divide-y divide-white/5 flex-1 select-none max-h-[50vh]"
          tabIndex={0}
          aria-label="Track list. Drag to reorder songs."
        >
          {playlist.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              No music tracks found.
            </div>
          ) : (
            playlist.map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              const isDragged = draggedIndex === index;
              const isOver = dragOverIndex === index;

              return (
                <div
                  key={track.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectTrack(index)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isActive 
                      ? 'bg-white/15 text-white font-medium shadow-sm' 
                      : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                  } ${isDragged ? 'opacity-30 border border-dashed border-white/40' : ''} ${
                    isOver ? 'border-t-2 border-white/60 bg-white/20' : ''
                  }`}
                >
                  {/* Left: Drag grip & Track Number */}
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* Drag Handle */}
                    <div 
                      className="cursor-grab active:cursor-grabbing text-neutral-500 group-hover:text-neutral-300 p-0.5 transition-colors"
                      title="Drag to reorder"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Numeric Index (01, 02, etc.) */}
                    <span className="text-xs font-mono text-neutral-400 group-hover:text-neutral-200 w-5 shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Track Title */}
                    <span className={`text-sm truncate tracking-wide ${isActive ? 'text-white font-semibold' : 'text-neutral-200'}`}>
                      {track.name}
                    </span>
                  </div>

                  {/* Right: Active Indicator / Hover Play */}
                  <div className="shrink-0 pl-2">
                    {isActive ? (
                      isPlaying ? (
                        <div className="flex items-center space-x-1.5 text-white">
                          <span className="flex items-end gap-[1.5px] h-3 opacity-90">
                            <span className="w-[2px] bg-white rounded-full bar-1" />
                            <span className="w-[2px] bg-white rounded-full bar-2" />
                            <span className="w-[2px] bg-white rounded-full bar-3" />
                          </span>
                        </div>
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-white/70" />
                      )
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <footer className="px-4 py-2 bg-black/20 border-t border-white/5 text-[11px] text-neutral-400 flex items-center justify-between select-none">
          <span>Drag tracks to change sequence</span>
          <span className="hidden sm:inline">Esc to close</span>
        </footer>
      </section>
    </>
  );
};
