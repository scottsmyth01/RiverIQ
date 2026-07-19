import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { confirmSubscription, createSubscription } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/subscribe', protect, createSubscription);
router.post('/subscription/confirm', protect, confirmSubscription);

export default router;
