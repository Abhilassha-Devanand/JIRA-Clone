/**
 * Global Constants & Enums for Project & Task Workspace Management
 */

module.exports = {
  ROLES: {
    WORKSPACE_ADMIN: 'Workspace Admin',
    PROJECT_MANAGER: 'Project Manager',
    TEAM_MEMBER: 'Team Member',
  },

  TASK_TYPES: {
    TASK: 'Task',
    BUG: 'Bug',
    FEATURE: 'Feature',
  },

  TASK_PRIORITIES: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical',
  },

  TASK_STATUSES: {
    TO_DO: 'To Do',
    IN_PROGRESS: 'In Progress',
    BLOCKED: 'Blocked',
    DONE: 'Done',
  },

  PROJECT_STATUSES: {
    PLANNING: 'Planning',
    ACTIVE: 'Active',
    ON_HOLD: 'On Hold',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
  },

  RISK_LEVELS: {
    LOW: 'LOW RISK',
    MEDIUM: 'MEDIUM RISK',
    HIGH: 'HIGH RISK',
  },

  NOTIFICATION_TYPES: {
    TASK_ASSIGNED: 'task_assigned',
    STATUS_CHANGED: 'status_changed',
    DEPENDENCY_BLOCKED: 'dependency_blocked',
    PROJECT_RISK_HIGH: 'project_risk_high',
    COMMENT_ADDED: 'comment_added',
    MEMBER_ADDED: 'member_added',
  },
};
