export interface TripLandmark {
  id: string;
  name: string;
  distanceKm: number;
  icon: string;
  description: string;
}

export interface TripRoute {
  id: string;
  name: string;
  subtitle: string;
  region: string;
  totalDistanceKm: number;
  estimatedHours: number;
  emoji: string;
  themeColor: string;
  landmarks: TripLandmark[];
  suggestedPresetId: string;
}

export interface TripPassenger {
  id: string;
  name: string;
  carEmoji: string;
  isHost: boolean;
  isSelf: boolean;
  joinedAt: number;
  speedKmh: number;
}

export interface TripChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  carEmoji: string;
  text: string;
  timestamp: string;
  type: 'chat' | 'reaction' | 'milestone' | 'system';
}

export interface TripSyncEvent {
  type: 'SYNC_PLAYBACK' | 'CHAT_MESSAGE' | 'REACTION' | 'ROUTE_CHANGE' | 'JOIN_ROOM' | 'LEAVE_ROOM';
  roomId: string;
  senderId: string;
  senderName: string;
  carEmoji: string;
  payload: {
    trackId?: string;
    trackName?: string;
    isPlaying?: boolean;
    currentTime?: number;
    hostTimestamp?: number;
    routeId?: string;
    distanceProgressKm?: number;
    chatText?: string;
    reactionEmoji?: string;
    reactionSound?: string;
  };
}

export const TRIP_ROUTES: TripRoute[] = [
  {
    id: 'pacific_coast',
    name: 'Pacific Coast Highway 1',
    subtitle: 'Golden Coast Ocean Vista',
    region: 'California, USA',
    totalDistanceKm: 655,
    estimatedHours: 8.5,
    emoji: '🌊',
    themeColor: '#38bdf8',
    suggestedPresetId: 'sunset_coastline',
    landmarks: [
      { id: 'sf', name: 'Golden Gate Departure', distanceKm: 0, icon: '🌉', description: 'Starting coastal engine under the morning marine layer' },
      { id: 'bixby', name: 'Bixby Creek Bridge', distanceKm: 185, icon: '🌉', description: 'Iconic concrete arch soaring over the ocean canyon' },
      { id: 'big_sur', name: 'Big Sur Redwoods Vista', distanceKm: 240, icon: '🌲', description: 'Ancient coastal redwoods meeting crashing Pacific waves' },
      { id: 'morro', name: 'Morro Rock Overlook', distanceKm: 420, icon: '🪨', description: 'Volcanic coastal rock glowing under twilight' },
      { id: 'malibu', name: 'Malibu Sunset Pier', distanceKm: 655, icon: '🌅', description: 'Arriving at the golden beach promenade at dusk' },
    ],
  },
  {
    id: 'tokyo_wangan',
    name: 'Tokyo Shuto C1 & Wangan',
    subtitle: 'Midnight Neon Highway Loop',
    region: 'Tokyo, Japan',
    totalDistanceKm: 82,
    estimatedHours: 1.2,
    emoji: '🗼',
    themeColor: '#00ffff',
    suggestedPresetId: 'tokyo_night',
    landmarks: [
      { id: 'shibuya', name: 'Shibuya Crossing Start', distanceKm: 0, icon: '🏙️', description: 'Neon illuminated skyscraper canyons' },
      { id: 'rainbow', name: 'Rainbow Bridge High Span', distanceKm: 18, icon: '🌉', description: 'Suspension bridge overlooking illuminated Tokyo Bay' },
      { id: 'daikoku', name: 'Daikoku Futo Car Meet', distanceKm: 46, icon: '🏎️', description: 'Legendary night car gathering parking area' },
      { id: 'wangan', name: 'Wangan Straightway Run', distanceKm: 68, icon: '⚡', description: 'Smooth high-speed coastal bay expressway' },
      { id: 'yokohama', name: 'Yokohama Minato Mirai', distanceKm: 82, icon: '🎡', description: 'Final cruise past the waterfront ferris wheel' },
    ],
  },
  {
    id: 'route_66',
    name: 'Historic Route 66',
    subtitle: 'Main Street of America',
    region: 'Chicago ➔ Santa Monica',
    totalDistanceKm: 3940,
    estimatedHours: 42.0,
    emoji: '🏜️',
    themeColor: '#fbbf24',
    suggestedPresetId: 'classic_cinematic',
    landmarks: [
      { id: 'chicago', name: 'Chicago Starting Line', distanceKm: 0, icon: '🏙️', description: 'The neon starting post on Adams Street' },
      { id: 'st_louis', name: 'Gateway Arch Crossing', distanceKm: 470, icon: '🏛️', description: 'Crossing the Mississippi River' },
      { id: 'cadillac', name: 'Cadillac Ranch Art', distanceKm: 1680, icon: '🚗', description: 'Buried classic cars in the Texas desert' },
      { id: 'sedona', name: 'Sedona Red Rock Canyons', distanceKm: 2950, icon: '🏜️', description: 'Crimson sandstone peaks under starlit skies' },
      { id: 'santa_monica', name: 'Santa Monica Pier End', distanceKm: 3940, icon: '🎡', description: 'Where the road ends at the Pacific Ocean' },
    ],
  },
  {
    id: 'alpine_pass',
    name: 'Grossglockner High Alpine Road',
    subtitle: 'Serpentine Alpine Vista',
    region: 'Austrian Alps',
    totalDistanceKm: 48,
    estimatedHours: 1.5,
    emoji: '🏔️',
    themeColor: '#a855f7',
    suggestedPresetId: 'rainy_windshield',
    landmarks: [
      { id: 'bruck', name: 'Bruck Valley Ascent', distanceKm: 0, icon: '🌲', description: 'Entering the mountain toll gate' },
      { id: 'fuscher', name: 'Fuscher Törl Panorama', distanceKm: 19, icon: '🏔️', description: '2,428m panoramic observation peak' },
      { id: 'glacier', name: 'Pasterze Glacier View', distanceKm: 34, icon: '❄️', description: 'Ancient alpine glacier amphitheater' },
      { id: 'heiligenblut', name: 'Heiligenblut Descent', distanceKm: 48, icon: '⛪', description: 'Gothic spire village in the high valley' },
    ],
  },
];
