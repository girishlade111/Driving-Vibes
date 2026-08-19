# Driving Vibes 🎵

> **A minimal, cinematic ambient music streaming web app.**  
> Full-screen backgrounds. Tiny floating player. No login. No dashboard.

---

## What It Is

Driving Vibes is a single-page music player that puts the background image first and the player second.

```
95% → Cinematic background
 5% → Minimal music controls
```

Open the site → see the background → press play → music starts. That's it.

---

## Features

- 🎬 **Responsive background images** — separate desktop and mobile images, never both downloaded
- 🎵 **Compact floating player** — tiny pill at the bottom-center of the screen
- ⏯ **Full playback controls** — Play, Pause, Previous, Next
- 🔄 **Automatic next-track** — playlist advances without user interaction
- 📋 **Expandable playlist** — bottom sheet with drag-and-drop reordering
- 🔀 **User-defined playback order** — drag tracks, session is persisted in localStorage
- ☁️ **Backblaze B2 integration** — auto-discovers music from your S3-compatible bucket
- 🔒 **Secure** — B2 credentials stay server-side only, never in the browser bundle
- ⌨️ **Keyboard shortcuts** — Space, ←, →, Escape
- ♿ **Accessible** — ARIA labels, focus states, keyboard navigation
- 📱 **Mobile-safe** — safe-area insets, swipe-down to close, correct touch targets

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Backblaze B2 credentials
```

> If you skip this step, the player works with 5 built-in demo tracks.

### 3. Add Background Images

Place two images in:

```
public/
└── backgrounds/
    ├── desktop-background.png   (used on screens ≥ 768px)
    └── mobile-background.png    (used on screens < 768px)
```

PNG, JPEG, or WebP all work — just update the filenames in `src/App.tsx` if you change the format.

### 4. Run in Development

```bash
npm run dev
```

This starts both the backend (port 3001) and the Vite frontend (port 5173) concurrently.

Open `http://localhost:5173`.

### 5. Build for Production

```bash
npm run build
npm start          # Serves frontend + API from a single Express server
```

---

## Backblaze B2 Configuration

### Create Your Bucket

1. Log into [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Create a bucket (Private recommended)
3. Upload your MP3/M4A/WAV/FLAC/OGG files

### Create an Application Key

1. Go to **App Keys** → **Add a New Application Key**
2. Allow access to your music bucket only
3. Permissions: Read Only is sufficient (`readFiles`, `listFiles`)
4. Copy the Key ID and Application Key (shown once)

### Configure `.env`

```env
B2_ENDPOINT=s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=your-bucket-name
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-secret-key
B2_IS_PRIVATE=true
```

> Find your endpoint on the **Bucket Settings** page in Backblaze.

### CORS for Backblaze (Public Buckets)

If `B2_IS_PRIVATE=false` (public bucket), browsers need CORS headers from B2 directly.

In Backblaze → Bucket → **CORS Rules**, add:

```json
[
  {
    "corsRuleName": "audio-streaming",
    "allowedOrigins": ["https://your-domain.com", "http://localhost:5173"],
    "allowedHeaders": ["*"],
    "allowedOperations": ["b2_download_file_by_id", "b2_download_file_by_name"],
    "exposeHeaders": ["Content-Range", "Accept-Ranges", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```

> If `B2_IS_PRIVATE=true`, CORS is not required since audio is served via presigned URLs which include all necessary headers.

---

## How Automatic Song Discovery Works

Every time a visitor loads the site, the frontend calls:

```
GET /api/tracks
```

The backend:

1. Connects to your Backblaze B2 bucket using the AWS SDK (S3-compatible)
2. Lists all objects, handling pagination automatically (works with 1000+ songs)
3. Filters for audio files only (`.mp3`, `.m4a`, `.aac`, `.wav`, `.ogg`, `.flac`, `.opus`)
4. Sorts them alphabetically/numerically
5. Generates secure URLs (presigned for private, direct for public)
6. Returns a clean JSON list of tracks

Upload a new song → it appears on the site on next page load. No code changes needed.

### File Naming Tips

Use numeric prefixes to control playlist order:

```
01 - Night Drive.mp3
02 - City Lights.mp3
03 - Coastal Highway.mp3
```

The prefix is automatically stripped from the display name:

```
Night Drive
City Lights
Coastal Highway
```

---

## How Responsive Backgrounds Work

The `<picture>` element with `<source media>` ensures the browser **only downloads** the image for the current viewport:

```html
<picture>
  <source media="(max-width: 767px)"  srcset="/backgrounds/mobile-background.png" />
  <source media="(min-width: 768px)"  srcset="/backgrounds/desktop-background.png" />
  <img src="/backgrounds/desktop-background.png" ... />
</picture>
```

- Mobile (< 768px) → downloads only `mobile-background.png`
- Desktop (≥ 768px) → downloads only `desktop-background.png`
- No double-loading, no hidden images, no JS tricks

---

## Audio Playback Architecture

```
Browser AudioElement (single persistent instance)
        │
        ├── timeupdate → currentTime state
        ├── loadedmetadata → duration state
        ├── playing → isPlaying = true
        ├── pause → isPlaying = false
        ├── ended → advance to next track (via ref, not stale closure)
        └── error → skip to next track after 1.8s
```

**Key design decisions:**

- **Single `HTMLAudioElement`** — one instance for the entire session; never multiple simultaneous audio sources
- **Ref-based event handlers** — `ended`/`error` callbacks use `useRef` to access the current `playlist` and `currentIndex`, avoiding the classic React stale closure bug
- **`preload="metadata"`** — only loads audio metadata on startup, not the full file
- **No `audio.loop = true`** — playlist advances sequentially via the `ended` event

---

## Security Model

| What | Where | Status |
|---|---|---|
| `B2_APPLICATION_KEY` | Server `.env` only | ✅ Never leaves server |
| `B2_APPLICATION_KEY_ID` | Server `.env` only | ✅ Never leaves server |
| Presigned URLs | Generated server-side, expire in 2h | ✅ Time-limited |
| Track list | Fetched via `/api/tracks`, only name + URL | ✅ No raw B2 metadata |
| Frontend bundle | Contains no credentials | ✅ Safe to inspect |

Run `grep -r "APPLICATION_KEY" dist/` after building — it should return nothing.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `←` | Previous track (or restart if > 3s played) |
| `→` | Next track |
| `Esc` | Close playlist |

---

## Project Structure

```
driving-vibes/
├── public/
│   ├── backgrounds/
│   │   ├── desktop-background.png  ← your desktop image
│   │   └── mobile-background.png   ← your mobile image
│   └── favicon.svg
│
├── server/
│   └── index.js                    ← Express API (B2 integration, CORS)
│
├── src/
│   ├── components/
│   │   ├── Background/             ← Responsive full-screen background
│   │   ├── MiniPlayer/             ← Compact floating player pill
│   │   └── Playlist/               ← Bottom sheet with drag-and-drop
│   ├── hooks/
│   │   └── useAudioPlayer.ts       ← All audio state & playback logic
│   ├── types/
│   │   └── music.ts                ← TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env.example                    ← Copy to .env and fill in values
├── .gitignore                      ← .env is gitignored
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Production Deployment

1. Set environment variables on your hosting platform (not in `.env`)
2. Run `npm run build` → outputs to `dist/`
3. Run `npm start` → Express serves `dist/` + `/api/tracks`
4. Set `FRONTEND_ORIGIN=https://your-domain.com` to lock CORS

---

## License

Personal use. No warranties.
