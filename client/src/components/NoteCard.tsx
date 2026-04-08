import React, { useState } from 'react';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  isGuest: boolean;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onVote: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isGuest, onUpdate, onDelete, onVote }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

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
          <div className="note-footer">
            <div className="note-votes">
              <button
                onClick={onVote}
                disabled={isGuest}
                className={`vote-button ${note.votes.length > 0 ? 'voted' : ''}`}
              >
                👍 {note.votes.length}
              </button>
            </div>
            {!isGuest && (
              <div className="note-controls">
                <button
                  onClick={() => setIsEditing(true)}
                  className="edit-button"
                >
                  ✏️
                </button>
                <button
                  onClick={onDelete}
                  className="delete-button"
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