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
- ☁️ **Cloudflare R2 integration** — auto-discovers music from your R2 bucket
- 🔒 **Secure** — R2 credentials stay server-side only, never in the browser bundle
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
# Edit .env with your Cloudflare R2 credentials
```

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

## Cloudflare R2 Configuration

### Create Your R2 Bucket

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2 Object Storage** → **Create Bucket**
3. Upload your MP3/M4A/WAV/FLAC/OGG files to the bucket

### Create an R2 API Token

1. Go to **R2 Object Storage** → **Manage R2 API Tokens** → **Create API Token**
2. Set permissions to **Object Read** (read-only is sufficient)
3. Optionally restrict the token to your specific bucket
4. Copy the **Access Key ID** and **Secret Access Key** (shown once)
5. Copy your **Cloudflare Account ID** from the dashboard right sidebar

### Configure `.env`

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-music-bucket-name
R2_IS_PRIVATE=true
```

### Private vs Public Buckets

**Private bucket** (`R2_IS_PRIVATE=true`) — Recommended for production:
- The server generates presigned URLs that expire after 2 hours
- No CORS configuration needed on the bucket itself
- Credentials never leave your server

**Public bucket** (`R2_IS_PRIVATE=false`):
- Enable the public URL in Cloudflare R2 → Bucket Settings → **Public Access**
- Set `R2_PUBLIC_URL` to your public bucket URL or custom domain:
  ```env
  R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
  # or with a custom domain:
  R2_PUBLIC_URL=https://music.yourdomain.com
  ```

### CORS for Public Buckets

If using a public bucket (`R2_IS_PRIVATE=false`), add a CORS policy in **R2 → Bucket → Settings → CORS Policy**:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:5173"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Range", "Accept-Ranges", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

> If `R2_IS_PRIVATE=true`, CORS is not required since audio is served via presigned URLs which include all necessary headers.

---

## How Automatic Song Discovery Works

Every time a visitor loads the site, the frontend calls:

```
GET /api/tracks
```

The backend:

1. Connects to your Cloudflare R2 bucket using the AWS SDK (S3-compatible API)
2. Lists all objects, handling pagination automatically (works with 1000+ songs)
3. Filters for audio files only (`.mp3`, `.m4a`, `.aac`, `.wav`, `.ogg`, `.flac`, `.opus`)
4. Sorts them alphabetically/numerically
5. Generates secure URLs (presigned for private, direct CDN for public)
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
| `R2_SECRET_ACCESS_KEY` | Server `.env` only | ✅ Never leaves server |
| `R2_ACCESS_KEY_ID` | Server `.env` only | ✅ Never leaves server |
| Presigned URLs | Generated server-side, expire in 2h | ✅ Time-limited |
| Track list | Fetched via `/api/tracks`, only name + URL | ✅ No raw R2 metadata |
| Frontend bundle | Contains no credentials | ✅ Safe to inspect |

Run `grep -r "SECRET_ACCESS_KEY" dist/` after building — it should return nothing.

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
│   └── index.js                    ← Express API (R2 integration, CORS)
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
