import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
  cancelSubscription,
  confirmSubscription,
  createBillingPortalSession,
  createSubscription,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/subscribe', protect, createSubscription);
router.post('/billing-portal', protect, createBillingPortalSession);
router.post('/subscription/confirm', protect, confirmSubscription);
router.post('/subscription/cancel', protect, cancelSubscription);

export default router;
