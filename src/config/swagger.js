import { locationSwaggerDocs } from "../docs/location.swagger.js";

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Location Service API",
    version: "1.0.0",
  },

  servers: [
    {
      url: process.env.API_URL || "http://localhost:5004",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },

  paths: locationSwaggerDocs,
};

export default swaggerSpec;