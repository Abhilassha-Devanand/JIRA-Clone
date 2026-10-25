const { Task, Project, Workspace, User } = require('../models');
const prioritizationService = require('../services/prioritizationService');
const workloadService = require('../services/workloadService');
const riskService = require('../services/riskService');
const bottleneckService = require('../services/bottleneckService');

/**
 * @desc    Get project risk analysis (Novelty 3)
 * @route   GET /api/analytics/projects/:projectId/risk
 * @access  Private
 */
const getProjectRisk = async (req, res, next) => {
  try {
    const report = await riskService.calculateProjectRisk(req.params.projectId);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team workload analysis (Novelty 2)
 * @route   GET /api/analytics/projects/:projectId/workload
 * @access  Private
 */
const getProjectWorkload = async (req, res, next) => {
  try {
    const workload = await workloadService.getTeamWorkload(req.params.projectId);
    res.status(200).json({
      success: true,
      data: workload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recommend optimal assignee for task effort (Novelty 2)
 * @route   GET /api/analytics/projects/:projectId/recommend-assignee
 * @access  Private
 */
const recommendAssignee = async (req, res, next) => {
  try {
    const effort = req.query.effort || 4;
    const recommendation = await workloadService.recommendAssignee(
      req.params.projectId,
      effort
    );
    res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get prioritized tasks with transparent scoring (Novelty 1)
 * @route   GET /api/analytics/projects/:projectId/prioritized-tasks
 * @access  Private
 */
const getPrioritizedTasks = async (req, res, next) => {
  try {
    const rankedTasks = await prioritizationService.getPrioritizedTasks(
      req.params.projectId
    );
    res.status(200).json({
      success: true,
      count: rankedTasks.length,
      data: { tasks: rankedTasks },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dependency bottleneck insights (Novelty 4)
 * @route   GET /api/analytics/projects/:projectId/dependency-insights
 * @access  Private
 */
const getDependencyInsights = async (req, res, next) => {
  try {
    const insights = await bottleneckService.getDependencyInsights(
      req.params.projectId
    );
    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated project summary for visual charts (Phase 15)
 * @route   GET /api/analytics/projects/:projectId/summary
 * @access  Private
 */
const getProjectSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const tasks = await Task.find({ project: projectId }).populate('assignee', 'name');

    // Status breakdown
    const statusCounts = { 'To Do': 0, 'In Progress': 0, Blocked: 0, Done: 0 };
    // Priority breakdown
    const priorityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    // Type breakdown
    const typeCounts = { Task: 0, Bug: 0, Feature: 0 };

    let totalEffort = 0;
    let completedEffort = 0;

    tasks.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
      if (typeCounts[t.type] !== undefined) typeCounts[t.type]++;

      const effort = Number(t.estimatedEffort) || 0;
      totalEffort += effort;
      if (t.status === 'Done') completedEffort += effort;
    });

    const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const priorityChartData = Object.entries(priorityCounts).map(([name, count]) => ({
      name,
      count,
    }));

    const progressPct = tasks.length > 0 ? Math.round((statusCounts.Done / tasks.length) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalTasks: tasks.length,
        statusCounts,
        priorityCounts,
        typeCounts,
        totalEffort,
        completedEffort,
        progressPct,
        statusChartData,
        priorityChartData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get workspace overview metrics
 * @route   GET /api/analytics/workspaces/:workspaceId/overview
 * @access  Private
 */
const getWorkspaceOverview = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email');
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const projects = await Project.find({ workspace: workspaceId });
    const tasks = await Task.find({ workspace: workspaceId });

    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Done').length;
    const activeTasks = totalTasks - completedTasks;
    const blockedTasks = tasks.filter((t) => t.status === 'Blocked').length;

    // Calculate risk level for each project
    const projectRiskSummaries = await Promise.all(
      projects.map(async (p) => {
        try {
          const risk = await riskService.calculateProjectRisk(p._id);
          return {
            id: p._id,
            name: p.name,
            key: p.key,
            status: p.status,
            progress: p.progress,
            riskScore: risk.riskScore,
            riskLevel: risk.riskLevel,
          };
        } catch {
          return {
            id: p._id,
            name: p.name,
            key: p.key,
            status: p.status,
            progress: p.progress,
            riskScore: 0,
            riskLevel: 'LOW',
          };
        }
      })
    );

    const highRiskProjects = projectRiskSummaries.filter((p) => p.riskLevel === 'HIGH').length;

    res.status(200).json({
      success: true,
      data: {
        workspaceName: workspace.name,
        totalMembers: workspace.members.length,
        totalProjects,
        totalTasks,
        activeTasks,
        completedTasks,
        blockedTasks,
        highRiskProjects,
        projectRiskSummaries,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjectRisk,
  getProjectWorkload,
  recommendAssignee,
  getPrioritizedTasks,
  getDependencyInsights,
  getProjectSummary,
  getWorkspaceOverview,
};
