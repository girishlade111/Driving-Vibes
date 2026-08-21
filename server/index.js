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

// ── Cloudflare R2 S3 Client Factory ──────────────────────────────────────
/**
 * Creates an S3-compatible client pointed at Cloudflare R2.
 * Requires in .env:
 *   R2_ACCOUNT_ID        — your Cloudflare account ID
 *   R2_ACCESS_KEY_ID     — R2 API token Access Key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token Secret Access Key
 */
function getR2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } =
    process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  // Cloudflare R2 endpoint format: https://<accountId>.r2.cloudflarestorage.com
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  return new S3Client({
    endpoint,
    region: 'auto', // R2 uses 'auto' as the region
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    // R2 requires path-style URLs
    forcePathStyle: true,
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
 * Returns the list of music tracks from Cloudflare R2 or default curated library.
 */
app.get('/api/tracks', async (req, res) => {
  const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
  const R2_IS_PRIVATE = (process.env.R2_IS_PRIVATE ?? 'true').toLowerCase() === 'true';
  const r2Client = getR2Client();

  // ── Not configured mode: return error (no fallback demo songs) ─────────
  if (!r2Client || !R2_BUCKET_NAME) {
    return res.status(500).json({
      success: false,
      source: 'error',
      error: 'Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your .env file.',
      tracks: [],
    });
  }

  // ── Cloudflare R2 mode ───────────────────────────────────────────────────
  try {
    const audioFiles = await listAllAudioObjects(r2Client, R2_BUCKET_NAME);

    // Natural sort so numeric prefixes order correctly: 1, 2, 10 not 1, 10, 2
    audioFiles.sort((a, b) =>
      (a.Key || '').localeCompare(b.Key || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );

    // Build track list — presigned or public CDN URLs
    const tracks = await Promise.all(
      audioFiles.map(async (file, index) => {
        const key = file.Key;
        let url = '';

        if (R2_PUBLIC_URL) {
          const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
          url = `${baseUrl}/${encodeURI(key)}`;
        } else {
          url = `/api/stream?key=${encodeURIComponent(key)}`;
        }

        return {
          id: `r2-${index}-${Buffer.from(key).toString('base64url').slice(0, 12)}`,
          name: formatSongTitle(key),
          url,
          filename: key,
        };
      })
    );

    return res.json({
      success: true,
      source: 'cloudflare-r2',
      bucket: R2_BUCKET_NAME,
      tracks,
    });
  } catch (error) {
    // Log full error on server; return only a safe message to the client
    console.error('[R2] Error fetching tracks:', error.message || error);

    return res.json({
      success: false,
      source: 'error',
      error: 'Unable to connect to Cloudflare R2 storage. Check your credentials and bucket settings.',
      tracks: [],
    });
  }
});

// ── GET /api/stream ───────────────────────────────────────────────────────
app.get('/api/stream', async (req, res) => {
  const { key } = req.query;
  if (!key) return res.status(400).send('Missing key parameter');

  const { R2_BUCKET_NAME } = process.env;
  const r2Client = getR2Client();
  if (!r2Client || !R2_BUCKET_NAME) return res.status(500).send('R2 not configured');

  try {
    const range = req.headers.range;
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Range: range,
    });

    const data = await r2Client.send(command);

    res.setHeader('Accept-Ranges', 'bytes');
    if (data.ContentType) res.setHeader('Content-Type', data.ContentType);
    if (data.ContentLength) res.setHeader('Content-Length', data.ContentLength);
    if (data.ContentRange) {
      res.setHeader('Content-Range', data.ContentRange);
      res.status(206);
    } else {
      res.status(200);
    }

    data.Body.pipe(res);
  } catch (err) {
    console.error('[Stream] Error streaming file:', err);
    res.status(500).send('Error streaming audio');
  }
});

// ── GET /api/health ───────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Static Frontend (production) ──────────────────────────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, {
  maxAge: 0,
  setHeaders: (res, pathUrl) => {
    if (pathUrl.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const r2Configured = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );

  console.log(`
╔═══════════════════════════════════════════════╗
║         Driving Vibes — Music Server          ║
╠═══════════════════════════════════════════════╣
║  Running on:  http://localhost:${String(PORT).padEnd(14)}║
║  R2 Storage:  ${r2Configured ? '✓ Configured' : '⚠ Not configured (add .env)'}${' '.repeat(r2Configured ? 18 : 9)}║
╚═══════════════════════════════════════════════╝
  `.trim());
});
