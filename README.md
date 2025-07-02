# NestJS Ship Fast Starter Kit

A production-ready NestJS boilerplate with Google OAuth authentication, Prisma ORM, Redis for caching and queues, and Docker Compose for local development.

## Features

- ⚡ **NestJS** - Progressive Node.js framework
- 🔐 **Google OAuth** - Complete authentication flow with Passport
- 📊 **Prisma ORM** - Type-safe database access with PostgreSQL
- 🚀 **Redis** - Caching and Bull queues for background jobs
- 🐳 **Docker Compose** - Complete local development environment
- 🔒 **JWT** - Secure token-based authentication
- 💳 **Stripe Integration** - Complete payment processing and subscription management
- 📚 **Swagger/OpenAPI** - Interactive API documentation
- ✅ **Validation** - Request validation with class-validator
- 🎯 **TypeScript** - Full type safety throughout the application
- 🧪 **Testing** - Jest setup for unit and e2e tests
- 💅 **Code Quality** - ESLint and Prettier configured

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker and Docker Compose

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nestjs-ship-fast-starter-kit
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

- Set your Google OAuth credentials
- Update JWT secrets
- Configure database and Redis URLs if needed

### 3. Start Services

```bash
# Start PostgreSQL and Redis
pnpm run docker:up

# Generate Prisma client and run migrations
pnpm run db:generate
pnpm run db:migrate

# Start the application
pnpm run start:dev
```

The API will be available at `http://localhost:3000/api`

## API Documentation

Swagger documentation is automatically available at:
- Local: `http://localhost:3000/api/docs`
- Production: `https://yourdomain.com/api/docs`

Features:
- Interactive API exploration
- Authentication support (Google OAuth & JWT)
- Request/Response examples
- Try out endpoints directly from the browser

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

Update your `.env` file:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Stripe Setup

1. Create a [Stripe account](https://stripe.com) or use your existing one
2. Get your API keys from the Stripe Dashboard → Developers → API keys
3. Create products and prices in the Stripe Dashboard
4. Set up webhooks pointing to `https://yourdomain.com/api/payments/webhook`
5. Select the following webhook events:
   - `customer.created`, `customer.updated`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `invoice.payment_succeeded`, `invoice.payment_failed`
   - `product.created`, `product.updated`, `product.deleted`
   - `price.created`, `price.updated`, `price.deleted`
   - `payment_method.attached`, `payment_method.detached`

Update your `.env` file:
```env
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/profile` - Get current user profile (requires JWT)
- `POST /api/auth/logout` - Logout user (requires JWT)

### Users
- `GET /api/users` - Get all users (requires JWT)
- `GET /api/users/:id` - Get user by ID (requires JWT)
- `PATCH /api/users/:id` - Update user (requires JWT)
- `DELETE /api/users/:id` - Delete user (requires JWT)

### Payments & Subscriptions
- `POST /api/payments/checkout` - Create Stripe checkout session (requires JWT)
- `POST /api/payments/portal` - Create customer portal session (requires JWT)
- `GET /api/payments/products` - Get all available products
- `GET /api/payments/subscriptions` - Get user subscriptions (requires JWT)
- `POST /api/payments/subscriptions/:id/cancel` - Cancel subscription (requires JWT)
- `POST /api/payments/subscriptions/:id/reactivate` - Reactivate subscription (requires JWT)
- `POST /api/payments/subscriptions/:id/change` - Change subscription plan (requires JWT)
- `GET /api/payments/payment-methods` - Get user payment methods (requires JWT)
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/sync-products` - Manually sync products from Stripe

### Premium Features (Examples)
- `GET /api/premium-features/basic` - Basic features (free users)
- `GET /api/premium-features/premium` - Premium features (requires active subscription)
- `GET /api/premium-features/enterprise` - Enterprise features (requires active subscription)

### Application
- `GET /api` - Welcome message
- `GET /api/health` - Health check endpoint

### Example Usage

```bash
# 1. Initiate Google OAuth (opens browser)
curl http://localhost:3000/api/auth/google

# 2. After successful authentication, you'll receive a JWT token

# 3. Use the token to access protected routes
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/auth/profile
```

## Development Commands

```bash
# Development
pnpm run start:dev          # Start with watch mode
pnpm run start:debug        # Start in debug mode

# Database
pnpm run db:generate        # Generate Prisma client
pnpm run db:migrate         # Run database migrations
pnpm run db:push            # Push schema changes (dev only)
pnpm run db:studio          # Open Prisma Studio

# Docker
pnpm run docker:up          # Start all services
pnpm run docker:down        # Stop all services
pnpm run docker:logs        # View logs

# Code Quality
pnpm run lint               # Lint and fix code
pnpm run format             # Format code with Prettier

# Testing
pnpm run test               # Run unit tests
pnpm run test:e2e           # Run e2e tests
pnpm run test:cov           # Run tests with coverage
```

## Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── decorators/         # Custom decorators
│   ├── guards/             # Auth guards
│   ├── strategies/         # Passport strategies
│   └── auth.service.ts     # Auth business logic
├── config/                 # Configuration files
├── database/               # Database service
├── queues/                 # Background job processors
├── redis/                  # Redis configuration
└── main.ts                 # Application entry point

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Database migrations

compose.yaml                # Docker Compose configuration
```

## Database Schema

The starter includes a User model with Google OAuth integration:

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  firstName  String?
  lastName   String?
  avatar     String?
  provider   String   @default("google")
  providerId String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  sessions   Session[]
}
```

## Redis Integration

- **Caching**: Configured with cache-manager for application-level caching
- **Queues**: Bull queues for background job processing (email notifications, etc.)
- **Sessions**: JWT token management and blacklisting

## Production Deployment

1. Build the application:
   ```bash
   pnpm run build
   ```

2. Set production environment variables
3. Run database migrations:
   ```bash
   pnpm run db:migrate:deploy
   ```

4. Start the application:
   ```bash
   pnpm run start:prod
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is [MIT licensed](LICENSE).
