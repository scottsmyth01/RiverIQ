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
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';

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

export default router;
