import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisPubsubService } from './redis-pubsub/redis-pubsub.service';
import { RedisCacheService } from './redis-cache/redis-cache.service';

@Module({
  providers: [RedisService, RedisCacheService, RedisPubsubService],
  exports: [RedisService, RedisCacheService, RedisPubsubService],
})
export class RedisModule {}
