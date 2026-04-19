import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import Note from '../models/note.model';
import User from '../models/user.model';
import {
  NoteAddPayload,
  NoteUpdatePayload,
  NoteVotePayload,
  TimerPayload,
  JwtPayload,
} from '../types';
import AuthorizationService from '../services/authorizationService';
import ActivityLoggerService from '../services/activityLogger';

const activeTimers = new Map<string, NodeJS.Timeout>();
const userPresence = new Map<string, Map<string, string>>(); // boardId -> socketId -> userId

/**
 * Extract and verify JWT from socket auth
 */
const getUserFromSocket = (socket: Socket): JwtPayload | null => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Socket auth error:', error);
    return null;
  }
};

export const registerBoardSocket = (io: Server, socket: Socket): void => {

  socket.on('join-board', async (boardId: string) => {
    try {
      const user = getUserFromSocket(socket);
      
      // Allow join if user is authenticated or for shared/guest access
      // For authenticated users, verify they have access
      if (user) {
        const hasAccess = await AuthorizationService.canViewBoard(user.userId, boardId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this board' });
          return;
        }
      }

      // Track presence
      if (!userPresence.has(boardId)) {
        userPresence.set(boardId, new Map());
      }
      if (user) {
        userPresence.get(boardId)!.set(socket.id, user.userId);
      }

      socket.join(boardId);

      // Emit user joined with user info
      if (user) {
        const userData = await User.findById(user.userId).select('username email');
        socket.to(boardId).emit('user:joined', {
          socketId: socket.id,
          userId: user.userId,
          username: userData?.username || 'Anonymous',
        });
      } else {
        socket.to(boardId).emit('user:joined', { socketId: socket.id });
      }

      // Log activity
      if (user) {
        await ActivityLoggerService.logActivity(boardId, user.userId, 'user:joined', 'user', undefined, {
          event: 'joined_board',
        });
      }
    } catch (error) {
      console.error('Error joining board:', error);
      socket.emit('error', { message: 'Failed to join board' });
    }
  });

  socket.on('leave-board', async (boardId: string) => {
    try {
      const user = getUserFromSocket(socket);

      // Clean up presence
      const boardPresence = userPresence.get(boardId);
      if (boardPresence) {
        boardPresence.delete(socket.id);
        if (boardPresence.size === 0) {
          userPresence.delete(boardId);
        }
      }

      socket.leave(boardId);

      if (user) {
        const userData = await User.findById(user.userId).select('username email');
        socket.to(boardId).emit('user:left', {
          socketId: socket.id,
          userId: user.userId,
          username: userData?.username || 'Anonymous',
        });
      } else {
        socket.to(boardId).emit('user:left', { socketId: socket.id });
      }
    } catch (error) {
      console.error('Error leaving board:', error);
    }
  });

  socket.on('note:add', async (payload: NoteAddPayload) => {
    try {
      const user = getUserFromSocket(socket);

      // Authorization check
      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to add notes' });
        return;
      }

      const note = await Note.create({
        boardId: payload.boardId,
        columnId: payload.columnId,
        content: payload.content,
        author: user.userId,
      });

      // Log activity
      await ActivityLoggerService.logActivity(payload.boardId, user.userId, 'note:added', 'note', note._id, {
        columnId: payload.columnId,
        content: payload.content.substring(0, 100),
      });

      // Populate and emit
      const populatedNote = await note.populate('author', 'username email');
      io.to(payload.boardId).emit('note:added', {
        ...populatedNote.toObject(),
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error adding note:', error);
      socket.emit('error', { message: 'Failed to add note' });
    }
  });

  socket.on('note:update', async (payload: NoteUpdatePayload) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const note = await Note.findById(payload.noteId);
      if (!note) {
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      // Authorization check: only author can edit, and must be editor
      if (note.author.toString() !== user.userId) {
        socket.emit('error', { message: 'You are not the author of this note' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, note.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to edit notes' });
        return;
      }

      note.content = payload.content;
      note.lastModifiedBy = new Types.ObjectId(user.userId);
      note.lastModifiedAt = new Date();
      await note.save();

      // Log activity
      await ActivityLoggerService.logActivity(note.boardId, user.userId, 'note:edited', 'note', note._id, {
        content: payload.content.substring(0, 100),
      });

      const populatedNote = await Note.findById(note._id)
        .populate('author', 'username email')
        .populate('lastModifiedBy', 'username email');
      io.to(note.boardId.toString()).emit('note:updated', {
        ...populatedNote?.toObject(),
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error updating note:', error);
      socket.emit('error', { message: 'Failed to update note' });
    }
  });

  socket.on('note:delete', async (noteId: string) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const note = await Note.findById(noteId);
      if (!note) {
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      // Authorization check: only author can delete, and must be editor
      if (note.author.toString() !== user.userId) {
        socket.emit('error', { message: 'You are not the author of this note' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, note.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to delete notes' });
        return;
      }

      const boardId = note.boardId;
      await note.deleteOne();

      // Log activity
      await ActivityLoggerService.logActivity(boardId, user.userId, 'note:deleted', 'note', noteId, {
        originalContent: note.content.substring(0, 100),
      });

      io.to(boardId.toString()).emit('note:deleted', {
        noteId,
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      socket.emit('error', { message: 'Failed to delete note' });
    }
  });

  socket.on('note:vote', async (payload: NoteVotePayload) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const note = await Note.findById(payload.noteId);
      if (!note) {
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      // Authorization check: voters must be editors
      const canEdit = await AuthorizationService.canEditBoard(user.userId, note.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to vote on notes' });
        return;
      }

      const alreadyVoted = note.votes.map(String).includes(user.userId);
      const hasVoted = !alreadyVoted;

      if (alreadyVoted) {
        note.votes = note.votes.filter((v) => v.toString() !== user.userId);
      } else {
        note.votes.push(user.userId as any);
      }

      note.lastModifiedBy = new Types.ObjectId(user.userId) as any;
      note.lastModifiedAt = new Date();
      await note.save();

      // Log activity
      await ActivityLoggerService.logActivity(note.boardId, user.userId, 'note:voted', 'note', note._id, {
        hasVoted,
        voteCount: note.votes.length,
      });

      const populatedNote = await Note.findById(note._id)
        .populate('author', 'username email')
        .populate('lastModifiedBy', 'username email');
      io.to(note.boardId.toString()).emit('note:voted', {
        ...populatedNote?.toObject(),
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
        hasVoted,
      });
    } catch (error) {
      console.error('Error voting note:', error);
      socket.emit('error', { message: 'Failed to vote' });
    }
  });

  socket.on('timer:start', (payload: TimerPayload) => {
    try {
      const user = getUserFromSocket(socket);
      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

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
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  });

  socket.on('timer:stop', (payload: { boardId: string }) => {
    try {
      const interval = activeTimers.get(payload.boardId);
      if (interval) {
        clearInterval(interval);
        activeTimers.delete(payload.boardId);
      }
      io.to(payload.boardId).emit('timer:stopped');
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  });

  socket.on('disconnect', () => {
    try {
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          // Clean up presence
          const boardPresence = userPresence.get(room);
          if (boardPresence) {
            boardPresence.delete(socket.id);
            if (boardPresence.size === 0) {
              userPresence.delete(room);
            }
          }

          socket.to(room).emit('user:left', { socketId: socket.id });
        }
      });
    } catch (error) {
      console.error('Error on disconnect:', error);
    }
  });
};