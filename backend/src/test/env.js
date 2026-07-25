process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'lax';
process.env.R2_BUCKET_NAME_HH = process.env.R2_BUCKET_NAME_HH || 'test-hand-histories';
process.env.R2_BUCKET_NAME_AVATAR = process.env.R2_BUCKET_NAME_AVATAR || 'test-avatars';
process.env.R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://assets.test';
