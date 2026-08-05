import Session from '../models/Session.js';
import { parse888Poker, splitHands as split888PokerHands } from '../utils/parsers/888poker/wrapper.js';
import { parseCoinPoker, splitHands as splitCoinPokerHands } from '../utils/parsers/coinpoker/wrapper.js';
import { parsePartyPoker, splitHands as splitPartyPokerHands } from '../utils/parsers/partypoker/wrapper.js';
import { parsePokerStars, splitHands as splitPokerStarsHands } from '../utils/parsers/pokerstars/wrapper.js';
import { parseFanDuel, splitHands as splitFanDuelHands } from '../utils/parsers/fanduel/wrapper.js';
import { parseGGPoker, splitHands as splitGGPokerHands } from '../utils/parsers/ggpoker/wrapper.js';
import { calculateStats } from '../utils/parsers/stats/calculateStats.js';
import { getHandProfit } from '../utils/parsers/stats/getProfit.js';
import { buildHandHistoryRecords, deleteFromR2 } from '../middleware/uploadToR2Middleware.js';

const FREE_SESSION_LIMIT = 20;
const SESSION_SPLIT_GAP_MINUTES = 60;
const SESSION_CURRENCIES = new Set(['USD', 'CAD', 'GBP', 'JPY', 'CNY']);

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  subscription: user.subscription,
  bankroll: user.bankroll,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  preferences: user.preferences,
  avatarUrl: user.avatarUrl,
  avatarKey: user.avatarKey,
});

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function detectPokerSite(fileText) {
  if (fileText.includes('FanDuel')) return 'fanduel';
  if (fileText.includes('PokerStars')) return 'pokerstars';
  if (fileText.includes('GGPoker')) return 'ggpoker';
  if (fileText.includes('CoinPoker')) return 'coinpoker';
  if (fileText.includes('888poker') || fileText.includes('888.pt Hand History') || fileText.includes('Pacific Poker')) {
    return '888poker';
  }
  if (fileText.includes('partypoker') || fileText.includes('PartyPoker') || fileText.includes('Hand History for Game')) {
    return 'partypoker';
  }
  return null;
}

function sitesMatch(detectedSite, selectedSite) {
  return detectedSite.toLocaleLowerCase() === selectedSite.toLocaleLowerCase();
}

