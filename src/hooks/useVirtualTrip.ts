import { useState, useEffect, useCallback } from 'react';

export function useVirtualTrip() {
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripId, setTripId] = useState<string>('');
  const [travelerCount, setTravelerCount] = useState<number>(34);
  const [copiedToast, setCopiedToast] = useState(false);

  // Generate or read tripId from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/#trip=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      setTripId(match[1]);
    } else {
      const randomId = Math.random().toString(36).substring(2, 8);
      setTripId(randomId);
    }
  }, []);

  // Subtle realistic live traveler fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setTravelerCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(18, Math.min(65, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const generateNewRoom = useCallback(() => {
    const newId = Math.random().toString(36).substring(2, 8);
    setTripId(newId);
    window.location.hash = `trip=${newId}`;
  }, []);

  return {
    isTripModalOpen,
    openTripModal: () => setIsTripModalOpen(true),
    closeTripModal: () => setIsTripModalOpen(false),
    toggleTripModal: () => setIsTripModalOpen((p) => !p),
    tripId,
    travelerCount,
    copiedToast,
    copyTripLink,
    generateNewRoom,
  };
}
