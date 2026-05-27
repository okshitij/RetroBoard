import express, { Router } from 'express';
import { protect, requireBoardOwner, requireBoardAccess, requireBoardEdit } from '../middleware/auth.middleware';
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
  addColumn,
  renameColumn,
  deleteColumn,
  deleteBoard,
  updateBoard,
  exportBoardPDF,
} from '../controllers/board.controller';

const router: Router = express.Router();

// Board CRUD
router.post('/', protect, createBoard);
router.get('/', protect, getUserBoards);
router.get('/shared/:boardId', getBoardById);  // Guest access — intentionally unauthenticated
router.get('/:boardId', protect, requireBoardAccess, getBoardById);
router.put('/:boardId', protect, requireBoardOwner, updateBoard);
router.delete('/:boardId', protect, requireBoardOwner, deleteBoard);

// Board notes
router.get('/:boardId/notes', protect, requireBoardAccess, getBoardNotes);

// PDF export
router.get('/:boardId/export/pdf', protect, requireBoardAccess, exportBoardPDF);

// Member management (all require owner)
router.get('/:boardId/members', protect, requireBoardAccess, getBoardMembers);
router.post('/:boardId/members', protect, requireBoardOwner, addBoardMember);
router.delete('/:boardId/members/:userId', protect, requireBoardOwner, removeBoardMember);
router.patch('/:boardId/members/:userId', protect, requireBoardOwner, updateMemberRole);

// Activity logs (all require board access)
router.get('/:boardId/activity', protect, requireBoardAccess, getBoardActivity);
router.get('/:boardId/notes/:noteId/activity', protect, requireBoardAccess, getNoteActivity);

// Column management (editors)
router.post('/:boardId/columns', protect, requireBoardEdit, addColumn);
router.patch('/:boardId/columns/:columnId', protect, requireBoardEdit, renameColumn);
router.delete('/:boardId/columns/:columnId', protect, requireBoardEdit, deleteColumn);

export default router;
