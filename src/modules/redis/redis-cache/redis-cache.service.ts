import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';

@Injectable()
export class RedisCacheService {
  constructor(private readonly redisService: RedisService) {}

  private get client() {
    return this.redisService.getClient();
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    const serialized = JSON.stringify(value);
    if (ttlSeconds)
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    else
      await this.client.set(key, serialized);
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
