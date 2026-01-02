import mongoose, { Schema, Document } from 'mongoose';
import { Poll } from './models';

const PollOptionSchema = new Schema({
  text: { type: String, required: true },
  votes: [{ type: Schema.Types.ObjectId, ref: 'User' }] // Array of User ids
});

const PollSchema = new Schema({
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  authorUsername: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  options: [PollOptionSchema],
  allowCustomOptions: { type: Boolean, default: false },
  expiresAt: { type: Date, required: false },
  isClosed: { type: Boolean, default: false },
  
  clientId: { type: String, default: null } 
}, { 
  timestamps: true // Automatically creates createdAt and updatedAt
});

PollSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model<Poll>('Poll', PollSchema);