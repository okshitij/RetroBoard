import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface IColumn {
  id: string;
  title: string;
  order: number;
}

export interface IBoardMember {
  userId: Types.ObjectId;
  role: 'editor' | 'viewer';
  joinedAt: Date;
}

export interface IBoard extends Document {
  title: string;
  sprintName: string;
  owner: Types.ObjectId;
  members: IBoardMember[];
  columns: IColumn[];
  createdAt: Date;
}

export interface INote extends Document {
  boardId: Types.ObjectId;
  columnId: string;
  content: string;
  author: Types.ObjectId;
  votes: Types.ObjectId[];
  lastModifiedBy?: Types.ObjectId;
  lastModifiedAt?: Date;
  createdAt: Date;
}

export interface IActivityLog extends Document {
  boardId: Types.ObjectId;
  userId: Types.ObjectId;
  action: 'note:added' | 'note:edited' | 'note:deleted' | 'note:voted' | 'note:moved' | 'user:added' | 'user:removed' | 'user:role_changed' | 'user:joined' | 'board:created' | 'board:updated' | 'board:deleted' | 'column:added' | 'column:renamed' | 'column:deleted' | 'column:reordered';
  target: 'note' | 'user' | 'board' | 'column';
  targetId?: Types.ObjectId;
  details: Record<string, any>;
  timestamp: Date;
}

// JWT payload shape
export interface JwtPayload {
  userId: string;
  email: string;
}

// Socket event payloads
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

// Column event payloads
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

// Drag-and-drop event payloads
export interface NoteMovePayload {
  boardId: string;
  noteId: string;
  targetColumnId: string;
}

export interface ColumnReorderPayload {
  boardId: string;
  columnIds: string[];  // ordered array of column IDs representing the new order
}