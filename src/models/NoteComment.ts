import mongoose, { Schema, Document } from 'mongoose';
import { NoteComment } from './models';

const NoteCommentSchema: Schema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    username: { type: String, required: true },
    noteId: {type: Schema.Types.ObjectId, ref: 'Note', required: true}
  },
  { timestamps: true }
);

NoteCommentSchema.index({ groupId: 1 });

export default mongoose.model<NoteComment>('NoteComment', NoteCommentSchema);