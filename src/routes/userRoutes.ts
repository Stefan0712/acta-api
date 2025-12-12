const express = require('express');
import { updateProfile, searchUsers } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.put('/profile', updateProfile);
router.get('/search', searchUsers);

export default router;