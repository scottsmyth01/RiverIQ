import express from 'express';
import {
  isAuthenticated,
  login,
  logout,
  registerUser,
  resetPassword,
  sendOneTimeCode,
  sendResetOtp,
  verifyEmail,
} from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-one-time-code', userAuth, sendOneTimeCode);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.post('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-reset-code', sendResetOtp);
authRouter.post('/reset-password', resetPassword);

export default authRouter;
