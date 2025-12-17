import ActivityLog from '../models/ActivityLog';
import { createNotificationsFromActivity } from './notificationHelpers';

export const logActivity = async (input: any): Promise<void> => {
    try {
        if (!input.groupId || !input.authorId) {
            console.error('logActivity: Missing crucial IDs. Aborting.');
            return;
        }

        // 1. Create a new instance
        const logEntry = new ActivityLog(input);

        // 2. Save it
        const savedLog = await logEntry.save();

        // // 3. Trigger Notifications
        // if (savedLog) {
        //     await createNotificationsFromActivity(savedLog.toObject());
        // }

    } catch (error) {
        console.error('CRITICAL: logActivity failed:', error);
    }
};