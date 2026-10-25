const workspaceService = require('../services/workspaceService');

/**
 * @desc    Create a new workspace
 * @route   POST /api/workspaces
 * @access  Private
 */
const create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = await workspaceService.createWorkspace(req.user._id, {
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully.',
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all workspaces for authenticated user
 * @route   GET /api/workspaces
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.user._id);

    res.status(200).json({
      success: true,
      count: workspaces.length,
      data: { workspaces },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single workspace by ID
 * @route   GET /api/workspaces/:id
 * @access  Private (Workspace Members only)
 */
const getById = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(
      req.params.id,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update workspace details
 * @route   PUT /api/workspaces/:id
 * @access  Private (Workspace Admin only)
 */
const update = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = await workspaceService.updateWorkspace(
      req.params.id,
      req.user._id,
      { name, description }
    );

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully.',
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete workspace
 * @route   DELETE /api/workspaces/:id
 * @access  Private (Workspace Owner only)
 */
const remove = async (req, res, next) => {
  try {
    const result = await workspaceService.deleteWorkspace(
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
 * @desc    Add member to workspace by email
 * @route   POST /api/workspaces/:id/members
 * @access  Private (Workspace Admin only)
 */
const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide member email address.',
      });
    }

    const workspace = await workspaceService.addMemberByEmail(
      req.params.id,
      req.user._id,
      { email, role }
    );

    res.status(200).json({
      success: true,
      message: 'Member added to workspace successfully.',
      data: { workspace },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from workspace
 * @route   DELETE /api/workspaces/:id/members/:userId
 * @access  Private (Workspace Admin only)
 */
const removeMember = async (req, res, next) => {
  try {
    const workspace = await workspaceService.removeMember(
      req.params.id,
      req.user._id,
      req.params.userId
    );

    res.status(200).json({
      success: true,
      message: 'Member removed from workspace successfully.',
      data: { workspace },
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
  addMember,
  removeMember,
};
