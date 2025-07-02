import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queues/queue.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { PaymentsModule } from './payments/payments.module';
import { FilesModule } from './files/files.module';
import { PrismaService } from './database/prisma.service';
import configuration from './config/configuration';
import { EnvironmentVariables } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: async (config: Record<string, unknown>) => {
        const validatedConfig = plainToInstance(EnvironmentVariables, config, {
          enableImplicitConversion: true,
        });
        const errors = await validate(validatedConfig, {
          skipMissingProperties: false,
        });
        if (errors.length > 0) {
          throw new Error(
            errors
              .map((error) => Object.values(error.constraints || {}).join(', '))
              .join('; '),
          );
        }
        return validatedConfig;
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: (configService.get<number>('throttler.ttl') || 60) * 1000, // Convert to milliseconds
            limit: configService.get<number>('throttler.limit') || 100,
          },
          {
            name: 'auth',
            ttl: (configService.get<number>('throttler.authTtl') || 300) * 1000, // Convert to milliseconds
            limit: configService.get<number>('throttler.authLimit') || 10,
          },
          {
            name: 'payment',
            ttl: (configService.get<number>('throttler.paymentTtl') || 60) * 1000, // Convert to milliseconds
            limit: configService.get<number>('throttler.paymentLimit') || 20,
          },
          {
            name: 'userProfile',
            ttl: 60000, // 1 minute
            limit: 50,
          },
          {
            name: 'upload',
            ttl: (configService.get<number>('throttler.uploadTtl') || 60) * 1000, // Convert to milliseconds
            limit: configService.get<number>('throttler.uploadLimit') || 10,
          },
          {
            name: 'custom',
            ttl: 60000, // Default for custom throttle
            limit: 30,
          },
        ],
        storage: new ThrottlerStorageRedisService(configService.get<string>('redis.url') || 'redis://localhost:6379'),
      }),
    }),
    AuthModule,
    RedisModule,
    QueueModule,
    UsersModule,
    EmailModule,
    PaymentsModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
