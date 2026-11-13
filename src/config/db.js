import mongoose from "mongoose";
import logger from "../utils/logger.js";

// Called once at startup. Exiting here is fine: Cloud Run keeps the old
// revision serving if a new one cannot start.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 20, // REST + Pub/Sub handlers share this pool (LOC-12)
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Fail after 5s instead of queueing forever when the pool is busy.
      waitQueueTimeoutMS: 5000,
    });
    logger.info("Location MongoDB connected");
  } catch (err) {
    logger.error("Location MongoDB connection error", {
      message: err.message,
    });
    process.exit(1);
  }
};

// The MongoDB driver reconnects by itself. Only log here; reconnecting
// manually used to call process.exit(1) on a short blip (LOC-12).
mongoose.connection.on("disconnected", () => {
  logger.warn("Location MongoDB disconnected, driver will reconnect");
});
mongoose.connection.on("reconnected", () => {
  logger.info("Location MongoDB reconnected");
});

export default connectDB;
