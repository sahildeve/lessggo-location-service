import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./src/config/swagger.js";
import locationRoutes from "./src/routes/location.routes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Location Service Running",
  });
});

app.use("/api/location", locationRoutes);

export default app;