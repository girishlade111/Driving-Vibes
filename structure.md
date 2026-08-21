# Driving Vibes — Project File Structure

> **App Type:** Minimal Cinematic Music Streaming Web App  
> **Framework:** React 18 + TypeScript + Vite  
> **Styling:** Tailwind CSS  
> **Backend:** Express.js server + Cloudflare Workers (live-counter)

---

## Root Directory

```
Driving Vibes/
├── .env                        # Environment variables (local)
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
├── .kilo/                      # Kilo AI agent configuration
│   └── kilo.jsonc
├── .vscode/                    # VS Code workspace settings
│   └── settings.json
├── public/                     # Static assets served directly
├── dist/                       # Production build output (generated)
├── live-counter/               # Cloudflare Worker for real-time listener count
├── server/                     # Express.js backend server
├── src/                        # Main React application source
├── package.json                # Project dependencies & scripts
├── package-lock.json           # Locked dependency versions
├── tsconfig.json               # TypeScript configuration (main)
├── tsconfig.node.json          # TypeScript config for Node/Vite config
├── tsconfig.tsbuildinfo        # TypeScript build cache
├── vite.config.ts              # Vite bundler configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── index.html                  # Entry HTML template
├── README.md                   # Project documentation
├── desktop.gif/png             # Desktop preview screenshots
├── mobile.gif/png              # Mobile preview screenshots
└── Minimal Cinematic Music Streaming Web App — Master Coding Agent Prompt.md
```

---

## `public/` — Static Assets

Served as-is at root path (`/backgrounds/...`, `/favicon.svg`, etc.)

```
public/
├── favicon.svg                 # App favicon
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (offline support)
└── backgrounds/                # Parallax background images (desktop + mobile variants)
    ├── desert-stars-desktop.jpg
    ├── desert-stars-mobile.jpg
    ├── desktop-background.gif
    ├── desktop-background.png
    ├── mobile-background.gif
    ├── mobile-background.png
    ├── mountain-pass-desktop.jpg
    ├── mountain-pass-mobile.jpg
    ├── rainy-drive-desktop.jpg
    ├── rainy-drive-mobile.jpg
    ├── sunset-coast-desktop.jpg
    ├── sunset-coast-mobile.jpg
    ├── synthwave-outrun-desktop.jpg
    ├── synthwave-outrun-mobile.jpg
    ├── tokyo-neon-desktop.jpg
    └── tokyo-neon-mobile.jpg
```

---

## `server/` — Express.js Backend

```
server/
└── index.js                    # Express server entry point
    # - Serves static files from dist/
    # - API endpoints for music metadata
    # - Proxy for external music sources
    # - WebSocket support for real-time features
```

---

## `live-counter/` — Cloudflare Worker

Independent Worker project for real-time listener counts.

```
live-counter/
├── src/
│   └── index.js                # Worker entry point (Durable Objects for state)
├── wrangler.jsonc              # Cloudflare Workers config (JSONC)
├── wrangler.toml               # Cloudflare Workers config (TOML)
├── package.json                # Worker dependencies
├── package-lock.json
├── test-client.html            # Local test page
├── live-counter-client.js      # Client-side integration script
├── worker-configuration.d.ts   # TypeScript definitions
├── .editorconfig
├── .prettierrc
├── .gitignore
├── AGENTS.md                   # Agent instructions for this subproject
└── .vscode/
    └── settings.json
```

---

## `src/` — Main React Application

```
src/
├── main.tsx                    # React 18 root render (createRoot)
├── App.tsx                     # Root component, providers, routing
├── index.css                   # Global styles, Tailwind imports, CSS variables
├── components/                 # React components (feature-organized)
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript type definitions
└── vite-env.d.ts               # Vite type declarations (auto-generated)
```

---

### `src/components/` — Feature Components

Organized by feature/domain. Each folder contains related components + types.

#### `AmbientMixer/`
```
AmbientMixer/
└── AmbientMixerModal.tsx       # Modal for mixing ambient sounds (rain, engine, etc.)
```

