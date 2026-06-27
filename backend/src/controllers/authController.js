import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    //BASIC VALIDATION
    if (!username || !email || !password)
      return res.status(400).json({
        status: 'failed',
        message: 'Please fill in all fields',
      });

    // PASSWORD VALIDATION (8 chars + letters + numbers)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain at least one letter and one number',
      });
    }

    // EMAIL VALIDATION
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({
        status: 'failed',
        message: 'Email already in use',
      });

    // USERNAME VALIDATION
    const userNameExists = await User.findOne({ username });
    if (userNameExists)
      return res.status(400).json({
        status: 'failed',
        message: 'Username already in use',
      });

    // HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CREATE USER IN DB
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
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
    console.error('registerUser error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(email, password);
    // BASIC VALIDATION
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    // CHECK FOR USER IN DB
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    //CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

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
    console.error('loginUser error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('logoutUser error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me

export const getMe = async (req, res) => {
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
    console.error('getMe error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
