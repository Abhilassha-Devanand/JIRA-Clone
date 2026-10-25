import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { projectApi } from '../services/projectApi';
import { 
  Briefcase, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Shield, 
  UserPlus, 
  Trash2, 
  Crown,
  Plus,
  Sparkles
} from 'lucide-react';
import InviteMemberModal from '../components/workspace/InviteMemberModal';
import CreateWorkspaceModal from '../components/workspace/CreateWorkspaceModal';
import CreateProjectModal from '../components/project/CreateProjectModal';
import ProjectCard from '../components/project/ProjectCard';

export default function WorkspaceDashboard() {
  const { currentWorkspace, loading: wsLoading, isAdmin, removeMember } = useWorkspace();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateWsModal, setShowCreateWsModal] = useState(false);
  const [showCreateProjModal, setShowCreateProjModal] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Fetch projects whenever active workspace changes
  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [currentWorkspace?._id]);

  const fetchProjects = async () => {
    if (!currentWorkspace?._id) return;
    setLoadingProjects(true);
    try {
      const res = await projectApi.getWorkspaceProjects(currentWorkspace._id);
      if (res.success && res.data?.projects) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Failed to load workspace projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove "${targetName}" from this workspace?`)) {
      return;
    }

    setRemovingId(targetUserId);
    try {
      await removeMember(targetUserId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (wsLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading workspace information...
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--primary-500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <Briefcase size={32} />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>No Workspace Selected</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Create a workspace to start managing projects, organizing tasks, and inviting team members.
        </p>
        <button className="btn btn-primary" onClick={() => setShowCreateWsModal(true)}>
          <Plus size={18} />
          <span>Create First Workspace</span>
        </button>
        <CreateWorkspaceModal isOpen={showCreateWsModal} onClose={() => setShowCreateWsModal(false)} />
      </div>
    );
  }

  const isOwner = currentWorkspace.owner?._id === user?._id || currentWorkspace.owner === user?._id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Workspace Header Banner */}
      <section className="glass-panel" style={{
        padding: '2.5rem',
        background: 'linear-gradient(135deg, rgba(19, 29, 53, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-info">Workspace</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                /{currentWorkspace.slug}
              </span>
              {isOwner && (
                <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Crown size={12} /> Owner
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {currentWorkspace.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', lineHeight: 1.6, fontSize: '0.9375rem' }}>
              {currentWorkspace.description || 'Central organizational hub for project tracking, task prioritization, and team workload balancing.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateProjModal(true)}
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
            {isAdmin && (
              <button
                className="btn btn-secondary"
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus size={16} />
                <span>Invite Member</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Projects
            </span>
            <FolderKanban size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {projects.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
            Managed under this workspace
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Team Members
            </span>
            <Users size={18} color="var(--primary-500)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {currentWorkspace.members?.length || 1}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Workspace Collaborators
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Tasks
            </span>
            <CheckSquare size={18} color="var(--color-warning)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {projects.reduce((acc, p) => acc + (p.totalTasks || 0), 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Across all projects
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Your Role
            </span>
            <Shield size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-500)', marginTop: '0.25rem' }}>
            {currentWorkspace.currentUserRole || (isAdmin ? 'Workspace Admin' : 'Team Member')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {isAdmin ? 'Can manage projects & workspace members' : 'Can view projects & update tasks'}
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Workspace Projects</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Projects initiated within {currentWorkspace.name}
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateProjModal(true)}>
            <Plus size={14} />
            <span>Create Project</span>
          </button>
        </div>

        {loadingProjects ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <FolderKanban size={36} color="var(--primary-500)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No projects created yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Create your first project with a custom key (e.g. <code>TECH</code> or <code>PAY</code>) to start tracking tasks and Kanban workflows.
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreateProjModal(true)}>
              <Plus size={16} />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}>
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* Workspace Members Roster Table */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>Workspace Members Roster</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              All registered users with access to projects within this workspace
            </p>
          </div>

          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowInviteModal(true)}>
              <UserPlus size={14} />
              <span>Add Member</span>
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Member</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Job Title</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workspace Role</th>
                {isAdmin && (
                  <th style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentWorkspace.members?.map((memberObj) => {
                const memberUser = memberObj.user;
                if (!memberUser) return null;
                const isMemberOwner = currentWorkspace.owner?._id === memberUser._id || currentWorkspace.owner === memberUser._id;
                const isSelf = memberUser._id === user?._id;

                return (
                  <tr
                    key={memberUser._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Name & Avatar */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isMemberOwner 
                            ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                            : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                        }}>
                          {getInitials(memberUser.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {memberUser.name}
                            {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(You)</span>}
                          </div>
                          {isMemberOwner && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Crown size={11} /> Workspace Owner
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {memberUser.email}
                    </td>

                    {/* Job Title */}
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {memberUser.jobTitle || 'Team Member'}
                    </td>

                    {/* Department */}
                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      <span className="badge badge-neutral">{memberUser.department || 'Engineering'}</span>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '1rem' }}>
                      <span className={memberObj.role === 'Workspace Admin' ? 'badge badge-info' : 'badge badge-neutral'}>
                        {memberObj.role}
                      </span>
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {!isMemberOwner && !isSelf && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRemoveMember(memberUser._id, memberUser.name)}
                            disabled={removingId === memberUser._id}
                            style={{ color: 'var(--color-danger)' }}
                            title="Remove member from workspace"
                          >
                            <Trash2 size={14} />
                            <span>{removingId === memberUser._id ? 'Removing...' : 'Remove'}</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
      <CreateWorkspaceModal
        isOpen={showCreateWsModal}
        onClose={() => setShowCreateWsModal(false)}
      />
      <CreateProjectModal
        isOpen={showCreateProjModal}
        onClose={() => setShowCreateProjModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
