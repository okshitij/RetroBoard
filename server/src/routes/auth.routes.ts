import express, { Router } from 'express';
import { registerUser } from '../controllers/auth.controller';

const router: Router = express.Router();

router.post('/register', registerUser);

export default router;