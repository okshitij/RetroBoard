import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import app from './src/app';
import connectDB from './src/config/db';
import { connectRedis, pubClient, subClient } from './src/config/redis';
import { registerBoardSocket } from './src/sockets/boardSocket';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket) => {
    registerBoardSocket(io, socket);
  });

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});

