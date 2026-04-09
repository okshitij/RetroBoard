export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface Board {
  _id: string;
  title: string;
  sprintName: string;
  owner: User;
  members: User[];
  columns: Column[];
  createdAt: string;
}

export interface Note {
  _id: string;
  boardId: string;
  columnId: string;
  content: string;
  author: string;
  votes: string[];
  createdAt: string;
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