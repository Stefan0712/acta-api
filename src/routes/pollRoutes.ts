const express = require('express');
import { 
  createPoll, 
  getPolls, 
  vote, 
  deletePoll 
} from '../controllers/pollController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createPoll)
  .get(getPolls);

router.delete('/:id', deletePoll);
router.post('/:id/vote', vote);

export default router;