const express = require('express');
const router = express.Router();
const {
  create,
  getAll,
  getById,
  update,
  remove,
  addDependency,
  removeDependency,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All task routes require authentication
router.use(protect);

router.route('/')
  .post(create)
  .get(getAll);

router.route('/:id')
  .get(getById)
  .put(update)
  .delete(remove);

router.route('/:id/dependencies')
  .post(addDependency);

router.route('/:id/dependencies/:depTaskId')
  .delete(removeDependency);

module.exports = router;