#### `AudioFx/`
```
AudioFx/
└── AudioFxModal.tsx            # Audio effects panel (reverb, EQ, spatial audio)
```

#### `Background/`
```
Background/
├── Background.tsx              # Main background renderer (parallax, video, canvas)
├── AnimationToggle.tsx         # Toggle background animations on/off
└── SettingsPanel.tsx           # Background selection & customization UI
```

#### `CarMode/`
```
CarMode/
├── CarModeOverlay.tsx          # Full-screen car dashboard overlay
├── SpeedometerGauge.tsx        # Animated speedometer (GPS-based)
├── TachometerBar.tsx           # RPM-style tachometer bar
├── GpsTelemetryPanel.tsx       # GPS data display (altitude, heading, satellites)
└── carModeTypes.ts             # TypeScript types for CarMode feature
```

#### `Focus/`
```
Focus/
└── FocusTimerModal.tsx         # Pomodoro/focus timer modal
```

#### `InteractiveCanvas/` — WebGL/Canvas Visual Effects
```
InteractiveCanvas/
├── AuroraCanvas.tsx            # Aurora borealis shader effect
├── FilmGrainCanvas.tsx         # Film grain overlay
├── FirefliesCanvas.tsx         # Particle fireflies
├── RainGlassCanvas.tsx         # Rain-on-glass distortion effect
├── ShootingStarsCanvas.tsx     # Shooting stars particle system
└── SpeedParticlesCanvas.tsx    # Speed-based particle trails
```

#### `MiniPlayer/`
```
MiniPlayer/
├── MiniPlayer.tsx              # Collapsed bottom player bar
└── MusicWave.tsx               # Audio waveform visualization
```

#### `NowPlayingOverlay/`
```
NowPlayingOverlay/
└── NowPlayingOverlay.tsx       # Full-screen now-playing artwork + controls
```

#### `Playlist/`
```
Playlist/
└── PlaylistPanel.tsx           # Side panel with track list, queue management
```

#### `Postcard/` — Shareable Postcard Generator
```
Postcard/
├── PostcardModal.tsx           # Modal for creating/sharing postcards
├── postcardCanvasRenderer.ts   # Canvas rendering logic for postcard export
├── postcardAssets.ts           # Asset loading (fonts, textures, stamps)
└── postcardTypes.ts            # TypeScript types for postcard data
```

#### `Social/`
```
Social/
└── VirtualTripModal.tsx        # "Virtual road trip" shared listening session
```

---

### `src/hooks/` — Custom React Hooks

| Hook | Purpose |
|------|---------|
| `useAmbientMixer.ts` | Manage ambient sound layers, volumes, presets |
| `useAudioEqualizer.ts` | Web Audio API EQ band control |
| `useAudioPlayer.ts` | Core playback logic (play, pause, seek, queue, crossfade) |
| `useBinauralFrequencies.ts` | Binaural beat generation for focus/relax |
| `useGpsSpeedometer.ts` | Browser Geolocation API → speed/heading for CarMode |
| `useListeningStats.ts` | Track listening history, favorites, stats |
| `usePomodoroTimer.ts` | Pomodoro timer state & notifications |
| `useVirtualTrip.ts` | Sync playback state across peers (WebRTC/WebSocket) |
| `useVoiceCommands.ts` | Web Speech API voice control integration |

---

### `src/types/` — TypeScript Definitions

| File | Contents |
|------|----------|
| `music.ts` | Track, Album, Artist, Playlist, AudioSource interfaces |
| `backgroundPresets.ts` | Background config, parallax settings, preset definitions |
| `virtualTrip.ts` | VirtualTripSession, Participant, SyncMessage types |

---

## `dist/` — Production Build (Generated)

Created by `npm run build`. Contains optimized, hashed assets.

