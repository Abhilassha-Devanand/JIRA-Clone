const { Project, Task } = require('../models');
const { getTeamWorkload } = require('./workloadService');

/**
 * Novelty 3: Project Risk Detection Algorithm
 * Evaluates multi-dimensional risk factors and yields an explainable risk health report.
 */
const calculateProjectRisk = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const allTasks = await Task.find({ project: projectId });
  const activeTasks = allTasks.filter((t) => t.status !== 'Done');
  const totalTasksCount = allTasks.length;
  const activeCount = activeTasks.length;

  if (totalTasksCount === 0) {
    return {
      projectId,
      projectName: project.name,
      riskScore: 0,
      riskLevel: 'LOW',
      healthStatus: 'Healthy',
      dimensions: {
        overdueRatioScore: 0,
        blockedRatioScore: 0,
        highPriorityRatioScore: 0,
        workloadSkewScore: 0,
        timelineCompressionScore: 0,
      },
      metrics: {
        totalTasks: 0,
        activeTasks: 0,
        overdueCount: 0,
        blockedCount: 0,
        highPriorityCount: 0,
        overloadedMembersCount: 0,
        completionRate: 0,
      },
      rootCauses: ['No tasks created yet for this project.'],
      recommendations: ['Create project tasks to track progress and unlock risk analytics.'],
    };
  }

  const now = new Date();

  // Dimension 1: Overdue Tasks Ratio (Weight: 30 pts)
  const overdueTasks = activeTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).getTime() < now.getTime()
  );
  const overdueRatio = activeCount > 0 ? overdueTasks.length / activeCount : 0;
  const overdueRatioScore = Math.round(overdueRatio * 30);

  // Dimension 2: Blocked Tasks Ratio (Weight: 25 pts)
  const blockedTasks = activeTasks.filter((t) => t.status === 'Blocked');
  const blockedRatio = activeCount > 0 ? blockedTasks.length / activeCount : 0;
  const blockedRatioScore = Math.round(blockedRatio * 25);

  // Dimension 3: High & Critical Backlog Concentration (Weight: 20 pts)
  const highPriorityTasks = activeTasks.filter(
    (t) => t.priority === 'High' || t.priority === 'Critical'
  );
  const highPriorityRatio = activeCount > 0 ? highPriorityTasks.length / activeCount : 0;
  const highPriorityRatioScore = Math.round(highPriorityRatio * 20);

  // Dimension 4: Member Workload Skew & Overload (Weight: 15 pts)
  let workloadSkewScore = 0;
  let overloadedMembersCount = 0;
  try {
    const workload = await getTeamWorkload(projectId);
    overloadedMembersCount = workload.overloadedMembersCount;
    const memberCount = workload.members.length;
    if (memberCount > 0 && overloadedMembersCount > 0) {
      workloadSkewScore = Math.round((overloadedMembersCount / memberCount) * 15);
    }
  } catch (err) {
    console.warn('Could not calculate team workload for risk analysis:', err.message);
  }

  // Dimension 5: Timeline Compression & Completion Pace (Weight: 10 pts)
  let timelineCompressionScore = 0;
  const completionRate = Math.round(
    ((totalTasksCount - activeCount) / totalTasksCount) * 100
  );

  if (project.startDate && project.dueDate) {
    const totalDuration = new Date(project.dueDate).getTime() - new Date(project.startDate).getTime();
    const elapsed = now.getTime() - new Date(project.startDate).getTime();
    const timelineProgress = totalDuration > 0 ? Math.min(1, Math.max(0, elapsed / totalDuration)) : 0;

    // If more than 70% of project time has elapsed but completion is under 40%
    if (timelineProgress > 0.7 && completionRate < 40) {
      timelineCompressionScore = 10;
    } else if (timelineProgress > 0.5 && completionRate < 30) {
      timelineCompressionScore = 6;
    }
  }

  // Total Risk Score
  const totalRiskScore = Math.min(
    100,
    overdueRatioScore +
      blockedRatioScore +
      highPriorityRatioScore +
      workloadSkewScore +
      timelineCompressionScore
  );

  let riskLevel = 'LOW';
  let healthStatus = 'Healthy';
  if (totalRiskScore >= 70) {
    riskLevel = 'HIGH';
    healthStatus = 'Critical Risk';
  } else if (totalRiskScore >= 40) {
    riskLevel = 'MEDIUM';
    healthStatus = 'Needs Attention';
  }

  // Generate actionable root causes & recommendations
  const rootCauses = [];
  const recommendations = [];

  if (overdueTasks.length > 0) {
    rootCauses.push(
      `${overdueTasks.length} task(s) are overdue (${Math.round(overdueRatio * 100)}% of active backlog).`
    );
    recommendations.push(
      `Re-prioritize or extend due dates for overdue items: ${overdueTasks.map((t) => t.taskKey).slice(0, 3).join(', ')}.`
    );
  }

  if (blockedTasks.length > 0) {
    rootCauses.push(
      `${blockedTasks.length} task(s) are stuck in "Blocked" status.`
    );
    recommendations.push(
      `Resolve prerequisite dependencies to unblock team members on ${blockedTasks.map((t) => t.taskKey).join(', ')}.`
    );
  }

  if (overloadedMembersCount > 0) {
    rootCauses.push(
      `${overloadedMembersCount} team member(s) exceed 85% weekly capacity.`
    );
    recommendations.push(
      'Reassign pending tasks to available members using the Workload Rebalancer.'
    );
  }

  if (highPriorityRatio > 0.5) {
    rootCauses.push(
      `Heavy critical concentration: ${Math.round(highPriorityRatio * 100)}% of tasks are High/Critical.`
    );
    recommendations.push(
      'Audit scope and decouple nice-to-have features into secondary milestones.'
    );
  }

  if (rootCauses.length === 0) {
    rootCauses.push('Sprint progress is steady and within healthy parameters.');
    recommendations.push('Maintain current velocity and team allocation.');
  }

  return {
    projectId,
    projectName: project.name,
    riskScore: totalRiskScore,
    riskLevel,
    healthStatus,
    dimensions: {
      overdueRatioScore,
      blockedRatioScore,
      highPriorityRatioScore,
      workloadSkewScore,
      timelineCompressionScore,
    },
    metrics: {
      totalTasks: totalTasksCount,
      activeTasks: activeCount,
      overdueCount: overdueTasks.length,
      blockedCount: blockedTasks.length,
      highPriorityCount: highPriorityTasks.length,
      overloadedMembersCount,
      completionRate,
    },
    rootCauses,
    recommendations,
  };
};

module.exports = {
  calculateProjectRisk,
};
