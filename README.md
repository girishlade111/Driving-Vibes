# 🎵 Driving Vibes — Minimal Cinematic Music Streaming Web App

> **"The background image is the experience. The music player is the only interface."**

A production-ready, ultra-minimal, ambient music streaming web application designed for focused listening and cinematic aesthetics.

---

## ✨ Features

- 🌌 **Cinematic Full-Screen Aesthetics**: 95% visual immersion, 5% minimal interaction. Zero clutter, no dashboards, no accounts, and no authentication.
- 📱 **Responsive Background System**: Automatically serves desktop-specific background on desktop/tablets and mobile-specific background on mobile devices via native `<picture>` media queries.
- 🎛️ **Floating Mini Player**: Frosted glassmorphic pill fixed at bottom-center with safe-area support (`env(safe-area-inset-bottom)`), micro-progress scrubber, and clean typography.
- 📜 **Drag-and-Drop Playlist**: Expandable glassmorphic bottom sheet (mobile) / floating drawer (desktop) with intuitive drag-and-drop song reordering that dynamically updates the live playback queue and persists session order.
- ☁️ **Backblaze B2 S3-Compatible Storage**: Dynamic song discovery from Backblaze B2 buckets using AWS S3 SDK with secure presigned streaming URLs.
- 🔒 **Zero-Trust Security Model**: Credentials (`B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`) reside strictly on the server and are **never** bundled or exposed to the client.
- ⚡ **Native Audio Engine**: Single persistent `HTMLAudioElement` instance, continuous playlist looping (`ended` auto-advance), 3-second smart rewind for Previous, and keyboard shortcuts (`Space`, `←`, `→`, `Esc`).
- 🛡️ **Out-of-the-Box Fallback**: Preloaded ambient demo tracks when Backblaze credentials are not yet configured.

---

## 🏗️ Architecture

```text
Browser (React + TypeScript + Vite + Tailwind)
   │
   ├── Background System (<picture> with desktop/mobile separation)
   ├── Mini Player (Fixed bottom-center glassmorphic pill)
   ├── Expanded Playlist Sheet (Drag-and-drop reordering)
   └── Audio Engine (Persistent HTMLAudioElement singleton)
           │
           ▼
Backend Server (Express API on port 3001)
   │
   ├── S3 ListObjectsV2 (Discovers .mp3, .m4a, .wav, .aac, .ogg, .flac)
   ├── Dynamic Title Normalizer (Strips prefixes & extensions)
   ├── S3 GetObjectCommand Presigner (Generates secure streaming URLs)
   └── Zero B2 Credentials in client bundle
           │
           ▼
Backblaze B2 Storage (S3-Compatible Bucket)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later

### 2. Installation
```bash
git clone <repository-url>
cd "Driving Vibes"
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`

---

## ⚙️ Backblaze B2 Configuration Guide

### 1. Create a Bucket in Backblaze B2
1. Log into your [Backblaze Account](https://www.backblaze.com/).
2. Go to **B2 Cloud Storage** → **Buckets** → **Create a Bucket**.
3. Set **Bucket Name** (e.g. `driving-vibes-music`).
4. Set files to **Private** (recommended for secure presigned streaming) or **Public**.
5. Note your bucket's **Endpoint** and **Region** (e.g., `s3.us-west-004.backblazeb2.com` and `us-west-004`).

### 2. Generate Application Key
1. Go to **Application Keys** → **Add a New Application Key**.
2. Restrict access to your music bucket with read permissions (`listObjects`, `getObject`).
3. Copy the **keyID** and **applicationKey**.

### 3. Configure CORS on Your Backblaze B2 Bucket
To allow browser streaming and seeking with byte-range requests, apply this CORS rule in Backblaze B2:
```json
[
  {
    "corsRuleName": "AllowStreamingAndSeeking",
    "allowedOrigins": ["*"],
    "allowedOperations": ["s3:GetObject", "s3:HeadObject"],
    "allowedHeaders": ["*"],
    "exposeHeaders": ["Content-Type", "Content-Length", "Accept-Ranges", "Content-Range", "ETag"],
    "maxAgeSeconds": 3600
  }
]
```

### 4. Set Environment Variables
Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```

```env
B2_ENDPOINT=s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=driving-vibes-music
B2_APPLICATION_KEY_ID=your_key_id_here
B2_APPLICATION_KEY=your_application_key_here
B2_IS_PRIVATE=true
PORT=3001
```

---

## 🖼️ Background Image Customization

Place your desired background images in the `public/backgrounds/` folder:

| File Name | Purpose | Target Devices |
| :--- | :--- | :--- |
| `desktop-background.png` | Landscape art | Desktops, laptops, tablets (≥768px) |
| `mobile-background.png` | Portrait art | Phones, mobile portrait (<768px) |

The `<picture>` tag ensures mobile devices only download the mobile background and desktops only download the desktop background.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Toggle Play / Pause |
| <kbd>→</kbd> | Next track |
| <kbd>←</kbd> | Previous track (or restart if played >3s) |
| <kbd>Esc</kbd> | Close Playlist panel |

---

## 📦 Production Build & Deployment

### Build the Application
```bash
npm run build
```
This compiles TypeScript and builds the optimized Vite bundle in `dist/`.

### Run Production Server
```bash
npm start
```
The Express server will serve both the `/api/tracks` backend and the static frontend assets from `dist/` on `http://localhost:3001`.
