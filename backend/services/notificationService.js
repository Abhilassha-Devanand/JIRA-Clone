const { Notification } = require('../models');

/**
 * Get all notifications for current user with unread counter
 */
const getUserNotifications = async (userId, limit = 30) => {
  const notifications = await Notification.find({ recipient: userId })
    .populate('sender', 'name email avatar jobTitle')
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return {
    notifications,
    unreadCount,
  };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

/**
 * Mark all notifications for user as read
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );

  return { message: 'All notifications marked as read.' };
};

/**
 * Create a new notification
 */
const createNotification = async ({ recipient, sender, type, title, message, link }) => {
  return await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    link: link || '',
    isRead: false,
  });
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
};
