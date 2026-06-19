import Location from "../models/Location.js";
import Ride from "../models/Ride.js";
import redis from "../config/redis.js";
import logger from "../utils/logger.js";
import SearchRequest from '../models/SearchRequest.js';

// ─── Save Pickup/Dropoff Location
export const saveLocation = async (
  userId,
  { type, address, landmark, city, lat, lng },
) => {
  const location = await Location.create({
    userId,
    type,
    address,
    landmark,
    city,
    coordinates: {
      type: "Point",
      coordinates: [lng, lat],
    },
  });
  return location;
};

// ─── Get User Locations
export const getUserLocations = async (userId) => {
  const locations = await Location.find({ userId, isActive: true }).lean();
  return locations;
};

// ─── Offer Ride
export const offerRide = async (
  userId,
  username,
  fullName,
  {
    fromAddress,
    fromCity,
    fromLat,
    fromLng,
    toAddress,
    toCity,
    toLat,
    toLng,
    departureTime,
    availableSeats,
    pricePerSeat,
  },
) => {
  const ride = await Ride.create({
    offeredBy: { userId, username: fullName || username },
    from: {
      address: fromAddress,
      city: fromCity,
      coordinates: { type: "Point", coordinates: [fromLng, fromLat] },
    },
    to: {
      address: toAddress,
      city: toCity,
      coordinates: { type: "Point", coordinates: [toLng, toLat] },
    },
    departureTime,
    availableSeats,
    pricePerSeat,
  });

  await redis.sadd(`ride_members:${ride._id}`, userId);
  await redis.expire(`ride_members:${ride._id}`, 86400 * 7); // 7 days

  // ── Interested users dhundo jinhone ye route search kiya tha
  const interestedUsers = await findInterestedUsers({
    fromLat,
    fromLng,
    toLat,
    toLng,
    departureTime,
  });

  return { ride, interestedUsers };
};

// ─── Search Rides (Algorithm)
export const searchRides = async ({
  userId,
  username,
  fromAddress,
  fromLat,
  fromLng,
  toAddress,
  toLat,
  toLng,
  departureTime,
}) => {
  const RADIUS_METERS = 5000; // 5km radius me pickup dhundna

  // Step 1: Departure time ke aas paas rides dhundo (±2 hours)
  const timeFrom = new Date(
    new Date(departureTime).getTime() - 2 * 60 * 60 * 1000,
  );
  const timeTo = new Date(
    new Date(departureTime).getTime() + 2 * 60 * 60 * 1000,
  );

  // Step 2: MongoDB geospatial query — from location ke paas rides
  const rides = await Ride.find({
    status: "active",
    departureTime: { $gte: timeFrom, $lte: timeTo },
    "from.coordinates": {
      $near: {
        $geometry: { type: "Point", coordinates: [fromLng, fromLat] },
        $maxDistance: RADIUS_METERS,
      },
    },
    $expr: {
      $gt: [
        "$availableSeats",
        {
          $size: {
            $filter: {
              input: "$riders",
              cond: { $eq: ["$$this.status", "accepted"] },
            },
          },
        },
      ],
    },
  }).lean();

  // Step 3: Filter — destination bhi match karna chahiye (same direction)
  const matched = rides.filter((ride) => {
    const rideToLng = ride.to.coordinates.coordinates[0];
    const rideToLat = ride.to.coordinates.coordinates[1];

    // Simple direction check — rider ka destination ride ke destination ke paas hai?
    const distance = getDistanceKm(toLat, toLng, rideToLat, rideToLng);
    return distance <= 10; // 10km ke andar destination
  });

  // ── Step 4: Search ko save karo — taaki future me ride offer hone pe match ho sake ──
  await SearchRequest.create({
    userId,
    username,
    from: {
      address: fromAddress,
      coordinates: { type: "Point", coordinates: [fromLng, fromLat] },
    },
    to: {
      address: toAddress,
      coordinates: { type: "Point", coordinates: [toLng, toLat] },
    },
    departureTime,
  });

  return matched;
};

// ─── Haversine Distance Formula
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Request to Join Ride
export const requestRide = async (
  rideId,
  userId,
  username,
  fullName,
  { pickupAddress, pickupLat, pickupLng },
) => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    const err = new Error("Ride not found");
    err.status = 404;
    throw err;
  }
  if (ride.status !== "active") {
    const err = new Error("Ride is not accepting requests");
    err.status = 400;
    throw err;
  }
  if (ride.offeredBy.userId.toString() === userId) {
    const err = new Error("You cannot join your own ride");
    err.status = 400;
    throw err;
  }

  const alreadyRequested = ride.riders.find(
    (r) => r.userId.toString() === userId,
  );
  if (alreadyRequested) {
    const err = new Error("You have already requested this ride");
    err.status = 400;
    throw err;
  }

  ride.riders.push({
    userId,
    username: fullName || username,
    status: "pending",
    pickupLocation: {
      address: pickupAddress,
      coordinates: { type: "Point", coordinates: [pickupLng, pickupLat] },
    },
  });

  await ride.save();
  return ride;
};

