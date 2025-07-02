# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager
This project uses **pnpm** as the package manager. Always use `pnpm` commands instead of npm or yarn.

## Development Commands

### Project Setup
```bash
pnpm install
pnpm run docker:up          # Start PostgreSQL and Redis
pnpm run db:generate        # Generate Prisma client
pnpm run db:migrate         # Run database migrations
```

### Development
```bash
# Start in development mode
pnpm run start:dev

# Start in debug mode
pnpm run start:debug

# Production build and start
pnpm run build
pnpm run start:prod
```

### Database Operations
```bash
# Generate Prisma client
pnpm run db:generate

# Create and run new migration
pnpm run db:migrate

# Push schema changes (dev only)
pnpm run db:push

# Open Prisma Studio
pnpm run db:studio

# Deploy migrations (production)
pnpm run db:migrate:deploy
```

### Docker Commands
```bash
# Start all services (PostgreSQL + Redis)
pnpm run docker:up

# Stop all services
pnpm run docker:down

# View logs
pnpm run docker:logs
```

### Code Quality
```bash
# Lint and fix code
pnpm run lint

# Format code
pnpm run format
```

### Testing
```bash
# Run unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Run tests with coverage
pnpm run test:cov

# Debug tests
pnpm run test:debug
```

### Email Operations
```bash
# Email functionality is integrated with Resend and React Email
# Configure environment variables:
# - RESEND_API_KEY: Your Resend API key
# - RESEND_FROM_EMAIL: Default sender email address
# - RESEND_FROM_NAME: Optional sender name

# Email templates are located in src/email/templates/
# Available templates: welcome, reset-password, notification
```

### Queue Operations
```bash
# Background job processing with Bull and Redis
# Queues available: email, file, notification
# 
# Queue types:
# - Email queue: Welcome emails, password resets, notifications
# - File queue: Image processing, PDF generation, CSV exports, cleanup
# - Notification queue: Push notifications, SMS, webhooks, in-app notifications
#
# All queue operations support:
# - Job prioritization and delays
# - Automatic retries with exponential backoff
# - Job scheduling for future execution
# - Batch processing for bulk operations
```

## Architecture

This is a production-ready NestJS boilerplate with authentication, database, and caching:

### Core Structure
- **src/main.ts**: Application entry point with CORS, validation, and global prefix (`/api`)
- **src/app.module.ts**: Root module with configuration validation and feature modules
- **src/config/**: Environment configuration and validation
- **src/database/**: Prisma service for database operations
- **src/auth/**: Complete Google OAuth authentication module
- **src/redis/**: Redis configuration for caching and queues
- **src/queues/**: Background job processors using Bull with multiple queue types
- **src/email/**: Email service with Resend integration and React Email templates
- **src/payments/**: Stripe payment processing, webhook handling, and subscription management

### Authentication Flow
- Google OAuth with Passport strategies
- JWT token generation and validation
- Session management with database storage
- Protected routes using JwtAuthGuard
- User decorator for accessing current user

### API Documentation
- Swagger/OpenAPI documentation at `/api/docs`
- Interactive API explorer with authentication
- DTOs with proper validation decorators
- Comprehensive endpoint documentation

### Database Schema
- **User model**: Stores OAuth user information with Stripe customer ID
- **Session model**: JWT token management and blacklisting
- **Product/Price models**: Stripe product and pricing synchronization
- **Subscription model**: User subscription management with Stripe sync
- **PaymentMethod model**: User payment methods storage
- **WebhookEvent model**: Stripe webhook event tracking and deduplication
- Prisma ORM with PostgreSQL backend

### Email System
- **Resend integration**: Modern email API with excellent deliverability
- **React Email templates**: Component-based email templates with JSX
- **Template rendering**: Server-side rendering of React components to HTML
- **Multiple email types**: Welcome, password reset, and notification templates
- **Environment configuration**: API key and sender information validation
- **Batch email support**: Send multiple emails efficiently
- **Email management**: Get email status and cancel scheduled emails

### Queue System
- **Multiple queue types**: Email, file processing, and notification queues
- **Bull integration**: Robust job queue with Redis backend
- **Job prioritization**: Priority-based job processing with configurable options
- **Retry mechanism**: Automatic retries with exponential backoff for failed jobs
- **Scheduled jobs**: Support for delayed job execution and scheduling
- **Batch processing**: Efficient bulk job processing with concurrency control
- **Queue monitoring**: Real-time queue statistics and failed job management
- **Job types**: Email sending, image processing, PDF generation, notifications, file cleanup

### Payment System
- **Stripe integration**: Complete payment processing with webhook support
- **Subscription management**: Recurring billing with plan changes and cancellations
- **Product synchronization**: Automatic sync of products and prices from Stripe
- **Webhook handling**: Robust webhook event processing with deduplication
- **Customer portal**: Self-service billing portal for customers
- **Payment methods**: Secure storage and management of payment methods
- **Subscription guards**: Protect premium features with subscription requirements

### Configuration
- Environment validation with class-validator
- Global configuration service
- Docker Compose for local development
- TypeScript with strict settings
- ESLint + Prettier for code quality

## Key Dependencies
- **@nestjs/core**: Core NestJS framework
- **@nestjs/passport**: Passport integration for authentication
- **@nestjs/jwt**: JWT token handling
- **@nestjs/config**: Configuration management
- **@nestjs/swagger**: Swagger/OpenAPI documentation
- **@prisma/client**: Database ORM
- **@nestjs/bull**: Queue management with Redis
- **@nestjs/cache-manager**: Caching with Redis
- **@nestjs/schedule**: Scheduled tasks and cron jobs
- **stripe**: Stripe payment processing SDK
- **resend**: Email API service for developers
- **@react-email/components**: React-based email template components

## Development Notes
- API endpoints are prefixed with `/api`
- The application runs on port 3000 by default
- Docker services (PostgreSQL + Redis) must be running for development
- JWT tokens are required for protected endpoints
- All authentication flows are handled through `/api/auth/*` endpoints
- Environment variables are validated on startup