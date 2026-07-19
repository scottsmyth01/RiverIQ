import express from 'express';
import {
  createSavedReport,
  deleteSavedReport,
  getSavedReports,
  updateSavedReport,
} from '../controllers/savedReportController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getSavedReports).post(protect, createSavedReport);
router.route('/:id').put(protect, updateSavedReport).delete(protect, deleteSavedReport);

export default router;
