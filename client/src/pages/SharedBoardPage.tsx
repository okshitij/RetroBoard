import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api';
import type { Board, Note } from '../types';
import BoardView from '../components/BoardView';
import PresenceIndicator from '../components/PresenceIndicator';
import CountdownTimer from '../components/CountdownTimer';

const SharedBoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (boardId) {
      loadSharedBoard();
    }
  }, [boardId]);

  const loadSharedBoard = async () => {
    try {
      const boardResponse = await apiClient.getSharedBoard(boardId!);
      setBoard(boardResponse.board);

      const notesResponse = await apiClient.getBoardNotes(boardId!);
      setNotes(notesResponse.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading shared board...</div>;
  }

  if (error || !board) {
    return (
      <div className="error-container">
        <h1>Board Not Found</h1>
        <p>{error || 'This board may not exist or is not publicly shared.'}</p>
      </div>
    );
  }

  return (
    <div className="shared-board-page">
      <header className="shared-board-header">
        <div className="header-content">
          <div className="board-info">
            <h1>{board.title}</h1>
            <p className="sprint-info">Sprint: {board.sprintName}</p>
          </div>
          <div className="board-controls">
            <PresenceIndicator boardId={boardId!} />
            <CountdownTimer boardId={boardId!} isGuest={true} />
            <div className="guest-notice">
              <span>👁️ Viewing as guest</span>
            </div>
          </div>
        </div>
      </header>
      <BoardView
        board={board}
        notes={notes}
        isGuest={true}
        onNotesChange={setNotes}
      />
    </div>
  );
};

export default SharedBoardPage;