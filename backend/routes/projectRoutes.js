const express = require('express');
const router = express.Router();
const {
  create,
  getWorkspaceProjects,
  getById,
  update,
  remove,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectRole } = require('../middleware/rbacMiddleware');

// All project routes require authentication
router.use(protect);

router.route('/')
  .post(create)
  .get(getWorkspaceProjects);

router.route('/:id')
  .get(getById)
  .put(requireProjectRole(['Owner', 'Admin', 'Project Manager']), update)
  .delete(requireProjectRole(['Owner', 'Admin']), remove);

router.route('/:id/members')
  .post(requireProjectRole(['Owner', 'Admin', 'Project Manager']), addMember);

router.route('/:id/members/:userId')
  .delete(requireProjectRole(['Owner', 'Admin', 'Project Manager']), removeMember);

module.exports = router;

