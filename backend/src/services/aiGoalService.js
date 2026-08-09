import Goal from '../models/Goal.js';
import Session from '../models/Session.js';

const MIN_OVERALL_HANDS = 1;
const MIN_POSITION_HANDS = 30;
const foundationMetricOrder = ['vpip', 'pfr', 'threeBet', 'cBet'];

const goalRanges = {
  Overall: {
    vpip: [22, 28],
    pfr: [18, 24],
    threeBet: [7, 10],
    foldToThreeBet: [50, 60],
    fourBet: [4, 7],
    foldToFourBet: [45, 60],
    steal: [40, 50],
    cBet: [65, 75],
    foldToCBet: [35, 45],
    turnCBet: [45, 60],
    foldToTurnCBet: [40, 50],
    aggressionFactor: [1.5, 2.5],
    wtsd: [25, 30],
    wsd: [50, 60],
  },
  UTG: {
    vpip: [14, 18],
    pfr: [12, 16],
    threeBet: [4, 7],
    foldToThreeBet: [54, 64],
    cBet: [62, 72],
    foldToCBet: [40, 52],
    turnCBet: [42, 55],
    foldToTurnCBet: [42, 54],
  },
  'UTG+1': {
    vpip: [15, 19],
    pfr: [13, 17],
    threeBet: [4, 7],
    foldToThreeBet: [53, 63],
    cBet: [62, 72],
    foldToCBet: [39, 50],
    turnCBet: [42, 56],
    foldToTurnCBet: [41, 53],
  },
  'UTG+2': {
    vpip: [16, 21],
    pfr: [14, 18],
    threeBet: [5, 8],
    foldToThreeBet: [52, 62],
    cBet: [63, 73],
    foldToCBet: [38, 49],
    turnCBet: [43, 57],
    foldToTurnCBet: [40, 52],
  },
  LJ: {
    vpip: [18, 23],
    pfr: [16, 20],
    threeBet: [5, 8],
    foldToThreeBet: [51, 61],
    cBet: [64, 74],
    foldToCBet: [37, 48],
    turnCBet: [44, 58],
    foldToTurnCBet: [39, 51],
  },
  HJ: {
    vpip: [20, 25],
    pfr: [17, 22],
    threeBet: [6, 9],
    foldToThreeBet: [50, 60],
    cBet: [65, 75],
    foldToCBet: [36, 47],
    turnCBet: [45, 59],
    foldToTurnCBet: [38, 50],
  },
  CO: {
    vpip: [25, 32],
    pfr: [21, 28],
    threeBet: [7, 11],
    foldToThreeBet: [48, 58],
    steal: [32, 42],
    cBet: [67, 77],
    foldToCBet: [34, 44],
    turnCBet: [46, 60],
    foldToTurnCBet: [37, 49],
  },
  BTN: {
    vpip: [38, 48],
    pfr: [32, 42],
    threeBet: [8, 12],
    foldToThreeBet: [46, 56],
    steal: [45, 58],
    cBet: [68, 80],
    foldToCBet: [30, 42],
    turnCBet: [48, 62],
    foldToTurnCBet: [35, 47],
  },
  SB: {
    vpip: [28, 36],
    pfr: [22, 30],
    threeBet: [8, 12],
    foldToThreeBet: [48, 58],
    steal: [36, 48],
    cBet: [58, 70],
    foldToCBet: [40, 52],
    turnCBet: [42, 56],
    foldToTurnCBet: [42, 54],
  },
  BB: {
    vpip: [18, 26],
    pfr: [7, 12],
    threeBet: [5, 9],
    foldToThreeBet: [50, 62],
    cBet: [55, 68],
    foldToCBet: [43, 56],
    turnCBet: [38, 52],
    foldToTurnCBet: [43, 56],
  },
};

const metricLabels = {
  vpip: 'VPIP',
  pfr: 'PFR',
  threeBet: '3Bet',
  foldToThreeBet: 'fold to 3Bet',
  fourBet: '4Bet',
  foldToFourBet: 'fold to 4Bet',
  steal: 'steal',
  cBet: 'flop CBet',
  foldToCBet: 'fold to flop CBet',
  turnCBet: 'turn barrel',
  foldToTurnCBet: 'fold to turn barrel',
  aggressionFactor: 'aggression factor',
  wtsd: 'WTSD',
  wsd: 'W$SD',
};

