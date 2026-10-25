import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { ShieldAlert, AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react';

export default function ProjectRiskCard({ projectId }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRisk = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await analyticsApi.getProjectRisk(projectId);
      setRisk(res.data);
    } catch (err) {
      console.error('Failed to load project risk:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, [projectId]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Evaluating project health & risk dimensions...
      </div>
    );
  }

  if (!risk) return null;

  let riskBadgeClass = 'badge-success';
  let gaugeColor = 'var(--color-success)';
  if (risk.riskLevel === 'HIGH') {
    riskBadgeClass = 'badge-danger';
    gaugeColor = 'var(--color-danger)';
  } else if (risk.riskLevel === 'MEDIUM') {
    riskBadgeClass = 'badge-warning';
    gaugeColor = 'var(--color-warning)';
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <ShieldAlert size={18} color={gaugeColor} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            Project Health & Risk Detection Engine (Novelty 3)
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${riskBadgeClass}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
            {risk.riskLevel} &bull; Score {risk.riskScore}/100
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={fetchRisk}
            title="Recalculate Risk"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 5 Risk Dimensions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overdue Factor</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {risk.dimensions.overdueRatioScore} / 30 pts
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {risk.metrics.overdueCount} overdue tasks
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Blocked Ratio</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {risk.dimensions.blockedRatioScore} / 25 pts
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {risk.metrics.blockedCount} blocked tasks
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Critical Backlog</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {risk.dimensions.highPriorityRatioScore} / 20 pts
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {risk.metrics.highPriorityCount} high/critical items
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Workload Skew</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {risk.dimensions.workloadSkewScore} / 15 pts
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {risk.metrics.overloadedMembersCount} overloaded members
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timeline Pace</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {risk.dimensions.timelineCompressionScore} / 10 pts
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {risk.metrics.completionRate}% completion
          </div>
        </div>
      </div>

      {/* Root Causes & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-elevated)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
            <AlertCircle size={14} color="var(--color-warning)" />
            <span>Root Cause Diagnostics:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {risk.rootCauses.map((rc, idx) => (
              <li key={idx}>{rc}</li>
            ))}
          </ul>
        </div>

        <div style={{ background: 'var(--bg-elevated)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
            <CheckCircle size={14} color="var(--color-success)" />
            <span>Actionable Manager Guidance:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {risk.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
