// What a requester / invitee / ex-rider may see of a ride (LOC-01): the same
// shape as before, but without the GPS trail, the live cab position, or any
// other rider's entry (pickup points are often homes).
export const toRequesterView = (ride, userId) => {
  if (!ride) return ride;
  const obj = typeof ride.toObject === "function" ? ride.toObject() : ride;
  // eslint-disable-next-line no-unused-vars
  const { routeCoordinates, cabLiveLocation, riders, ...rest } = obj;
  return {
    ...rest,
    riders: (riders || []).filter((r) => String(r.userId) === String(userId)),
  };
};