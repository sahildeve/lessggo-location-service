import axios from "axios";
import logger from "./logger.js";

const baseURL = process.env.CHAT_SERVICE_URL || "http://localhost:3004";
const serviceKey = process.env.INTERNAL_SERVICE_KEY || "dev-internal-key";

const client = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    "x-service-key": serviceKey,
  },
});

export const postSystemMessage = async (rideId, message) => {
  try {
    await client.post(`/api/chat/internal/${rideId}/system-message`, {
      message,
    });
  } catch (err) {
    logger.warn("Failed to post chat system message:", err.message);
  }
};

export const closeRideChat = async (rideId, reason) => {
  try {
    await client.post(`/api/chat/internal/${rideId}/close`, { reason });
  } catch (err) {
    logger.warn("Failed to close ride chat:", err.message);
  }
};
