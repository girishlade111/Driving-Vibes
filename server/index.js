import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Supported audio file extensions
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac'];

/**
 * Format raw file name into clean display title
 * Example: '01 - Midnight_Drive.mp3' -> 'Midnight Drive'
 */
function formatSongTitle(filename) {
  // Extract base filename without path
  const baseName = filename.split('/').pop() || filename;
  
  // Remove extension
  const withoutExt = baseName.replace(/\.(mp3|m4a|aac|wav|ogg|flac)$/i, '');
  
  // Remove numeric prefix (e.g., '01.', '01 -', '01_', '01 ')
  const cleanPrefix = withoutExt.replace(/^[\d\s_\-\.]+/, '').trim();
  
  // Replace underscores and excess hyphens with spaces
  const cleanName = (cleanPrefix || withoutExt).replace(/[_-]+/g, ' ').trim();
  
  return cleanName || withoutExt || 'Unknown Track';
}

// Built-in ambient & synthwave demo tracks for out-of-the-box experience
const DEMO_TRACKS = [
  {
    id: 'demo-1',
    name: 'Night Owl Ambient',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    filename: '01-night-owl-ambient.mp3'
  },
  {
    id: 'demo-2',
    name: 'Tokyo Neon Horizon',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3',
    filename: '02-tokyo-neon-horizon.mp3'
  },
  {
    id: 'demo-3',
    name: 'Midnight Highway Chill',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=lofi-chill-medium-version-159456.mp3',
    filename: '03-midnight-highway-chill.mp3'
  },
  {
    id: 'demo-4',
    name: 'Cosmic Cruise Waves',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=electronic-future-beats-117997.mp3',
    filename: '04-cosmic-cruise-waves.mp3'
  },
  {
    id: 'demo-5',
    name: 'Dreamscape Reverie',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_730be70b97.mp3?filename=reflected-light-147979.mp3',
    filename: '05-dreamscape-reverie.mp3'
  }
];

/**
 * Configure S3 Client for Backblaze B2
 */
function getS3Client() {
  const { B2_ENDPOINT, B2_REGION, B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY } = process.env;

  if (!B2_ENDPOINT || !B2_APPLICATION_KEY_ID || !B2_APPLICATION_KEY) {
    return null;
  }

  // Ensure endpoint format: strip protocol if present
  let endpoint = B2_ENDPOINT.replace(/^https?:\/\//, '');
  endpoint = `https://${endpoint}`;

  return new S3Client({
    endpoint,
    region: B2_REGION || 'us-west-004',
    credentials: {
      accessKeyId: B2_APPLICATION_KEY_ID,
      secretAccessKey: B2_APPLICATION_KEY,
    },
    forcePathStyle: false, // Backblaze supports virtual-hosted style
  });
}

/**
 * GET /api/tracks
 * Automatically lists and prepares music tracks from Backblaze B2 S3 storage.
 */
app.get('/api/tracks', async (req, res) => {
  const { B2_BUCKET_NAME, B2_ENDPOINT, B2_IS_PRIVATE = 'true' } = process.env;
  const s3Client = getS3Client();

  // If Backblaze is not configured yet, serve demo fallback
  if (!s3Client || !B2_BUCKET_NAME) {
    return res.json({
      success: true,
      source: 'demo',
      message: 'Running in demo mode with sample tracks. Configure .env with Backblaze B2 credentials to load your bucket.',
      tracks: DEMO_TRACKS
    });
  }

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: B2_BUCKET_NAME,
    });

    const response = await s3Client.send(listCommand);
    const contents = response.Contents || [];

    // Filter audio files only
    const audioFiles = contents.filter((item) => {
      if (!item.Key) return false;
      const ext = path.extname(item.Key).toLowerCase();
      return AUDIO_EXTENSIONS.includes(ext);
    });

    // Deterministic sorting (natural alphabetical order)
    audioFiles.sort((a, b) => (a.Key || '').localeCompare(b.Key || '', undefined, { numeric: true, sensitivity: 'base' }));

    const isPrivate = B2_IS_PRIVATE.toLowerCase() === 'true';

    // Generate safe URLs for each audio track
    const tracks = await Promise.all(
      audioFiles.map(async (file, index) => {
        const key = file.Key;
        let url = '';

        if (isPrivate) {
          // Generate presigned URL expiring in 2 hours
          const getCmd = new GetObjectCommand({
            Bucket: B2_BUCKET_NAME,
            Key: key,
          });
          url = await getSignedUrl(s3Client, getCmd, { expiresIn: 7200 });
        } else {
          // Direct public B2 URL
          const cleanEndpoint = B2_ENDPOINT.replace(/^https?:\/\//, '');
          url = `https://${B2_BUCKET_NAME}.${cleanEndpoint}/${encodeURI(key)}`;
        }

        return {
          id: `b2-${index}-${encodeURIComponent(key)}`,
          name: formatSongTitle(key),
          url,
          filename: key,
          size: file.Size,
          lastModified: file.LastModified,
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
    console.error('Error fetching tracks from Backblaze B2:', error.message);
    // Graceful fallback on B2 error so the player never crashes
    return res.json({
      success: false,
      source: 'demo-fallback',
      error: 'Failed to connect to storage provider. Serving fallback catalog.',
      tracks: DEMO_TRACKS,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Minimal Music Backend Server running on http://localhost:${PORT}`);
});
