import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api';
import type { Board, Note } from '../types';
import BoardView from '../components/BoardView';
import PresenceIndicator from '../components/PresenceIndicator';
import CountdownTimer from '../components/CountdownTimer';

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: _user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId]);

  const loadBoard = async () => {
    try {
      const boardResponse = await apiClient.getBoardById(boardId!);
      setBoard(boardResponse.board);

      const notesResponse = await apiClient.getBoardNotes(boardId!);
      setNotes(notesResponse.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/shared/${boardId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  if (isLoading) {
    return <div className="loading">Loading board...</div>;
  }

  if (error || !board) {
    return (
      <div className="error-container">
        <h1>Board Not Found</h1>
        <p>{error || 'This board may not exist or you may not have access.'}</p>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="board-page">
      <header className="board-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="board-info">
            <h1>{board.title}</h1>
            <p className="sprint-info">Sprint: {board.sprintName}</p>
          </div>
          <div className="board-controls">
            <PresenceIndicator boardId={boardId!} />
            <CountdownTimer boardId={boardId!} isGuest={false} />
            <button onClick={handleShare} className="share-button">
              Share Board
            </button>
          </div>
        </div>
      </header>
      <BoardView
        board={board}
        notes={notes}
        isGuest={false}
        onNotesChange={setNotes}
      />
    </div>
  );
};

export default BoardPage;