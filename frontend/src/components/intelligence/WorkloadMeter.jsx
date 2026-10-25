import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { Users, AlertTriangle, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

export default function WorkloadMeter({ projectId }) {
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [testEffort, setTestEffort] = useState(4);
  const [recLoading, setRecLoading] = useState(false);

  const fetchWorkload = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await analyticsApi.getProjectWorkload(projectId);
      setWorkload(res.data);
    } catch (err) {
      console.error('Failed to load workload:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    try {
      setRecLoading(true);
      const res = await analyticsApi.recommendAssignee(projectId, testEffort);
      setRecommendation(res.data);
    } catch (err) {
      console.error('Failed to recommend assignee:', err);
    } finally {
      setRecLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, [projectId]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading team workload capacity...
      </div>
    );
  }

  if (!workload) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Users size={18} color="var(--primary-500)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Team Workload & Capacity Balancing
          </h3>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={fetchWorkload}
          title="Refresh Workload"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {workload.overloadedMembersCount > 0 && (
        <div
          style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={15} />
          <span>
            {workload.overloadedMembersCount} team member(s) exceed 85% weekly capacity limit (40h standard).
          </span>
        </div>
      )}

      {/* Member Capacity Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {workload.members.map((m) => {
          let barColor = 'var(--color-success)';
          if (m.isOverloaded) barColor = 'var(--color-danger)';
          else if (m.utilizationRate >= 50) barColor = 'var(--color-warning)';

          return (
            <div
              key={m.user._id}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {m.user.name}
                </span>
                <span
                  className={`badge ${
                    m.isOverloaded ? 'badge-danger' : m.utilizationRate >= 50 ? 'badge-warning' : 'badge-success'
                  }`}
                  style={{ fontSize: '0.6875rem', padding: '0.1rem 0.4rem' }}
                >
                  {m.status} ({m.utilizationRate}%)
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                {m.assignedTasksCount} task(s) &bull; {m.totalActiveHours} / {m.capacityHours} active hours
              </div>

              <div className="workload-meter">
                <div
                  className="workload-fill"
                  style={{
                    width: `${Math.min(100, m.utilizationRate)}%`,
                    background: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart Assignee Recommender Engine Box */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--primary-500)" />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Smart Assignee Recommendation Engine (Novelty 2)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Task Effort:
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={testEffort}
              onChange={(e) => setTestEffort(Number(e.target.value))}
              style={{
                width: '60px',
                padding: '0.25rem 0.5rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
              }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRecommend}
              disabled={recLoading}
            >
              <span>{recLoading ? 'Evaluating...' : 'Find Best Assignee'}</span>
            </button>
          </div>
        </div>

        {recommendation && recommendation.bestMatch && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={15} color="var(--color-success)" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-success)' }}>
                  Recommended: {recommendation.bestMatch.user.name}
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.6875rem' }}>
                  Fit Score: {recommendation.bestMatch.fitScore}/100
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Projected Load: {recommendation.bestMatch.projectedHours}h ({recommendation.bestMatch.projectedUtilization}%)
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {recommendation.bestMatch.reasoning}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
