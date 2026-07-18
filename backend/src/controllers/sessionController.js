import Session from '../models/Session.js';
import { parsePokerStars } from '../utils/parsers/pokerstars/wrapper.js';
import { parseGGPoker } from '../utils/parsers/ggpoker/wrapper.js';
import { calculateStats } from '../utils/parsers/stats/calculateStats.js';

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

/*
Protect middleware
--> Checks JWT cookie
--> Adds req.user

upload.single('handHistory')
--> Reads the uploaded file into memory
--> Adds req.file

addSession
--> Validates file/form data
--> Uploads to Cloudflare R2
--> Parses text
--> Calculates stats
--> Saves session
*/

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

export const addSession = async (req, res, next) => {
  console.log('inside add session handler');
  try {
    const { pokerSite, notes, tags } = req.body;

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

    if (detectedSite !== pokerSite) {
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
    if (pokerSite === 'pokerstars') {
      hands = parsePokerStars(fileText);
    }
    if (pokerSite === 'ggpoker') {
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
      sessionName: req.file.originalname,
      date: firstHand?.date || new Date(),
      pokerSite,
      gameType: table.game,
      stakes:
        table.smallBlind && table.bigBlind
          ? `${table.currency || ''}${table.smallBlind}/${table.currency || ''}${table.bigBlind}`
          : undefined,
      currency: table.currency,
      tableSize: table.maxPlayers,
      duration: getSessionDuration(hands),
      notes,
      handHistory: req.handHistory || {
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        contentType: req.file.mimetype,
        uploadedAt: new Date(),
      },
      stats: parsedStats,
    });

    return res.status(201).json({ session });
  } catch (error) {
    return next(error);
  }
};
