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

  // updated
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
                  example: "2026-06-20T10:00:00.000Z",
                },
                availableSeats: { type: "integer", example: 2 },
                pricePerSeat: { type: "number", example: 150 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Ride offered successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      ride: {
                        type: "object",
                        properties: {
                          _id: {
                            type: "string",
                            example: "6a34aa15f585c7dfc43336a4",
                          },
                          offeredBy: {
                            type: "object",
                            properties: {
                              username: {
                                type: "string",
                                example: "Sandeep Saarthi",
                              },
                            },
                          },
                          from: {
                            type: "object",
                            properties: {
                              address: {
                                type: "string",
                                example: "Connaught Place, Delhi",
                              },
                              city: { type: "string", example: "Delhi" },
                            },
                          },
                          to: {
                            type: "object",
                            properties: {
                              address: {
                                type: "string",
                                example: "Sector 18, Noida",
                              },
                              city: { type: "string", example: "Noida" },
                            },
                          },
                          departureTime: {
                            type: "string",
                            example: "2026-06-20T10:00:00.000Z",
                          },
                          availableSeats: { type: "integer", example: 2 },
                          pricePerSeat: { type: "number", example: 150 },
                          status: { type: "string", example: "upcoming" },
                        },
                      },
                      interestedUsers: {
                        type: "array",
                        description: "Users who already searched this route",
                        items: {
                          type: "object",
                          properties: {
                            userId: { type: "string", example: "6a34a9c5..." },
                            username: {
                              type: "string",
                              example: "Rahul Sharma",
                            },
                            searchedRoute: {
                              type: "object",
                              properties: {
                                from: {
                                  type: "string",
                                  example: "Connaught Place, Delhi",
                                },
                                to: {
                                  type: "string",
                                  example: "Sector 18, Noida",
                                },
                              },
                            },
                            searchedAt: {
                              type: "string",
                              example: "2026-06-19T07:04:57.846Z",
                            },
                          },
                        },
                      },
                      interestedCount: { type: "integer", example: 2 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        422: { description: "Validation failed" },
      },
    },
  },

  // updated
  "/api/location/ride/search": {
    post: {
      summary:
        "Search matching rides — algorithm se match karta hai + search saved for demand signal",
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
                  example: "2026-06-20T10:00:00.000Z",
                },
                fromAddress: {
                  type: "string",
                  example: "Connaught Place, Delhi",
                }, // ← new
                toAddress: { type: "string", example: "Sector 18, Noida" }, // ← new
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Matching rides found + search saved for demand signal",
        },
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

  "/api/location/ride/{rideId}/invite": {
    post: {
      summary: "Driver invites a user to join ride",
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
              required: ["toUserId", "toUsername"],
              properties: {
                toUserId: {
                  type: "string",
                  example: "6a1fb71391ca3b940980581b",
                },
                toUsername: { type: "string", example: "Rahul Garg" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Invite sent successfully" },
        403: { description: "Only ride owner can invite" },
        409: { description: "User already has request/invite" },
      },
    },
  },

  "/api/location/ride/{rideId}/withdrawInvite/{toUserId}": {
    patch: {
      summary: "Driver withdraws an invite (status update, not delete)",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a1fb71391ca3b940980581a" },
        },
        {
          name: "toUserId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a1fb71391ca3b940980581b" },
        },
      ],
      responses: {
        200: { description: "Invite withdrawn successfully" },
        403: { description: "Only ride owner can cancel invites" },
        404: { description: "No pending invite found" },
      },
    },
  },

  "/api/location/ride/{rideId}/rider/{riderId}": {
    patch: {
      summary: "Driver removes an accepted rider from ride",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a1fb71391ca3b940980581a" },
        },
        {
          name: "riderId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a1fb71391ca3b940980581b" },
        },
      ],
      responses: {
        200: { description: "Rider removed successfully" },
        403: { description: "Only ride owner can remove riders" },
        404: { description: "Rider not found in this ride" },
      },
    },
  },

  "/api/location/ride/{rideId}/exit": {
    patch: {
      summary: "Rider exits an accepted ride (plan change)",
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
        200: { description: "Exited ride successfully" },
        404: { description: "You are not an accepted rider in this ride" },
      },
    },
  },

  "/api/location/ride/{rideId}/cancel-request": {
    delete: {
      summary: "Rider cancels own pending request",
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
        200: { description: "Request cancelled successfully" },
        404: { description: "No pending request found" },
      },
    },
  },

  "/api/location/ride/my-rides": {
    get: {
      summary: "Get all rides offered by current user",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "My rides fetched successfully" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/my-requests": {
    get: {
      summary: "Get all ride requests made by current user",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "My requests fetched successfully" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/{rideId}/interested-users": {
    get: {
      summary: "Get users who searched this route (owner only)",
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
        200: { description: "Interested users fetched successfully" },
        403: { description: "Only ride owner can view" },
        404: { description: "Ride not found" },
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

  "/api/location/ride/my-rides": {
    get: {
      summary: "Get all rides offered by current user (Driver)",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Your offered rides fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      rides: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            _id: {
                              type: "string",
                              example: "6a34aa15f585c7dfc43336a4",
                            },
                            offeredBy: {
                              type: "object",
                              properties: {
                                username: {
                                  type: "string",
                                  example: "Sandeep Saarthi",
                                },
                              },
                            },
                            from: {
                              type: "object",
                              properties: {
                                address: {
                                  type: "string",
                                  example: "Connaught Place, Delhi",
                                },
                                city: { type: "string", example: "Delhi" },
                              },
                            },
                            to: {
                              type: "object",
                              properties: {
                                address: {
                                  type: "string",
                                  example: "Sector 18, Noida",
                                },
                                city: { type: "string", example: "Noida" },
                              },
                            },
                            departureTime: {
                              type: "string",
                              example: "2026-06-20T10:00:00.000Z",
                            },
                            availableSeats: { type: "integer", example: 2 },
                            pricePerSeat: { type: "number", example: 150 },
                            status: {
                              type: "string",
                              enum: [
                                "upcoming",
                                "full",
                                "ongoing",
                                "completed",
                                "cancelled",
                              ],
                              example: "upcoming",
                            },
                          },
                        },
                      },
                      count: { type: "integer", example: 3 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/my-requests": {
    get: {
      summary:
        "Get all rides where current user has sent a join request (Rider)",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Your ride requests fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      rides: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            _id: {
                              type: "string",
                              example: "6a34aa15f585c7dfc43336a4",
                            },
                            offeredBy: {
                              type: "object",
                              properties: {
                                username: {
                                  type: "string",
                                  example: "Sandeep Saarthi",
                                },
                              },
                            },
                            from: {
                              type: "object",
                              properties: {
                                address: {
                                  type: "string",
                                  example: "Connaught Place, Delhi",
                                },
                              },
                            },
                            to: {
                              type: "object",
                              properties: {
                                address: {
                                  type: "string",
                                  example: "Sector 18, Noida",
                                },
                              },
                            },
                            status: { type: "string", example: "upcoming" },
                            riders: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  userId: {
                                    type: "string",
                                    example: "6a34a9c5...",
                                  },
                                  username: {
                                    type: "string",
                                    example: "Rahul Sharma",
                                  },
                                  status: {
                                    type: "string",
                                    enum: ["pending", "accepted", "rejected"],
                                    example: "pending",
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      count: { type: "integer", example: 2 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/{rideId}/interested-users": {
    get: {
      summary:
        "Get users who searched this route — demand signal for ride owner",
      description:
        "Only ride owner can access. Shows users who searched the same route after ride was offered.",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a34aa15f585c7dfc43336a4" },
        },
      ],
      responses: {
        200: {
          description: "Interested users fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      interestedUsers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            userId: {
                              type: "string",
                              example: "6a34a9c58bd7555188343ba7",
                            },
                            username: {
                              type: "string",
                              example: "Rahul Sharma",
                            },
                            searchedRoute: {
                              type: "object",
                              properties: {
                                from: {
                                  type: "string",
                                  example: "Connaught Place, Delhi",
                                },
                                to: {
                                  type: "string",
                                  example: "Sector 18, Noida",
                                },
                              },
                            },
                            searchedAt: {
                              type: "string",
                              example: "2026-06-19T07:04:57.846Z",
                            },
                          },
                        },
                      },
                      count: { type: "integer", example: 2 },
                    },
                  },
                },
              },
            },
          },
        },
        403: { description: "Only ride owner can view interested users" },
        404: { description: "Ride not found" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/{rideId}/cancel": {
    patch: {
      summary: "Cancel a ride — only ride owner can cancel",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a34aa15f585c7dfc43336a4" },
        },
      ],
      responses: {
        200: { description: "Ride cancelled successfully" },
        400: { description: "Ride already completed or cancelled" },
        403: { description: "Only ride owner can cancel" },
        404: { description: "Ride not found" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/{rideId}/withdraw": {
    patch: {
      summary:
        "Withdraw join request — rider apni request cancel kar sakta hai",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a34aa15f585c7dfc43336a4" },
        },
      ],
      responses: {
        200: { description: "Request withdrawn successfully" },
        400: {
          description: "Cannot withdraw an accepted request — contact driver",
        },
        404: { description: "Ride or request not found" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/{rideId}/end": {
    patch: {
      summary: "End a ride — only ride owner can end",
      tags: ["Ride"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: { type: "string", example: "6a34aa15f585c7dfc43336a4" },
        },
      ],
      responses: {
        200: { description: "Ride ended successfully" },
        403: { description: "Only ride owner can end the ride" },
        404: { description: "Ride not found" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/location/ride/{rideId}/respond-invite": {
    patch: {
      summary: "Rider responds to driver's invite — accept or reject",
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
              required: ["action"],
              properties: {
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
        200: {
          description: "Invite accepted/rejected successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      ride: {
                        type: "object",
                        properties: {
                          _id: {
                            type: "string",
                            example: "6a1fb71391ca3b940980581a",
                          },
                          status: { type: "string", example: "upcoming" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Ride is full or not accepting responses" },
        404: { description: "No pending invite found" },
        401: { description: "Unauthorized" },
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
