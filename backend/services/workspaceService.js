const { Workspace, User, Project, Task } = require('../models');
const { ROLES } = require('../utils/constants');

/**
 * Helper: Check if user is Admin or Owner of workspace
 */
const checkIsWorkspaceAdmin = (workspace, userId) => {
  const isOwner = workspace.owner.toString() === userId.toString();
  if (isOwner) return true;

  const member = workspace.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return member && member.role === ROLES.WORKSPACE_ADMIN;
};

/**
 * Helper: Check if user is a member of workspace
 */
const checkIsWorkspaceMember = (workspace, userId) => {
  const isOwner = workspace.owner.toString() === userId.toString();
  if (isOwner) return true;

  return workspace.members.some(
    (m) => (m.user._id || m.user).toString() === userId.toString()
  );
};

/**
 * Create a new workspace and add creator as owner & admin
 */
const createWorkspace = async (userId, { name, description }) => {
  if (!name || name.trim().length < 2) {
    const error = new Error('Workspace name must be at least 2 characters.');
    error.statusCode = 400;
    throw error;
  }

  const workspace = new Workspace({
    name: name.trim(),
    description: description ? description.trim() : '',
    owner: userId,
    members: [
      {
        user: userId,
        role: ROLES.WORKSPACE_ADMIN,
        joinedAt: new Date(),
      },
    ],
  });

  await workspace.save();

  return await Workspace.findById(workspace._id)
    .populate('owner', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

/**
 * Retrieve all workspaces where user is owner or member
 */
const getUserWorkspaces = async (userId) => {
  const workspaces = await Workspace.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  })
    .populate('owner', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department')
    .sort({ updatedAt: -1 });

  return workspaces;
};

/**
 * Get single workspace by ID with strict membership validation
 */
const getWorkspaceById = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId)
    .populate('owner', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');

  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!checkIsWorkspaceMember(workspace, userId)) {
    const error = new Error('Access denied. You are not a member of this workspace.');
    error.statusCode = 403;
    throw error;
  }

  // Count active projects in workspace
  const projectCount = await Project.countDocuments({ workspace: workspace._id });
  const taskCount = await Task.countDocuments({ workspace: workspace._id });

  const workspaceObj = workspace.toObject();
  workspaceObj.projectCount = projectCount;
  workspaceObj.taskCount = taskCount;
  workspaceObj.currentUserRole = checkIsWorkspaceAdmin(workspace, userId)
    ? ROLES.WORKSPACE_ADMIN
    : ROLES.TEAM_MEMBER;

  return workspaceObj;
};

/**
 * Update workspace settings (Workspace Admin only)
 */
const updateWorkspace = async (workspaceId, userId, { name, description }) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!checkIsWorkspaceAdmin(workspace, userId)) {
    const error = new Error('Permission denied. Only Workspace Admins can update settings.');
    error.statusCode = 403;
    throw error;
  }

  if (name !== undefined) workspace.name = name.trim();
  if (description !== undefined) workspace.description = description.trim();

  await workspace.save();

  return await Workspace.findById(workspace._id)
    .populate('owner', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

/**
 * Delete workspace (Workspace Owner only)
 */
const deleteWorkspace = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  if (workspace.owner.toString() !== userId.toString()) {
    const error = new Error('Permission denied. Only the workspace owner can delete this workspace.');
    error.statusCode = 403;
    throw error;
  }

  // Cascade cleanup projects and tasks
  await Task.deleteMany({ workspace: workspaceId });
  await Project.deleteMany({ workspace: workspaceId });
  await Workspace.deleteOne({ _id: workspaceId });

  return { message: 'Workspace and associated projects deleted successfully.' };
};

/**
 * Add a member to workspace by email (Admin only)
 */
const addMemberByEmail = async (workspaceId, currentUserId, { email, role }) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!checkIsWorkspaceAdmin(workspace, currentUserId)) {
    const error = new Error('Permission denied. Only Workspace Admins can add members.');
    error.statusCode = 403;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const targetUser = await User.findOne({ email: normalizedEmail });

  if (!targetUser) {
    const error = new Error(`No registered user found with email "${email}".`);
    error.statusCode = 404;
    throw error;
  }

  const isAlreadyMember = workspace.members.some(
    (m) => m.user.toString() === targetUser._id.toString()
  );

  if (isAlreadyMember) {
    const error = new Error(`User "${targetUser.name}" is already a member of this workspace.`);
    error.statusCode = 400;
    throw error;
  }

  const assignedRole = role === ROLES.WORKSPACE_ADMIN ? ROLES.WORKSPACE_ADMIN : ROLES.TEAM_MEMBER;

  workspace.members.push({
    user: targetUser._id,
    role: assignedRole,
    joinedAt: new Date(),
  });

  await workspace.save();

  return await Workspace.findById(workspace._id)
    .populate('owner', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

/**
 * Remove a member from workspace (Admin only, cannot remove owner)
 */
const removeMember = async (workspaceId, currentUserId, targetUserId) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error('Workspace not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!checkIsWorkspaceAdmin(workspace, currentUserId)) {
    const error = new Error('Permission denied. Only Workspace Admins can remove members.');
    error.statusCode = 403;
    throw error;
  }

  if (workspace.owner.toString() === targetUserId.toString()) {
    const error = new Error('The workspace owner cannot be removed from the workspace.');
    error.statusCode = 400;
    throw error;
  }

  const initialLength = workspace.members.length;
  workspace.members = workspace.members.filter(
    (m) => m.user.toString() !== targetUserId.toString()
  );

  if (workspace.members.length === initialLength) {
    const error = new Error('Member not found in this workspace.');
    error.statusCode = 404;
    throw error;
  }

  await workspace.save();

  return await Workspace.findById(workspace._id)
    .populate('owner', 'name email avatar jobTitle department')
    .populate('members.user', 'name email avatar jobTitle department');
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMemberByEmail,
  removeMember,
  checkIsWorkspaceAdmin,
  checkIsWorkspaceMember,
};
