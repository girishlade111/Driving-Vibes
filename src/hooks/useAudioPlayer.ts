import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../types/music';

const STORAGE_PLAYLIST_KEY = 'driving_vibes_custom_order';

export function useAudioPlayer() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTracksLoading, setIsTracksLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>('loading');

  // Single persistent HTMLAudioElement instance
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Stable refs so audio event handlers always access live state values
   * without needing to re-attach listeners on every state change.
   */
  const playlistRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Keep refs in sync with state
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // ─── Internal: advance to a track by index (always reads from ref) ────────
  const goToIndex = useCallback((index: number, autoPlay: boolean) => {
    const pl = playlistRef.current;
    if (pl.length === 0 || index < 0 || index >= pl.length) return;

    const audio = audioRef.current;
    if (!audio) return;

    const target = pl[index];
    setCurrentIndex(index);
    currentIndexRef.current = index;
    setCurrentTime(0);
    setDuration(0);

    audio.src = target.url;
    audio.load();

    if (autoPlay) {
      setIsLoading(true);
      setError(null);
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn('Playback error:', e.message);
            setIsPlaying(false);
            setIsLoading(false);
          }
        });
      }
    }
  }, []);

  // ─── Initialize Audio element once on mount ──────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsLoading(false);
    };

    /**
     * CRITICAL: `handleEnded` must use refs (not closures) to always advance
     * from the correct current index — this is the fix for the stale closure bug.
     */
    const handleEnded = () => {
      const pl = playlistRef.current;
      const idx = currentIndexRef.current;
      if (pl.length === 0) return;
      const nextIdx = (idx + 1) % pl.length;
      goToIndex(nextIdx, true);
    };

    let skipErrorTimer: ReturnType<typeof setTimeout> | null = null;
    const handleError = () => {
      // Only report error if audio actually has a source
      if (!audio.src || audio.src === window.location.href) return;
      console.warn('Audio playback error on current track:', audio.error?.message);
      setIsLoading(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
      setError('Unable to stream this track. Skipping...');

      // Auto-skip after brief moment so the user sees the message
      skipErrorTimer = setTimeout(() => {
        setError(null);
        const pl = playlistRef.current;
        const idx = currentIndexRef.current;
        if (pl.length > 0) {
          const nextIdx = (idx + 1) % pl.length;
          goToIndex(nextIdx, true);
        }
      }, 1800);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      if (skipErrorTimer) clearTimeout(skipErrorTimer);
      audio.pause();
      audio.src = '';
    };
  }, [goToIndex]);

  // ─── Fetch tracks from API on mount ──────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadTracks() {
      setIsTracksLoading(true);
      try {
        const res = await fetch('/api/tracks');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!isMounted) return;

        let fetchedTracks: Track[] = data.tracks || [];
        setDataSource(data.source || 'demo');

        // Re-apply saved playlist order if available
        const savedOrderJson = localStorage.getItem(STORAGE_PLAYLIST_KEY);
        if (savedOrderJson) {
          try {
            const savedIds: string[] = JSON.parse(savedOrderJson);
            const trackMap = new Map(fetchedTracks.map((t) => [t.id, t]));
            const ordered: Track[] = [];

            for (const id of savedIds) {
              if (trackMap.has(id)) {
                ordered.push(trackMap.get(id)!);
                trackMap.delete(id);
              }
            }
            // Append any newly discovered tracks not in saved list
            trackMap.forEach((t) => ordered.push(t));

            if (ordered.length > 0) {
              fetchedTracks = ordered;
            }
          } catch (e) {
            console.warn('Failed to parse saved playlist order:', e);
          }
        }

        playlistRef.current = fetchedTracks;
        setPlaylist(fetchedTracks);

        if (fetchedTracks.length > 0 && audioRef.current) {
          currentIndexRef.current = 0;
          setCurrentIndex(0);
          // Pre-load first track metadata without autoplaying
          audioRef.current.src = fetchedTracks[0].url;
          audioRef.current.preload = 'metadata';
        }
      } catch (err) {
        console.error('Failed to load tracks:', err);
        if (isMounted) {
          setError('Music catalog temporarily unavailable.');
        }
      } finally {
        if (isMounted) {
          setIsTracksLoading(false);
        }
      }
    }

    loadTracks();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── Derived current track ────────────────────────────────────────────────
  const currentTrack = playlist[currentIndex] || null;

  // ─── Play / Pause toggle ──────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    const track = playlistRef.current[currentIndexRef.current];
    if (!audio || !track) return;

    if (isPlayingRef.current) {
      audio.pause();
    } else {
      if (!audio.src || audio.src === window.location.href) {
        audio.src = track.url;
        audio.load();
      }
      setIsLoading(true);
      setError(null);
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((e) => {
          if (e.name !== 'AbortError') {
            console.warn('Play failed:', e.message);
            setIsPlaying(false);
            setIsLoading(false);
          }
        });
      }
    }
  }, []);

  // ─── Select track by index ────────────────────────────────────────────────
  const selectTrack = useCallback(
    (index: number, autoPlay: boolean = true) => {
      goToIndex(index, autoPlay);
    },
    [goToIndex]
  );

  // ─── Next track ───────────────────────────────────────────────────────────
  const next = useCallback(() => {
    const pl = playlistRef.current;
    if (pl.length === 0) return;
    const nextIdx = (currentIndexRef.current + 1) % pl.length;
    goToIndex(nextIdx, true);
  }, [goToIndex]);

  // ─── Previous track (with 3-second smart restart) ────────────────────────
  const previous = useCallback(() => {
    const audio = audioRef.current;
    const pl = playlistRef.current;
    if (!audio || pl.length === 0) return;

    if (audio.currentTime > 3) {
      // Restart current track
      audio.currentTime = 0;
      setCurrentTime(0);
      if (!isPlayingRef.current) {
        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch((e) => {
            if (e.name !== 'AbortError') console.warn('Play failed:', e.message);
          });
        }
      }
    } else {
      const prevIdx = (currentIndexRef.current - 1 + pl.length) % pl.length;
      goToIndex(prevIdx, true);
    }
  }, [goToIndex]);

  // ─── Seek ────────────────────────────────────────────────────────────────
  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const clamped = Math.max(0, Math.min(seconds, duration));
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration]
  );

  // ─── Reorder playlist ────────────────────────────────────────────────────
  const reorderPlaylist = useCallback((newPlaylist: Track[]) => {
    const activeid = playlistRef.current[currentIndexRef.current]?.id;
    playlistRef.current = newPlaylist;
    setPlaylist(newPlaylist);

    // Keep currentIndex pointing to the same track
    if (activeid) {
      const newIdx = newPlaylist.findIndex((t) => t.id === activeid);
      if (newIdx !== -1) {
        currentIndexRef.current = newIdx;
        setCurrentIndex(newIdx);
      }
    }

    // Persist order to localStorage
    try {
      localStorage.setItem(
        STORAGE_PLAYLIST_KEY,
        JSON.stringify(newPlaylist.map((t) => t.id))
      );
    } catch (e) {
      console.warn('Failed to save playlist order:', e);
    }
  }, []);

  // ─── Playlist open/close ─────────────────────────────────────────────────
  const togglePlaylist = useCallback(() => {
    setIsPlaylistOpen((prev) => !prev);
  }, []);

  const closePlaylist = useCallback(() => {
    setIsPlaylistOpen(false);
  }, []);

  // ─── Global Keyboard Shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          previous();
          break;
        case 'Escape':
          e.preventDefault();
          closePlaylist();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, next, previous, closePlaylist]);

  return {
    playlist,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    isTracksLoading,
    error,
    isPlaylistOpen,
    dataSource,
    togglePlay,
    selectTrack,
    next,
    previous,
    seek,
    reorderPlaylist,
    togglePlaylist,
    closePlaylist,
  };
}
