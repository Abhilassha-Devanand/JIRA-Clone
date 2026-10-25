import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/analyticsApi';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

const STATUS_COLORS = {
  'To Do': '#94a3b8',
  'In Progress': '#3b82f6',
  'Blocked': '#ef4444',
  'Done': '#10b981',
};

const PRIORITY_COLORS = {
  'Critical': '#ef4444',
  'High': '#f59e0b',
  'Medium': '#6366f1',
  'Low': '#64748b',
};

export default function ProjectAnalytics({ projectId }) {
  const [summary, setSummary] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const [sumRes, workRes, riskRes] = await Promise.all([
          analyticsApi.getProjectSummary(projectId),
          analyticsApi.getProjectWorkload(projectId),
          analyticsApi.getProjectRisk(projectId),
        ]);
        setSummary(sumRes.data);
        setWorkload(workRes.data);
        setRisk(riskRes.data);
      } catch (err) {
        console.error('Failed to load project analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Aggregating project charts and capacity telemetry...
      </div>
    );
  }

  if (!summary) return null;

  // Format data for status pie chart
  const statusPieData = summary.statusChartData.filter((d) => d.value > 0);

  // Format data for member workload bar chart
  const workloadBarData = (workload?.members || []).map((m) => ({
    name: m.user.name.split(' ')[0], // First name for neat labels
    hours: m.totalActiveHours,
    utilization: m.utilizationRate,
  }));

  // Format priority bar data
  const priorityBarData = Object.entries(summary.priorityCounts).map(([priority, count]) => ({
    priority,
    count,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL PROGRESS</span>
            <TrendingUp size={16} color="var(--primary-500)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {summary.progressPct}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {summary.statusCounts.Done} of {summary.totalTasks} tasks completed
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL EFFORT</span>
            <Clock size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            {summary.totalEffort}h
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {summary.completedEffort}h logged in completed items
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>BLOCKED TASKS</span>
            <AlertTriangle size={16} color={summary.statusCounts.Blocked > 0 ? 'var(--color-danger)' : 'var(--color-success)'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: summary.statusCounts.Blocked > 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
            {summary.statusCounts.Blocked}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {summary.statusCounts.Blocked > 0 ? 'Requires immediate prerequisite resolution' : 'Zero blockers active'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROJECT RISK LEVEL</span>
            <ShieldCheck size={16} color={risk?.riskLevel === 'HIGH' ? 'var(--color-danger)' : 'var(--color-success)'} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', color: risk?.riskLevel === 'HIGH' ? 'var(--color-danger)' : risk?.riskLevel === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {risk?.riskLevel || 'LOW'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Score: {risk?.riskScore || 0}/100 health index
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Status Distribution Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <PieIcon size={18} color="var(--primary-500)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Task Status Distribution
            </h3>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusPieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || '#6366f1'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Task Priority Breakdown
            </h3>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBarData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="priority" stroke="var(--text-muted)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityBarData.map((entry) => (
                    <Cell
                      key={entry.priority}
                      fill={PRIORITY_COLORS[entry.priority] || '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Workload vs 40h Capacity */}
        <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Team Member Allocated Workload vs 40h Weekly Capacity
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Standard Capacity Limit: 40h/week
            </span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 50]} />
                <Tooltip
                  formatter={(val) => [`${val} active hours`, 'Allocated Effort']}
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}
                />
                <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '40h Overload Line', fill: '#ef4444', fontSize: 11 }} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {workloadBarData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.hours > 34 ? '#ef4444' : entry.hours >= 20 ? '#f59e0b' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
