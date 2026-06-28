import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { getSessions } from '../controllers/sessionController.js';

router.get('/', protect, getSessions);

export default router;
