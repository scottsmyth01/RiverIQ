import Session from '../models/Session.js';

export const getSessions = async (req, res) => {
  const sessions = await Session.find({ user: req.user._id });
  if (!sessions) {
    res.status(400).json({ message: 'Sessions not found' });
  }
  res.status(200).json({ sessions });
};
