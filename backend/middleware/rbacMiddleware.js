const { Workspace, Project } = require('../models');

/**
 * Middleware to check workspace-level role permissions
 * @param {Array<string>} allowedRoles e.g. ['Owner', 'Admin']
 */
const requireWorkspaceRole = (allowedRoles = ['Owner', 'Admin']) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId || req.query.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workspace identifier required for authorization check.',
        });
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({
          success: false,
          message: 'Workspace not found.',
        });
      }

      // Owner always has full privileges
      if (workspace.owner.toString() === req.user._id.toString()) {
        req.workspace = workspace;
        return next();
      }

      // Check member role
      const member = workspace.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Requires ${allowedRoles.join(' or ')} permission in this workspace.`,
        });
      }

      req.workspace = workspace;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check project-level role permissions
 * @param {Array<string>} allowedRoles e.g. ['Admin', 'Project Manager']
 */
const requireProjectRole = (allowedRoles = ['Admin', 'Project Manager']) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.projectId;
      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project identifier required for authorization check.',
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found.',
        });
      }

      // If user is project manager, grant access
      if (project.projectManager && project.projectManager.toString() === req.user._id.toString()) {
        req.project = project;
        return next();
      }

      // Check workspace owner/admin
      const workspace = await Workspace.findById(project.workspace);
      if (workspace && (workspace.owner.toString() === req.user._id.toString())) {
        req.project = project;
        return next();
      }

      if (workspace) {
        const wsMember = workspace.members.find(
          (m) => m.user.toString() === req.user._id.toString()
        );
        if (wsMember && wsMember.role === 'Admin') {
          req.project = project;
          return next();
        }
      }

      // Check project members
      const member = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Requires ${allowedRoles.join(' or ')} permission for this project.`,
        });
      }

      req.project = project;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireWorkspaceRole,
  requireProjectRole,
};
