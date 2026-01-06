import express from 'express';
import { 
  createPoll, 
  getGroupPolls, 
  getPollById, 
  votePoll, 
  addPollOption, 
  deletePoll, 
  updatePoll,
  endPoll
} from '../controllers/pollController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/vote', votePoll);
router.post('/option', addPollOption);
router.get('/group/:groupId', getGroupPolls);

router.post('/', createPoll);
router.patch('/:id/end', endPoll);

router.get('/:id', getPollById);  
router.patch('/:id', updatePoll); 
router.delete('/:id', deletePoll);

export default router;