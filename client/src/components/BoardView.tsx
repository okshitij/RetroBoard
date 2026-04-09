import React, { useState, useEffect } from 'react';
import type { Board, Note } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '../services/socketService';
import NoteCard from './NoteCard';
import AddNoteForm from './AddNoteForm';

interface BoardViewProps {
  board: Board;
  notes: Note[];
  isGuest: boolean;
  onNotesChange: React.Dispatch<React.SetStateAction<Note[]>>;
}

const BoardView: React.FC<BoardViewProps> = ({ board, notes, isGuest, onNotesChange }) => {
  const [isAddingNote, setIsAddingNote] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    socketService.joinBoard(board._id);

    const handleNoteAdded = (note: Note) => {
      onNotesChange((prevNotes) => [...prevNotes, note]);
    };

    const handleNoteUpdated = (note: Note) => {
      onNotesChange((prevNotes) => prevNotes.map((n) => (n._id === note._id ? note : n)));
    };

    const handleNoteDeleted = (noteId: string) => {
      onNotesChange((prevNotes) => prevNotes.filter((n) => n._id !== noteId));
    };

    const handleNoteVoted = (note: Note) => {
      onNotesChange((prevNotes) => prevNotes.map((n) => (n._id === note._id ? note : n)));
    };

    socketService.onNoteAdded(handleNoteAdded);
    socketService.onNoteUpdated(handleNoteUpdated);
    socketService.onNoteDeleted(handleNoteDeleted);
    socketService.onNoteVoted(handleNoteVoted);

    return () => {
      socketService.off('note:added', handleNoteAdded);
      socketService.off('note:updated', handleNoteUpdated);
      socketService.off('note:deleted', handleNoteDeleted);
      socketService.off('note:voted', handleNoteVoted);
      socketService.leaveBoard(board._id);
    };
  }, [board._id, onNotesChange]);

  const handleAddNote = (columnId: string, content: string) => {
    if (isGuest || !user) return;

    socketService.addNote({
      boardId: board._id,
      columnId,
      content,
      authorId: user.id,
    });
    setIsAddingNote(null);
  };

  const handleUpdateNote = (noteId: string, content: string) => {
    if (isGuest) return;

    socketService.updateNote({
      noteId,
      content,
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (isGuest) return;

    socketService.deleteNote(noteId);
  };

  const handleVoteNote = (noteId: string) => {
    if (isGuest || !user) return;

    socketService.voteNote({
      noteId,
      userId: user.id,
    });
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