import { describe, expect, test } from '@jest/globals';
import '../../test/setupDb.js';
import Goal from '../../models/Goal.js';
import Session from '../../models/Session.js';
import User from '../../models/User.js';
import { syncAiGoalForUser } from '../aiGoalService.js';

async function createUser(prefix = 'ai-goal') {
  return User.create({
    username: `${prefix}hero`.slice(0, 20),
    email: `${prefix}@riveriq.test`,
    password: 'Password123',
  });
}

function sessionPayload(userId, stats) {
  return {
    user: userId,
    sessionName: 'AI Goal Test Session',
    date: new Date('2026-08-09T00:00:00.000Z'),
    pokerSite: 'pokerstars',
    stats: {
      handsPlayed: 200,
      vpip: 40,
      pfr: 12,
      threeBet: 5,
      foldToThreeBet: 62,
      cBet: 72,
      foldToCBet: 40,
      turnCBet: 55,
      foldToTurnCBet: 45,
      wtsd: 28,
      wsd: 55,
      aggressionFactor: 2,
      ...stats,
    },
  };
}

describe('AI goal service', () => {
  test('creates the most pertinent AI goal from uploaded session stats', async () => {
    const user = await createUser('firstai');
    await Session.create(sessionPayload(user._id, { vpip: 40, pfr: 18 }));

    const goal = await syncAiGoalForUser(user._id);

    expect(goal).toMatchObject({
      source: 'ai',
      status: 'Active',
      category: 'Preflop',
      target: '22-28%',
      current: '40%',
    });
    expect(goal.title).toMatch(/lower overall vpip/i);
    expect(goal.ai).toMatchObject({
      metric: 'vpip',
      position: 'Overall',
      direction: 'decrease',
      baseline: 40,
      targetMin: 22,
      targetMax: 28,
      sampleSize: 200,
    });
  });

  test('creates an AI goal from a small upload sample', async () => {
    const user = await createUser('smallai');
    await Session.create(sessionPayload(user._id, { handsPlayed: 8, vpip: 60, pfr: 10 }));

    const goal = await syncAiGoalForUser(user._id);

    expect(goal).toMatchObject({
      source: 'ai',
      status: 'Active',
      current: '60%',
    });
    expect(goal.ai).toMatchObject({
      metric: 'vpip',
      sampleSize: 8,
    });
  });

  test('prioritizes the foundation ladder before scoring other leaks', async () => {
    const pfrUser = await createUser('ladderpfr');
    await Session.create(
      sessionPayload(pfrUser._id, {
        vpip: 25,
        pfr: 10,
        threeBet: 2,
        foldToThreeBet: 95,
      }),
    );

    const firstGoal = await syncAiGoalForUser(pfrUser._id);

    expect(firstGoal.ai).toMatchObject({
      metric: 'pfr',
      direction: 'increase',
    });

    const threeBetUser = await createUser('ladder3bet');
    await Session.create(
      sessionPayload(threeBetUser._id, {
        vpip: 25,
        pfr: 20,
        threeBet: 2,
        foldToThreeBet: 95,
      }),
    );

    const secondGoal = await syncAiGoalForUser(threeBetUser._id);

    expect(secondGoal.ai).toMatchObject({
      metric: 'threeBet',
      direction: 'increase',
    });

    const cBetUser = await createUser('laddercbet');
    await Session.create(
      sessionPayload(cBetUser._id, {
        vpip: 25,
        pfr: 20,
        threeBet: 8,
        cBet: 40,
        foldToThreeBet: 95,
      }),
    );

    const thirdGoal = await syncAiGoalForUser(cBetUser._id);

    expect(thirdGoal.ai).toMatchObject({
      metric: 'cBet',
      direction: 'increase',
    });
  });

  test('does not create another AI goal while the current AI goal is still active', async () => {
    const user = await createUser('activeai');
    await Session.create(sessionPayload(user._id, { vpip: 40, pfr: 18 }));

    await syncAiGoalForUser(user._id);
    await Session.create(sessionPayload(user._id, { vpip: 42, pfr: 18 }));
    await syncAiGoalForUser(user._id);

    const goals = await Goal.find({ user: user._id, source: 'ai' }).lean();
    expect(goals).toHaveLength(1);
    expect(goals[0]).toMatchObject({
      status: 'Active',
      current: '41%',
      progress: 0,
    });
  });

  test('completes the active AI goal before creating the next one', async () => {
    const user = await createUser('metai');
    await Goal.create({
      user: user._id,
      title: 'Lower overall VPIP',
      description: 'Existing AI goal',
      category: 'Preflop',
      target: '22-28%',
      current: '40%',
      progress: 0,
      status: 'Active',
      source: 'ai',
      ai: {
        metric: 'vpip',
        position: 'Overall',
        direction: 'decrease',
        baseline: 40,
        targetMin: 22,
        targetMax: 28,
        sampleSize: 200,
        generatedAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    });
    await Session.create(sessionPayload(user._id, { vpip: 26, pfr: 10 }));

    await syncAiGoalForUser(user._id);

    const goals = await Goal.find({ user: user._id, source: 'ai' }).sort({ createdAt: 1 }).lean();
    expect(goals).toHaveLength(2);
    expect(goals[0]).toMatchObject({
      status: 'Completed',
      current: '26%',
      progress: 100,
    });
    expect(goals[0].completedAt).toBeTruthy();
    expect(goals[1]).toMatchObject({
      status: 'Active',
    });
    expect(goals[1].ai).toMatchObject({
      metric: 'pfr',
      direction: 'increase',
    });
  });
});
