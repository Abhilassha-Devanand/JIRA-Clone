import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Kanban, LogOut, Sparkles } from 'lucide-react';
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-default)',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 2rem',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand & Workspace Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)',
            }}>
              <Kanban size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.02em' }}>
                Plan<span style={{ color: 'var(--primary-500)' }}>Pulse</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Workspace & Intelligence
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-default)' }} />

          {/* Active Workspace Selector */}
          <WorkspaceSwitcher />
        </div>

        {/* User Info, Notifications & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={12} />
            <span>MERN Enterprise • Live</span>
          </div>

          {/* Real-time In-App Notification Center */}
          <NotificationCenter />


          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              {/* User Avatar & Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                }}>
                  {getInitials(user.name)}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {user.jobTitle} &bull; <span style={{ color: 'var(--accent-cyan)' }}>{user.department}</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Sign out of current session"
                style={{ marginLeft: '0.5rem' }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
