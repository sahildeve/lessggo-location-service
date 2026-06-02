export const locationSwaggerDocs = {
  "/api/location/save": {
    post: {
      tags: ["Location"],
      summary: "Save pickup/dropoff location",
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Location saved successfully",
        },
      },
    },
  },

  "/api/location": {
    get: {
      tags: ["Location"],
      summary: "Get user locations",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Locations fetched successfully",
        },
      },
    },
  },

  "/api/location/ride/create": {
    post: {
      tags: ["Ride"],
      summary: "Create ride",
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Ride created successfully",
        },
      },
    },
  },

  "/api/location/ride/join": {
    post: {
      tags: ["Ride"],
      summary: "Join ride",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Joined ride successfully",
        },
      },
    },
  },

  "/api/location/ride/{rideId}": {
    get: {
      tags: ["Ride"],
      summary: "Get ride details",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "rideId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Ride fetched successfully",
        },
      },
    },
  },

  "/api/location/ride/cab-location": {
    patch: {
      tags: ["Ride"],
      summary: "Update cab live location",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cab location updated",
        },
      },
    },
  },
};