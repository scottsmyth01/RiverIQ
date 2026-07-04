import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '../config/r2.js';

export async function uploadToR2(file, userId) {
  const key = `hand-histories/${userId}/${Date.now()}-${file.originalname}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return key;
}
