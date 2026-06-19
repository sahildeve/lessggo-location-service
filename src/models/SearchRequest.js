import mongoose from "mongoose";

const searchRequestSchema = new mongoose.Schema(
  {
    // ─── Search karne wala user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },

    // ─── Search criteria
    from: {
      address: { type: String },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },
    to: {
      address: { type: String },
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true },
      },
    },

    departureTime: { type: Date, required: true },
  },
  { timestamps: true },
);

searchRequestSchema.index({ "from.coordinates": "2dsphere" });
searchRequestSchema.index({ "to.coordinates": "2dsphere" });
searchRequestSchema.index({ departureTime: 1 });

// TTL — 24 hours baad automatically delete ho jaayega
searchRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const SearchRequest = mongoose.model("SearchRequest", searchRequestSchema);
export default SearchRequest;
