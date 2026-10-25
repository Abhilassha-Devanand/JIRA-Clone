import React, { useState } from 'react';
import { taskApi } from '../../services/taskApi';
import { Link2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DependencySelector({
  task,
  allProjectTasks = [],
  onDependenciesUpdated,
}) {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [dependencyType, setDependencyType] = useState('is_blocked_by');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Available tasks to link (exclude current task and already linked tasks)
  const existingDepTaskIds = new Set(
    (task.dependencies || []).map((d) => (d.task?._id || d.task).toString())
  );
  existingDepTaskIds.add(task._id.toString());

  const availableTasks = allProjectTasks.filter(
    (t) => !existingDepTaskIds.has(t._id.toString())
  );

  const blockedByList = (task.dependencies || []).filter(
    (d) => d.type === 'is_blocked_by'
  );
  const blocksList = (task.dependencies || []).filter(
    (d) => d.type === 'blocks'
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // If type is 'is_blocked_by', selectedTaskId is the prerequisite, task._id is the target
      // If type is 'blocks', task._id is the prerequisite, selectedTaskId is the target
      let targetId = task._id;
      let prereqId = selectedTaskId;

      if (dependencyType === 'blocks') {
        targetId = selectedTaskId;
        prereqId = task._id;
      }

      await taskApi.addDependency(targetId, {
        prerequisiteTaskId: prereqId,
        type: 'is_blocked_by',
      });

      setSuccess('Dependency linked successfully.');
      setSelectedTaskId('');
      if (onDependenciesUpdated) {
        onDependenciesUpdated();
      }
    } catch (err) {
      console.error('Dependency link error:', err);
      setError(
        err.response?.data?.message || 'Failed to establish dependency link.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (depTaskId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await taskApi.removeDependency(task._id, depTaskId);
      setSuccess('Dependency removed.');
      if (onDependenciesUpdated) {
        onDependenciesUpdated();
      }
    } catch (err) {
      console.error('Failed to remove dependency:', err);
      setError(
        err.response?.data?.message || 'Failed to remove dependency.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Link2 size={16} color="var(--primary-500)" />
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Task Dependencies & DAG Links
        </h4>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.75rem',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            color: 'var(--color-success)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.75rem',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={15} />
          <span>{success}</span>
        </div>
      )}

      {/* Blocked By List */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          IS BLOCKED BY (Prerequisites):
        </div>
        {blockedByList.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No prerequisite dependencies.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {blockedByList.map((dep) => {
              const depTask = dep.task || {};
              return (
                <div
                  key={depTask._id || dep._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.6rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#f87171' }}>
                      {depTask.taskKey}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{depTask.title}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                      {depTask.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleRemove(depTask._id)}
                    style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    title="Remove dependency"
                    disabled={loading}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Blocks List */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          BLOCKS (Downstream Dependents):
        </div>
        {blocksList.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Does not block any downstream tasks.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {blocksList.map((dep) => {
              const depTask = dep.task || {};
              return (
                <div
                  key={depTask._id || dep._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.6rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fbbf24' }}>
                      {depTask.taskKey}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{depTask.title}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                      {depTask.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleRemove(depTask._id)}
                    style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    title="Remove dependency"
                    disabled={loading}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Dependency Controls */}
      {availableTasks.length > 0 && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="input-control"
            value={dependencyType}
            onChange={(e) => setDependencyType(e.target.value)}
            style={{ width: '160px', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
          >
            <option value="is_blocked_by">Is blocked by</option>
            <option value="blocks">Blocks</option>
          </select>

          <select
            className="input-control"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
          >
            <option value="">Select target task...</option>
            {availableTasks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.taskKey} - {t.title.substring(0, 40)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!selectedTaskId || loading}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
          >
            <Link2 size={13} />
            <span>Link</span>
          </button>
        </form>
      )}
    </div>
  );
}
