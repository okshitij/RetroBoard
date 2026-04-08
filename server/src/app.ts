import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import boardsRoutes from './routes/boards.routes';
import notesRoutes from './routes/notes.routes';
import cookieParser from 'cookie-parser';

const app: Application = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/notes', notesRoutes);

export default app;
