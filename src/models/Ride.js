import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    // ─── Offer karne wala user (jo car leke ja raha hai)
    offeredBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // index: true,
      },
      username: { type: String },
    },
    // ─── Route details
    from: {
      address: { type: String, required: true },
      city: { type: String },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },
    to: {
      address: { type: String, required: true },
      city: { type: String },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },

    // ─── Ride details
    departureTime: { type: Date, required: true },
    availableSeats: { type: Number, required: true, min: 1, max: 6 },
    pricePerSeat: { type: Number, required: true, min: 0 },

    // ─── Riders (jo log join karna chahte hain / join ho gaye)
    riders: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        username: { type: String },
        status: {
          type: String,
          enum: [
            "pending",
            "invited",
            "accepted",
            "rejected",
            "invite_cancelled",
          ],
          default: "pending",
        },
        pickupLocation: {
          address: { type: String },
          coordinates: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number] },
          },
        },
        requestedAt: { type: Date, default: Date.now },
      },
    ],

    // ─── Ride status
    status: {
      type: String,
      enum: ["active", "full", "ongoing", "completed", "cancelled", "expired"],
      default: "active",
    },

    // ─── Live tracking
    cabLiveLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    routeCoordinates: [
      {
        coordinates: { type: [Number] },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

rideSchema.index({ "from.coordinates": "2dsphere" });
rideSchema.index({ "to.coordinates": "2dsphere" });
rideSchema.index({ cabLiveLocation: "2dsphere" });
rideSchema.index({ status: 1 });
rideSchema.index({ departureTime: 1 });
rideSchema.index({ "offeredBy.userId": 1 });

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
