import { Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import Group from '../models/Group';
import { AuthRequest } from '../middleware/authMiddleware';

const isMember = async (groupId: string, userId: string) => {
  const group = await Group.findOne({ _id: groupId, 'members.userId': userId });
  return !!group;
};

// Usage: GET /api/activity/:groupId?page=1&limit=20
export const getGroupActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    if (!await isMember(groupId, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view activity for this group' });
    }

    const skip = (page - 1) * limit;

    // Fetch Logs
    const logs = await ActivityLog.find({ groupId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get Total Count
    const total = await ActivityLog.countDocuments({ groupId });

    console.log(logs)
    res.status(200).json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get Activity Error:', error);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
};

export const deleteActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find the Log
    const log = await ActivityLog.findById(id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    // Find the Group to check permissions
    const group = await Group.findById(log.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Permission Check
    const member = group.members.find(m => m.userId.toString() === req.user.id);
    
    const isAuthorized = member && (member.role === 'owner' || member.role === 'moderator');

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Only Admins/Moderators can delete activity logs' });
    }

    // Delete
    await log.deleteOne();

    res.status(200).json({ message: 'Activity log removed' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting activity log' });
  }
};