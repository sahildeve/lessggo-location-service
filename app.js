import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import locationRoutes from "./src/routes/location.routes.js";

const app = express();

// ─── Security Middlewares
app.use(helmet());
app.set("trust proxy", 1);
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
);

// ─── Body Parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ─── Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Routes
app.use("/api/location", locationRoutes);

// ─── Health Check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "location-service" });
});

// ─── Global Error Handler
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;
