import { Request, Response } from 'express';
import Board from '../models/board.model';
import Note from '../models/note.model';
import { AuthRequest } from '../middleware/auth.middleware';

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
      members: [userId],
    });

    return res.status(201).json({ board });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create board', error });
  }
};

export const getUserBoards = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user?.userId },
        { members: req.user?.userId },
      ],
    }).sort({ createdAt: -1 });

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
      .populate('members', 'username email');

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
    const notes = await Note.find({ boardId }).sort({ createdAt: 1 });
    return res.status(200).json({ notes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load board notes', error });
  }
};
