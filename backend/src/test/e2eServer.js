import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '5001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-jwt-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5174';
process.env.COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';
process.env.R2_BUCKET_NAME_HH = process.env.R2_BUCKET_NAME_HH || 'e2e-hand-histories';
process.env.R2_BUCKET_NAME_AVATAR = process.env.R2_BUCKET_NAME_AVATAR || 'e2e-avatars';
process.env.R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://assets.e2e.test';

const { default: app } = await import('../app.js');
const { default: User } = await import('../models/User.js');

const PORT = Number(process.env.PORT) || 5001;

let mongoServer;

function assertTestDatabase(uri) {
  const { pathname } = new URL(uri);
  const dbName = pathname.replace(/^\//, '').split('?')[0];

  if (!/(test|e2e)/i.test(dbName)) {
    throw new Error(`Refusing to run E2E tests against non-test Mongo database: ${dbName || '(missing database name)'}`);
  }
}

if (process.env.TEST_MONGO_URI) {
  assertTestDatabase(process.env.TEST_MONGO_URI);
  await mongoose.connect(process.env.TEST_MONGO_URI);
} else {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
    },
  });

  await mongoose.connect(mongoServer.getUri());
}

await User.create({
  username: 'e2ehero',
  email: 'e2e@riveriq.test',
  password: await bcrypt.hash('Password123', 10),
  isEmailVerified: true,
  bankroll: 0,
  subscription: 'pro',
  preferences: {
    theme: 'dark',
    currency: 'USD',
    defaultTimeFilter: 'all',
    defaultTableSize: '6max',
  },
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`E2E API server running on http://127.0.0.1:${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
