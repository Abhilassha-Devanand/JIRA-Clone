const express = require('express');
const router = express.Router();
const {
  getProjectRisk,
  getProjectWorkload,
  recommendAssignee,
  getPrioritizedTasks,
  getDependencyInsights,
  getProjectSummary,
  getWorkspaceOverview,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Project Analytics & Novelty algorithms
router.get('/projects/:projectId/risk', getProjectRisk);
router.get('/projects/:projectId/workload', getProjectWorkload);
router.get('/projects/:projectId/recommend-assignee', recommendAssignee);
router.get('/projects/:projectId/prioritized-tasks', getPrioritizedTasks);
router.get('/projects/:projectId/dependency-insights', getDependencyInsights);
router.get('/projects/:projectId/summary', getProjectSummary);

// Workspace Overview
router.get('/workspaces/:workspaceId/overview', getWorkspaceOverview);

module.exports = router;
