import Notification from '../models/Notification.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const skip = (page - 1) * limit;

  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('sender', 'name profileImage');

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  const total = await Notification.countDocuments(filter);

  return res.json(new ApiResponse(200, {
    notifications, unreadCount,
    pagination: { page: Number(page), limit: Number(limit), total },
  }, 'Notifications fetched'));
});

// PATCH /notifications/:id/read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  return res.json(new ApiResponse(200, { notification }, 'Marked as read'));
});

// PATCH /notifications/read-all
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return res.json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

// DELETE /notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  return res.json(new ApiResponse(200, {}, 'Notification deleted'));
});