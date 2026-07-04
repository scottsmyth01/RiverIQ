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
    notes: String,

    handHistory: {
      originalFileName: String,
      r2Key: String,
      fileSize: Number,
      contentType: String,
      uploadedAt: Date,
    },

    stats: {
      hands: { type: Number, default: 0 },
      profit: { type: Number, default: 0 },
      bb100: { type: Number, default: 0 },
      vpip: { type: Number, default: 0 },
      pfr: { type: Number, default: 0 },
      threeBet: { type: Number, default: 0 },
      foldToThreeBet: { type: Number, default: 0 },
      cBetFlop: { type: Number, default: 0 },
      foldToCBetFlop: { type: Number, default: 0 },
      wentToShowdown: { type: Number, default: 0 },
      wonAtShowdown: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);
