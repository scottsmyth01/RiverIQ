import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import savedReportRoutes from './routes/savedReportRoutes.js';
import { globalErrorHandler, notFound } from './middleware/errorMiddleware.js';

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

      const error = new Error(`CORS blocked origin: ${requestOrigin}`);
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/saved-reports', savedReportRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
