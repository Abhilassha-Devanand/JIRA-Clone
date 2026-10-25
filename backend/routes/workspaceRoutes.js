const express = require('express');
const router = express.Router();
const {
  create,
  getAll,
  getById,
  update,
  remove,
  addMember,
  removeMember,
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');
const { requireWorkspaceRole } = require('../middleware/rbacMiddleware');

// All workspace routes require authentication
router.use(protect);

router.route('/')
  .post(create)
  .get(getAll);

router.route('/:id')
  .get(getById)
  .put(requireWorkspaceRole(['Owner', 'Admin']), update)
  .delete(requireWorkspaceRole(['Owner']), remove);

router.route('/:id/members')
  .post(requireWorkspaceRole(['Owner', 'Admin']), addMember);

router.route('/:id/members/:userId')
  .delete(requireWorkspaceRole(['Owner', 'Admin']), removeMember);

module.exports = router;

