import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  validate,
  saveLocationSchema,
  offerRideSchema,
  searchRideSchema,
  requestRideSchema,
  respondToRequestSchema,
  updateCabLocationSchema,
} from '../validators/location.validator.js';
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
} from '../controllers/location.controller.js';

const router = Router();

// ─── Location Routes 
router.post('/save', protect, validate(saveLocationSchema), saveLocation);
router.get('/',      protect,                               getUserLocations);

// ─── Ride Offer & Search 
router.post('/ride/offer',  protect, validate(offerRideSchema),  offerRide);
router.post('/ride/search', protect, validate(searchRideSchema), searchRides);

// ─── Ride Request 
router.post('/ride/:rideId/request',  protect, validate(requestRideSchema),       requestRide);
router.patch('/ride/:rideId/respond', protect, validate(respondToRequestSchema),  respondToRequest);

// ─── Ride Details & Tracking 
router.get('/ride/:rideId',           protect,                                    getRide);
router.patch('/ride/cab-location',    protect, validate(updateCabLocationSchema), updateCabLocation);

router.patch('/ride/:rideId/end', protect, endRide);
export default router;