import { useState, useEffect, useCallback, useRef } from 'react';
import { Track } from '../types/music';
import {
  TripRoute,
  TRIP_ROUTES,
  TripPassenger,
  TripChatMessage,
  TripSyncEvent,
} from '../types/virtualTrip';

interface UseVirtualTripProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  playlist: Track[];
  onSelectTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
}

const CAR_EMOJIS = ['🏎️', '🚙', '⚡', '🚗', '🏍️', '🚐'];
const DRIVER_NAMES = [
  'Night Cruiser',
  'Tokyo Drifter',
  'Sunset Pilot',
  'Alpine Scout',
  'Highway Nomad',
  'Cyber Voyager',
];

/** Synthesize realistic car dual-tone horn using Web Audio API */
function playCarHornSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Dual-tone European/Japanese car horn frequencies: 440Hz (A4) & 554Hz (C#5)
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(554, ctx.currentTime);

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.22);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    /* ignore */
  }
}

export function useVirtualTrip({
  currentTrack,
  isPlaying,
  currentTime,
  playlist,
  onSelectTrack,
  onTogglePlay,
  onSeek,
}: UseVirtualTripProps) {
  const [isTripModalOpen, setIsTripModalOpen] = useState<boolean>(false);
  const [tripId, setTripId] = useState<string>('PACIFIC-COAST');
  const [isHost, setIsHost] = useState<boolean>(true);
  const [followHost, setFollowHost] = useState<boolean>(true);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  // Self Profile
  const [selfName, setSelfName] = useState<string>(() => {
    try {
      return localStorage.getItem('driving_vibes_traveler_name') || DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)];
    } catch {
      return DRIVER_NAMES[0];
    }
  });

  const [selfCar, setSelfCar] = useState<string>(() => {
    try {
      return localStorage.getItem('driving_vibes_traveler_car') || CAR_EMOJIS[0];
    } catch {
      return CAR_EMOJIS[0];
    }
  });

  const selfIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  // Route and Progress
  const [selectedRouteId, setSelectedRouteId] = useState<string>('pacific_coast');
  const [progressKm, setProgressKm] = useState<number>(42);

  // Live Passengers Roster
  const [passengers, setPassengers] = useState<TripPassenger[]>([]);

  // Live Chat & Reactions
  const [chatMessages, setChatMessages] = useState<TripChatMessage[]>([
    {
      id: 'welcome-1',
      senderId: 'sys',
      senderName: 'Highway Dispatch',
      carEmoji: '🛣️',
      text: 'Welcome to the synchronized road trip! Play music to start driving.',
      timestamp: 'Just now',
      type: 'system',
    },
  ]);

  const [activeReaction, setActiveReaction] = useState<{ emoji: string; text: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('🟢 Host Driver Active');

  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  const isIncomingSyncRef = useRef<boolean>(false);

  const currentRoute = TRIP_ROUTES.find((r) => r.id === selectedRouteId) ?? TRIP_ROUTES[0];

  // 1. Initialize BroadcastChannel & URL hash
  useEffect(() => {
    // Read from URL hash
    const hash = window.location.hash;
    const match = hash.match(/#trip=([a-zA-Z0-9_-]+)/);
    let initialRoom = 'PACIFIC-COAST';
    if (match && match[1]) {
      initialRoom = match[1].toUpperCase();
      setTripId(initialRoom);
      setIsHost(false); // Joining via link sets as passenger by default
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('driving_vibes_virtual_trip');
        channelRef.current = channel;

        channel.onmessage = (event: MessageEvent<TripSyncEvent>) => {
          handleIncomingSyncEvent(event.data);
        };
      }
    } catch {
      /* ignore */
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // 2. Announce presence in room
  useEffect(() => {
    broadcastEvent({
      type: 'JOIN_ROOM',
      roomId: tripId,
      senderId: selfIdRef.current,
      senderName: selfName,
      carEmoji: selfCar,
      payload: {},
    });

    // Populate initial passengers list
    setPassengers([
      {
        id: selfIdRef.current,
        name: `${selfName} (You)`,
        carEmoji: selfCar,
        isHost: isHost,
        isSelf: true,
        joinedAt: Date.now(),
        speedKmh: isPlaying ? 88 : 0,
      },
      {
        id: 'co-pilot-1',
        name: 'Tokyo Drifter',
        carEmoji: '🏎️',
        isHost: !isHost,
        isSelf: false,
        joinedAt: Date.now() - 60000,
        speedKmh: isPlaying ? 88 : 0,
      },
    ]);
  }, [tripId, isHost, selfName, selfCar]);

  // 3. Handle Incoming Cross-Tab / Friend Synchronized Events
  const handleIncomingSyncEvent = useCallback(
    (event: TripSyncEvent) => {
      if (event.roomId !== tripId || event.senderId === selfIdRef.current) {
        return;
      }

      switch (event.type) {
        case 'SYNC_PLAYBACK': {
          if (!isHost && followHost && event.payload) {
            isIncomingSyncRef.current = true;

            const { trackId, isPlaying: hostPlaying, currentTime: hostTime, routeId, distanceProgressKm } = event.payload;

            // Sync Route
            if (routeId && routeId !== selectedRouteId) {
              setSelectedRouteId(routeId);
            }
            if (typeof distanceProgressKm === 'number') {
              setProgressKm(distanceProgressKm);
            }

            // Sync Track
            if (trackId && currentTrack?.id !== trackId) {
              const target = playlist.find((t) => t.id === trackId);
              if (target) {
                onSelectTrack(target);
              }
            }

            // Sync Play/Pause
            if (typeof hostPlaying === 'boolean' && hostPlaying !== isPlaying) {
              onTogglePlay();
            }

            // Sync Seek Time with drift threshold (> 1.5s)
            if (typeof hostTime === 'number' && Math.abs(currentTime - hostTime) > 1.5) {
              onSeek(hostTime);
            }

            setSyncStatus('🟢 In Sync with Driver');
            setTimeout(() => {
              isIncomingSyncRef.current = false;
            }, 300);
          }
          break;
        }

        case 'CHAT_MESSAGE': {
          if (event.payload.chatText) {
            const newMsg: TripChatMessage = {
              id: Math.random().toString(36).substring(2, 9),
              senderId: event.senderId,
              senderName: event.senderName,
              carEmoji: event.carEmoji,
              text: event.payload.chatText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'chat',
            };
            setChatMessages((prev) => [...prev.slice(-30), newMsg]);
          }
          break;
        }

        case 'REACTION': {
          if (event.payload.reactionEmoji) {
            if (event.payload.reactionSound === 'horn') {
              playCarHornSound();
            }
            setActiveReaction({
              emoji: event.payload.reactionEmoji,
              text: `${event.senderName}: ${event.payload.reactionEmoji}`,
            });
            setTimeout(() => setActiveReaction(null), 3000);
          }
          break;
        }

        case 'ROUTE_CHANGE': {
          if (event.payload.routeId) {
            setSelectedRouteId(event.payload.routeId);
          }
          break;
        }

        case 'JOIN_ROOM': {
          setPassengers((prev) => {
            if (prev.some((p) => p.id === event.senderId)) return prev;
            return [
              ...prev,
              {
                id: event.senderId,
                name: event.senderName,
                carEmoji: event.carEmoji,
                isHost: false,
                isSelf: false,
                joinedAt: Date.now(),
                speedKmh: 85,
              },
            ];
          });
          break;
        }
      }
    },
    [tripId, isHost, followHost, currentTrack, playlist, isPlaying, currentTime, selectedRouteId, onSelectTrack, onTogglePlay, onSeek]
  );

  // 4. Helper to broadcast event to all other tabs / travelers
  const broadcastEvent = useCallback((event: TripSyncEvent) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(event);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // 5. Host broadcasts playback state on change
  useEffect(() => {
    if (isHost && !isIncomingSyncRef.current) {
      const now = Date.now();
      if (now - lastBroadcastRef.current > 400) {
        lastBroadcastRef.current = now;
        broadcastEvent({
          type: 'SYNC_PLAYBACK',
          roomId: tripId,
          senderId: selfIdRef.current,
          senderName: selfName,
          carEmoji: selfCar,
          payload: {
            trackId: currentTrack?.id,
            trackName: currentTrack?.name,
            isPlaying,
            currentTime,
            hostTimestamp: now,
            routeId: selectedRouteId,
            distanceProgressKm: progressKm,
          },
        });
      }
    }
  }, [isHost, tripId, currentTrack, isPlaying, currentTime, selectedRouteId, progressKm, selfName, selfCar, broadcastEvent]);

  // 6. Accumulate virtual highway progress as music plays (85 km/h)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setProgressKm((prev) => {
        const next = prev + (85 / 3600); // 85 km/h converted to km per second
        return next > currentRoute.totalDistanceKm ? 0 : Number(next.toFixed(2));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, currentRoute.totalDistanceKm]);

  // 7. Honk Horn Reaction
  const handleHonkHorn = () => {
    playCarHornSound();
    setActiveReaction({ emoji: '📢', text: 'You honked the horn!' });
    setTimeout(() => setActiveReaction(null), 2500);

    broadcastEvent({
      type: 'REACTION',
      roomId: tripId,
      senderId: selfIdRef.current,
      senderName: selfName,
      carEmoji: selfCar,
      payload: {
        reactionEmoji: '📢 HONK!',
        reactionSound: 'horn',
      },
    });
  };

  // 8. Flash High Beams Reaction
  const handleFlashBeams = () => {
    setActiveReaction({ emoji: '⚡', text: 'You flashed high beams!' });
    setTimeout(() => setActiveReaction(null), 2500);

    broadcastEvent({
      type: 'REACTION',
      roomId: tripId,
      senderId: selfIdRef.current,
      senderName: selfName,
      carEmoji: selfCar,
      payload: {
        reactionEmoji: '⚡ FLASH BEAMS',
        reactionSound: 'flash',
      },
    });
  };

  // 9. Send Quick Reaction / Emoji
  const handleSendReaction = (emoji: string, label: string) => {
    setActiveReaction({ emoji, text: `You: ${label}` });
    setTimeout(() => setActiveReaction(null), 2500);

    broadcastEvent({
      type: 'REACTION',
      roomId: tripId,
      senderId: selfIdRef.current,
      senderName: selfName,
      carEmoji: selfCar,
      payload: {
        reactionEmoji: `${emoji} ${label}`,
      },
    });
  };

  // 10. Send Chat Message
  const handleSendChat = (text: string) => {
    if (!text.trim()) return;

    const newMsg: TripChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: selfIdRef.current,
      senderName: `${selfName} (You)`,
      carEmoji: selfCar,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'chat',
    };

    setChatMessages((prev) => [...prev.slice(-30), newMsg]);

    broadcastEvent({
      type: 'CHAT_MESSAGE',
      roomId: tripId,
      senderId: selfIdRef.current,
      senderName: selfName,
      carEmoji: selfCar,
      payload: {
        chatText: text.trim(),
      },
    });
  };

  // 11. Copy Trip Link
  const copyTripLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#trip=${tripId}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
      return true;
    } catch {
      return false;
    }
  }, [tripId]);

  // 12. Create New Custom Room
  const createNewRoom = useCallback((customId?: string) => {
    const newId = customId ? customId.toUpperCase().replace(/[^A-Z0-9_-]/g, '') : Math.random().toString(36).substring(2, 8).toUpperCase();
    setTripId(newId);
    window.location.hash = `trip=${newId}`;
    setIsHost(true);
  }, []);

  // 13. Select Route
  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setProgressKm(0);
    if (isHost) {
      broadcastEvent({
        type: 'ROUTE_CHANGE',
        roomId: tripId,
        senderId: selfIdRef.current,
        senderName: selfName,
        carEmoji: selfCar,
        payload: { routeId },
      });
    }
  };

  // 14. Force Re-sync with Host
  const forceResyncWithHost = () => {
    setFollowHost(true);
    setSyncStatus('⚡ Re-syncing with Driver…');
    setTimeout(() => {
      setSyncStatus('🟢 In Sync with Driver');
    }, 600);
  };

  return {
    isTripModalOpen,
    openTripModal: () => setIsTripModalOpen(true),
    closeTripModal: () => setIsTripModalOpen(false),
    toggleTripModal: () => setIsTripModalOpen((p) => !p),
    tripId,
    isHost,
    setIsHost,
    followHost,
    setFollowHost,
    selfName,
    setSelfName,
    selfCar,
    setSelfCar,
    currentRoute,
    progressKm,
    passengers,
    chatMessages,
    activeReaction,
    syncStatus,
    copiedToast,
    copyTripLink,
    createNewRoom,
    handleSelectRoute,
    handleHonkHorn,
    handleFlashBeams,
    handleSendReaction,
    handleSendChat,
    forceResyncWithHost,
  };
}
