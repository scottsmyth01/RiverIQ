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
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadHandHistoryToR2 } from '../middleware/uploadToR2Middleware.js';

router.get('/', protect, getSessions);
router.route('/:id').put(protect, updateSession).delete(protect, deleteSession);
router.post('/add-session', protect, enforceFreeSessionLimit, upload.single('handHistory'), uploadHandHistoryToR2, addSession);
export default router;
