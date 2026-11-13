import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger.js";
import locationRoutes from "./src/routes/location.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import redis from "./src/config/redis.js";
import logger from "./src/utils/logger.js";
import { gatewayOnly } from "./src/middlewares/gatewayOnly.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

// ─── Health Check (open for Cloud Run and monitoring)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "location-service" });
});

// ─── Readiness (LOC-31): checks MongoDB and Redis.
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);

app.get("/ready", async (_req, res) => {
  const [mongo, cache] = await Promise.allSettled([
    withTimeout((async () => mongoose.connection.db.admin().ping())(), 2000),
    withTimeout(redis.ping(), 2000),
  ]);
  const checks = {
    mongo: mongo.status === "fulfilled" ? "ok" : "down",
    redis: cache.status === "fulfilled" ? "ok" : "down",
  };
  const ready = checks.mongo === "ok" && checks.redis === "ok";
  res
    .status(ready ? 200 : 503)
    .json({ status: ready ? "READY" : "NOT_READY", ...checks });
});

// ─── Only the gateway may call the API (LOC-14)
app.use(gatewayOnly);

app.use(express.json({ limit: "10kb" }));
// Express 5 leaves req.body undefined when no body is sent (LOC-20).
app.use((req, _res, next) => {
  req.body ??= {};
  next();
});
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ─── Routes
app.use("/api/location", locationRoutes);
app.use("/api/location/notifications", notificationRoutes);

// API docs only outside production (LOC-14).
if (process.env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ─── 404 Handler (JSON)
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler: real message only for client errors (LOC-23)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error("Unhandled error", { message: err.message, stack: err.stack });
  }
  res.status(status).json({
    success: false,
    message:
      status < 500 ? err.message : "Something went wrong. Please try again.",
  });
});

export default app;
