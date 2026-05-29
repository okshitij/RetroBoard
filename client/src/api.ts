import type { User, Board, Note, Column, BoardMember, ActivityEntry } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(username: string, email: string, password: string) {
    return this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me');
  }

  async getProfile() {
    return this.request<{ user: User & { createdAt: string } }>('/auth/profile');
  }

  async updateProfile(data: { username: string }) {
    return this.request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Board endpoints
  async createBoard(title: string, sprintName: string) {
    return this.request<{ board: Board }>('/boards', {
      method: 'POST',
      body: JSON.stringify({ title, sprintName }),
    });
  }

  async getUserBoards() {
    return this.request<{ boards: Board[] }>('/boards');
  }

  async getBoardById(boardId: string) {
    return this.request<{ board: Board; userRole?: string }>(`/boards/${boardId}`);
  }

  async getSharedBoard(boardId: string) {
    return this.request<{ board: Board }>(`/boards/shared/${boardId}`);
  }

  async deleteBoard(boardId: string) {
    return this.request<{ message: string }>(`/boards/${boardId}`, {
      method: 'DELETE',
    });
  }

  async updateBoard(boardId: string, data: { title?: string; sprintName?: string }) {
    return this.request<{ board: Board }>(`/boards/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async exportBoardPDF(boardId: string) {
    const url = `${API_BASE_URL}/boards/${boardId}/export/pdf`;
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `retro-board-${boardId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  }

  // Board member endpoints
  async getBoardMembers(boardId: string) {
    return this.request<{ owner: User; members: BoardMember[] }>(`/boards/${boardId}/members`);
  }

  async addBoardMember(boardId: string, username: string, role: 'editor' | 'viewer') {
    return this.request<{ board: Board; message: string }>(`/boards/${boardId}/members`, {
      method: 'POST',
      body: JSON.stringify({ username, role }),
    });
  }

  async removeBoardMember(boardId: string, userId: string) {
    return this.request<{ board: Board; message: string }>(`/boards/${boardId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateMemberRole(boardId: string, userId: string, role: 'editor' | 'viewer') {
    return this.request<{ board: Board; message: string }>(`/boards/${boardId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // Board activity endpoints
  async getBoardActivity(boardId: string, limit: number = 50, offset: number = 0) {
    return this.request<{ activities: ActivityEntry[]; total: number; limit: number; offset: number }>(
      `/boards/${boardId}/activity?limit=${limit}&offset=${offset}`
    );
  }

  async getNoteActivity(boardId: string, noteId: string, limit: number = 50, offset: number = 0) {
    return this.request<{ activities: ActivityEntry[]; total: number; limit: number; offset: number }>(
      `/boards/${boardId}/notes/${noteId}/activity?limit=${limit}&offset=${offset}`
    );
  }

  // Column endpoints
  async addColumn(boardId: string, title: string) {
    return this.request<{ column: Column; columns: Column[] }>(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async renameColumn(boardId: string, columnId: string, title: string) {
    return this.request<{ column: Column; columns: Column[] }>(`/boards/${boardId}/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  // Note endpoints
  async getBoardNotes(boardId: string) {
    return this.request<{ notes: Note[] }>(`/notes/board/${boardId}`);
  }

  async createNote(boardId: string, columnId: string, content: string) {
    return this.request<{ note: Note }>('/notes', {
      method: 'POST',
      body: JSON.stringify({ boardId, columnId, content }),
    });
  }

  async updateNote(noteId: string, content: string) {
    return this.request<{ note: Note }>(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteNote(noteId: string) {
    return this.request<{ message: string }>(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async voteNote(noteId: string) {
    return this.request<{ note: Note }>(`/notes/${noteId}/vote`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();