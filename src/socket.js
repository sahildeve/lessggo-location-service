import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as locationService from "./services/location.service.js";
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
    const token = socket.handshake.auth?.token || socket.handshake.query?.auth;
    if (!token) return next(new Error('No token provided'));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      issuer:   'cab-auth-service',
      audience: 'cab-app',
    });

    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

  // ─── Connection 
  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.user.username}`);

    // ─── Join Ride Room 
    socket.on("join_ride", async (rideId) => {
      try {
        socket.join(rideId); // user us ride ke room me join ho gaya
        logger.info(`${socket.user.username} joined ride room: ${rideId}`);

        // Room me baaki sabko batao naya user aaya
        socket.to(rideId).emit("user_joined", {
          userId: socket.user.sub,
          username: socket.user.username,
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
          username: socket.user.username,
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
      logger.info(`${socket.user.username} left ride room: ${rideId}`);

      socket.to(rideId).emit("user_left", {
        userId: socket.user.sub,
        username: socket.user.username,
      });
    });

    // ─── Disconnect 
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

export default initSocket;
