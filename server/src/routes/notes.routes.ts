import express, { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createNote,
  deleteNote,
  getNotesByBoard,
  updateNote,
  voteNote,
} from '../controllers/note.controller';

const router: Router = express.Router();

router.get('/board/:boardId', getNotesByBoard);
router.post('/', protect, createNote);
router.put('/:noteId', protect, updateNote);
router.delete('/:noteId', protect, deleteNote);
router.post('/:noteId/vote', protect, voteNote);

export default router;
