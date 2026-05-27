export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface BoardMember {
  userId: User | string;
  role: 'editor' | 'viewer';
  joinedAt: string;
}

export interface Board {
  _id: string;
  title: string;
  sprintName: string;
  owner: User;
  members: BoardMember[];
  columns: Column[];
  createdAt: string;
}

export interface Note {
  _id: string;
  boardId: string;
  columnId: string;
  content: string;
  author: User | string;
  votes: string[];
  lastModifiedBy?: User | string;
  lastModifiedAt?: string;
  createdAt: string;
}

export interface ActivityEntry {
  _id: string;
  boardId: string;
  userId: User | string;
  action: 'note:added' | 'note:edited' | 'note:deleted' | 'note:voted' | 'user:added' | 'user:removed' | 'user:role_changed' | 'user:joined' | 'board:created' | 'board:updated' | 'board:deleted' | 'column:added' | 'column:renamed' | 'column:deleted';
  target: 'note' | 'user' | 'board' | 'column';
  targetId?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface NoteAddPayload {
  boardId: string;
  columnId: string;
  content: string;
  authorId: string;
}

export interface NoteUpdatePayload {
  noteId: string;
  content: string;
}

export interface NoteVotePayload {
  noteId: string;
  userId: string;
}

export interface TimerPayload {
  boardId: string;
  durationSeconds: number;
}

export interface ColumnAddPayload {
  boardId: string;
  title: string;
}

export interface ColumnRenamePayload {
  boardId: string;
  columnId: string;
  title: string;
}

export interface ColumnDeletePayload {
  boardId: string;
  columnId: string;
}

export interface NoteMovePayload {
  boardId: string;
  noteId: string;
  targetColumnId: string;
}

export interface ColumnReorderPayload {
  boardId: string;
  columnIds: string[];
}

export interface BoardUpdatePayload {
  boardId: string;
  title?: string;
  sprintName?: string;
}