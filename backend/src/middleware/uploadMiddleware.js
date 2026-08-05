import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const handHistoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.txt')) {
      const error = new Error('Please upload a hand history .txt file');
      error.statusCode = 400;
      return cb(error);
    }

    cb(null, true);
  },
});

const allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
  fileFilter: (req, file, cb) => {
    if (!allowedAvatarTypes.includes(file.mimetype)) {
      const error = new Error('Avatar must be a JPG, PNG, or WebP image');
      error.statusCode = 400;
      return cb(error);
    }

    cb(null, true);
  },
});
