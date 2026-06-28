// models/sessionModel.js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    game: {
      type: String,
      required: true,
      enum: ['NLHE', 'PLO'],
      default: 'NLHE',
    },
    stakes: {
      type: String,
      required: true,
    },
    hands: {
      type: Number,
      required: true,
      min: 1,
    },
    profit: {
      type: Number,
      required: true,
    },
    bb100: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
