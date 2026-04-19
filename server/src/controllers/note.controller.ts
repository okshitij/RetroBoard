import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Note from '../models/note.model';
import Board from '../models/board.model';
import { AuthRequest } from '../middleware/auth.middleware';
import AuthorizationService from '../services/authorizationService';
import ActivityLoggerService from '../services/activityLogger';

export const getNotesByBoard = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { boardId } = req.params;
    const notes = await Note.find({ boardId })
      .populate('author', 'username email')
      .populate('lastModifiedBy', 'username email')
      .sort({ createdAt: 1 });

    return res.status(200).json({ notes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load notes', error });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId, columnId, content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!boardId || !columnId || !content) {
      return res.status(400).json({ message: 'boardId, columnId and content are required' });
    }

    // Check authorization
    const canEdit = await AuthorizationService.canEditBoard(userId, boardId);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to create notes on this board' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const note = await Note.create({
      boardId,
      columnId,
      content,
      author: userId,
    });

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'note:added', 'note', note._id, {
      columnId,
      content: content.substring(0, 100),
    });

    return res.status(201).json({ note });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create note', error });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { noteId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check authorization: only author can edit, and must have editor role
    if (note.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not allowed to update this note' });
    }

    const canEdit = await AuthorizationService.canEditBoard(userId, note.boardId);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to edit notes on this board' });
    }

    note.content = content ?? note.content;
    note.lastModifiedBy = new Types.ObjectId(userId);
    note.lastModifiedAt = new Date();
    await note.save();

    // Log activity
    await ActivityLoggerService.logActivity(note.boardId, userId, 'note:edited', 'note', note._id, {
      content: content?.substring(0, 100),
    });

    return res.status(200).json({ note });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update note', error });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { noteId: noteIdParam } = req.params;
    const noteId = Array.isArray(noteIdParam) ? noteIdParam[0] : noteIdParam;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check authorization: only author can delete, and must have editor role
    if (note.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not allowed to delete this note' });
    }

    const canEdit = await AuthorizationService.canEditBoard(userId, note.boardId);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to delete notes on this board' });
    }

    const boardId = note.boardId;

    await note.deleteOne();

    // Log activity
    await ActivityLoggerService.logActivity(boardId, userId, 'note:deleted', 'note', new Types.ObjectId(noteId), {
      originalContent: note.content.substring(0, 100),
    });

    return res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete note', error });
  }
};

export const voteNote = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { noteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check authorization: voter must have editor role
    const canEdit = await AuthorizationService.canEditBoard(userId, note.boardId);
    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to vote on notes on this board' });
    }

    const existingVote = note.votes.some((vote) => vote.toString() === userId);
    const hasVoted = !existingVote;

    if (existingVote) {
      note.votes = note.votes.filter((vote) => vote.toString() !== userId);
    } else {
      note.votes.push(userId as any);
    }

    note.lastModifiedBy = new Types.ObjectId(userId);
    note.lastModifiedAt = new Date();
    await note.save();

    // Log activity
    await ActivityLoggerService.logActivity(note.boardId, userId, 'note:voted', 'note', note._id, {
      hasVoted,
      voteCount: note.votes.length,
    });

    return res.status(200).json({ note });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to vote note', error });
  }
};
