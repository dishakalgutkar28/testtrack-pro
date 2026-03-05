/**
 * API Documentation Helper
 * Swagger/OpenAPI documentation configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger definition
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TestTrack Pro API',
    version: '1.0.0',
    description: 'Comprehensive Test Management Platform API',
    contact: {
      name: 'TestTrack Pro Team',
      email: 'support@testtrackpro.com',
    },
    license: {
      name: 'ISC',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
    {
      url: 'https://api.testtrackpro.com',
      description: 'Production server',
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
    schemas: {
      TestCase: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'TC-2026-00001' },
          project_id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Login functionality test' },
          description: { type: 'string', example: 'Test user login with valid credentials' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
          status: {
            type: 'string',
            enum: ['draft', 'ready', 'in-progress', 'passed', 'failed', 'blocked', 'deprecated'],
            example: 'ready',
          },
          assignee_id: { type: 'integer', example: 5 },
          created_by: { type: 'integer', example: 1 },
          version: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Bug: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'BG-2026-00001' },
          project_id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Button not clickable' },
          description: { type: 'string', example: 'Submit button does not respond to clicks' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
          severity: { type: 'string', enum: ['minor', 'major', 'critical', 'blocker'], example: 'major' },
          status: {
            type: 'string',
            enum: ['open', 'in-progress', 'resolved', 'closed', 'reopened', 'on-hold'],
            example: 'open',
          },
          assignee_id: { type: 'integer', example: 3 },
          created_by: { type: 'integer', example: 2 },
          testcase_id: { type: 'string', example: 'TC-2026-00001' },
          version: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiSuccess: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operation successful' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Validation failed' },
          details: { type: 'array', items: { type: 'object' } },
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string', example: '/api/testcases' },
        },
      },
      PaginatedResult: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'array', items: { type: 'object' } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 100 },
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              pages: { type: 'integer', example: 5 },
              hasNextPage: { type: 'boolean', example: true },
              hasPrevPage: { type: 'boolean', example: false },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              status: 'error',
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { field: 'title', message: 'Title must be at least 3 characters', value: 'AB' },
              ],
              timestamp: '2026-02-26T10:30:00.000Z',
              path: '/api/testcases',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              status: 'error',
              code: 'NOT_FOUND',
              message: 'Test case not found',
              timestamp: '2026-02-26T10:30:00.000Z',
              path: '/api/testcases/TC-2026-99999',
            },
          },
        },
      },
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiError' },
            example: {
              status: 'error',
              code: 'AUTHENTICATION_ERROR',
              message: 'Authentication required',
              timestamp: '2026-02-26T10:30:00.000Z',
              path: '/api/testcases',
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Test Cases', description: 'Test case management' },
    { name: 'Bugs', description: 'Bug tracking' },
    { name: 'Executions', description: 'Test execution records' },
    { name: 'Projects', description: 'Project management' },
    { name: 'Users', description: 'User management' },
    { name: 'Health', description: 'System health and monitoring' },
  ],
};

/**
 * Swagger options
 */
const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './routes/*.js',
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * API documentation routes
 */
export const setupSwaggerDocs = (app: any) => {
  const swaggerUi = require('swagger-ui-express');
  
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TestTrack Pro API Documentation',
  }));
  
  // Swagger JSON
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
