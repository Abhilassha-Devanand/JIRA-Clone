import React from 'react';
import { 
  CheckSquare, 
  Bug, 
  Sparkles, 
  Clock, 
  Calendar, 
  AlertCircle,
  Tag
} from 'lucide-react';

export default function TaskCard({ task, onClick, onDragStart }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'Bug':
        return <Bug size={14} color="var(--color-danger)" />;
      case 'Feature':
        return <Sparkles size={14} color="var(--accent-purple)" />;
      default:
        return <CheckSquare size={14} color="var(--primary-500)" />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return <span className="badge badge-danger" style={{ fontSize: '0.625rem', padding: '0.15rem 0.4rem' }}>Critical</span>;
      case 'High':
        return <span className="badge badge-warning" style={{ fontSize: '0.625rem', padding: '0.15rem 0.4rem' }}>High</span>;
      case 'Medium':
        return <span className="badge badge-info" style={{ fontSize: '0.625rem', padding: '0.15rem 0.4rem' }}>Medium</span>;
      default:
        return <span className="badge badge-neutral" style={{ fontSize: '0.625rem', padding: '0.15rem 0.4rem' }}>Low</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  // Check blockers
  const isBlockedBy = task.dependencies?.filter((d) => d.type === 'is_blocked_by') || [];
  const blocksOthers = task.dependencies?.filter((d) => d.type === 'blocks') || [];

  return (
    <div
      className="glass-panel"
      draggable={Boolean(onDragStart)}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      onClick={() => onClick(task)}
      style={{
        padding: '1rem',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'var(--bg-card)',
        borderColor: isBlockedBy.length > 0 && task.status !== 'Done' ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)',
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-focus)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isBlockedBy.length > 0 && task.status !== 'Done' ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Top row: Type icon, Key, Priority */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {getTypeIcon(task.type)}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}>
            {task.taskKey}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {task.priorityScore !== undefined && (
            <span
              title={`Smart Priority Score: ${task.priorityScore}/100`}
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                padding: '0.1rem 0.35rem',
                borderRadius: 'var(--radius-sm)',
                background: task.priorityScore >= 70 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: task.priorityScore >= 70 ? '#f87171' : 'var(--primary-500)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              ★ {task.priorityScore}
            </span>
          )}
          {getPriorityBadge(task.priority)}
        </div>
      </div>

      {/* Dependency Alerts */}
      {isBlockedBy.length > 0 && task.status !== 'Done' && (
        <div className="blocker-chip">
          <AlertCircle size={12} />
          <span>Blocked by {isBlockedBy.map((d) => d.task?.taskKey || 'task').join(', ')}</span>
        </div>
      )}

      {blocksOthers.length > 0 && (
        <div className="blocks-other-chip">
          <span>⚡ Blocks {blocksOthers.length} task{blocksOthers.length > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Title */}
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1.35,
        wordBreak: 'break-word',
      }}>
        {task.title}
      </div>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.1rem 0.35rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              #{label}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: Effort, Due Date, Assignee */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '0.625rem',
        marginTop: '0.25rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {task.estimatedEffort > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} />
              <span>{task.estimatedEffort}h</span>
            </span>
          )}

          {task.dueDate && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)',
              fontWeight: isOverdue ? 600 : 400,
            }}>
              <Calendar size={12} />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        {task.assignee ? (
          <div
            title={`Assigned to: ${task.assignee.name}`}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              fontWeight: 700,
            }}
          >
            {getInitials(task.assignee.name)}
          </div>
        ) : (
          <div
            title="Unassigned"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px dashed var(--text-muted)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
            }}
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
}

