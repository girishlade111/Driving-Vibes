import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS Configuration ────────────────────────────────────────────────────
// In production, restrict to your actual frontend domain.
// In development, allow the Vite dev server (localhost:5173).
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,       // any localhost port for development
  /^http:\/\/127\.0\.0\.1:\d+$/,   // IPv4 loopback
];

// If FRONTEND_ORIGIN env var is set, also allow that domain in production.
if (process.env.FRONTEND_ORIGIN) {
  allowedOrigins.push(new RegExp(`^${process.env.FRONTEND_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (e.g., when frontend is served by this server in production)
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((re) => re.test(origin));
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    credentials: false,
  })
);

app.use(express.json());

// ── Audio File Extensions ─────────────────────────────────────────────────
const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.opus']);

// ── Song Title Formatter ──────────────────────────────────────────────────
/**
 * Converts raw filenames into clean display titles.
 * Examples:
 *   '01 - Midnight_Drive.mp3'  →  'Midnight Drive'
 *   '02-cosmic-cruise.wav'     →  'Cosmic Cruise'
 *   'My Song.flac'             →  'My Song'
 */
function formatSongTitle(filename) {
  const baseName = filename.split('/').pop() || filename;
  // Remove extension
  const withoutExt = baseName.replace(/\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i, '');
  // Remove leading numeric prefix (e.g. '01.', '01 - ', '01_', '01 ')
  const withoutPrefix = withoutExt.replace(/^[\d]+[\s._\-]+/, '').trim();
  // Replace underscores/hyphens with spaces
  const readable = (withoutPrefix || withoutExt).replace(/[_-]+/g, ' ').trim();
  // Title case words (capitalise first letter of each word)
  return (
    readable.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown Track'
  );
}

// ── Demo Fallback Tracks ──────────────────────────────────────────────────
// Used when Backblaze B2 credentials are not yet configured, so the player
// works out of the box for development/demo purposes.
const DEMO_TRACKS = [
  {
    id: 'demo-1',
    name: 'Night Owl Ambient',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    filename: '01-night-owl-ambient.mp3',
  },
  {
    id: 'demo-2',
    name: 'Tokyo Neon Horizon',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3',
    filename: '02-tokyo-neon-horizon.mp3',
  },
  {
    id: 'demo-3',
    name: 'Midnight Highway Chill',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=lofi-chill-medium-version-159456.mp3',
    filename: '03-midnight-highway-chill.mp3',
  },
  {
    id: 'demo-4',
    name: 'Cosmic Cruise Waves',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=electronic-future-beats-117997.mp3',
    filename: '04-cosmic-cruise-waves.mp3',
  },
  {
    id: 'demo-5',
    name: 'Dreamscape Reverie',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_730be70b97.mp3?filename=reflected-light-147979.mp3',
    filename: '05-dreamscape-reverie.mp3',
  },
];

// ── S3 Client Factory ─────────────────────────────────────────────────────
function getS3Client() {
  const { B2_ENDPOINT, B2_REGION, B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY } =
    process.env;

  if (!B2_ENDPOINT || !B2_APPLICATION_KEY_ID || !B2_APPLICATION_KEY) {
    return null;
  }

  // Normalise endpoint: ensure it starts with https://
  const rawEndpoint = B2_ENDPOINT.replace(/^https?:\/\//, '');
  const endpoint = `https://${rawEndpoint}`;

  return new S3Client({
    endpoint,
    region: B2_REGION || 'us-west-004',
    credentials: {
      accessKeyId: B2_APPLICATION_KEY_ID,
      secretAccessKey: B2_APPLICATION_KEY,
    },
    // Backblaze B2 supports virtual-hosted-style URLs
    forcePathStyle: false,
  });
}

// ── List All Objects (handles pagination for large buckets) ───────────────
async function listAllAudioObjects(s3Client, bucketName) {
  const items = [];
  let continuationToken = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    for (const item of contents) {
      if (!item.Key) continue;
      const ext = path.extname(item.Key).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) {
        items.push(item);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return items;
}

// ── GET /api/tracks ───────────────────────────────────────────────────────
/**
 * Returns the list of music tracks.
 * - If Backblaze is configured → lists from B2, returns presigned or public URLs.
 * - If not configured → returns demo tracks so the player works immediately.
 */
app.get('/api/tracks', async (req, res) => {
  const { B2_BUCKET_NAME, B2_ENDPOINT } = process.env;
  const B2_IS_PRIVATE = (process.env.B2_IS_PRIVATE ?? 'true').toLowerCase() === 'true';
  const s3Client = getS3Client();

  // ── Demo mode (no B2 credentials configured) ────────────────────────────
  if (!s3Client || !B2_BUCKET_NAME) {
    return res.json({
      success: true,
      source: 'demo',
      message:
        'Running in demo mode. Configure .env with your Backblaze B2 credentials to load your music.',
      tracks: DEMO_TRACKS,
    });
  }

  // ── Backblaze B2 mode ────────────────────────────────────────────────────
  try {
    const audioFiles = await listAllAudioObjects(s3Client, B2_BUCKET_NAME);

    // Natural sort so numeric prefixes order correctly: 1, 2, 10 not 1, 10, 2
    audioFiles.sort((a, b) =>
      (a.Key || '').localeCompare(b.Key || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );

    // Build track list — presigned or public URLs
    const tracks = await Promise.all(
      audioFiles.map(async (file, index) => {
        const key = file.Key;
        let url = '';

        if (B2_IS_PRIVATE) {
          // Presigned URL valid for 2 hours — sufficient for a listening session
          const getCmd = new GetObjectCommand({ Bucket: B2_BUCKET_NAME, Key: key });
          url = await getSignedUrl(s3Client, getCmd, { expiresIn: 7200 });
        } else {
          // Direct public CDN/B2 URL
          const cleanEndpoint = (B2_ENDPOINT || '').replace(/^https?:\/\//, '');
          url = `https://${B2_BUCKET_NAME}.${cleanEndpoint}/${encodeURI(key)}`;
        }

        return {
          id: `b2-${index}-${Buffer.from(key).toString('base64url').slice(0, 12)}`,
          name: formatSongTitle(key),
          url,
          filename: key,
        };
      })
    );

    return res.json({
      success: true,
      source: 'backblaze',
      bucket: B2_BUCKET_NAME,
      tracks,
    });
  } catch (error) {
    // Log full error on server; return only a safe message to the client
    console.error('[B2] Error fetching tracks:', error.message || error);

    return res.json({
      success: false,
      source: 'demo-fallback',
      error: 'Unable to connect to music storage. Playing sample tracks.',
      tracks: DEMO_TRACKS,
    });
  }
});

// ── GET /api/health ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Static Frontend (production) ──────────────────────────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, { maxAge: '1h' }));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const b2Configured = !!(
    process.env.B2_ENDPOINT &&
    process.env.B2_APPLICATION_KEY_ID &&
    process.env.B2_APPLICATION_KEY &&
    process.env.B2_BUCKET_NAME
  );

  console.log(`
╔═══════════════════════════════════════════════╗
║         Driving Vibes — Music Server          ║
╠═══════════════════════════════════════════════╣
║  Running on:  http://localhost:${String(PORT).padEnd(14)}║
║  B2 Storage:  ${b2Configured ? '✓ Configured' : '⚠ Demo mode (no .env)'}${' '.repeat(b2Configured ? 18 : 12)}║
╚═══════════════════════════════════════════════╝
  `.trim());
});