```
dist/
├── index.html                  # Minified HTML with asset hashes
├── favicon.svg
├── manifest.json
├── sw.js                       # Workbox-generated service worker
├── assets/
│   ├── index-[hash].css        # Minified, purged CSS
│   └── index-[hash].js         # Minified, code-split JS bundles
└── backgrounds/                # Copied & optimized background images
```

---

## Configuration Files Detail

### `vite.config.ts`
- React plugin (`@vitejs/plugin-react`)
- Path aliases (`@/` → `src/`)
- Build optimization (code splitting, chunk strategy)
- PWA plugin (`vite-plugin-pwa`) for service worker
- Define `process.env` for client-side env vars

### `tailwind.config.js`
- Custom color palette (cinematic dark theme)
- Custom fonts (Inter, Space Grotesk, JetBrains Mono)
- Animation keyframes (aurora, particle, pulse)
- Dark mode: `class` strategy
- Content paths: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`

### `tsconfig.json`
- Target: `ES2020`
- Module: `ESNext`, ModuleResolution: `bundler`
- Strict mode enabled
- JSX: `react-jsx`
- Path aliases: `@/*` → `src/*`
- Includes: `src/`, `vite.config.ts`

### `postcss.config.js`
- `tailwindcss` plugin
- `autoprefixer` plugin

---

## Key Architectural Patterns

### State Management
- **Local component state:** `useState`, `useReducer`
- **Global UI state:** React Context (PlayerContext, SettingsContext)
- **Server state:** Custom hooks + localStorage persistence
- **Real-time sync:** `useVirtualTrip` (WebRTC mesh)

### Data Flow
```
User Interaction
    → Component Event Handler
    → Custom Hook (useAudioPlayer, etc.)
    → Context Provider / LocalStorage
    → UI Re-render
```

### Canvas/WebGL Components
- Each `*Canvas.tsx` is a self-contained effect
- Uses `requestAnimationFrame` loop
- Cleans up on unmount (`useEffect` return)
- Respects `prefers-reduced-motion`

### PWA Features
- Service worker: `public/sw.js` → Workbox in build
- Manifest: `public/manifest.json`
- Offline-first caching for audio assets
- Install prompt support

---

## Scripts (package.json)

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start dev server with HMR |
| `build` | `tsc && vite build` | Type-check + production build |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint src --ext ts,tsx` | Lint TypeScript/TSX |
| `format` | `prettier --write .` | Format code |

---

## Development Workflow

1. **Start dev:** `npm run dev` → Vite on `http://localhost:5173`
2. **Backend:** `node server/index.js` → Express on `http://localhost:3001`
3. **Live counter:** `cd live-counter && npx wrangler dev` → Worker on `http://localhost:8787`
4. **Type-check:** `npm run build` (runs `tsc` first)
5. **Deploy:** `npm run build` → upload `dist/` to static host

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_LIVE_COUNTER_URL` | Yes | Cloudflare Worker URL for listener counts |
| `VITE_SPOTIFY_CLIENT_ID` | No | Spotify OAuth (if enabled) |
| `VITE_LASTFM_API_KEY` | No | Last.fm metadata enrichment |

---

## Adding New Features

1. Create component folder under `src/components/<FeatureName>/`
2. Add types to `src/types/` or co-locate in component folder
3. Create custom hook in `src/hooks/` if logic is reusable
4. Update `App.tsx` providers if global state needed
5. Add Tailwind classes per design system (see `tailwind.config.js`)

---

## File Naming Conventions

| Pattern | Example |
|---------|---------|
| Component | `PascalCase.tsx` (`SpeedometerGauge.tsx`) |
| Hook | `useCamelCase.ts` (`useGpsSpeedometer.ts`) |
| Types | `camelCase.ts` (`music.ts`, `virtualTrip.ts`) |
| Utility | `camelCase.ts` (`postcardCanvasRenderer.ts`) |
| Config | `kebab-case.config.js` (`tailwind.config.js`) |

---

*Generated: 2026-08-21*  
*Project: Driving Vibes — Minimal Cinematic Music Streaming Web App*