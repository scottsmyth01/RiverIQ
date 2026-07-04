import Session from '../models/Session.js';
import { parseHandHistory } from '../utils/pokerstarsParser.js';

export const getSessions = async (req, res) => {
  const sessions = await Session.find({ user: req.user._id });
  if (!sessions) {
    res.status(400).json({ message: 'Sessions not found' });
  }
  res.status(200).json({ sessions });
};

export const parseHandHistoryStats = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Please upload a hand history file',
      });
    }
    const fileText = req.file.buffer.toString('utf-8');

    const stats = parseHandHistory(fileText, {
      pokerSite: req.body.pokerSite,
      gameType: req.body.gameType,
      stakes: req.body.stakes,
      currency: req.body.currency,
    });
    req.parsedStats = stats;
    next();
  } catch (error) {
    next(error);
  }
};

export const addSession = async (req, res) => {
  try {
    const { sessionName, date, pokerSite, gameType, stakes, currency, buyIn, notes } = req.body;
    const session = await Session.create({
      user: req.user._id,
      sessionName,
      date,
      pokerSite,
      gameType,
      stakes,
      currency,
      buyIn,
      notes,
      handHistory: req.handHistory,
      stats: req.parsedStats,
    });
    res.status(201).json({
      message: 'Session created successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
};
