# 🚀 Vercel Deployment Guide — Driving Vibes

Complete step-by-step guide to deploying **Driving Vibes** on [Vercel](https://vercel.com) with **Cloudflare R2** audio streaming and **Cloudflare Worker Durable Object Live Counter**.

---

## 🏗️ Architecture Overview on Vercel

```
┌────────────────────────────────────────────────────────┐
│                        USER                            │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│     Vercel Edge CDN     │ │   Cloudflare Workers    │
│  (React + Vite SPA)     │ │     Durable Objects     │
│  • Fast Global Static   │ │  (Real-Time WebSocket)  │
│  • SPA Rewrites         │ │  • Active User Counter  │
│  • Edge Cache Headers   │ │  • Heartbeat & Alarms   │
└────────────┬────────────┘ └─────────────────────────┘
             │
             ▼
┌─────────────────────────┐
│ Vercel Serverless API   │
│  • /api/tracks          │ ──► Cloudflare R2 (Audio Storage)
│  • /api/health          │     • Presigned URLs or Public CDN
└─────────────────────────┘
```

---

## 🔑 Environment Variables for Vercel

Add these variables in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable Name | Required | Example / Actual Value | Description |
|---|---|---|---|
| `R2_ACCOUNT_ID` | **Yes** | `ee41df1c2790ea83cca21166a94855a6` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | **Yes** | `f258244d5865b6dcd73ad2a5a1f5a09c` | Cloudflare R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | **Yes** | `3c37126167c76f794cf3a6cba0e8d534db726bc0280a53cb5118205046e8204b` | Cloudflare R2 Secret Access Key |
| `R2_BUCKET_NAME` | **Yes** | `drive` | Your R2 music bucket name |
| `R2_IS_PRIVATE` | **Yes** | `true` | `true` for signed URLs (recommended) / `false` for public |
| `R2_PUBLIC_URL` | Optional | `https://pub-xxxxxxxx.r2.dev` | Only needed if `R2_IS_PRIVATE=false` |
| `VITE_LIVE_COUNTER_WS_URL` | **Yes** | `wss://live-counter.coderlade.workers.dev` | Live Counter Worker WebSocket endpoint |

> [!TIP]
> Select **Production**, **Preview**, and **Development** checkboxes when adding each environment variable in Vercel so they apply across all deployment branches.

---

## ⚙️ Vercel Project Settings

When importing the project in Vercel, verify these settings:

| Setting | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` (default) |
| **Build Command** | `npm run build` *(or `tsc -b && vite build`)* |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

*(All routing rewrites, cache rules, and security headers are automatically pre-configured in [vercel.json](file:///c:/Users/Girish%20Lade/Downloads/Driving%20Vibes/vercel.json).)*

---

## 📦 Deployment Methods

### Method 1: Deploy via GitHub (Recommended — Auto CI/CD)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: optimize for vercel deployment and live counter"
   git push origin main
   ```

2. **Import into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your Git repository `Driving-Vibes`.
   - In **Environment Variables**, paste the keys from the table above.
   - Click **Deploy**.

---

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy:**
   ```bash
   vercel login
   vercel
   ```

3. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

4. **Add Environment Variables via CLI (Optional):**
   ```bash
   vercel env add R2_ACCOUNT_ID production
   vercel env add R2_ACCESS_KEY_ID production
   vercel env add R2_SECRET_ACCESS_KEY production
   vercel env add R2_BUCKET_NAME production
   vercel env add R2_IS_PRIVATE production
   vercel env add VITE_LIVE_COUNTER_WS_URL production
   ```

---

## 🌐 Custom Domain Setup (Optional)

1. In Vercel, navigate to **Settings → Domains**.
2. Enter your custom domain (e.g., `drivingvibes.com` or `music.yourdomain.com`).
3. Add the generated DNS records (`CNAME` or `A` record) in your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.).
4. Vercel will automatically provision a free, auto-renewing SSL certificate.

---

## ✅ Post-Deployment Verification Checklist

After deployment finishes, check the following:

- [ ] **Health Endpoint:** Open `https://<your-vercel-domain>/api/health` → Should return `{"status":"ok"}`.
- [ ] **R2 Audio Tracks Endpoint:** Open `https://<your-vercel-domain>/api/tracks` → Should return your R2 song list with valid audio stream URLs.
- [ ] **Audio Streaming:** Play any track in the app → Verify waveform visualizer and audio playback work smoothly.
- [ ] **Live Counter:** Look at the top-right badge → Verify the glowing green dot **🟢 👥 X live** shows the real-time listener count.
- [ ] **SPA Direct Refresh:** Refresh any modal or route → Verify no 404 error occurs.