// ─── Accept / Reject Ride Request
export const respondToRequest = async (
  rideId,
  riderId,
  action,
  offeredByUserId,
) => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    const err = new Error("Ride not found");
    err.status = 404;
    throw err;
  }
  if (ride.offeredBy.userId.toString() !== offeredByUserId) {
    const err = new Error("Only ride owner can accept/reject");
    err.status = 403;
    throw err;
  }

  const rider = ride.riders.find((r) => r.userId.toString() === riderId);
  if (!rider) {
    const err = new Error("Rider request not found");
    err.status = 404;
    throw err;
  }

  rider.status = action;

  // ── Agar accept hua toh Redis me add karo ─────────────────────
  if (action === "accepted") {
    await redis.sadd(`ride_members:${rideId}`, riderId);
    await redis.expire(`ride_members:${rideId}`, 86400 * 7);
  }

  const acceptedCount = ride.riders.filter(
    (r) => r.status === "accepted",
  ).length;
  if (acceptedCount >= ride.availableSeats) {
    ride.status = "full";
  }

  await ride.save();
  return ride;
};

// ─── Get Ride
export const getRide = async (rideId) => {
  const ride = await Ride.findById(rideId).lean();
  if (!ride) {
    const err = new Error("Ride not found");
    err.status = 404;
    throw err;
  }
  return ride;
};

// ─── Update Cab Live Location
export const updateCabLocation = async (rideId, lat, lng) => {
  const ride = await Ride.findByIdAndUpdate(
    rideId,
    {
      $set: { cabLiveLocation: { type: "Point", coordinates: [lng, lat] } },
      $push: {
        routeCoordinates: { coordinates: [lng, lat], timestamp: new Date() },
      },
    },
    { new: true },
  );
  if (!ride) {
    const err = new Error("Ride not found");
    err.status = 404;
    throw err;
  }
  return ride;
};

// ─── Save User Live Location
export const saveUserLiveLocation = async (userId, rideId, lat, lng) => {
  const location = await Location.findOneAndUpdate(
    { userId, rideId, type: "live" },
    {
      $set: {
        userId,
        rideId,
        type: "live",
        coordinates: { type: "Point", coordinates: [lng, lat] },
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );
  return location;
};

// ─── End Ride
export const endRide = async (rideId, userId) => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    const err = new Error("Ride not found");
    err.status = 404;
    throw err;
  }
  if (ride.offeredBy.userId.toString() !== userId) {
    const err = new Error("Only ride owner can end the ride");
    err.status = 403;
    throw err;
  }

  ride.status = "completed";
  ride.completedAt = new Date();
  await ride.save();

  // Redis se members delete karo
  await redis.del(`ride_members:${rideId}`);

  return ride;
};

// ─── Find Interested Users (jinhone is route ko search kiya tha)
export const findInterestedUsers = async ({
  fromLat,
  fromLng,
  toLat,
  toLng,
  departureTime,
}) => {
  const RADIUS_METERS = 5000;

  const timeFrom = new Date(
    new Date(departureTime).getTime() - 2 * 60 * 60 * 1000,
  );
  const timeTo = new Date(
    new Date(departureTime).getTime() + 2 * 60 * 60 * 1000,
  );

  // Step 1: Geospatial query — pickup ke paas search requests dhundo
  const searches = await SearchRequest.find({
    departureTime: { $gte: timeFrom, $lte: timeTo },
    "from.coordinates": {
      $near: {
        $geometry: { type: "Point", coordinates: [fromLng, fromLat] },
        $maxDistance: RADIUS_METERS,
      },
    },
  }).lean();

  // Step 2: Destination bhi match karna chahiye
  const matched = searches.filter((s) => {
    const sToLng = s.to.coordinates.coordinates[0];
    const sToLat = s.to.coordinates.coordinates[1];
    const distance = getDistanceKm(toLat, toLng, sToLat, sToLng);
    return distance <= 10;
  });

  // Step 3: Sirf zaroori info return karo
  return matched.map((s) => ({
    userId: s.userId,
    username: s.username,
    searchedRoute: { from: s.from.address, to: s.to.address },
    searchedAt: s.createdAt,
  }));
};


// ─── Get Interested Users for an existing ride (owner only)
export const getInterestedUsersForRide = async (rideId, userId) => {
  const ride = await Ride.findById(rideId).lean();

  if (!ride) {
    const err = new Error('Ride not found');
    err.status = 404;
    throw err;
  }
  if (ride.offeredBy.userId.toString() !== userId) {
    const err = new Error('Only ride owner can view interested users');
    err.status = 403;
    throw err;
  }

  const fromLat = ride.from.coordinates.coordinates[1];
  const fromLng = ride.from.coordinates.coordinates[0];
  const toLat   = ride.to.coordinates.coordinates[1];
  const toLng   = ride.to.coordinates.coordinates[0];

  const interestedUsers = await findInterestedUsers({
    fromLat, fromLng, toLat, toLng,
    departureTime: ride.departureTime,
  });

  return { interestedUsers, count: interestedUsers.length };
};