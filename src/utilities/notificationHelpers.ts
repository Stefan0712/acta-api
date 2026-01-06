import mongoose from "mongoose";
import { INotification, INotificationMetadata, NotificationModel } from "../models/Notification";
import Group from "../models/Group";

type NotificationCategory = 'ASSIGNMENT' | 'MENTION' | 'GROUP' | 'REMINDER' | 'POLL';
interface CreateNotificationParams {
  recipientId: string | mongoose.Types.ObjectId;
  authorId?: string | mongoose.Types.ObjectId;
  groupId?: string | mongoose.Types.ObjectId;
  category: NotificationCategory;
  message: string;
  metadata?: INotificationMetadata;
}

// Generates and saves a new notification to the database.
export const createNotification = async (params: CreateNotificationParams): Promise<INotification> => {
  try {
    const notification = new NotificationModel({
      recipientId: params.recipientId,
      authorId: params.authorId,
      groupId: params.groupId,
      category: params.category,
      message: params.message,
      metadata: params.metadata || {}, 
      isRead: false,
    });

    const savedNotification = await notification.save();
    return savedNotification;
  } catch (error) {
    console.error('Error generating notification:', error);
    throw new Error('Could not create notification');
  }
};

interface NotifyGroupParams {
  groupId: string;
  authorId: string;
  category: NotificationCategory;
  message: string;
  metadata?: INotificationMetadata;
}



// Notify multiple users
export const notifyGroup = async (params: NotifyGroupParams) => {
  try {
    // Fetch the group and ONLY the members array
    const group = await Group.findById(params.groupId).select('members');

    if (!group || !group.members) return;

    // Filter the array in memory
    const eligibleRecipients = group.members.filter((member: any) => {
      // Exclude the author
      if (member.userId.toString() === params.authorId.toString()) return false;

      // Check settings (Default to TRUE if setting is missing)
      const isEnabled = member.notificationPreferences?.[params.category];
      return isEnabled !== false; 
    });

    if (eligibleRecipients.length === 0) return;

    // Map to Notification objects
    const notifications = eligibleRecipients.map((member: any) => ({
      recipientId: member.userId,
      authorId: params.authorId,
      groupId: params.groupId,
      category: params.category,
      message: params.message,
      metadata: params.metadata || {},
      isRead: false
    }));

    await NotificationModel.insertMany(notifications);

  } catch (error) {
    console.error('NotifyGroup Error:', error);
  }
};