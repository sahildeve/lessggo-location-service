import Notification from "../models/Notification.js";
import { success, error } from "../utils/response.js";
import logger from "../utils/logger.js";

// ─── Get Notifications — fetch + delete by IDs
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.sub })
      .sort({ createdAt: -1 })
      .lean();

    if (notifications.length === 0) {
      return success(res, { notifications: [], count: 0 }, "No notifications");
    }

    // viewedAt set karo — 5 min baad MongoDB khud delete karega
    const notificationIds = notifications.map((n) => n._id);
    await Notification.updateMany(
      { _id: { $in: notificationIds }, viewedAt: null },
      { $set: { viewedAt: new Date() } }
    );

    return success(res, { notifications, count: notifications.length }, "Notifications fetched");
  } catch (err) {
    logger.error("Get notifications error:", { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Get Notification Count — delete nahi karo
export const getNotificationCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user.sub });
    return success(res, { count }, "Notification count fetched");
  } catch (err) {
    logger.error("Get notification count error:", { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};