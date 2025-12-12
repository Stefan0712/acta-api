const express = require('express');
import { 
  createNote, 
  getNotes, 
  updateNote, 
  deleteNote 
} from '../controllers/noteController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createNote)
  .get(getNotes);

router.route('/:id')
  .put(updateNote)
  .delete(deleteNote);

export default router;