import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import { readFileSync } from 'node:fs';
import generateToken, { getCookieOptions } from '../utils/generateToken.js';
import Cloudflare from 'cloudflare/index.js';
import { serializeUser } from '../utils/serializeUser.js';
import { escapeHtml } from '../utils/escapeHtml.js';

// @desc    Register a new user
// @route   POST /api/auth/register

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

      const setPasswordLink = createPasswordResetLink(user);
      await sendPasswordResetEmail(user.email, setPasswordLink, {
        subject: 'RiverIQ - Set your password',
        previewText: 'Set a RiverIQ password for your new Google-created account. This secure link expires in 5 minutes.',
        eyebrow: 'Set password',
        title: 'Finish securing your account.',
        body: 'Your RiverIQ account was created with Google. We generated a secure internal password for the account, but you can use the link below to choose your own password for email login.',
        buttonText: 'Set my password',
        securityText:
          'For your security, this setup link can only be used while it is valid. If it expires, request a new password link from the RiverIQ login page.',
        ignoreText:
          '<strong style="color: #ffffff">Prefer Google sign-in?</strong> You can ignore this email and keep using Continue with Google.',
        footerReason: 'You received this email because a RiverIQ account was created using Google sign-in.',
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

function createPasswordResetLink(user) {
  const secret = process.env.JWT_SECRET + user.password;
  const token = jwt.sign({ email: user.email, id: user._id }, secret, {
    expiresIn: '5m',
  });

  return `${process.env.FRONTEND_URL}/reset-password/${user._id}/${token}`;
}

const sendPasswordResetEmail = async (email, resetLink, content = {}) => {
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
  const {
    subject = 'RiverIQ - Here is your password reset link',
    previewText = 'Reset your RiverIQ password. This secure link expires in 5 minutes.',
    eyebrow = 'Password reset',
    title = 'Let’s get you back in.',
    body = 'We received a request to reset the password for your RiverIQ account. Use the secure link below to choose a new password and get back to tracking your game.',
    buttonText = 'Reset my password',
    securityTitle = 'This link expires in 5 minutes',
    securityText = 'For your security, this reset link can only be used while it is valid. If it expires, request a new one from the RiverIQ login page.',
    ignoreText = '<strong style="color: #ffffff">Didn’t request this reset?</strong> You can safely ignore this email. Your password will remain unchanged.',
    footerReason = 'You received this email because a password reset was requested for your RiverIQ account.',
  } = content;
  const pwResetEmail = readFileSync(new URL('../data/password-reset-email.html', import.meta.url), 'utf8')
    .replaceAll('{{preview_text}}', () => escapeHtml(previewText))
    .replaceAll('{{email_eyebrow}}', () => escapeHtml(eyebrow))
    .replaceAll('{{email_title}}', () => escapeHtml(title))
    .replaceAll('{{email_body}}', () => escapeHtml(body))
    .replaceAll('{{button_text}}', () => escapeHtml(buttonText))
    .replaceAll('{{security_title}}', () => escapeHtml(securityTitle))
    .replaceAll('{{security_text}}', () => escapeHtml(securityText))
    .replaceAll('{{ignore_text}}', () => ignoreText)
    .replaceAll('{{footer_reason}}', () => escapeHtml(footerReason))
    .replaceAll('{{reset_url}}', () => escapeHtml(resetLink))
    .replaceAll('{{current_year}}', () => escapeHtml(new Date().getFullYear().toString()));

  const response = await client.emailSending.send({
    account_id: 'a6dbd6263cba6aeb30176d034c765748',
    from: 'RiverIQ <support@riveriq.app>',
    to: email,
    subject,
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

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ field: 'email', message: 'Please provide your email' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ field: 'email', message: 'Invalid email' });

    const link = createPasswordResetLink(user);

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
