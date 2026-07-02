import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [15, 'Username must be 15 characters or fewer'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    verifyEmailToken: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // poker dashboard fields
    subscription: {
      type: String,
      default: 'free',
    },
    bankroll: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    totalHandsPlayed: {
      type: Number,
      default: 0,
    },
    totalSessionsPlayed: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      default: 'user',
    },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

export default User;
