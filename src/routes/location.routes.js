import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  validate,
  saveLocationSchema,
  createRideSchema,
  joinRideSchema,
  updateCabLocationSchema,
} from "../validators/location.validator.js";
import {
  saveLocation,
  getUserLocations,
  createRide,
  joinRide,
  getRide,
  updateCabLocation,
} from "../controllers/location.controller.js";

const router = Router();

// ─── Location Routes
router.post("/save", protect, validate(saveLocationSchema), saveLocation);
router.get("/", protect, getUserLocations);

// ─── Ride Routes
router.post("/ride/create", protect, validate(createRideSchema), createRide);
router.post("/ride/join", protect, validate(joinRideSchema), joinRide);
router.get("/ride/:rideId", protect, getRide);
router.patch(
  "/ride/cab-location",
  protect,
  validate(updateCabLocationSchema),
  updateCabLocation,
);

export default router;
