import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

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

// actual controller function that runs when a user sends POST req  to /api/sessions/addSessions

export async function uploadHandHistoryToR2(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a hand history file' });
    }
    const r2Key = await uploadToR2(req.file, req.user._id);

    req.handHistory = {
      originalFileName: req.file.originalname,
      r2Key,
      fileSize: req.file.size,
      contentType: req.file.mimetype,
      uploadedAt: new Date(),
    };
    next();
  } catch (error) {
    return next(error);
  }
}
