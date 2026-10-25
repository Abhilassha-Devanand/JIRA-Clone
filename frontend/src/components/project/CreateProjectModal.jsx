import React, { useState, useEffect } from 'react';
import { projectApi } from '../../services/projectApi';
import { useWorkspace } from '../../context/WorkspaceContext';
import { X, FolderKanban, Plus, AlertCircle, Calendar, Shield } from 'lucide-react';

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { currentWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [status, setStatus] = useState('Active');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Set default PM to workspace owner or first admin
  useEffect(() => {
    if (currentWorkspace?.members?.length > 0 && !projectManagerId) {
      setProjectManagerId(currentWorkspace.members[0].user._id);
    }
  }, [currentWorkspace, projectManagerId]);

  // Auto-generate project key from name if not manually edited
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!keyManuallyEdited) {
      const generated = val
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 5);
      setKey(generated || (val.length >= 2 ? val.substring(0, 3).toUpperCase() : ''));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setError('Project name must be at least 2 characters long.');
      return;
    }

    if (!key || key.trim().length < 2) {
      setError('Project key must be at least 2 uppercase alphanumeric characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await projectApi.createProject({
        workspaceId: currentWorkspace._id,
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        projectManagerId: projectManagerId || undefined,
        status,
        dueDate: dueDate || undefined,
      });

      if (res.success && res.data?.project) {
        setName('');
        setKey('');
        setDescription('');
        setDueDate('');
        setKeyManuallyEdited(false);
        if (onProjectCreated) onProjectCreated(res.data.project);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create project');
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
        maxWidth: '520px',
        padding: '2rem',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FolderKanban size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Create New Project</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Scoped under: <strong style={{ color: 'var(--text-primary)' }}>{currentWorkspace?.name}</strong>
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
          {/* Project Name & Key */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="proj-name">Project Name *</label>
              <input
                id="proj-name"
                type="text"
                className="input-control"
                placeholder="e.g. Payment Gateway, Mobile App"
                value={name}
                onChange={handleNameChange}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="proj-key">Key *</label>
              <input
                id="proj-key"
                type="text"
                className="input-control"
                placeholder="PAY"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                  setKeyManuallyEdited(true);
                }}
                maxLength={8}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            The key prefixes all tasks in this project (e.g. <strong style={{ color: 'var(--primary-500)' }}>{key || 'PROJ'}-1</strong>, <strong style={{ color: 'var(--primary-500)' }}>{key || 'PROJ'}-2</strong>).
          </div>

          {/* PM & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="proj-pm">Project Manager</label>
              <select
                id="proj-pm"
                className="input-control"
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
              >
                {currentWorkspace?.members?.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="proj-status">Status</label>
              <select
                id="proj-status"
                className="input-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Planning">Planning</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="input-group">
            <label className="input-label" htmlFor="proj-due">Target Due Date</label>
            <input
              id="proj-due"
              type="date"
              className="input-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label className="input-label" htmlFor="proj-desc">Description</label>
            <textarea
              id="proj-desc"
              className="input-control"
              placeholder="Outline project scope, deliverables, and architecture goals"
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
              <span>{submitting ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
