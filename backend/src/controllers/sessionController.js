import Session from '../models/Session.js';
import { parsePokerStars } from '../utils/parsers/pokerstars/wrapper.js';
import { parseGGPoker } from '../utils/parsers/ggpoker/wrapper.js';
import { calculateStats } from '../utils/parsers/stats/calculateStats.js';

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
    if (!hands?.length) {
      return res.status(400).json({
        message: 'No hands could be parsed from this file',
      });
    }
    const parsedStats = calculateStats(hands);
    const firstHand = hands[0];
    const table = firstHand?.table || {};
    const session = await Session.create({
      user: req.user._id,
      sessionName: sessionName || req.file.originalname,
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
    });

    return res.status(201).json({ status: 'success', session });
  } catch (error) {
    return next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const session = await Session.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
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

    return res.status(200).json({ message: 'Session deleted', id: req.params.id });
  } catch (error) {
    return next(error);
  }
};
