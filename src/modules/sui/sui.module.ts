import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SuiService } from './sui.service';
import { suiConfig } from '../../config/sui.config';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule.forFeature(suiConfig),
    EventEmitterModule.forRoot(),
    RedisModule,
  ],
  providers: [SuiService],
  exports: [SuiService],
})
export class SuiModule {}