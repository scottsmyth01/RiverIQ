import mongoose from 'mongoose';

const db = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || 'riveriq',
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.log('Mongo connection failed', error.message);
    process.exit(1);
  }
};

export default db;
