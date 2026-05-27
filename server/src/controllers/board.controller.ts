import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Board from '../models/board.model';
import User from '../models/user.model';
import Note from '../models/note.model';
import ActivityLog from '../models/activityLog.model';
import { AuthRequest } from '../middleware/auth.middleware';
import AuthorizationService from '../services/authorizationService';
import ActivityLoggerService from '../services/activityLogger';
import { generateBoardPDF } from '../utils/exportPDF';

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
      members: [],
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

/**
 * Delete a board (owner only)
 * Cascade deletes all notes and activity logs for the board
 */
export const deleteBoard = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Only board owner can delete the board' });
    }

    // Cascade delete notes
    await Note.deleteMany({ boardId });

    // Cascade delete activity logs
    await ActivityLog.deleteMany({ boardId });

    // Delete the board
    await board.deleteOne();

    return res.status(200).json({ message: 'Board deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete board', error });
  }
};

/**
 * Update a board (owner only)
 * Allows editing title and sprint name
 */
export const updateBoard = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const { title, sprintName } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Only board owner can update the board' });
    }

    const changes: Record<string, any> = {};
    if (title && title.trim()) {
      changes.previousTitle = board.title;
      board.title = title.trim();
      changes.newTitle = board.title;
    }
    if (sprintName && sprintName.trim()) {
      changes.previousSprintName = board.sprintName;
      board.sprintName = sprintName.trim();
      changes.newSprintName = board.sprintName;
    }

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    await board.save();
    await board.populate('owner', 'username email');
    await board.populate('members.userId', 'username email');

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'board:updated', 'board', board._id, changes);

    return res.status(200).json({ board });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update board', error });
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
    const { boardId: boardIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const board = await Board.findById(boardId)
      .populate('owner', 'username email')
      .populate('members.userId', 'username email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Compute the requesting user's role (if authenticated) so client doesn't have to guess
    const userId = (req as AuthRequest).user?.userId;
    let userRole: string | null = null;
    if (userId) {
      userRole = await AuthorizationService.getUserRoleOnBoard(userId, boardId as string);
      // Owner is returned as 'editor' by AuthorizationService; promote to 'owner' for clarity
      if (board.owner._id?.toString() === userId || board.owner.toString() === userId) {
        userRole = 'owner';
      }
    }

    return res.status(200).json({ board, userRole });
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

/**
 * Add a new column to a board (editors only)
 */
export const addColumn = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const { title } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Column title is required' });
    }

    // Check edit permission
    const canEdit = await AuthorizationService.canEditBoard(userId, boardId);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to modify columns' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check for duplicate column title
    const duplicate = board.columns.find(c => c.title.toLowerCase() === title.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json({ message: 'A column with this title already exists' });
    }

    // Generate next column id and order
    const maxOrder = board.columns.length > 0
      ? Math.max(...board.columns.map(c => c.order))
      : -1;
    const nextNum = board.columns.length > 0
      ? Math.max(...board.columns.map(c => parseInt(c.id.replace('col-', ''), 10) || 0)) + 1
      : 1;

    const newColumn = {
      id: `col-${nextNum}`,
      title: title.trim(),
      order: maxOrder + 1,
    };

    board.columns.push(newColumn);
    await board.save();

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'column:added', 'column', undefined, {
      columnId: newColumn.id,
      title: newColumn.title,
    });

    return res.status(201).json({ column: newColumn, columns: board.columns });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add column', error });
  }
};

/**
 * Rename an existing column on a board (editors only)
 */
export const renameColumn = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam, columnId: columnIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const columnId = Array.isArray(columnIdParam) ? columnIdParam[0] : columnIdParam;
    const { title } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Column title is required' });
    }

    // Check edit permission
    const canEdit = await AuthorizationService.canEditBoard(userId, boardId);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to modify columns' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const column = board.columns.find(c => c.id === columnId);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Check for duplicate title (excluding current column)
    const duplicate = board.columns.find(c => c.id !== columnId && c.title.toLowerCase() === title.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json({ message: 'A column with this title already exists' });
    }

    const previousTitle = column.title;
    column.title = title.trim();
    await board.save();

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'column:renamed', 'column', undefined, {
      columnId,
      previousTitle,
      newTitle: title.trim(),
    });

    return res.status(200).json({ column, columns: board.columns });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to rename column', error });
  }
};

/**
 * Delete a column from a board (editors only)
 * Also deletes all notes in that column
 */
export const deleteColumn = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId: boardIdParam, columnId: columnIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;
    const columnId = Array.isArray(columnIdParam) ? columnIdParam[0] : columnIdParam;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check edit permission
    const canEdit = await AuthorizationService.canEditBoard(userId, boardId);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to modify columns' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const columnIndex = board.columns.findIndex(c => c.id === columnId);
    if (columnIndex === -1) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Prevent deleting the last column
    if (board.columns.length <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last column' });
    }

    const deletedColumn = board.columns[columnIndex];

    // Remove the column
    board.columns.splice(columnIndex, 1);
    await board.save();

    // Cascade delete all notes in this column
    const deleteResult = await Note.deleteMany({ boardId, columnId });

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'column:deleted', 'column', undefined, {
      columnId,
      title: deletedColumn.title,
      notesDeleted: deleteResult.deletedCount,
    });

    return res.status(200).json({
      columns: board.columns,
      message: `Column "${deletedColumn.title}" deleted`,
      notesDeleted: deleteResult.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete column', error });
  }
};

/**
 * Export board as PDF
 */
export const exportBoardPDF = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { boardId: boardIdParam } = req.params;
    const boardId = Array.isArray(boardIdParam) ? boardIdParam[0] : boardIdParam;

    const pdfBuffer = await generateBoardPDF(boardId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="retro-board-${boardId}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export PDF', error });
  }
};
