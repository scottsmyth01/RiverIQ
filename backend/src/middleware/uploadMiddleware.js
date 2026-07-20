import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
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
