import dotenv from 'dotenv';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;

console.log('Account ID:', R2_ACCOUNT_ID);
console.log('Bucket:', R2_BUCKET_NAME);

const s3Client = new S3Client({
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function run() {
  try {
    const list = await s3Client.send(new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, MaxKeys: 2 }));
    console.log('Found objects:', list.Contents?.map(c => c.Key));

    if (list.Contents && list.Contents.length > 0) {
      const key = list.Contents[0].Key;
      console.log('Testing key:', key);
      const getCmd = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
      const signedUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });
      console.log('Signed URL:', signedUrl);

      // Try fetching the signed URL directly
      const res = await fetch(signedUrl);
      console.log('Fetch status:', res.status, res.statusText);
      const text = await res.text();
      console.log('Fetch body sample (length ' + text.length + '):', text.slice(0, 300));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
