// Ride Socket.IO rooms (GWR-01, GWR-07). Rooms are being renamed from the bare
// rideId to "ride:<rideId>". During the switch we target BOTH names, so old and
// new gateways work; drop LEGACY once the new gateway is live everywhere.
export const rideRoom = (rideId) => `ride:${rideId}`;
const legacyRoom = (rideId) => String(rideId);
export const rideRooms = (rideId) => [rideRoom(rideId), legacyRoom(rideId)];

// One user's membership ended (exit, removed, withdrawn, rejected after
// accept): stop live locations and chat to all their open sockets now.
export const removeUserFromRideRoom = (io, rideId, userId) => {
  io?.in(`user:${userId}`).socketsLeave(rideRooms(rideId));
};

// The whole ride ended (cancel, end, expiry, owner deletion): tell open
// screens, then remove every socket from the room.
export const closeRideRoom = (io, rideId, reason) => {
  const rooms = rideRooms(rideId);
  io?.to(rooms).emit("ride_closed", { rideId: String(rideId), reason });
  io?.in(rooms).socketsLeave(rooms);
};
