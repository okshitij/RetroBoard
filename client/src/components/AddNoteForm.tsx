import React, { useState } from 'react';

interface AddNoteFormProps {
  onAdd: (content: string) => void;
  onCancel: () => void;
}

const AddNoteForm: React.FC<AddNoteFormProps> = ({ onAdd, onCancel }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAdd(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

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