const metricCategories = {
  vpip: 'Preflop',
  pfr: 'Preflop',
  threeBet: 'Preflop',
  foldToThreeBet: 'Preflop',
  fourBet: 'Preflop',
  foldToFourBet: 'Preflop',
  steal: 'Preflop',
  cBet: 'Postflop',
  foldToCBet: 'Postflop',
  turnCBet: 'Postflop',
  foldToTurnCBet: 'Postflop',
  aggressionFactor: 'Postflop',
  wtsd: 'Postflop',
  wsd: 'Results',
};

const priorityByMetric = {
  vpip: 1.2,
  pfr: 1.2,
  threeBet: 1.15,
  foldToThreeBet: 1.1,
  steal: 1.05,
  cBet: 1,
  foldToCBet: 1,
  turnCBet: 0.95,
  foldToTurnCBet: 0.95,
  aggressionFactor: 0.9,
  wtsd: 0.85,
  wsd: 0.8,
  fourBet: 0.75,
  foldToFourBet: 0.75,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatValue(metric, value) {
  if (!isFiniteNumber(value)) return '';
  return metric === 'aggressionFactor' ? String(round(value, 2)) : `${round(value)}%`;
}

function formatRange(metric, min, max) {
  return metric === 'aggressionFactor' ? `${min}-${max}` : `${min}-${max}%`;
}

function getPositionStats(stats, position) {
  const byPosition = stats?.byPosition;
  if (!byPosition) return null;
  if (byPosition instanceof Map) return byPosition.get(position);
  return byPosition[position];
}

function weightedAverage(items, metric) {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const item of items) {
    const handsPlayed = Number(item?.handsPlayed) || 0;
    const value = Number(item?.[metric]);

    if (!handsPlayed || !Number.isFinite(value) || value === 0) continue;

    weightedTotal += value * handsPlayed;
    weightTotal += handsPlayed;
  }

  return weightTotal ? round(weightedTotal / weightTotal, metric === 'aggressionFactor' ? 2 : 1) : null;
}

function aggregateProfiles(sessions) {
  const totalHands = sessions.reduce((total, session) => total + (Number(session.stats?.handsPlayed) || 0), 0);
  const profiles = [
    {
      position: 'Overall',
      handsPlayed: totalHands,
      stats: Object.fromEntries(
        Object.keys(goalRanges.Overall).map((metric) => [metric, weightedAverage(sessions.map((session) => session.stats), metric)]),
      ),
    },
  ];

  for (const position of Object.keys(goalRanges).filter((rangePosition) => rangePosition !== 'Overall')) {
    const positionStats = sessions
      .map((session) => getPositionStats(session.stats, position))
      .filter(Boolean);
    const handsPlayed = positionStats.reduce((total, stats) => total + (Number(stats?.handsPlayed) || 0), 0);

    if (handsPlayed < MIN_POSITION_HANDS) continue;

    profiles.push({
      position,
      handsPlayed,
      stats: Object.fromEntries(
        Object.keys(goalRanges[position]).map((metric) => [metric, weightedAverage(positionStats, metric)]),
      ),
    });
  }

  return profiles;
}

function getGoalProgress({ baseline, current, direction, target }) {
  if (!isFiniteNumber(baseline) || !isFiniteNumber(current) || !isFiniteNumber(target)) return 0;
  if (direction === 'increase') {
    if (current >= target) return 100;
    if (baseline >= target) return 100;
    return clamp(Math.round(((current - baseline) / (target - baseline)) * 100), 0, 99);
  }

  if (current <= target) return 100;
  if (baseline <= target) return 100;
  return clamp(Math.round(((baseline - current) / (baseline - target)) * 100), 0, 99);
}

function evaluateCandidate(profile, metric, [min, max]) {
  const value = profile.stats[metric];

  if (!isFiniteNumber(value) || value === 0) return null;
  if (value >= min && value <= max) return null;

  const direction = value < min ? 'increase' : 'decrease';
  const target = direction === 'increase' ? min : max;
  const rangeWidth = Math.max(max - min, metric === 'aggressionFactor' ? 0.5 : 5);
  const distance = Math.abs(value - target);
  const sampleWeight = clamp(profile.handsPlayed / 500, 0.35, 1.5);
  const score = (distance / rangeWidth) * sampleWeight * (priorityByMetric[metric] || 1);

  return {
    metric,
    position: profile.position,
    direction,
    value,
    targetMin: min,
    targetMax: max,
    target,
    sampleSize: profile.handsPlayed,
    score,
  };
}

