const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markRead,
  markAllRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getMyNotifications);

router.route('/read-all')
  .patch(markAllRead);

router.route('/:id/read')
  .patch(markRead);

module.exports = router;
