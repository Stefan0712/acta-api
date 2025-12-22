import mongoose, { Schema, Document } from 'mongoose';

export interface INoteComment {
  _id: string;
  authorId: mongoose.Types.ObjectId;
  username: string;
  content: string;
  createdAt: Date;
}

export interface INote extends Document {
  groupId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  comments: INoteComment[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled Note', trim: true },
    content: { type: String, required: true },
    comments: [
      {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

NoteSchema.index({ groupId: 1 });

export default mongoose.model<INote>('Note', NoteSchema);