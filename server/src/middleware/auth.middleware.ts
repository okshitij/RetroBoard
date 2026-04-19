import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import AuthorizationService from '../services/authorizationService';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware to check if user is board owner
 * Expects boardId in params (req.params.id or req.params.boardId)
 */
export const requireBoardOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let boardId = req.params.id || req.params.boardId;
    if (Array.isArray(boardId)) {
      boardId = boardId[0];
    }
    if (!boardId) {
      res.status(400).json({ message: 'Board ID not provided' });
      return;
    }

    const isOwner = await AuthorizationService.isBoardOwner(req.user.userId, boardId);
    if (!isOwner) {
      res.status(403).json({ message: 'Only board owner can perform this action' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

/**
 * Middleware to check if user can view the board
 * Expects boardId in params (req.params.id or req.params.boardId)
 */
export const requireBoardAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let boardId = req.params.id || req.params.boardId;
    if (Array.isArray(boardId)) {
      boardId = boardId[0];
    }
    if (!boardId) {
      res.status(400).json({ message: 'Board ID not provided' });
      return;
    }

    const canView = await AuthorizationService.canViewBoard(req.user.userId, boardId);
    if (!canView) {
      res.status(403).json({ message: 'Access denied to this board' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed' });
  }
};

/**
 * Middleware to check if user can edit the board (is editor)
 * Expects boardId in params (req.params.id or req.params.boardId)
 */
export const requireBoardEdit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const boardId = req.params.id || req.params.boardId || req.body.boardId;
    if (!boardId) {
      res.status(400).json({ message: 'Board ID not provided' });
      return;
    }

    const canEdit = await AuthorizationService.canEditBoard(req.user.userId, boardId);
    if (!canEdit) {
      res.status(403).json({ message: 'You do not have edit permissions on this board' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed' });
  }
};