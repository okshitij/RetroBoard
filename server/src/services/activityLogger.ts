import { Types } from 'mongoose';
import ActivityLog from '../models/activityLog.model';

/**
 * Activity Logger Service
 * Logs all board activities for audit trail and analytics
 */
export class ActivityLoggerService {
  /**
   * Log an activity
   */
  static async logActivity(
    boardId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    action: string,
    target: 'note' | 'user' | 'board',
    targetId?: string | Types.ObjectId,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const activityLog = new ActivityLog({
        boardId: new Types.ObjectId(boardId),
        userId: new Types.ObjectId(userId),
        action,
        target,
        targetId: targetId ? new Types.ObjectId(targetId) : undefined,
        details,
        timestamp: new Date(),
      });

      await activityLog.save();
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - logging failures shouldn't break the main operation
    }
  }

  /**
   * Get activity log for a board (paginated)
   */
  static async getBoardActivity(
    boardId: string | Types.ObjectId,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const activities = await ActivityLog.find({ boardId })
        .populate('userId', 'username email')
        .populate('targetId')
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      const total = await ActivityLog.countDocuments({ boardId });

      return {
        activities,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error fetching board activity:', error);
      throw error;
    }
  }

  /**
   * Get activity for a specific note
   */
  static async getNoteActivity(
    boardId: string | Types.ObjectId,
    noteId: string | Types.ObjectId,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const activities = await ActivityLog.find({
        boardId,
        targetId: new Types.ObjectId(noteId),
      })
        .populate('userId', 'username email')
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

      const total = await ActivityLog.countDocuments({
        boardId,
        targetId: new Types.ObjectId(noteId),
      });

      return {
        activities,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error fetching note activity:', error);
      throw error;
    }
  }

  /**
   * Delete activity logs for a board (cleanup, optional)
   */
  static async deleteActivityLog(boardId: string | Types.ObjectId): Promise<void> {
    try {
      await ActivityLog.deleteMany({ boardId });
    } catch (error) {
      console.error('Error deleting activity log:', error);
      throw error;
    }
  }
}

export default ActivityLoggerService;
