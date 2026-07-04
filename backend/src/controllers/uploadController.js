import { uploadToR2 } from '../utils/uploadToR2.js';

export async function uploadHandHistory(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a hand history file' });
    }

    const key = await uploadToR2(req.file, req.user._id);

    return res.status(201).json({
      message: 'Hand history uploaded successfully',
      key,
    });
  } catch (error) {
    return next(error);
  }
}
