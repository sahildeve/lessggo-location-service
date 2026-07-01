import Notification from "../models/Notification.js";
import logger from "./logger.js";

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
    });
    return notification;
  } catch (err) {
    // Notification fail hone se main flow block na ho
    logger.error("Create notification error:", { message: err.message });
    return null;
  }
};