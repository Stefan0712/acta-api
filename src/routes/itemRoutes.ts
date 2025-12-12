const express = require('express');
import { 
  createItem, 
  getItems, 
  updateItem, 
  deleteItem 
} from '../controllers/itemController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createItem)
  .get(getItems);

router.route('/:id')
  .put(updateItem)
  .delete(deleteItem);

  
export default router;