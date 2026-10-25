import React, { useState, useEffect } from 'react';
import { taskApi } from '../../services/taskApi';
import DependencySelector from './DependencySelector';
import CommentSection from './CommentSection';
import { 
  X, 
  Trash2, 
  Save, 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  AlertCircle, 
  Check, 
  Sparkles,
  Bug,
  CheckSquare
} from 'lucide-react';

export default function TaskDetailModal({ isOpen, onClose, task, project, onTaskUpdated, onTaskDeleted, allProjectTasks = [] }) {

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    type: 'Task',
    assignee: '',
    estimatedEffort: 4,
    actualEffort: 0,
    dueDate: '',
    labels: '',
  });
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'To Do',
        priority: task.priority || 'Medium',
        type: task.type || 'Task',
        assignee: task.assignee?._id || task.assignee || '',
        estimatedEffort: task.estimatedEffort || 4,
        actualEffort: task.actualEffort || 0,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        labels: task.labels ? task.labels.join(', ') : '',
      });
      setError(null);
      setSaveSuccess(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || form.title.trim().length < 2) {
      setError('Title must be at least 2 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await taskApi.updateTask(task._id, {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        type: form.type,
        assignee: form.assignee || null,
        estimatedEffort: Number(form.estimatedEffort),
        actualEffort: Number(form.actualEffort),
        dueDate: form.dueDate || null,
        labels: form.labels,
      });

      if (res.success && res.data?.task) {
        setSaveSuccess(true);
        if (onTaskUpdated) onTaskUpdated(res.data.task);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete task ${task.taskKey}?`)) {
      return;
    }

    setDeleting(true);
    try {
      await taskApi.deleteTask(task._id);
      if (onTaskDeleted) onTaskDeleted(task._id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 15, 29, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '640px',
        padding: '2rem',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header with Key, Status, Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.875rem',
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--primary-500)',
              border: '1px solid var(--border-default)',
            }}>
              {task.taskKey}
            </span>
            <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
              {form.type}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-secondary btn-sm"
              disabled={deleting}
              style={{ color: 'var(--color-danger)' }}
              title="Delete task"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            fontSize: '0.8125rem',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            color: 'var(--color-success)',
            fontSize: '0.8125rem',
          }}>
            <Check size={16} />
            <span>Task updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Title */}
          <div className="input-group">
            <label className="input-label" htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              name="title"
              type="text"
              className="input-control"
              value={form.title}
              onChange={handleChange}
              style={{ fontSize: '1.0625rem', fontWeight: 600 }}
              required
            />
          </div>

          {/* Status, Priority, Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                name="status"
                className="input-control"
                value={form.status}
                onChange={handleChange}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                name="priority"
                className="input-control"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-type">Type</label>
              <select
                id="edit-type"
                name="type"
                className="input-control"
                value={form.type}
                onChange={handleChange}
              >
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="edit-assignee">Assignee</label>
              <select
                id="edit-assignee"
                name="assignee"
                className="input-control"
                value={form.assignee}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {project?.members?.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-due">Due Date</label>
              <input
                id="edit-due"
                name="dueDate"
                type="date"
                className="input-control"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Effort Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="edit-est">Estimated Effort (h)</label>
              <input
                id="edit-est"
                name="estimatedEffort"
                type="number"
                min="0"
                step="0.5"
                className="input-control"
                value={form.estimatedEffort}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-act">Actual Effort Logged (h)</label>
              <input
                id="edit-act"
                name="actualEffort"
                type="number"
                min="0"
                step="0.5"
                className="input-control"
                value={form.actualEffort}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Labels */}
          <div className="input-group">
            <label className="input-label" htmlFor="edit-labels">Labels (comma-separated)</label>
            <input
              id="edit-labels"
              name="labels"
              type="text"
              className="input-control"
              placeholder="e.g. backend, security, api"
              value={form.labels}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label" htmlFor="edit-desc">Description</label>
            <textarea
              id="edit-desc"
              name="description"
              className="input-control"
              value={form.description}
              onChange={handleChange}
              rows={4}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Task Dependencies */}
          <DependencySelector
            task={task}
            allProjectTasks={allProjectTasks}
            onDependenciesUpdated={onTaskUpdated}
          />

          {/* Activity & Comments Thread */}
          <CommentSection taskId={task._id} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Save size={16} />
              <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
