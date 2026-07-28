import User from '../models/User.js';
import { deleteFromR2, uploadAvatarToR2 } from '../middleware/uploadToR2Middleware.js';
import { serializeUser } from '../utils/serializeUser.js';

export const updateSettings = async (req, res, next) => {
  try {
    const allowedPreferences = ['theme', 'currency', 'defaultTimeFilter', 'defaultTableSize'];
    const preferences = req.body.preferences || {};
    const username = req.body.username?.trim();
    let hasUpdates = false;

    if (req.body.username !== undefined) {
      if (!username) {
        return res.status(400).json({ field: 'username', message: 'Please provide a username' });
      }

      if (username.length < 3) {
        return res.status(400).json({ field: 'username', message: 'Username must be at least 3 characters' });
      }

      if (username.length > 20) {
        return res.status(400).json({ field: 'username', message: 'Username must be 20 characters or fewer' });
      }

      if (username !== req.user.username) {
        const usernameExists = await User.exists({
          username,
          _id: { $ne: req.user._id },
        });

        if (usernameExists) {
          return res.status(400).json({
            field: 'username',
            message: 'Username already in use',
          });
        }

        req.user.username = username;
        hasUpdates = true;
      }
    }

    for (const key of allowedPreferences) {
      if (preferences[key] !== undefined) {
        req.user.preferences[key] = preferences[key];
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return res.status(400).json({
        message: 'Please provide at least one setting to update',
      });
    }

    await req.user.save();

    return res.status(200).json({
      user: serializeUser(req.user),
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(400).json({
        field: 'username',
        message: 'Username already in use',
      });
    }

    return next(error);
  }
};

export const updateBankroll = async (req, res, next) => {
  try {
    const { action, amount } = req.body;
    const numericAmount = Number(amount);

    if (!['deposit', 'withdraw'].includes(action)) {
      return res.status(400).json({ message: 'Bankroll action must be deposit or withdraw' });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Please provide a positive bankroll amount' });
    }

    const currentBankroll = Number(req.user.bankroll) || 0;
    const nextBankroll = action === 'deposit' ? currentBankroll + numericAmount : currentBankroll - numericAmount;

    if (nextBankroll < 0) {
      return res.status(400).json({ message: 'You cannot withdraw more than your current bankroll' });
    }

    req.user.bankroll = Number(nextBankroll.toFixed(2));
    await req.user.save();

    return res.status(200).json({
      user: serializeUser(req.user),
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar image is required' });
    }

    const publicBaseUrl = process.env.R2_PUBLIC_URL_AVATAR || process.env.R2_PUBLIC_URL;

    if (!publicBaseUrl) {
      return res.status(500).json({ message: 'Avatar public URL is not configured' });
    }

    const previousAvatarKey = req.user.avatarKey;
    const avatarKey =
      process.env.NODE_ENV === 'test'
        ? `test-avatars/${req.user._id}/${req.file.originalname}`
        : await uploadAvatarToR2(req.file, req.user._id);

    req.user.avatarKey = avatarKey;
    req.user.avatarUrl = `${publicBaseUrl.replace(/\/$/, '')}/${avatarKey}`;

    await req.user.save();

    if (process.env.NODE_ENV !== 'test' && previousAvatarKey && previousAvatarKey !== avatarKey) {
      deleteFromR2(previousAvatarKey).catch((error) => {
        console.error('Failed to delete previous avatar from R2:', error);
      });
    }

    return res.status(200).json({ user: serializeUser(req.user) });
  } catch (error) {
    if (error.name === 'NoSuchBucket') {
      error.statusCode = 503;
      error.message = 'Avatar storage bucket is not configured correctly';
    } else if (error.name === 'AccessDenied') {
      error.statusCode = 503;
      error.message = 'Avatar storage permissions are not configured correctly';
    } else if (error.code === 'EPROTO') {
      error.statusCode = 503;
      error.message = 'Avatar storage connection failed';
    }

    return next(error);
  }
};

export const deleteAvatar = async (req, res, next) => {
  try {
    const previousAvatarKey = req.user.avatarKey;

    req.user.avatarKey = '';
    req.user.avatarUrl = '';

    await req.user.save();

    if (process.env.NODE_ENV !== 'test' && previousAvatarKey) {
      deleteFromR2(previousAvatarKey).catch((error) => {
        console.error('Failed to delete avatar from R2:', error);
      });
    }

    return res.status(200).json({ user: serializeUser(req.user) });
  } catch (error) {
    return next(error);
  }
};
