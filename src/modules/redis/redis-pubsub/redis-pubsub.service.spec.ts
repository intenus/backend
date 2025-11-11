import { Test, TestingModule } from '@nestjs/testing';
import { RedisPubsubService } from './redis-pubsub.service';

describe('RedisPubsubService', () => {
  let service: RedisPubsubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisPubsubService],
    }).compile();

    service = module.get<RedisPubsubService>(RedisPubsubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
