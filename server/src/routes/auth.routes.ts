import express, { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);

export default router;
