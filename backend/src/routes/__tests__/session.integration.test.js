import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
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

  test('uploads a CoinPoker session and calculates stats', async () => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'coinpoker')
      .field('sessionName', 'API Integration CoinPoker')
      .attach('handHistory', 'src/utils/parsers/fixtures/coinpoker/coinpoker_single_hand.txt')
      .expect(201);

    const { session } = uploadResponse.body;
    expect(session.sessionName).toBe('API Integration CoinPoker');
    expect(session.pokerSite).toBe('coinpoker');
    expect(session.gameType).toBe('NLH');
    expect(session.stakes).toBe('₮0.10/₮0.25');
    expect(session.currency).toBe('USDT');
    expect(session.tableSize).toBe(6);
    expect(session.stats.handsPlayed).toBe(1);
    expect(session.stats.profit).toBe(-29.06);
  });

  test('uploads a Bovada session and calculates stats', async () => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'bovada')
      .field('sessionName', 'API Integration Bovada')
      .attach('handHistory', 'src/utils/parsers/fixtures/bovada/bovada_single_hand.txt')
      .expect(201);

    const { session } = uploadResponse.body;
    expect(session.sessionName).toBe('API Integration Bovada');
    expect(session.pokerSite).toBe('bovada');
    expect(session.gameType).toBe('NL Holdem');
    expect(session.stakes).toBe('10/20');
    expect(session.tableSize).toBe(9);
    expect(session.stats.handsPlayed).toBe(1);
    expect(session.stats.profit).toBe(0);
  });

  test('automatically splits a multi-session upload by time gaps', async () => {
    const agent = await createLoggedInAgent();
    const firstHand = readFileSync('src/utils/parsers/fixtures/coinpoker/coinpoker_single_hand.txt', 'utf8');
    const secondHand = firstHand
      .replaceAll('91559100065', '91559100066')
      .replaceAll('2026/07/17 19:49:00 -04', '2026/07/17 22:10:00 -04')
      .replaceAll('2026/07/17 19:50:41 -04', '2026/07/17 22:11:41 -04');
    const multiSessionFile = Buffer.from(`${firstHand}\n\n${secondHand}`);

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'coinpoker')
      .field('sessionName', 'CoinPoker Export')
      .attach('handHistory', multiSessionFile, 'coinpoker_multi_session.txt')
      .expect(201);

    const { sessions, user: updatedUser } = uploadResponse.body;

    expect(uploadResponse.body.createdSessions).toBe(2);
    expect(sessions).toHaveLength(2);
    expect(sessions.map((session) => session.sessionName)).toEqual([
      'CoinPoker Export - Session 1',
      'CoinPoker Export - Session 2',
    ]);
    expect(sessions.map((session) => session.stats.handsPlayed)).toEqual([1, 1]);
    expect(sessions.map((session) => session.stats.profit)).toEqual([-29.06, -29.06]);
    expect(updatedUser.bankroll).toBe(-58.12);
    expect(await Session.countDocuments()).toBe(2);
  });
});
