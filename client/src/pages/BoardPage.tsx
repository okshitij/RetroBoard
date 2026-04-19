import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api';
import type { Board, Note } from '../types';
import BoardView from '../components/BoardView';
import PresenceIndicator from '../components/PresenceIndicator';
import CountdownTimer from '../components/CountdownTimer';
import MemberSidebar from '../components/MemberSidebar';
import AddMemberModal from '../components/AddMemberModal';
import ActivityFeed from '../components/ActivityFeed';

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const { user: currentUser } = useAuth();
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
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = board && currentUser && board.owner._id === currentUser.id;

  const getCurrentUserRole = (): 'owner' | 'editor' | 'viewer' | null => {
    if (!board || !currentUser) return null;
    if (board.owner._id === currentUser.id) return 'owner';

    const member = board.members.find(
      (m) => (typeof m.userId === 'string' ? m.userId : m.userId.id || m.userId._id) === currentUser.id
    );
    return member ? member.role : null;
  };

  const userRole = getCurrentUserRole();
  const isViewer = userRole === 'viewer';

  const handleAddMemberSuccess = async () => {
    // Refresh board to show updated members list
    try {
      const boardResponse = await apiClient.getBoardById(boardId!);
      setBoard(boardResponse.board);
    } catch (err) {
      console.error('Failed to refresh board:', err);
    }
  };

  const handleMemberRemoved = (userId: string) => {
    if (board) {
      setBoard({
        ...board,
        members: board.members.filter((m) => {
          const mId = typeof m.userId === 'string' ? m.userId : m.userId.id || m.userId._id;
          return mId !== userId;
        }),
      });
    }
  };

  const handleMemberRoleChanged = (userId: string, newRole: 'editor' | 'viewer') => {
    if (board) {
      setBoard({
        ...board,
        members: board.members.map((m) => {
          const mId = typeof m.userId === 'string' ? m.userId : m.userId.id || m.userId._id;
          return mId === userId ? { ...m, role: newRole } : m;
        }),
      });
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
    <div className="board-page-layout">
      <header className="board-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <div className="board-info">
            <h1>{board.title}</h1>
            <p className="sprint-info">Sprint: {board.sprintName}</p>
            {userRole && <p className="user-role">Your role: <strong>{userRole}</strong></p>}
          </div>
          <div className="board-controls">
            <PresenceIndicator boardId={boardId!} />
            <CountdownTimer boardId={boardId!} isGuest={false} />
            {isOwner && (
              <button onClick={() => setIsAddMemberModalOpen(true)} className="add-member-button">
                + Add Member
              </button>
            )}
            <button onClick={handleShare} className="share-button">
              Share Board
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="toggle-sidebar-button"
              title="Toggle members sidebar"
            >
              👥
            </button>
            <button
              onClick={() => setShowActivityFeed(!showActivityFeed)}
              className="toggle-activity-button"
              title="Toggle activity feed"
            >
              📋
            </button>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="error-banner">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')}>×</button>
        </div>
      )}

      <div className="board-container">
        <BoardView
          board={board}
          notes={notes}
          isGuest={false}
          isViewer={isViewer}
          onNotesChange={setNotes}
          onError={setErrorMessage}
        />

        {showSidebar && (
          <MemberSidebar
            boardId={boardId!}
            members={board.members}
            owner={board.owner}
            currentUserId={currentUser?.id || ''}
            isOwner={isOwner || false}
            onMemberRemoved={handleMemberRemoved}
            onMemberRoleChanged={handleMemberRoleChanged}
          />
        )}

        {showActivityFeed && (
          <ActivityFeed boardId={boardId!} />
        )}
      </div>

      <AddMemberModal
        boardId={boardId!}
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onMemberAdded={handleAddMemberSuccess}
      />
    </div>
  );
};

export default BoardPage;