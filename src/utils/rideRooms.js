// Ride Socket.IO rooms (GWR-01). The room name lives here only, so renaming
// it to "ride:<rideId>" later (GWR-07) is a one-line change.
export const rideRoom = (rideId) => String(rideId);

// One user's membership ended (exit, removed, withdrawn, rejected after
// accept): stop live locations and chat to all their open sockets now.
export const removeUserFromRideRoom = (io, rideId, userId) => {
  io?.in(`user:${userId}`).socketsLeave(rideRoom(rideId));
};

// The whole ride ended (cancel, end, expiry, owner deletion): tell open
// screens, then remove every socket from the room.
export const closeRideRoom = (io, rideId, reason) => {
  const room = rideRoom(rideId);
  io?.to(room).emit("ride_closed", { rideId: String(rideId), reason });
  io?.in(room).socketsLeave(room);
};
