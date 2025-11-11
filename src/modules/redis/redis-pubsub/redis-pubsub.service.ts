import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis.service';

@Injectable()
export class RedisPubsubService {
  private readonly logger = new Logger(RedisPubsubService.name);

  constructor(private readonly redisService: RedisService) {}

  private get pub() {
    return this.redisService.getPubClient();
  }

  private get sub() {
    return this.redisService.getSubClient();
  }

  async publish(channel: string, message: any) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    await this.pub.publish(channel, payload);
    this.logger.debug(`Published message to ${channel}`);
  }

  async subscribe(channel: string, handler: (message: any) => void) {
    await this.sub.subscribe(channel);
    this.sub.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(msg);
          handler(data);
        } catch {
          handler(msg);
        }
      }
    });
    this.logger.log(`Subscribed to ${channel}`);
  }
}
