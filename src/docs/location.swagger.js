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

  "/api/location/ride/offer": {
    post: {
      summary: "Offer a ride — user apni car me jagah deta hai",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "fromAddress",
                "fromCity",
                "fromLat",
                "fromLng",
                "toAddress",
                "toCity",
                "toLat",
                "toLng",
                "departureTime",
                "availableSeats",
                "pricePerSeat",
              ],
              properties: {
                fromAddress: {
                  type: "string",
                  example: "Connaught Place, Delhi",
                },
                fromCity: { type: "string", example: "Delhi" },
                fromLat: { type: "number", example: 28.6315 },
                fromLng: { type: "number", example: 77.2167 },
                toAddress: { type: "string", example: "Sector 18, Noida" },
                toCity: { type: "string", example: "Noida" },
                toLat: { type: "number", example: 28.5705 },
                toLng: { type: "number", example: 77.3219 },
                departureTime: {
                  type: "string",
                  example: "2026-06-10T10:00:00.000Z",
                },
                availableSeats: { type: "integer", example: 2 },
                pricePerSeat: { type: "number", example: 150 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Ride offered successfully" },
        401: { description: "Unauthorized" },
        422: { description: "Validation failed" },
      },
    },
  },

  "/api/location/ride/search": {
    post: {
      summary: "Search matching rides — algorithm se match karta hai",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "fromLat",
                "fromLng",
                "toLat",
                "toLng",
                "departureTime",
              ],
              properties: {
                fromLat: { type: "number", example: 28.6315 },
                fromLng: { type: "number", example: 77.2167 },
                toLat: { type: "number", example: 28.5705 },
                toLng: { type: "number", example: 77.3219 },
                departureTime: {
                  type: "string",
                  example: "2026-06-10T10:00:00.000Z",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Matching rides found" },
        401: { description: "Unauthorized" },
        422: { description: "Validation failed" },
      },
    },
  },

  "/api/location/ride/{rideId}/request": {
    post: {
      summary: "Request to join a ride",
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["pickupAddress", "pickupLat", "pickupLng"],
              properties: {
                pickupAddress: {
                  type: "string",
                  example: "Rajiv Chowk Metro, Delhi",
                },
                pickupLat: { type: "number", example: 28.6328 },
                pickupLng: { type: "number", example: 77.2197 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Ride request sent successfully" },
        400: { description: "Already requested or ride full" },
        401: { description: "Unauthorized" },
        404: { description: "Ride not found" },
      },
    },
  },

  "/api/location/ride/{rideId}/respond": {
    patch: {
      summary: "Accept or reject a ride request",
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["riderId", "action"],
              properties: {
                riderId: {
                  type: "string",
                  example: "6a1fb71391ca3b940980581b",
                },
                action: {
                  type: "string",
                  enum: ["accepted", "rejected"],
                  example: "accepted",
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Rider accepted/rejected successfully" },
        403: { description: "Only ride owner can respond" },
        404: { description: "Ride or rider not found" },
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
      summary: "Update cab live location (real-time)",
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

export const socketDocs = {
  events: {
    emit: [
      {
        name: "join_ride",
        data: "rideId (string)",
        description: "Join ride room for real-time tracking",
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
        description: "Leave ride room",
      },
    ],
    on: [
      {
        name: "user_joined",
        data: "{ userId, username }",
        description: "New user joined",
      },
      {
        name: "user_location_updated",
        data: "{ userId, username, lat, lng }",
        description: "User location updated",
      },
      {
        name: "cab_location_updated",
        data: "{ lat, lng, timestamp }",
        description: "Cab location updated",
      },
      {
        name: "user_left",
        data: "{ userId, username }",
        description: "User left the ride",
      },
      { name: "error", data: "{ message }", description: "Error occurred" },
    ],
  },
};
