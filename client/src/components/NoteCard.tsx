import React, { useState } from 'react';
import type { Note, User } from '../types';

interface NoteCardProps {
  note: Note;
  isGuest: boolean;
  isViewer?: boolean;
  currentUserId?: string;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onVote: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isGuest,
  isViewer = false,
  currentUserId: _currentUserId,
  onUpdate,
  onDelete,
  onVote,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const canEdit = !isGuest && !isViewer;
  const canVote = !isGuest && !isViewer;

  const getUserName = (user: User | string | undefined): string => {
    if (!user) return 'Unknown';
    return typeof user === 'string' ? user : user.username;
  };

  const getAuthorName = (): string => {
    return getUserName(note.author);
  };

  const getLastModifiedInfo = (): string | null => {
    if (!note.lastModifiedBy || !note.lastModifiedAt) return null;
    const modifiedBy = getUserName(note.lastModifiedBy);
    const modifiedDate = new Date(note.lastModifiedAt).toLocaleDateString();
    return `${modifiedBy} on ${modifiedDate}`;
  };

  const handleSave = () => {
    if (editContent.trim() !== note.content) {
      onUpdate(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const lastModifiedInfo = getLastModifiedInfo();

  return (
    <div className="note-card">
      {isEditing ? (
        <div className="note-edit">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="note-textarea"
          />
          <div className="note-actions">
            <button onClick={handleSave} className="save-button">
              Save
            </button>
            <button onClick={handleCancel} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="note-content">
          <p className="note-text">{note.content}</p>

          {isViewer && (
            <div className="viewer-badge">
              View-only mode
            </div>
          )}

          <div className="note-meta">
            <div className="note-author">
              By {getAuthorName()}
            </div>
            {lastModifiedInfo && (
              <div className="note-last-modified" title={lastModifiedInfo}>
                Modified: {lastModifiedInfo}
              </div>
            )}
          </div>

          <div className="note-footer">
            <div className="note-votes">
              <button
                onClick={onVote}
                disabled={!canVote}
                className={`vote-button ${note.votes.length > 0 ? 'voted' : ''}`}
                title={!canVote ? 'Viewers cannot vote' : 'Vote on this note'}
              >
                👍 {note.votes.length}
              </button>
            </div>
            {canEdit && (
              <div className="note-controls">
                <button
                  onClick={() => setIsEditing(true)}
                  className="edit-button"
                  title="Edit note"
                >
                  ✏️
                </button>
                <button
                  onClick={onDelete}
                  className="delete-button"
                  title="Delete note"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;