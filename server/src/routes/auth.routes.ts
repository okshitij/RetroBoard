import express, { Router } from 'express';
import { registerUser, loginUser, getCurrentUser, getProfile, updateProfile, changePassword } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

export default router;
