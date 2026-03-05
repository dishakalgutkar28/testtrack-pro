const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TestTrack Pro API',
      version: '1.0.0',
      description: 'Complete API documentation for TestTrack Pro - Test Management System',
      contact: {
        name: 'Support Team',
        email: 'support@testtrackpro.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.testtrackpro.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for API authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'developer', 'tester'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TestCase: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['Active', 'Inactive', 'Blocked'] },
            projectId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Bug: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
            severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
            projectId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './routes/authRoutes.js',
    './routes/projectsRoutes.js',
    './routes/testcaseRoutes.js',
    './routes/bugRoutes.js',
    './routes/dashboardRoutes.js',
    './routes/analyticsRoutes.js',
    './routes/adminRoutes.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
