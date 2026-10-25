const { Comment, Task, Notification } = require('../models');
const { NOTIFICATION_TYPES } = require('../utils/constants');

/**
 * Add a comment to a task
 */
const addComment = async (taskId, authorId, content) => {
  if (!content || !content.trim()) {
    const error = new Error('Comment content cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const task = await Task.findById(taskId).populate('assignee reporter project');
  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  const comment = await Comment.create({
    task: taskId,
    author: authorId,
    content: content.trim(),
  });

  const populatedComment = await Comment.findById(comment._id).populate(
    'author',
    'name email avatar jobTitle'
  );

  // Send notifications to stakeholders
  const recipientsToNotify = new Set();

  if (task.assignee && task.assignee._id.toString() !== authorId.toString()) {
    recipientsToNotify.add(task.assignee._id.toString());
  }
  if (task.reporter && task.reporter._id.toString() !== authorId.toString()) {
    recipientsToNotify.add(task.reporter._id.toString());
  }

  for (const recipientId of recipientsToNotify) {
    try {
      await Notification.create({
        recipient: recipientId,
        sender: authorId,
        type: NOTIFICATION_TYPES.COMMENT_ADDED,
        title: `Comment on ${task.taskKey}`,
        message: `${populatedComment.author.name} commented: "${content.trim().substring(0, 100)}${content.length > 100 ? '...' : ''}"`,
        link: `/projects/${task.project._id}`,
      });
    } catch (err) {
      console.warn('Could not send comment notification:', err.message);
    }
  }

  return populatedComment;
};

/**
 * Get all comments for a task
 */
const getTaskComments = async (taskId) => {
  const comments = await Comment.find({ task: taskId })
    .populate('author', 'name email avatar jobTitle department')
    .sort({ createdAt: 1 });

  return comments;
};

/**
 * Delete a comment
 */
const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    const error = new Error('Comment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (comment.author.toString() !== userId.toString()) {
    const error = new Error('You are not authorized to delete this comment.');
    error.statusCode = 403;
    throw error;
  }

  await Comment.findByIdAndDelete(commentId);
  return { message: 'Comment deleted successfully.' };
};

module.exports = {
  addComment,
  getTaskComments,
  deleteComment,
};
