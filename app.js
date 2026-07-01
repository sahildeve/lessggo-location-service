import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger.js";
import locationRoutes from "./src/routes/location.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import Sentry from "./src/config/sentry.js";

const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Routes
app.use("/api/location", locationRoutes);

// existing routes 
app.use("/api/notifications", notificationRoutes);

// ─── Swagger Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "location-service" });
});

app.use((err, req, res, next) => {
  Sentry.captureException(err);
  next(err);
});

// ─── Global Error Handler
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;
