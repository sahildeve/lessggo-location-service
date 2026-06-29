import cron from "node-cron";
import Ride from "../models/Ride.js";
import logger from "../utils/logger.js";
import redis from "./redis.js";

export const startCornJobs = () => {
  // Har 5 minute me check
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info("Cron: Checking for expired rides...");

      // Grace period = 5 minutes
      const gracePeriod = new Date(Date.now() - 5 * 60 * 1000);

      // Active rides find jinka departureTime + 5min nikal gaya
      const expiredRides = await Ride.find({
        status: { $in: ['active', 'full'] },
        departureTime: { $lt: gracePeriod },
      }).lean();

      if (expiredRides.length === 0) {
        logger.info("Cron: No expired rides found");
        return;
      }

      // Bulk update
      const expiredRideIds = expiredRides.map((r) => r._id);

      await Ride.updateMany(
        { _id: { $in: expiredRideIds } },
        { $set: { status: "expired" } },
      );

      // Redis cleanup
      for (const ride of expiredRides) {
        await redis.del(`ride_members:${ride._id}`);
      }

      logger.info(`Cron: ${expiredRides.length} rides marked as expired`);
    } catch (err) {
      logger.error("Cron job error:", err.message);
    }
  });

  logger.info("Cron jobs started ");
};
