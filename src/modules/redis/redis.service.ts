import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { redisConfig, RedisConfig } from 'src/config';
import Redis from 'ioredis';
import { ConfigService, ConfigType } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private pubClient: Redis;
  private subClient: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>,
  ) {}

  onModuleInit() {
    this.client = new Redis(this.config);
    this.pubClient = new Redis(this.config);
    this.subClient = new Redis(this.config);
  }

  getClient() {
    return this.client;
  }

  getPubClient() {
    return this.pubClient;
  }

  getSubClient() {
    return this.subClient;
  }

  async onModuleDestroy() {
    await Promise.all([
      this.client.quit(),
      this.pubClient.quit(),
      this.subClient.quit(),
    ]);
  }
}
