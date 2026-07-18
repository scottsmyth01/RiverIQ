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
    role: {
      type: String,
      default: 'user',
    },
    preferences: {
      theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'light',
      },
      currency: {
        type: String,
        enum: ['USD', 'CAD', 'EUR', 'GBP'],
        default: 'USD',
      },
      defaultTimeFilter: {
        type: String,
        enum: ['7d', '30d', '90d', 'all'],
        default: '30d',
      },
      defaultTableSize: {
        type: String,
        enum: ['6max', '7max', '8max', '9max'],
        default: '9max',
      },
    },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

export default User;
