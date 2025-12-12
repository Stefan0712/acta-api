const express = require('express');
import { 
  getGroupActivity, 
  deleteActivity 
} from '../controllers/activityController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/:groupId', getGroupActivity);
router.delete('/:id', deleteActivity);

export default router;