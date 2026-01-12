import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
    acceptInvite, 
    generateInviteToken, 
    getMyInvites, 
    lookupInvite, 
    respondToInvite, 
    sendInvite 
} from '../controllers/inviteController';

const router = express.Router();

router.get('/lookup', lookupInvite);
router.post('/accept', protect, acceptInvite);

router.get('/', protect, getMyInvites);

router.post('/:groupId', protect, sendInvite);
router.post('/:groupId/generate', protect, generateInviteToken);
router.put('/:inviteId/respond', protect, respondToInvite);

export default router;