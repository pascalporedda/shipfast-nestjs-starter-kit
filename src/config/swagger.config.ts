import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('NestJS Ship Fast Starter Kit API')
    .setDescription(
      `
## Overview
This is the API documentation for the NestJS Ship Fast Starter Kit.

### Features:
- 🔐 **Google OAuth Authentication**
- 🔑 **JWT Token Authentication**
- 👤 **User Management**
- 📊 **Prisma ORM with PostgreSQL**
- 🚀 **Redis Caching and Queues**

### Getting Started:
1. Click on "Authorize" and select Google OAuth to login
2. Use the returned JWT token for authenticated endpoints
3. Explore the available endpoints below
    `,
    )
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://github.com/your-username/nestjs-ship-fast-starter-kit',
      'support@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addOAuth2(
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: '/api/auth/google',
            tokenUrl: '/api/auth/google/callback',
            scopes: {
              email: 'Access user email',
              profile: 'Access user profile',
            },
          },
        },
      },
      'google-oauth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('payments', 'Payment and subscription endpoints')
    .addTag('app', 'Application endpoints')
    .addServer('http://localhost:3000', 'Local Development')
    .addServer('https://api.example.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        theme: 'monokai',
      },
      tryItOutEnabled: true,
    },
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
  });
};
