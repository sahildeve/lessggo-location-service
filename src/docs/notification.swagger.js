export const notificationSwaggerDocs = {
  "/api/notifications": {
    get: {
      summary: "Get all notifications — auto deleted after fetch",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Notifications fetched and deleted",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      notifications: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            _id:       { type: "string", example: "6a34aa15..." },
                            type:      { type: "string", example: "ride_request_received" },
                            title:     { type: "string", example: "New Ride Request" },
                            message:   { type: "string", example: "Sandeep wants to join your ride" },
                            data:      { type: "object", example: { rideId: "6a34aa15..." } },
                            createdAt: { type: "string", example: "2026-06-30T10:00:00.000Z" },
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

  "/api/notifications/count": {
    get: {
      summary: "Get notification count — does not delete",
      tags: ["Notifications"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Count fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      count: { type: "integer", example: 5 },
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
};