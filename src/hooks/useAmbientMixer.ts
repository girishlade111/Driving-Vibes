import { useState, useEffect, useRef, useCallback } from 'react';

export type AmbientSoundType = 'rain' | 'thunder' | 'campfire' | 'wind' | 'crickets' | 'vinyl';

export interface AmbientSoundConfig {
  id: AmbientSoundType;
  name: string;
  icon: string;
  volume: number; // 0 to 1
  enabled: boolean;
}

export interface AmbientPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  sounds: Partial<Record<AmbientSoundType, number>>;
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'rainy_drive',
    name: 'Rainy Night Drive',
    icon: '🌧️',
    description: 'Gentle rain and distant thunder on the highway',
    sounds: { rain: 0.65, thunder: 0.35, wind: 0.25 },
  },
  {
    id: 'cozy_campfire',
    name: 'Cozy Campfire',
    icon: '🔥',
    description: 'Warm crackling fire with peaceful night crickets',
    sounds: { campfire: 0.7, crickets: 0.4, wind: 0.15 },
  },
  {
    id: 'retro_lofi',
    name: 'Vintage Lo-Fi',
    icon: '📻',
    description: 'Analog vinyl crackle with soft room rain',
    sounds: { vinyl: 0.6, rain: 0.3 },
  },
  {
    id: 'midnight_forest',
    name: 'Midnight Forest',
    icon: '🦗',
    description: 'Lush night breeze and summer crickets',
    sounds: { crickets: 0.7, wind: 0.45 },
  },
  {
    id: 'clear',
    name: 'Mute All',
    icon: '🔇',
    description: 'Disable all ambient sounds',
    sounds: {},
  },
];

const STORAGE_KEY = 'driving_vibes_ambient_settings';

const INITIAL_SOUNDS: Record<AmbientSoundType, { name: string; icon: string; defaultVol: number }> = {
  rain: { name: 'Rain Shower', icon: '🌧️', defaultVol: 0.5 },
  thunder: { name: 'Thunder Rumble', icon: '⛈️', defaultVol: 0.3 },
  campfire: { name: 'Campfire', icon: '🔥', defaultVol: 0.4 },
  wind: { name: 'Gentle Wind', icon: '🍃', defaultVol: 0.35 },
  crickets: { name: 'Night Crickets', icon: '🦗', defaultVol: 0.4 },
  vinyl: { name: 'Vinyl Crackle', icon: '📻', defaultVol: 0.3 },
};

function loadStoredConfig(): { masterVolume: number; isEnabled: boolean; volumes: Record<AmbientSoundType, number>; enabledSounds: Record<AmbientSoundType, boolean> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    /* ignore */
  }
  return {
    masterVolume: 0.7,
    isEnabled: false,
    volumes: {
      rain: 0.5,
      thunder: 0.3,
      campfire: 0.4,
      wind: 0.35,
      crickets: 0.4,
      vinyl: 0.3,
    },
    enabledSounds: {
      rain: false,
      thunder: false,
      campfire: false,
      wind: false,
      crickets: false,
      vinyl: false,
    },
  };
}

