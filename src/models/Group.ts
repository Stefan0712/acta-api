import mongoose, { Schema } from 'mongoose';
import { Group } from './models';

const GroupSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      default: '' 
    },
    authorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    icon: {
      type: String,
      default: 'default-icon'
    },
    color: {
      type: String,
      default: 'white'
    },
    members: [
      {
        _id: false,
        userId: { 
          type: Schema.Types.ObjectId, 
          ref: 'User', 
          required: true 
        },
        role: { 
          type: String, 
          enum: ['owner', 'moderator', 'member'], 
          default: 'member' 
        },
        joinedAt: { 
          type: Date, 
          default: Date.now 
        },
        isPinned: {
          type: Boolean,
          default: false
        },
        notificationPreferences: {
          ASSIGNMENT: { type: Boolean, default: true },
          MENTION: { type: Boolean, default: true },
          GROUP: { type: Boolean, default: true },
          REMINDER: { type: Boolean, default: true },
          POLL: { type: Boolean, default: true },
        }
      }
    ]
  },
  { timestamps: true }
);


export default mongoose.model<Group>('Group', GroupSchema);