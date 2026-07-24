import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import generateToken, { getCookieOptions } from '../generateToken.js';

const originalEnv = process.env;

describe('generateToken', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret', NODE_ENV: 'test' };
    delete process.env.COOKIE_SAME_SITE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('uses safe local cookie defaults', () => {
    expect(getCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
  });

  test('marks cookies secure in production', () => {
    process.env.NODE_ENV = 'production';

    expect(getCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
  });

  test('marks cookies secure when SameSite is none', () => {
    process.env.COOKIE_SAME_SITE = 'none';

    expect(getCookieOptions()).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  });

  test('sets a signed auth cookie and returns the token', () => {
    const res = { cookie: jest.fn() };
    const token = generateToken(res, 'user-123');

    expect(jwt.verify(token, 'test-secret')).toMatchObject({ userId: 'user-123' });
    expect(res.cookie).toHaveBeenCalledWith(
      'token',
      token,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  });
});
