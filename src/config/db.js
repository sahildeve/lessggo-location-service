import mongoose from "mongoose";
import logger from "../utils/logger.js";
import Sentry from "./sentry.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("Location MongoDB connected");
  } catch (err) {
    Sentry.captureException(err);
    logger.error("Location MongoDB connection error:", err.message);
    await Sentry.flush(2000);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("Location MongoDB disconnected. Retrying...");
  setTimeout(connectDB, 5000);
});

export default connectDB;
