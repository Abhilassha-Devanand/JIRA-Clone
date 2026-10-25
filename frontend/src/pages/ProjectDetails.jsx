import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi } from '../services/projectApi';
import { taskApi } from '../services/taskApi';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  CheckSquare, 
  AlertCircle, 
  Users, 
  Clock, 
  FolderKanban,
  Sparkles,
  Filter,
  Kanban,
  ListFilter,
  BarChart3,
  BrainCircuit,
  Search
} from 'lucide-react';
import TaskCard from '../components/tasks/TaskCard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import KanbanBoard from '../components/kanban/KanbanBoard';
import WorkloadMeter from '../components/intelligence/WorkloadMeter';
import ProjectRiskCard from '../components/intelligence/ProjectRiskCard';
import BottleneckBanner from '../components/intelligence/BottleneckBanner';
import ProjectAnalytics from './ProjectAnalytics';

export default function ProjectDetails() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active View Tab: 'kanban' | 'list' | 'intelligence' | 'analytics'
  const [activeTab, setActiveTab] = useState('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals state
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState('To Do');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectApi.getProject(projectId),
        taskApi.getProjectTasks(projectId),
      ]);

      if (projRes.success && projRes.data?.project) {
        setProject(projRes.data.project);
      }
      if (tasksRes.success && tasksRes.data?.tasks) {
        setTasks(tasksRes.data.tasks);
      }
    } catch (err) {
      console.error('Failed to load project data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
    // Refresh project metrics
    projectApi.getProject(projectId).then((res) => {
      if (res.success && res.data?.project) setProject(res.data.project);
    });
  };

  const handleTaskUpdated = (updatedTask) => {
    if (updatedTask) {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      setSelectedTask(updatedTask);
    } else {
      // General refresh
      fetchData();
    }
    projectApi.getProject(projectId).then((res) => {
      if (res.success && res.data?.project) setProject(res.data.project);
    });
  };

  const handleTaskDeleted = (deletedTaskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== deletedTaskId));
    setSelectedTask(null);
    projectApi.getProject(projectId).then((res) => {
      if (res.success && res.data?.project) setProject(res.data.project);
    });
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH RISK': return 'badge-danger';
      case 'MEDIUM RISK': return 'badge-warning';
      default: return 'badge-success';
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

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(q);
      const matchesKey = task.taskKey.toLowerCase().includes(q);
      const matchesDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchesTitle && !matchesKey && !matchesDesc) return false;
    }
    if (filterAssignee) {
      if (!task.assignee || task.assignee._id !== filterAssignee) return false;
    }
    if (filterPriority) {
      if (task.priority !== filterPriority) return false;
    }
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'To Do');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'In Progress');
  const blockedTasks = filteredTasks.filter((t) => t.status === 'Blocked');
  const doneTasks = filteredTasks.filter((t) => t.status === 'Done');

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading project workspace...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ maxWidth: '1400px', margin: '3rem auto', padding: '0 2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--color-danger)' }}>
          <AlertCircle size={32} color="var(--color-danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Failed to Load Project</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error || 'Project not found.'}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Back Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/dashboard')}
          style={{ padding: '0.4rem 0.6rem' }}
          title="Return to Workspace Projects"
        >
          <ArrowLeft size={16} />
          <span>Projects</span>
        </button>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{project.name}</span>
      </div>

      {/* Project Header Hero Card */}
      <section className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.875rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.2)',
                color: 'var(--primary-500)',
                border: '1px solid var(--border-default)',
              }}>
                {project.key}
              </span>
              <span className="badge badge-info">{project.status}</span>
              <span className={`badge ${getRiskBadgeClass(project.riskLevel)}`}>
                {project.riskLevel}
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {project.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '750px', lineHeight: 1.6, fontSize: '0.9375rem' }}>
              {project.description || 'No description provided.'}
            </p>
          </div>

          {/* Action Buttons & PM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setInitialTaskStatus('To Do');
                setShowCreateTaskModal(true);
              }}
            >
              <Plus size={16} />
              <span>Create Task</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}>
                {getInitials(project.projectManager?.name)}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Project Manager</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{project.projectManager?.name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Overall Completion</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-500)' }}>{project.progress}%</span>
          </div>
          <div style={{
            height: '8px',
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
      </section>

      {/* Novelty Bottleneck Alert Banner (Always visible if bottlenecks exist) */}
      <BottleneckBanner projectId={projectId} />

      {/* Navigation Tabs Bar */}
      <div className="tab-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
          onClick={() => setActiveTab('kanban')}
        >
          <Kanban size={16} />
          <span>Interactive Kanban Board</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <ListFilter size={16} />
          <span>Task List View</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'intelligence' ? 'active' : ''}`}
          onClick={() => setActiveTab('intelligence')}
        >
          <BrainCircuit size={16} />
          <span>Decision Intelligence (4 Novelties)</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>Visual Analytics (Recharts)</span>
        </button>
      </div>

      {/* Filter & Search Toolbar (Only for Kanban & List) */}
      {(activeTab === 'kanban' || activeTab === 'list') && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-control"
              placeholder="Search tasks by key or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <select
            className="input-control"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Assignees</option>
            {(project.members || []).map((m) => (
              <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                {m.user?.name || 'Member'}
              </option>
            ))}
          </select>

          <select
            className="input-control"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {(searchQuery || filterAssignee || filterPriority) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setFilterAssignee('');
                setFilterPriority('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Tab 1: Interactive Kanban Board */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={(task) => setSelectedTask(task)}
          onTaskUpdated={fetchData}
          onQuickAddTask={(colStatus) => {
            setInitialTaskStatus(colStatus);
            setShowCreateTaskModal(true);
          }}
        />
      )}

      {/* Tab 2: Task List View (Grouped Columns) */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* TO DO */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-dot status-dot-todo" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>TO DO</span>
              </div>
              <span className="badge badge-neutral">{todoTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todoTasks.map((task) => (
                <TaskCard key={task._id} task={task} onClick={(t) => setSelectedTask(t)} />
              ))}
              {todoTasks.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No tasks</div>}
            </div>
          </div>

          {/* IN PROGRESS */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-dot status-dot-progress" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>IN PROGRESS</span>
              </div>
              <span className="badge badge-info">{inProgressTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {inProgressTasks.map((task) => (
                <TaskCard key={task._id} task={task} onClick={(t) => setSelectedTask(t)} />
              ))}
              {inProgressTasks.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No tasks</div>}
            </div>
          </div>

          {/* BLOCKED */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-dot status-dot-blocked" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>BLOCKED</span>
              </div>
              <span className="badge badge-danger">{blockedTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {blockedTasks.map((task) => (
                <TaskCard key={task._id} task={task} onClick={(t) => setSelectedTask(t)} />
              ))}
              {blockedTasks.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No tasks</div>}
            </div>
          </div>

          {/* DONE */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="status-dot status-dot-done" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>DONE</span>
              </div>
              <span className="badge badge-success">{doneTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {doneTasks.map((task) => (
                <TaskCard key={task._id} task={task} onClick={(t) => setSelectedTask(t)} />
              ))}
              {doneTasks.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No tasks</div>}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Decision Intelligence (4 Novelties) */}
      {activeTab === 'intelligence' && (
        <div>
          <ProjectRiskCard projectId={projectId} />
          <WorkloadMeter projectId={projectId} />
        </div>
      )}

      {/* Tab 4: Visual Analytics (Recharts) */}
      {activeTab === 'analytics' && (
        <ProjectAnalytics projectId={projectId} />
      )}

      {/* Modals */}
      {showCreateTaskModal && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          project={project}
          projectId={projectId}
          initialStatus={initialTaskStatus}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          project={project}
          allProjectTasks={tasks}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