function getSessionDuration(hands) {
  const handDates = hands
    .map((hand) => new Date(hand.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);

  if (handDates.length < 2) return null;

  return Math.max(0, Math.round((handDates.at(-1) - handDates[0]) / 60000));
}

function getSortedHands(hands) {
  return [...hands].sort((a, b) => {
    const aDate = new Date(a.date);
    const bDate = new Date(b.date);

    if (Number.isNaN(aDate.getTime()) || Number.isNaN(bDate.getTime())) {
      return 0;
    }

    return aDate - bDate;
  });
}

function splitHandsIntoSessions(hands, gapMinutes = SESSION_SPLIT_GAP_MINUTES) {
  const sortedHands = getSortedHands(hands);
  const groups = [];

  for (const hand of sortedHands) {
    const handDate = new Date(hand.date);
    const previousGroup = groups.at(-1);
    const previousHand = previousGroup?.at(-1);
    const previousDate = previousHand ? new Date(previousHand.date) : null;
    const gapMs =
      previousDate && !Number.isNaN(previousDate.getTime()) && !Number.isNaN(handDate.getTime())
        ? handDate - previousDate
        : 0;

    if (!previousGroup || gapMs > gapMinutes * 60000) {
      groups.push([hand]);
      continue;
    }

    previousGroup.push(hand);
  }

  return groups.length ? groups : [hands];
}

function parseHandsForSite(site, fileText) {
  const normalizedSite = site.toLocaleLowerCase();

  if (normalizedSite === 'pokerstars') return parsePokerStars(fileText);
  if (normalizedSite === 'fanduel') return parseFanDuel(fileText);
  if (normalizedSite === 'ggpoker') return parseGGPoker(fileText);
  if (normalizedSite === 'coinpoker') return parseCoinPoker(fileText);
  if (normalizedSite === '888poker') return parse888Poker(fileText);
  if (normalizedSite === 'partypoker') return parsePartyPoker(fileText);

  return [];
}

function splitRawHandsForSite(site, fileText) {
  const normalizedSite = site.toLocaleLowerCase();

  if (normalizedSite === 'pokerstars') return splitPokerStarsHands(fileText);
  if (normalizedSite === 'fanduel') return splitFanDuelHands(fileText);
  if (normalizedSite === 'ggpoker') return splitGGPokerHands(fileText);
  if (normalizedSite === 'coinpoker') return splitCoinPokerHands(fileText);
  if (normalizedSite === '888poker') return split888PokerHands(fileText);
  if (normalizedSite === 'partypoker') return splitPartyPokerHands(fileText);

  return [];
}

function getInvalidParsedHandIssues(hands) {
  const issues = hands.flatMap((hand, index) => {
    const handLabel = hand?.handNumber ? `hand #${hand.handNumber}` : `hand ${index + 1}`;
    const handIssues = [];
    const handDate = new Date(hand?.date);
    const profit = getHandProfit(hand);

    if (!hand?.handNumber) handIssues.push(`${handLabel} is missing a hand number`);
    if (!hand?.hero?.name) handIssues.push(`${handLabel} is missing hero`);
    if (!Array.isArray(hand?.hero?.cards) || hand.hero.cards.length !== 2) {
      handIssues.push(`${handLabel} is missing hero hole cards`);
    }
    if (!Array.isArray(hand?.players) || hand.players.length < 2) handIssues.push(`${handLabel} has fewer than 2 players`);
    if (!hand?.buttonSeat) handIssues.push(`${handLabel} is missing the button seat`);
    if (Number.isNaN(handDate.getTime())) handIssues.push(`${handLabel} has an invalid date`);
    if (!Number.isFinite(Number(hand?.table?.smallBlind)) || !Number.isFinite(Number(hand?.table?.bigBlind))) {
      handIssues.push(`${handLabel} is missing blind amounts`);
    }
    if (!Number.isFinite(Number(hand?.table?.maxPlayers))) handIssues.push(`${handLabel} is missing table size`);
    if (!Array.isArray(hand?.preflop?.actions)) handIssues.push(`${handLabel} is missing preflop actions`);
    if (!Array.isArray(hand?.summary?.seats) || !hand.summary.seats.some((seat) => seat.player === hand?.hero?.name)) {
      handIssues.push(`${handLabel} is missing hero summary results`);
    }
    if (!Number.isFinite(profit)) handIssues.push(`${handLabel} has an invalid profit calculation`);

    return handIssues;
  });

  const seenHandNumbers = new Set();
  const duplicateHandNumbers = new Set();
  for (const hand of hands) {
    const handNumber = hand?.handNumber ? String(hand.handNumber) : null;
    if (!handNumber) continue;
    if (seenHandNumbers.has(handNumber)) {
      duplicateHandNumbers.add(handNumber);
    }
    seenHandNumbers.add(handNumber);
  }

  duplicateHandNumbers.forEach((handNumber) => {
    issues.push(`Duplicate hand #${handNumber} was found in this file`);
  });

  return issues;
}

function createParseSafetyError(fileLabel, details = []) {
  const visibleDetails = details.slice(0, 3);
  const error = new Error(
    [
      `We could not safely parse this hand history file${fileLabel}.`,
      visibleDetails.length ? visibleDetails.join(' ') : 'Please upload a valid hand history .txt file.',
    ].join(' '),
  );
  error.statusCode = 400;
  error.code = 'HAND_HISTORY_PARSE_FAILED';
  error.details = details;
  return error;
}

function parseAndValidateHands({ pokerSite, fileText, fileLabel }) {
  const rawHands = splitRawHandsForSite(pokerSite, fileText);

  if (!rawHands.length) {
    throw createParseSafetyError(fileLabel, ['No recognizable hand blocks were found.']);
  }

  let hands;
  try {
    hands = parseHandsForSite(pokerSite, fileText);
  } catch (error) {
    throw createParseSafetyError(fileLabel, [`The parser stopped on unreadable hand text: ${error.message}`]);
  }

  if (!hands?.length) {
    throw createParseSafetyError(fileLabel, ['No hands could be parsed.']);
  }

  if (hands.length !== rawHands.length) {
    throw createParseSafetyError(fileLabel, [
      `Found ${rawHands.length} raw hands, but only ${hands.length} parsed successfully.`,
    ]);
  }

  const issues = getInvalidParsedHandIssues(hands);
  if (issues.length) {
    throw createParseSafetyError(fileLabel, issues);
  }

  const stats = calculateStats(hands);
  if (!Number.isFinite(stats.profit) || stats.handsPlayed !== hands.length) {
    throw createParseSafetyError(fileLabel, ['The parsed stats did not match the parsed hand count.']);
  }

  return hands;
}

async function validateHandsAreNewForUser({ userId, pokerSite, hands }) {
  const uploadHandCounts = new Map();
  hands.forEach((hand) => {
    if (!hand?.handNumber) return;
    const handNumber = String(hand.handNumber);
    uploadHandCounts.set(handNumber, (uploadHandCounts.get(handNumber) || 0) + 1);
  });

  const duplicateUploadHandNumbers = [...uploadHandCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([handNumber]) => handNumber);

  if (duplicateUploadHandNumbers.length) {
    const duplicateList = duplicateUploadHandNumbers.slice(0, 3);
    throw createParseSafetyError('', [
      `This upload includes ${duplicateUploadHandNumbers.length} duplicate hand${duplicateUploadHandNumbers.length === 1 ? '' : 's'} across the selected files.`,
      `Duplicate hand number${duplicateList.length === 1 ? '' : 's'}: ${duplicateList.join(', ')}`,
    ]);
  }

  const handNumbers = [
    ...uploadHandCounts.keys(),
  ];

  if (!handNumbers.length) return;

  const existingSession = await Session.findOne(
    {
      user: userId,
      pokerSite,
      'handResults.handNumber': { $in: handNumbers },
    },
    { 'handResults.handNumber': 1 },
  ).lean();

  if (!existingSession) return;

  const duplicateHandNumbers = new Set(
    existingSession.handResults
      ?.map((handResult) => (handResult?.handNumber ? String(handResult.handNumber) : null))
      .filter((handNumber) => handNumbers.includes(handNumber)),
  );
  const duplicateList = [...duplicateHandNumbers].slice(0, 3);

  throw createParseSafetyError('', [
    `This upload includes ${duplicateHandNumbers.size} hand${duplicateHandNumbers.size === 1 ? '' : 's'} already saved in your sessions.`,
    ...(duplicateList.length ? [`Duplicate hand number${duplicateList.length === 1 ? '' : 's'}: ${duplicateList.join(', ')}`] : []),
  ]);
}

async function cleanupHandHistoryUploads(handHistories = []) {
  if (process.env.NODE_ENV === 'test') return;

  const r2Keys = handHistories
    .map((handHistory) => handHistory?.r2Key)
    .filter(Boolean);

  await Promise.allSettled(
    r2Keys.map((r2Key) => deleteFromR2(r2Key, process.env.R2_BUCKET_NAME_HH)),
  );
}

async function restoreDeletedSession(session) {
  if (!session?._id) return;

  try {
    await Session.create(session.toObject({ depopulate: true }));
  } catch (restoreError) {
    console.error('Failed to restore session after delete rollback:', restoreError);
  }
}

function getSessionName({ sessionName, originalFileName, sessionIndex, totalSessions }) {
  const baseName = sessionName || originalFileName;

  if (totalSessions <= 1) {
    return baseName;
  }

  return `${baseName} - Session ${sessionIndex + 1}`;
}

function buildHandResults(hands) {
  let cumulativeProfit = 0;

  return hands.map((hand) => {
    const profit = getHandProfit(hand);
    cumulativeProfit = Number((cumulativeProfit + profit).toFixed(2));

    return {
      handNumber: hand.handNumber ? String(hand.handNumber) : undefined,
      date: hand.date,
      profit,
      cumulativeProfit,
    };
  });
}

function buildSessionPayload({
  req,
  pokerSite,
  currency,
  sessionName,
  notes,
  tags,
  hands,
  sessionIndex,
  totalSessions,
  file,
  handHistory,
}) {
  const parsedStats = calculateStats(hands);
  const firstHand = hands[0];
  const table = firstHand?.table || {};
  const sessionCurrency = currency || table.currency;

  return {
    user: req.user._id,
    sessionName: getSessionName({
      sessionName,
      originalFileName: file.originalname,
      sessionIndex,
      totalSessions,
    }),
    date: firstHand?.date || new Date(),
    pokerSite,
    gameType: formatGameType(table.game),
    stakes: formatStakes(table, sessionCurrency),
    currency: sessionCurrency,
    tableSize: table.maxPlayers,
    duration: getSessionDuration(hands),
    notes,
    tags: normalizeTags(tags),
    handHistory: handHistory || {
      originalFileName: file.originalname,
      fileSize: file.size,
      contentType: file.mimetype,
      uploadedAt: new Date(),
    },
    handResults: buildHandResults(hands),
    stats: parsedStats,
  };
}

function formatGameType(gameType) {
  if (!gameType) return undefined;

  const normalizedGameType = String(gameType).trim();

  if (/^NLH$/i.test(normalizedGameType)) {
    return 'NL Holdem';
  }

  if (/hold'?em no limit/i.test(normalizedGameType)) {
    return 'NL Holdem';
  }

  return normalizedGameType;
}

function getCurrencySymbol(currency) {
  const symbols = {
    USD: '$',
    CAD: 'C$',
    GBP: '£',
    JPY: '¥',
    CNY: 'CN¥',
    USDT: '₮',
  };

  return symbols[currency] || currency || '';
}

function formatBlindAmount(amount) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return null;
  if (numericAmount < 1) return numericAmount.toFixed(2);
  if (Number.isInteger(numericAmount)) return String(numericAmount);

  return numericAmount.toFixed(2).replace(/0$/, '');
}

