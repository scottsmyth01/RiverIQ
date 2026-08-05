import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Initialize R2 and form connection between backend and cloud service

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Upload file to R2

// bucket: riveriq-hand-histories
// key: hand-histories/USERID/TIMESTAMP-FILENAME.txt
// body: filer.buffer (actual file here)
// contentType (mimetype): type of file being uploaded (.txt here); so text/plain

function buildHandHistoryKey(file, userId, prefix = 'hand-histories') {
  const safeFileName = sanitizeFileName(file.originalname);
  return `${prefix}/${userId}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
}

export async function uploadToR2(file, userId) {
  const key = buildHandHistoryKey(file, userId);

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME_HH,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
  return key;
}

export async function buildHandHistoryRecords(files, userId) {
  if (process.env.NODE_ENV === 'test') {
    return files.map((file) => ({
      originalFileName: file.originalname,
      r2Key: buildHandHistoryKey(file, userId, 'test-hand-histories'),
      fileSize: file.size,
      contentType: file.mimetype,
      uploadedAt: new Date(),
    }));
  }

  const records = [];
  try {
    for (const file of files) {
      const r2Key = await uploadToR2(file, userId);

      records.push({
        originalFileName: file.originalname,
        r2Key,
        fileSize: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date(),
      });
    }
  } catch (error) {
    await Promise.allSettled(
      records.map((record) => deleteFromR2(record.r2Key, process.env.R2_BUCKET_NAME_HH)),
    );
    throw error;
  }

  return records;
}

function sanitizeFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function uploadAvatarToR2(file, userId) {
  const safeFileName = sanitizeFileName(file.originalname);
  const key = `avatars/${userId}/${Date.now()}-${safeFileName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME_AVATAR,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return key;
}

export async function deleteFromR2(key, bucket = process.env.R2_BUCKET_NAME_AVATAR) {
  if (!key) return;

  await r2.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
