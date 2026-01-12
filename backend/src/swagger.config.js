const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TimeManager API',
      version: '1.0.0',
      description: 'Time tracking API with JWT auth, RBAC, and team management.',
    },
    servers: [
      { url: '/api', description: 'Production' },
      { url: 'http://localhost:3000/api', description: 'Development' },
      { url: 'http://localhost:8080/api', description: 'Docker (via Nginx)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token (Bearer <token>)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone_number: { type: 'string' },
            role: { type: 'string', enum: ['employee', 'manager'] },
            team_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                status: { type: 'integer' },
                message: { type: 'string' },
                stack: { type: 'string', description: 'Only in development' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