function findBestCandidate(profiles, previousGoal) {
  const previousMetric = previousGoal?.ai?.metric;
  const previousPosition = previousGoal?.ai?.position;
  const candidates = profiles.flatMap((profile) =>
    Object.entries(goalRanges[profile.position] || {})
      .map(([metric, range]) => evaluateCandidate(profile, metric, range))
      .filter(Boolean),
  );

  const freshCandidates = candidates.filter(
    (candidate) => candidate.metric !== previousMetric || candidate.position !== previousPosition,
  );
  const pool = freshCandidates.length ? freshCandidates : candidates;
  const foundationCandidate = foundationMetricOrder
    .map((metric) => pool.find((candidate) => candidate.position === 'Overall' && candidate.metric === metric))
    .find(Boolean);

  if (foundationCandidate) return foundationCandidate;

  return pool.sort((a, b) => b.score - a.score)[0] || null;
}

function buildGoalPayload(candidate, order) {
  const label = metricLabels[candidate.metric] || candidate.metric;
  const positionLabel = candidate.position === 'Overall' ? 'overall' : `from ${candidate.position}`;
  const action = candidate.direction === 'increase' ? 'Raise' : 'Lower';
  const target = formatRange(candidate.metric, candidate.targetMin, candidate.targetMax);
  const current = formatValue(candidate.metric, candidate.value);
  const title = `${action} ${positionLabel} ${label}`.replace(' overall', ' overall');

  return {
    title,
    description: `AI Coach picked this as the clearest leak from your uploaded hands. Keep ${label} ${positionLabel} inside ${target} before moving to the next goal.`,
    category: metricCategories[candidate.metric] || 'Study',
    target,
    current,
    progress: 0,
    status: 'Active',
    dueDate: new Date(Date.now() + 30 * 86400000),
    order,
    source: 'ai',
    ai: {
      metric: candidate.metric,
      position: candidate.position,
      direction: candidate.direction,
      targetMin: candidate.targetMin,
      targetMax: candidate.targetMax,
      baseline: candidate.value,
      sampleSize: candidate.sampleSize,
      generatedAt: new Date(),
    },
  };
}

function updateGoalFromProfiles(goal, profiles) {
  const metric = goal.ai?.metric;
  const position = goal.ai?.position || 'Overall';
  const profile = profiles.find((item) => item.position === position);
  const value = profile?.stats?.[metric];
  const targetMin = Number(goal.ai?.targetMin);
  const targetMax = Number(goal.ai?.targetMax);

  if (!profile || !isFiniteNumber(value) || !Number.isFinite(targetMin) || !Number.isFinite(targetMax)) {
    return { met: false, update: {} };
  }

  const direction = goal.ai?.direction || (value < targetMin ? 'increase' : 'decrease');
  const target = direction === 'increase' ? targetMin : targetMax;
  const progress = getGoalProgress({
    baseline: Number(goal.ai?.baseline),
    current: value,
    direction,
    target,
  });
  const met = value >= targetMin && value <= targetMax;

  return {
    met,
    update: {
      current: formatValue(metric, value),
      progress: met ? 100 : progress,
      status: met ? 'Completed' : goal.status,
      completedAt: met ? new Date() : null,
      'ai.sampleSize': profile.handsPlayed,
    },
  };
}

export async function syncAiGoalForUser(userId) {
  const activeAiGoal = await Goal.findOne({
    user: userId,
    source: 'ai',
    status: { $ne: 'Completed' },
  }).sort({ createdAt: -1 });
  const sessions = await Session.find({ user: userId }, { stats: 1 }).lean();

  if (!sessions.length) return null;

  const profiles = aggregateProfiles(sessions);
  const overallProfile = profiles.find((profile) => profile.position === 'Overall');

  if (!overallProfile || overallProfile.handsPlayed < MIN_OVERALL_HANDS) return null;

  if (activeAiGoal) {
    const { met, update } = updateGoalFromProfiles(activeAiGoal, profiles);

    if (!met) {
      if (Object.keys(update).length) {
        await activeAiGoal.updateOne({ $set: update });
      }
      return null;
    }

    await activeAiGoal.updateOne({ $set: update });
  }

  const candidate = findBestCandidate(profiles, activeAiGoal);
  if (!candidate) return null;

  const goalCount = await Goal.countDocuments({ user: userId });
  return Goal.create({
    user: userId,
    ...buildGoalPayload(candidate, goalCount),
  });
}
