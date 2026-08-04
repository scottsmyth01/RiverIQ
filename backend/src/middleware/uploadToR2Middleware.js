import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
      Bucket: process.env.R2_BUCKET_NAME_HH,
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
    const files = req.files?.length ? req.files : req.file ? [req.file] : [];

    if (!files.length) {
      return res.status(400).json({ message: 'Please upload a hand history file' });
    }

    if (process.env.NODE_ENV === 'test') {
      req.handHistories = files.map((file) => ({
        originalFileName: file.originalname,
        r2Key: `test-hand-histories/${req.user._id}/${file.originalname}`,
        fileSize: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date(),
      }));
      req.handHistory = req.handHistories[0];
      return next();
    }

    req.handHistories = await Promise.all(
      files.map(async (file) => {
        const r2Key = await uploadToR2(file, req.user._id);

        return {
          originalFileName: file.originalname,
          r2Key,
          fileSize: file.size,
          contentType: file.mimetype,
          uploadedAt: new Date(),
        };
      }),
    );
    req.handHistory = req.handHistories[0];
    next();
  } catch (error) {
    return next(error);
  }
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
