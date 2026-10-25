const express = require('express');
const router = express.Router();
const { create, getByTask, remove } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/tasks/:taskId')
  .get(getByTask)
  .post(create);

router.route('/:id')
  .delete(remove);

module.exports = router;
