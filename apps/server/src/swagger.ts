import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ShPoint API',
      version: '1.0.0',
      description: 'API for ShPoint - Star Wars Shatterpoint collection management',
      contact: {
        name: 'ShPoint Team',
        email: 'admin@shpoint.com'
      }
    },
    servers: [
      {
        url: 'https://shpoint-prod.onrender.com',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'EDITOR', 'GUEST', 'API_USER'] },
            status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            avatarUrl: { type: 'string', nullable: true },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        Character: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            faction: { type: 'string' },
            unitType: { type: 'string' },
            squadPoints: { type: 'number' },
            portrait: { type: 'string', nullable: true },
            image: { type: 'string', nullable: true }
          }
        },
        StrikeTeam: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['MY_TEAMS', 'DREAM_TEAMS'] },
            description: { type: 'string', nullable: true },
            isPublished: { type: 'boolean' },
            wins: { type: 'number' },
            losses: { type: 'number' },
            draws: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Collection: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            entityType: { type: 'string', enum: ['USER', 'CARD', 'CHARACTER', 'MISSION', 'SET', 'STRIKE_TEAM', 'CUSTOM_CARD', 'COLLECTION', 'SYSTEM_SETTINGS'] },
            entityId: { type: 'string' },
            action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'STATUS_CHANGE', 'PUBLISH', 'UNPUBLISH', 'SHARE', 'UNSHARE'] },
            description: { type: 'string', nullable: true },
            changes: { type: 'object', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        sessionAuth: []
      }
    ]
  },
  apis: ['./src/index.ts'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express, ensureApiAccess: any) {
  // Temporary: Allow access to Swagger for testing (remove in production)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ShPoint API Documentation'
  }));

  // JSON endpoint (temporarily open)
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
