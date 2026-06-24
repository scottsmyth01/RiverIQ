import dotenv from 'dotenv';
import app from './app.js';
import db from './config/db.js';

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 5001;

const server = async () => {
  await db();

  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
};

server();
