import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../api';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import type { Board } from '../types';

type SortOption = 'newest' | 'oldest' | 'az' | 'za';
type TabOption = 'all' | 'mine' | 'shared';

const DashboardPage: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeTab, setActiveTab] = useState<TabOption>('all');
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const response = await apiClient.getUserBoards();
      setBoards(response.boards);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to load boards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleShare = (boardId: string) => {
    const shareUrl = `${window.location.origin}/shared/${boardId}`;
    navigator.clipboard.writeText(shareUrl);
    addToast('Share link copied to clipboard!', 'success');
  };

  const handleDeleteBoard = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteBoard(deleteTarget._id);
      setBoards((prev) => prev.filter((b) => b._id !== deleteTarget._id));
      addToast(`"${deleteTarget.title}" deleted successfully`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete board', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const isBoardOwner = (board: Board) => {
    const ownerId = typeof board.owner === 'object' ? (board.owner._id || board.owner.id) : board.owner;
    return ownerId === user?.id;
  };

  // ─── Filtering, sorting, tabs ───────────────────────────
  const filteredBoards = useMemo(() => {
    let result = [...boards];

    // Tab filter
    if (activeTab === 'mine') {
      result = result.filter((b) => isBoardOwner(b));
    } else if (activeTab === 'shared') {
      result = result.filter((b) => !isBoardOwner(b));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.sprintName.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return result;
  }, [boards, searchQuery, sortBy, activeTab, user]);

  // Tab counts
  const myBoardsCount = boards.filter((b) => isBoardOwner(b)).length;
  const sharedBoardsCount = boards.length - myBoardsCount;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>RetroBoard</h1>
          <div className="user-info">
            <span>Welcome, {user?.username}!</span>
            <Link to="/profile" className="profile-link" title="Profile">
              👤
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-actions">
          <Link to="/boards/create" className="create-board-button">
            + Create New Board
          </Link>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab${activeTab === 'all' ? ' active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Boards <span className="tab-count">{boards.length}</span>
          </button>
          <button
            className={`dashboard-tab${activeTab === 'mine' ? ' active' : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            My Boards <span className="tab-count">{myBoardsCount}</span>
          </button>
          <button
            className={`dashboard-tab${activeTab === 'shared' ? ' active' : ''}`}
            onClick={() => setActiveTab('shared')}
          >
            Shared With Me <span className="tab-count">{sharedBoardsCount}</span>
          </button>
        </div>

        {/* Search & Sort */}
        <div className="dashboard-filters">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search boards by title or sprint…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              id="board-search"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="sort-select"
            id="board-sort"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>

        <div className="boards-grid">
          {boards.length === 0 ? (
            <EmptyState
              icon="🚀"
              title="No boards yet"
              description="Create your first retrospective board to start capturing team feedback."
              actionLabel="Create Your First Board"
              actionHref="/boards/create"
            />
          ) : filteredBoards.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No matching boards"
              description={`No boards match "${searchQuery}". Try a different search term or change the filter.`}
              actionLabel="Clear Search"
              onAction={() => { setSearchQuery(''); setActiveTab('all'); }}
            />
          ) : (
            filteredBoards.map((board) => (
              <div key={board._id} className="board-card">
                <div className="board-card-header">
                  <h3>{board.title}</h3>
                  {!isBoardOwner(board) && <span className="shared-badge">Shared</span>}
                </div>
                <p className="board-sprint">Sprint: {board.sprintName}</p>
                <p className="board-meta">
                  Created {new Date(board.createdAt).toLocaleDateString()}
                  {typeof board.owner === 'object' && board.owner.username && !isBoardOwner(board) && (
                    <> · by {board.owner.username}</>
                  )}
                </p>
                <div className="board-actions">
                  <Link to={`/boards/${board._id}`} className="board-link">
                    Open Board
                  </Link>
                  <button
                    onClick={() => handleShare(board._id)}
                    className="share-button"
                  >
                    Share
                  </button>
                  {isBoardOwner(board) && (
                    <button
                      onClick={() => setDeleteTarget(board)}
                      className="delete-board-button"
                      title="Delete board"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Board"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently remove all notes, activity logs, and member associations. This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete Board'}
        variant="danger"
        onConfirm={handleDeleteBoard}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default DashboardPage;