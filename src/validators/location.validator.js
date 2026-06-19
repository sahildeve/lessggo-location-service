import Joi from "joi";

export const saveLocationSchema = Joi.object({
  type: Joi.string().valid("pickup", "dropoff").required(),
  address: Joi.string().required(),
  landmark: Joi.string().optional(),
  city: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

export const offerRideSchema = Joi.object({
  fromAddress: Joi.string().required(),
  fromCity: Joi.string().required(),
  fromLat: Joi.number().min(-90).max(90).required(),
  fromLng: Joi.number().min(-180).max(180).required(),
  toAddress: Joi.string().required(),
  toCity: Joi.string().required(),
  toLat: Joi.number().min(-90).max(90).required(),
  toLng: Joi.number().min(-180).max(180).required(),
  departureTime: Joi.date()
    .iso()
    .greater("now")
    .required()
    .messages({ "date.greater": "Departure time must be in the future" }),
  availableSeats: Joi.number().min(1).max(6).required(),
  pricePerSeat: Joi.number().min(0).required(),
});

export const searchRideSchema = Joi.object({
  fromAddress:   Joi.string().required(),
  fromLat:       Joi.number().min(-90).max(90).required(),
  fromLng:       Joi.number().min(-180).max(180).required(),
  toAddress:     Joi.string().required(),
  toLat:         Joi.number().min(-90).max(90).required(),
  toLng:         Joi.number().min(-180).max(180).required(),
  departureTime: Joi.date().iso().required(),
});

export const requestRideSchema = Joi.object({
  pickupAddress: Joi.string().required(),
  pickupLat: Joi.number().min(-90).max(90).required(),
  pickupLng: Joi.number().min(-180).max(180).required(),
});

export const respondToRequestSchema = Joi.object({
  riderId: Joi.string().hex().length(24).required(),
  action: Joi.string().valid("accepted", "rejected").required(),
});

export const updateCabLocationSchema = Joi.object({
  rideId: Joi.string().hex().length(24).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((d) => ({
        field: d.context?.key,
        message: d.message,
      })),
    });
  }
  next();
};
