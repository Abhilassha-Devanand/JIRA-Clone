import React, { useState } from 'react';
import { Star, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function PriorityBadge({ task }) {
  const [showPopover, setShowPopover] = useState(false);

  const score = task.priorityScore;
  const breakdown = task.scoreBreakdown;

  if (score === undefined) return null;

  let color = 'var(--text-secondary)';
  let bg = 'rgba(148, 163, 184, 0.12)';
  let label = 'LOW';

  if (score >= 80) {
    color = 'var(--color-danger)';
    bg = 'rgba(239, 68, 68, 0.18)';
    label = 'CRITICAL';
  } else if (score >= 60) {
    color = 'var(--color-warning)';
    bg = 'rgba(245, 158, 11, 0.18)';
    label = 'HIGH';
  } else if (score >= 40) {
    color = 'var(--primary-500)';
    bg = 'rgba(99, 102, 241, 0.18)';
    label = 'MEDIUM';
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          background: bg,
          color,
          border: `1px solid ${color}`,
          cursor: 'pointer',
        }}
        title="Click to view explainable prioritization breakdown"
      >
        <Star size={11} />
        <span>{score}/100</span>
        <span style={{ opacity: 0.8 }}>({label})</span>
        {showPopover ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {showPopover && breakdown && (
        <div className="priority-breakdown-popover">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Smart Priority Breakdown
            </span>
            <span style={{ fontWeight: 800, color }}>
              Score: {score}/100
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Base Priority ({task.priority}):</span>
              <span style={{ fontWeight: 600 }}>+{breakdown.basePriorityScore}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Deadline Urgency:</span>
              <span style={{ fontWeight: 600 }}>+{breakdown.urgencyScore}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Downstream Ripple Effect:</span>
              <span style={{ fontWeight: 600 }}>+{breakdown.rippleEffectScore}</span>
            </div>
            {breakdown.quickWinBonus > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                <span>Quick-Win Boost:</span>
                <span style={{ fontWeight: 600 }}>+{breakdown.quickWinBonus}</span>
              </div>
            )}
            {breakdown.stagnationPenalty > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
                <span>Stagnation Penalty:</span>
                <span style={{ fontWeight: 600 }}>+{breakdown.stagnationPenalty}</span>
              </div>
            )}
          </div>

          {breakdown.explanation && breakdown.explanation.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                RATIONALE:
              </span>
              <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {breakdown.explanation.map((e, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
