import * as locationService from "../services/location.service.js";
import { success, error } from "../utils/response.js";
import logger from "../utils/logger.js";
import { getDisplayName } from "../utils/displayName.js";
import { publishEvent } from "../utils/eventPublisher.js";

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
      req.user.fullName,
      req.body,
    );

    await publishEvent("RIDE_OFFERED", {
      offererId: req.user.sub,
      ride: ride.toObject ? ride.toObject() : ride,
      interestedUsers: interestedUsers || [],
    });

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
    const fallbackName = getDisplayName(req.user);
    const { matched, newSearchRequest } = await locationService.searchRides({
      ...req.body,
      userId: req.user.sub,
      username: fallbackName,
    });

    if (newSearchRequest) {
      await publishEvent("RIDE_SEARCHED", {
        searcherId: req.user.sub,
        fallbackName,
        matchedRideIds: matched.map((r) => r._id),
        newSearchRequest: newSearchRequest.toObject
          ? newSearchRequest.toObject()
          : newSearchRequest,
      });
    }

    return success(
      res,
      { rides: matched, count: matched.length },
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
    const fallbackName = getDisplayName(req.user);

    const ride = await locationService.requestRide(
      rideId,
      req.user.sub,
      req.user.username,
      req.user.fullName,
      req.body,
    );

    const rider = ride.riders.find((r) => r.userId.toString() === req.user.sub);

    await publishEvent("RIDE_REQUESTED", {
      rideId: ride._id.toString(),
      driverId: ride.offeredBy.userId,
      riderId: req.user.sub,
      fallbackName,
      riderUsername: rider?.username,
      fromLocation: rider?.pickupLocation?.address || req.body.pickupAddress,
      toLocation: ride.to?.address,
      fromCoordinates: {
        lat:
          rider?.pickupLocation?.coordinates?.coordinates?.[1] ??
          req.body.pickupLat,
        lng:
          rider?.pickupLocation?.coordinates?.coordinates?.[0] ??
          req.body.pickupLng,
      },
      requestedAt: rider?.requestedAt,
    });

    return success(res, { ride }, "Ride request sent successfully");
  } catch (err) {
    logger.error("Request ride error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Driver invites a rider
export const inviteRider = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { toUserId, toUsername } = req.body;

    const ride = await locationService.inviteRider(
      rideId,
      req.user.sub,
      toUserId,
      toUsername,
    );

    await publishEvent("RIDE_INVITE_SENT", {
      rideId,
      fromUserId: req.user.sub,
      fallbackName: getDisplayName(req.user),
      toUserId,
    });

    return success(res, { ride }, "Invite sent successfully");
  } catch (err) {
    logger.error("Invite rider error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Driver cancels an invite
export const withdrawInviteByDriver = async (req, res) => {
  try {
    const { rideId, toUserId } = req.params;

    const ride = await locationService.withdrawInviteByDriver(
      rideId,
      req.user.sub,
      toUserId,
    );

    await publishEvent("RIDE_INVITE_WITHDRAWN", {
      rideId,
      driverName: getDisplayName(req.user),
      toUserId,
    });

    return success(res, { ride }, "Invite withdrawn successfully");
  } catch (err) {
    logger.error("Withdraw invite error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Rider exits/cancels an accepted ride
export const cancelRiderRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await locationService.exitRide(rideId, req.user.sub);

    await publishEvent("RIDER_EXITED", {
      rideId,
      driverId: ride.offeredBy.userId,
      riderId: req.user.sub,
      riderName: getDisplayName(req.user),
      availableSeats: ride.availableSeats,
    });

    return success(res, { ride }, "You have exited the ride successfully");
  } catch (err) {
    logger.error("Cancel rider ride error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Remove accepted rider by offer side
export const removeRider = async (req, res) => {
  try {
    const { rideId, riderId } = req.params;
    const { ride } = await locationService.removeRider(
      rideId,
      riderId,
      req.user.sub,
    );

    await publishEvent("RIDER_REMOVED", {
      rideId,
      riderId,
      availableSeats: ride.availableSeats,
    });

    return success(res, { ride }, "Rider removed successfully");
  } catch (err) {
    logger.error("Remove rider error:", {
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
    const { ride, rider } = await locationService.respondToRequest(
      rideId,
      riderId,
      action,
      req.user.sub,
    );

    await publishEvent("RIDE_REQUEST_RESPONDED", {
      rideId: ride._id.toString(),
      driverId: req.user.sub,
      driverName: getDisplayName(req.user),
      riderId,
      riderUsername: rider?.username || "A rider",
      action,
      ride: {
        _id: ride._id,
        from: ride.from,
        to: ride.to,
        departureTime: ride.departureTime,
      },
    });

    return success(res, { ride }, `Rider ${action} successfully`);
  } catch (err) {
    logger.error("Respond to request error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Rider responds to invite
export const riderRespondToInvite = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { action } = req.body;

    const ride = await locationService.riderRespondToInvite(
      rideId,
      req.user.sub,
      action,
    );

    await publishEvent("RIDE_INVITE_RESPONDED", {
      rideId,
      driverId: ride.offeredBy.userId,
      riderId: req.user.sub,
      riderName: getDisplayName(req.user),
      action,
    });

    return success(res, { ride }, `Invite ${action} successfully`);
  } catch (err) {
    logger.error("Rider respond to invite error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Cancel ride by offer side
export const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await locationService.cancelRide(rideId, req.user.sub);

    const acceptedRiders = ride.riders.filter((r) => r.status === "accepted");

    await publishEvent("RIDE_CANCELLED", {
      rideId,
      driverName: getDisplayName(req.user),
      acceptedRiders,
      ride: ride.toObject ? ride.toObject() : ride,
    });

    return success(res, { ride }, "Ride cancelled successfully");
  } catch (err) {
    logger.error("Cancel ride error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Rider: Request Withdraw
export const withdrawRequest = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { ride, riderStatus } = await locationService.withdrawRequest(
      rideId,
      req.user.sub,
    );

    await publishEvent("RIDE_REQUEST_WITHDRAWN", {
      rideId,
      driverId: ride.offeredBy.userId,
      riderId: req.user.sub,
      fallbackName: getDisplayName(req.user),
      wasAccepted: riderStatus === "accepted",
      availableSeats: ride.availableSeats,
    });

    return success(res, { ride }, "Request withdrawn successfully");
  } catch (err) {
    logger.error("Withdraw request error:", {
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

// ─── End Ride
export const endRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await locationService.endRide(rideId, req.user.sub);

    const acceptedRiders = ride.riders.filter((r) => r.status === "accepted");

    await publishEvent("RIDE_ENDED", {
      rideId,
      acceptedRiders,
    });

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
    const data = await locationService.getInterestedUsersForRide(
      rideId,
      req.user.sub,
    );
    return success(res, data, "Interested users fetched successfully");
  } catch (err) {
    logger.error("Get interested users error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

export const getMyRides = async (req, res) => {
  try {
    const rides = await locationService.getMyRides(req.user.sub);
    return success(
      res,
      { rides, count: rides.length },
      "My rides fetched successfully",
    );
  } catch (err) {
    logger.error("Get my rides error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const rides = await locationService.getMyRequests(req.user.sub);
    return success(
      res,
      { rides, count: rides.length },
      "My requests fetched successfully",
    );
  } catch (err) {
    logger.error("Get my requests error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

export const getMyChats = async (req, res) => {
  try {
    const chats = await locationService.getMyChats(req.user.sub);
    return success(
      res,
      { chats, count: chats.length },
      "My chats fetched successfully",
    );
  } catch (err) {
    logger.error("Get my chats error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

export const getRidePastSuggesstion = async (req, res) => {
  try {
    const { date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const data = await locationService.getRidePastSuggesstion(
      req.user.sub,
      date,
      page,
      limit,
    );

    return success(res, data, "Ride history fetched successfully");
  } catch (err) {
    logger.error("Get ride history error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

export const getNearbyRidesOrSearches = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || !["offer", "search"].includes(type)) {
      return error(res, "Query param 'type' must be 'offer' or 'search'", 400);
    }

    const data = await locationService.getNearbyRidesOrSearches(type);

    return success(
      res,
      { [type === "offer" ? "rides" : "searches"]: data, count: data.length },
      "Nearby data fetched successfully",
    );
  } catch (err) {
    logger.error("Get nearby rides/searches error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Get My Search Requests (find ride)
export const getMySearchRequests = async (req, res) => {
  try {
    const searchRequests = await locationService.getMySearchRequests(
      req.user.sub,
    );

    return success(
      res,
      { searchRequests, count: searchRequests.length },
      "My search requests fetched successfully",
    );
  } catch (err) {
    logger.error("Get my search requests error:", {
      message: err.message,
      stack: err.stack,
    });
    return error(res, err.message, err.status || 500);
  }
};
