import express from 'express';
import {
  deleteSupportConversation,
  getMySupportConversation,
  getSupportConversation,
  listSupportConversations,
  replyToSupportConversation,
  sendSupportMessage,
  updateSupportConversationStatus,
} from '../controllers/supportController.js';
import protect from '../middleware/authMiddleware.js';
import { requireSupport } from '../middleware/supportMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMySupportConversation);
router.post('/messages', protect, sendSupportMessage);
router.get('/conversations', protect, requireSupport, listSupportConversations);
router.get('/conversations/:id', protect, requireSupport, getSupportConversation);
router.delete('/conversations/:id', protect, requireSupport, deleteSupportConversation);
router.post('/conversations/:id/messages', protect, requireSupport, replyToSupportConversation);
router.patch('/conversations/:id/status', protect, requireSupport, updateSupportConversationStatus);

export default router;
