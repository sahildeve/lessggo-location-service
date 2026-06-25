import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  validate,
  saveLocationSchema,
  offerRideSchema,
  searchRideSchema,
  requestRideSchema,
  respondToRequestSchema,
  updateCabLocationSchema,
} from "../validators/location.validator.js";
import {
  saveLocation,
  getUserLocations,
  offerRide,
  searchRides,
  requestRide,
  respondToRequest,
  getRide,
  updateCabLocation,
  endRide,
  getInterestedUsers,
  getMyRides,
  getMyRequests,
  cancelRide,
  withdrawRequest,
  removeRider,
  inviteRider,
  deleteInvite,
  cancelRiderRide,
} from "../controllers/location.controller.js";

const router = Router();

// ─── Location Routes
router.post("/save", protect, validate(saveLocationSchema), saveLocation);
router.get("/", protect, getUserLocations);

// ─── Ride Offer & Search
router.post("/ride/offer", protect, validate(offerRideSchema), offerRide);
router.post("/ride/search", protect, validate(searchRideSchema), searchRides);

// ─── Rides of a User
router.get("/ride/my-rides", protect, getMyRides);
router.get("/ride/my-requests", protect, getMyRequests);

router.get("/ride/:rideId/interested-users", protect, getInterestedUsers);

// ─── Ride Request
router.post(
  "/ride/:rideId/request",
  protect,
  validate(requestRideSchema),
  requestRide,
);
router.post("/ride/:rideId/invite", protect, inviteRider);
router.delete('/ride/:rideId/deleteInvite/:toUserId', protect, deleteInvite);
router.patch(
  "/ride/:rideId/respond",
  protect,
  validate(respondToRequestSchema),
  respondToRequest,
);

// ─── Ride Details & Tracking
router.get("/ride/:rideId", protect, getRide);
router.patch(
  "/ride/cab-location",
  protect,
  validate(updateCabLocationSchema),
  updateCabLocation,
);

router.patch("/ride/:rideId/cancel", protect, cancelRide); // Driver
router.patch("/ride/:rideId/withdraw", protect, withdrawRequest); // Rider
router.delete('/ride/:rideId/exit', protect, cancelRiderRide);

router.delete("/ride/:rideId/rider/:rideId", protect, removeRider); // Driver rider remove kre

router.patch("/ride/:rideId/end", protect, endRide);
export default router;
