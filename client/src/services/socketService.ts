import { io, Socket } from 'socket.io-client';
import type { Note, NoteAddPayload, NoteUpdatePayload, NoteVotePayload, TimerPayload } from '../types';

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

    this.socket = io('http://localhost:5000', connectionOptions);

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