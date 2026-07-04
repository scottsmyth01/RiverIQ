import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { getSessions } from '../controllers/sessionController.js';
import { uploadHandHistory } from '../controllers/uploadController.js';
import { upload } from '../middleware/uploadMiddleware.js';

router.get('/', protect, getSessions);
router.post('/upload', protect, upload.single('handHistory'), uploadHandHistory);

export default router;

/*
upload.single()

Its job is to:
1. Look for a file in the incoming request.
2. Read that file.
3. Attach it to req.file.
4. Call the next function (uploadHandHistory).
*/
