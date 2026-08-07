import mongoose from 'mongoose';
import SupportConversation from '../models/SupportConversation.js';
import { notifyNewSupportConversation } from '../utils/supportEmail.js';

const MESSAGE_LIMIT = 4000;

function sanitizeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function serializeUser(user = {}) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    subscription: user.subscription,
  };
}

function serializeConversation(conversation) {
  const conversationObject = typeof conversation.toObject === 'function' ? conversation.toObject() : conversation;

  return {
    ...conversationObject,
    id: conversationObject._id,
    user: serializeUser(conversationObject.user),
    messages: (conversationObject.messages || []).map((message) => ({
      ...message,
      id: message._id,
    })),
  };
}

function getMessageBody(req) {
  const body = sanitizeString(req.body?.body || req.body?.message);

  if (!body) {
    return { error: 'Message is required' };
  }

  if (body.length > MESSAGE_LIMIT) {
    return { error: `Message must be ${MESSAGE_LIMIT} characters or fewer` };
  }

  return { body };
}

async function findCustomerConversation(userId, conversationId) {
  if (!conversationId) {
    return SupportConversation.findOne({ user: userId, status: 'open' }).sort({ lastMessageAt: -1 });
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }

  return SupportConversation.findOne({ _id: conversationId, user: userId });
}

export const getMySupportConversation = async (req, res, next) => {
  try {
    const conversation = await SupportConversation.findOne({ user: req.user._id, status: 'open' })
      .sort({ lastMessageAt: -1 })
      .populate('user', 'username email subscription');

    return res.status(200).json({
      conversation: conversation ? serializeConversation(conversation) : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const sendSupportMessage = async (req, res, next) => {
  try {
    const { body, error } = getMessageBody(req);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const conversationId = sanitizeString(req.body?.conversationId);
    let conversation = await findCustomerConversation(req.user._id, conversationId);

    if (!conversation) {
      conversation = new SupportConversation({
        user: req.user._id,
        topic: sanitizeString(req.body?.topic),
        page: sanitizeString(req.body?.page),
      });
    }

    conversation.status = 'open';
    conversation.topic = conversation.topic || sanitizeString(req.body?.topic);
    conversation.page = sanitizeString(req.body?.page, conversation.page);
    conversation.lastMessageAt = new Date();
    conversation.messages.push({
      sender: 'user',
      author: req.user._id,
      body,
      metadata: req.body?.metadata || {},
    });

    await conversation.save();
    await conversation.populate('user', 'username email subscription');

    try {
      await notifyNewSupportConversation(conversation);
    } catch (emailError) {
      console.error('Support notification email failed:', emailError.message);
    }

    return res.status(201).json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    return next(error);
  }
};

export const listSupportConversations = async (req, res, next) => {
  try {
    const status = ['open', 'resolved'].includes(req.query.status) ? req.query.status : 'open';
    const conversations = await SupportConversation.find({ status })
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .populate('user', 'username email subscription');

    return res.status(200).json({
      conversations: conversations.map(serializeConversation),
    });
  } catch (error) {
    return next(error);
  }
};

export const getSupportConversation = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const conversation = await SupportConversation.findById(req.params.id).populate(
      'user',
      'username email subscription',
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    return res.status(200).json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    return next(error);
  }
};

export const replyToSupportConversation = async (req, res, next) => {
  try {
    const { body, error } = getMessageBody(req);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const conversation = await SupportConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    conversation.status = 'open';
    conversation.lastMessageAt = new Date();
    conversation.messages.push({
      sender: 'support',
      author: req.user._id,
      body,
    });

    await conversation.save();
    await conversation.populate('user', 'username email subscription');

    return res.status(201).json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    return next(error);
  }
};

export const updateSupportConversationStatus = async (req, res, next) => {
  try {
    const status = sanitizeString(req.body?.status);

    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Status must be open or resolved' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const conversation = await SupportConversation.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true },
    ).populate('user', 'username email subscription');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    return res.status(200).json({ conversation: serializeConversation(conversation) });
  } catch (error) {
    return next(error);
  }
};

export const deleteSupportConversation = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const conversation = await SupportConversation.findByIdAndDelete(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    return res.status(200).json({
      message: 'Conversation permanently deleted',
      id: req.params.id,
    });
  } catch (error) {
    return next(error);
  }
};
