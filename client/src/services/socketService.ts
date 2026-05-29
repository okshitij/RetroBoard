import { io, Socket } from 'socket.io-client';
import type { Note, Column, NoteAddPayload, NoteUpdatePayload, NoteVotePayload, TimerPayload, ColumnAddPayload, ColumnRenamePayload, ColumnDeletePayload, NoteMovePayload, ColumnReorderPayload } from '../types';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const connectionOptions = token
      ? {
          auth: {
            token,
          },
        }
      : undefined;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.socket = io(socketUrl, connectionOptions);

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Board room management
  joinBoard(boardId: string) {
    if (this.socket) {
      this.socket.emit('join-board', boardId);
    }
  }

  leaveBoard(boardId: string) {
    if (this.socket) {
      this.socket.emit('leave-board', boardId);
    }
  }

  // Note events
  addNote(payload: NoteAddPayload) {
    if (this.socket) {
      this.socket.emit('note:add', payload);
    }
  }

  updateNote(payload: NoteUpdatePayload) {
    if (this.socket) {
      this.socket.emit('note:update', payload);
    }
  }

  deleteNote(noteId: string) {
    if (this.socket) {
      this.socket.emit('note:delete', noteId);
    }
  }

  voteNote(payload: NoteVotePayload) {
    if (this.socket) {
      this.socket.emit('note:vote', payload);
    }
  }

  // Timer events
  startTimer(payload: TimerPayload) {
    if (this.socket) {
      this.socket.emit('timer:start', payload);
    }
  }

  stopTimer(payload: { boardId: string }) {
    if (this.socket) {
      this.socket.emit('timer:stop', payload);
    }
  }

  // Column events
  addColumn(payload: ColumnAddPayload) {
    if (this.socket) {
      this.socket.emit('column:add', payload);
    }
  }

  renameColumn(payload: ColumnRenamePayload) {
    if (this.socket) {
      this.socket.emit('column:rename', payload);
    }
  }

  deleteColumn(payload: ColumnDeletePayload) {
    if (this.socket) {
      this.socket.emit('column:delete', payload);
    }
  }

  moveNote(payload: NoteMovePayload) {
    if (this.socket) {
      this.socket.emit('note:move', payload);
    }
  }

  reorderColumns(payload: ColumnReorderPayload) {
    if (this.socket) {
      this.socket.emit('column:reorder', payload);
    }
  }

  // Board events
  updateBoard(payload: { boardId: string; title?: string; sprintName?: string }) {
    if (this.socket) {
      this.socket.emit('board:update', payload);
    }
  }

  // Event listeners
  onNoteAdded(callback: (note: Note) => void) {
    if (this.socket) {
      this.socket.on('note:added', callback);
    }
  }

  onNoteUpdated(callback: (note: Note) => void) {
    if (this.socket) {
      this.socket.on('note:updated', callback);
    }
  }

  onNoteDeleted(callback: (noteId: string) => void) {
    if (this.socket) {
      this.socket.on('note:deleted', callback);
    }
  }

  onNoteVoted(callback: (note: Note) => void) {
    if (this.socket) {
      this.socket.on('note:voted', callback);
    }
  }

  onTimerTick(callback: (remaining: number) => void) {
    if (this.socket) {
      this.socket.on('timer:tick', ({ remaining }) => callback(remaining));
    }
  }

  onTimerStopped(callback: () => void) {
    if (this.socket) {
      this.socket.on('timer:stopped', callback);
    }
  }

  onTimerEnded(callback: () => void) {
    if (this.socket) {
      this.socket.on('timer:ended', callback);
    }
  }

  onUserJoined(callback: (data: { socketId: string }) => void) {
    if (this.socket) {
      this.socket.on('user:joined', callback);
    }
  }

  onUserLeft(callback: (data: { socketId: string }) => void) {
    if (this.socket) {
      this.socket.on('user:left', callback);
    }
  }

  onColumnAdded(callback: (data: { column: Column; columns: Column[]; userId: string; username: string }) => void) {
    if (this.socket) {
      this.socket.on('column:added', callback);
    }
  }

  onColumnRenamed(callback: (data: { columnId: string; title: string; previousTitle: string; columns: Column[]; userId: string; username: string }) => void) {
    if (this.socket) {
      this.socket.on('column:renamed', callback);
    }
  }

  onColumnDeleted(callback: (data: { columnId: string; title: string; columns: Column[]; notesDeleted: number; userId: string; username: string }) => void) {
    if (this.socket) {
      this.socket.on('column:deleted', callback);
    }
  }

  onNoteMoved(callback: (data: { noteId: string; targetColumnId: string }) => void) {
    if (this.socket) {
      this.socket.on('note:moved', callback);
    }
  }

  onColumnsReordered(callback: (data: { columns: Column[] }) => void) {
    if (this.socket) {
      this.socket.on('column:reordered', callback);
    }
  }

  onBoardUpdated(callback: (data: { board: { title: string; sprintName: string }; userId: string; username: string }) => void) {
    if (this.socket) {
      this.socket.on('board:updated', callback);
    }
  }

  onError(callback: (error: any) => void) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();