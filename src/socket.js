import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as locationService from "./services/location.service.js";
import { getUsersByIds } from "./utils/authServiceClient.js";
import logger from "./utils/logger.js";

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
      credentials: true,
    },
  });

  // ─── Auth Middleware for Socket
  io.use((socket, next) => {
    try {
      // handshake.auth se bhi lo, query se bhi lo
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.auth;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
        issuer: "cab-auth-service",
        audience: "cab-app",
      });

      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  // ─── Connection
  io.on("connection", async (socket) => {
    socket.join(`user:${socket.user.sub}`);

    // ─── User info ek baar fetch, poore connection ke liye cache
    socket.userInfo = null;
    try {
      const map = await getUsersByIds([socket.user.sub]);
      socket.userInfo = map[String(socket.user.sub)] ?? null;
    } catch {
      // Fetch fail ho to JWT wala data fallback rahega
    }

    const displayName =
      socket.userInfo?.fullName ?? socket.user.username ?? "Lessggo user";

    logger.info(`User connected: ${displayName}`);

    // ─── Join Ride Room
    socket.on("join_ride", async (payload) => {
      try {
        const rideId = typeof payload === "string" ? payload : payload?.rideId;
        if (!rideId) {
          throw new Error("rideId is required");
        }

        socket.join(rideId); // user us ride ke room me join ho gaya
        logger.info(`${displayName} joined ride room: ${rideId}`);

        // Room me baaki sabko batao naya user aaya
        socket.to(rideId).emit("user_joined", {
          userId: socket.user.sub,
          username: displayName,
        });
      } catch (err) {
        logger.error("Join ride error:", err.message);
        socket.emit("error", { message: err.message });
      }
    });

    // ─── User Live Location Update
    socket.on("update_my_location", async ({ rideId, lat, lng }) => {
      try {
        // DB me save karo
        await locationService.saveUserLiveLocation(
          socket.user.sub,
          rideId,
          lat,
          lng,
        );

        // Room me baaki sabko broadcast karo
        socket.to(rideId).emit("user_location_updated", {
          userId: socket.user.sub,
          username: displayName,
          lat,
          lng,
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error("Update location error:", err.message);
        socket.emit("error", { message: err.message });
      }
    });

    // ─── Cab Live Location Update
    socket.on("update_cab_location", async ({ rideId, lat, lng }) => {
      try {
        // DB me save karo
        await locationService.updateCabLocation(rideId, lat, lng);

        // Room me SABKO broadcast karo (cab ki location sabko chahiye)
        io.to(rideId).emit("cab_location_updated", {
          lat,
          lng,
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error("Update cab location error:", err.message);
        socket.emit("error", { message: err.message });
      }
    });

    // ─── Leave Ride Room
    socket.on("leave_ride", (rideId) => {
      socket.leave(rideId);
      logger.info(`${displayName} left ride room: ${rideId}`);

      socket.to(rideId).emit("user_left", {
        userId: socket.user.sub,
        username: displayName,
      });
    });

    // ─── Driver: Interested users watch krega
    socket.on("watch_interested_users", (rideId) => {
      socket.join(`watching:${rideId}`);
      logger.info(`${displayName} watching interested users for: ${rideId}`);
    });

    socket.on("unwatch_interested_users", (rideId) => {
      socket.leave(`watching:${rideId}`);
    });

    // ─── Rider: New rides watch karega
    socket.on("watch_new_rides", ({ fromLat, fromLng, toLat, toLng }) => {
      socket.searchCriteria = { fromLat, fromLng, toLat, toLng };
      socket.join(`searching:${socket.user.sub}`);
      logger.info(`${displayName} watching new rides`);
    });

    socket.on("unwatch_new_rides", () => {
      socket.leave(`searching:${socket.user.sub}`);
      socket.searchCriteria = null;
    });

    // ─── Nearby Feed — Watch all offers/searches (real-time)
    socket.on("watch_nearby_feed", () => {
      socket.join("nearby_feed_watchers");
      logger.info(`${displayName} watching nearby feed`);
    });

    socket.on("unwatch_nearby_feed", () => {
      socket.leave("nearby_feed_watchers");
    });

    // ─── Disconnect
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${displayName}`);
    });
  });

  return io;
};

export default initSocket;
