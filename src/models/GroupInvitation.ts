import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupInvitation extends Document {
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const GroupInvitationSchema: Schema = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined'], 
    default: 'pending' 
  },
}, { timestamps: true });

GroupInvitationSchema.index(
  { groupId: 1, recipientId: 1, status: 1 }, 
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

export default mongoose.model<IGroupInvitation>('GroupInvitation', GroupInvitationSchema);