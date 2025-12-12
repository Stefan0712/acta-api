const express = require('express');
import { 
  createGroup, 
  getMyGroups, 
  getGroupById, 
  leaveGroup, 
  generateInviteToken,
  acceptInvite,
  lookupInvite,
  deleteGroup,
  updateGroup
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
router.get('/invite/lookup', lookupInvite);
router.delete('/:id/leave', leaveGroup);
router.post('/:groupId/invite/generate', generateInviteToken);
router.post('/invite/accept', acceptInvite);

export default router;