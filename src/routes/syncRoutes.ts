const express = require('express');
import { syncListsController } from '../controllers/syncListController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/lists')
  .post(syncListsController)


export default router;