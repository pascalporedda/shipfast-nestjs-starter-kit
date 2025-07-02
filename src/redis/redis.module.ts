import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url')!;
        const url = new URL(redisUrl);
        return {
          redis: {
            host: url.hostname,
            port: parseInt(url.port),
          },
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url')!;
        const url = new URL(redisUrl);
        return {
          store: redisStore,
          host: url.hostname,
          port: parseInt(url.port),
          ttl: 600, // 10 minutes default TTL
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  exports: [BullModule, CacheModule],
})
export class RedisModule {}
