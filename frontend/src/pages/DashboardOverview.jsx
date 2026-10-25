import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  User, 
  Key, 
  Briefcase, 
  Building, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Check,
  Edit2
} from 'lucide-react';

export default function DashboardOverview() {
  const { user, token, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(editForm);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <section className="glass-panel" style={{
        padding: '2.5rem',
        background: 'linear-gradient(135deg, rgba(19, 29, 53, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-default)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '800px' }}>
          <div className="badge badge-success" style={{ marginBottom: '1rem' }}>
            <ShieldCheck size={14} />
            <span>Phase 3: Authentication Verified</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            You are securely authenticated using <strong>JSON Web Tokens (JWT)</strong> with encrypted bcrypt credentials.
            The system verified your identity from MongoDB and loaded your authenticated workspace profile.
          </p>
        </div>
      </section>

      {/* Authenticated Profile & Session Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
      }}>
        {/* User Identity Card */}
        <section className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary-500)" />
              <span>User Profile Details</span>
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setEditing(!editing)}
            >
              <Edit2 size={13} />
              <span>{editing ? 'Cancel' : 'Edit Details'}</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="badge badge-success" style={{ marginBottom: '1rem', width: '100%', justifyContent: 'center' }}>
              <Check size={14} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {editing ? (
            <form onSubmit={handleUpdate}>
              <div className="input-group">
                <label className="input-label">Job Title</label>
                <input
                  type="text"
                  className="input-control"
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <select
                  className="input-control"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Design">Design</option>
                  <option value="QA & Testing">QA & Testing</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                Save Profile Changes
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email Address</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Job Title</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-cyan)' }}>{user?.jobTitle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Department</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>User ID</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?._id}</span>
              </div>
            </div>
          )}
        </section>

        {/* JWT Session Details */}
        <section className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} color="var(--accent-cyan)" />
            <span>JWT Security Context</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Token Status</span>
              <span className="badge badge-success">Valid & Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Algorithm</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>HMAC SHA-256</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Storage Medium</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>localStorage (Bearer)</span>
            </div>
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {token}
            </div>
          </div>
        </section>
      </div>

      {/* Next Milestone Card */}
      <section className="glass-panel" style={{
        padding: '2rem',
        border: '1px solid var(--border-default)',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
              Next Up: Phase 4
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Workspace Management Ready</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Phase 3 authentication is complete. You can now proceed to Workspace Creation, Member Invitations, and Role Switching.
            </p>
          </div>
          <div className="btn btn-primary" style={{ cursor: 'default' }}>
            <span>Phase 4: Workspace Management Ready</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </section>
    </div>
  );
}
