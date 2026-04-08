import express, { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createBoard, getBoardById, getUserBoards } from '../controllers/board.controller';

const router: Router = express.Router();

router.post('/', protect, createBoard);
router.get('/', protect, getUserBoards);
router.get('/shared/:boardId', getBoardById);
router.get('/:boardId', getBoardById);

export default router;
