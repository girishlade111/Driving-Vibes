import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Copy,
  Check,
  X,
  RefreshCw,
  Send,
  Zap,
  MapPin,
} from 'lucide-react';
import { TripRoute, TRIP_ROUTES } from '../../types/virtualTrip';
import { useVirtualTrip } from '../../hooks/useVirtualTrip';

interface VirtualTripModalProps {
  tripState: ReturnType<typeof useVirtualTrip>;
}

export const VirtualTripModal: React.FC<VirtualTripModalProps> = ({ tripState }) => {
  const {
    isTripModalOpen,
    closeTripModal,
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
  } = tripState;

  const modalRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'journey' | 'chat' | 'passengers'>('journey');

  const CAR_OPTIONS = ['🏎️', '🚙', '⚡', '🚗', '🏍️', '🚐'];

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Escape key handler
  useEffect(() => {
    if (!isTripModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTripModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTripModalOpen, closeTripModal]);

  if (!isTripModalOpen) return null;

  const shareUrl = `${window.location.origin}${window.location.pathname}#trip=${tripId}`;
  const progressPercent = Math.min(100, (progressKm / currentRoute.totalDistanceKm) * 100);

  // Find next upcoming milestone
  const nextLandmark = currentRoute.landmarks.find((l) => l.distanceKm > progressKm) || currentRoute.landmarks[currentRoute.landmarks.length - 1];
  const kmToNext = Math.max(0, Math.round(nextLandmark.distanceKm - progressKm));

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleSendChat(inputText);
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn select-none">
      <div
        ref={modalRef}
        className="glass-panel w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/15 animate-slideUp text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Virtual Road Trip Room"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
              style={{
                backgroundColor: `${currentRoute.themeColor}20`,
                borderColor: `${currentRoute.themeColor}50`,
                color: currentRoute.themeColor,
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-white tracking-wide">
                  Virtual Road Trip
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Room #{tripId}
                </span>
              </div>
              <p className="text-xs text-white/50">{syncStatus}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Switcher Pill */}
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                onClick={() => setIsHost(true)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isHost
                    ? 'bg-amber-400 text-black font-bold shadow'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Driver DJ 🏎️
              </button>
              <button
                onClick={() => setIsHost(false)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  !isHost
                    ? 'bg-indigo-500 text-white font-bold shadow'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Passenger 💺
              </button>
            </div>

            <button
              onClick={closeTripModal}
              className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Active Floating Reaction Banner ── */}
        {activeReaction && (
          <div className="bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-indigo-500/20 border-b border-white/15 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-white animate-fadeIn">
            <span className="text-base animate-bounce">{activeReaction.emoji}</span>
            <span>{activeReaction.text}</span>
          </div>
        )}

        {/* ── Body: Tab Bar & Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex px-6 pt-3 border-b border-white/10 gap-4 bg-white/[0.01]">
            {(
              [
                ['journey', '🛣️ Route & Journey'],
                ['chat', `💬 Highway Chat (${chatMessages.length})`],
                ['passengers', `👥 Travelers (${passengers.length})`],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab
                    ? 'text-white border-amber-400'
                    : 'text-white/40 border-transparent hover:text-white/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {/* ── TAB 1: JOURNEY & ROUTE ── */}
            {activeTab === 'journey' && (
              <div className="space-y-4">
                {/* Active Scenic Route Banner */}
                <div
                  className="p-4 rounded-3xl border shadow-xl relative overflow-hidden"
                  style={{
                    backgroundColor: `${currentRoute.themeColor}12`,
                    borderColor: `${currentRoute.themeColor}35`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{currentRoute.emoji}</span>
                        <h3 className="text-sm font-bold text-white">{currentRoute.name}</h3>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">{currentRoute.subtitle} · {currentRoute.region}</p>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-white">
                        {Math.round(progressKm)} / {currentRoute.totalDistanceKm} km
                      </div>
                      <div className="text-[10px] text-white/40">{Math.round(progressPercent)}% completed</div>
                    </div>
                  </div>

                  {/* Visual Highway Progress Track with Moving Car */}
                  <div className="mt-4 relative">
                    {/* Track line */}
                    <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-linear"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: currentRoute.themeColor,
                          boxShadow: `0 0 10px ${currentRoute.themeColor}`,
                        }}
                      />
                    </div>

                    {/* Milestone Markers */}
                    <div className="flex justify-between mt-2 px-1">
                      {currentRoute.landmarks.map((l) => (
                        <div key={l.id} className="flex flex-col items-center">
                          <span className="text-xs">{l.icon}</span>
                          <span className="text-[9px] text-white/40 font-mono mt-0.5 truncate max-w-[70px]">
                            {l.name.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Milestone Note */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-white/80">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Next: <strong className="text-white">{nextLandmark.name}</strong> ({kmToNext} km ahead)</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">{nextLandmark.description}</span>
                  </div>
                </div>

                {/* Highway Action Deck (Honk, High Beams, Reactions) */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Highway Cockpit Actions
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={handleHonkHorn}
                      className="p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                    >
                      <span className="text-lg">📢</span>
                      <span>Honk Horn!</span>
                    </button>

                    <button
                      onClick={handleFlashBeams}
                      className="p-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                    >
                      <span className="text-lg">⚡</span>
                      <span>Flash Beams</span>
                    </button>

                    <button
                      onClick={() => handleSendReaction('☕', 'Pit Stop Coffee')}
                      className="p-3 rounded-2xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-400/35 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                    >
                      <span className="text-lg">☕</span>
                      <span>Coffee Break</span>
                    </button>

                    <button
                      onClick={() => handleSendReaction('🔥', 'Vibe Fire')}
                      className="p-3 rounded-2xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/35 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
                    >
                      <span className="text-lg">🔥</span>
                      <span>Vibe Fire</span>
                    </button>
                  </div>
                </div>

                {/* Route Selector List */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Select Scenic Driving Route
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TRIP_ROUTES.map((r) => {
                      const isSelected = currentRoute.id === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleSelectRoute(r.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-white/15 border-amber-400/60 shadow-lg'
                              : 'bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{r.emoji}</span>
                            <span className="text-xs font-bold text-white truncate">{r.name}</span>
                          </div>
                          <div className="text-[10px] text-white/40 mt-1 truncate">
                            {r.totalDistanceKm} km · {r.region}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: HIGHWAY CHAT ── */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-[320px]">
                {/* Chat Messages Log */}
                <div className="flex-1 overflow-y-auto space-y-2 p-2 rounded-2xl bg-black/40 border border-white/10 custom-scrollbar">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-xl text-xs flex items-start gap-2 ${
                        msg.type === 'system'
                          ? 'bg-white/5 text-white/60 font-mono text-[11px]'
                          : 'bg-white/[0.04] border border-white/5 text-white'
                      }`}
                    >
                      <span className="text-sm shrink-0">{msg.carEmoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-white/40">
                          <span className="font-bold text-white/80">{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-white/90">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Shouts */}
                <div className="flex gap-1.5 overflow-x-auto py-2 custom-scrollbar shrink-0">
                  {[
                    'Cruising into the sunset! 🌅',
                    'Turn this track UP! 🔊',
                    'Smooth highway vibes 🚗',
                    'Next stop: Scenic overlook 📸',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => handleSendChat(phrase)}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] text-white/70 whitespace-nowrap"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Broadcast message to highway travelers…"
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/40"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* ── TAB 3: TRAVELERS & PROFILE ── */}
            {activeTab === 'passengers' && (
              <div className="space-y-4">
                {/* Edit Profile */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                    Your Road Profile
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={selfName}
                      onChange={(e) => {
                        setSelfName(e.target.value);
                        try {
                          localStorage.setItem('driving_vibes_traveler_name', e.target.value);
                        } catch {}
                      }}
                      placeholder="Your Driver Name"
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/40"
                    />

                    <div className="flex items-center gap-1">
                      {CAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setSelfCar(emoji);
                            try {
                              localStorage.setItem('driving_vibes_traveler_car', emoji);
                            } catch {}
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border transition-all ${
                            selfCar === emoji
                              ? 'bg-amber-400/20 border-amber-400 text-white shadow'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Travelers List */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                    Travelers in this Road Trip ({passengers.length})
                  </label>
                  <div className="space-y-2">
                    {passengers.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{p.carEmoji}</span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{p.name}</span>
                              {p.isHost && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-mono">
                                  DRIVER DJ
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/40">Cruising at {p.speedKmh} km/h</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[10px] font-mono text-emerald-300">Live</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Shareable Link & Room Footer ── */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] space-y-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white/80 font-mono outline-none px-3 py-2 truncate"
            />
            <button
              onClick={copyTripLink}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow ${
                copiedToast
                  ? 'bg-emerald-500 text-black'
                  : 'bg-amber-400 hover:bg-amber-300 text-black active:scale-95'
              }`}
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToast ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 pt-1">
            <button
              onClick={() => {
                const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                createNewRoom(newCode);
              }}
              className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Create New Private Highway Room</span>
            </button>

            {!isHost && (
              <button
                onClick={forceResyncWithHost}
                className="flex items-center gap-1 text-amber-300 hover:text-amber-200 text-xs font-mono font-semibold"
              >
                <Zap className="w-3 h-3" />
                <span>Sync with Driver</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
