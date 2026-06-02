import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    rideId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    type: {
      type: String,
      enum: ["pickup", "dropoff", "live"],
      required: true,
    },

    address: {
      type: String,
      trim: true,
    },

    landmark: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: (v) => v.length === 2,
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial Index
locationSchema.index({ coordinates: "2dsphere" });

// Query Optimization Indexes
locationSchema.index({ userId: 1 });
locationSchema.index({ rideId: 1 });
locationSchema.index({ userId: 1, type: 1 });

const Location = mongoose.model("Location", locationSchema);

export default Location;