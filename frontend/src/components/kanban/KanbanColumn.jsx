import React, { useState } from 'react';
import TaskCard from '../tasks/TaskCard';
import { Plus } from 'lucide-react';

export default function KanbanColumn({
  title,
  status,
  dotClass,
  tasks = [],
  onTaskClick,
  onDragStart,
  onDropTask,
  onQuickAddTask,
}) {
  const [isOver, setIsOver] = useState(false);

  const totalEffort = tasks.reduce((sum, t) => sum + (Number(t.estimatedEffort) || 0), 0);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set isOver false if leaving the column element entirely
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    onDropTask(status);
  };

  return (
    <div
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title-group">
          <span className={`status-dot ${dotClass}`} />
          <span className="kanban-column-title">{title}</span>
          <span className="kanban-count-badge">{tasks.length}</span>
        </div>
        {totalEffort > 0 && (
          <span className="kanban-column-effort" title="Total estimated hours in this column">
            {totalEffort}h
          </span>
        )}
      </div>

      {/* Droppable Task List */}
      <div className="kanban-task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={onTaskClick}
            onDragStart={onDragStart}
          />
        ))}

        {tasks.length === 0 && (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              margin: 'auto 0',
            }}
          >
            Drop tasks here or click below to create
          </div>
        )}

        {onQuickAddTask && (
          <button
            className="btn btn-ghost"
            onClick={() => onQuickAddTask(status)}
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: '0.8125rem',
              padding: '0.5rem',
              color: 'var(--text-secondary)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              marginTop: '0.25rem',
            }}
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        )}
      </div>
    </div>
  );
}
