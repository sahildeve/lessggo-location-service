import * as locationService from "../services/location.service.js";
import { success, error } from "../utils/response.js";
import logger from "../utils/logger.js";

// ─── Save Location
export const saveLocation = async (req, res) => {
  try {
    const location = await locationService.saveLocation(req.user.sub, req.body);
    return success(res, { location }, "Location saved successfully", 201);
  } catch (err) {
    logger.error("Save location error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Get User Locations
export const getUserLocations = async (req, res) => {
  try {
    const locations = await locationService.getUserLocations(req.user.sub);
    return success(res, { locations }, "Locations fetched successfully");
  } catch (err) {
    logger.error("Get locations error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Offer Ride
export const offerRide = async (req, res) => {
  try {
    const { ride, interestedUsers } = await locationService.offerRide(
      req.user.sub,
      req.user.username,
      req.user.fullName,   // ← ye add
      req.body,
    );
    return success(
      res,
      { ride, interestedUsers, interestedCount: interestedUsers.length },
      "Ride offered successfully",
      201,
    );
  } catch (err) {
    logger.error("Offer ride error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Search Rides
export const searchRides = async (req, res) => {
  try {
    const rides = await locationService.searchRides({
      ...req.body,
      userId: req.user.sub,
      username: req.user.fullName || req.user.username,
    });
    return success(
      res,
      { rides, count: rides.length },
      "Rides fetched successfully",
    );
  } catch (err) {
    logger.error("Search rides error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Request to Join Ride
export const requestRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await locationService.requestRide(
      rideId,
      req.user.sub,
      req.user.username,
      req.user.fullName, // ← ye add
      req.body,
    );
    return success(res, { ride }, "Ride request sent successfully");
  } catch (err) {
    logger.error("Request ride error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Accept / Reject Ride Request
export const respondToRequest = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { riderId, action } = req.body;
    const ride = await locationService.respondToRequest(
      rideId,
      riderId,
      action,
      req.user.sub,
    );
    return success(res, { ride }, `Rider ${action} successfully`);
  } catch (err) {
    logger.error("Respond to request error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Get Ride
export const getRide = async (req, res) => {
  try {
    const ride = await locationService.getRide(req.params.rideId);
    return success(res, { ride }, "Ride fetched successfully");
  } catch (err) {
    logger.error("Get ride error:", { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Update Cab Live Location
export const updateCabLocation = async (req, res) => {
  try {
    const { rideId, lat, lng } = req.body;
    const ride = await locationService.updateCabLocation(rideId, lat, lng);
    return success(res, { ride }, "Cab location updated");
  } catch (err) {
    logger.error("Update cab location error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

export const endRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await locationService.endRide(rideId, req.user.sub);
    return success(res, { ride }, "Ride ended successfully");
  } catch (err) {
    logger.error("End ride error:", { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};


// ─── Get Interested Users for an existing ride 
export const getInterestedUsers = async (req, res) => {
  try {
    const { rideId } = req.params;
    const data = await locationService.getInterestedUsersForRide(rideId, req.user.sub);
    return success(res, data, 'Interested users fetched successfully');
  } catch (err) {
    logger.error('Get interested users error:', { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};