import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for browsers that support Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface VoiceCommandHandlers {
  onPlay: () => void;
  onPause: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleMute: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleShuffle: () => void;
  onExitCarMode: () => void;
}

export function useVoiceCommands(handlers: VoiceCommandHandlers) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);
  const handlersRef = useRef(handlers);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const showCommandFeedback = useCallback((commandText: string) => {
    setLastCommand(commandText);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setLastCommand(null);
    }, 3000);
  }, []);

  // Process speech transcript and trigger matching command
  const processTranscript = useCallback((text: string) => {
    const clean = text.toLowerCase().trim();
    setTranscript(clean);

    if (clean.includes('play') || clean.includes('start') || clean.includes('chalu')) {
      showCommandFeedback('▶ Play');
      handlersRef.current.onPlay();
    } else if (clean.includes('pause') || clean.includes('stop') || clean.includes('thambva')) {
      showCommandFeedback('⏸ Pause');
      handlersRef.current.onPause();
    } else if (clean.includes('next') || clean.includes('skip') || clean.includes('pudhe') || clean.includes('agla')) {
      showCommandFeedback('⏭ Next Track');
      handlersRef.current.onNext();
    } else if (clean.includes('previous') || clean.includes('back') || clean.includes('mage') || clean.includes('pichla')) {
      showCommandFeedback('⏮ Previous Track');
      handlersRef.current.onPrevious();
    } else if (clean.includes('mute') || clean.includes('silent') || clean.includes('unmute')) {
      showCommandFeedback('🔇 Toggle Mute');
      handlersRef.current.onToggleMute();
    } else if (clean.includes('volume up') || clean.includes('louder')) {
      showCommandFeedback('🔊 Volume Up');
      handlersRef.current.onVolumeUp();
    } else if (clean.includes('volume down') || clean.includes('softer')) {
      showCommandFeedback('🔉 Volume Down');
      handlersRef.current.onVolumeDown();
    } else if (clean.includes('shuffle')) {
      showCommandFeedback('🔀 Shuffle');
      handlersRef.current.onToggleShuffle();
    } else if (clean.includes('exit') || clean.includes('close car mode') || clean.includes('band')) {
      showCommandFeedback('🚗 Exiting Car Mode');
      handlersRef.current.onExitCarMode();
    }
  }, [showCommandFeedback]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }).SpeechRecognition || (window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult[0]) {
          const spokenText = lastResult[0].transcript;
          processTranscript(spokenText);
        }
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error !== 'no-speech') {
          console.warn('Speech recognition status:', e.error);
        }
      };

      recognition.onend = () => {
        // Automatically restart if user still has voice mode active
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            /* ignore start collisions */
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [processTranscript]);

  // Toggle voice recognition
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      isListeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    } else {
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        /* ignore */
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }
  }, []);

  return {
    isListening,
    isSupported,
    lastCommand,
    transcript,
    toggleListening,
    stopListening,
  };
}
