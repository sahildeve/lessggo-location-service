import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema(
  {
    users: [
      {
        userId:    { type: mongoose.Schema.Types.ObjectId, required: true },
        username:  { type: String },
        status:    { type: String, enum: ['waiting', 'onboard', 'dropped'], default: 'waiting' },
        pickupLocation:  { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
        dropoffLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
      },
    ],
    maxUsers:   { type: Number, default: 3 }, // max 3 users per cab
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    cabLiveLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    routeCoordinates: [
      {
        coordinates: { type: [Number] }, // full route path
        timestamp:   { type: Date, default: Date.now },
      },
    ],
    startedAt:   { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

rideSchema.index({ cabLiveLocation: '2dsphere' });
rideSchema.index({ status: 1 });

const Ride = mongoose.model('Ride', rideSchema);
export default Ride;