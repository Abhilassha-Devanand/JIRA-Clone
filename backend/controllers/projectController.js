const projectService = require('../services/projectService');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const create = async (req, res, next) => {
  try {
    const {
      workspaceId,
      name,
      key,
      description,
      projectManagerId,
      startDate,
      dueDate,
      status,
    } = req.body;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a workspaceId for this project.',
      });
    }

    const project = await projectService.createProject(req.user._id, {
      workspaceId,
      name,
      key,
      description,
      projectManagerId,
      startDate,
      dueDate,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all projects for a workspace
 * @route   GET /api/projects?workspaceId=...
 * @access  Private
 */
const getWorkspaceProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Please specify workspaceId query parameter.',
      });
    }

    const projects = await projectService.getWorkspaceProjects(
      workspaceId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      count: projects.length,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project by ID with task metrics
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Project Manager or Workspace Admin)
 */
const update = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Workspace Admin only)
 */
const remove = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:id/members
 * @access  Private (Project Manager or Workspace Admin)
 */
const addMember = async (req, res, next) => {
  try {
    const { memberId, role } = req.body;
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide memberId.',
      });
    }

    const project = await projectService.addProjectMember(
      req.params.id,
      req.user._id,
      { memberId, role }
    );

    res.status(200).json({
      success: true,
      message: 'Member added to project successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private (Project Manager or Workspace Admin)
 */
const removeMember = async (req, res, next) => {
  try {
    const project = await projectService.removeProjectMember(
      req.params.id,
      req.user._id,
      req.params.userId
    );

    res.status(200).json({
      success: true,
      message: 'Member removed from project successfully.',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getWorkspaceProjects,
  getById,
  update,
  remove,
  addMember,
  removeMember,
};
