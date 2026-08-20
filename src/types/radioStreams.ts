export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  icon: string;
  streamUrl: string;
  bitrate: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'lofi_chill',
    name: 'Lofi Chillhop 24/7',
    genre: 'Lo-Fi / Chillhop',
    icon: '☕',
    streamUrl: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    bitrate: '192 kbps',
  },
  {
    id: 'synthwave_80s',
    name: 'Nightwave Synth 80s',
    genre: 'Synthwave / Retro',
    icon: '🌆',
    streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    bitrate: '128 kbps',
  },
  {
    id: 'ambient_sleep',
    name: 'Deep Ambient Highway',
    genre: 'Ambient / Drone',
    icon: '🌌',
    streamUrl: 'https://stream.zeno.fm/0r0xa792kwzuv',
    bitrate: '192 kbps',
  },
  {
    id: 'night_jazz',
    name: 'Smooth Night Jazz FM',
    genre: 'Midnight Jazz',
    icon: '🎷',
    streamUrl: 'https://stream.zeno.fm/0r0xa792kwzuv',
    bitrate: '128 kbps',
  },
];
