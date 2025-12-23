const express = require('express');
import { 
  createNote, 
  getNotes, 
  updateNote, 
  deleteNote, 
  addComment,
  deleteComment,
  getNoteComments,
  getNote
} from '../controllers/noteController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createNote)
  .get(getNotes);

router.route('/:id')
  .put(updateNote)
  .delete(deleteNote)
  .get(getNote)

router.route('/:noteId/comment')
  .post(addComment)
router.route('/:noteId/comment/:commentId')
  .delete(deleteComment);
router.route('/:noteId/comments')
  .get(getNoteComments);
export default router;