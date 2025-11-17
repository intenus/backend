import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from './redis-cache.service';
import { RedisService } from '../redis.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redisService: RedisService;

  const mockRedisService = {
    getClient: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
