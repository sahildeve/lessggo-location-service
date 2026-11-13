import cron from "node-cron";
import Ride from "../models/Ride.js";
import logger from "../utils/logger.js";
import redis from "./redis.js";
import { createNotification } from "../utils/notification.js";
import { sendRideStartedEmail } from "../utils/emailNotification.js";
import { closeRideRoom } from "../utils/rideRooms.js";

// A ride with no riders expires this long after its departure time.
const NO_RIDER_GRACE_MS = 15 * 60 * 1000;
// An ongoing ride the driver never ended expires this long after DEPARTURE
// (LOC-06). It used to be 15 minutes after the cron marked it ongoing, so
// every ride longer than ~15 minutes was cut off mid-trip.
const MAX_RIDE_DURATION_MS =
  Number(process.env.RIDE_MAX_DURATION_HOURS || 6) * 60 * 60 * 1000;

// Only the fields the cron needs: never the GPS trail (LOC-09, LOC-10).
const CRON_FIELDS =
  "offeredBy from to departureTime riders.userId riders.status";
const ACTIVE = ["upcoming", "full"];

let cronTask = null;

const notifyUser = async (io, userId, event, type, title, payload) => {
  io?.to(`user:${String(userId)}`).emit(event, payload);
  await createNotification({
    userId,
    type,
    title,
    message: payload.message,
    data: { rideId: payload.rideId },
  });
};

// Emails are best effort and must not hold up the cron run (LOC-16).
const sendEmailLater = (userId, ride, role) => {
  sendRideStartedEmail(userId, ride, role).catch((err) =>
    logger.warn("Ride started email failed", {
      rideId: String(ride._id),
      message: err.message,
    }),
  );
};

const closeRide = async (io, ride) => {
  await redis.del(`ride_members:${ride._id}`, `ride_driver:${ride._id}`);
  closeRideRoom(io, ride._id, "expired"); // GWR-01
};

const runCron = async (io) => {
  const now = new Date();
  let started = 0;
  let expiredEmpty = 0;
  let expiredOngoing = 0;

  // ── Case 1 & 2: upcoming/full rides whose departure time has come ──
  const dueRides = await Ride.find({
    status: { $in: ACTIVE },
    departureTime: { $lte: now },
  })
    .select(CRON_FIELDS)
    .lean();

  for (const ride of dueRides) {
    const acceptedRiders = ride.riders.filter((r) => r.status === "accepted");
    const text = `Your ride from ${ride.from.address} to ${ride.to.address}`;

    if (acceptedRiders.length > 0) {
      // ── Case 2: has riders -> ongoing. Claim atomically (LOC-16): the cron
      // runs on every instance, only the one that changes the status notifies.
      const claimed = await Ride.updateOne(
        { _id: ride._id, status: { $in: ACTIVE } },
        { $set: { status: "ongoing", startedAt: now } },
      );
      if (!claimed.modifiedCount) continue;
      started += 1;

      const payload = {
        rideId: ride._id,
        from: ride.from.address,
        to: ride.to.address,
        message: `${text} is starting now`,
      };
      await notifyUser(
        io,
        ride.offeredBy.userId,
        "ride_started",
        "ride_started",
        "Your Ride Has Started",
        payload,
      );
      sendEmailLater(ride.offeredBy.userId, ride, "driver");
      for (const rider of acceptedRiders) {
        await notifyUser(
          io,
          rider.userId,
          "ride_started",
          "ride_started",
          "Your Ride Has Started",
          payload,
        );
        sendEmailLater(rider.userId, ride, "rider");
      }
    } else if (
      ride.departureTime <= new Date(now.getTime() - NO_RIDER_GRACE_MS)
    ) {
      // ── Case 1: no riders and the grace period is over -> expired.
      // The claim also requires that nobody was accepted in the meantime.
      const claimed = await Ride.updateOne(
        {
          _id: ride._id,
          status: { $in: ACTIVE },
          "riders.status": { $ne: "accepted" },
        },
        { $set: { status: "expired" } },
      );
      if (!claimed.modifiedCount) continue;
      expiredEmpty += 1;

      await closeRide(io, ride);
      await notifyUser(
        io,
        ride.offeredBy.userId,
        "ride_expired",
        "ride_expired",
        "Ride Expired",
        {
          rideId: ride._id,
          from: ride.from.address,
          to: ride.to.address,
          message: `${text} has expired`,
        },
      );
    }
  }

  // ── Case 3: ongoing rides the driver never ended, long after departure (LOC-06) ──
  const overdueOngoing = await Ride.find({
    status: "ongoing",
    departureTime: { $lte: new Date(now.getTime() - MAX_RIDE_DURATION_MS) },
  })
    .select(CRON_FIELDS)
    .lean();

  for (const ride of overdueOngoing) {
    const claimed = await Ride.updateOne(
      { _id: ride._id, status: "ongoing" },
      { $set: { status: "expired" } },
    );
    if (!claimed.modifiedCount) continue;
    expiredOngoing += 1;

    await closeRide(io, ride);
    const payload = {
      rideId: ride._id,
      from: ride.from.address,
      to: ride.to.address,
      message: `Your ride from ${ride.from.address} to ${ride.to.address} has expired`,
    };
    await notifyUser(
      io,
      ride.offeredBy.userId,
      "ride_expired",
      "ride_expired",
      "Ride Expired",
      payload,
    );
    for (const rider of ride.riders.filter((r) => r.status === "accepted")) {
      await notifyUser(
        io,
        rider.userId,
        "ride_expired",
        "ride_expired",
        "Ride Expired",
        payload,
      );
    }
  }

  if (started || expiredEmpty || expiredOngoing) {
    logger.info("Cron: rides updated", {
      started,
      expiredEmpty,
      expiredOngoing,
    });
  }
};

export const startCronJobs = (io) => {
  cronTask = cron.schedule("*/5 * * * *", async () => {
    try {
      await runCron(io);
    } catch (err) {
      logger.error("Cron job error", {
        message: err.message,
        stack: err.stack,
      });
    }
  });
  logger.info("Cron jobs started");
};

// Called on shutdown (LOC-12) so no new run starts on a closing instance.
export const stopCronJobs = () => {
  cronTask?.stop();
  cronTask = null;
};
