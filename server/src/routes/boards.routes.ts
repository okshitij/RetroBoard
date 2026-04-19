import express, { Router } from 'express';
import { protect, requireBoardOwner, requireBoardAccess } from '../middleware/auth.middleware';
import {
  createBoard,
  getBoardById,
  getUserBoards,
  getBoardNotes,
  getBoardMembers,
  addBoardMember,
  removeBoardMember,
  updateMemberRole,
  getBoardActivity,
  getNoteActivity,
} from '../controllers/board.controller';

const router: Router = express.Router();

// Board CRUD
router.post('/', protect, createBoard);
router.get('/', protect, getUserBoards);
router.get('/shared/:boardId', getBoardById);
router.get('/:boardId', getBoardById);

// Board notes
router.get('/:boardId/notes', getBoardNotes);

// Member management (all require owner)
router.get('/:boardId/members', protect, requireBoardAccess, getBoardMembers);
router.post('/:boardId/members', protect, requireBoardOwner, addBoardMember);
router.delete('/:boardId/members/:userId', protect, requireBoardOwner, removeBoardMember);
router.patch('/:boardId/members/:userId', protect, requireBoardOwner, updateMemberRole);

// Activity logs (all require board access)
router.get('/:boardId/activity', protect, requireBoardAccess, getBoardActivity);
router.get('/:boardId/notes/:noteId/activity', protect, requireBoardAccess, getNoteActivity);

export default router;
