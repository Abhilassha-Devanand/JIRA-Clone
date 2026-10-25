const { Task, Project, Workspace, User, Notification } = require('../models');
const { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES, NOTIFICATION_TYPES } = require('../utils/constants');

/**
 * Helper: Check if user belongs to project or workspace
 */
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(project.workspace);
  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  const isWsMember = workspace.owner.toString() === userId.toString() ||
    workspace.members.some((m) => (m.user._id || m.user).toString() === userId.toString());

  if (!isWsMember) {
    const error = new Error('Access denied. You do not have access to this project.');
    error.statusCode = 403;
    throw error;
  }

  return { project, workspace };
};

/**
 * Helper: Recalculate project progress percentage
 */
const syncProjectProgress = async (projectId) => {
  const total = await Task.countDocuments({ project: projectId });
  const done = await Task.countDocuments({ project: projectId, status: TASK_STATUSES.DONE });
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  await Project.updateOne({ _id: projectId }, { progress });
};

/**
 * Create a new task with atomic auto-incremented taskKey
 */
const createTask = async (userId, {
  projectId,
  title,
  description,
  type,
  priority,
  status,
  assigneeId,
  dueDate,
  estimatedEffort,
  labels,
}) => {
  const { project, workspace } = await checkProjectAccess(projectId, userId);

  if (!title || title.trim().length < 2) {
    const error = new Error('Task title must be at least 2 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Atomically increment task counter for this project
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $inc: { taskCounter: 1 } },
    { new: true }
  );

  const taskKey = `${project.key}-${updatedProject.taskCounter}`;

  // If assignee provided, verify assignee belongs to project or workspace
  let finalAssignee = null;
  if (assigneeId) {
    const targetAssignee = await User.findById(assigneeId);
    if (targetAssignee) {
      finalAssignee = targetAssignee._id;
    }
  }

  // Determine initial order (count of tasks in the target status)
  const initialStatus = status || TASK_STATUSES.TO_DO;
  const existingInStatus = await Task.countDocuments({ project: projectId, status: initialStatus });

  const task = new Task({
    taskKey,
    project: projectId,
    workspace: workspace._id,
    title: title.trim(),
    description: description ? description.trim() : '',
    type: type || TASK_TYPES.TASK,
    priority: priority || TASK_PRIORITIES.MEDIUM,
    status: initialStatus,
    assignee: finalAssignee,
    reporter: userId,
    dueDate: dueDate || null,
    estimatedEffort: estimatedEffort !== undefined ? Number(estimatedEffort) : 4,
    labels: Array.isArray(labels)
      ? labels.map((l) => l.trim()).filter(Boolean)
      : typeof labels === 'string'
      ? labels.split(',').map((l) => l.trim()).filter(Boolean)
      : [],
    order: existingInStatus,
  });

  await task.save();
  await syncProjectProgress(projectId);

  // Send assignment notification if assigned to someone other than reporter
  if (finalAssignee && finalAssignee.toString() !== userId.toString()) {
    try {
      await Notification.create({
        recipient: finalAssignee,
        sender: userId,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        title: `Task Assigned: ${taskKey}`,
        message: `You were assigned to "${task.title}" in ${project.name}.`,
        link: `/projects/${projectId}`,
      });
    } catch (notifErr) {
      console.warn('Could not create notification:', notifErr.message);
    }
  }

  return await Task.findById(task._id)
    .populate('assignee', 'name email avatar jobTitle department')
    .populate('reporter', 'name email avatar jobTitle department')
    .populate('project', 'name key status');
};

/**
 * Retrieve tasks for a project with search and multi-criteria filters
 */
const getProjectTasks = async (projectId, userId, filters = {}) => {
  await checkProjectAccess(projectId, userId);

  const query = { project: projectId };

  // Filter by status
  if (filters.status) {
    query.status = filters.status;
  }

  // Filter by priority
  if (filters.priority) {
    query.priority = filters.priority;
  }

  // Filter by type
  if (filters.type) {
    query.type = filters.type;
  }

  // Filter by assignee
  if (filters.assignee) {
    query.assignee = filters.assignee;
  }

  // Filter by "assigned to me"
  if (filters.assignedToMe === 'true' || filters.assignedToMe === true) {
    query.assignee = userId;
  }

  // Search keyword (matches taskKey, title, or description)
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [
      { taskKey: searchRegex },
      { title: searchRegex },
      { description: searchRegex },
      { labels: searchRegex },
    ];
  }

  const tasks = await Task.find(query)
    .populate('assignee', 'name email avatar jobTitle department')
    .populate('reporter', 'name email avatar jobTitle department')
    .populate('dependencies.task', 'taskKey title status priority')
    .sort({ order: 1, createdAt: -1 });

  return tasks;
};

/**
 * Retrieve single task by ID with full dependencies
 */
const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId)
    .populate('project', 'name key status workspace projectManager')
    .populate('assignee', 'name email avatar jobTitle department')
    .populate('reporter', 'name email avatar jobTitle department')
    .populate('dependencies.task', 'taskKey title status priority estimatedEffort');

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await checkProjectAccess(task.project._id, userId);

  return task;
};

/**
 * Update task details, status, or assignee
 */
const updateTask = async (taskId, userId, updateData) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await checkProjectAccess(task.project, userId);

  const prevStatus = task.status;
  const prevAssignee = task.assignee ? task.assignee.toString() : null;

  const allowedFields = [
    'title',
    'description',
    'type',
    'priority',
    'status',
    'assignee',
    'dueDate',
    'estimatedEffort',
    'actualEffort',
    'labels',
    'order',
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (field === 'labels' && typeof updateData.labels === 'string') {
        task.labels = updateData.labels.split(',').map((l) => l.trim()).filter(Boolean);
      } else {
        task[field] = updateData[field];
      }
    }
  });

  await task.save();

  // Sync progress if status changed
  if (updateData.status && updateData.status !== prevStatus) {
    await syncProjectProgress(task.project);
  }

  // Notify new assignee if changed
  const newAssignee = task.assignee ? task.assignee.toString() : null;
  if (newAssignee && newAssignee !== prevAssignee && newAssignee !== userId.toString()) {
    try {
      await Notification.create({
        recipient: newAssignee,
        sender: userId,
        type: NOTIFICATION_TYPES.TASK_ASSIGNED,
        title: `Task Assigned: ${task.taskKey}`,
        message: `You were assigned to "${task.title}".`,
        link: `/projects/${task.project}`,
      });
    } catch (notifErr) {
      console.warn('Could not create notification:', notifErr.message);
    }
  }

  return await Task.findById(task._id)
    .populate('assignee', 'name email avatar jobTitle department')
    .populate('reporter', 'name email avatar jobTitle department')
    .populate('dependencies.task', 'taskKey title status priority');
};

/**
 * Delete task and clean up references
 */
const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  const { project, workspace } = await checkProjectAccess(task.project, userId);

  // Clean up any dependencies referencing this task in other tasks
  await Task.updateMany(
    { 'dependencies.task': taskId },
    { $pull: { dependencies: { task: taskId } } }
  );

  await Task.deleteOne({ _id: taskId });
  await syncProjectProgress(project._id);

  return { message: `Task ${task.taskKey} deleted successfully.` };
};

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
