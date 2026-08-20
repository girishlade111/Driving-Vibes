import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, GripVertical, Play, Volume2, Heart, Search, BarChart2 } from 'lucide-react';
import { Track } from '../../types/music';
import { TrackStat } from '../../hooks/useListeningStats';

interface PlaylistPanelProps {
  isOpen: boolean;
  playlist: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isTracksLoading: boolean;
  favorites: Set<string>;
  getTrackStat: (trackId: string) => TrackStat;
  onClose: () => void;
  onSelectTrack: (index: number) => void;
  onReorder: (newPlaylist: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  isOpen,
  playlist,
  currentTrack,
  isPlaying,
  isTracksLoading,
  favorites,
  getTrackStat,
  onClose,
  onSelectTrack,
  onReorder,
  onToggleFavorite,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFavesOnly, setShowFavesOnly] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const touchStartY = useRef<number>(0);
  const panelRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSearch && searchQuery) {
          setSearchQuery('');
        } else if (showSearch) {
          setShowSearch(false);
        } else {
          onClose();
        }
      }
      // '/' to open search
      if (e.key === '/' && !showSearch) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          setShowSearch(true);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, showSearch, searchQuery]);

  // Focus search input when it opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Focus trap: focus the panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  // Reset search/filter when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setShowSearch(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Filtered playlist ─────────────────────────────────────────────────
  const filteredPlaylist = playlist
    .map((track, originalIndex) => ({ track, originalIndex }))
    .filter(({ track }) => {
      if (showFavesOnly && !favorites.has(track.id)) return false;
      if (searchQuery && !track.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetOriginalIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetOriginalIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...playlist];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetOriginalIndex, 0, moved);

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

  const handleFaveClick = useCallback((e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    onToggleFavorite(trackId);
  }, [onToggleFavorite]);

  const favCount = playlist.filter(t => favorites.has(t.id)).length;

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
        className="fixed inset-x-3 sm:left-1/2 sm:-translate-x-1/2 sm:inset-x-auto sm:w-[460px] md:w-[500px] max-h-[48vh] flex flex-col glass-panel rounded-2xl shadow-2xl overflow-hidden animate-slideUp focus:outline-none"
        style={{ zIndex: 25, bottom: 'calc(50vh + 34px)' }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-white/8 shrink-0">
          {!showSearch ? (
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-[11px] font-semibold tracking-[0.12em] text-white/70 uppercase">
                  Playlist
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 font-mono tabular-nums">
                  {filteredPlaylist.length}
                </span>

                {/* Faves filter toggle */}
                <button
                  onClick={() => setShowFavesOnly(p => !p)}
                  aria-pressed={showFavesOnly}
                  title={showFavesOnly ? 'Show all tracks' : 'Show favorites only (F)'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                    showFavesOnly
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/30'
                      : 'bg-white/8 text-white/40 hover:text-white/60 border border-transparent'
                  }`}
                >
                  <Heart className="w-2.5 h-2.5" fill={showFavesOnly ? 'currentColor' : 'none'} />
                  {favCount > 0 && <span>{favCount}</span>}
                </button>

                {/* Stats toggle */}
                <button
                  onClick={() => setShowStats(p => !p)}
                  aria-pressed={showStats}
                  title="Show play counts"
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] transition-all duration-200 ${
                    showStats ? 'text-white/80 bg-white/15' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <BarChart2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Search button */}
                <button
                  onClick={() => setShowSearch(true)}
                  aria-label="Search tracks"
                  title="Search (/)"
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-150"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onClose}
                  aria-label="Close playlist"
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* ── Search input row ── */
            <div className="flex items-center gap-2 w-full">
              <Search className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks…"
                aria-label="Search tracks"
                className="flex-1 bg-transparent text-[13px] text-white/85 placeholder-white/30 outline-none border-none"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                aria-label="Close search"
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
          ) : filteredPlaylist.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-xs tracking-wide">
              {searchQuery ? 'No tracks match your search.' : showFavesOnly ? 'No favorites yet. ❤️' : 'No music available.'}
            </div>
          ) : (
            filteredPlaylist.map(({ track, originalIndex }) => {
              const isActive = currentTrack?.id === track.id;
              const isDragging = draggedIndex === originalIndex;
              const isDropTarget = dragOverIndex === originalIndex && draggedIndex !== originalIndex;
              const isFav = favorites.has(track.id);
              const stat = getTrackStat(track.id);

              return (
                <div
                  key={track.id}
                  role="listitem"
                  draggable={!searchQuery && !showFavesOnly}
                  onDragStart={(e) => handleDragStart(e, originalIndex)}
                  onDragOver={(e) => handleDragOver(e, originalIndex)}
                  onDrop={(e) => handleDrop(e, originalIndex)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={handleDragLeave}
                  onClick={() => onSelectTrack(originalIndex)}
                  aria-label={`${track.name}${isActive ? ', currently playing' : ''}${isFav ? ', favorited' : ''}`}
                  className={[
                    'group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer select-none',
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
                  {/* Drag handle */}
                  {!searchQuery && !showFavesOnly && (
                    <div
                      className="shrink-0 cursor-grab active:cursor-grabbing text-white/20 group-hover:text-white/40 transition-colors touch-none"
                      onClick={(e) => e.stopPropagation()}
                      aria-hidden="true"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Track number */}
                  <span
                    className={`text-[11px] font-mono w-5 shrink-0 tabular-nums ${
                      isActive ? 'text-white/60' : 'text-white/25 group-hover:text-white/40'
                    }`}
                    aria-hidden="true"
                  >
                    {String(originalIndex + 1).padStart(2, '0')}
                  </span>

                  {/* Track name */}
                  <span
                    className={`text-[13px] truncate flex-1 ${
                      isActive ? 'font-medium text-white' : 'font-normal'
                    }`}
                  >
                    {track.name}
                  </span>

                  {/* Play count badge */}
                  {showStats && stat.playCount > 0 && (
                    <span className="shrink-0 text-[9px] font-mono text-white/30 tabular-nums mr-1">
                      ×{stat.playCount}
                    </span>
                  )}

                  {/* Heart button */}
                  <button
                    onClick={(e) => handleFaveClick(e, track.id)}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-pressed={isFav}
                    className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
                      isFav
                        ? 'text-rose-400 opacity-100'
                        : 'text-white/25 opacity-0 group-hover:opacity-100 hover:text-rose-300'
                    }`}
                  >
                    <Heart className="w-3 h-3" fill={isFav ? 'currentColor' : 'none'} />
                  </button>

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
          <span>{searchQuery || showFavesOnly ? 'Filtered view' : 'Drag to reorder'}</span>
          <span className="hidden sm:inline">Esc to close · / to search</span>
        </footer>
      </section>
    </>
  );
};
