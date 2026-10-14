import pubsub from "../config/pubsub.js";
import logger from "../utils/logger.js";
import { createNotification } from "../utils/notification.js";
import { getUsersByIds } from "../utils/authServiceClient.js";
import * as chatServiceClient from "../utils/chatServiceClient.js";
import {
  sendRideRequestEmail,
  sendRideAcceptedEmail,
  sendRideRejectedEmail,
  sendRideCancelledEmail,
} from "../utils/emailNotification.js";

const SUBSCRIPTION_NAME =
  process.env.LOCATION_EVENTS_SUB || "location-events-sub";

export const startLocationSubscriber = (io) => {
  try {
    const subscription = pubsub.subscription(SUBSCRIPTION_NAME);

    subscription.on("message", async (message) => {
      try {
        const parsedData = JSON.parse(message.data.toString());
        const { eventType, payload } = parsedData;

        // ============================================
        // 1. RIDE_OFFERED
        // ============================================
        if (eventType === "RIDE_OFFERED") {
          const { offererId, ride, interestedUsers } = payload;

          if (io) {
            const offererMap = await getUsersByIds([offererId]);
            const offerer = offererMap[String(offererId)];

            const offeredByFull = {
              userId: offererId,
              fullName: offerer?.fullName ?? null,
              profilePicture: offerer?.profilePicture ?? null,
              age: offerer?.age ?? null,
              gender: offerer?.gender ?? null,
              designation: offerer?.designation ?? null,
              interests: offerer?.interests ?? [],
            };

            (interestedUsers || []).forEach((user) => {
              io.to(`searching:${user.userId}`).emit("new_ride_available", {
                rideId: ride._id,
                offeredBy: offeredByFull,
                from: ride.from,
                to: ride.to,
                departureTime: ride.departureTime,
                availableSeats: ride.availableSeats,
                pricePerSeat: ride.pricePerSeat,
                message: "A new ride matching your search is available!",
              });
            });

            io.to("nearby_feed_watchers").emit("new_offer_posted", {
              rideId: ride._id,
              offeredBy: offeredByFull,
              from: ride.from,
              to: ride.to,
              departureTime: ride.departureTime,
              availableSeats: ride.availableSeats,
              pricePerSeat: ride.pricePerSeat,
              status: ride.status,
            });
          }
        }


        // 2. RIDE_SEARCHED
        if (eventType === "RIDE_SEARCHED") {
          const { searcherId, fallbackName, matchedRideIds, newSearchRequest } =
            payload;

          if (io && newSearchRequest) {
            const searcherMap = await getUsersByIds([searcherId]);
            const searcher = searcherMap[String(searcherId)];
            const searcherName = searcher?.fullName ?? fallbackName;

            const searcherFull = {
              userId: searcherId,
              fullName: searcher?.fullName ?? null,
              profilePicture: searcher?.profilePicture ?? null,
              age: searcher?.age ?? null,
              gender: searcher?.gender ?? null,
              designation: searcher?.designation ?? null,
              interests: searcher?.interests ?? [],
            };

            (matchedRideIds || []).forEach((rideId) => {
              io.to(`watching:${rideId}`).emit("new_interested_user", {
                searchRequestId: newSearchRequest._id,
                userId: searcherId,
                username: searcherName,
                user: searcherFull,
                searchedRoute: {
                  from: newSearchRequest.from?.address,
                  to: newSearchRequest.to?.address,
                  fromCoordinates: {
                    lat: newSearchRequest.from?.coordinates?.coordinates?.[1],
                    lng: newSearchRequest.from?.coordinates?.coordinates?.[0],
                  },
                  toCoordinates: {
                    lat: newSearchRequest.to?.coordinates?.coordinates?.[1],
                    lng: newSearchRequest.to?.coordinates?.coordinates?.[0],
                  },
                },
                searchedAt: newSearchRequest.createdAt,
              });
            });

            io.to("nearby_feed_watchers").emit("new_search_posted", {
              searchRequestId: newSearchRequest._id,
              userId: searcherId,
              username: fallbackName,
              from: newSearchRequest.from,
              to: newSearchRequest.to,
              departureTime: newSearchRequest.departureTime,
            });
          }
        }

        // 3. RIDE_REQUESTED
        if (eventType === "RIDE_REQUESTED") {
          const {
            rideId,
            driverId,
            riderId,
            fallbackName,
            riderUsername,
            fromLocation,
            toLocation,
            fromCoordinates,
            requestedAt,
          } = payload;

          if (io) {
            const riderInfoMap = await getUsersByIds([riderId]);
            const riderInfo = riderInfoMap[String(riderId)];

            io.to(`user:${driverId.toString()}`).emit("incoming_ride_request", {
              rideId,
              riderId,
              riderName: riderInfo?.fullName ?? riderUsername ?? fallbackName,
              rider: {
                userId: riderId,
                fullName: riderInfo?.fullName ?? null,
                profilePicture: riderInfo?.profilePicture ?? null,
                age: riderInfo?.age ?? null,
                gender: riderInfo?.gender ?? null,
                designation: riderInfo?.designation ?? null,
                interests: riderInfo?.interests ?? [],
              },
              role: "passenger",
              fromLocation,
              toLocation,
              fromCoordinates,
              requestedAt,
            });
          }

          await createNotification({
            userId: driverId,
            type: "ride_request_received",
            title: "New Ride Request",
            message: `${fallbackName} wants to join your ride`,
            data: { rideId, riderId },
          });

          await sendRideRequestEmail(driverId, fallbackName);
        }
 
        // 4. RIDE_INVITE_SENT
        if (eventType === "RIDE_INVITE_SENT") {
          const { rideId, fromUserId, fallbackName, toUserId } = payload;

          if (io) {
            const infoMap = await getUsersByIds([fromUserId]);
            const info = infoMap[String(fromUserId)];

            io.to(`user:${toUserId}`).emit("ride_invite_received", {
              rideId,
              fromUserId,
              fromUsername: info?.fullName ?? fallbackName,
              from: {
                userId: fromUserId,
                fullName: info?.fullName ?? null,
                profilePicture: info?.profilePicture ?? null,
                age: info?.age ?? null,
                gender: info?.gender ?? null,
                designation: info?.designation ?? null,
                interests: info?.interests ?? [],
              },
              message: "You have been invited to join this ride",
            });
          }

          await createNotification({
            userId: toUserId,
            type: "ride_invite_received",
            title: "Ride Invite Received",
            message: `${fallbackName} invited you to join a ride`,
            data: { rideId, fromUserId },
          });
        }


        // 5. RIDE_INVITE_WITHDRAWN
        if (eventType === "RIDE_INVITE_WITHDRAWN") {
          const { rideId, driverName, toUserId } = payload;

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
            message: `${driverName} withdrew your ride invite`,
            data: { rideId },
          });
        }

        // 6. RIDER_EXITED
        if (eventType === "RIDER_EXITED") {
          const { rideId, driverId, riderId, riderName, availableSeats } =
            payload;

          if (io) {
            io.to(`user:${driverId.toString()}`).emit("rider_exited", {
              rideId,
              riderId,
              riderName,
              availableSeats,
              message: "A rider has left the ride",
            });
          }

          await createNotification({
            userId: driverId,
            type: "rider_exited",
            title: "Rider Left",
            message: `${riderName} has left your ride`,
            data: { rideId, availableSeats },
          });
        }

        // 7. RIDER_REMOVED
        if (eventType === "RIDER_REMOVED") {
          const { rideId, riderId, availableSeats } = payload;

          if (io) {
            io.to(`user:${riderId}`).emit("rider_removed", {
              removedUserId: riderId,
              rideId,
              message: "You have been removed from this ride by the driver",
              availableSeats,
            });
          }

          await createNotification({
            userId: riderId,
            type: "rider_removed",
            title: "Removed from Ride",
            message: "You have been removed from the ride by the driver",
            data: { rideId },
          });
        }

        // 8. RIDE_REQUEST_RESPONDED (Accept/Reject)
        if (eventType === "RIDE_REQUEST_RESPONDED") {
          const {
            rideId,
            driverId,
            driverName,
            riderId,
            riderUsername,
            action,
            ride,
          } = payload;

          if (action === "accepted") {
            await chatServiceClient.postSystemMessage(
              rideId,
              `${riderUsername} joined the ride`,
            );

            if (io) {
              io.to(`user:${riderId}`).emit("ride_request_accepted", {
                rideId,
                driverId,
                driverName,
                from: ride.from,
                to: ride.to,
                departureTime: ride.departureTime,
              });
            }
          } else if (action === "rejected" && io) {
            io.to(`user:${riderId}`).emit("ride_request_rejected", {
              rideId,
              driverId,
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
                ? `${driverName} accepted your ride request`
                : `${driverName} rejected your ride request`,
            data: { rideId, driverName },
          });

          if (action === "accepted") {
            await sendRideAcceptedEmail(riderId, driverName, ride);
          } else {
            await sendRideRejectedEmail(riderId, driverName);
          }
        }

        // 9. RIDE_INVITE_RESPONDED
        if (eventType === "RIDE_INVITE_RESPONDED") {
          const { rideId, driverId, riderId, riderName, action } = payload;

          if (action === "accepted") {
            await chatServiceClient.postSystemMessage(
              rideId,
              `${riderName} joined the ride`,
            );
          }

          if (io) {
            io.to(`user:${driverId.toString()}`).emit(
              action === "accepted" ? "invite_accepted" : "invite_rejected",
              {
                rideId,
                riderId,
                riderName,
                message:
                  action === "accepted"
                    ? "Your invite has been accepted!"
                    : "Your invite has been rejected",
              },
            );
          }

          await createNotification({
            userId: driverId,
            type: action === "accepted" ? "invite_accepted" : "invite_rejected",
            title:
              action === "accepted" ? "Invite Accepted!" : "Invite Rejected",
            message:
              action === "accepted"
                ? `${riderName} accepted your invite`
                : `${riderName} rejected your invite`,
            data: { rideId },
          });
        }

        // 10. RIDE_CANCELLED
        if (eventType === "RIDE_CANCELLED") {
          const { rideId, driverName, acceptedRiders, ride } = payload;

          await chatServiceClient.closeRideChat(
            rideId,
            "Ride has been cancelled by the driver",
          );

          for (const r of acceptedRiders || []) {
            if (io) {
              io.to(`user:${r.userId}`).emit("ride_cancelled", {
                rideId,
                driverName,
                from: ride.from?.address,
                to: ride.to?.address,
                message: "Your ride has been cancelled by the driver",
              });
            }

            await createNotification({
              userId: r.userId,
              type: "ride_cancelled",
              title: "Ride Cancelled",
              message: `${driverName} cancelled the ride`,
              data: {
                rideId,
                from: ride.from?.address,
                to: ride.to?.address,
              },
            });

            await sendRideCancelledEmail(r.userId, driverName, ride);
          }
        }

        // 11. RIDE_REQUEST_WITHDRAWN
        if (eventType === "RIDE_REQUEST_WITHDRAWN") {
          const {
            rideId,
            driverId,
            riderId,
            fallbackName,
            wasAccepted,
            availableSeats,
          } = payload;

          if (io) {
            const searcherMap = await getUsersByIds([riderId]);
            const searcher = searcherMap[String(riderId)];

            const searcherFull = {
              userId: riderId,
              fullName: searcher?.fullName ?? null,
              profilePicture: searcher?.profilePicture ?? null,
              age: searcher?.age ?? null,
              gender: searcher?.gender ?? null,
              designation: searcher?.designation ?? null,
              interests: searcher?.interests ?? [],
            };

            io.to(`user:${driverId.toString()}`).emit(
              "ride_request_withdrawn",
              {
                userId: riderId,
                username: searcher?.fullName ?? fallbackName,
                user: searcherFull,
                rideId,
                wasAccepted,
                availableSeats,
              },
            );
          }

          await createNotification({
            userId: driverId,
            type: "ride_request_withdrawn",
            title: "Request Withdrawn",
            message: `${fallbackName} withdrew their ride request`,
            data: { rideId, wasAccepted },
          });
        }

        // 12. RIDE_ENDED
        if (eventType === "RIDE_ENDED") {
          const { rideId, acceptedRiders } = payload;

          for (const r of acceptedRiders || []) {
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
        }

        // Acknowledge message
        message.ack();
        logger.info(
          `Processed location event: ${eventType} (MsgID: ${message.id})`,
        );
      } catch (err) {
        logger.error(
          `Error processing Location Pub/Sub message: ${err.message}`,
        );
        message.nack();
      }
    });

    subscription.on("error", (error) => {
      logger.error("Location Pub/Sub subscription error:", {
        message: error.message,
      });
    });

    logger.info(`Location Subscriber listening on ${SUBSCRIPTION_NAME}`);
  } catch (err) {
    logger.error("Failed to start Location Subscriber:", {
      message: err.message,
    });
  }
};
