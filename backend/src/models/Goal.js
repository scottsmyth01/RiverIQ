import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [80, 'Goal title must be 80 characters or fewer'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [240, 'Goal description must be 240 characters or fewer'],
      default: '',
    },
    category: {
      type: String,
      enum: ['Preflop', 'Postflop', 'Results', 'Volume', 'Bankroll', 'Study'],
      default: 'Preflop',
    },
    target: {
      type: String,
      required: [true, 'Goal target is required'],
      trim: true,
      maxlength: [40, 'Goal target must be 40 characters or fewer'],
    },
    current: {
      type: String,
      trim: true,
      maxlength: [40, 'Goal current value must be 40 characters or fewer'],
      default: '',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Not Started', 'Active', 'Needs Attention', 'Paused', 'Completed'],
      default: 'Active',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'ai'],
      default: 'manual',
      index: true,
    },
    ai: {
      metric: String,
      position: String,
      direction: {
        type: String,
        enum: ['increase', 'decrease'],
      },
      targetMin: Number,
      targetMax: Number,
      baseline: Number,
      sampleSize: Number,
      generatedAt: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Goal', goalSchema);
