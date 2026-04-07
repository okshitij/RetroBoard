import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const noteRoutes  = require('./routes/notes');
const { registerBoardSocket } = require('./sockets/boardSocket');

dotenv.config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: process.env.CLIENT_URL } });

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/auth',   authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/notes',  noteRoutes);

io.on('connection', (socket) => {
  registerBoardSocket(io, socket);
});

mongoose.connect(process.env.MONGO_URI!).then(() => {
  server.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
});

