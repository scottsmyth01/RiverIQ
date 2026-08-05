import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import {
  addSession,
  deleteSession,
  enforceFreeSessionLimit,
  getSessions,
  updateSession,
} from '../controllers/sessionController.js';
import { handHistoryUpload } from '../middleware/uploadMiddleware.js';

router.get('/', protect, getSessions);
router.route('/:id').put(protect, updateSession).delete(protect, deleteSession);
router.post('/add-session', protect, enforceFreeSessionLimit, handHistoryUpload.array('handHistory', 25), addSession);
export default router;
