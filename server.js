import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./src/config/db.js";
import redis from "./src/config/redis.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 5004;

const startServer = async () => {
  try {
    await connectDB();
    await redis.connect();

    app.listen(PORT, () => {
      logger.info(`Location Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
};

startServer();