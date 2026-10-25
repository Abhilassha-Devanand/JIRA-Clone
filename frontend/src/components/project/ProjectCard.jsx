import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH RISK':
        return 'badge-danger';
      case 'MEDIUM RISK':
        return 'badge-warning';
      default:
        return 'badge-success';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-success';
      case 'Planning':
        return 'badge-info';
      case 'On Hold':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'PM';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className="glass-panel"
      onClick={() => navigate(`/projects/${project._id}`)}
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary-500)',
              border: '1px solid var(--border-default)',
            }}>
              {project.key}
            </span>
            <span className={`badge ${getStatusBadgeClass(project.status)}`}>
              {project.status}
            </span>
          </div>

          <span className={`badge ${getRiskBadgeClass(project.riskLevel)}`} style={{ fontSize: '0.6875rem' }}>
            {project.riskLevel}
          </span>
        </div>

        {/* Title & Description */}
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.3 }}>
          {project.name}
        </h3>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          marginBottom: '1.25rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div>
        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--primary-500)' }}>{project.progress}%</span>
          </div>
          <div style={{
            height: '6px',
            width: '100%',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${project.progress}%`,
              background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Task Counters & PM Avatar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.875rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}>
          {/* PM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              fontWeight: 700,
            }}>
              {getInitials(project.projectManager?.name)}
            </div>
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.projectManager?.name || 'Unassigned PM'}
            </span>
          </div>

          {/* Quick Counts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>{project.totalTasks || 0} tasks</span>
            <ArrowRight size={14} color="var(--primary-500)" />
          </div>
        </div>
      </div>
    </div>
  );
}
