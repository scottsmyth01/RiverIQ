import { afterEach, describe, expect, test } from '@jest/globals';

const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
});

describe('environment validation', () => {
  test('does not require production secrets outside production', async () => {
    process.env = { NODE_ENV: 'test' };

    const { validateProductionEnv } = await import(`../env.js?test=${Date.now()}`);

    expect(() => validateProductionEnv()).not.toThrow();
  });

  test('throws a clear error when production env vars are missing', async () => {
    process.env = { NODE_ENV: 'production' };

    await expect(import(`../env.js?test=${Date.now()}`)).rejects.toThrow(/Missing required production env vars/);
  });

  test('passes when required production env vars are present', async () => {
    process.env = {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://riveriq.app',
      MONGO_URI: 'mongodb://localhost:27017/riveriq',
      JWT_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'google-client-id',
      STRIPE_SECRET_KEY: 'sk_live_test',
      STRIPE_PRICE_ID: 'price_live_test',
      STRIPE_YEARLY_PRICE_ID: 'price_yearly_live_test',
      CLOUDFLARE_KEY: 'cloudflare-token',
      R2_ACCOUNT_ID: 'r2-account',
      R2_ACCESS_KEY_ID: 'r2-access-key',
      R2_SECRET_ACCESS_KEY: 'r2-secret-key',
      R2_BUCKET_NAME_HH: 'hand-histories',
      R2_BUCKET_NAME_AVATAR: 'avatars',
      R2_PUBLIC_URL: 'https://assets.riveriq.app',
    };

    const { validateProductionEnv } = await import(`../env.js?test=${Date.now()}`);

    expect(() => validateProductionEnv()).not.toThrow();
  });
});
