import 'dotenv/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import { parsePokerStars } from '../utils/parsers/pokerstars/wrapper.js';
import { parseGGPoker } from '../utils/parsers/ggpoker/wrapper.js';
import { getHandsByPosition } from '../utils/parsers/stats/getHandsByPosition.js';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function streamToString(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function getHandHistoryText(r2Key) {
  const response = await r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
    }),
  );

  return streamToString(response.Body);
}

function parseHands(session, fileText) {
  const pokerSite = session.pokerSite?.toLowerCase() || '';

  if (pokerSite.includes('pokerstars')) return parsePokerStars(fileText);
  if (pokerSite.includes('ggpoker')) return parseGGPoker(fileText);

  if (fileText.includes('PokerStars')) return parsePokerStars(fileText);
  if (fileText.includes('GGPoker')) return parseGGPoker(fileText);

  return [];
}

async function backfillHandsByPosition() {
  await mongoose.connect(process.env.MONGO_URI);

  const sessions = await Session.find({
    'handHistory.r2Key': { $exists: true, $ne: '' },
  });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const session of sessions) {
    try {
      const fileText = await getHandHistoryText(session.handHistory.r2Key);
      const hands = parseHands(session, fileText);
      const handsByPosition = getHandsByPosition(hands);

      session.stats.handsByPosition = handsByPosition;
      await session.save();

      updatedCount++;
      console.log(`Updated ${session.sessionName || session._id}: ${Object.keys(handsByPosition).length} positions`);
    } catch (error) {
      skippedCount++;
      console.log(`Skipped ${session.sessionName || session._id}: ${error.message}`);
    }
  }

  console.log(`Done. Updated ${updatedCount}, skipped ${skippedCount}.`);
  await mongoose.disconnect();
}

backfillHandsByPosition().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
