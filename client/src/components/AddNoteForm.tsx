import React, { useState } from 'react';

interface AddNoteFormProps {
  onAdd: (content: string) => void;
  onCancel: () => void;
  isViewer?: boolean;
  isGuest?: boolean;
}

const AddNoteForm: React.FC<AddNoteFormProps> = ({
  onAdd,
  onCancel,
  isViewer = false,
  isGuest = false,
}) => {
  const [content, setContent] = useState('');

  const isDisabled = isViewer || isGuest;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isDisabled) {
      onAdd(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (isDisabled) {
    return (
      <div className="add-note-form disabled">
        <div className="disabled-message">
          {isGuest ? 'Guests cannot add notes. View the shared board.' : 'Only editors can add notes to this board.'}
        </div>
      </div>
    );
  }

  return (
    <div className="add-note-form">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What went well? What needs improvement? What action items do we have?"
          autoFocus
          className="add-note-textarea"
          rows={3}
        />
        <div className="add-note-actions">
          <button type="submit" disabled={!content.trim()} className="add-button">
            Add Note
          </button>
          <button type="button" onClick={onCancel} className="cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddNoteForm;