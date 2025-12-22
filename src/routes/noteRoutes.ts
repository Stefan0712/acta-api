const express = require('express');
import { 
  createNote, 
  getNotes, 
  updateNote, 
  deleteNote, 
  addComment,
  deleteComment,
  getNoteComments
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

router.route('/:noteId/comment')
  .put(addComment)
router.route('/:noteId/comment/:commentId')
  .delete(deleteComment);
router.route('/:noteId/comments')
  .get(getNoteComments);
export default router;