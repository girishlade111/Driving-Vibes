import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

function getR2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

/**
 * Vercel Serverless Function to stream audio files from Cloudflare R2
 * with complete Range request support and CORS headers.
 */
export default async function handler(req, res) {
  // CORS Headers for Web Audio API & HTML5 Audio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { key } = req.query;
  if (!key || typeof key !== 'string') {
    return res.status(400).send('Missing audio track key');
  }

  const { R2_BUCKET_NAME } = process.env;
  const r2Client = getR2Client();

  if (!r2Client || !R2_BUCKET_NAME) {
    return res.status(500).send('Cloudflare R2 is not configured.');
  }

  try {
    const rangeHeader = req.headers.range;

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Range: rangeHeader,
    });

    const response = await r2Client.send(command);

    // Cache audio chunks on edge CDN
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Accept-Ranges', 'bytes');

    if (response.ContentType) {
      res.setHeader('Content-Type', response.ContentType);
    } else {
      res.setHeader('Content-Type', 'audio/mpeg');
    }

    if (response.ContentLength) {
      res.setHeader('Content-Length', response.ContentLength);
    }

    if (response.ContentRange) {
      res.setHeader('Content-Range', response.ContentRange);
      res.status(206);
    } else {
      res.status(200);
    }

    // Stream audio buffer to client
    if (response.Body) {
      response.Body.pipe(res);
    } else {
      res.status(404).send('Audio file not found');
    }
  } catch (error) {
    console.error('[Stream] Error streaming file from R2:', error);
    res.status(500).send('Error streaming audio track');
  }
}
