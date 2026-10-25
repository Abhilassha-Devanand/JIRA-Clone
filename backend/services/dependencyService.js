const { Task, Project } = require('../models');

/**
 * Depth-First Search (DFS) Cycle Detection in Task Directed Acyclic Graph (DAG)
 * Returns true if adding a dependency (fromTaskId -> toTaskId) would create a cycle.
 */
const detectCycle = async (fromTaskId, toTaskId) => {
  if (fromTaskId.toString() === toTaskId.toString()) {
    return true; // Self-dependency is an immediate cycle
  }

  const visited = new Set();
  const recursionStack = new Set();

  // Helper function for DFS traversal
  const hasCycle = async (currentId) => {
    visited.add(currentId.toString());
    recursionStack.add(currentId.toString());

    // Fetch the task and its existing dependencies
    const task = await Task.findById(currentId).select('dependencies');
    if (!task) return false;

    // Direct dependencies that currentId depends on
    const prereqIds = task.dependencies
      .filter((d) => d.type === 'is_blocked_by')
      .map((d) => d.task.toString());

    // If we are currently evaluating toTaskId, also check the prospective dependency fromTaskId
    if (currentId.toString() === toTaskId.toString()) {
      prereqIds.push(fromTaskId.toString());
    }

    for (const nextId of prereqIds) {
      if (!visited.has(nextId)) {
        if (await hasCycle(nextId)) return true;
      } else if (recursionStack.has(nextId)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(currentId.toString());
    return false;
  };

  return await hasCycle(toTaskId);
};

/**
 * Add dependency relationship between two tasks with cycle prevention
 * fromTaskId: the prerequisite task
 * toTaskId: the task that is blocked by fromTaskId
 */
const addDependency = async (fromTaskId, toTaskId, type = 'is_blocked_by') => {
  const fromTask = await Task.findById(fromTaskId);
  const toTask = await Task.findById(toTaskId);

  if (!fromTask || !toTask) {
    const error = new Error('One or both tasks not found.');
    error.statusCode = 404;
    throw error;
  }

  if (fromTask.project.toString() !== toTask.project.toString()) {
    const error = new Error('Dependencies can only be established between tasks in the same project.');
    error.statusCode = 400;
    throw error;
  }

  // Check if dependency already exists
  const alreadyExists = toTask.dependencies.some(
    (d) => d.task.toString() === fromTaskId.toString()
  );
  if (alreadyExists) {
    const error = new Error(`Task ${toTask.taskKey} already has a dependency link to ${fromTask.taskKey}.`);
    error.statusCode = 400;
    throw error;
  }

  // Run DFS cycle detection
  const willCauseCycle = await detectCycle(fromTaskId, toTaskId);
  if (willCauseCycle) {
    const error = new Error(`Cannot add dependency: It creates a circular dependency loop between ${fromTask.taskKey} and ${toTask.taskKey}.`);
    error.statusCode = 400;
    throw error;
  }

  // Link dependency on toTask
  toTask.dependencies.push({
    task: fromTaskId,
    type: 'is_blocked_by',
  });

  // If prerequisite is not yet done, suggest / set status to Blocked if currently To Do
  if (fromTask.status !== 'Done' && toTask.status === 'To Do') {
    toTask.status = 'Blocked';
  }

  await toTask.save();

  // Also add reciprocal link on fromTask ('blocks')
  const reciprocalExists = fromTask.dependencies.some(
    (d) => d.task.toString() === toTaskId.toString()
  );
  if (!reciprocalExists) {
    fromTask.dependencies.push({
      task: toTaskId,
      type: 'blocks',
    });
    await fromTask.save();
  }

  return await Task.findById(toTaskId)
    .populate('dependencies.task', 'taskKey title status priority estimatedEffort')
    .populate('assignee', 'name email avatar');
};

/**
 * Remove dependency relationship between two tasks
 */
const removeDependency = async (fromTaskId, toTaskId) => {
  const toTask = await Task.findById(toTaskId);
  const fromTask = await Task.findById(fromTaskId);

  if (!toTask || !fromTask) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  toTask.dependencies = toTask.dependencies.filter(
    (d) => d.task.toString() !== fromTaskId.toString()
  );

  // If toTask was Blocked, check if other prerequisites remain incomplete
  if (toTask.status === 'Blocked') {
    const remainingPrereqs = await Task.find({
      _id: { $in: toTask.dependencies.filter((d) => d.type === 'is_blocked_by').map((d) => d.task) },
      status: { $ne: 'Done' },
    });
    if (remainingPrereqs.length === 0) {
      toTask.status = 'To Do';
    }
  }

  await toTask.save();

  fromTask.dependencies = fromTask.dependencies.filter(
    (d) => d.task.toString() !== toTaskId.toString()
  );
  await fromTask.save();

  return await Task.findById(toTaskId)
    .populate('dependencies.task', 'taskKey title status priority estimatedEffort')
    .populate('assignee', 'name email avatar');
};

module.exports = {
  detectCycle,
  addDependency,
  removeDependency,
};
