export interface Track {
  id: string;
  name: string;
  url: string;
  filename?: string;
  size?: number;
  lastModified?: string;
}

export interface PlayerState {
  playlist: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  isPlaylistOpen: boolean;
}

export interface TracksApiResponse {
  success: boolean;
  source: 'backblaze' | 'demo' | 'demo-fallback';
  bucket?: string;
  message?: string;
  error?: string;
  tracks: Track[];
}
