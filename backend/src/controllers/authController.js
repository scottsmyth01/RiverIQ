import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import { readFileSync } from 'node:fs';
import generateToken, { getCookieOptions } from '../utils/generateToken.js';
import Cloudflare from 'cloudflare/index.js';
import { deleteFromR2, uploadAvatarToR2 } from '../middleware/uploadToR2Middleware.js';

// @desc    Register a new user
// @route   POST /api/auth/register

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  subscription: user.subscription,
  bankroll: user.bankroll,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  preferences: user.preferences,
  avatarUrl: user.avatarUrl,
  avatarKey: user.avatarKey,
});

async function createUniqueUsername(email) {
  const parsedEmail = email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 20)
    .toLowerCase();

  const baseUsername = parsedEmail || 'riveriq';
  let username = baseUsername;
  let suffix = 1;

  while (await User.exists({ username })) {
    const suffixText = String(suffix);
    username = `${baseUsername.slice(0, 20 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return username;
}

async function verifyGoogleCredential(credential) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    const error = new Error('Google login is not configured');
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const profile = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(profile.error_description || 'Invalid Google credential');
    error.statusCode = 401;
    throw error;
  }

  if (profile.aud !== googleClientId) {
    const error = new Error('Google credential was issued for a different client');
    error.statusCode = 401;
    throw error;
  }

  if (profile.email_verified !== 'true' && profile.email_verified !== true) {
    const error = new Error('Google email is not verified');
    error.statusCode = 401;
    throw error;
  }

  return profile;
}

export const registerUser = async (req, res, next) => {
  const { username, email, password, passwordConfirm } = req.body;
  try {
    //BASIC VALIDATION
    const missingField = ['username', 'email', 'password', 'passwordConfirm'].find((field) => !req.body[field]);

    if (missingField)
      return res.status(400).json({
        status: 'failed',
        field: missingField,
        message: 'Please fill in all fields',
      });

    if (password !== passwordConfirm) {
      return res.status(400).json({
        field: 'passwordConfirm',
        message: 'Passwords do not match',
      });
    }

    // EMAIL FORMAT VALIDATION
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        field: 'email',
        message: 'Please provide a valid email address',
      });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({
        status: 'failed',
        field: 'email',
        message: 'Email already in use',
      });

    // PASSWORD VALIDATION (8 chars + letters + numbers)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        field: 'password',
        message: 'Password must be at least 8 characters long and contain at least one letter and one number',
      });
    }

    // USERNAME VALIDATION
    const userNameExists = await User.findOne({ username });
    if (userNameExists)
      return res.status(400).json({
        status: 'failed',
        field: 'username',
        message: 'Username already in use',
      });

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 1. Create raw token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // 2. Hash token before storing it
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const link = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // SEND USER VERIFICATION LINK
    await sendVerifyEmail(username, email, link);

    // CREATE USER IN DB
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      verifyEmailToken: hashedVerificationToken,
    });

    // SET THE JWT TOKEN
    generateToken(res, user._id);

    return res.status(201).json({
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      verifyEmailToken: hashedToken,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.isEmailVerified = true;
    user.verifyEmailToken = undefined;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    return next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // BASIC VALIDATION
    if (!email) return res.status(400).json({ field: 'email', message: 'Please provide your email' });
    if (!password) return res.status(400).json({ field: 'password', message: 'Invalid password' });

    // CHECK FOR USER IN DB
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ field: 'email', message: 'Invalid email' });

    //CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ field: 'password', message: 'Invalid password' });

    // set jwt cookie
    generateToken(res, user._id);

    return res.status(200).json({
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const loginWithGoogle = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const profile = await verifyGoogleCredential(credential);
    const email = profile.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'Google account did not include an email address' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const username = await createUniqueUsername(email);
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        username,
        email,
        password: hashedPassword,
        isEmailVerified: true,
      });
    } else if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.verifyEmailToken = undefined;
      await user.save();
    }

    generateToken(res, user._id);

    return res.status(200).json({
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public

export const logoutUser = async (req, res, next) => {
  try {
    res.clearCookie('token', getCookieOptions());

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const apiToken = process.env.CLOUDFLARE_KEY;
  if (!apiToken) {
    throw new Error('Cloudflare API token is not configured');
  }
  const client = new Cloudflare({
    apiToken,
  });
  const pwResetEmail = readFileSync(new URL('../data/password-reset-email.html', import.meta.url), 'utf8')
    .replaceAll('{{reset_url}}', () => escapeHtml(resetLink))
    .replaceAll('{{current_year}}', () => escapeHtml(new Date().getFullYear().toString()));

  const response = await client.emailSending.send({
    account_id: 'a6dbd6263cba6aeb30176d034c765748',
    from: 'RiverIQ <support@riveriq.app>',
    to: email,
    subject: 'RiverIQ - Here is your password reset link',
    html: pwResetEmail,
  });
};

const sendVerifyEmail = async (username, email, verifyLink) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const apiToken = process.env.CLOUDFLARE_KEY;

  if (!apiToken) {
    throw new Error('Cloudflare API token is not configured');
  }

  const client = new Cloudflare({
    apiToken,
  });
  const verificationEmail = readFileSync(new URL('../data/welcome-email.html', import.meta.url), 'utf8')
    .replaceAll('{{customer_name}}', () => escapeHtml(username))
    .replaceAll('{{verify_url}}', () => escapeHtml(verifyLink))
    .replaceAll('{{current_year}}', new Date().getFullYear().toString());

  const response = await client.emailSending.send({
    account_id: 'a6dbd6263cba6aeb30176d034c765748',
    from: 'RiverIQ <welcome@riveriq.app>',
    to: email,
    subject: 'Welcome to RiverIQ — verify your email',
    html: verificationEmail,
    text: `Welcome to RiverIQ, ${username}! Verify your email to activate your account: ${verifyLink}`,
  });
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me

export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      user: serializeUser(req.user),
    });
  } catch (error) {
    return next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const allowedPreferences = ['theme', 'currency', 'defaultTimeFilter', 'defaultTableSize'];
    const updates = {};

    for (const key of allowedPreferences) {
      if (req.body[key] !== undefined) {
        updates[`preferences.${key}`] = req.body[key];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'Please provide at least one preference to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    return res.status(200).json({
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const username = req.body.username?.trim();

    if (!username) {
      return res.status(400).json({ field: 'username', message: 'Please provide a username' });
    }

    if (username.length < 3) {
      return res.status(400).json({ field: 'username', message: 'Username must be at least 3 characters' });
    }

    if (username.length > 20) {
      return res.status(400).json({ field: 'username', message: 'Username must be 20 characters or fewer' });
    }

    if (username === req.user.username) {
      return res.status(200).json({
        user: serializeUser(req.user),
      });
    }

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
    await req.user.save();

    return res.status(200).json({
      user: serializeUser(req.user),
    });
  } catch (error) {
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

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ field: 'email', message: 'Please provide your email' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ field: 'email', message: 'Invalid email' });

    const secret = process.env.JWT_SECRET + user.password;
    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: '5m',
    });
    const link = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`;

    await sendPasswordResetEmail(user.email, link);

    return res.status(200).json({ message: 'Password reset link sent to specified email' });
  } catch (error) {
    return next(error);
  }
};

