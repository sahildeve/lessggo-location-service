import { locationSwaggerDocs } from '../docs/location.swagger.js';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Location Service API',
    version: '1.0.0',
    description: 'Location & Ride Tracking Service for Cab Sharing App',
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3002',
      description: 'Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: locationSwaggerDocs,
};

export default swaggerSpec;