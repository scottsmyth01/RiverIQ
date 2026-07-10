import Session from '../models/Session.js';
// import { parseHandHistory } from '../utils/pokerstarsParser.js';

export const getSessions = async (req, res) => {
  const sessions = await Session.find({ user: req.user._id });
  if (!sessions) {
    res.status(400).json({ message: 'Sessions not found' });
  }
  res.status(200).json({ sessions });
};

export const parseHandHistoryStats = (req, res) => {};

export const addSession = async (req, res) => {};
