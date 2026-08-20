import { useState, useEffect, useRef, useCallback } from 'react';

export type FrequencyType = '432hz' | '528hz' | 'brown' | 'green';

export interface FrequencyConfig {
  id: FrequencyType;
  name: string;
  desc: string;
  icon: string;
  volume: number;
  enabled: boolean;
}

const STORAGE_FREQ_KEY = 'driving_vibes_freq_settings';

function loadFreqState(): { activeType: FrequencyType | null; volume: number } {
  try {
    const raw = localStorage.getItem(STORAGE_FREQ_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { activeType: null, volume: 0.35 };
}

export function useBinauralFrequencies() {
  const [state, setState] = useState(loadFreqState);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const soundNodesRef = useRef<{ cleanup: () => void } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FREQ_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const initContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = state.volume;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return { ctx: audioCtxRef.current, gainNode: gainNodeRef.current! };
  }, [state.volume]);

  // Generate Frequency Audio Nodes
  useEffect(() => {
    if (soundNodesRef.current) {
      soundNodesRef.current.cleanup();
      soundNodesRef.current = null;
    }

    if (!state.activeType) {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      return;
    }

    const { ctx, gainNode } = initContext();
    gainNode.gain.setValueAtTime(state.volume, ctx.currentTime);

    const cleanupFns: (() => void)[] = [];

    if (state.activeType === '432hz' || state.activeType === '528hz') {
      const freq = state.activeType === '432hz' ? 432 : 528;
      // Dual harmonic binaural oscillators
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.type = 'sine';
      oscR.type = 'sine';
      oscL.frequency.value = freq;
      oscR.frequency.value = freq + 4.5; // 4.5Hz Theta brainwave difference

      const subGain = ctx.createGain();
      subGain.gain.value = 0.25;

      oscL.connect(subGain);
      oscR.connect(subGain);
      subGain.connect(gainNode);

      oscL.start();
      oscR.start();

      cleanupFns.push(() => {
        try {
          oscL.stop();
          oscR.stop();
          oscL.disconnect();
          oscR.disconnect();
        } catch { /* ignore */ }
      });
    } else if (state.activeType === 'brown' || state.activeType === 'green') {
      // Procedural Brown / Green noise
      const bufferSize = ctx.sampleRate * 5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain boost
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (state.activeType === 'green') {
        filter.type = 'bandpass';
        filter.frequency.value = 500;
        filter.Q.value = 1.0;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 250;
      }

      noise.connect(filter);
      filter.connect(gainNode);
      noise.start();

      cleanupFns.push(() => {
        try {
          noise.stop();
          noise.disconnect();
        } catch { /* ignore */ }
      });
    }

    soundNodesRef.current = {
      cleanup: () => cleanupFns.forEach((fn) => fn()),
    };
  }, [state.activeType, state.volume, initContext]);

  const selectFrequency = useCallback((type: FrequencyType | null) => {
    setState((prev) => ({
      ...prev,
      activeType: prev.activeType === type ? null : type,
    }));
  }, []);

  const setFrequencyVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setState((prev) => ({ ...prev, volume: clamped }));
  }, []);

  return {
    activeType: state.activeType,
    volume: state.volume,
    selectFrequency,
    setFrequencyVolume,
  };
}
