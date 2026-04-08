import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api';

const CreateBoardPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [sprintName, setSprintName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.createBoard(title, sprintName);
      navigate(`/boards/${response.board._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-board-container">
      <div className="create-board-card">
        <h1>Create New Retro Board</h1>
        <form onSubmit={handleSubmit} className="create-board-form">
          <div className="form-group">
            <label htmlFor="title">Board Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sprint 42 Retrospective"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="sprintName">Sprint Name</label>
            <input
              type="text"
              id="sprintName"
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              placeholder="e.g., Sprint 42"
              required
              disabled={isLoading}
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="create-button">
              {isLoading ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
        <div className="board-preview">
          <h3>Default Columns</h3>
          <div className="columns-preview">
            <div className="column-preview">Went Well</div>
            <div className="column-preview">Needs Improvement</div>
            <div className="column-preview">Action Items</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBoardPage;