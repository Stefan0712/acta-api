import { ActivityLogData as IActivityLog } from '../models/models';
import Notification from '../models/Notification';
import Group from '../models/Group';

export const createNotificationsFromActivity = async (activityLog: IActivityLog): Promise<void> => {
    try {
        const { groupId, authorId, message, category, metadata, _id: activityId } = activityLog;

        // 1. Find the target group to get the list of members
        const group = await Group.findOne({ _id: groupId }).select('members');

        if (!group) {
            console.warn(`createNotificationsFromActivity: Group ${groupId} not found. Aborting notifications.`);
            return;
        }

        // 2. Determine Recipients
        const recipients = group.members.filter(
            member => member.userId.toString() !== authorId.toString()
        );
        
        // 3. Prepare Notification
        const newNotifications = recipients.map(member => ({
            recipientId: member.userId,        // The person receiving the alert
            authorId: authorId,                // The person who performed the action
            groupId: groupId,
            category: category,
            message: message,                  // Use the Activity Log message
            activityId: activityId,            // Reference back to the original activity (useful!)
            isRead: false,
            metadata: metadata,
        }));
        if (newNotifications.length > 0) {
            await Notification.insertMany(newNotifications);
            console.log(`Successfully created ${newNotifications.length} notifications for activity ${activityId}`);
        }

    } catch (error) {
        console.error('Failed to create notifications from activity log:', error);
    }
};
