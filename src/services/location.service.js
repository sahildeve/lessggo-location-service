import Location from "../models/Location.js";
import Ride from "../models/Ride.js";
import logger from "../utils/logger.js";

//  save pickup and dropoff loaction
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
      coordinates: [lng, lat], // MongoDB me pehle longitude phir latitude
    },
  });

  return location;
};

//  Get user location
export const getUserLocations = async (userId) => {
  const locations = await Location.find({ userId, isActive: true }).lean();
  return locations;
};

// create ride
export const createRide = async (
  userId,
  username,
  pickupLocationId,
  dropoffLocationId,
) => {
  const ride = await Ride.create({
    users: [
      {
        userId,
        username,
        status: "waiting",
        pickupLocation: pickupLocationId,
        dropoffLocation: dropoffLocationId,
      },
    ],
  });

  return ride;
};

// Join ride
export const joinRide = async (
  rideId,
  userId,
  username,
  pickupLocationId,
  dropoffLocationId,
) => {
  const ride = await Ride.findById(rideId);

  if (!ride) {
    const err = new Error("Ride not found");
    err.status = 404;
    throw err;
  }

  if (ride.status !== "scheduled") {
    const err = new Error("Ride is no longer accepting users");
    err.status = 400;
    throw err;
  }

  if (ride.users.length >= ride.maxUsers) {
    const err = new Error("Ride is full");
    err.status = 400;
    throw err;
  }

  //   Check if user already in ride
  const alreadyJoined = ride.users.find((u) => u.userId.toString() === userId);
  if (alreadyJoined) {
    const err = new Error("You are already in this ride");
    err.status = 400;
    throw err;
  }

  ride.users.push({
    userId,
    username,
    status: "waiting",
    pickupLocation: pickupLocationId,
    dropoffLocation: dropoffLocationId,
  });
  await ride.save();

  return ride;
};

//  Get ride
export const getRide = async (rideId) => {
  const ride = await Ride.findById(rideId)
    .populate("users.pickupLocation")
    .populate("users.dropoffLocation")
    .lean();

  if (!ride) {
    const err = new Error("Ride not found");
    err.status = 404;
    throw err;
  }

  return ride;
};

//  update cab live location
export const updateCabLocation = async (rideId, lat, lng) => {
  const ride = await Ride.findByIdAndUpdate(
    rideId,
    {
      $set: {
        cabLiveLocation: {
          type: "Point",
          coordinates: [lng, lat],
        },
      },
      $push: {
        routeCoordinates: {
          coordinates: [lng, lat],
          timestamp: new Date(),
        },
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
  // Update ya create live location
  const location = await Location.findOneAndUpdate(
    { userId, rideId, type: "live" },
    {
      $set: {
        userId,
        rideId,
        type: "live",
        coordinates: {
          type: "Point",
          coordinates: [lng, lat],
        },
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );

  return location;
};
