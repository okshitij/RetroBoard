import mongoose, { Schema } from 'mongoose';
import { INote } from '../types';

const NoteSchema = new Schema<INote>({
  boardId:  { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  columnId: { type: String, required: true },
  content:  { type: String, required: true },
  author:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  votes:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.model<INote>('Note', NoteSchema);