export function useAmbientMixer() {
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [config, setConfig] = useState(loadStoredConfig);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const soundNodesRef = useRef<Map<AmbientSoundType, { gain: GainNode; cleanup: () => void }>>(new Map());

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      /* ignore */
    }
  }, [config]);

  // Lazy init AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = config.isEnabled ? config.masterVolume : 0;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return { ctx: audioCtxRef.current, masterGain: masterGainRef.current! };
  }, [config.isEnabled, config.masterVolume]);

  // Synthesis engine for each sound type
  const startSoundGenerator = useCallback((type: AmbientSoundType, ctx: AudioContext, destination: GainNode): { gain: GainNode; cleanup: () => void } => {
    const channelGain = ctx.createGain();
    channelGain.gain.value = config.volumes[type] || 0.5;
    channelGain.connect(destination);

    const cleanupFns: (() => void)[] = [];

    // Helper: Create 5-second buffer of white noise
    const createNoiseBuffer = () => {
      const bufferSize = ctx.sampleRate * 5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      return buffer;
    };

    // Helper: Create pink noise buffer
    const createPinkNoiseBuffer = () => {
      const bufferSize = ctx.sampleRate * 5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      return buffer;
    };

    switch (type) {
      case 'rain': {
        const noise = ctx.createBufferSource();
        noise.buffer = createPinkNoiseBuffer();
        noise.loop = true;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 300;

        noise.connect(lp);
        lp.connect(hp);
        hp.connect(channelGain);
        noise.start();

        cleanupFns.push(() => {
          try { noise.stop(); noise.disconnect(); } catch { /* ignore */ }
        });
        break;
      }

      case 'thunder': {
        let timer: ReturnType<typeof setTimeout> | null = null;
        let isStopped = false;

        const triggerThunder = () => {
          if (isStopped) return;
          const thunderSource = ctx.createBufferSource();
          thunderSource.buffer = createPinkNoiseBuffer();
          thunderSource.loop = true;

          const tFilter = ctx.createBiquadFilter();
          tFilter.type = 'lowpass';
          tFilter.frequency.value = 120;

          const tGain = ctx.createGain();
          const now = ctx.currentTime;
          tGain.gain.setValueAtTime(0, now);
          tGain.gain.linearRampToValueAtTime(0.8 + Math.random() * 0.4, now + 1.2);
          tGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5 + Math.random() * 2);

          thunderSource.connect(tFilter);
          tFilter.connect(tGain);
          tGain.connect(channelGain);
          thunderSource.start(now);
          thunderSource.stop(now + 7);

          const nextDelay = 7000 + Math.random() * 10000;
          timer = setTimeout(triggerThunder, nextDelay);
        };

        triggerThunder();
        cleanupFns.push(() => {
          isStopped = true;
          if (timer) clearTimeout(timer);
        });
        break;
      }

      case 'campfire': {
        const baseNoise = ctx.createBufferSource();
        baseNoise.buffer = createPinkNoiseBuffer();
        baseNoise.loop = true;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 500;
        bp.Q.value = 1.2;

        const baseGain = ctx.createGain();
        baseGain.gain.value = 0.35;

        baseNoise.connect(bp);
        bp.connect(baseGain);
        baseGain.connect(channelGain);
        baseNoise.start();

        let crackleTimer: ReturnType<typeof setInterval> | null = null;
        const crackleBuffer = createNoiseBuffer();

        crackleTimer = setInterval(() => {
          if (Math.random() < 0.4) {
            const crackle = ctx.createBufferSource();
            crackle.buffer = crackleBuffer;
            const crackleFilter = ctx.createBiquadFilter();
            crackleFilter.type = 'highpass';
            crackleFilter.frequency.value = 2500;

            const cGain = ctx.createGain();
            const now = ctx.currentTime;
            const duration = 0.02 + Math.random() * 0.05;
            cGain.gain.setValueAtTime(0.3 + Math.random() * 0.5, now);
            cGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            crackle.connect(crackleFilter);
            crackleFilter.connect(cGain);
            cGain.connect(channelGain);
            crackle.start(now);
            crackle.stop(now + duration + 0.05);
          }
        }, 120);

        cleanupFns.push(() => {
          if (crackleTimer) clearInterval(crackleTimer);
          try { baseNoise.stop(); baseNoise.disconnect(); } catch { /* ignore */ }
        });
        break;
      }

      case 'wind': {
        const windNoise = ctx.createBufferSource();
        windNoise.buffer = createPinkNoiseBuffer();
        windNoise.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 350;
        windFilter.Q.value = 2.0;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 220;

        lfo.connect(lfoGain);
        lfoGain.connect(windFilter.frequency);

        windNoise.connect(windFilter);
        windFilter.connect(channelGain);

        windNoise.start();
        lfo.start();

        cleanupFns.push(() => {
          try {
            windNoise.stop();
            lfo.stop();
            windNoise.disconnect();
            lfo.disconnect();
          } catch { /* ignore */ }
        });
        break;
      }

      case 'crickets': {
        let chirpTimer: ReturnType<typeof setInterval> | null = null;

        chirpTimer = setInterval(() => {
          if (Math.random() < 0.65) {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.value = 4600 + (Math.random() * 200 - 100);
            osc2.frequency.value = 5200 + (Math.random() * 200 - 100);

            const chirpGain = ctx.createGain();
            const now = ctx.currentTime;
            const chirpLen = 0.12 + Math.random() * 0.08;

            chirpGain.gain.setValueAtTime(0, now);
            chirpGain.gain.linearRampToValueAtTime(0.18, now + 0.02);
            chirpGain.gain.linearRampToValueAtTime(0.04, now + 0.06);
            chirpGain.gain.linearRampToValueAtTime(0.15, now + 0.08);
            chirpGain.gain.exponentialRampToValueAtTime(0.001, now + chirpLen);

            osc1.connect(chirpGain);
            osc2.connect(chirpGain);
            chirpGain.connect(channelGain);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + chirpLen + 0.05);
            osc2.stop(now + chirpLen + 0.05);
          }
        }, 220);

        cleanupFns.push(() => {
          if (chirpTimer) clearInterval(chirpTimer);
        });
        break;
      }

      case 'vinyl': {
        const hiss = ctx.createBufferSource();
        hiss.buffer = createNoiseBuffer();
        hiss.loop = true;

        const hissFilter = ctx.createBiquadFilter();
        hissFilter.type = 'bandpass';
        hissFilter.frequency.value = 1800;
        hissFilter.Q.value = 0.6;

        const hissGain = ctx.createGain();
        hissGain.gain.value = 0.08;

        hiss.connect(hissFilter);
        hissFilter.connect(hissGain);
        hissGain.connect(channelGain);
        hiss.start();

        let popTimer: ReturnType<typeof setInterval> | null = null;
        const popNoise = createNoiseBuffer();

        popTimer = setInterval(() => {
          if (Math.random() < 0.3) {
            const pop = ctx.createBufferSource();
            pop.buffer = popNoise;

            const popFilter = ctx.createBiquadFilter();
            popFilter.type = 'highpass';
            popFilter.frequency.value = 3500;

            const pGain = ctx.createGain();
            const now = ctx.currentTime;
            const dur = 0.008 + Math.random() * 0.015;
            pGain.gain.setValueAtTime(0.25 + Math.random() * 0.35, now);
            pGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            pop.connect(popFilter);
            popFilter.connect(pGain);
            pGain.connect(channelGain);
            pop.start(now);
            pop.stop(now + dur + 0.02);
          }
        }, 90);

        cleanupFns.push(() => {
          if (popTimer) clearInterval(popTimer);
          try { hiss.stop(); hiss.disconnect(); } catch { /* ignore */ }
        });
        break;
      }
    }

    return {
      gain: channelGain,
      cleanup: () => {
        cleanupFns.forEach((fn) => fn());
        try { channelGain.disconnect(); } catch { /* ignore */ }
      },
    };
  }, [config.volumes]);

  // Sync active sound generators
  useEffect(() => {
    if (!config.isEnabled) {
      soundNodesRef.current.forEach((node) => node.cleanup());
      soundNodesRef.current.clear();
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      return;
    }

    const { ctx, masterGain } = getAudioContext();
    masterGain.gain.setValueAtTime(config.masterVolume, ctx.currentTime);

    const soundTypes: AmbientSoundType[] = ['rain', 'thunder', 'campfire', 'wind', 'crickets', 'vinyl'];

    soundTypes.forEach((type) => {
      const isEnabled = config.enabledSounds[type];
      const existing = soundNodesRef.current.get(type);

      if (isEnabled && !existing) {
        const node = startSoundGenerator(type, ctx, masterGain);
        soundNodesRef.current.set(type, node);
      } else if (!isEnabled && existing) {
        existing.cleanup();
        soundNodesRef.current.delete(type);
      } else if (isEnabled && existing) {
        existing.gain.gain.setValueAtTime(config.volumes[type] ?? 0.5, ctx.currentTime);
      }
    });
  }, [config.isEnabled, config.masterVolume, config.enabledSounds, config.volumes, getAudioContext, startSoundGenerator]);

  // Toggle master ambient switch
  const toggleAmbientMaster = useCallback(() => {
    setConfig((prev) => {
      const nextEnabled = !prev.isEnabled;
      const hasActive = Object.values(prev.enabledSounds).some(Boolean);
      return {
        ...prev,
        isEnabled: nextEnabled,
        enabledSounds: nextEnabled && !hasActive ? { ...prev.enabledSounds, rain: true } : prev.enabledSounds,
      };
    });
  }, []);

  // Toggle individual sound
  const toggleSound = useCallback((type: AmbientSoundType) => {
    setConfig((prev) => {
      const willBeActive = !prev.enabledSounds[type];
      return {
        ...prev,
        isEnabled: willBeActive ? true : prev.isEnabled,
        enabledSounds: {
          ...prev.enabledSounds,
          [type]: willBeActive,
        },
      };
    });
  }, []);

  // Set sound volume
  const setSoundVolume = useCallback((type: AmbientSoundType, volume: number) => {
    const vol = Math.max(0, Math.min(1, volume));
    setConfig((prev) => ({
      ...prev,
      volumes: {
        ...prev.volumes,
        [type]: vol,
      },
    }));
  }, []);

  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    const vol = Math.max(0, Math.min(1, volume));
    setConfig((prev) => ({
      ...prev,
      masterVolume: vol,
    }));
  }, []);

  // Apply preset
  const applyPreset = useCallback((preset: AmbientPreset) => {
    if (preset.id === 'clear') {
      setConfig((prev) => ({
        ...prev,
        isEnabled: false,
        enabledSounds: {
          rain: false,
          thunder: false,
          campfire: false,
          wind: false,
          crickets: false,
          vinyl: false,
        },
      }));
      return;
    }

    const newEnabled: Record<AmbientSoundType, boolean> = {
      rain: false,
      thunder: false,
      campfire: false,
      wind: false,
      crickets: false,
      vinyl: false,
    };
    const newVolumes = { ...config.volumes };

    Object.entries(preset.sounds).forEach(([k, vol]) => {
      const type = k as AmbientSoundType;
      newEnabled[type] = true;
      if (typeof vol === 'number') {
        newVolumes[type] = vol;
      }
    });

    setConfig((prev) => ({
      ...prev,
      isEnabled: true,
      enabledSounds: newEnabled,
      volumes: newVolumes,
    }));
  }, [config.volumes]);

  // Count active sounds
  const activeCount = config.isEnabled
    ? Object.values(config.enabledSounds).filter(Boolean).length
    : 0;

  return {
    isMixerOpen,
    openMixer: () => setIsMixerOpen(true),
    closeMixer: () => setIsMixerOpen(false),
    toggleMixer: () => setIsMixerOpen((p) => !p),
    isEnabled: config.isEnabled,
    masterVolume: config.masterVolume,
    volumes: config.volumes,
    enabledSounds: config.enabledSounds,
    activeCount,
    toggleAmbientMaster,
    toggleSound,
    setSoundVolume,
    setMasterVolume,
    applyPreset,
    soundMeta: INITIAL_SOUNDS,
  };
}
