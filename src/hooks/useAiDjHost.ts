import { useState, useEffect, useRef, useCallback } from 'react';

export type DjPersona = 'chill' | 'latenight' | 'retro';

export interface DjSettings {
  isEnabled: boolean;
  persona: DjPersona;
  announceOnTrackChange: boolean;
  chimeEnabled: boolean;
  volume: number; // 0 to 1
  rate: number;   // 0.8 to 1.2
  pitch: number;  // 0.8 to 1.2
}

const STORAGE_DJ_KEY = 'driving_vibes_ai_dj_settings';

function loadDjSettings(): DjSettings {
  try {
    const raw = localStorage.getItem(STORAGE_DJ_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    isEnabled: false,
    persona: 'latenight',
    announceOnTrackChange: true,
    chimeEnabled: true,
    volume: 0.8,
    rate: 0.92,
    pitch: 0.95,
  };
}

export function useAiDjHost() {
  const [isDjModalOpen, setIsDjModalOpen] = useState(false);
  const [settings, setSettings] = useState<DjSettings>(loadDjSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastAnnouncedTrackId = useRef<string | null>(null);
  const announcementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DJ_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  // Play subtle radio chime
  const playRadioChime = useCallback(() => {
    if (!settings.chimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc2.frequency.setValueAtTime(880.00, now + 0.12); // A5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12 * settings.volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.15);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      /* ignore */
    }
  }, [settings.chimeEnabled, settings.volume]);

  // Speak announcement text
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    playRadioChime();

    setCurrentAnnouncement(text);
    setIsSpeaking(true);

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = settings.volume;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;

      // Try selecting a calm English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Daniel') || v.name.includes('Samantha') || v.name.includes('Alex')))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);
        announcementTimerRef.current = setTimeout(() => {
          setCurrentAnnouncement(null);
        }, 4000);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentAnnouncement(null);
      };

      window.speechSynthesis.speak(utterance);
    }, 450);
  }, [playRadioChime, settings.volume, settings.rate, settings.pitch]);

  // Generate DJ announcement for track
  const announceTrack = useCallback((trackName: string, trackId: string) => {
    if (!settings.isEnabled || !settings.announceOnTrackChange) return;
    if (lastAnnouncedTrackId.current === trackId) return;
    lastAnnouncedTrackId.current = trackId;

    const hour = new Date().getHours();
    let timeGreeting = "Welcome back to Driving Vibes.";
    if (hour >= 5 && hour < 12) timeGreeting = "Good morning travelers, welcome to your morning drive.";
    else if (hour >= 12 && hour < 17) timeGreeting = "Cruising through the afternoon on Driving Vibes.";
    else if (hour >= 17 && hour < 21) timeGreeting = "Golden hour vibes. Lean back and enjoy the sunset.";
    else timeGreeting = "Late night drive session on Driving Vibes.";

    let phrase = "";
    if (settings.persona === 'latenight') {
      phrase = `${timeGreeting} Up next, drifting into ${trackName}.`;
    } else if (settings.persona === 'retro') {
      phrase = `You are tuned into FM 88.5 Synthwave Drive. Now rolling with ${trackName}.`;
    } else {
      phrase = `Take a deep breath and relax. Here is ${trackName}.`;
    }

    speakText(phrase);
  }, [settings.isEnabled, settings.announceOnTrackChange, settings.persona, speakText]);

  const toggleDjMaster = useCallback(() => {
    setSettings((p) => ({ ...p, isEnabled: !p.isEnabled }));
  }, []);

  const setPersona = useCallback((persona: DjPersona) => {
    setSettings((p) => ({ ...p, persona }));
  }, []);

  const updateSetting = useCallback(<K extends keyof DjSettings>(key: K, val: DjSettings[K]) => {
    setSettings((p) => ({ ...p, [key]: val }));
  }, []);

  return {
    isDjModalOpen,
    openDjModal: () => setIsDjModalOpen(true),
    closeDjModal: () => setIsDjModalOpen(false),
    toggleDjModal: () => setIsDjModalOpen((p) => !p),
    settings,
    isSpeaking,
    currentAnnouncement,
    toggleDjMaster,
    setPersona,
    updateSetting,
    announceTrack,
    testSpeak: () => speakText("This is your AI radio host on Driving Vibes. Stay safe on the road."),
  };
}
