import "dotenv/config";
import { initSentry } from './src/config/sentry.js';
initSentry(); 
import http from "http";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import initSocket from "./src/socket.js";
import logger from "./src/utils/logger.js";
import { startCronJobs } from "./src/config/cron.js";

const PORT = process.env.PORT || 3002;

const start = async () => {
  try {
    await connectDB();

    // HTTP server — Socket.io ke liye zaroori hai
    const httpServer = http.createServer(app);

    // Socket.io initialize karo
    const io = initSocket(httpServer);
    app.set("io", io);

    startCronJobs(io); // ← ab io pass karo, aur io ke baad call karo

    httpServer.listen(PORT, () => {
      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      logger.info(`  Location Service running on port ${PORT}`);
      logger.info(`  Mode : ${process.env.NODE_ENV}`);
      logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    });
  } catch (err) {
    logger.error("Server startup error:", {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

start();

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err.message);
  process.exit(1);
});