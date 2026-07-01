import * as locationService from "../services/location.service.js";
import * as chatServiceClient from "../utils/chatServiceClient.js";
import { success, error } from "../utils/response.js";
import logger from "../utils/logger.js";
import { createNotification } from "../utils/notification.js";

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

export const offerRide = async (req, res) => {
  try {
    const { ride, interestedUsers } = await locationService.offerRide(
      req.user.sub,
      req.user.username,
      req.user.fullName,
      req.body,
    );

    const io = req.app.get("io");
    if (io) {
      interestedUsers.forEach((user) => {
        io.to(`searching:${user.userId}`).emit("new_ride_available", {
          rideId: ride._id,
          offeredBy: ride.offeredBy,
          from: ride.from,
          to: ride.to,
          departureTime: ride.departureTime,
          availableSeats: ride.availableSeats,
          pricePerSeat: ride.pricePerSeat,
          message: "A new ride matching your search is available!",
        });
      });
    }

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

export const searchRides = async (req, res) => {
  try {
    const { matched, newSearchRequest } = await locationService.searchRides({
      ...req.body,
      userId: req.user.sub,
      username: req.user.fullName || req.user.username,
    });

    const io = req.app.get("io");
    if (io && newSearchRequest) {
      matched.forEach((ride) => {
        io.to(`watching:${ride._id}`).emit("new_interested_user", {
          searchRequestId: newSearchRequest._id,
          userId: req.user.sub,
          username: req.user.fullName || req.user.username,
          searchedRoute: {
            from: newSearchRequest.from.address,
            to: newSearchRequest.to.address,
            fromCoordinates: {
              lat: newSearchRequest.from.coordinates.coordinates[1],
              lng: newSearchRequest.from.coordinates.coordinates[0],
            },
            toCoordinates: {
              lat: newSearchRequest.to.coordinates.coordinates[1],
              lng: newSearchRequest.to.coordinates.coordinates[0],
            },
          },
          searchedAt: newSearchRequest.createdAt,
        });
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
    const ride = await locationService.requestRide(
      rideId,
      req.user.sub,
      req.user.username,
      req.user.fullName, // ← ye add
      req.body,
    );

    const io = req.app.get("io");
    const rider = ride.riders.find((r) => r.userId.toString() === req.user.sub);
    if (io && rider) {
      io.to(`user:${ride.offeredBy.userId.toString()}`).emit(
        "incoming_ride_request",
        {
          rideId: ride._id.toString(),
          riderId: req.user.sub,
          riderName: rider.username || req.user.fullName || req.user.username,
          role: "passenger",
          fromLocation: rider.pickupLocation?.address || req.body.pickupAddress,
          toLocation: ride.to?.address,
          fromCoordinates: {
            lat:
              rider.pickupLocation?.coordinates?.coordinates?.[1] ??
              req.body.pickupLat,
            lng:
              rider.pickupLocation?.coordinates?.coordinates?.[0] ??
              req.body.pickupLng,
          },
          requestedAt: rider.requestedAt,
        },
      );
    }

    await createNotification({
      userId: ride.offeredBy.userId,
      type: "ride_request_received",
      title: "New Ride Request",
      message: `${req.user.fullName || req.user.username} wants to join your ride`,
      data: { rideId: ride._id, riderId: req.user.sub },
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

    // Socket notification — invited user ko batao
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${toUserId}`).emit("ride_invite_received", {
        rideId,
        fromUserId: req.user.sub,
        fromUsername: req.user.fullName || req.user.username,
        message: "You have been invited to join this ride",
      });
    }

    await createNotification({
      userId: toUserId,
      type: "ride_invite_received",
      title: "Ride Invite Received",
      message: `${req.user.fullName || req.user.username} invited you to join a ride`,
      data: { rideId, fromUserId: req.user.sub },
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
      rideId, req.user.sub, toUserId,
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${toUserId}`).emit("ride_invite_withdrawn", {
        rideId,
        message: "Your ride invite has been withdrawn",
      });
    }

    await createNotification({
      userId: toUserId,
      type: "ride_invite_withdrawn",
      title: "Invite Withdrawn",
      message: `${req.user.fullName || req.user.username} withdrew your ride invite`,
      data: { rideId },
    });

    return success(res, { ride }, "Invite withdrawn successfully");
  } catch (err) {
    logger.error("Withdraw invite error:", { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Rider exits/cancel an accepted ride
export const cancelRiderRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await locationService.exitRide(rideId, req.user.sub);

    // Socket notification — driver ko batao
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${ride.offeredBy.userId.toString()}`).emit("rider_exited", {
        // ← sirf driver ko
        rideId,
        riderId: req.user.sub,
        riderName: req.user.fullName || req.user.username,
        availableSeats: ride.availableSeats,
        message: "A rider has left the ride",
      });
    }

    await createNotification({
      userId: ride.offeredBy.userId,
      type: "rider_exited",
      title: "Rider Left",
      message: `${req.user.fullName || req.user.username} has left your ride`,
      data: { rideId, availableSeats: ride.availableSeats },
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

//  --remove accpted rider by offer side
export const removeRider = async (req, res) => {
  try {
    const { rideId, riderId } = req.params;
    const { ride, riderStatus } = await locationService.removeRider(
      rideId, riderId, req.user.sub,
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${riderId}`).emit("rider_removed", {
        removedUserId: riderId,
        rideId,
        message: "You have been removed from this ride by the driver",
        availableSeats: ride.availableSeats,
      });
    }

    await createNotification({        // ← add karo
      userId: riderId,
      type: "rider_removed",
      title: "Removed from Ride",
      message: "You have been removed from the ride by the driver",
      data: { rideId },
    });

    return success(res, { ride }, "Rider removed successfully");
  } catch (err) {
    logger.error("Remove rider error:", { message: err.message, stack: err.stack });
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

    const io = req.app.get("io");
    const driverName = req.user.fullName || req.user.username;

    if (action === "accepted") {
      await chatServiceClient.postSystemMessage(
        rideId,
        `${rider.username} joined the ride`,
      );

      if (io) {
        io.to(`user:${riderId}`).emit("ride_request_accepted", {
          rideId: ride._id.toString(),
          driverId: req.user.sub,
          driverName,
          from: ride.from,
          to: ride.to,
          departureTime: ride.departureTime,
        });
      }
    } else if (action === "rejected" && io) {
      io.to(`user:${riderId}`).emit("ride_request_rejected", {
        rideId: ride._id.toString(),
        driverId: req.user.sub,
        driverName,
      });
    }

    await createNotification({
      userId: riderId,
      type:
        action === "accepted"
          ? "ride_request_accepted"
          : "ride_request_rejected",
      title:
        action === "accepted"
          ? "Ride Request Accepted!"
          : "Ride Request Rejected",
      message:
        action === "accepted"
          ? `${req.user.fullName || req.user.username} accepted your ride request`
          : `${req.user.fullName || req.user.username} rejected your ride request`,
      data: { rideId, driverName: req.user.fullName || req.user.username },
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

    if (action === "accepted") {
      await chatServiceClient.postSystemMessage(
        rideId,
        `${req.user.fullName || req.user.username} joined the ride`,
      );
    }

    // Driver ko notify karo
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${ride.offeredBy.userId.toString()}`).emit(
        action === "accepted" ? "invite_accepted" : "invite_rejected",
        {
          rideId,
          riderId: req.user.sub,
          riderName: req.user.fullName || req.user.username,
          message:
            action === "accepted"
              ? "Your invite has been accepted!"
              : "Your invite has been rejected",
        },
      );
    }

    await createNotification({
      userId: ride.offeredBy.userId,
      type: action === "accepted" ? "invite_accepted" : "invite_rejected",
      title: action === "accepted" ? "Invite Accepted!" : "Invite Rejected",
      message:
        action === "accepted"
          ? `${req.user.fullName || req.user.username} accepted your invite`
          : `${req.user.fullName || req.user.username} rejected your invite`,
      data: { rideId },
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

// Cancel ride by offer side
export const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await locationService.cancelRide(rideId, req.user.sub);

    await chatServiceClient.closeRideChat(
      rideId,
      "Ride has been cancelled by the driver",
    );

    const io = req.app.get("io");

    // Saare accepted riders ko notify + notification
    const acceptedRiders = ride.riders.filter((r) => r.status === "accepted");

    for (const r of acceptedRiders) {
      // Socket
      if (io) {
        io.to(`user:${r.userId}`).emit("ride_cancelled", {
          rideId,
          driverName: req.user.fullName || req.user.username,
          from: ride.from.address,
          to: ride.to.address,
          message: "Your ride has been cancelled by the driver",
        });
      }

      // Notification — io ke bahar, hamesha chalega
      await createNotification({
        userId: r.userId,
        type: "ride_cancelled",
        title: "Ride Cancelled",
        message: `${req.user.fullName || req.user.username} cancelled the ride`,
        data: { rideId, from: ride.from.address, to: ride.to.address },
      });
    }

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

    // ── Socket notification — driver ko batao
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${ride.offeredBy.userId.toString()}`).emit(
        "ride_request_withdrawn",
        {
          userId: req.user.sub,
          username: req.user.fullName || req.user.username,
          rideId,
          wasAccepted: riderStatus === "accepted",
          availableSeats: ride.availableSeats,
        },
      );
    }

    await createNotification({
      userId: ride.offeredBy.userId,
      type: "ride_request_withdrawn",
      title: "Request Withdrawn",
      message: `${req.user.fullName || req.user.username} withdrew their ride request`,
      data: { rideId, wasAccepted: riderStatus === "accepted" },
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

export const endRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await locationService.endRide(rideId, req.user.sub);


    const io = req.app.get("io");
    for (const r of ride.riders.filter((r) => r.status === "accepted")) {
      if (io) {
        io.to(`user:${r.userId}`).emit("ride_ended", {
          rideId,
          message: "Your ride has been completed!",
        });
      }
      await createNotification({
        userId: r.userId,
        type: "ride_ended",
        title: "Ride Completed",
        message: "Your ride has been completed!",
        data: { rideId },
      });
    }

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
