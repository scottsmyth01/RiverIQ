import mongoose from 'mongoose';

const statFields = {
  handsPlayed: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  bb100: { type: Number, default: 0 },
  vpip: { type: Number, default: 0 },
  pfr: { type: Number, default: 0 },
  threeBet: { type: Number, default: 0 },
  foldToThreeBet: { type: Number, default: 0 },
  fourBet: { type: Number, default: 0 },
  foldToFourBet: { type: Number, default: 0 },
  steal: { type: Number, default: 0 },
  foldToSteal: { type: Number, default: 0 },
  cBet: { type: Number, default: 0 },
  foldToCBet: { type: Number, default: 0 },
  turnCBet: { type: Number, default: 0 },
  foldToTurnCBet: { type: Number, default: 0 },
  wtsd: { type: Number, default: 0 },
  wsd: { type: Number, default: 0 },
  aggressionFactor: { type: Number, default: 0 },
};

const positionStatsSchema = new mongoose.Schema(statFields, { _id: false });
const threeBetVsOpenCellSchema = new mongoose.Schema(
  {
    opportunities: { type: Number, default: 0 },
    threeBets: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
  },
  { _id: false },
);
const handChartCellSchema = new mongoose.Schema(
  {
    dealt: { type: Number, default: 0 },
    played: { type: Number, default: 0 },
    called: { type: Number, default: 0 },
    limped: { type: Number, default: 0 },
    openRaised: { type: Number, default: 0 },
    raised: { type: Number, default: 0 },
    folded: { type: Number, default: 0 },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    sessionName: String,
    date: Date,
    pokerSite: String,
    gameType: String,
    stakes: String,
    currency: String,
    buyIn: Number,
    tableSize: Number,
    duration: { type: Number, default: null },
    notes: String,
    tags: {
      type: [String],
      default: [],
    },

    handHistory: {
      originalFileName: String,
      r2Key: String,
      fileSize: Number,
      contentType: String,
      uploadedAt: Date,
    },

    stats: {
      ...statFields,
      byPosition: {
        type: Map,
        of: positionStatsSchema,
        default: {},
      },
      handsByPosition: {
        type: Map,
        of: {
          type: Map,
          of: handChartCellSchema,
        },
        default: {},
      },
      threeBetVsOpen: {
        type: Map,
        of: {
          type: Map,
          of: threeBetVsOpenCellSchema,
        },
        default: {},
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model('Session', sessionSchema);
