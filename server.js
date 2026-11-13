import "dotenv/config";
import http from "http";
import util from "util";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import redis from "./src/config/redis.js";
import initSocket from "./src/socket.js";
import logger from "./src/utils/logger.js";
import { startCronJobs, stopCronJobs } from "./src/config/cron.js";
import {
  startLocationSubscriber,
  stopLocationSubscribers,
} from "./src/workers/locationSubscriber.js";

const PORT = process.env.PORT || 3002;
let httpServer;

const start = async () => {
  try {
    await connectDB();

    httpServer = http.createServer(app);
    const io = initSocket(httpServer);
    app.set("io", io);

    startLocationSubscriber(io);
    // auth-events topic ka USER_DELETED — alag subscription, same handler
    startLocationSubscriber(
      io,
      process.env.USER_DELETED_SUB || "location-user-deleted-sub",
    );

    startCronJobs(io);

    httpServer.listen(PORT, () => {
      logger.info(`Location Service running on port ${PORT}`, {
        mode: process.env.NODE_ENV,
      });
    });
  } catch (err) {
    logger.error("Server startup error", {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

start();

const errorDetails = (err) => {
  let inspected;
  try {
    inspected = util.inspect(err, { depth: 4, breakLength: Infinity });
  } catch {
    inspected = "[uninspectable value]";
  }
  return {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
    inspected,
  };
};

// ── Graceful shutdown (LOC-12) ──
let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);

  const forceExit = setTimeout(() => process.exit(0), 9000);
  forceExit.unref();

  try {
    stopCronJobs();
    await stopLocationSubscribers();
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    await Promise.allSettled([mongoose.connection.close(), redis.quit()]);
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Log only: one stray rejected promise should not kill every in-flight request.
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", errorDetails(err));
});

// Unknown state after an uncaught exception: log and exit for a clean instance.
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", errorDetails(err));
  process.exit(1);
});
