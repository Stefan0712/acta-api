const express = require('express');
import { 
  createGroup, 
  getMyGroups, 
  getGroupById, 
  deleteGroup,
  updateGroup,
  updateRole,
  kickUser,
  leaveGroup
} from '../controllers/groupController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createGroup)
  .get(getMyGroups);

router.get('/:id', getGroupById);
router.delete('/:id', deleteGroup);
router.put('/:id', updateGroup);
router.put('/:id/role', updateRole);
router.post('/:id/kick', kickUser);
router.delete('/:id/leave', leaveGroup);

export default router;