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
  action: 'note:added' | 'note:edited' | 'note:deleted' | 'note:voted' | 'user:added' | 'user:removed' | 'user:role_changed' | 'user:joined' | 'board:created';
  target: 'note' | 'user' | 'board';
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