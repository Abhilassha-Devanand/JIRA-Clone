const { Task, Project, User } = require('../models');

const STANDARD_WEEKLY_CAPACITY_HOURS = 40;

/**
 * Novelty 2: Team Workload Balancing Engine
 * Calculates member capacity utilization, active hours, and overload detection
 */
const getTeamWorkload = async (projectId) => {
  const project = await Project.findById(projectId).populate(
    'members.user',
    'name email avatar jobTitle department'
  );

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // Active tasks in project
  const activeTasks = await Task.find({
    project: projectId,
    status: { $ne: 'Done' },
  }).populate('assignee', 'name email avatar jobTitle');

  // Map each member's assigned workload
  const memberWorkloadMap = new Map();

  project.members.forEach((m) => {
    if (m.user) {
      memberWorkloadMap.set(m.user._id.toString(), {
        user: m.user,
        role: m.role,
        assignedTasksCount: 0,
        totalActiveHours: 0,
        highPriorityCount: 0,
        tasks: [],
      });
    }
  });

  // Track unassigned tasks count & effort
  let unassignedCount = 0;
  let unassignedHours = 0;

  activeTasks.forEach((task) => {
    const effort = Number(task.estimatedEffort) || 4;
    if (task.assignee) {
      const uId = task.assignee._id.toString();
      if (!memberWorkloadMap.has(uId)) {
        // Member might not be explicitly in project.members array yet
        memberWorkloadMap.set(uId, {
          user: task.assignee,
          role: 'Member',
          assignedTasksCount: 0,
          totalActiveHours: 0,
          highPriorityCount: 0,
          tasks: [],
        });
      }
      const record = memberWorkloadMap.get(uId);
      record.assignedTasksCount += 1;
      record.totalActiveHours += effort;
      if (task.priority === 'High' || task.priority === 'Critical') {
        record.highPriorityCount += 1;
      }
      record.tasks.push({
        id: task._id,
        taskKey: task.taskKey,
        title: task.title,
        status: task.status,
        priority: task.priority,
        estimatedEffort: effort,
      });
    } else {
      unassignedCount += 1;
      unassignedHours += effort;
    }
  });

  const memberStats = Array.from(memberWorkloadMap.values()).map((record) => {
    const utilizationRate = Math.round(
      (record.totalActiveHours / STANDARD_WEEKLY_CAPACITY_HOURS) * 100
    );

    let status = 'Available';
    let statusColor = 'emerald';
    if (utilizationRate > 85) {
      status = 'Overloaded';
      statusColor = 'rose';
    } else if (utilizationRate >= 50) {
      status = 'Moderate';
      statusColor = 'amber';
    }

    return {
      user: record.user,
      role: record.role,
      assignedTasksCount: record.assignedTasksCount,
      totalActiveHours: record.totalActiveHours,
      capacityHours: STANDARD_WEEKLY_CAPACITY_HOURS,
      utilizationRate,
      highPriorityCount: record.highPriorityCount,
      status,
      statusColor,
      isOverloaded: utilizationRate > 85,
    };
  });

  // Overall workload distribution skew
  const totalAllocatedHours = memberStats.reduce((sum, m) => sum + m.totalActiveHours, 0);
  const overloadedMembersCount = memberStats.filter((m) => m.isOverloaded).length;

  return {
    projectId,
    totalMembers: memberStats.length,
    overloadedMembersCount,
    totalAllocatedHours,
    unassignedCount,
    unassignedHours,
    capacityStandardHours: STANDARD_WEEKLY_CAPACITY_HOURS,
    members: memberStats,
  };
};

/**
 * Smart Assignee Recommender: Evaluates candidates and suggests the best assignee
 */
const recommendAssignee = async (projectId, taskEffort = 4) => {
  const workload = await getTeamWorkload(projectId);
  const effortNum = Number(taskEffort) || 4;

  const candidates = workload.members.map((member) => {
    const projectedHours = member.totalActiveHours + effortNum;
    const projectedUtilization = Math.round(
      (projectedHours / STANDARD_WEEKLY_CAPACITY_HOURS) * 100
    );

    // Fit formula: base fit on remaining capacity minus high-priority burden penalty
    const capacityScore = Math.max(0, 100 - projectedUtilization);
    const pressurePenalty = member.highPriorityCount * 6;
    const fitScore = Math.max(0, Math.round(capacityScore - pressurePenalty));

    const wouldOverload = projectedUtilization > 85;

    let reasoning = '';
    if (wouldOverload) {
      reasoning = `Overload Warning: Adding ${effortNum}h will push utilization to ${projectedUtilization}%.`;
    } else if (member.highPriorityCount > 2) {
      reasoning = `Already handling ${member.highPriorityCount} critical/high tasks (${member.utilizationRate}% utilized).`;
    } else {
      reasoning = `High availability: Currently at ${member.utilizationRate}% capacity with ${member.highPriorityCount} high priority items.`;
    }

    return {
      user: member.user,
      currentHours: member.totalActiveHours,
      currentUtilization: member.utilizationRate,
      projectedHours,
      projectedUtilization,
      fitScore,
      wouldOverload,
      reasoning,
    };
  });

  // Sort descending by fitScore
  candidates.sort((a, b) => b.fitScore - a.fitScore);

  const bestMatch = candidates.length > 0 ? candidates[0] : null;

  return {
    bestMatch,
    candidates,
    taskEffort: effortNum,
  };
};

module.exports = {
  getTeamWorkload,
  recommendAssignee,
};
