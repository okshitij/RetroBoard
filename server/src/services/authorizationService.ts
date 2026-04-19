import { Types } from 'mongoose';
import Board from '../models/board.model';

/**
 * Authorization Service
 * Checks user permissions on boards based on membership and roles
 */
export class AuthorizationService {
  /**
   * Get user's role on a board
   * Returns 'editor' if user is owner, 'editor'/'viewer' if member, null if not a member
   */
  static async getUserRoleOnBoard(userId: string | Types.ObjectId, boardId: string | Types.ObjectId): Promise<'editor' | 'viewer' | null> {
    try {
      const board = await Board.findById(boardId);
      if (!board) return null;

      // Owner is always an editor
      if (board.owner.toString() === userId.toString()) {
        return 'editor';
      }

      // Check if user is in members array
      const member = board.members.find(m => m.userId.toString() === userId.toString());
      return member ? member.role : null;
    } catch (error) {
      console.error('Error checking user role:', error);
      return null;
    }
  }

  /**
   * Check if user can edit a board (has editor role)
   */
  static async canEditBoard(userId: string | Types.ObjectId, boardId: string | Types.ObjectId): Promise<boolean> {
    const role = await this.getUserRoleOnBoard(userId, boardId);
    return role === 'editor';
  }

  /**
   * Check if user can view a board (is member or owner)
   */
  static async canViewBoard(userId: string | Types.ObjectId, boardId: string | Types.ObjectId): Promise<boolean> {
    const role = await this.getUserRoleOnBoard(userId, boardId);
    return role !== null;
  }

  /**
   * Check if user is board owner
   */
  static async isBoardOwner(userId: string | Types.ObjectId, boardId: string | Types.ObjectId): Promise<boolean> {
    try {
      const board = await Board.findById(boardId);
      return board ? board.owner.toString() === userId.toString() : false;
    } catch (error) {
      console.error('Error checking board ownership:', error);
      return false;
    }
  }

  /**
   * Get all members of a board with user details
   */
  static async getBoardMembers(boardId: string | Types.ObjectId) {
    try {
      const board = await Board.findById(boardId).populate({
        path: 'members.userId',
        select: 'username email',
      }).populate('owner', 'username email');
      
      if (!board) return null;

      return {
        owner: board.owner,
        members: board.members,
      };
    } catch (error) {
      console.error('Error fetching board members:', error);
      return null;
    }
  }
}

export default AuthorizationService;
