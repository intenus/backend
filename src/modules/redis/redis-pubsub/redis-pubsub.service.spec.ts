import { Test, TestingModule } from '@nestjs/testing';
import { RedisPubsubService } from './redis-pubsub.service';
import { RedisService } from '../redis.service';

describe('RedisPubsubService', () => {
  let service: RedisPubsubService;
  let redisService: RedisService;

  const mockRedisService = {
    getClient: jest.fn(() => ({
      publish: jest.fn(),
      subscribe: jest.fn(),
      on: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisPubsubService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RedisPubsubService>(RedisPubsubService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
