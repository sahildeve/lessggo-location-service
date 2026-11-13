import redis from "../config/redis.js";
import logger from "./logger.js";

// ride_members / ride_driver live until the ride can no longer be running:
// departure + max ride duration + 2h grace (LOC-08). They used to expire 7
// days after the last action, which broke tracking and chat on rides booked
// more than a week ahead.
const MAX_RIDE_DURATION_MS =
  Number(process.env.RIDE_MAX_DURATION_HOURS || 6) * 60 * 60 * 1000;
const GRACE_MS = 2 * 60 * 60 * 1000;
const expireAtSeconds = (departureTime) =>
  Math.floor(
    (new Date(departureTime).getTime() + MAX_RIDE_DURATION_MS + GRACE_MS) /
      1000,
  );

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// MongoDB is already written when these run. Retry briefly, and on failure log
// instead of failing the request: a 500 here made clients retry actions that had
// already succeeded (duplicate rides). A reconciliation job will repair leftovers.
const withRetry = async (label, context, fn) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await fn();
      return true;
    } catch (err) {
      if (attempt === 3) {
        logger.error(`ride membership ${label} failed`, {
          ...context,
          message: err.message,
        });
        return false;
      }
      await sleep(200 * attempt);
    }
  }
  return false;
};

const execOrThrow = async (multi) => {
  const results = await multi.exec();
  const failed = (results || []).find(([err]) => err);
  if (failed) throw failed[0];
};

export const setRideDriver = (rideId, driverId, departureTime) =>
  withRetry("set driver", { rideId: String(rideId) }, () => {
    const at = expireAtSeconds(departureTime);
    return execOrThrow(
      redis
        .multi()
        .sadd(`ride_members:${rideId}`, String(driverId))
        .set(`ride_driver:${rideId}`, String(driverId))
        .expireat(`ride_members:${rideId}`, at)
        .expireat(`ride_driver:${rideId}`, at),
    );
  });

export const addRideMember = (rideId, userId, departureTime) =>
  withRetry("add", { rideId: String(rideId), userId: String(userId) }, () => {
    const at = expireAtSeconds(departureTime);
    return execOrThrow(
      redis
        .multi()
        .sadd(`ride_members:${rideId}`, String(userId))
        .expireat(`ride_members:${rideId}`, at)
        .expireat(`ride_driver:${rideId}`, at),
    );
  });

export const removeRideMember = (rideId, userId) =>
  withRetry("remove", { rideId: String(rideId), userId: String(userId) }, () =>
    redis.srem(`ride_members:${rideId}`, String(userId)),
  );

export const deleteRideMembership = (rideId) =>
  withRetry("delete", { rideId: String(rideId) }, () =>
    redis.del(`ride_members:${rideId}`, `ride_driver:${rideId}`),
  );
