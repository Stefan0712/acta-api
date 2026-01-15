const express = require('express');
import { 
  createList, 
  getLists, 
  getListById, 
  updateList, 
  deleteList 
} from '../controllers/listController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createList)
  .get(getLists);

router.route('/:id')
  .get(getListById)
  .patch(updateList)
  .delete(deleteList);



export default router;