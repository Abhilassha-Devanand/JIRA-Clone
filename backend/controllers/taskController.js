const taskService = require('../services/taskService');
const dependencyService = require('../services/dependencyService');

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
const create = async (req, res, next) => {
  try {
    const {
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
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectId.',
      });
    }

    const task = await taskService.createTask(req.user._id, {
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
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks for a project with optional filters
 * @route   GET /api/tasks?projectId=...
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please specify projectId query parameter.',
      });
    }

    const tasks = await taskService.getProjectTasks(
      projectId,
      req.user._id,
      req.query
    );

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task details or status
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const update = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const remove = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add dependency relationship between tasks
 * @route   POST /api/tasks/:id/dependencies
 * @access  Private
 */
const addDependency = async (req, res, next) => {
  try {
    const { prerequisiteTaskId, type } = req.body;
    if (!prerequisiteTaskId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide prerequisiteTaskId.',
      });
    }

    const task = await dependencyService.addDependency(
      prerequisiteTaskId,
      req.params.id,
      type || 'is_blocked_by'
    );

    res.status(200).json({
      success: true,
      message: 'Dependency linked successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove dependency relationship
 * @route   DELETE /api/tasks/:id/dependencies/:depTaskId
 * @access  Private
 */
const removeDependency = async (req, res, next) => {
  try {
    const task = await dependencyService.removeDependency(
      req.params.depTaskId,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: 'Dependency removed successfully.',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  addDependency,
  removeDependency,
};

