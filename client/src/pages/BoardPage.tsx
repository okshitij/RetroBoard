import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../api';
import { BoardSkeleton } from '../components/SkeletonLoader';
import type { Board, Note, Column } from '../types';
import BoardView from '../components/BoardView';
import PresenceIndicator from '../components/PresenceIndicator';
import CountdownTimer from '../components/CountdownTimer';
import MemberSidebar from '../components/MemberSidebar';
import AddMemberModal from '../components/AddMemberModal';
import ActivityFeed from '../components/ActivityFeed';
import { socketService } from '../services/socketService';

const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showActivityFeed, setShowActivityFeed] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Inline edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSprint, setEditSprint] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const sprintInputRef = useRef<HTMLInputElement>(null);

  const [serverUserRole, setServerUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId]);

  // Focus input on edit start
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingSprint && sprintInputRef.current) {
      sprintInputRef.current.focus();
      sprintInputRef.current.select();
    }
  }, [isEditingSprint]);

  // Listen for board:updated socket event
  useEffect(() => {
    const handleBoardUpdated = (data: { board: { title: string; sprintName: string }; userId: string; username: string }) => {
      setBoard((prev) => prev ? { ...prev, title: data.board.title, sprintName: data.board.sprintName } : prev);
    };

    socketService.onBoardUpdated(handleBoardUpdated);

    return () => {
      socketService.off('board:updated', handleBoardUpdated);
    };
  }, []);

  const loadBoard = async () => {
    try {
      const boardResponse = await apiClient.getBoardById(boardId!);
      setBoard(boardResponse.board);
      if (boardResponse.userRole) {
        setServerUserRole(boardResponse.userRole);
      }

      const notesResponse = await apiClient.getBoardNotes(boardId!);
      setNotes(notesResponse.notes);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = serverUserRole === 'owner' || (board && currentUser && board.owner._id === currentUser.id);

  const getCurrentUserRole = (): 'owner' | 'editor' | 'viewer' | null => {
    if (serverUserRole) return serverUserRole as 'owner' | 'editor' | 'viewer';
    if (!board || !currentUser) return null;
    if (board.owner._id === currentUser.id) return 'owner';
    const member = board.members.find(
      (m) => (typeof m.userId === 'string' ? m.userId : m.userId.id || m.userId._id) === currentUser.id
    );
    return member ? member.role : null;
  };

  const userRole = getCurrentUserRole();
  const isViewer = userRole === 'viewer';

  // ─── Inline editing handlers ──────────────────────────
  const startEditTitle = () => {
    if (!isOwner || !board) return;
    setEditTitle(board.title);
    setIsEditingTitle(true);
  };

  const submitEditTitle = () => {
    if (!board || !editTitle.trim() || editTitle.trim() === board.title) {
      setIsEditingTitle(false);
      return;
    }
    socketService.updateBoard({ boardId: boardId!, title: editTitle.trim() });
    setBoard((prev) => prev ? { ...prev, title: editTitle.trim() } : prev);
    setIsEditingTitle(false);
    addToast('Board title updated', 'success');
  };

  const startEditSprint = () => {
    if (!isOwner || !board) return;
    setEditSprint(board.sprintName);
    setIsEditingSprint(true);
  };

  const submitEditSprint = () => {
    if (!board || !editSprint.trim() || editSprint.trim() === board.sprintName) {
      setIsEditingSprint(false);
      return;
    }
    socketService.updateBoard({ boardId: boardId!, sprintName: editSprint.trim() });
    setBoard((prev) => prev ? { ...prev, sprintName: editSprint.trim() } : prev);
    setIsEditingSprint(false);
    addToast('Sprint name updated', 'success');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitEditTitle();
    if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const handleSprintKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitEditSprint();
    if (e.key === 'Escape') setIsEditingSprint(false);
  };

  // ─── Other handlers ──────────────────────────────────
  const handleAddMemberSuccess = async () => {
    try {
      const boardResponse = await apiClient.getBoardById(boardId!);
      setBoard(boardResponse.board);
      addToast('Member added successfully', 'success');
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
      addToast('Member removed', 'info');
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
      addToast(`Member role updated to ${newRole}`, 'success');
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/shared/${boardId}`;
    navigator.clipboard.writeText(shareUrl);
    addToast('Share link copied to clipboard!', 'success');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    addToast('Generating PDF…', 'info', 2000);
    try {
      await apiClient.exportBoardPDF(boardId!);
      addToast('PDF exported successfully!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBoardError = (message: string) => {
    addToast(message, 'error');
  };

  if (isLoading) {
    return <BoardSkeleton />;
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
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={submitEditTitle}
                onKeyDown={handleTitleKeyDown}
                className="board-title-input"
                maxLength={100}
              />
            ) : (
              <h1
                className={isOwner ? 'editable-title' : ''}
                onClick={startEditTitle}
                title={isOwner ? 'Click to rename' : ''}
              >
                {board.title}
                {isOwner && <span className="edit-hint">✏️</span>}
              </h1>
            )}
            {isEditingSprint ? (
              <input
                ref={sprintInputRef}
                type="text"
                value={editSprint}
                onChange={(e) => setEditSprint(e.target.value)}
                onBlur={submitEditSprint}
                onKeyDown={handleSprintKeyDown}
                className="board-sprint-input"
                maxLength={100}
              />
            ) : (
              <p
                className={`sprint-info${isOwner ? ' editable-sprint' : ''}`}
                onClick={startEditSprint}
                title={isOwner ? 'Click to rename sprint' : ''}
              >
                Sprint: {board.sprintName}
                {isOwner && <span className="edit-hint">✏️</span>}
              </p>
            )}
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
              onClick={handleExportPDF}
              className="export-pdf-button"
              disabled={isExporting}
              title="Export as PDF"
            >
              {isExporting ? '⏳' : '📄'} Export PDF
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

      <div className="board-container">
        <BoardView
          board={board}
          notes={notes}
          isGuest={false}
          isViewer={isViewer}
          onNotesChange={setNotes}
          onColumnsChange={(columns: Column[]) => setBoard(prev => prev ? { ...prev, columns } : prev)}
          onError={handleBoardError}
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