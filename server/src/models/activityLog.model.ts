import mongoose, { Schema } from 'mongoose';
import { IActivityLog } from '../types';

const ActivityLogSchema = new Schema<IActivityLog>({
  boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: ['note:added', 'note:edited', 'note:deleted', 'note:voted', 'user:added', 'user:removed', 'user:role_changed', 'user:joined', 'board:created'],
    required: true,
  },
  target: {
    type: String,
    enum: ['note', 'user', 'board'],
    required: true,
  },
  targetId: { type: Schema.Types.ObjectId },
  details: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Composite index for efficient querying
ActivityLogSchema.index({ boardId: 1, timestamp: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
