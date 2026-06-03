export const locationSwaggerDocs = {
  "/api/location/save": {
    post: {
      summary: "Save pickup or dropoff location",
      tags: ["Location"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["type", "address", "city", "lat", "lng"],
              properties: {
                type: {
                  type: "string",
                  enum: ["pickup", "dropoff"],
                  example: "pickup",
                },
                address: {
                  type: "string",
                  example: "Connaught Place, New Delhi",
                },
                landmark: { type: "string", example: "Near Starbucks" },
                city: { type: "string", example: "Delhi" },
                lat: { type: "number", example: 28.6315 },
                lng: { type: "number", example: 77.2167 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Location saved successfully" },
        401: { description: "Unauthorized" },
        422: { description: "Validation failed" },
      },
    },
  },

  "/api/location": {
    get: {
      summary: "Get all locations of current user",
      tags: ["Location"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Locations fetched successfully" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/create": {
    post: {
      summary: "Create a new ride",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["pickupLocationId", "dropoffLocationId"],
              properties: {
                pickupLocationId: {
                  type: "string",
                  example: "6a1fb71391ca3b940980581a",
                },
                dropoffLocationId: {
                  type: "string",
                  example: "6a1fb71391ca3b940980581b",
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Ride created successfully" },
        401: { description: "Unauthorized" },
        422: { description: "Validation failed" },
      },
    },
  },

  "/api/location/ride/join": {
    post: {
      summary: "Join an existing ride",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["rideId", "pickupLocationId", "dropoffLocationId"],
              properties: {
                rideId: { type: "string", example: "6a1fb71391ca3b940980581a" },
                pickupLocationId: {
                  type: "string",
                  example: "6a1fb71391ca3b940980581b",
                },
                dropoffLocationId: {
                  type: "string",
                  example: "6a1fb71391ca3b940980581c",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Joined ride successfully" },
        400: { description: "Ride is full or not available" },
        401: { description: "Unauthorized" },
        422: { description: "Validation failed" },
      },
    },
  },

  "/api/location/ride/{rideId}": {
    get: {
      summary: "Get ride details",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a1fb71391ca3b940980581a" },
        },
      ],
      responses: {
        200: { description: "Ride fetched successfully" },
        401: { description: "Unauthorized" },
        404: { description: "Ride not found" },
      },
    },
  },

  "/api/location/ride/cab-location": {
    patch: {
      summary: "Update cab live location",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["rideId", "lat", "lng"],
              properties: {
                rideId: { type: "string", example: "6a1fb71391ca3b940980581a" },
                lat: { type: "number", example: 28.6315 },
                lng: { type: "number", example: 77.2167 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Cab location updated" },
        401: { description: "Unauthorized" },
        404: { description: "Ride not found" },
      },
    },
  },
};

// Socket.io events documentation
export const socketDocs = {
  events: {
    emit: [
      {
        name: "join_ride",
        data: "rideId (string)",
        description: "Join a ride room for real-time tracking",
      },
      {
        name: "update_my_location",
        data: "{ rideId, lat, lng }",
        description: "Update your live location",
      },
      {
        name: "update_cab_location",
        data: "{ rideId, lat, lng }",
        description: "Update cab live location",
      },
      {
        name: "leave_ride",
        data: "rideId (string)",
        description: "Leave a ride room",
      },
    ],
    on: [
      {
        name: "user_joined",
        data: "{ userId, username }",
        description: "New user joined the ride",
      },
      {
        name: "user_location_updated",
        data: "{ userId, username, lat, lng }",
        description: "A user location updated",
      },
      {
        name: "cab_location_updated",
        data: "{ lat, lng, timestamp }",
        description: "Cab location updated",
      },
      {
        name: "user_left",
        data: "{ userId, username }",
        description: "A user left the ride",
      },
      { name: "error", data: "{ message }", description: "Error occurred" },
    ],
  },
};
