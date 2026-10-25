import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { GitPullRequest, ArrowRight, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

export default function BottleneckBanner({ projectId, onSelectTask }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await analyticsApi.getDependencyInsights(projectId);
      setInsights(res.data);
    } catch (err) {
      console.error('Failed to load dependency insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [projectId]);

  if (loading || !insights) return null;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <GitPullRequest size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
            Dependency DAG Bottlenecks & Next Best Tasks (Novelty 4)
          </h3>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={fetchInsights}
          title="Refresh Insights"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {/* Critical Bottlenecks */}
        <div style={{ background: 'var(--bg-elevated)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <AlertOctagon size={14} color="#f87171" />
            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#f87171' }}>
              Identified Critical Bottlenecks:
            </span>
          </div>

          {insights.bottlenecks.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No critical task bottlenecks currently delaying downstream work.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {insights.bottlenecks.map((b) => (
                <div
                  key={b.task._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-500)' }}>
                      {b.task.taskKey}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {b.task.title.substring(0, 30)}
                    </span>
                  </div>
                  <span className="badge badge-danger" style={{ fontSize: '0.625rem' }}>
                    Blocks {b.downstreamBlockedCount} task(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Next Tasks (Unblocked) */}
        <div style={{ background: 'var(--bg-elevated)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <CheckCircle2 size={14} color="var(--color-success)" />
            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-success)' }}>
              Recommended Next Unblocked Tasks:
            </span>
          </div>

          {insights.recommendedNextTasks.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              All pending tasks are currently in progress or blocked.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {insights.recommendedNextTasks.map((t) => (
                <div
                  key={t._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-success)' }}>
                      {t.taskKey}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{t.title.substring(0, 32)}</span>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
