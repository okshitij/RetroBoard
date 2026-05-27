import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import Note from '../models/note.model';
import Board from '../models/board.model';
import User from '../models/user.model';
import {
  NoteAddPayload,
  NoteUpdatePayload,
  NoteVotePayload,
  NoteMovePayload,
  TimerPayload,
  ColumnAddPayload,
  ColumnRenamePayload,
  ColumnDeletePayload,
  ColumnReorderPayload,
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
      
      // Bug 6 fix: require authentication to join a board room
      if (!user) {
        socket.emit('error', { message: 'Authentication required to join board' });
        return;
      }

      const hasAccess = await AuthorizationService.canViewBoard(user.userId, boardId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this board' });
        return;
      }

      // Track presence
      if (!userPresence.has(boardId)) {
        userPresence.set(boardId, new Map());
      }
      userPresence.get(boardId)!.set(socket.id, user.userId);

      socket.join(boardId);

      // Emit user joined with user info
      const userData = await User.findById(user.userId).select('username email');
      socket.to(boardId).emit('user:joined', {
        socketId: socket.id,
        userId: user.userId,
        username: userData?.username || 'Anonymous',
      });

      // Log activity
      await ActivityLoggerService.logActivity(boardId, user.userId, 'user:joined', 'user', undefined, {
        event: 'joined_board',
      });
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

      // Use atomic operators to prevent race conditions
      if (alreadyVoted) {
        await Note.updateOne(
          { _id: note._id },
          { $pull: { votes: new Types.ObjectId(user.userId) }, $set: { lastModifiedBy: new Types.ObjectId(user.userId), lastModifiedAt: new Date() } }
        );
      } else {
        await Note.updateOne(
          { _id: note._id },
          { $addToSet: { votes: new Types.ObjectId(user.userId) }, $set: { lastModifiedBy: new Types.ObjectId(user.userId), lastModifiedAt: new Date() } }
        );
      }

      // Re-fetch to get accurate vote count
      const updatedNote = await Note.findById(note._id);

      // Log activity
      await ActivityLoggerService.logActivity(note.boardId, user.userId, 'note:voted', 'note', note._id, {
        hasVoted,
        voteCount: updatedNote?.votes.length ?? 0,
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

  // ─── Board Events ───────────────────────────────────────────────

  socket.on('board:update', async (payload: { boardId: string; title?: string; sprintName?: string }) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const board = await Board.findById(payload.boardId);
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }

      // Only owner can update board
      if (board.owner.toString() !== user.userId) {
        socket.emit('error', { message: 'Only board owner can update the board' });
        return;
      }

      const changes: Record<string, any> = {};
      if (payload.title && payload.title.trim()) {
        changes.previousTitle = board.title;
        board.title = payload.title.trim();
        changes.newTitle = board.title;
      }
      if (payload.sprintName && payload.sprintName.trim()) {
        changes.previousSprintName = board.sprintName;
        board.sprintName = payload.sprintName.trim();
        changes.newSprintName = board.sprintName;
      }

      if (Object.keys(changes).length === 0) {
        socket.emit('error', { message: 'No valid fields to update' });
        return;
      }

      await board.save();

      // Log activity
      await ActivityLoggerService.logActivity(payload.boardId, user.userId, 'board:updated', 'board', board._id, changes);

      // Broadcast to all users on the board
      io.to(payload.boardId).emit('board:updated', {
        board: { title: board.title, sprintName: board.sprintName },
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error updating board:', error);
      socket.emit('error', { message: 'Failed to update board' });
    }
  });

  // ─── Column Events ────────────────────────────────────────────────

  socket.on('column:add', async (payload: ColumnAddPayload) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to modify columns' });
        return;
      }

      const board = await Board.findById(payload.boardId);
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }

      const title = payload.title?.trim();
      if (!title) {
        socket.emit('error', { message: 'Column title is required' });
        return;
      }

      // Duplicate check
      const duplicate = board.columns.find(c => c.title.toLowerCase() === title.toLowerCase());
      if (duplicate) {
        socket.emit('error', { message: 'A column with this title already exists' });
        return;
      }

      // Generate next id and order
      const maxOrder = board.columns.length > 0
        ? Math.max(...board.columns.map(c => c.order))
        : -1;
      const nextNum = board.columns.length > 0
        ? Math.max(...board.columns.map(c => parseInt(c.id.replace('col-', ''), 10) || 0)) + 1
        : 1;

      const newColumn = {
        id: `col-${nextNum}`,
        title,
        order: maxOrder + 1,
      };

      board.columns.push(newColumn);
      await board.save();

      // Log activity
      await ActivityLoggerService.logActivity(payload.boardId, user.userId, 'column:added', 'column', undefined, {
        columnId: newColumn.id,
        title: newColumn.title,
      });

      // Broadcast to all users on the board
      io.to(payload.boardId).emit('column:added', {
        column: newColumn,
        columns: board.columns,
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error adding column:', error);
      socket.emit('error', { message: 'Failed to add column' });
    }
  });

  socket.on('column:rename', async (payload: ColumnRenamePayload) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to modify columns' });
        return;
      }

      const board = await Board.findById(payload.boardId);
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }

      const column = board.columns.find(c => c.id === payload.columnId);
      if (!column) {
        socket.emit('error', { message: 'Column not found' });
        return;
      }

      const title = payload.title?.trim();
      if (!title) {
        socket.emit('error', { message: 'Column title is required' });
        return;
      }

      // Duplicate check (excluding current column)
      const duplicate = board.columns.find(c => c.id !== payload.columnId && c.title.toLowerCase() === title.toLowerCase());
      if (duplicate) {
        socket.emit('error', { message: 'A column with this title already exists' });
        return;
      }

      const previousTitle = column.title;
      column.title = title;
      await board.save();

      // Log activity
      await ActivityLoggerService.logActivity(payload.boardId, user.userId, 'column:renamed', 'column', undefined, {
        columnId: payload.columnId,
        previousTitle,
        newTitle: title,
      });

      // Broadcast to all users on the board
      io.to(payload.boardId).emit('column:renamed', {
        columnId: payload.columnId,
        title,
        previousTitle,
        columns: board.columns,
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error renaming column:', error);
      socket.emit('error', { message: 'Failed to rename column' });
    }
  });

  socket.on('column:delete', async (payload: ColumnDeletePayload) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to modify columns' });
        return;
      }

      const board = await Board.findById(payload.boardId);
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }

      const columnIndex = board.columns.findIndex(c => c.id === payload.columnId);
      if (columnIndex === -1) {
        socket.emit('error', { message: 'Column not found' });
        return;
      }

      // Prevent deleting the last column
      if (board.columns.length <= 1) {
        socket.emit('error', { message: 'Cannot delete the last column' });
        return;
      }

      const deletedColumn = board.columns[columnIndex];

      // Remove the column
      board.columns.splice(columnIndex, 1);
      await board.save();

      // Cascade delete all notes in this column
      const deleteResult = await Note.deleteMany({ boardId: payload.boardId, columnId: payload.columnId });

      // Log activity
      await ActivityLoggerService.logActivity(payload.boardId, user.userId, 'column:deleted', 'column', undefined, {
        columnId: payload.columnId,
        title: deletedColumn.title,
        notesDeleted: deleteResult.deletedCount,
      });

      // Broadcast to all users on the board
      io.to(payload.boardId).emit('column:deleted', {
        columnId: payload.columnId,
        title: deletedColumn.title,
        columns: board.columns,
        notesDeleted: deleteResult.deletedCount,
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error deleting column:', error);
      socket.emit('error', { message: 'Failed to delete column' });
    }
  });

  // ─── Drag-and-Drop Events ──────────────────────────────────────────

  socket.on('note:move', async (payload: NoteMovePayload) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to move notes' });
        return;
      }

      const note = await Note.findById(payload.noteId);
      if (!note) {
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      const board = await Board.findById(payload.boardId);
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }

      const targetColumn = board.columns.find(c => c.id === payload.targetColumnId);
      if (!targetColumn) {
        socket.emit('error', { message: 'Target column not found' });
        return;
      }

      const updatedNote = await Note.findByIdAndUpdate(
        payload.noteId,
        { columnId: payload.targetColumnId },
        { new: true }
      ).populate('author', 'username email').populate('lastModifiedBy', 'username email');

      // Log activity
      await ActivityLoggerService.logActivity(payload.boardId, user.userId, 'note:moved', 'note', note._id, {
        noteId: payload.noteId,
        targetColumnId: payload.targetColumnId,
      });

      // Broadcast to all users on the board
      io.to(payload.boardId).emit('note:moved', {
        noteId: payload.noteId,
        targetColumnId: payload.targetColumnId,
        note: updatedNote?.toObject(),
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error moving note:', error);
      socket.emit('error', { message: 'Failed to move note' });
    }
  });

  socket.on('column:reorder', async (payload: ColumnReorderPayload) => {
    try {
      const user = getUserFromSocket(socket);

      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to modify columns' });
        return;
      }

      const board = await Board.findById(payload.boardId);
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }

      // Validate all columnIds match existing columns
      const existingIds = board.columns.map(c => c.id);
      const allMatch = payload.columnIds.length === existingIds.length &&
        payload.columnIds.every(id => existingIds.includes(id));
      if (!allMatch) {
        socket.emit('error', { message: 'Column IDs do not match existing columns' });
        return;
      }

      // Reorder board.columns to match the columnIds order and update order field
      const columnMap = new Map(board.columns.map(c => [c.id, c]));
      board.columns = payload.columnIds.map((id, index) => {
        const col = columnMap.get(id)!;
        col.order = index;
        return col;
      });

      await board.save();

      // Log activity
      await ActivityLoggerService.logActivity(payload.boardId, user.userId, 'column:reordered', 'column', undefined, {
        columnIds: payload.columnIds,
      });

      // Broadcast to all users on the board
      io.to(payload.boardId).emit('column:reordered', {
        columns: board.columns,
        userId: user.userId,
        username: (await User.findById(user.userId).select('username'))?.username,
      });
    } catch (error) {
      console.error('Error reordering columns:', error);
      socket.emit('error', { message: 'Failed to reorder columns' });
    }
  });

  socket.on('timer:start', async (payload: TimerPayload) => {
    try {
      const user = getUserFromSocket(socket);
      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Bug 5 fix: require edit permission to start timer
      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to control the timer' });
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

  socket.on('timer:stop', async (payload: { boardId: string }) => {
    try {
      const user = getUserFromSocket(socket);
      if (!user) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Bug 5 fix: require edit permission to stop timer
      const canEdit = await AuthorizationService.canEditBoard(user.userId, payload.boardId);
      if (!canEdit) {
        socket.emit('error', { message: 'You do not have permission to control the timer' });
        return;
      }

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
          // Clean up presence — read userId BEFORE deleting
          const boardPresence = userPresence.get(room);
          let userId: string | undefined;
          if (boardPresence) {
            userId = boardPresence.get(socket.id);
            boardPresence.delete(socket.id);
            if (boardPresence.size === 0) {
              userPresence.delete(room);
            }
          }

          socket.to(room).emit('user:left', {
            socketId: socket.id,
            userId: userId || undefined,
          });
        }
      });
    } catch (error) {
      console.error('Error on disconnect:', error);
    }
  });
};