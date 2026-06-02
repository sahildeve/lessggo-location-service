import * as locationService from '../services/location.service.js';
import { success, error } from '../utils/response.js';
import logger from '../utils/logger.js';

// ─── Save Pickup/Dropoff Location 
export const saveLocation = async (req, res) => {
  try {
    const userId   = req.user.sub;
    const location = await locationService.saveLocation(userId, req.body);
    return success(res, { location }, 'Location saved successfully', 201);
  } catch (err) {
    logger.error('Save location error:', { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Get User Locations 
export const getUserLocations = async (req, res) => {
  try {
    const userId    = req.user.sub;
    const locations = await locationService.getUserLocations(userId);
    return success(res, { locations }, 'Locations fetched successfully');
  } catch (err) {
    logger.error('Get locations error:', { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Create Ride
export const createRide = async (req, res) => {
  try {
    const userId   = req.user.sub;
    const username = req.user.username;
    const { pickupLocationId, dropoffLocationId } = req.body;

    const ride = await locationService.createRide(
      userId,
      username,
      pickupLocationId,
      dropoffLocationId
    );

    return success(res, { ride }, 'Ride created successfully', 201);
  } catch (err) {
    logger.error('Create ride error:', { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Join Ride 
export const joinRide = async (req, res) => {
  try {
    const userId   = req.user.sub;
    const username = req.user.username;
    const { rideId, pickupLocationId, dropoffLocationId } = req.body;

    const ride = await locationService.joinRide(
      rideId,
      userId,
      username,
      pickupLocationId,
      dropoffLocationId
    );

    return success(res, { ride }, 'Joined ride successfully');
  } catch (err) {
    logger.error('Join ride error:', { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Get Ride
export const getRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride       = await locationService.getRide(rideId);
    return success(res, { ride }, 'Ride fetched successfully');
  } catch (err) {
    logger.error('Get ride error:', { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};

// ─── Update Cab Live Location 
export const updateCabLocation = async (req, res) => {
  try {
    const { rideId, lat, lng } = req.body;
    const ride = await locationService.updateCabLocation(rideId, lat, lng);
    return success(res, { ride }, 'Cab location updated');
  } catch (err) {
    logger.error('Update cab location error:', { message: err.message, stack: err.stack });
    return error(res, err.message, err.status || 500);
  }
};