export const validateResetToken = async (req, res, next) => {
  try {
    const { id, token } = req.params;
    const user = await User.findById(id).select('+password');

    if (!user) return res.status(400).json({ message: 'Invalid password reset link' });

    const secret = process.env.JWT_SECRET + user.password;
    jwt.verify(token, secret);

    return res.status(200).json({
      message: 'Password reset link is valid',
      userId: user._id,
    });
  } catch (error) {
    error.statusCode = 400;
    error.message =
      error.name === 'TokenExpiredError' ? 'Password reset link has expired' : 'Invalid password reset link';
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { id, token } = req.params;
    const { password, passwordConfirm } = req.body;

    if (!password) return res.status(400).json({ field: 'password', message: 'Please provide a new password' });
    if (password !== passwordConfirm)
      return res.status(400).json({ field: 'passwordConfirm', message: 'Passwords do not match' });

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({
        field: 'password',
        message: 'Password must be at least 8 characters long and contain at least one letter and one number',
      });

    const user = await User.findById(id).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid password reset link' });

    const secret = process.env.JWT_SECRET + user.password;
    jwt.verify(token, secret);

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    error.statusCode = 400;
    error.message =
      error.name === 'TokenExpiredError' ? 'Password reset link has expired' : 'Invalid password reset link';
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
    const avatarKey = await uploadAvatarToR2(req.file, req.user._id);

    req.user.avatarKey = avatarKey;
    req.user.avatarUrl = `${publicBaseUrl.replace(/\/$/, '')}/${avatarKey}`;

    await req.user.save();

    if (previousAvatarKey && previousAvatarKey !== avatarKey) {
      deleteFromR2(previousAvatarKey).catch((error) => {
        console.error('Failed to delete previous avatar from R2:', error);
      });
    }

    return res.status(200).json({ user: serializeUser(req.user) });
  } catch (error) {
    return next(error);
  }
};

export const deleteAvatar = async (req, res, next) => {
  try {
    const previousAvatarKey = req.user.avatarKey;

    req.user.avatarKey = '';
    req.user.avatarUrl = '';

    await req.user.save();

    if (previousAvatarKey) {
      deleteFromR2(previousAvatarKey).catch((error) => {
        console.error('Failed to delete avatar from R2:', error);
      });
    }

    return res.status(200).json({ user: serializeUser(req.user) });
  } catch (error) {
    return next(error);
  }
};
