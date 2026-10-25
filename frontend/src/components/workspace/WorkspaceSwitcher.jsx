import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Briefcase, ChevronDown, Check, Plus } from 'lucide-react';
import CreateWorkspaceModal from './CreateWorkspaceModal';

export default function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-default)',
          }}
        >
          <Briefcase size={14} color="var(--primary-500)" />
          <span style={{ fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
          </span>
          <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="glass-panel" style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '260px',
            padding: '0.5rem',
            zIndex: 60,
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ padding: '0.375rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Your Workspaces ({workspaces.length})
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {workspaces.map((ws) => {
                const isCurrent = currentWorkspace && currentWorkspace._id === ws._id;
                return (
                  <button
                    key={ws._id}
                    onClick={() => {
                      switchWorkspace(ws._id);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isCurrent ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                      border: 'none',
                      color: isCurrent ? 'var(--primary-500)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.8125rem',
                      fontWeight: isCurrent ? 600 : 400,
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'var(--bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ws.name}
                    </div>
                    {isCurrent && <Check size={14} color="var(--primary-500)" />}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.375rem', paddingTop: '0.375rem' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-500)',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Plus size={14} />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
