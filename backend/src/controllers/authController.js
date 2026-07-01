import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import generateToken, { getCookieOptions } from '../utils/generateToken.js';
import { Resend } from 'resend';
import { passwordResetEmail, verifyEmail } from '../globals/resend.js';

// @desc    Register a new user
// @route   POST /api/auth/register

const sendPasswordResetEmail = async (email, resetLink) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'RiverIQ <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your RiverIQ password',
    html: passwordResetEmail(email, resetLink),
  });

  if (error) throw new Error(`Reset email failed: ${error.message}`);
};

const sendVerifyEmail = async (email, verifyLink) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'RiverIQ <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your RiverIQ email',
    html: verifyEmail(email, verifyLink),
  });

  if (error) throw new Error(`Verification email failed: ${error.message}`);
};

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

    // PASSWORD VALIDATION (8 chars + letters + numbers)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        field: 'password',
        message: 'Password must be at least 8 characters long and contain at least one letter and one number',
      });
    }

    // EMAIL VALIDATION
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({
        status: 'failed',
        field: 'email',
        message: 'Email already in use',
      });

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
    await sendVerifyEmail(email, link);

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
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription,
        bankroll: user.bankroll,
        totalProfit: user.totalProfit,
        totalHandsPlayed: user.totalHandsPlayed,
        totalSessionsPlayed: user.totalSessionsPlayed,
        winRate: user.winRate,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
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

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

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
    if (!password) return res.status(400).json({ field: 'password', message: 'Please provide your password' });

    // CHECK FOR USER IN DB
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ field: 'email', message: 'Invalid email' });

    //CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ field: 'password', message: 'Invalid password' });

    // set jwt cookie
    generateToken(res, user._id);

    return res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription,
        bankroll: user.bankroll,
        totalProfit: user.totalProfit,
        totalHandsPlayed: user.totalHandsPlayed,
        totalSessionsPlayed: user.totalSessionsPlayed,
        winRate: user.winRate,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
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

// @desc    Get current logged-in user
// @route   GET /api/auth/me

export const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        subscription: req.user.subscription,
        bankroll: req.user.bankroll,
        totalProfit: req.user.totalProfit,
        totalHandsPlayed: req.user.totalHandsPlayed,
        totalSessionsPlayed: req.user.totalSessionsPlayed,
        winRate: req.user.winRate,
        role: req.user.role,
        isEmailVerified: req.user.isEmailVerified,
      },
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
    error.message = error.name === 'TokenExpiredError' ? 'Password reset link has expired' : 'Invalid password reset link';
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
    error.message = error.name === 'TokenExpiredError' ? 'Password reset link has expired' : 'Invalid password reset link';
    return next(error);
  }
};
