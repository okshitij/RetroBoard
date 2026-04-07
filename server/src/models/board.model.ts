import mongoose, { Schema } from 'mongoose';
import { IBoard } from '../types';

const ColumnSchema = new Schema({
  id:    { type: String, required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true },
}, { _id: false });

const BoardSchema = new Schema<IBoard>({
  title:      { type: String, required: true },
  sprintName: { type: String, required: true },
  owner:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
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