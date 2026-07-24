import cron from "node-cron";
import Ride from "../models/Ride.js";
import logger from "../utils/logger.js";
import redis from "./redis.js";
import { createNotification } from "../utils/notification.js";
import { sendRideStartedEmail } from "../utils/emailNotification.js";

const GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

export const startCronJobs = (io) => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      logger.info("Cron: Checking rides...");

      const now = new Date();
      const graceWindow = new Date(now.getTime() - GRACE_PERIOD_MS);

      // ── Case 1 & 2: upcoming/full rides jinka departureTime aa gaya ──
      const dueRides = await Ride.find({
        status: { $in: ["upcoming", "full"] },
        departureTime: { $lte: now },
      });

      for (const ride of dueRides) {
        const acceptedRiders = ride.riders.filter(
          (r) => r.status === "accepted",
        );

        if (acceptedRiders.length > 0) {
          // ── Case 2: Riders hain → "ongoing" bana do ──
          ride.status = "ongoing";
          ride.startedAt = new Date();
          await ride.save();

          logger.info(`Ride ${ride._id} started (ongoing)`, {
            riderCount: acceptedRiders.length,
          });

          const ridePayload = {
            rideId: ride._id,
            from: ride.from.address,
            to: ride.to.address,
            message: `Your ride from ${ride.from.address} to ${ride.to.address} is starting now`,
          };

          // Driver ko notify karo
          if (io) {
            io.to(`user:${ride.offeredBy.userId.toString()}`).emit(
              "ride_started",
              ridePayload,
            );
          }
          await createNotification({
            userId: ride.offeredBy.userId,
            type: "ride_started",
            title: "Your Ride Has Started",
            message: ridePayload.message,
            data: { rideId: ride._id },
          });
          await sendRideStartedEmail(ride.offeredBy.userId, ride, "driver");

          // Riders ko notify karo
          for (const rider of acceptedRiders) {
            if (io) {
              io.to(`user:${rider.userId.toString()}`).emit(
                "ride_started",
                ridePayload,
              );
            }
            await createNotification({
              userId: rider.userId,
              type: "ride_started",
              title: "Your Ride Has Started",
              message: ridePayload.message,
              data: { rideId: ride._id },
            });
            await sendRideStartedEmail(rider.userId, ride, "rider");
          }
        } else if (ride.departureTime <= graceWindow) {
          // ── Case 1: Koi rider nahi + 15 min grace nikal gaya → expired ──
          ride.status = "expired";
          await ride.save();

          await redis.del(`ride_members:${ride._id}`);

          if (io) {
            io.to(`user:${ride.offeredBy.userId.toString()}`).emit(
              "ride_expired",
              {
                rideId: ride._id,
                from: ride.from.address,
                to: ride.to.address,
                message: `Your ride from ${ride.from.address} to ${ride.to.address} has expired`,
              },
            );
          }
          await createNotification({
            userId: ride.offeredBy.userId,
            type: "ride_expired",
            title: "Ride Expired",
            message: `Your ride from ${ride.from.address} to ${ride.to.address} has expired`,
            data: { rideId: ride._id },
          });

          logger.info(`Ride ${ride._id} expired (no riders)`);
        }
        // agar grace window abhi nahi nikla → kuch mat karo, agle cron run mein dekhenge
      }

      // ── Case 3: ongoing rides jinka 15 min grace nikal gaya (driver ne complete nahi kiya) ──
      const overdueOngoing = await Ride.find({
        status: "ongoing",
        startedAt: { $lte: graceWindow },
      });

      for (const ride of overdueOngoing) {
        ride.status = "expired";
        await ride.save();

        await redis.del(`ride_members:${ride._id}`);

        const expiredPayload = {
          rideId: ride._id,
          from: ride.from.address,
          to: ride.to.address,
          message: `Your ride from ${ride.from.address} to ${ride.to.address} has expired`,
        };

        // Driver ko notify karo
        if (io) {
          io.to(`user:${ride.offeredBy.userId.toString()}`).emit(
            "ride_expired",
            expiredPayload,
          );
        }
        await createNotification({
          userId: ride.offeredBy.userId,
          type: "ride_expired",
          title: "Ride Expired",
          message: expiredPayload.message,
          data: { rideId: ride._id },
        });

        // Accepted riders ko bhi notify karo ← naya (ongoing case mein riders bhi milne chahiye)
        const acceptedRiders = ride.riders.filter((r) => r.status === "accepted");
        for (const rider of acceptedRiders) {
          if (io) {
            io.to(`user:${rider.userId.toString()}`).emit(
              "ride_expired",
              expiredPayload,
            );
          }
          await createNotification({
            userId: rider.userId,
            type: "ride_expired",
            title: "Ride Expired",
            message: expiredPayload.message,
            data: { rideId: ride._id },
          });
        }

        logger.info(`Ride ${ride._id} expired (ongoing timeout)`);
      }

      logger.info(
        `Cron: processed ${dueRides.length} due rides, ${overdueOngoing.length} overdue ongoing rides`,
      );
    } catch (err) {
      logger.error("Cron job error:", err.message);
    }
  });

  logger.info("Cron jobs started");
};