import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SuiService } from '../../src/modules/sui/sui.service';
import { WalrusService } from '../../src/modules/walrus/walrus.service';
import { RedisService } from '../../src/modules/redis/redis.service';
import { PreRankingService } from '../../src/modules/preranking/preranking.service';
import { mockSwapIntent, mockValidSolution, mockSuiIntentEvent, mockSuiSolutionEvent } from '../mocks';

/**
 * Integration test for the full instant preranking workflow:
 * 1. Sui event listener receives IntentSubmitted event
 * 2. Intent fetched from Walrus
 * 3. Intent stored in Redis
 * 4. Sui event listener receives SolutionSubmitted event
 * 5. Solution fetched from Walrus
 * 6. Solution instantly preranked
 * 7. Result stored in Redis
 * 8. Passed solutions queued for ranking service
 */
describe('Instant Preranking Workflow (Integration)', () => {
  let suiService: SuiService;
  let walrusService: WalrusService;
  let redisService: RedisService;
  let preRankingService: PreRankingService;
  let eventEmitter: EventEmitter2;

  const mockRedisClient = {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    sadd: jest.fn().mockResolvedValue(1),
    lpush: jest.fn().mockResolvedValue(1),
    quit: jest.fn(),
    duplicate: jest.fn().mockReturnThis(),
  };

  const mockWalrusClient = {
    fetch: jest.fn(),
  };

  const mockSuiClient = {
    queryEvents: jest.fn(),
    dryRunTransactionBlock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuiService,
        WalrusService,
        RedisService,
        PreRankingService,
        EventEmitter2,
        // Add all necessary mocked providers
      ],
    }).compile();

    suiService = module.get<SuiService>(SuiService);
    walrusService = module.get<WalrusService>(WalrusService);
    redisService = module.get<RedisService>(RedisService);
    preRankingService = module.get<PreRankingService>(PreRankingService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Setup mocks
    (walrusService as any).client = mockWalrusClient;
    (suiService as any).client = mockSuiClient;
    (redisService as any).client = mockRedisClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process intent submission end-to-end', async () => {
    // Step 1: Sui emits IntentSubmitted event
    mockSuiClient.queryEvents.mockResolvedValue({
      data: [mockSuiIntentEvent],
      hasNextPage: false,
    });

    // Step 2: Walrus returns intent data
    mockWalrusClient.fetch.mockResolvedValue(mockSwapIntent);

    // Step 3: Monitor for event emission
    const eventSpy = jest.spyOn(eventEmitter, 'emit');

    // Trigger event processing
    await (suiService as any).pollEvents();

    // Verify intent event was emitted
    expect(eventSpy).toHaveBeenCalledWith(
      'intent.submitted',
      expect.objectContaining({
        intentId: 'intent-123',
        walrusBlobId: 'blob-intent-123',
      }),
    );
  });

  it('should process solution submission with instant preranking', async () => {
    // Setup: Intent already stored in Redis
    mockRedisClient.get.mockResolvedValue(JSON.stringify(mockSwapIntent));

    // Step 1: Sui emits SolutionSubmitted event
    mockSuiClient.queryEvents.mockResolvedValue({
      data: [mockSuiSolutionEvent],
      hasNextPage: false,
    });

    // Step 2: Walrus returns solution data
    mockWalrusClient.fetch.mockResolvedValue(mockValidSolution);

    // Step 3: Dry run succeeds
    mockSuiClient.dryRunTransactionBlock.mockResolvedValue({
      effects: { status: { status: 'success' } },
    });

    // Monitor events
    const eventSpy = jest.spyOn(eventEmitter, 'emit');

    // Trigger solution processing
    await (suiService as any).pollEvents();

    // Verify solution event was emitted
    expect(eventSpy).toHaveBeenCalledWith(
      'solution.submitted',
      expect.objectContaining({
        solutionId: 'solution-456',
        intentId: 'intent-123',
      }),
    );
  });

  it('should handle complete workflow from intent to ranking queue', async () => {
    const intentId = 'intent-123';
    const solutionId = 'solution-456';

    // Step 1: Store intent
    await redisService.storeIntent(intentId, mockSwapIntent);
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      `intent:${intentId}`,
      expect.any(String),
      'EX',
      3600,
    );

    // Step 2: Validate solution
    mockSuiClient.dryRunTransactionBlock.mockResolvedValue({
      effects: { status: { status: 'success' } },
    });

    const result = await preRankingService.processSingleSolution(
      mockSwapIntent,
      solutionId,
      mockValidSolution,
    );

    expect(result.passed).toBe(true);

    // Step 3: Store passed solution
    await redisService.storeSolutionResult(intentId, solutionId, {
      solution: mockValidSolution,
      solutionId,
      features: result.features!,
      dryRunResult: result.dryRunResult!,
    });

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      `solution:${intentId}:${solutionId}`,
      expect.any(String),
      'EX',
      3600,
    );

    // Step 4: Queue for ranking service
    await redisService.sendToRankingService(intentId, {
      intentId,
      solutions: [{ solutionId, features: result.features }],
    });

    expect(mockRedisClient.lpush).toHaveBeenCalledWith(
      'ranking:queue',
      expect.any(String),
    );
  });

  it('should handle failed solution and store failure', async () => {
    const intentId = 'intent-123';
    const solutionId = 'solution-bad';

    // Dry run fails
    mockSuiClient.dryRunTransactionBlock.mockResolvedValue({
      effects: {
        status: {
          status: 'failure',
          error: 'Transaction failed',
        },
      },
    });

    const result = await preRankingService.processSingleSolution(
      mockSwapIntent,
      solutionId,
      mockValidSolution,
    );

    expect(result.passed).toBe(false);

    // Store failed solution
    await redisService.storeFailedSolution(intentId, solutionId, {
      solutionId,
      failureReason: result.failureReason!,
      errors: result.errors!,
    });

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      `failed:${intentId}:${solutionId}`,
      expect.any(String),
      'EX',
      3600,
    );
  });

  it('should persist event cursor after processing events', async () => {
    mockSuiClient.queryEvents.mockResolvedValue({
      data: [mockSuiIntentEvent, mockSuiSolutionEvent],
      hasNextPage: false,
    });

    await (suiService as any).pollEvents();

    // Verify cursor was persisted
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      'sui:event:cursor',
      expect.stringContaining('eventSeq'),
    );
  });
});
