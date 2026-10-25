import React, { useState, useEffect } from 'react';
import { taskApi } from '../../services/taskApi';
import { analyticsApi } from '../../services/analyticsApi';
import { X, CheckSquare, Plus, AlertCircle, Clock, Calendar, Tag, Shield, User, Sparkles } from 'lucide-react';

export default function CreateTaskModal({ isOpen, onClose, project, projectId: propProjectId, initialStatus = 'To Do', onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Task');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState(initialStatus || 'To Do');
  const [assigneeId, setAssigneeId] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState(4);
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [recReason, setRecReason] = useState('');

  const effectiveProject = project || {};
  const effectiveProjectId = effectiveProject._id || propProjectId;

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  if (!isOpen || !effectiveProjectId) return null;

  const handleAutoSuggest = async () => {
    try {
      setRecReason('Evaluating workload capacity...');
      const res = await analyticsApi.recommendAssignee(effectiveProjectId, estimatedEffort);
      if (res.data?.bestMatch?.user) {
        setAssigneeId(res.data.bestMatch.user._id);
        setRecReason(`Suggested: ${res.data.bestMatch.user.name} (${res.data.bestMatch.fitScore} Fit Score)`);
      }
    } catch (err) {
      console.warn('Could not recommend assignee:', err);
      setRecReason('No candidate found.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || title.trim().length < 2) {
      setError('Task title must be at least 2 characters long.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await taskApi.createTask({
        projectId: effectiveProjectId,
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        status,
        assigneeId: assigneeId || undefined,
        estimatedEffort: Number(estimatedEffort),
        dueDate: dueDate || undefined,
        labels,
      });

      if (res.success && res.data?.task) {
        setTitle('');
        setDescription('');
        setType('Task');
        setPriority('Medium');
        setStatus('To Do');
        setAssigneeId('');
        setEstimatedEffort(4);
        setDueDate('');
        setLabels('');
        setRecReason('');
        if (onTaskCreated) onTaskCreated(res.data.task);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
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
        maxWidth: '560px',
        padding: '2rem',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckSquare size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Task</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Project: <strong style={{ color: 'var(--text-primary)' }}>{effectiveProject.name || 'Current project'}{effectiveProject.key ? ` (${effectiveProject.key})` : ''}</strong>
              </p>
            </div>
          </div>
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

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="input-group">
            <label className="input-label" htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              className="input-control"
              placeholder="e.g. Implement OAuth2 Refresh Token Flow"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Type & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="task-type">Task Type</label>
              <select
                id="task-type"
                className="input-control"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Task">Task (General work item)</option>
                <option value="Bug">Bug (Defect or error)</option>
                <option value="Feature">Feature (New capability)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                className="input-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Assignee & Initial Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="input-label" htmlFor="task-assignee">Assignee</label>
                <button
                  type="button"
                  onClick={handleAutoSuggest}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary-500)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Auto-evaluate team capacity and recommend optimal candidate"
                >
                  <Sparkles size={12} />
                  <span>Auto-Suggest</span>
                </button>
              </div>
              <select
                id="task-assignee"
                className="input-control"
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  setRecReason('');
                }}
              >
                <option value="">Unassigned</option>
                {(effectiveProject.members || []).map((m) => {
                  const u = m.user || {};
                  return (
                    <option key={u._id || m.user} value={u._id || m.user}>
                      {u.name || 'Member'} ({m.role || 'Member'})
                    </option>
                  );
                })}
              </select>
              {recReason && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '0.2rem' }}>
                  ✓ {recReason}
                </div>
              )}
            </div>


            <div className="input-group">
              <label className="input-label" htmlFor="task-status">Initial Status</label>
              <select
                id="task-status"
                className="input-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>

          {/* Estimated Effort & Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="task-effort">Estimated Effort (Hours)</label>
              <input
                id="task-effort"
                type="number"
                min="0"
                max="120"
                step="0.5"
                className="input-control"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="task-due">Due Date</label>
              <input
                id="task-due"
                type="date"
                className="input-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Labels */}
          <div className="input-group">
            <label className="input-label" htmlFor="task-labels">Labels (comma-separated)</label>
            <input
              id="task-labels"
              type="text"
              className="input-control"
              placeholder="e.g. backend, security, api"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className="input-control"
              placeholder="Describe requirements, reproduction steps, or acceptance criteria"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Plus size={16} />
              <span>{submitting ? 'Creating...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
