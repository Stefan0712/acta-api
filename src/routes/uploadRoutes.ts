const express = require('express');
import { uploadImage } from '../controllers/uploadController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.post('/', protect, upload.single('image'), uploadImage);

export default router;