import express from 'express';
const router = express.Router();
import protect from '../middleware/authMiddleware.js';
import { addSession, getSessions } from '../controllers/sessionController.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadHandHistoryToR2 } from '../middleware/uploadToR2Middleware.js';

router.get('/', protect, getSessions);
router.post('/addSession', protect, upload.single('handHistory'), uploadHandHistoryToR2, addSession);

export default router;

/*
upload.single()
Its job is to:
1. Look for a file in the incoming request.
2. Read that file.
3. Attach it to req.file.
4. Call the next function (uploadHandHistory).
*/
