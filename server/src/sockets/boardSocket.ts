import { Server, Socket } from 'socket.io';
import Note from '../models/note.model';
import {
  NoteAddPayload,
  NoteUpdatePayload,
  NoteVotePayload,
  TimerPayload,
} from '../types';

const activeTimers = new Map<string, NodeJS.Timeout>();

export const registerBoardSocket = (io: Server, socket: Socket): void => {

  socket.on('join-board', (boardId: string) => {
    socket.join(boardId);
    socket.to(boardId).emit('user:joined', { socketId: socket.id });
  });

  socket.on('leave-board', (boardId: string) => {
    socket.leave(boardId);
    socket.to(boardId).emit('user:left', { socketId: socket.id });
  });

  socket.on('note:add', async (payload: NoteAddPayload) => {
    const note = await Note.create({
      boardId:  payload.boardId,
      columnId: payload.columnId,
      content:  payload.content,
      author:   payload.authorId,
    });
    io.to(payload.boardId).emit('note:added', note);
  });

  socket.on('note:update', async (payload: NoteUpdatePayload) => {
    const note = await Note.findByIdAndUpdate(
      payload.noteId,
      { content: payload.content },
      { new: true }
    );
    if (note) {
      io.to(note.boardId.toString()).emit('note:updated', note);
    }
  });

  socket.on('note:delete', async (noteId: string) => {
    const note = await Note.findByIdAndDelete(noteId);
    if (note) {
      io.to(note.boardId.toString()).emit('note:deleted', noteId);
    }
  });

  socket.on('note:vote', async (payload: NoteVotePayload) => {
    const note = await Note.findById(payload.noteId);
    if (!note) return;

    const alreadyVoted = note.votes.map(String).includes(payload.userId);
    if (alreadyVoted) {
      note.votes = note.votes.filter((v) => v.toString() !== payload.userId);
    } else {
      note.votes.push(payload.userId as any);
    }
    await note.save();
    io.to(note.boardId.toString()).emit('note:voted', note);
  });

  socket.on('timer:start', (payload: TimerPayload) => {
    // Clear any existing timer for this board
    const existingInterval = activeTimers.get(payload.boardId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    let remaining = payload.durationSeconds;
    const interval = setInterval(() => {
      remaining--;
      io.to(payload.boardId).emit('timer:tick', { remaining });
      if (remaining <= 0) {
        clearInterval(interval);
        activeTimers.delete(payload.boardId);
        io.to(payload.boardId).emit('timer:ended');
      }
    }, 1000);
    activeTimers.set(payload.boardId, interval);
  });

  socket.on('timer:stop', (payload: { boardId: string }) => {
    const interval = activeTimers.get(payload.boardId);
    if (interval) {
      clearInterval(interval);
      activeTimers.delete(payload.boardId);
    }
    io.to(payload.boardId).emit('timer:stopped');
  });

  socket.on('disconnect', () => {
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('user:left', { socketId: socket.id });
      }
    });
  });
};