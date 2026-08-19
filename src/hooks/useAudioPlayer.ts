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
  const [error, setError] = useState<string | null>(null);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>('loading');

  // Single persistent HTMLAudioElement instance
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track currently active play promise to avoid play/pause race conditions
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio) {
        setDuration(audio.duration || 0);
        setIsLoading(false);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      // Automatic continuous progression to next song
      next();
    };

    const handleError = () => {
      console.warn('Audio playback error on current track');
      setIsLoading(false);
      setIsPlaying(false);
      setError('Unable to stream this track. Skipping...');
      
      // Auto-skip to next track after a brief moment
      const timer = setTimeout(() => {
        next();
      }, 1500);
      return () => clearTimeout(timer);
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
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Fetch tracks from API
  useEffect(() => {
    let isMounted = true;
    async function loadTracks() {
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        
        if (!isMounted) return;

        let fetchedTracks: Track[] = data.tracks || [];
        setDataSource(data.source || 'demo');

        // Check if user had a saved order from previous session
        const savedOrderJson = localStorage.getItem(STORAGE_PLAYLIST_KEY);
        if (savedOrderJson) {
          try {
            const savedIds: string[] = JSON.parse(savedOrderJson);
            const trackMap = new Map(fetchedTracks.map(t => [t.id, t]));
            const ordered: Track[] = [];
            
            // Add tracks according to saved order
            for (const id of savedIds) {
              if (trackMap.has(id)) {
                ordered.push(trackMap.get(id)!);
                trackMap.delete(id);
              }
            }
            // Append any newly discovered tracks not in saved list
            trackMap.forEach(t => ordered.push(t));

            if (ordered.length > 0) {
              fetchedTracks = ordered;
            }
          } catch (e) {
            console.warn('Failed to parse saved playlist order:', e);
          }
        }

        setPlaylist(fetchedTracks);
        if (fetchedTracks.length > 0) {
          setCurrentIndex(0);
          if (audioRef.current) {
            audioRef.current.src = fetchedTracks[0].url;
          }
        }
      } catch (err) {
        console.error('Failed to load tracks:', err);
        setError('Music catalog temporarily unavailable');
      }
    }

    loadTracks();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentTrack = playlist[currentIndex] || null;

  // Safe play helper
  const playTrack = useCallback(async (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.src !== track.url) {
        audio.src = track.url;
        audio.load();
      }
      setIsLoading(true);
      setError(null);
      
      playPromiseRef.current = audio.play();
      await playPromiseRef.current;
      setIsPlaying(true);
      setIsLoading(false);
    } catch (e: any) {
      // AbortError is normal when switching tracks rapidly
      if (e.name !== 'AbortError') {
        console.warn('Playback gesture required or stream failed:', e);
        setIsPlaying(false);
      }
      setIsLoading(false);
    }
  }, []);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      playTrack(currentTrack);
    }
  }, [isPlaying, currentTrack, playTrack]);

  // Select track by index
  const selectTrack = useCallback((index: number, autoPlay: boolean = true) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrentIndex(index);
    const target = playlist[index];
    if (autoPlay) {
      playTrack(target);
    } else if (audioRef.current) {
      audioRef.current.src = target.url;
    }
  }, [playlist, playTrack]);

  // Next Track
  const next = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIdx = (currentIndex + 1) % playlist.length;
    selectTrack(nextIdx, true);
  }, [playlist.length, currentIndex, selectTrack]);

  // Previous Track (with 3-second smart seek rule)
  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || playlist.length === 0) return;

    // If song has played for more than 3 seconds, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        playTrack(playlist[currentIndex]);
      }
    } else {
      // Move to previous track
      const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
      selectTrack(prevIdx, true);
    }
  }, [playlist, currentIndex, isPlaying, selectTrack, playTrack]);

  // Seek to specified seconds
  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, duration));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  // Reorder playlist (drag and drop)
  const reorderPlaylist = useCallback((newPlaylist: Track[]) => {
    const active = currentTrack;
    setPlaylist(newPlaylist);

    // Maintain correct currentIndex matching currently playing track
    if (active) {
      const newIdx = newPlaylist.findIndex(t => t.id === active.id);
      if (newIdx !== -1) {
        setCurrentIndex(newIdx);
      }
    }

    // Persist new ordering IDs in localStorage
    try {
      const ids = newPlaylist.map(t => t.id);
      localStorage.setItem(STORAGE_PLAYLIST_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn('Failed to save playlist order:', e);
    }
  }, [currentTrack]);

  const togglePlaylist = useCallback(() => {
    setIsPlaylistOpen(prev => !prev);
  }, []);

  const closePlaylist = useCallback(() => {
    setIsPlaylistOpen(false);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

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
    error,
    isPlaylistOpen,
    dataSource,
    togglePlay,
    playTrack,
    selectTrack,
    next,
    previous,
    seek,
    reorderPlaylist,
    togglePlaylist,
    closePlaylist,
  };
}
