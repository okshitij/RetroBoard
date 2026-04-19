import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Board from '../models/board.model';
import User from '../models/user.model';
import Note from '../models/note.model';
import { AuthRequest } from '../middleware/auth.middleware';
import AuthorizationService from '../services/authorizationService';
import ActivityLoggerService from '../services/activityLogger';

export const createBoard = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { title, sprintName } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title || !sprintName) {
      return res.status(400).json({ message: 'Title and sprint name are required' });
    }

    const board = await Board.create({
      title,
      sprintName,
      owner: userId,
      members: [{ userId, role: 'editor' }],
    });

    // Log board creation
    await ActivityLoggerService.logActivity(board._id, userId, 'board:created', 'board', board._id, {
      title,
      sprintName,
    });

    return res.status(201).json({ board });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create board', error });
  }
};

export const getUserBoards = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.userId;
    const boards = await Board.find({
      $or: [
        { owner: userId },
        { 'members.userId': userId },
      ],
    })
      .populate('owner', 'username email')
      .populate('members.userId', 'username email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ boards });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load boards', error });
  }
};

export const getBoardById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId)
      .populate('owner', 'username email')
      .populate('members.userId', 'username email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    return res.status(200).json({ board });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load board', error });
  }
};

export const getBoardNotes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { boardId } = req.params;
    const notes = await Note.find({ boardId })
      .populate('author', 'username email')
      .populate('lastModifiedBy', 'username email')
      .sort({ createdAt: 1 });
    return res.status(200).json({ notes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load board notes', error });
  }
};

/**
 * Get board members with their roles
 */
export const getBoardMembers = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId } = req.params;
    const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId;

    const result = await AuthorizationService.getBoardMembers(boardIdStr);
    if (!result) {
      return res.status(404).json({ message: 'Board not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load board members', error });
  }
};

/**
 * Add member to board (owner only)
 */
export const addBoardMember = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const { username, role } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!username || !role) {
      return res.status(400).json({ message: 'Username and role are required' });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "editor" or "viewer"' });
    }

    // Verify board exists and user is owner
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Only board owner can add members' });
    }

    // Find user by username
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = board.members.find(m => m.userId.toString() === targetUser._id.toString());
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this board' });
    }

    // Add member
    board.members.push({
      userId: targetUser._id as Types.ObjectId,
      role: role as 'editor' | 'viewer',
      joinedAt: new Date(),
    });

    await board.save();

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'user:added', 'user', targetUser._id, {
      username: targetUser.username,
      role,
    });

    // Populate and return
    await board.populate('members.userId', 'username email');

    return res.status(200).json({ board, message: `${username} added to board with ${role} access` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add member', error });
  }
};

/**
 * Remove member from board (owner only)
 */
export const removeBoardMember = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam, userId: userIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const targetUserId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify board exists and user is owner
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Only board owner can remove members' });
    }

    // Prevent owner from removing themselves
    if (board.owner.toString() === targetUserId) {
      return res.status(400).json({ message: 'Board owner cannot be removed' });
    }

    // Find member
    const memberIndex = board.members.findIndex(m => m.userId.toString() === targetUserId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const targetUser = await User.findById(targetUserId);
    const removedMember = board.members[memberIndex];

    // Remove member
    board.members.splice(memberIndex, 1);
    await board.save();

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'user:removed', 'user', new Types.ObjectId(targetUserId), {
      username: targetUser?.username,
      previousRole: removedMember.role,
    });

    return res.status(200).json({ board, message: 'Member removed from board' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove member', error });
  }
};

/**
 * Update member role on board (owner only)
 */
export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam, userId: userIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const targetUserId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const { role } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!role || !['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "editor" or "viewer"' });
    }

    // Verify board exists and user is owner
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Only board owner can change member roles' });
    }

    // Prevent owner role changes
    if (board.owner.toString() === targetUserId) {
      return res.status(400).json({ message: 'Board owner role cannot be changed' });
    }

    // Find and update member
    const member = board.members.find(m => m.userId.toString() === targetUserId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const previousRole = member.role;
    member.role = role as 'editor' | 'viewer';
    await board.save();

    // Log activity
    const targetUser = await User.findById(targetUserId);
    await ActivityLoggerService.logActivity(boardId, userId, 'user:role_changed', 'user', new Types.ObjectId(targetUserId), {
      username: targetUser?.username,
      previousRole,
      newRole: role,
    });

    await board.populate('members.userId', 'username email');

    return res.status(200).json({ board, message: `Member role updated to ${role}` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update member role', error });
  }
};

/**
 * Get board activity log
 */
export const getBoardActivity = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId } = req.params;
    const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await ActivityLoggerService.getBoardActivity(boardIdStr, limit, offset);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load activity log', error });
  }
};

/**
 * Get note-specific activity log
 */
export const getNoteActivity = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId, noteId } = req.params;
    const boardIdStr = Array.isArray(boardId) ? boardId[0] : boardId;
    const noteIdStr = Array.isArray(noteId) ? noteId[0] : noteId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await ActivityLoggerService.getNoteActivity(boardIdStr, noteIdStr, limit, offset);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load note activity', error });
  }
};
