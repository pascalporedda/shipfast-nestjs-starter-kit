import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { initializeSentry } from './config/sentry.config';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  // Initialize Sentry before any other setup
  initializeSentry(configService);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe with enhanced configuration
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new ErrorLoggingInterceptor());

  // Global exception filters (order matters - most specific first)
  app.useGlobalFilters(
    new ValidationExceptionFilter(),
    new GlobalExceptionFilter(),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI setup
  setupSwagger(app);

  const port = configService.get<number>('port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://0.0.0.0:${port}/api`);
  console.log(
    `📚 API Documentation available at: http://0.0.0.0:${port}/api/docs`,
  );
}
void bootstrap();
