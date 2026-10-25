import React, { useState } from 'react';
import KanbanColumn from './KanbanColumn';
import { taskApi } from '../../services/taskApi';

const COLUMNS = [
  { id: 'To Do', title: 'To Do', dotClass: 'status-dot-todo' },
  { id: 'In Progress', title: 'In Progress', dotClass: 'status-dot-progress' },
  { id: 'Blocked', title: 'Blocked', dotClass: 'status-dot-blocked' },
  { id: 'Done', title: 'Done', dotClass: 'status-dot-done' },
];

export default function KanbanBoard({
  tasks = [],
  onTaskClick,
  onTaskUpdated,
  onQuickAddTask,
}) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropTask = async (newStatus) => {
    if (!draggedTask) return;
    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    const taskId = draggedTask._id;
    const previousStatus = draggedTask.status;

    try {
      setErrorMsg('');
      // Optimistic update in parent via onTaskUpdated callback
      await taskApi.updateTask(taskId, { status: newStatus });
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (err) {
      console.error('Failed to move task:', err);
      setErrorMsg(err.response?.data?.message || 'Could not move task.');
      if (onTaskUpdated) {
        onTaskUpdated(); // re-fetch to restore consistent state
      }
    } finally {
      setDraggedTask(null);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{errorMsg}</span>
          <button
            className="btn btn-ghost"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => setErrorMsg('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <KanbanColumn
              key={col.id}
              title={col.title}
              status={col.id}
              dotClass={col.dotClass}
              tasks={colTasks}
              onTaskClick={onTaskClick}
              onDragStart={handleDragStart}
              onDropTask={handleDropTask}
              onQuickAddTask={onQuickAddTask}
            />
          );
        })}
      </div>
    </div>
  );
}
