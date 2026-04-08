import { Request, Response } from 'express';
import Note from '../models/note.model';
import Board from '../models/board.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotesByBoard = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { boardId } = req.params;
    const notes = await Note.find({ boardId }).sort({ createdAt: 1 });

    return res.status(200).json({ notes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load notes', error });
  }
};

export const createNote = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { boardId, columnId, content } = req.body;

    if (!boardId || !columnId || !content) {
      return res.status(400).json({ message: 'boardId, columnId and content are required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const note = await Note.create({
      boardId,
      columnId,
      content,
      author: req.user?.userId,
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

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user?.userId) {
      return res.status(403).json({ message: 'Not allowed to update this note' });
    }

    note.content = content ?? note.content;
    await note.save();

    return res.status(200).json({ note });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update note', error });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { noteId } = req.params;
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user?.userId) {
      return res.status(403).json({ message: 'Not allowed to delete this note' });
    }

    await note.deleteOne();

    return res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete note', error });
  }
};

export const voteNote = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { noteId } = req.params;
    const userId = req.user?.userId;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const existingVote = note.votes.some((vote) => vote.toString() === userId);
    if (existingVote) {
      note.votes = note.votes.filter((vote) => vote.toString() !== userId);
    } else {
      note.votes.push(userId as any);
    }

    await note.save();
    return res.status(200).json({ note });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to vote note', error });
  }
};
