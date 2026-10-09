import mongoose from 'mongoose';

const dateRangeSchema = new mongoose.Schema(
  {
    preset: { type: String, default: 'All Time' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { _id: false },
);

const savedReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [100, 'Report title must be 100 characters or fewer'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Report description must be 300 characters or fewer'],
      default: '',
    },
    reportType: {
      type: String,
      default: 'session-report',
      trim: true,
    },
    dateRange: {
      type: dateRangeSchema,
      default: () => ({}),
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    appliedFilters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sort: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    groupBy: {
      type: String,
      trim: true,
      default: 'None',
    },
    visibleColumnKeys: {
      type: [String],
      default: [],
    },
    rowsPerPage: {
      type: Number,
      min: 1,
      max: 100,
      default: 10,
    },
    metrics: {
      type: [String],
      default: [],
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Report notes must be 1000 characters or fewer'],
      default: '',
    },
  },
  { timestamps: true },
);

export default mongoose.model('SavedReport', savedReportSchema);
