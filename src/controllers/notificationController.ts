import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { lastSyncTime } = req.query; // Get the timestamp from the frontend

    let query: any = { recipientId: userId };

    // Only fetch if created AFTER the last sync
    if (lastSyncTime) {
      query.createdAt = { $gt: new Date(lastSyncTime as string) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); 

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Security: Only the recipient can mark it as read
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating notification' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking all read' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notification.deleteOne();

    res.status(200).json({ message: 'Notification removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting notification' });
  }
};