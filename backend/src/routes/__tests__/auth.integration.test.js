import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import '../../test/setupDb.js';
import app from '../../app.js';
import User from '../../models/User.js';

const validUser = {
  username: 'riverhero',
  email: 'hero@riveriq.test',
  password: 'Password123',
  passwordConfirm: 'Password123',
};

async function createLoggedInAgent(overrides = {}) {
  const agent = request.agent(app);

  await agent
    .post('/api/auth/register')
    .send({
      ...validUser,
      username: overrides.username || validUser.username,
      email: overrides.email || validUser.email,
    })
    .expect(201);

  return agent;
}

describe('auth API integration', () => {
  test('register validates required fields and duplicate accounts', async () => {
    const missingResponse = await request(app).post('/api/auth/register').send({}).expect(400);
    expect(missingResponse.body).toMatchObject({
      field: 'username',
      message: 'Please fill in all fields',
    });

    await request(app).post('/api/auth/register').send(validUser).expect(201);

    const duplicateEmailResponse = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, username: 'different' })
      .expect(400);

    expect(duplicateEmailResponse.body).toMatchObject({
      field: 'email',
      message: 'Email already in use',
    });
  });

  test('register creates a user, sets an auth cookie, and does not return password', async () => {
    const response = await request(app).post('/api/auth/register').send(validUser).expect(201);

    expect(response.headers['set-cookie']?.join(';')).toContain('token=');
    expect(response.body.user).toMatchObject({
      username: 'riverhero',
      email: 'hero@riveriq.test',
      subscription: 'free',
      bankroll: 0,
    });
    expect(response.body.user.password).toBeUndefined();

    const savedUser = await User.findOne({ email: validUser.email }).select('+password');
    expect(savedUser).toBeTruthy();
    expect(savedUser.password).not.toBe(validUser.password);
  });

  test('login, me, and logout use the auth cookie correctly', async () => {
    const agent = await createLoggedInAgent();

    await agent.post('/api/auth/logout').expect(200);

    const loggedOutResponse = await agent.get('/api/auth/me').expect(401);
    expect(loggedOutResponse.body.message).toMatch(/not authorized/i);

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password })
      .expect(200);

    expect(loginResponse.headers['set-cookie']?.join(';')).toContain('token=');

    const meResponse = await agent.get('/api/auth/me').expect(200);
    expect(meResponse.body.user).toMatchObject({
      username: validUser.username,
      email: validUser.email,
    });
  });

  test('login rejects invalid email and invalid password', async () => {
    await request(app).post('/api/auth/register').send(validUser).expect(201);

    const invalidEmailResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@riveriq.test', password: validUser.password })
      .expect(401);
    expect(invalidEmailResponse.body).toMatchObject({ field: 'email' });

    const invalidPasswordResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'WrongPassword123' })
      .expect(401);
    expect(invalidPasswordResponse.body).toMatchObject({ field: 'password' });
  });

  test('protected auth routes update preferences and bankroll with validation', async () => {
    const agent = await createLoggedInAgent();

    await request(app).get('/api/auth/me').expect(401);

    const preferenceResponse = await agent
      .patch('/api/auth/preferences')
      .send({ theme: 'dark', defaultTableSize: '8max' })
      .expect(200);
    expect(preferenceResponse.body.user.preferences).toMatchObject({
      theme: 'dark',
      defaultTableSize: '8max',
    });

    const depositResponse = await agent.patch('/api/auth/bankroll').send({ action: 'deposit', amount: 250 }).expect(200);
    expect(depositResponse.body.user.bankroll).toBe(250);

    const withdrawResponse = await agent.patch('/api/auth/bankroll').send({ action: 'withdraw', amount: 75.5 }).expect(200);
    expect(withdrawResponse.body.user.bankroll).toBe(174.5);

    const overdraftResponse = await agent.patch('/api/auth/bankroll').send({ action: 'withdraw', amount: 999 }).expect(400);
    expect(overdraftResponse.body.message).toMatch(/cannot withdraw/i);

    const badActionResponse = await agent.patch('/api/auth/bankroll').send({ action: 'transfer', amount: 10 }).expect(400);
    expect(badActionResponse.body.message).toMatch(/deposit or withdraw/i);
  });
});
