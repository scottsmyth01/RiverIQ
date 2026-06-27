import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';

const app = express();

const getAllowedOrigins = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
  cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || getAllowedOrigins().includes(requestOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${requestOrigin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

export default app;
