import SavedReport from '../models/SavedReport.js';

function getSavedReportPayload(body = {}) {
  return {
    title: body.title,
    description: body.description,
    reportType: body.reportType,
    dateRange: body.dateRange,
    filters: body.filters,
    appliedFilters: body.appliedFilters,
    sort: body.sort,
    visibleColumnKeys: body.visibleColumnKeys,
    rowsPerPage: body.rowsPerPage,
    metrics: body.metrics,
    summary: body.summary,
    notes: body.notes,
  };
}

export const getSavedReports = async (req, res, next) => {
  try {
    const savedReports = await SavedReport.find({ user: req.user._id }).sort({ updatedAt: -1 });

    return res.status(200).json({ savedReports });
  } catch (error) {
    return next(error);
  }
};

export const createSavedReport = async (req, res, next) => {
  try {
    const savedReport = await SavedReport.create({
      ...getSavedReportPayload(req.body),
      user: req.user._id,
    });

    return res.status(201).json({ savedReport });
  } catch (error) {
    return next(error);
  }
};

export const updateSavedReport = async (req, res, next) => {
  try {
    const savedReport = await SavedReport.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      getSavedReportPayload(req.body),
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    if (!savedReport) {
      return res.status(404).json({ message: 'Saved report not found' });
    }

    return res.status(200).json({ savedReport });
  } catch (error) {
    return next(error);
  }
};

export const deleteSavedReport = async (req, res, next) => {
  try {
    const savedReport = await SavedReport.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!savedReport) {
      return res.status(404).json({ message: 'Saved report not found' });
    }

    return res.status(200).json({ message: 'Saved report deleted', id: req.params.id });
  } catch (error) {
    return next(error);
  }
};
