import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './src/app';
import connectDB from './src/config/db';
import { registerBoardSocket } from './src/sockets/boardSocket';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

connectDB();

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  registerBoardSocket(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
