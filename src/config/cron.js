import cron from "node-cron";
import Ride from "../models/Ride.js";
import logger from "../utils/logger.js";
import redis from "./redis.js";
import { createNotification } from "../utils/notification.js";  // ← import add karo

export const startCronJobs = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info("Cron: Checking for expired rides...");

      const gracePeriod = new Date(Date.now() - 5 * 60 * 1000);

      const expiredRides = await Ride.find({
        status: { $in: ["active", "full"] },
        departureTime: { $lt: gracePeriod },
      }).lean();

      if (expiredRides.length === 0) {
        logger.info("Cron: No expired rides found");
        return;
      }

      const expiredRideIds = expiredRides.map((r) => r._id);

      await Ride.updateMany(
        { _id: { $in: expiredRideIds } },
        { $set: { status: "expired" } },
      );

      // Redis cleanup + notification — loop ke andar ← fix
      for (const ride of expiredRides) {
        await redis.del(`ride_members:${ride._id}`);

        await createNotification({        
          userId: ride.offeredBy.userId,
          type: "ride_expired",
          title: "Ride Expired",
          message: `Your ride from ${ride.from.address} to ${ride.to.address} has expired`,
          data: { rideId: ride._id },
        });
      }

      logger.info(`Cron: ${expiredRides.length} rides marked as expired`);
    } catch (err) {
      logger.error("Cron job error:", err.message);
    }
  });

  logger.info("Cron jobs started");
};