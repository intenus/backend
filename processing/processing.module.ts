import { Module } from '@nestjs/common';
import { IntentProcessingService } from './services/intent-processing.service';
import { WalrusModule } from '../src/modules/walrus/walrus.module';
import { PreRankingModule } from '../src/modules/preranking/preranking.module';
import { RedisModule } from '../src/modules/redis/redis.module';

/**
 * Processing Module - Orchestrates intent and solution processing workflow
 * 
 * Responsibilities:
 * - Listens to on-chain events (IntentSubmitted, SolutionSubmitted)
 * - Fetches encrypted data from Walrus
 * - Coordinates instant preranking validation
 * - Stores results in Redis
 * - Sends to ranking service when window closes
 * 
 * This module was formerly named "IntentModule" but renamed to better reflect
 * its role as the main processing orchestrator that coordinates multiple services.
 */
@Module({
  imports: [
    WalrusModule,
    PreRankingModule,
    RedisModule,    
  ],
  providers: [
    IntentProcessingService,
  ],
  exports: [IntentProcessingService],
})
export class ProcessingModule {}
