import { describe, expect, test } from '@jest/globals';
import request from 'supertest';
import '../../test/setupDb.js';
import app from '../../app.js';
import Session from '../../models/Session.js';

const user = {
  username: 'sessionhero',
  email: 'session@riveriq.test',
  password: 'Password123',
  passwordConfirm: 'Password123',
};

async function createLoggedInAgent() {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(user).expect(201);
  return agent;
}

describe('session API integration', () => {
  test('protects session routes from logged-out users', async () => {
    await request(app).get('/api/sessions').expect(401);
    await request(app).post('/api/sessions/add-session').expect(401);
  });

  test('validates upload requirements', async () => {
    const agent = await createLoggedInAgent();

    const missingFileResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .expect(400);
    expect(missingFileResponse.body.message).toMatch(/upload a hand history file/i);

    const missingSiteResponse = await agent
      .post('/api/sessions/add-session')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt')
      .expect(400);
    expect(missingSiteResponse.body.message).toMatch(/select a poker site/i);
  });

  test('uploads a PokerStars session, calculates stats, updates bankroll, edits, lists, and deletes it', async () => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'API Integration PokerStars')
      .field('notes', 'Uploaded from integration test')
      .field('tags', 'api,integration')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt')
      .expect(201);

    const { session, user: updatedUser } = uploadResponse.body;
    expect(session.sessionName).toBe('API Integration PokerStars');
    expect(session.stats.handsPlayed).toBe(250);
    expect(session.stats.profit).toBe(262.5);
    expect(session.stats.foldToSteal).toEqual(expect.any(Number));
    expect(session.stats.handsByPosition).toBeTruthy();
    expect(session.stats.handsByPosition.BTN).toBeTruthy();
    expect(session.stats.handsByPosition.BB).toBeTruthy();
    expect(session.stats.handsByPosition.BTN.KK).toMatchObject({
      dealt: expect.any(Number),
      played: expect.any(Number),
      openRaised: expect.any(Number),
    });
    expect(session.stats.threeBetVsOpen).toBeTruthy();
    expect(session.stats.byPosition).toBeTruthy();
    expect(session.stats.byPosition.BTN).toMatchObject({
      handsPlayed: expect.any(Number),
      profit: expect.any(Number),
      vpip: expect.any(Number),
    });
    expect(session.handHistory.r2Key).toContain('test-hand-histories');
    expect(updatedUser.bankroll).toBe(262.5);

    const listResponse = await agent.get('/api/sessions').expect(200);
    expect(listResponse.body.sessions).toHaveLength(1);
    expect(listResponse.body.sessions[0]._id).toBe(session._id);

    const editResponse = await agent
      .put(`/api/sessions/${session._id}`)
      .send({ sessionName: 'Edited Integration Session', notes: 'Updated notes', tags: ['edited', 'test'] })
      .expect(200);

    expect(editResponse.body.session).toMatchObject({
      sessionName: 'Edited Integration Session',
      notes: 'Updated notes',
      tags: ['edited', 'test'],
    });

    const deleteResponse = await agent.delete(`/api/sessions/${session._id}`).expect(200);
    expect(deleteResponse.body).toMatchObject({
      id: session._id,
    });
    expect(deleteResponse.body.user.bankroll).toBe(0);
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects a file when selected poker site does not match detected site', async () => {
    const agent = await createLoggedInAgent();

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'ggpoker')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt')
      .expect(400);

    expect(response.body.message).toMatch(/looks like pokerstars/i);
  });
});
