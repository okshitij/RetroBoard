import React, { useState } from 'react';
import type { Board, Note } from '../types';
import { apiClient } from '../api';
import NoteCard from './NoteCard';
import AddNoteForm from './AddNoteForm';

interface BoardViewProps {
  board: Board;
  notes: Note[];
  isGuest: boolean;
  onNotesChange: (notes: Note[]) => void;
}

const BoardView: React.FC<BoardViewProps> = ({ board, notes, isGuest, onNotesChange }) => {
  const [isAddingNote, setIsAddingNote] = useState<string | null>(null);

  const handleAddNote = async (columnId: string, content: string) => {
    if (isGuest) return;

    try {
      const response = await apiClient.createNote(board._id, columnId, content);
      onNotesChange([...notes, response.note]);
      setIsAddingNote(null);
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    if (isGuest) return;

    try {
      const response = await apiClient.updateNote(noteId, content);
      onNotesChange(notes.map(note =>
        note._id === noteId ? response.note : note
      ));
    } catch (error) {
      console.error('Failed to update note:', error);
      alert('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isGuest) return;

    try {
      await apiClient.deleteNote(noteId);
      onNotesChange(notes.filter(note => note._id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  const handleVoteNote = async (noteId: string) => {
    if (isGuest) return;

    try {
      const response = await apiClient.voteNote(noteId);
      onNotesChange(notes.map(note =>
        note._id === noteId ? response.note : note
      ));
    } catch (error) {
      console.error('Failed to vote note:', error);
      alert('Failed to vote note');
    }
  };

  const getNotesForColumn = (columnId: string) => {
    return notes.filter(note => note.columnId === columnId);
  };

  return (
    <div className="board-view">
      <div className="board-columns">
        {board.columns.map((column) => (
          <div key={column.id} className="board-column">
            <div className="column-header">
              <h3>{column.title}</h3>
              {!isGuest && (
                <button
                  onClick={() => setIsAddingNote(column.id)}
                  className="add-note-button"
                  disabled={isAddingNote === column.id}
                >
                  +
                </button>
              )}
            </div>
            <div className="column-notes">
              {getNotesForColumn(column.id).map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  isGuest={isGuest}
                  onUpdate={(content) => handleUpdateNote(note._id, content)}
                  onDelete={() => handleDeleteNote(note._id)}
                  onVote={() => handleVoteNote(note._id)}
                />
              ))}
              {isAddingNote === column.id && (
                <AddNoteForm
                  onAdd={(content) => handleAddNote(column.id, content)}
                  onCancel={() => setIsAddingNote(null)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardView;