const mongoose = require('mongoose');
const { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } = require('../utils/constants');

const taskDependencySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    type: {
      type: String,
      enum: ['blocks', 'is_blocked_by'],
      default: 'is_blocked_by',
    },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    taskKey: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Task must belong to a workspace'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: Object.values(TASK_TYPES),
      default: TASK_TYPES.TASK,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITIES),
      default: TASK_PRIORITIES.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUSES),
      default: TASK_STATUSES.TO_DO,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have a reporter'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedEffort: {
      type: Number,
      min: [0, 'Estimated effort cannot be negative'],
      default: 4, // in hours
    },
    actualEffort: {
      type: Number,
      min: [0, 'Actual effort cannot be negative'],
      default: 0, // in hours
    },
    labels: {
      type: [String],
      default: [],
    },
    dependencies: [taskDependencySchema],
    priorityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    scoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Task key is unique per project
taskSchema.index({ project: 1, taskKey: 1 }, { unique: true });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ project: 1, priorityScore: -1 });

module.exports = mongoose.model('Task', taskSchema);
