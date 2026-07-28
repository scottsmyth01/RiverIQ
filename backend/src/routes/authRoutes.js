import express from 'express';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  getMe,
  logoutUser,
  forgotPassword,
  validateResetToken,
  resetPassword,
  validateEmail,
  updateProfile,
  updatePreferences,
  updateBankroll,
  uploadAvatar,
  deleteAvatar,
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { avatarUpload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', loginWithGoogle);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:id/:token', validateResetToken);
router.post('/reset-password/:id/:token', resetPassword);
router.get('/verify-email/:token', validateEmail);
router.patch('/profile', protect, updateProfile);
router.post('/preferences', protect, updatePreferences);
router.patch('/preferences', protect, updatePreferences);
router.patch('/bankroll', protect, updateBankroll);
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);

export default router;
