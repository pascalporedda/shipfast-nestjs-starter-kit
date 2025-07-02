import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  PORT?: number = 3000;

  @IsString()
  @IsOptional()
  NODE_ENV?: string = 'development';

  @IsUrl()
  APP_URL: string;

  @IsString()
  SESSION_SECRET: string;

  @IsString()
  RESEND_API_KEY: string;

  @IsEmail()
  RESEND_FROM_EMAIL: string;

  @IsString()
  @IsOptional()
  RESEND_FROM_NAME?: string;

  @IsString()
  STRIPE_SECRET_KEY: string;

  @IsString()
  STRIPE_PUBLISHABLE_KEY: string;

  @IsString()
  STRIPE_WEBHOOK_SECRET: string;

  // Rate Limiting (Throttler) - Optional with defaults
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  THROTTLE_TTL?: number = 60;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT?: number = 100;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  THROTTLE_AUTH_TTL?: number = 300;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  THROTTLE_AUTH_LIMIT?: number = 10;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  THROTTLE_PAYMENT_TTL?: number = 60;

  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber()
  @IsOptional()
  THROTTLE_PAYMENT_LIMIT?: number = 20;

  // Sentry Configuration
  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  APP_VERSION?: string;
}
