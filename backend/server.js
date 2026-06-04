import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRouter from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 1234;

connectDB();

app.use(cors({ credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// API Endpoints
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
