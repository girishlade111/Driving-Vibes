import { useState, useEffect, useRef, useCallback } from 'react';

export interface EqPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  bass: number; // -12 to +12 dB
  mid: number;  // -12 to +12 dB
  treble: number; // -12 to +12 dB
  speed?: number;
}

export const EQ_PRESETS: EqPreset[] = [
  {
    id: 'flat',
    name: 'Flat / Studio',
    icon: '⚖️',
    description: 'Clean, uncolored original mix',
    bass: 0,
    mid: 0,
    treble: 0,
  },
  {
    id: 'bass_boost',
    name: 'Bass Boost',
    icon: '🔊',
    description: 'Punchy low-end and deep sub rumble',
    bass: 8,
    mid: 0,
    treble: -1,
  },
  {
    id: 'night_drive',
    name: 'Night Drive',
    icon: '🌃',
    description: 'V-shaped curve: Deep sub & crisp highs',
    bass: 6,
    mid: -2,
    treble: 5,
  },
  {
    id: 'lofi_warmth',
    name: 'Lo-Fi Warmth',
    icon: '☕',
    description: 'Smooth analog mids with rolled-off highs',
    bass: 4,
    mid: 3,
    treble: -6,
  },
  {
    id: 'acoustic',
    name: 'Acoustic / Chill',
    icon: '🎸',
    description: 'Enhanced vocal presence & instrument clarity',
    bass: 2,
    mid: 4,
    treble: 3,
  },
  {
    id: 'slowed_reverb',
    name: 'Slowed + Ambient',
    icon: '🌌',
    description: 'Atmospheric 0.8x tempo with warm bass',
    bass: 5,
    mid: 1,
    treble: -3,
    speed: 0.8,
  },
];

const STORAGE_EQ_KEY = 'driving_vibes_eq_settings';

interface EqSettings {
  presetId: string;
  bass: number;
  mid: number;
  treble: number;
  speed: number;
  isSpatial: boolean;
}

