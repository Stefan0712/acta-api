import mongoose, { Schema } from 'mongoose';
import { Note } from './models';

const NoteSchema: Schema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled Note', trim: true },
    content: { type: String, required: true },
    isDirty: {type: Boolean, default: false},
    commentCount: {type: Number, default: 0}
  },
  { timestamps: true }
);

NoteSchema.index({ groupId: 1 });

export default mongoose.model<Note>('Note', NoteSchema);