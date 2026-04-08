import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api';
import type { Board } from '../types';

const DashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const response = await apiClient.getUserBoards();
      setBoards(response.boards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return <div className="loading">Loading your boards...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>RetroBoard</h1>
          <div className="user-info">
            <span>Welcome, {user?.username}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-actions">
          <Link to="/boards/create" className="create-board-button">
            Create New Board
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="boards-grid">
          {boards.length === 0 ? (
            <div className="empty-state">
              <h2>No boards yet</h2>
              <p>Create your first retrospective board to get started!</p>
              <Link to="/boards/create" className="create-board-button">
                Create Board
              </Link>
            </div>
          ) : (
            boards.map((board) => (
              <div key={board._id} className="board-card">
                <h3>{board.title}</h3>
                <p className="board-sprint">Sprint: {board.sprintName}</p>
                <p className="board-meta">
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
                <div className="board-actions">
                  <Link to={`/boards/${board._id}`} className="board-link">
                    Open Board
                  </Link>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/shared/${board._id}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert('Share link copied to clipboard!');
                    }}
                    className="share-button"
                  >
                    Share
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;