function formatStakes(table = {}, currency) {
  const smallBlind = formatBlindAmount(table.smallBlind);
  const bigBlind = formatBlindAmount(table.bigBlind);
  const ante = formatBlindAmount(table.ante);

  if (!smallBlind || !bigBlind) return undefined;

  const currencySymbol = getCurrencySymbol(currency || table.currency);

  const stakes = `${currencySymbol}${smallBlind}/${currencySymbol}${bigBlind}`;

  return ante ? `${stakes} (${currencySymbol}${ante})` : stakes;
}

export const enforceFreeSessionLimit = async (req, res, next) => {
  try {
    if (req.user.subscription === 'pro') {
      return next();
    }

    const sessionCount = await Session.countDocuments({ user: req.user._id });

    if (sessionCount >= FREE_SESSION_LIMIT) {
      return res.status(403).json({
        message: `Free accounts can upload up to ${FREE_SESSION_LIMIT} sessions. Upgrade to Pro to add more sessions.`,
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export const getSessions = async (req, res) => {
  const { period } = req.query;

  const periodDays = {
    'past-7': 7,
    'past-30': 30,
    'past-90': 90,
  };

  const sessions = await Session.find({ user: req.user._id }).sort({ date: -1, createdAt: -1 });

  if (!sessions) {
    res.status(400).json({ message: 'Sessions not found' });
  }

  if (periodDays[period]) {
    const sessionsWithValidDates = sessions
      .map((session) => ({
        session,
        sessionDate: new Date(session.date),
      }))
      .filter(({ sessionDate }) => !Number.isNaN(sessionDate.getTime()));

    const rangeEndDate = new Date();
    const cutoffDate = new Date(rangeEndDate);
    cutoffDate.setDate(cutoffDate.getDate() - periodDays[period]);

    const filteredSessions = sessionsWithValidDates
      .filter(({ sessionDate }) => sessionDate >= cutoffDate && sessionDate <= rangeEndDate)
      .map(({ session }) => session);

    return res.status(200).json({ sessions: filteredSessions });
  }

  res.status(200).json({ sessions });
};

export const addSession = async (req, res, next) => {
  try {
    const { pokerSite, notes, tags } = req.body;
    const currency = typeof req.body.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD';
    const sessionName = typeof req.body.sessionName === 'string' ? req.body.sessionName.trim() : '';
    if (!pokerSite) {
      return res.status(400).json({
        message: 'Please select a poker site',
      });
    }

    if (!SESSION_CURRENCIES.has(currency)) {
      return res.status(400).json({
        message: 'Please select a supported session currency',
      });
    }

    const files = req.files?.length ? req.files : req.file ? [req.file] : [];

    if (!files.length) {
      return res.status(400).json({
        message: 'Please upload a hand history file',
      });
    }
    const uploadGroups = files.map((file, fileIndex) => {
      const fileText = file.buffer.toString('utf8');
      const fileLabel = files.length > 1 ? ` ${file.originalname}` : '';

      if (!fileText.trim()) {
        const error = new Error(`The uploaded file${fileLabel} is empty`);
        error.statusCode = 400;
        throw error;
      }

      const detectedSite = detectPokerSite(fileText);
      if (!detectedSite) {
        const error = new Error(`We could not detect a supported poker site from this file${fileLabel}.`);
        error.statusCode = 400;
        throw error;
      }

      if (!sitesMatch(detectedSite, pokerSite)) {
        const error = new Error(`This file${fileLabel} looks like ${detectedSite}, but you selected ${pokerSite}.`);
        error.statusCode = 400;
        throw error;
      }

      const hands = parseAndValidateHands({ pokerSite, fileText, fileLabel });

      return splitHandsIntoSessions(hands).map((handGroup) => ({
        file,
        fileIndex,
        hands: handGroup,
      }));
    });
    const handGroups = uploadGroups.flat();
    await validateHandsAreNewForUser({
      userId: req.user._id,
      pokerSite,
      hands: handGroups.flatMap((handGroup) => handGroup.hands),
    });

    if (req.user.subscription !== 'pro') {
      const sessionCount = await Session.countDocuments({ user: req.user._id });

      if (sessionCount + handGroups.length > FREE_SESSION_LIMIT) {
        return res.status(403).json({
          message: `This upload would create ${handGroups.length} sessions and exceed the free limit of ${FREE_SESSION_LIMIT}. Upgrade to Pro to add more sessions.`,
        });
      }
    }

    const handHistories = await buildHandHistoryRecords(files, req.user._id);
    let sessions = [];
    try {
      const sessionPayloads = handGroups.map(({ file, fileIndex, hands }, sessionIndex) =>
        buildSessionPayload({
          req,
          pokerSite,
          currency,
          sessionName,
          notes,
          tags,
          hands,
          sessionIndex,
          totalSessions: handGroups.length,
          file,
          handHistory: handHistories[fileIndex],
        }),
      );
      sessions = await Session.create(sessionPayloads);
      const sessionProfit = sessions.reduce((total, session) => total + (Number(session.stats?.profit) || 0), 0);

      req.user.bankroll = Number(((Number(req.user.bankroll) || 0) + sessionProfit).toFixed(2));
      await req.user.save();
    } catch (error) {
      if (sessions.length) {
        await Session.deleteMany({ _id: { $in: sessions.map((session) => session._id) } });
      }
      await cleanupHandHistoryUploads(handHistories);
      throw error;
    }

    return res.status(201).json({
      status: 'success',
      session: sessions[0],
      sessions,
      createdSessions: sessions.length,
      user: serializeUser(req.user),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const sessionName =
      typeof req.body.sessionName === 'string' && req.body.sessionName.trim() ? req.body.sessionName.trim() : undefined;
    const session = await Session.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        ...(sessionName ? { sessionName } : {}),
        notes: req.body.notes || '',
        tags: normalizeTags(req.body.tags),
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    return res.status(200).json({ session });
  } catch (error) {
    return next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  let deletedSession = null;

  try {
    deletedSession = await Session.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedSession) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const sessionProfit = Number(deletedSession.stats?.profit) || 0;
    req.user.bankroll = Number(((Number(req.user.bankroll) || 0) - sessionProfit).toFixed(2));
    await req.user.save();

    if (process.env.NODE_ENV !== 'test' && deletedSession.handHistory?.r2Key) {
      const remainingReferences = await Session.countDocuments({
        user: req.user._id,
        'handHistory.r2Key': deletedSession.handHistory.r2Key,
      });

      if (remainingReferences === 0) {
        deleteFromR2(deletedSession.handHistory.r2Key, process.env.R2_BUCKET_NAME_HH).catch((error) => {
          console.error('Failed to delete hand history from R2:', error);
        });
      }
    }

    return res.status(200).json({ message: 'Session deleted', id: req.params.id, user: serializeUser(req.user) });
  } catch (error) {
    await restoreDeletedSession(deletedSession);
    return next(error);
  }
};
