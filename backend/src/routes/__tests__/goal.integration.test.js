import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import '../../test/setupDb.js';
import app from '../../app.js';
import Goal from '../../models/Goal.js';

const makeUser = (prefix) => ({
  username: `${prefix}hero`.slice(0, 20),
  email: `${prefix}@riveriq.test`,
  password: 'Password123',
  passwordConfirm: 'Password123',
});

async function createLoggedInAgent(prefix = 'goal') {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(makeUser(prefix)).expect(201);
  return agent;
}

const validGoal = {
  title: 'Improve 3Bet',
  description: 'Move 3Bet closer to target range',
  category: 'Preflop',
  target: '8%',
  current: '5%',
  progress: 35,
  status: 'Active',
  dueDate: '2026-08-15T00:00:00.000Z',
};

describe('goals API integration', () => {
  test('protects goal routes from logged-out users', async () => {
    await request(app).get('/api/goals').expect(401);
    await request(app).post('/api/goals').send(validGoal).expect(401);
  });

  test('creates, lists, updates, and deletes a goal for the logged-in user', async () => {
    const agent = await createLoggedInAgent();

    const createResponse = await agent.post('/api/goals').send(validGoal).expect(201);
    const goal = createResponse.body.goal;

    expect(goal).toMatchObject({
      title: validGoal.title,
      category: validGoal.category,
      target: validGoal.target,
      progress: validGoal.progress,
      status: validGoal.status,
    });

    const listResponse = await agent.get('/api/goals').expect(200);
    expect(listResponse.body.goals).toHaveLength(1);
    expect(listResponse.body.goals[0]._id).toBe(goal._id);

    const updateResponse = await agent
      .put(`/api/goals/${goal._id}`)
      .send({
        ...validGoal,
        title: 'Complete volume goal',
        category: 'Volume',
        target: '5000 hands',
        current: '5000 hands',
        progress: 100,
        status: 'Completed',
      })
      .expect(200);

    expect(updateResponse.body.goal).toMatchObject({
      title: 'Complete volume goal',
      category: 'Volume',
      progress: 100,
      status: 'Completed',
    });
    expect(updateResponse.body.goal.completedAt).toBeTruthy();

    const deleteResponse = await agent.delete(`/api/goals/${goal._id}`).expect(200);
    expect(deleteResponse.body).toMatchObject({
      message: 'Goal deleted',
      id: goal._id,
    });
    expect(await Goal.countDocuments()).toBe(0);
  });

  test('validates bad goal payloads', async () => {
    const agent = await createLoggedInAgent();

    const missingTitleResponse = await agent.post('/api/goals').send({ target: '8%' }).expect(500);
    expect(missingTitleResponse.body.message).toMatch(/goal title is required/i);

    const invalidProgressResponse = await agent
      .post('/api/goals')
      .send({ ...validGoal, progress: 150 })
      .expect(500);
    expect(invalidProgressResponse.body.message).toMatch(/more than maximum/i);
  });

  test('keeps goals scoped to their owner', async () => {
    const firstAgent = await createLoggedInAgent('firstgoal');
    const secondAgent = await createLoggedInAgent('secondgoal');

    const createResponse = await firstAgent.post('/api/goals').send(validGoal).expect(201);
    const goalId = createResponse.body.goal._id;

    const secondListResponse = await secondAgent.get('/api/goals').expect(200);
    expect(secondListResponse.body.goals).toHaveLength(0);

    await secondAgent.put(`/api/goals/${goalId}`).send({ ...validGoal, title: 'Hijacked' }).expect(404);
    await secondAgent.delete(`/api/goals/${goalId}`).expect(404);

    const firstListResponse = await firstAgent.get('/api/goals').expect(200);
    expect(firstListResponse.body.goals).toHaveLength(1);
    expect(firstListResponse.body.goals[0].title).toBe(validGoal.title);
  });
});
