const { Project, Workspace, Task, User } = require('../models');
const { ROLES, PROJECT_STATUSES, RISK_LEVELS } = require('../utils/constants');

/**
 * Helper: Check if user is Workspace Admin
 */
const isWorkspaceAdmin = (workspace, userId) => {
  if (workspace.owner.toString() === userId.toString()) return true;
  const member = workspace.members.find(
    (m) => (m.user._id || m.user).toString() === userId.toString()
  );
  return member && member.role === ROLES.WORKSPACE_ADMIN;
};

/**
 * Helper: Check if user is Project Manager of project or Workspace Admin
 */
const canManageProject = (project, workspace, userId) => {
  if (isWorkspaceAdmin(workspace, userId)) return true;
  return project.projectManager.toString() === userId.toString();
};

/**
 * Create a new project under a workspace
 */
const createProject = async (userId, {
  workspaceId,
  name,
  key,
  description,
  projectManagerId,
  startDate,
  dueDate,
  status,
}) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  // Must be a workspace member to create projects
  const isMember = workspace.owner.toString() === userId.toString() ||
    workspace.members.some((m) => (m.user._id || m.user).toString() === userId.toString());
  
  if (!isMember) {
    const error = new Error('Access denied. You are not a member of this workspace.');
    error.statusCode = 403;
    throw error;
  }

  if (!name || name.trim().length < 2) {
    const error = new Error('Project name must be at least 2 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Auto-generate or sanitize project key
  let sanitizedKey = key
    ? key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    : name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().substring(0, 5);

  if (sanitizedKey.length < 2) {
    sanitizedKey = name.trim().substring(0, 3).toUpperCase();
  }

  // Check key uniqueness within this workspace
  const existingKeyProject = await Project.findOne({
    workspace: workspaceId,
    key: sanitizedKey,
  });

  if (existingKeyProject) {
    const error = new Error(`Project key "${sanitizedKey}" is already in use within this workspace.`);
    error.statusCode = 400;
    throw error;
  }

  // Designate Project Manager (defaults to creator or specified manager)
  const pmId = projectManagerId || userId;

  const project = new Project({
    workspace: workspaceId,
    name: name.trim(),
    key: sanitizedKey,
    description: description ? description.trim() : '',
    projectManager: pmId,
    members: [
      {
        user: pmId,
        role: ROLES.PROJECT_MANAGER,
      },
    ],
    startDate: startDate || new Date(),
    dueDate: dueDate || null,
    status: status || PROJECT_STATUSES.ACTIVE,
    progress: 0,
    riskScore: 0,
    riskLevel: RISK_LEVELS.LOW,
  });

  // If creator is different from PM, add creator as well
  if (pmId.toString() !== userId.toString()) {
    project.members.push({
      user: userId,
      role: isWorkspaceAdmin(workspace, userId) ? ROLES.PROJECT_MANAGER : ROLES.TEAM_MEMBER,
    });
  }

  await project.save();

  return await Project.findById(project._id)
    .populate('workspace', 'name slug')
    .populate('projectManager', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

/**
 * Retrieve all projects for a workspace with calculated task progress
 */
const getWorkspaceProjects = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  const projects = await Project.find({ workspace: workspaceId })
    .populate('projectManager', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department')
    .sort({ updatedAt: -1 });

  // Compute live task counts and accurate progress for each project
  const projectSummaries = await Promise.all(
    projects.map(async (p) => {
      const totalTasks = await Task.countDocuments({ project: p._id });
      const completedTasks = await Task.countDocuments({
        project: p._id,
        status: 'Done',
      });
      const blockedTasks = await Task.countDocuments({
        project: p._id,
        status: 'Blocked',
      });

      const calculatedProgress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : p.progress || 0;

      // Update in DB if changed
      if (p.progress !== calculatedProgress) {
        p.progress = calculatedProgress;
        await Project.updateOne({ _id: p._id }, { progress: calculatedProgress });
      }

      const pObj = p.toObject();
      pObj.totalTasks = totalTasks;
      pObj.completedTasks = completedTasks;
      pObj.blockedTasks = blockedTasks;
      return pObj;
    })
  );

  return projectSummaries;
};

/**
 * Retrieve a single project by ID with task statistics
 */
const getProjectById = async (projectId, userId) => {
  const project = await Project.findById(projectId)
    .populate('workspace', 'name slug owner members')
    .populate('projectManager', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // Count task status distribution
  const totalTasks = await Task.countDocuments({ project: projectId });
  const todoTasks = await Task.countDocuments({ project: projectId, status: 'To Do' });
  const inProgressTasks = await Task.countDocuments({ project: projectId, status: 'In Progress' });
  const blockedTasks = await Task.countDocuments({ project: projectId, status: 'Blocked' });
  const doneTasks = await Task.countDocuments({ project: projectId, status: 'Done' });

  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : project.progress || 0;

  const projectObj = project.toObject();
  projectObj.taskMetrics = {
    total: totalTasks,
    todo: todoTasks,
    inProgress: inProgressTasks,
    blocked: blockedTasks,
    done: doneTasks,
  };
  projectObj.progress = progress;

  return projectObj;
};

/**
 * Update project details (Project Manager or Workspace Admin only)
 */
const updateProject = async (projectId, userId, updateData) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(project.workspace);
  if (!canManageProject(project, workspace, userId)) {
    const error = new Error('Permission denied. Only Project Managers or Workspace Admins can edit this project.');
    error.statusCode = 403;
    throw error;
  }

  const allowedUpdates = ['name', 'description', 'status', 'startDate', 'dueDate', 'projectManager'];
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      project[field] = updateData[field];
    }
  });

  // If PM was changed, ensure new PM is in project members
  if (updateData.projectManager) {
    const pmExists = project.members.some(
      (m) => m.user.toString() === updateData.projectManager.toString()
    );
    if (!pmExists) {
      project.members.push({
        user: updateData.projectManager,
        role: ROLES.PROJECT_MANAGER,
      });
    }
  }

  await project.save();

  return await Project.findById(project._id)
    .populate('workspace', 'name slug')
    .populate('projectManager', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

/**
 * Delete a project and its tasks (Workspace Admin only)
 */
const deleteProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(project.workspace);
  if (!isWorkspaceAdmin(workspace, userId)) {
    const error = new Error('Permission denied. Only Workspace Admins can delete projects.');
    error.statusCode = 403;
    throw error;
  }

  await Task.deleteMany({ project: projectId });
  await Project.deleteOne({ _id: projectId });

  return { message: 'Project and all associated tasks deleted successfully.' };
};

/**
 * Add a member to the project team
 */
const addProjectMember = async (projectId, currentUserId, { memberId, role }) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(project.workspace);
  if (!canManageProject(project, workspace, currentUserId)) {
    const error = new Error('Permission denied. Only Project Managers or Workspace Admins can add project members.');
    error.statusCode = 403;
    throw error;
  }

  // Ensure member is already in the workspace
  const isWsMember = workspace.owner.toString() === memberId.toString() ||
    workspace.members.some((m) => (m.user._id || m.user).toString() === memberId.toString());

  if (!isWsMember) {
    const error = new Error('User must be a member of the workspace before being added to a project.');
    error.statusCode = 400;
    throw error;
  }

  const isAlreadyProjectMember = project.members.some(
    (m) => m.user.toString() === memberId.toString()
  );

  if (isAlreadyProjectMember) {
    const error = new Error('User is already assigned to this project.');
    error.statusCode = 400;
    throw error;
  }

  project.members.push({
    user: memberId,
    role: role || ROLES.TEAM_MEMBER,
  });

  await project.save();

  return await Project.findById(projectId)
    .populate('projectManager', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

/**
 * Remove a member from the project team
 */
const removeProjectMember = async (projectId, currentUserId, targetMemberId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(project.workspace);
  if (!canManageProject(project, workspace, currentUserId)) {
    const error = new Error('Permission denied. Only Project Managers or Workspace Admins can remove members.');
    error.statusCode = 403;
    throw error;
  }

  if (project.projectManager.toString() === targetMemberId.toString()) {
    const error = new Error('Cannot remove the Project Manager without assigning a new PM first.');
    error.statusCode = 400;
    throw error;
  }

  project.members = project.members.filter(
    (m) => m.user.toString() !== targetMemberId.toString()
  );

  await project.save();

  return await Project.findById(projectId)
    .populate('projectManager', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

module.exports = {
  createProject,
  getWorkspaceProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};
