import mongoose from 'mongoose';

const supportMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'support'],
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

const supportConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
      index: true,
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    page: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    messages: {
      type: [supportMessageSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model('SupportConversation', supportConversationSchema);
