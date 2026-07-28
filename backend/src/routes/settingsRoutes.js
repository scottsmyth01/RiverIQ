import express from 'express';
import {
  updateSettings,
  updateBankroll,
  uploadAvatar,
  deleteAvatar,
} from '../controllers/settingsController.js';
import protect from '../middleware/authMiddleware.js';
import { avatarUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.patch('/', protect, updateSettings);
router.patch('/bankroll', protect, updateBankroll);
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);

export default router;
