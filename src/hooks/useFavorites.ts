import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'driving_vibes_favorites';

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids: string[] = JSON.parse(raw);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore quota errors
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());

  // Keep localStorage in sync whenever favorites change
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = useCallback((trackId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (trackId: string) => favorites.has(trackId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
