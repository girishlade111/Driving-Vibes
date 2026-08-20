import { useState, useEffect, useRef, useCallback } from 'react';

export type PomodoroMode = 'focus' | 'break';

export function usePomodoroTimer() {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min in seconds
  const [completedSessions, setCompletedSessions] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play pleasant focus chime
  const playFocusBell = useCallback((isBreakStart: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isBreakStart ? 523.25 : 659.25, now); // C5 or E5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.0);
    } catch {
      /* ignore */
    }
  }, []);

  // Timer Tick
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (mode === 'focus') {
            playFocusBell(true);
            setMode('break');
            setCompletedSessions((c) => c + 1);
            return 5 * 60; // 5 min break
          } else {
            playFocusBell(false);
            setMode('focus');
            return 25 * 60; // 25 min focus
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, playFocusBell]);

  const toggleTimer = useCallback(() => setIsRunning((p) => !p), []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setMode('focus');
    setTimeLeft(25 * 60);
  }, []);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return {
    mode,
    isRunning,
    timeLeft,
    completedSessions,
    formattedTime: formatTimer(timeLeft),
    toggleTimer,
    resetTimer,
    switchMode,
  };
}
