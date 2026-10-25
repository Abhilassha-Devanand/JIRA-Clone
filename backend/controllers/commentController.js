const commentService = require('../services/commentService');

/**
 * @desc    Add comment to task
 * @route   POST /api/comments/tasks/:taskId
 * @access  Private
 */
const create = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const comment = await commentService.addComment(taskId, req.user._id, content);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comments for task
 * @route   GET /api/comments/tasks/:taskId
 * @access  Private
 */
const getByTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await commentService.getTaskComments(taskId);

    res.status(200).json({
      success: true,
      count: comments.length,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete comment
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
const remove = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getByTask,
  remove,
};
