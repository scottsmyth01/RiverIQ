import express from 'express';
import { login, logout, registerUser } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', login);
authRouter.post('/logout', logout);

export default authRouter;
