const express = require('express');
import { getSyncData } from '../controllers/syncController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', protect, getSyncData);


export default router;