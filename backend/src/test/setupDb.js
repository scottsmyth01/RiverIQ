import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

function assertTestDatabase(uri) {
  const { pathname } = new URL(uri);
  const dbName = pathname.replace(/^\//, '').split('?')[0];

  if (!/(test|e2e)/i.test(dbName)) {
    throw new Error(`Refusing to run tests against non-test Mongo database: ${dbName || '(missing database name)'}`);
  }
}

beforeAll(async () => {
  if (process.env.TEST_MONGO_URI) {
    assertTestDatabase(process.env.TEST_MONGO_URI);
    await mongoose.connect(process.env.TEST_MONGO_URI);
    return;
  }

  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
    },
  });
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  if (!mongoose.connection.db) return;

  const collections = await mongoose.connection.db.collections();

  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});
