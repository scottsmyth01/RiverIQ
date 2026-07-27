import Session from '../models/Session.js';
import { parse888Poker } from '../utils/parsers/888poker/wrapper.js';
import { parseBovada } from '../utils/parsers/bovada/wrapper.js';
import { parseCoinPoker } from '../utils/parsers/coinpoker/wrapper.js';
import { parsePartyPoker } from '../utils/parsers/partypoker/wrapper.js';
import { parsePokerStars } from '../utils/parsers/pokerstars/wrapper.js';
import { parseGGPoker } from '../utils/parsers/ggpoker/wrapper.js';
import { calculateStats } from '../utils/parsers/stats/calculateStats.js';

const FREE_SESSION_LIMIT = 20;
const SESSION_SPLIT_GAP_MINUTES = 60;

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
  if (fileText.includes('PokerStars')) return 'pokerstars';
  if (fileText.includes('GGPoker')) return 'ggpoker';
  if (fileText.includes('CoinPoker')) return 'coinpoker';
  if (fileText.includes('Bovada Hand #') || fileText.includes('Ignition Hand #') || fileText.includes('Bodog Hand #')) {
    return 'bovada';
  }
  if (fileText.includes('888poker') || fileText.includes('888.pt Hand History') || fileText.includes('Pacific Poker')) {
    return '888poker';
  }
  if (fileText.includes('partypoker') || fileText.includes('PartyPoker') || fileText.includes('Hand History for Game')) {
    return 'partypoker';
  }
  return null;
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

function getSessionName({ sessionName, originalFileName, sessionIndex, totalSessions }) {
  const baseName = sessionName || originalFileName;

  if (totalSessions <= 1) {
    return baseName;
  }

  return `${baseName} - Session ${sessionIndex + 1}`;
}

function buildSessionPayload({ req, pokerSite, sessionName, notes, tags, hands, sessionIndex, totalSessions }) {
  const parsedStats = calculateStats(hands);
  const firstHand = hands[0];
  const table = firstHand?.table || {};

  return {
    user: req.user._id,
    sessionName: getSessionName({
      sessionName,
      originalFileName: req.file.originalname,
      sessionIndex,
      totalSessions,
    }),
    date: firstHand?.date || new Date(),
    pokerSite,
    gameType: formatGameType(table.game),
    stakes: formatStakes(table),
    currency: table.currency,
    tableSize: table.maxPlayers,
    duration: getSessionDuration(hands),
    notes,
    tags: normalizeTags(tags),
    handHistory: req.handHistory || {
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      contentType: req.file.mimetype,
      uploadedAt: new Date(),
    },
    stats: parsedStats,
  };
}

function formatGameType(gameType) {
  if (!gameType) return undefined;

  const normalizedGameType = String(gameType).trim();

  if (/hold'?em no limit/i.test(normalizedGameType)) {
    return 'NL Holdem';
  }

  return normalizedGameType;
}

function getCurrencySymbol(currency) {
  const symbols = {
    USD: '$',
    CAD: 'C$',
    EUR: '€',
    GBP: '£',
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

function formatStakes(table = {}) {
  const smallBlind = formatBlindAmount(table.smallBlind);
  const bigBlind = formatBlindAmount(table.bigBlind);

  if (!smallBlind || !bigBlind) return undefined;

  const currencySymbol = getCurrencySymbol(table.currency);

  return `${currencySymbol}${smallBlind}/${currencySymbol}${bigBlind}`;
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
    const sessionName = typeof req.body.sessionName === 'string' ? req.body.sessionName.trim() : '';
    if (!pokerSite) {
      return res.status(400).json({
        message: 'Please select a poker site',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Please upload a hand history file',
      });
    }
    const fileText = req.file.buffer.toString('utf8');

    const detectedSite = detectPokerSite(fileText);
    if (!detectedSite) {
      return res.status(400).json({
        message: 'We could not detect a supported poker site from this file.',
      });
    }
    if (detectedSite.toLocaleLowerCase() !== pokerSite.toLocaleLowerCase()) {
      return res.status(400).json({
        message: `This file looks like ${detectedSite}, but you selected ${pokerSite}.`,
      });
    }
    if (!fileText.trim()) {
      return res.status(400).json({
        message: 'The uploaded file is empty',
      });
    }
    let hands;
    if (detectedSite.toLocaleLowerCase() === 'pokerstars') {
      hands = parsePokerStars(fileText);
    }
    if (detectedSite.toLocaleLowerCase() === 'ggpoker') {
      hands = parseGGPoker(fileText);
    }
    if (detectedSite.toLocaleLowerCase() === 'coinpoker') {
      hands = parseCoinPoker(fileText);
    }
    if (detectedSite.toLocaleLowerCase() === 'bovada') {
      hands = parseBovada(fileText);
    }
    if (detectedSite.toLocaleLowerCase() === '888poker') {
      hands = parse888Poker(fileText);
    }
    if (detectedSite.toLocaleLowerCase() === 'partypoker') {
      hands = parsePartyPoker(fileText);
    }
    if (!hands?.length) {
      return res.status(400).json({
        message: 'No hands could be parsed from this file',
      });
    }

    const handGroups = splitHandsIntoSessions(hands);

    if (req.user.subscription !== 'pro') {
      const sessionCount = await Session.countDocuments({ user: req.user._id });

      if (sessionCount + handGroups.length > FREE_SESSION_LIMIT) {
        return res.status(403).json({
          message: `This upload would create ${handGroups.length} sessions and exceed the free limit of ${FREE_SESSION_LIMIT}. Upgrade to Pro to add more sessions.`,
        });
      }
    }

    const sessionPayloads = handGroups.map((handGroup, sessionIndex) =>
      buildSessionPayload({
        req,
        pokerSite,
        sessionName,
        notes,
        tags,
        hands: handGroup,
        sessionIndex,
        totalSessions: handGroups.length,
      }),
    );
    const sessions = await Session.create(sessionPayloads);
    const sessionProfit = sessions.reduce((total, session) => total + (Number(session.stats?.profit) || 0), 0);

    req.user.bankroll = Number(((Number(req.user.bankroll) || 0) + sessionProfit).toFixed(2));
    await req.user.save();

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
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const sessionProfit = Number(session.stats?.profit) || 0;
    req.user.bankroll = Number(((Number(req.user.bankroll) || 0) - sessionProfit).toFixed(2));
    await req.user.save();

    return res.status(200).json({ message: 'Session deleted', id: req.params.id, user: serializeUser(req.user) });
  } catch (error) {
    return next(error);
  }
};
