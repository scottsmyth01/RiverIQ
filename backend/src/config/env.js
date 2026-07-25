import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

const requiredProductionEnvVars = [
  'FRONTEND_URL',
  'MONGO_URI',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_YEARLY_PRICE_ID',
  'CLOUDFLARE_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME_HH',
  'R2_BUCKET_NAME_AVATAR',
  'R2_PUBLIC_URL',
];

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const missingEnvVars = requiredProductionEnvVars.filter((key) => !process.env[key]);

  if (missingEnvVars.length) {
    throw new Error(`Missing required production env vars: ${missingEnvVars.join(', ')}`);
  }
}

validateProductionEnv();
