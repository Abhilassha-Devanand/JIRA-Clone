const { Task } = require('../models');

/**
 * Novelty 4: Dependency-Aware Bottleneck Engine & Next Task Recommender
 * Evaluates the Directed Acyclic Graph (DAG) of the project to locate blockers
 * and surface the highest-impact unblocked tasks.
 */
const getDependencyInsights = async (projectId) => {
  const tasks = await Task.find({ project: projectId })
    .populate('assignee', 'name email avatar')
    .populate('dependencies.task', 'taskKey title status priority estimatedEffort');

  const taskMap = new Map();
  tasks.forEach((t) => taskMap.set(t._id.toString(), t));

  // 1. Identify Bottleneck Tasks:
  // Non-Done tasks that directly or indirectly block the highest number of other tasks
  const bottlenecks = [];
  const anomalies = [];
  const unblockedCandidates = [];

  tasks.forEach((task) => {
    // If not done, check how many tasks it blocks
    if (task.status !== 'Done') {
      const blockedDownstream = task.dependencies.filter((d) => d.type === 'blocks');
      if (blockedDownstream.length > 0) {
        bottlenecks.push({
          task: {
            _id: task._id,
            taskKey: task.taskKey,
            title: task.title,
            status: task.status,
            priority: task.priority,
            assignee: task.assignee,
            estimatedEffort: task.estimatedEffort,
          },
          downstreamBlockedCount: blockedDownstream.length,
          blockedTasks: blockedDownstream.map((d) => ({
            id: d.task?._id,
            taskKey: d.task?.taskKey,
            title: d.task?.title,
            status: d.task?.status,
          })),
        });
      }

      // Check for state anomalies:
      // A task marked "In Progress" but its prerequisites are still "To Do" or "Blocked"
      const incompletePrereqs = task.dependencies.filter((d) => {
        if (d.type === 'is_blocked_by') {
          const prereq = taskMap.get(d.task?._id?.toString() || d.task?.toString());
          return prereq && prereq.status !== 'Done';
        }
        return false;
      });

      if (incompletePrereqs.length > 0 && task.status === 'In Progress') {
        anomalies.push({
          task: {
            _id: task._id,
            taskKey: task.taskKey,
            title: task.title,
            status: task.status,
          },
          warning: `Task is marked "In Progress" but depends on ${incompletePrereqs.length} incomplete prerequisite(s).`,
          prerequisites: incompletePrereqs.map((p) => ({
            id: p.task?._id,
            taskKey: p.task?.taskKey,
            title: p.task?.title,
            status: p.task?.status,
          })),
        });
      }

      // Check if task is UNBLOCKED and ready to start:
      // Status is 'To Do' AND has zero incomplete prerequisites
      if (task.status === 'To Do' && incompletePrereqs.length === 0) {
        unblockedCandidates.push(task);
      }
    }
  });

  // Sort bottlenecks by downstream count descending
  bottlenecks.sort((a, b) => b.downstreamBlockedCount - a.downstreamBlockedCount);

  // Score unblocked candidates by priority for quick recommendations
  const priorityWeights = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  unblockedCandidates.sort(
    (a, b) => (priorityWeights[b.priority] || 1) - (priorityWeights[a.priority] || 1)
  );

  const recommendedNextTasks = unblockedCandidates.slice(0, 5).map((t) => ({
    _id: t._id,
    taskKey: t.taskKey,
    title: t.title,
    priority: t.priority,
    assignee: t.assignee,
    estimatedEffort: t.estimatedEffort,
    status: t.status,
    reason: `All prerequisites are satisfied. High impact ready item for execution.`,
  }));

  return {
    projectId,
    bottlenecksCount: bottlenecks.length,
    bottlenecks: bottlenecks.slice(0, 5),
    anomaliesCount: anomalies.length,
    anomalies,
    recommendedNextTasks,
  };
};

module.exports = {
  getDependencyInsights,
};