function loadStoredEq(): EqSettings {
  try {
    const raw = localStorage.getItem(STORAGE_EQ_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    presetId: 'night_drive',
    bass: 6,
    mid: -2,
    treble: 5,
    speed: 1.0,
    isSpatial: false,
  };
}

export function useAudioEqualizer(audioElementRef: React.RefObject<HTMLAudioElement | null>) {
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [eqState, setEqState] = useState<EqSettings>(loadStoredEq);

  // Audio Context and Filter Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const spatialIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EQ_KEY, JSON.stringify(eqState));
    } catch {
      /* ignore */
    }
  }, [eqState]);

  // Connect Web Audio API to the HTML audio element
  const initAudioGraph = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Try creating media element source (may throw if CORS restricted)
        try {
          if (!sourceNodeRef.current) {
            sourceNodeRef.current = ctx.createMediaElementSource(audio);
          }
        } catch {
          // If already connected or restricted, continue
        }

        // Low Shelf filter (Bass ~100Hz)
        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 120;
        bass.gain.value = eqState.bass;
        bassFilterRef.current = bass;

        // Peaking filter (Mids ~1000Hz)
        const mid = ctx.createBiquadFilter();
        mid.type = 'peaking';
        mid.frequency.value = 1000;
        mid.Q.value = 1.0;
        mid.gain.value = eqState.mid;
        midFilterRef.current = mid;

        // High Shelf filter (Treble ~4000Hz)
        const treble = ctx.createBiquadFilter();
        treble.type = 'highshelf';
        treble.frequency.value = 4000;
        treble.gain.value = eqState.treble;
        trebleFilterRef.current = treble;

        // Stereo Panner (for spatial vibe)
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        pannerRef.current = panner;

        if (sourceNodeRef.current) {
          sourceNodeRef.current.connect(bass);
          bass.connect(mid);
          mid.connect(treble);

          if (panner) {
            treble.connect(panner);
            panner.connect(ctx.destination);
          } else {
            treble.connect(ctx.destination);
          }
        }
      }

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('Web Audio EQ initialization fallback:', err);
    }
  }, [audioElementRef, eqState.bass, eqState.mid, eqState.treble]);

  // Sync EQ values with Filter Nodes
  useEffect(() => {
    initAudioGraph();
    const ctx = audioCtxRef.current;
    if (ctx) {
      const now = ctx.currentTime;
      if (bassFilterRef.current) bassFilterRef.current.gain.setValueAtTime(eqState.bass, now);
      if (midFilterRef.current) midFilterRef.current.gain.setValueAtTime(eqState.mid, now);
      if (trebleFilterRef.current) trebleFilterRef.current.gain.setValueAtTime(eqState.treble, now);
    }
  }, [eqState.bass, eqState.mid, eqState.treble, initAudioGraph]);

  // Resume AudioContext whenever audio starts playing or user interacts
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleResume = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };

    audio.addEventListener('play', handleResume);
    audio.addEventListener('playing', handleResume);
    return () => {
      audio.removeEventListener('play', handleResume);
      audio.removeEventListener('playing', handleResume);
    };
  }, [audioElementRef]);

  // Sync Playback Speed with Audio Element
  useEffect(() => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.playbackRate = eqState.speed;
    }
  }, [eqState.speed, audioElementRef]);

  // Handle 8D / Spatial Panning oscillation
  useEffect(() => {
    if (spatialIntervalRef.current) {
      clearInterval(spatialIntervalRef.current);
      spatialIntervalRef.current = null;
    }

    if (eqState.isSpatial && pannerRef.current) {
      let panPos = 0;
      let direction = 0.04;
      spatialIntervalRef.current = setInterval(() => {
        panPos += direction;
        if (panPos > 0.85) direction = -0.04;
        if (panPos < -0.85) direction = 0.04;
        if (pannerRef.current) {
          pannerRef.current.pan.value = panPos;
        }
      }, 100);
    } else if (pannerRef.current) {
      pannerRef.current.pan.value = 0;
    }

    return () => {
      if (spatialIntervalRef.current) clearInterval(spatialIntervalRef.current);
    };
  }, [eqState.isSpatial]);

  // Preset setter
  const applyPreset = useCallback((preset: EqPreset) => {
    setEqState((prev) => ({
      ...prev,
      presetId: preset.id,
      bass: preset.bass,
      mid: preset.mid,
      treble: preset.treble,
      speed: preset.speed ?? prev.speed,
    }));
  }, []);

  // Custom Band Adjuster
  const setBandGain = useCallback((band: 'bass' | 'mid' | 'treble', value: number) => {
    const clamped = Math.max(-12, Math.min(12, value));
    setEqState((prev) => ({
      ...prev,
      presetId: 'custom',
      [band]: clamped,
    }));
  }, []);

  // Playback Speed Setter
  const setPlaybackSpeed = useCallback((speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    setEqState((prev) => ({
      ...prev,
      speed: clamped,
    }));
  }, []);

  // Toggle 8D Spatial
  const toggleSpatial = useCallback(() => {
    setEqState((prev) => ({
      ...prev,
      isSpatial: !prev.isSpatial,
    }));
  }, []);

  // Reset to Flat
  const resetEq = useCallback(() => {
    setEqState({
      presetId: 'flat',
      bass: 0,
      mid: 0,
      treble: 0,
      speed: 1.0,
      isSpatial: false,
    });
  }, []);

  return {
    isEqOpen,
    openEq: () => setIsEqOpen(true),
    closeEq: () => setIsEqOpen(false),
    toggleEq: () => setIsEqOpen((p) => !p),
    bass: eqState.bass,
    mid: eqState.mid,
    treble: eqState.treble,
    speed: eqState.speed,
    presetId: eqState.presetId,
    isSpatial: eqState.isSpatial,
    applyPreset,
    setBandGain,
    setPlaybackSpeed,
    toggleSpatial,
    resetEq,
    initAudioGraph,
  };
}
