const mongoose = require('mongoose');
const { ROLES, PROJECT_STATUSES, RISK_LEVELS } = require('../utils/constants');

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: [ROLES.PROJECT_MANAGER, ROLES.TEAM_MEMBER],
      default: ROLES.TEAM_MEMBER,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Project must belong to a workspace'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    key: {
      type: String,
      required: [true, 'Please provide a project key (e.g. TECH)'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Project key must be at least 2 characters'],
      maxlength: [10, 'Project key cannot exceed 10 characters'],
      match: [/^[A-Z0-9]+$/, 'Project key must contain only uppercase letters and numbers'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must have an assigned Project Manager'],
    },
    members: [projectMemberSchema],
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUSES),
      default: PROJECT_STATUSES.ACTIVE,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVELS),
      default: RISK_LEVELS.LOW,
    },
    taskCounter: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Project Key must be unique within a Workspace
projectSchema.index({ workspace: 1, key: 1 }, { unique: true });
projectSchema.index({ workspace: 1, status: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
