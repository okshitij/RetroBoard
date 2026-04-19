import mongoose, { Schema } from 'mongoose';
import { IBoard, IBoardMember } from '../types';

const ColumnSchema = new Schema({
  id:    { type: String, required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
}, { _id: false });

const BoardMemberSchema = new Schema<IBoardMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['editor', 'viewer'], default: 'editor', required: true },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const BoardSchema = new Schema<IBoard>({
  title:      { type: String, required: true },
  sprintName: { type: String, required: true },
  owner:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members:    [BoardMemberSchema],
  columns: {
    type: [ColumnSchema],
    default: [
      { id: 'col-1', title: 'Went Well',          order: 0 },
      { id: 'col-2', title: 'Needs Improvement',  order: 1 },
      { id: 'col-3', title: 'Action Items',        order: 2 },
    ],
  },
}, { timestamps: true });

export default mongoose.model<IBoard>('Board', BoardSchema);