import { S3Client } from '@aws-sdk/client-s3';

const requiredR2Variables = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
];
const missingR2Variables = requiredR2Variables.filter((variable) => !process.env[variable]);

if (missingR2Variables.length > 0) {
  throw new Error(`Missing required R2 environment variables: ${missingR2Variables.join(', ')}`);
}

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
