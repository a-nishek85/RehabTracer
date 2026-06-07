import Notification from "../models/Notification.model.js";

// ================= CREATE NOTIFICATION =================
export const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  link = "",
}) => {
  try {
    const notification =
      await Notification.create({
        user: userId,
        title,
        message,
        type,
        link,
      });

    return notification;
  } catch (error) {
    console.error(
      "Create Notification Error:",
      error.message
    );

    throw new Error(
      "Failed to create notification"
    );
  }
};

// ================= SEND GLOBAL NOTIFICATION =================
export const sendGlobalNotification =
  async ({
    users,
    title,
    message,
    type = "announcement",
  }) => {
    try {
      const notifications = users.map(
        (userId) => ({
          user: userId,
          title,
          message,
          type,
        })
      );

      const createdNotifications =
        await Notification.insertMany(
          notifications
        );

      return createdNotifications;
    } catch (error) {
      console.error(
        "Global Notification Error:",
        error.message
      );

      throw new Error(
        "Failed to send global notifications"
      );
    }
  };

// ================= GET USER NOTIFICATIONS =================
export const getUserNotifications =
  async (userId) => {
    try {
      const notifications =
        await Notification.find({
          user: userId,
        }).sort({
          createdAt: -1,
        });

      return notifications;
    } catch (error) {
      console.error(
        "Fetch Notifications Error:",
        error.message
      );

      throw new Error(
        "Failed to fetch notifications"
      );
    }
  };

// ================= MARK NOTIFICATION AS READ =================
export const markNotificationAsRead =
  async (notificationId, userId) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: notificationId,
            user: userId,
          },
          {
            isRead: true,
          },
          {
            new: true,
          }
        );

      return notification;
    } catch (error) {
      console.error(
        "Mark Notification Error:",
        error.message
      );

      throw new Error(
        "Failed to update notification"
      );
    }
  };

// ================= DELETE NOTIFICATION =================
export const deleteNotification =
  async (notificationId, userId) => {
    try {
      await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
      });

      return true;
    } catch (error) {
      console.error(
        "Delete Notification Error:",
        error.message
      );

      throw new Error(
        "Failed to delete notification"
      );
    }
  };

// ================= DELETE ALL USER NOTIFICATIONS =================
export const clearAllNotifications =
  async (userId) => {
    try {
      await Notification.deleteMany({
        user: userId,
      });

      return true;
    } catch (error) {
      console.error(
        "Clear Notifications Error:",
        error.message
      );

      throw new Error(
        "Failed to clear notifications"
      );
    }
  };

// ================= GET UNREAD COUNT =================
export const getUnreadNotificationCount =
  async (userId) => {
    try {
      const count =
        await Notification.countDocuments({
          user: userId,
          isRead: false,
        });

      return count;
    } catch (error) {
      console.error(
        "Unread Count Error:",
        error.message
      );

      throw new Error(
        "Failed to fetch unread count"
      );
    }
  };

// ================= SEND REALTIME SOCKET NOTIFICATION =================
export const sendRealtimeNotification =
  (io, userId, notification) => {
    try {
      io.to(userId.toString()).emit(
        "new-notification",
        notification
      );
    } catch (error) {
      console.error(
        "Socket Notification Error:",
        error.message
      );
    }
  };