import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'driving_vibes_stats';

export interface TrackStat {
  playCount: number;
  totalSeconds: number;
}

export interface ListeningStats {
  perTrack: Record<string, TrackStat>;
  totalSeconds: number;
}

function loadStats(): ListeningStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { perTrack: {}, totalSeconds: 0 };
    return JSON.parse(raw) as ListeningStats;
  } catch {
    return { perTrack: {}, totalSeconds: 0 };
  }
}

function saveStats(stats: ListeningStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore quota errors
  }
}

export function useListeningStats() {
  const [stats, setStats] = useState<ListeningStats>(() => loadStats());

  // Interval ref for tracking current-track listening time
  const trackingRef = useRef<{
    trackId: string | null;
    startedAt: number;
  }>({ trackId: null, startedAt: 0 });

  // Persist whenever stats change
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  /**
   * Call when a new track starts playing.
   * Commits elapsed time for previous track and starts fresh.
   */
  const startTracking = useCallback((trackId: string) => {
    const now = Date.now();
    const prev = trackingRef.current;

    // Commit time for the previous track (if any)
    if (prev.trackId && prev.startedAt > 0) {
      const elapsed = Math.round((now - prev.startedAt) / 1000);
      if (elapsed > 0) {
        setStats((s) => {
          const pt = { ...(s.perTrack[prev.trackId!] ?? { playCount: 0, totalSeconds: 0 }) };
          pt.totalSeconds += elapsed;
          return {
            perTrack: { ...s.perTrack, [prev.trackId!]: pt },
            totalSeconds: s.totalSeconds + elapsed,
          };
        });
      }
    }

    // Start tracking new track
    trackingRef.current = { trackId, startedAt: now };

    // Increment play count
    setStats((s) => {
      const pt = { ...(s.perTrack[trackId] ?? { playCount: 0, totalSeconds: 0 }) };
      pt.playCount += 1;
      return { ...s, perTrack: { ...s.perTrack, [trackId]: pt } };
    });
  }, []);

  /** Call when audio pauses to commit elapsed time without switching tracks. */
  const pauseTracking = useCallback(() => {
    const now = Date.now();
    const prev = trackingRef.current;
    if (!prev.trackId || prev.startedAt === 0) return;

    const elapsed = Math.round((now - prev.startedAt) / 1000);
    if (elapsed > 0) {
      setStats((s) => {
        const pt = { ...(s.perTrack[prev.trackId!] ?? { playCount: 0, totalSeconds: 0 }) };
        pt.totalSeconds += elapsed;
        return {
          perTrack: { ...s.perTrack, [prev.trackId!]: pt },
          totalSeconds: s.totalSeconds + elapsed,
        };
      });
    }
    // Reset startedAt so we don't double-count
    trackingRef.current = { trackId: prev.trackId, startedAt: 0 };
  }, []);

  /** Call when audio resumes after a pause */
  const resumeTracking = useCallback(() => {
    if (trackingRef.current.trackId) {
      trackingRef.current.startedAt = Date.now();
    }
  }, []);

  /** Stop tracking (unmount / cleanup) */
  const stopTracking = useCallback(() => {
    pauseTracking();
    trackingRef.current = { trackId: null, startedAt: 0 };
  }, [pauseTracking]);

  const resetStats = useCallback(() => {
    setStats({ perTrack: {}, totalSeconds: 0 });
    trackingRef.current = { trackId: null, startedAt: 0 };
  }, []);

  const getTrackStat = useCallback(
    (trackId: string): TrackStat => stats.perTrack[trackId] ?? { playCount: 0, totalSeconds: 0 },
    [stats]
  );

  /** Format seconds as Xh Ym or Xm */
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  }, []);

  /** Find most-played track name from playlist */
  const getMostPlayed = useCallback(
    (playlist: { id: string; name: string }[]): { name: string; count: number } | null => {
      let best: { name: string; count: number } | null = null;
      for (const t of playlist) {
        const st = stats.perTrack[t.id];
        if (st && st.playCount > 0) {
          if (!best || st.playCount > best.count) {
            best = { name: t.name, count: st.playCount };
          }
        }
      }
      return best;
    },
    [stats]
  );

  return {
    stats,
    getTrackStat,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopTracking,
    resetStats,
    formatTime,
    getMostPlayed,
  };
}
