import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';

// ── Audio File Extensions ─────────────────────────────────────────────────
const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.opus']);

/**
 * Converts raw filenames into clean display titles.
 */
function formatSongTitle(filename) {
  const baseName = filename.split('/').pop() || filename;
  const withoutExt = baseName.replace(/\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i, '');
  const withoutPrefix = withoutExt.replace(/^[\d]+[\s._\-]+/, '').trim();
  const readable = (withoutPrefix || withoutExt).replace(/[_-]+/g, ' ').trim();
  return readable.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown Track';
}

/**
 * Creates an S3-compatible client pointed at Cloudflare R2.
 */
function getR2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  return new S3Client({
    endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

/**
 * List All Objects with pagination
 */
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

/**
 * Vercel Serverless Function Handler for /api/tracks
 */
export default async function handler(req, res) {
  // Set CORS and JSON Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
  const R2_IS_PRIVATE = (process.env.R2_IS_PRIVATE ?? 'true').toLowerCase() === 'true';
  const r2Client = getR2Client();

  if (!r2Client || !R2_BUCKET_NAME) {
    return res.status(500).json({
      success: false,
      source: 'error',
      error: 'Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in Vercel Environment Variables.',
      tracks: [],
    });
  }

  try {
    const audioFiles = await listAllAudioObjects(r2Client, R2_BUCKET_NAME);

    // Natural sort
    audioFiles.sort((a, b) =>
      (a.Key || '').localeCompare(b.Key || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );

    const tracks = await Promise.all(
      audioFiles.map(async (file, index) => {
        const key = file.Key;
        let url = '';

        if (R2_PUBLIC_URL) {
          const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
          url = `${baseUrl}/${encodeURI(key)}`;
        } else {
          // Stream directly through Vercel serverless audio endpoint with full Range & CORS support
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

    // Cache responses for 60 seconds on CDN edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({
      success: true,
      source: 'cloudflare-r2',
      bucket: R2_BUCKET_NAME,
      tracks,
    });
  } catch (error) {
    console.error('[Vercel R2] Error fetching tracks:', error);
    return res.status(500).json({
      success: false,
      source: 'error',
      error: 'Unable to connect to Cloudflare R2 storage. Verify your credentials and bucket permissions in Vercel settings.',
      tracks: [],
    });
  }
}
