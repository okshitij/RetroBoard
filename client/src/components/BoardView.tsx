import React, { useState, useEffect, useRef } from 'react';
import type { Board, Note, Column } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '../services/socketService';
import NoteCard from './NoteCard';
import AddNoteForm from './AddNoteForm';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── SortableColumn wrapper ──────────────────────────────────

interface SortableColumnProps {
  column: Column;
  canDrag: boolean;
  children: React.ReactNode;
}

const SortableColumn: React.FC<SortableColumnProps> = ({ column, canDrag, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
    disabled: !canDrag,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`board-column sortable-column${isDragging ? ' dragging' : ''}`}
    >
      {canDrag && (
        <button
          className="column-drag-handle"
          {...attributes}
          {...listeners}
          title="Drag to reorder column"
        >
          ⠿
        </button>
      )}
      {children}
    </div>
  );
};

// ─── DroppableColumnArea ─────────────────────────────────────

interface DroppableColumnAreaProps {
  columnId: string;
  children: React.ReactNode;
}

const DroppableColumnArea: React.FC<DroppableColumnAreaProps> = ({ columnId, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-drop-${columnId}`,
    data: { type: 'column-drop', columnId },
  });

  return (
    <div ref={setNodeRef} className={`column-notes${isOver ? ' drag-over-area' : ''}`}>
      {children}
    </div>
  );
};

// ─── DraggableNote wrapper ───────────────────────────────────

interface DraggableNoteProps {
  note: Note;
  canDrag: boolean;
  children: React.ReactNode;
}

const DraggableNote: React.FC<DraggableNoteProps> = ({ note, canDrag, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note._id,
    data: { type: 'note', noteId: note._id },
    disabled: !canDrag,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-note${isDragging ? ' dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

// ─── BoardView ───────────────────────────────────────────────

interface BoardViewProps {
  board: Board;
  notes: Note[];
  isGuest: boolean;
  isViewer?: boolean;
  onNotesChange: React.Dispatch<React.SetStateAction<Note[]>>;
  onColumnsChange?: (columns: Column[]) => void;
  onError?: (error: string) => void;
}

const BoardView: React.FC<BoardViewProps> = ({
  board,
  notes,
  isGuest,
  isViewer = false,
  onNotesChange,
  onColumnsChange,
  onError,
}) => {
  const [isAddingNote, setIsAddingNote] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<'note' | 'column' | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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

    const handleColumnAdded = (data: { column: Column; columns: Column[] }) => {
      if (onColumnsChange) {
        onColumnsChange(data.columns);
      }
    };

    const handleColumnRenamed = (data: { columnId: string; title: string; columns: Column[] }) => {
      if (onColumnsChange) {
        onColumnsChange(data.columns);
      }
    };

    const handleColumnDeleted = (data: { columnId: string; columns: Column[] }) => {
      if (onColumnsChange) {
        onColumnsChange(data.columns);
      }
      // Remove notes that belonged to the deleted column
      onNotesChange((prevNotes) => prevNotes.filter((n) => n.columnId !== data.columnId));
    };

    const handleNoteMoved = (data: { noteId: string; targetColumnId: string }) => {
      onNotesChange((prevNotes) =>
        prevNotes.map((n) =>
          n._id === data.noteId ? { ...n, columnId: data.targetColumnId } : n
        )
      );
    };

    const handleColumnsReordered = (data: { columns: Column[] }) => {
      if (onColumnsChange) {
        onColumnsChange(data.columns);
      }
    };

    const handleSocketError = (error: any) => {
      const message = error?.message || 'An error occurred';
      if (onError) onError(message);
      console.error('Socket error:', message);
    };

    socketService.onNoteAdded(handleNoteAdded);
    socketService.onNoteUpdated(handleNoteUpdated);
    socketService.onNoteDeleted(handleNoteDeleted);
    socketService.onNoteVoted(handleNoteVoted);
    socketService.onColumnAdded(handleColumnAdded);
    socketService.onColumnRenamed(handleColumnRenamed);
    socketService.onColumnDeleted(handleColumnDeleted);
    socketService.onNoteMoved(handleNoteMoved);
    socketService.onColumnsReordered(handleColumnsReordered);
    socketService.onError(handleSocketError);

    return () => {
      socketService.off('note:added', handleNoteAdded);
      socketService.off('note:updated', handleNoteUpdated);
      socketService.off('note:deleted', handleNoteDeleted);
      socketService.off('note:voted', handleNoteVoted);
      socketService.off('column:added', handleColumnAdded);
      socketService.off('column:renamed', handleColumnRenamed);
      socketService.off('column:deleted', handleColumnDeleted);
      socketService.off('note:moved', handleNoteMoved);
      socketService.off('column:reordered', handleColumnsReordered);
      socketService.off('error', handleSocketError);
      socketService.leaveBoard(board._id);
    };
  }, [board._id, onNotesChange, onColumnsChange, onError]);

  // Auto-focus inputs when editing/adding
  useEffect(() => {
    if (editingColumnId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingColumnId]);

  useEffect(() => {
    if (isAddingColumn && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAddingColumn]);

  const handleAddNote = (columnId: string, content: string) => {
    if (isGuest || isViewer || !user) return;

    socketService.addNote({
      boardId: board._id,
      columnId,
      content,
      authorId: user.id,
    });
    setIsAddingNote(null);
  };

  const handleUpdateNote = (noteId: string, content: string) => {
    if (isGuest || isViewer) return;

    socketService.updateNote({
      noteId,
      content,
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (isGuest || isViewer) return;

    socketService.deleteNote(noteId);
  };

  const handleVoteNote = (noteId: string) => {
    if (isGuest || isViewer || !user) return;

    socketService.voteNote({
      noteId,
      userId: user.id,
    });
  };

  // ─── Column handlers ──────────────────────────────────────

  const startRenameColumn = (column: Column) => {
    setEditingColumnId(column.id);
    setEditingColumnTitle(column.title);
  };

  const submitRenameColumn = () => {
    if (!editingColumnId || !editingColumnTitle.trim()) {
      setEditingColumnId(null);
      return;
    }

    // Don't emit if title unchanged
    const currentCol = board.columns.find(c => c.id === editingColumnId);
    if (currentCol && currentCol.title === editingColumnTitle.trim()) {
      setEditingColumnId(null);
      return;
    }

    socketService.renameColumn({
      boardId: board._id,
      columnId: editingColumnId,
      title: editingColumnTitle.trim(),
    });
    setEditingColumnId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRenameColumn();
    } else if (e.key === 'Escape') {
      setEditingColumnId(null);
    }
  };

  const submitAddColumn = () => {
    if (!newColumnTitle.trim()) {
      setIsAddingColumn(false);
      return;
    }

    socketService.addColumn({
      boardId: board._id,
      title: newColumnTitle.trim(),
    });
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const handleAddColumnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitAddColumn();
    } else if (e.key === 'Escape') {
      setIsAddingColumn(false);
      setNewColumnTitle('');
    }
  };

  const handleDeleteColumn = (column: Column) => {
    const noteCount = notes.filter(n => n.columnId === column.id).length;
    const message = noteCount > 0
      ? `Delete column "${column.title}"? This will also delete ${noteCount} note${noteCount > 1 ? 's' : ''} in it.`
      : `Delete column "${column.title}"?`;

    if (!window.confirm(message)) return;

    socketService.deleteColumn({
      boardId: board._id,
      columnId: column.id,
    });
  };

  const getNotesForColumn = (columnId: string) => {
    return notes.filter(note => note.columnId === columnId);
  };

  // ─── Drag handlers ────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'note') {
      setActiveDragId(activeData.noteId as string);
      setActiveDragType('note');
    } else if (activeData?.type === 'column') {
      setActiveDragId(activeData.columnId as string);
      setActiveDragType('column');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragId(null);
    setActiveDragType(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // ── Note dropped onto a column drop zone ──
    if (activeData?.type === 'note') {
      const noteId = activeData.noteId as string;
      let targetColumnId: string | null = null;

      // Dropped on a column drop zone
      if (overData?.type === 'column-drop') {
        targetColumnId = overData.columnId as string;
      }
      // Dropped on another note — find that note's column
      else if (overData?.type === 'note') {
        const overNoteId = overData.noteId as string;
        const overNote = notes.find(n => n._id === overNoteId);
        if (overNote) {
          targetColumnId = overNote.columnId;
        }
      }
      // Dropped on a column sortable (the column itself)
      else if (overData?.type === 'column') {
        targetColumnId = overData.columnId as string;
      }

      if (!targetColumnId) return;

      // Find the note being dragged
      const draggedNote = notes.find(n => n._id === noteId);
      if (!draggedNote) return;

      // Only move if changing columns
      if (draggedNote.columnId === targetColumnId) return;

      // Optimistic update
      onNotesChange((prevNotes) =>
        prevNotes.map((n) =>
          n._id === noteId ? { ...n, columnId: targetColumnId! } : n
        )
      );

      // Emit socket event
      socketService.moveNote({
        boardId: board._id,
        noteId,
        targetColumnId,
      });
    }

    // ── Column reordered ──
    if (activeData?.type === 'column' && overData?.type === 'column') {
      const activeColumnId = active.id as string;
      const overColumnId = over.id as string;

      if (activeColumnId === overColumnId) return;

      const oldIndex = board.columns.findIndex(c => c.id === activeColumnId);
      const newIndex = board.columns.findIndex(c => c.id === overColumnId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newColumns = arrayMove(board.columns, oldIndex, newIndex).map((col, idx) => ({
        ...col,
        order: idx,
      }));

      // Optimistic update
      if (onColumnsChange) {
        onColumnsChange(newColumns);
      }

      // Emit socket event
      socketService.reorderColumns({
        boardId: board._id,
        columnIds: newColumns.map(c => c.id),
      });
    }
  };

  const canDrag = !isGuest && !isViewer;
  const canAddNotes = !isGuest && !isViewer;
  const canEditColumns = !isGuest && !isViewer;
  const canDeleteColumns = canEditColumns && board.columns.length > 1;

  // Find the active note/column for DragOverlay
  const activeNote = activeDragType === 'note' ? notes.find(n => n._id === activeDragId) : null;
  const activeColumn = activeDragType === 'column' ? board.columns.find(c => c.id === activeDragId) : null;

  const columnIds = board.columns.map(c => c.id);

  return (
    <div className="board-view">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <div className="board-columns">
            {board.columns.map((column) => (
              <SortableColumn key={column.id} column={column} canDrag={canDrag}>
                <div className="column-header">
                  {editingColumnId === column.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingColumnTitle}
                      onChange={(e) => setEditingColumnTitle(e.target.value)}
                      onBlur={submitRenameColumn}
                      onKeyDown={handleRenameKeyDown}
                      className="column-title-input"
                      maxLength={50}
                    />
                  ) : (
                    <h3
                      className={canEditColumns ? 'column-title-editable' : ''}
                      onClick={() => canEditColumns && startRenameColumn(column)}
                      title={canEditColumns ? 'Click to rename' : ''}
                    >
                      {column.title}
                      {canEditColumns && <span className="edit-icon">✏️</span>}
                    </h3>
                  )}
                  <div className="column-header-actions">
                    {canDeleteColumns && (
                      <button
                        onClick={() => handleDeleteColumn(column)}
                        className="delete-column-button"
                        title="Delete column"
                      >
                        🗑️
                      </button>
                    )}
                    {canAddNotes && (
                      <button
                        onClick={() => setIsAddingNote(column.id)}
                        className="add-note-button"
                        disabled={isAddingNote === column.id}
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
                <DroppableColumnArea columnId={column.id}>
                  {getNotesForColumn(column.id).map((note) => (
                    <DraggableNote key={note._id} note={note} canDrag={canDrag}>
                      <NoteCard
                        note={note}
                        isGuest={isGuest}
                        isViewer={isViewer}
                        currentUserId={user?.id}
                        onUpdate={(content) => handleUpdateNote(note._id, content)}
                        onDelete={() => handleDeleteNote(note._id)}
                        onVote={() => handleVoteNote(note._id)}
                      />
                    </DraggableNote>
                  ))}
                  {isAddingNote === column.id && (
                    <AddNoteForm
                      onAdd={(content) => handleAddNote(column.id, content)}
                      onCancel={() => setIsAddingNote(null)}
                      isViewer={isViewer}
                      isGuest={isGuest}
                    />
                  )}
                </DroppableColumnArea>
              </SortableColumn>
            ))}

            {/* Add Column Card */}
            {canEditColumns && (
              <div className="board-column add-column-card">
                {isAddingColumn ? (
                  <div className="add-column-form">
                    <input
                      ref={addInputRef}
                      type="text"
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      onBlur={submitAddColumn}
                      onKeyDown={handleAddColumnKeyDown}
                      className="column-title-input"
                      placeholder="Column name..."
                      maxLength={50}
                    />
                    <div className="add-column-actions">
                      <button onClick={submitAddColumn} className="add-column-confirm" disabled={!newColumnTitle.trim()}>
                        Add
                      </button>
                      <button
                        onClick={() => { setIsAddingColumn(false); setNewColumnTitle(''); }}
                        className="add-column-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="add-column-button"
                  >
                    <span className="add-column-icon">+</span>
                    <span>Add Column</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeNote && (
            <div className="drag-overlay">
              <NoteCard
                note={activeNote}
                isGuest={isGuest}
                isViewer={isViewer}
                currentUserId={user?.id}
                onUpdate={() => {}}
                onDelete={() => {}}
                onVote={() => {}}
              />
            </div>
          )}
          {activeColumn && (
            <div className="drag-overlay board-column">
              <div className="column-header">
                <h3>{activeColumn.title}</h3>
              </div>
              <div className="column-notes">
                {getNotesForColumn(activeColumn.id).map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    isGuest={isGuest}
                    isViewer={isViewer}
                    currentUserId={user?.id}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                    onVote={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default BoardView;