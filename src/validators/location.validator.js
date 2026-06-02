import Joi from 'joi';

export const saveLocationSchema = Joi.object({
  type:     Joi.string().valid('pickup', 'dropoff').required(),
  address:  Joi.string().required(),
  landmark: Joi.string().optional(),
  city:     Joi.string().required(),
  lat:      Joi.number().min(-90).max(90).required(),
  lng:      Joi.number().min(-180).max(180).required(),
});


export const createRideSchema = Joi.object({
  pickupLocationId:  Joi.string().hex().length(24).required(),
  dropoffLocationId: Joi.string().hex().length(24).required(),
});

export const joinRideSchema = Joi.object({
  rideId:            Joi.string().hex().length(24).required(),
  pickupLocationId:  Joi.string().hex().length(24).required(),
  dropoffLocationId: Joi.string().hex().length(24).required(),
});


export const updateCabLocationSchema = Joi.object({
  rideId: Joi.string().hex().length(24).required(),
  lat:    Joi.number().min(-90).max(90).required(),
  lng:    Joi.number().min(-180).max(180).required(),
});

// Reusable validation middleware
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => ({
        field:   d.context?.key,
        message: d.message,
      })),
    });
  }
  next();
};