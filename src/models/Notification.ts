import mongoose, { Schema, Document } from 'mongoose';

export type NotificationCategory = 'ASSIGNMENT' | 'MENTION' | 'GROUP' | 'REMINDER';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  authorId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  category: NotificationCategory;
  message: string;
  isRead: boolean;
  metadata?: {
    listId?: string;
    itemId?: string;
    noteId?: string;
    pollId?: string;
  };
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    
    category: { 
      type: String, 
      enum: ['ASSIGNMENT', 'MENTION', 'GROUP', 'REMINDER'], 
      required: true 
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    
    metadata: {
      listId: { type: Schema.Types.ObjectId, ref: 'ShoppingList' },
      itemId: { type: Schema.Types.ObjectId, ref: 'ShoppingListItem' },
      noteId: { type: Schema.Types.ObjectId, ref: 'Note' },
      pollId: { type: Schema.Types.ObjectId, ref: 'Poll' },
    }
  },
  { timestamps: true }
);
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<INotification>('Notification', NotificationSchema);