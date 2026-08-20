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
  source: 'cloudflare-r2' | 'unconfigured' | 'error' | 'built-in';
  bucket?: string;
  message?: string;
  error?: string;
  tracks: Track[];
}

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'default_1',
    name: 'Midnight Highway Drift',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  {
    id: 'default_2',
    name: 'Sunset Coastline Cruiser',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
  },
  {
    id: 'default_3',
    name: 'Tokyo Neon Rain',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_7314a42b10.mp3',
  },
  {
    id: 'default_4',
    name: 'Synthwave Night Grid',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3',
  },
  {
    id: 'default_5',
    name: 'Endless Horizon Chillhop',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
  },
  {
    id: 'default_6',
    name: 'Cosmic Starfield Voyage',
    url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c92e76f577.mp3',
  },
  {
    id: 'default_7',
    name: '4AM Quiet Streets',
    url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3',
  },
];

