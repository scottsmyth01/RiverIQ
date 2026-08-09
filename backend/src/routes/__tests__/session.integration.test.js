import { describe, expect, jest, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import request from 'supertest';
import '../../test/setupDb.js';
import app from '../../app.js';
import Session from '../../models/Session.js';
import User from '../../models/User.js';

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

function buildPokerStarsSessionLimitFile(sessionCount) {
  const baseHand = readFileSync('src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt', 'utf8')
    .split(/\n\n/)
    .at(0);

  return Buffer.from(
    Array.from({ length: sessionCount }, (_, index) => {
      const handNumber = String(991000001 + index);
      const totalHours = index * 2;
      const day = String(4 + Math.floor(totalHours / 24)).padStart(2, '0');
      const hour = String(totalHours % 24).padStart(2, '0');

      return baseHand
        .replace('PokerStars Hand #990000001:', `PokerStars Hand #${handNumber}:`)
        .replace('2026/08/04 12:00:00', `2026/08/${day} ${hour}:00:00`);
    }).join('\n\n'),
  );
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

  test('rejects non-txt hand history uploads on the backend', async () => {
    const agent = await createLoggedInAgent();
    const csvFile = Buffer.from('not,a,hand,history');

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', csvFile, 'not_a_hand_history.csv')
      .expect(400);

    expect(response.body.message).toMatch(/hand history \.txt file/i);
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects txt files that are not detectable hand histories', async () => {
    const agent = await createLoggedInAgent();
    const randomTextFile = Buffer.from('This is a plain text note, not a poker hand history.');

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', randomTextFile, 'not_a_hand_history.txt')
      .expect(400);

    expect(response.body.message).toMatch(/could not detect a supported poker site/i);
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects empty hand history txt files', async () => {
    const agent = await createLoggedInAgent();
    const emptyTextFile = Buffer.from('   \n\t  ');

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', emptyTextFile, 'empty_hand_history.txt')
      .expect(400);

    expect(response.body.message).toMatch(/uploaded file is empty/i);
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects hand history txt files larger than 50 MB', async () => {
    const agent = await createLoggedInAgent();
    const oversizedTextFile = Buffer.alloc((50 * 1024 * 1024) + 1, 'a');

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', oversizedTextFile, 'oversized_hand_history.txt')
      .expect(400);

    expect(response.body.message).toMatch(/uploaded file is too large/i);
    expect(response.body.code).toBe('LIMIT_FILE_SIZE');
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects uploads with more than 25 hand history files', async () => {
    const agent = await createLoggedInAgent();
    const firstHand = readFileSync('src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt', 'utf8')
      .split(/\n\n/)
      .at(0);
    let uploadRequest = agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars');

    for (let index = 0; index < 26; index += 1) {
      uploadRequest = uploadRequest.attach('handHistory', Buffer.from(firstHand), `hand_${index + 1}.txt`);
    }

    const response = await uploadRequest.expect(400);

    expect(response.body.message).toMatch(/no more than 25 hand history files/i);
    expect(response.body.code).toBe('LIMIT_UNEXPECTED_FILE');
    expect(await Session.countDocuments()).toBe(0);
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
    expect(session.stakes).toBe('$0.05/$0.10');
    expect(session.stats.handsPlayed).toBe(250);
    expect(session.stats.profit).toBe(262.5);
    expect(session.handResults).toHaveLength(250);
    expect(session.handResults.at(-1).cumulativeProfit).toBe(262.5);
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

  test('purges all sessions for the logged-in user and updates bankroll', async () => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Purge Integration')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_losing_session_02.txt')
      .expect(201);

    expect(uploadResponse.body.createdSessions).toBe(2);
    expect(uploadResponse.body.user.bankroll).toBe(50);
    expect(await Session.countDocuments()).toBe(2);

    const purgeResponse = await agent.delete('/api/sessions').expect(200);

    expect(purgeResponse.body).toMatchObject({
      message: 'Sessions purged',
      deletedCount: 2,
    });
    expect(purgeResponse.body.user.bankroll).toBe(0);
    expect(await Session.countDocuments()).toBe(0);
  });

  test('sanitizes hand history storage keys while preserving the original file name', async () => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt', {
        filename: 'Poker Stars Session Aug 4.TXT',
      })
      .expect(201);

    const { session } = uploadResponse.body;

    expect(session.handHistory.originalFileName).toBe('Poker Stars Session Aug 4.TXT');
    expect(session.handHistory.r2Key).toMatch(/\/\d+-[0-9a-f-]+-poker-stars-session-aug-4\.txt$/);
  });

  test('creates unique hand history storage keys for repeated original file names', async () => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Duplicate Filename Batch')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt', {
        filename: 'PokerStars Export.txt',
      })
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_losing_session_02.txt', {
        filename: 'PokerStars Export.txt',
      })
      .expect(201);

    const r2Keys = uploadResponse.body.sessions.map((session) => session.handHistory.r2Key);

    expect(uploadResponse.body.createdSessions).toBe(2);
    expect(r2Keys).toHaveLength(2);
    expect(new Set(r2Keys).size).toBe(2);
    expect(r2Keys.every((key) => /\/\d+-[0-9a-f-]+-pokerstars-export\.txt$/.test(key))).toBe(true);
  });

  test.each([
    {
      detectedSite: 'pokerstars',
      selectedSite: 'ggpoker',
      fixturePath: 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt',
    },
    {
      detectedSite: 'ggpoker',
      selectedSite: 'pokerstars',
      fixturePath: 'src/utils/parsers/fixtures/gg/ggpoker_edge_cases_01.txt',
    },
    {
      detectedSite: 'fanduel',
      selectedSite: 'pokerstars',
      fixturePath: 'src/utils/parsers/fixtures/fanduel/fanduel_edge_cases_01.txt',
    },
    {
      detectedSite: 'coinpoker',
      selectedSite: 'pokerstars',
      fixturePath: 'src/utils/parsers/fixtures/coinpoker/coinpoker_edge_cases_01.txt',
    },
    {
      detectedSite: '888poker',
      selectedSite: 'pokerstars',
      fixturePath: 'src/utils/parsers/fixtures/888/888poker_edge_cases_01.txt',
    },
    {
      detectedSite: 'partypoker',
      selectedSite: 'pokerstars',
      fixturePath: 'src/utils/parsers/fixtures/partypoker/partypoker_edge_cases_01.txt',
    },
  ])('rejects a $detectedSite file when $selectedSite is selected', async ({ detectedSite, selectedSite, fixturePath }) => {
    const agent = await createLoggedInAgent();

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', selectedSite)
      .attach('handHistory', fixturePath)
      .expect(400);

    expect(response.body.message).toMatch(new RegExp(`looks like ${detectedSite}`, 'i'));
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects a multi-file upload atomically when one file does not match the selected site', async () => {
    const agent = await createLoggedInAgent();

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt')
      .attach('handHistory', 'src/utils/parsers/fixtures/gg/ggpoker_edge_cases_01.txt')
      .expect(400);

    expect(response.body.message).toMatch(/looks like ggpoker/i);
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects a multi-file upload atomically when one file is malformed', async () => {
    const agent = await createLoggedInAgent();
    const malformedPokerStarsHand = Buffer.from(`PokerStars Hand #999000003: Hold'em No Limit ($0.05/$0.10 USD) - 2026/08/04 12:10:00
Table 'Broken Batch Import' 6-max Seat #1 is the button
Seat 1: Hero ($10.00 in chips)
Seat 2: Villain ($10.00 in chips)
Hero: posts small blind $0.05
Villain: posts big blind $0.10
*** HOLE CARDS ***
Hero: raises $0.30
Villain: folds
*** SUMMARY ***
Total pot $0.20 | Rake $0.00
Seat 1: Hero collected ($0.20)
Seat 2: Villain folded before Flop
`);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt')
      .attach('handHistory', malformedPokerStarsHand, 'malformed_batch_pokerstars.txt')
      .expect(400);

    expect(response.body.message).toMatch(/could not safely parse/i);
    expect(response.body.code).toBe('HAND_HISTORY_PARSE_FAILED');
    expect(response.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/hero hole cards/i)]));
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects a malformed hand history before creating a session', async () => {
    const agent = await createLoggedInAgent();
    const malformedPokerStarsHand = Buffer.from(`PokerStars Hand #999000001: Hold'em No Limit ($0.05/$0.10 USD) - 2026/08/04 12:00:00
Table 'Broken Import' 6-max Seat #1 is the button
Seat 1: Hero ($10.00 in chips)
Seat 2: Villain ($10.00 in chips)
Hero: posts small blind $0.05
Villain: posts big blind $0.10
*** HOLE CARDS ***
Hero: raises $0.30
Villain: folds
*** SUMMARY ***
Total pot $0.20 | Rake $0.00
Seat 1: Hero collected ($0.20)
Seat 2: Villain folded before Flop
`);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', malformedPokerStarsHand, 'malformed_pokerstars.txt')
      .expect(400);

    expect(response.body.message).toMatch(/could not safely parse/i);
    expect(response.body.message).toMatch(/hero hole cards/i);
    expect(response.body.code).toBe('HAND_HISTORY_PARSE_FAILED');
    expect(response.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/hero hole cards/i)]));
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects partial parses when one raw hand block is unreadable', async () => {
    const agent = await createLoggedInAgent();
    const validHand = readFileSync('src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt', 'utf8')
      .split(/\n\n/)
      .at(0);
    const unreadableHand = `PokerStars Hand #999000002: Hold'em No Limit ($0.05/$0.10 USD) - 2026/08/04 12:05:00
This line keeps the hand block detectable but not parseable.
*** SUMMARY ***
`;
    const mixedFile = Buffer.from(`${validHand}\n\n${unreadableHand}`);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', mixedFile, 'partial_pokerstars.txt')
      .expect(400);

    expect(response.body.message).toMatch(/could not safely parse/i);
    expect(response.body.code).toBe('HAND_HISTORY_PARSE_FAILED');
    expect(response.body.details).toEqual(expect.any(Array));
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects duplicate hand numbers before creating a session', async () => {
    const agent = await createLoggedInAgent();
    const duplicatedHand = readFileSync('src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt', 'utf8')
      .split(/\n\n/)
      .at(0);
    const duplicateFile = Buffer.from(`${duplicatedHand}\n\n${duplicatedHand}`);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', duplicateFile, 'duplicate_hands.txt')
      .expect(400);

    expect(response.body.message).toMatch(/could not safely parse/i);
    expect(response.body.code).toBe('HAND_HISTORY_PARSE_FAILED');
    expect(response.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/duplicate hand #990000001/i)]));
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects duplicate hand numbers across files in the same upload', async () => {
    const agent = await createLoggedInAgent();
    const duplicatedHand = readFileSync('src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt', 'utf8')
      .split(/\n\n/)
      .at(0);
    const duplicateFile = Buffer.from(duplicatedHand);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', duplicateFile, 'duplicate_hands_1.txt')
      .attach('handHistory', duplicateFile, 'duplicate_hands_2.txt')
      .expect(400);

    expect(response.body.message).toMatch(/could not safely parse/i);
    expect(response.body.code).toBe('HAND_HISTORY_PARSE_FAILED');
    expect(response.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/across the selected files/i)]));
    expect(response.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/990000001/i)]));
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects hands already uploaded in previous sessions for the same user and site', async () => {
    const agent = await createLoggedInAgent();
    const fixturePath = 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt';

    await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'First import')
      .attach('handHistory', fixturePath)
      .expect(201);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Duplicate import')
      .attach('handHistory', fixturePath)
      .expect(400);

    expect(response.body.message).toMatch(/could not safely parse/i);
    expect(response.body.code).toBe('HAND_HISTORY_PARSE_FAILED');
    expect(response.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/already saved/i)]));
    expect(response.body.details).toEqual(expect.arrayContaining([expect.stringMatching(/990000001/i)]));
    expect(await Session.countDocuments()).toBe(1);
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
    expect(session.gameType).toBe('NL Holdem');
    expect(session.stakes).toBe('₮0.10/₮0.25 (₮0.04)');
    expect(session.currency).toBe('USDT');
    expect(session.tableSize).toBe(6);
    expect(session.stats.handsPlayed).toBe(1);
    expect(session.stats.profit).toBe(-29.06);
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

  test.each([
    {
      site: 'pokerstars',
      fixturePath: 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt',
      fileName: 'pokerstars_edge_cases_01.txt',
      handsPlayed: 8,
      profit: 11.25,
    },
    {
      site: 'ggpoker',
      fixturePath: 'src/utils/parsers/fixtures/gg/ggpoker_edge_cases_01.txt',
      fileName: 'ggpoker_edge_cases_01.txt',
      handsPlayed: 8,
      profit: 11.25,
    },
    {
      site: 'fanduel',
      fixturePath: 'src/utils/parsers/fixtures/fanduel/fanduel_edge_cases_01.txt',
      fileName: 'fanduel_edge_cases_01.txt',
      handsPlayed: 8,
      profit: 11.25,
    },
    {
      site: 'coinpoker',
      fixturePath: 'src/utils/parsers/fixtures/coinpoker/coinpoker_edge_cases_01.txt',
      fileName: 'coinpoker_edge_cases_01.txt',
      handsPlayed: 5,
      profit: 12.83,
    },
    {
      site: '888poker',
      fixturePath: 'src/utils/parsers/fixtures/888/888poker_edge_cases_01.txt',
      fileName: '888poker_edge_cases_01.txt',
      handsPlayed: 5,
      profit: 10.75,
    },
    {
      site: 'partypoker',
      fixturePath: 'src/utils/parsers/fixtures/partypoker/partypoker_edge_cases_01.txt',
      fileName: 'partypoker_edge_cases_01.txt',
      handsPlayed: 5,
      profit: 10.75,
    },
  ])('uploads and validates $site edge-case fixture', async ({ site, fixturePath, fileName, handsPlayed, profit }) => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', site)
      .field('sessionName', `${site} edge fixture`)
      .attach('handHistory', fixturePath)
      .expect(201);

    const { session, user: updatedUser } = uploadResponse.body;

    expect(uploadResponse.body.createdSessions).toBe(1);
    expect(session.pokerSite).toBe(site);
    expect(session.handHistory.originalFileName).toBe(fileName);
    expect(session.stats.handsPlayed).toBe(handsPlayed);
    expect(session.stats.profit).toBe(profit);
    expect(session.handResults).toHaveLength(handsPlayed);
    expect(session.handResults.at(-1).cumulativeProfit).toBe(profit);
    expect(updatedUser.bankroll).toBe(profit);
    expect(await Session.countDocuments()).toBe(1);
  });

  test('uploads hand history txt files with a UTF-8 BOM and Windows line endings', async () => {
    const agent = await createLoggedInAgent();
    const fixtureText = readFileSync('src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt', 'utf8');
    const windowsTextFile = Buffer.from(`\uFEFF${fixtureText.replace(/\n/g, '\r\n')}`);

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Windows Export')
      .attach('handHistory', windowsTextFile, 'windows_export.txt')
      .expect(201);

    const { session } = uploadResponse.body;

    expect(session.stats.handsPlayed).toBe(8);
    expect(session.stats.profit).toBe(11.25);
    expect(session.handResults).toHaveLength(8);
    expect(await Session.countDocuments()).toBe(1);
  });

  test('rejects a free-user upload that would create more than the session limit', async () => {
    const agent = await createLoggedInAgent();
    const sessionLimitFile = buildPokerStarsSessionLimitFile(21);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Too Many Sessions')
      .attach('handHistory', sessionLimitFile, 'too_many_sessions.txt')
      .expect(403);

    expect(response.body.message).toMatch(/exceed the free limit of 20/i);
    expect(await Session.countDocuments()).toBe(0);
  });

  test('rejects a free-user upload when existing sessions plus new sessions exceed the limit', async () => {
    const agent = await createLoggedInAgent();
    const savedUser = await User.findOne({ email: user.email });
    const seededSessions = Array.from({ length: 19 }, (_, index) => ({
      user: savedUser._id,
      sessionName: `Existing Session ${index + 1}`,
      date: new Date(`2026-08-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`),
      pokerSite: 'pokerstars',
      stats: { handsPlayed: 1, profit: 0 },
      handResults: [{ handNumber: `seed-${index + 1}`, date: new Date(), profit: 0, cumulativeProfit: 0 }],
    }));
    await Session.insertMany(seededSessions);

    const response = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Two Too Many')
      .attach('handHistory', buildPokerStarsSessionLimitFile(2), 'two_too_many.txt')
      .expect(403);

    expect(response.body.message).toMatch(/would create 2 sessions and exceed the free limit of 20/i);
    expect(await Session.countDocuments()).toBe(19);
  });

  test('allows a pro-user upload that creates more than the free session limit', async () => {
    const agent = await createLoggedInAgent();
    await User.updateOne({ email: user.email }, { subscription: 'pro' });

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Pro Session Batch')
      .attach('handHistory', buildPokerStarsSessionLimitFile(21), 'pro_session_batch.txt')
      .expect(201);

    expect(uploadResponse.body.createdSessions).toBe(21);
    expect(uploadResponse.body.sessions).toHaveLength(21);
    expect(uploadResponse.body.user.subscription).toBe('pro');
    expect(await Session.countDocuments()).toBe(21);
  });

  test('uploads multiple hand history files in one request', async () => {
    const agent = await createLoggedInAgent();

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'PokerStars Batch')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_losing_session_02.txt')
      .expect(201);

    const { sessions, user: updatedUser } = uploadResponse.body;

    expect(uploadResponse.body.createdSessions).toBe(2);
    expect(sessions).toHaveLength(2);
    expect(sessions.map((session) => session.sessionName)).toEqual([
      'PokerStars Batch - Session 1',
      'PokerStars Batch - Session 2',
    ]);
    expect(sessions.map((session) => session.stats.handsPlayed)).toEqual([250, 250]);
    expect(sessions.map((session) => session.handHistory.originalFileName)).toEqual([
      'pokerstars_250_hand_winning_session_01.txt',
      'pokerstars_250_hand_losing_session_02.txt',
    ]);
    expect(updatedUser.bankroll).toBe(50);
    expect(await Session.countDocuments()).toBe(2);
  });

  test('uses today and session number as the default session name', async () => {
    const agent = await createLoggedInAgent();
    const today = new Date().toISOString().slice(0, 10);

    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_winning_session_01.txt')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_250_hand_losing_session_02.txt')
      .expect(201);

    expect(uploadResponse.body.sessions.map((session) => session.sessionName)).toEqual([
      `${today}: session 1`,
      `${today}: session 2`,
    ]);
  });

  test('rolls back created sessions when the user bankroll update fails after upload', async () => {
    const agent = await createLoggedInAgent();
    const saveSpy = jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Simulated bankroll save failure'));

    try {
      const response = await agent
        .post('/api/sessions/add-session')
        .field('pokerSite', 'pokerstars')
        .field('sessionName', 'Rollback Session')
        .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt')
        .expect(500);

      expect(response.body.message).toMatch(/simulated bankroll save failure/i);
      expect(await Session.countDocuments()).toBe(0);
    } finally {
      saveSpy.mockRestore();
    }
  });

  test('does not create sessions when the session write fails after upload metadata is built', async () => {
    const agent = await createLoggedInAgent();
    const createSpy = jest.spyOn(Session, 'create').mockRejectedValueOnce(new Error('Simulated session write failure'));

    try {
      const response = await agent
        .post('/api/sessions/add-session')
        .field('pokerSite', 'pokerstars')
        .field('sessionName', 'Failed Session Create')
        .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt')
        .expect(500);

      expect(response.body.message).toMatch(/simulated session write failure/i);
      expect(await Session.countDocuments()).toBe(0);
    } finally {
      createSpy.mockRestore();
    }
  });

  test('restores a deleted session when the delete bankroll update fails', async () => {
    const agent = await createLoggedInAgent();
    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Delete Rollback Session')
      .attach('handHistory', 'src/utils/parsers/fixtures/ps/pokerstars_edge_cases_01.txt')
      .expect(201);
    const sessionId = uploadResponse.body.session._id;
    const saveSpy = jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(new Error('Simulated delete bankroll failure'));

    try {
      const response = await agent.delete(`/api/sessions/${sessionId}`).expect(500);

      expect(response.body.message).toMatch(/simulated delete bankroll failure/i);
      expect(await Session.countDocuments()).toBe(1);
      expect(await Session.exists({ _id: sessionId })).toBeTruthy();
    } finally {
      saveSpy.mockRestore();
    }
  });

  test('keeps remaining split-file sessions when one session from the same hand history is deleted', async () => {
    const agent = await createLoggedInAgent();
    const uploadResponse = await agent
      .post('/api/sessions/add-session')
      .field('pokerSite', 'pokerstars')
      .field('sessionName', 'Shared File Sessions')
      .attach('handHistory', buildPokerStarsSessionLimitFile(2), 'shared_file_sessions.txt')
      .expect(201);
    const [deletedSession, remainingSession] = uploadResponse.body.sessions;

    expect(deletedSession.handHistory.r2Key).toBe(remainingSession.handHistory.r2Key);

    await agent.delete(`/api/sessions/${deletedSession._id}`).expect(200);

    const savedRemainingSession = await Session.findById(remainingSession._id).lean();
    expect(await Session.countDocuments()).toBe(1);
    expect(savedRemainingSession.handHistory.r2Key).toBe(remainingSession.handHistory.r2Key);
  });
});
