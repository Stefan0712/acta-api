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
        }
      }
    ]
  },
  { timestamps: true }
);

GroupSchema.index({ 'members.userId': 1 });

export default mongoose.model<Group>('Group', GroupSchema);