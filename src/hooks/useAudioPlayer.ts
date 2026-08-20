import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '../types/music';

const STORAGE_PLAYLIST_KEY = 'driving_vibes_custom_order';
const STORAGE_VOLUME_KEY   = 'driving_vibes_volume';

// ── Repeat modes ──────────────────────────────────────────────────────────
export type RepeatMode = 'off' | 'all' | 'one';

// ── Sleep timer options (minutes) ─────────────────────────────────────────
export type SleepTimerOption = 0 | 15 | 30 | 45 | 60;

// ── Fisher-Yates shuffle helper ───────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadVolume(): number {
  try {
    const v = localStorage.getItem(STORAGE_VOLUME_KEY);
    if (v === null) return 1;
    const n = parseFloat(v);
    return isNaN(n) ? 1 : Math.max(0, Math.min(1, n));
  } catch {
    return 1;
  }
}

export function useAudioPlayer(
  onTrackChange?: (trackId: string) => void,
  onPause?: () => void,
  onResume?: () => void,
) {
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

  // ── Shuffle & Repeat state ────────────────────────────────────────────
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // ── Volume state ──────────────────────────────────────────────────────
  const [volume, setVolumeState] = useState<number>(() => loadVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const prevVolume = useRef<number>(loadVolume());

  // ── Sleep timer state ─────────────────────────────────────────────────
  const [sleepTimer, setSleepTimer] = useState<SleepTimerOption>(0);
  const [sleepRemaining, setSleepRemaining] = useState<number>(0); // seconds
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Single persistent HTMLAudioElement instance
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Stable refs so audio event handlers always access live state values
   * without needing to re-attach listeners on every state change.
   */
  const playlistRef = useRef<Track[]>([]);
  const currentIndexRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const isShuffleRef = useRef<boolean>(false);
  const repeatModeRef = useRef<RepeatMode>('off');
  const volumeRef = useRef<number>(loadVolume());
  const isMutedRef = useRef<boolean>(false);

  // Shuffle queue: indices in shuffled order, consumed as tracks play
  const shuffleQueueRef = useRef<number[]>([]);

  // Keep refs in sync with state
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  // ── Keep audio.loop in sync with repeat-one mode ─────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = repeatMode === 'one';
    }
  }, [repeatMode]);

  // ── Volume: sync to audio element + localStorage ──────────────────────
  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    try { localStorage.setItem(STORAGE_VOLUME_KEY, String(volume)); } catch { /* ignore */ }
  }, [volume, isMuted]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volumeRef.current;
    }
  }, [isMuted]);

  // ── Build a fresh shuffle queue (exclude currentIndex) ───────────────
  const buildShuffleQueue = useCallback((excludeIndex: number) => {
    const pl = playlistRef.current;
    const indices = pl.map((_, i) => i).filter((i) => i !== excludeIndex);
    shuffleQueueRef.current = shuffleArray(indices);
  }, []);

  // ── Internal: advance to a track by index (always reads from ref) ─────
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

    // Update URL hash for share feature
    try {
      window.location.hash = target.id;
    } catch { /* ignore */ }

    audio.src = target.url;
    audio.loop = repeatModeRef.current === 'one';
    audio.load();

    // Notify stats hook
    if (onTrackChange) onTrackChange(target.id);

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
  }, [onTrackChange]);

  // ── Get the next index honouring shuffle / repeat ─────────────────────
  const getNextIndex = useCallback(
    (currentIdx: number): number => {
      const pl = playlistRef.current;
      if (pl.length === 0) return 0;

      if (isShuffleRef.current) {
        // Replenish queue when empty
        if (shuffleQueueRef.current.length === 0) {
          buildShuffleQueue(currentIdx);
        }
        const next = shuffleQueueRef.current.shift();
        return next !== undefined ? next : 0;
      }

      // Sequential
      if (repeatModeRef.current === 'off') {
        // Stop at end — return -1 as sentinel
        return currentIdx < pl.length - 1 ? currentIdx + 1 : -1;
      }
      // repeat-all wraps around
      return (currentIdx + 1) % pl.length;
    },
    [buildShuffleQueue]
  );

  // ── Initialize Audio element once on mount ────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = isMutedRef.current ? 0 : volumeRef.current;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleWaiting = () => setIsLoading(true);

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
      setError(null);
      if (onResume) onResume();
    };

    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsLoading(false);
      if (onPause) onPause();
    };

    /**
     * CRITICAL: `handleEnded` must use refs (not closures) to always advance
     * from the correct current index — this is the fix for the stale closure bug.
     * Note: when audio.loop=true (repeat-one), 'ended' never fires — browser loops natively.
     */
    const handleEnded = () => {
      const pl = playlistRef.current;
      const idx = currentIndexRef.current;
      if (pl.length === 0) return;

      const nextIdx = getNextIndex(idx);
      if (nextIdx === -1) {
        // repeat=off and we reached the end — just stop
        setIsPlaying(false);
        isPlayingRef.current = false;
        return;
      }
      goToIndex(nextIdx, true);
    };

    let skipErrorTimer: ReturnType<typeof setTimeout> | null = null;
    const handleError = () => {
      if (!audio.src || audio.src === window.location.href) return;
      console.warn('Audio playback error on current track:', audio.error?.message);
      setIsLoading(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
      setError('Unable to stream this track. Skipping...');

      skipErrorTimer = setTimeout(() => {
        setError(null);
        const pl = playlistRef.current;
        const idx = currentIndexRef.current;
        if (pl.length > 0) {
          const nextIdx = getNextIndex(idx);
          if (nextIdx !== -1) goToIndex(nextIdx, true);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToIndex, getNextIndex]);

  // ── Fetch tracks from API on mount ────────────────────────────────────
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
        setDataSource(data.source || 'unknown');

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
          // Check URL hash for share feature — jump to requested track
          let startIndex = 0;
          const hash = window.location.hash.slice(1);
          if (hash) {
            const idx = fetchedTracks.findIndex((t) => t.id === hash);
            if (idx !== -1) startIndex = idx;
          }

          currentIndexRef.current = startIndex;
          setCurrentIndex(startIndex);
          audioRef.current.src = fetchedTracks[startIndex].url;
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
    return () => { isMounted = false; };
  }, []);

  // ── Derived current track ─────────────────────────────────────────────
  const currentTrack = playlist[currentIndex] || null;

  // ── Play / Pause toggle ───────────────────────────────────────────────
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

  // ── Select track by index ─────────────────────────────────────────────
  const selectTrack = useCallback(
    (index: number, autoPlay: boolean = true) => {
      // When manually selecting in shuffle mode, rebuild the queue from new position
      if (isShuffleRef.current) buildShuffleQueue(index);
      goToIndex(index, autoPlay);
    },
    [goToIndex, buildShuffleQueue]
  );

  // ── Next track ────────────────────────────────────────────────────────
  const next = useCallback(() => {
    const pl = playlistRef.current;
    if (pl.length === 0) return;
    const nextIdx = getNextIndex(currentIndexRef.current);
    if (nextIdx === -1) return; // end of list with repeat=off
    goToIndex(nextIdx, true);
  }, [goToIndex, getNextIndex]);

  // ── Previous track (with 3-second smart restart) ──────────────────────
  const previous = useCallback(() => {
    const audio = audioRef.current;
    const pl = playlistRef.current;
    if (!audio || pl.length === 0) return;

    if (audio.currentTime > 3) {
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

  // ── Seek ──────────────────────────────────────────────────────────────
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

  // ── Toggle Shuffle ────────────────────────────────────────────────────
  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next) {
        buildShuffleQueue(currentIndexRef.current);
      } else {
        shuffleQueueRef.current = [];
      }
      return next;
    });
  }, [buildShuffleQueue]);

  // ── Cycle Repeat Mode: off → all → one → off ─────────────────────────
  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next: RepeatMode =
        prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      repeatModeRef.current = next;
      if (audioRef.current) {
        audioRef.current.loop = next === 'one';
      }
      return next;
    });
  }, []);

  // ── Reorder playlist ──────────────────────────────────────────────────
  const reorderPlaylist = useCallback((newPlaylist: Track[]) => {
    const activeid = playlistRef.current[currentIndexRef.current]?.id;
    playlistRef.current = newPlaylist;
    setPlaylist(newPlaylist);

    if (activeid) {
      const newIdx = newPlaylist.findIndex((t) => t.id === activeid);
      if (newIdx !== -1) {
        currentIndexRef.current = newIdx;
        setCurrentIndex(newIdx);
      }
    }

    // Rebuild shuffle queue with new order
    if (isShuffleRef.current) {
      buildShuffleQueue(currentIndexRef.current);
    }

    try {
      localStorage.setItem(
        STORAGE_PLAYLIST_KEY,
        JSON.stringify(newPlaylist.map((t) => t.id))
      );
    } catch (e) {
      console.warn('Failed to save playlist order:', e);
    }
  }, [buildShuffleQueue]);

  // ── Volume control ────────────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    prevVolume.current = clamped > 0 ? clamped : prevVolume.current;
    setVolumeState(clamped);
    if (clamped > 0 && isMutedRef.current) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (!next && volumeRef.current === 0) {
        // Restore previous volume when un-muting from 0
        setVolumeState(prevVolume.current > 0 ? prevVolume.current : 0.7);
      }
      return next;
    });
  }, []);

  // ── Sleep Timer ───────────────────────────────────────────────────────
  const setSleepTimerOption = useCallback((minutes: SleepTimerOption) => {
    // Clear any existing timer
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    setSleepTimer(minutes);

    if (minutes === 0) {
      setSleepRemaining(0);
      return;
    }

    const totalSeconds = minutes * 60;
    setSleepRemaining(totalSeconds);

    let remaining = totalSeconds;
    sleepTimerRef.current = setInterval(() => {
      remaining -= 1;
      setSleepRemaining(remaining);

      if (remaining <= 0) {
        // Time's up — pause audio
        clearInterval(sleepTimerRef.current!);
        sleepTimerRef.current = null;
        setSleepTimer(0);
        setSleepRemaining(0);
        if (audioRef.current) audioRef.current.pause();
      }
    }, 1000);
  }, []);

  // ── Cancel sleep timer ────────────────────────────────────────────────
  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimer(0);
    setSleepRemaining(0);
  }, []);

  // Cleanup sleep timer on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, []);

  // ── Share current track (copy URL with hash to clipboard) ─────────────
  const shareCurrentTrack = useCallback(async (): Promise<boolean> => {
    const track = playlistRef.current[currentIndexRef.current];
    if (!track) return false;
    try {
      const url = `${window.location.origin}${window.location.pathname}#${track.id}`;
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Playlist open/close ───────────────────────────────────────────────
  const togglePlaylist = useCallback(() => setIsPlaylistOpen((prev) => !prev), []);
  const closePlaylist = useCallback(() => setIsPlaylistOpen(false), []);

  // ── Global Keyboard Shortcuts ─────────────────────────────────────────
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
          if (e.shiftKey) {
            // Shift+Right = volume up
            e.preventDefault();
            setVolume(Math.min(1, volumeRef.current + 0.05));
          } else {
            e.preventDefault();
            next();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Shift+Left = volume down
            e.preventDefault();
            setVolume(Math.max(0, volumeRef.current - 0.05));
          } else {
            e.preventDefault();
            previous();
          }
          break;
        case 'Escape':
          e.preventDefault();
          closePlaylist();
          break;
        case 'KeyS':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'KeyR':
          e.preventDefault();
          cycleRepeat();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, next, previous, closePlaylist, toggleShuffle, cycleRepeat, toggleMute, setVolume]);

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
    isShuffle,
    repeatMode,
    volume,
    isMuted,
    sleepTimer,
    sleepRemaining,
    togglePlay,
    selectTrack,
    next,
    previous,
    seek,
    reorderPlaylist,
    togglePlaylist,
    closePlaylist,
    toggleShuffle,
    cycleRepeat,
    setVolume,
    toggleMute,
    setSleepTimerOption,
    cancelSleepTimer,
    shareCurrentTrack,
  };
}
