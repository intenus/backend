import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SuiService } from './sui.service';
import { RedisService } from '../redis/redis.service';
import { mockIntentSubmittedEvent, mockSolutionSubmittedEvent, mockSuiIntentEvent, mockSuiSolutionEvent, mockEventCursor } from '../../../test/mocks/events.mock';

describe('SuiService', () => {
  let service: SuiService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;
  let redisService: RedisService;

  const mockConfig = {
    network: 'testnet',
    rpcUrl: 'https://fullnode.testnet.sui.io',
    intentPackageId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    autoStartEventListener: false,
    eventPollingIntervalMs: 2000,
  };

  const mockSuiClient = {
    queryEvents: jest.fn(),
    dryRunTransactionBlock: jest.fn(),
    executeTransactionBlock: jest.fn(),
    getTransactionBlock: jest.fn(),
    waitForTransaction: jest.fn(),
    getObject: jest.fn(),
    multiGetObjects: jest.fn(),
    getOwnedObjects: jest.fn(),
    getCoins: jest.fn(),
    getBalance: jest.fn(),
    getAllBalances: jest.fn(),
    getReferenceGasPrice: jest.fn(),
    getChainIdentifier: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'sui') return mockConfig;
              return null;
            }),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getEventCursor: jest.fn().mockResolvedValue(null),
            storeEventCursor: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SuiService>(SuiService);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    redisService = module.get<RedisService>(RedisService);

    // Mock the SuiClient
    (service as any).client = mockSuiClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.stopEventListener();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Event Cursor Management', () => {
    it('should restore cursor from Redis on init', async () => {
      const savedCursor = { eventSeq: '1000', txDigest: 'saved-tx' };
      jest.spyOn(redisService, 'getEventCursor').mockResolvedValue(savedCursor);

      await service.onModuleInit();

      expect(redisService.getEventCursor).toHaveBeenCalled();
      expect((service as any).eventCursor).toEqual(savedCursor);
    });

    it('should start with no cursor if none saved', async () => {
      jest.spyOn(redisService, 'getEventCursor').mockResolvedValue(null);

      await service.onModuleInit();

      expect(redisService.getEventCursor).toHaveBeenCalled();
      expect((service as any).eventCursor).toBeNull();
    });

    it('should persist cursor to Redis when events are processed', async () => {
      mockSuiClient.queryEvents.mockResolvedValue({
        data: [mockSuiIntentEvent],
        hasNextPage: false,
      });

      await (service as any).pollEvents();

      expect(redisService.storeEventCursor).toHaveBeenCalledWith({
        eventSeq: mockSuiIntentEvent.id.eventSeq,
        txDigest: mockSuiIntentEvent.id.txDigest,
      });
    });

    it('should not persist cursor when no events', async () => {
      mockSuiClient.queryEvents.mockResolvedValue({
        data: [],
        hasNextPage: false,
      });

      await (service as any).pollEvents();

      expect(redisService.storeEventCursor).not.toHaveBeenCalled();
    });
  });

  describe('Event Processing', () => {
    it('should process IntentSubmitted event and emit NestJS event', async () => {
      await (service as any).processIntentEvent(mockSuiIntentEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('intent.submitted', expect.objectContaining({
        intentId: 'intent-123',
        userAddress: expect.any(String),
        walrusBlobId: 'blob-intent-123',
      }));
    });

    it('should process SolutionSubmitted event and emit NestJS event', async () => {
      await (service as any).processSolutionEvent(mockSuiSolutionEvent);

      expect(eventEmitter.emit).toHaveBeenCalledWith('solution.submitted', expect.objectContaining({
        solutionId: 'solution-456',
        intentId: 'intent-123',
        walrusBlobId: 'blob-solution-456',
      }));
    });

    it('should handle event processing errors gracefully', async () => {
      const invalidEvent = { ...mockSuiIntentEvent, parsedJson: null };

      await expect((service as any).processIntentEvent(invalidEvent)).resolves.not.toThrow();
    });
  });

  describe('Event Listener', () => {
    it('should start event listener', async () => {
      await service.startEventListener();

      expect((service as any).isListening).toBe(true);
      expect((service as any).pollingInterval).toBeDefined();
    });

    it('should stop event listener', async () => {
      await service.startEventListener();
      service.stopEventListener();

      expect((service as any).isListening).toBe(false);
      expect((service as any).pollingInterval).toBeNull();
    });

    it('should not start listener twice', async () => {
      await service.startEventListener();
      await service.startEventListener();

      // Should only have one interval
      expect((service as any).pollingInterval).toBeDefined();
    });
  });

  describe('Transaction Operations', () => {
    it('should execute transaction block', async () => {
      const txBytes = 'AAACAAgQJwAAAAAAAAA=';
      const signature = 'mock-signature';
      const mockResponse = { digest: 'tx-123', effects: { status: { status: 'success' } } };

      mockSuiClient.executeTransactionBlock.mockResolvedValue(mockResponse);

      const result = await service.executeTransactionBlock(txBytes, signature);

      expect(result).toEqual(mockResponse);
      expect(mockSuiClient.executeTransactionBlock).toHaveBeenCalled();
    });

    it('should dry run transaction block', async () => {
      const txBytes = 'AAACAAgQJwAAAAAAAAA=';
      const mockDryRunResult = { effects: { status: { status: 'success' } } };

      mockSuiClient.dryRunTransactionBlock.mockResolvedValue(mockDryRunResult);

      const result = await service.dryRunTransactionBlock(txBytes);

      expect(result).toEqual(mockDryRunResult);
      expect(mockSuiClient.dryRunTransactionBlock).toHaveBeenCalled();
    });

    it('should get transaction block by digest', async () => {
      const digest = 'tx-123';
      const mockTx = { digest, effects: {} };

      mockSuiClient.getTransactionBlock.mockResolvedValue(mockTx);

      const result = await service.getTransactionBlock(digest);

      expect(result).toEqual(mockTx);
      expect(mockSuiClient.getTransactionBlock).toHaveBeenCalledWith({
        digest,
        options: expect.any(Object),
      });
    });
  });

  describe('Object Operations', () => {
    it('should get object by ID', async () => {
      const objectId = '0xabc123';
      const mockObject = { data: { objectId } };

      mockSuiClient.getObject.mockResolvedValue(mockObject);

      const result = await service.getObject(objectId);

      expect(result).toEqual(mockObject);
      expect(mockSuiClient.getObject).toHaveBeenCalledWith({
        id: objectId,
        options: undefined,
      });
    });

    it('should get multiple objects', async () => {
      const objectIds = ['0xabc1', '0xabc2'];
      const mockObjects = [{ data: {} }, { data: {} }];

      mockSuiClient.multiGetObjects.mockResolvedValue(mockObjects);

      const result = await service.getObjects(objectIds);

      expect(result).toEqual(mockObjects);
      expect(mockSuiClient.multiGetObjects).toHaveBeenCalledWith({
        ids: objectIds,
        options: undefined,
      });
    });
  });

  describe('Coin Operations', () => {
    it('should get balance for address', async () => {
      const address = '0xabc123';
      const mockBalance = { coinType: '0x2::sui::SUI', totalBalance: '1000000000' };

      mockSuiClient.getBalance.mockResolvedValue(mockBalance);

      const result = await service.getBalance(address);

      expect(result).toEqual(mockBalance);
      expect(mockSuiClient.getBalance).toHaveBeenCalledWith({
        owner: address,
        coinType: undefined,
      });
    });

    it('should get all balances for address', async () => {
      const address = '0xabc123';
      const mockBalances = [
        { coinType: '0x2::sui::SUI', totalBalance: '1000000000' },
        { coinType: '0x5d4b::coin::COIN', totalBalance: '5000000' },
      ];

      mockSuiClient.getAllBalances.mockResolvedValue(mockBalances);

      const result = await service.getAllBalances(address);

      expect(result).toEqual(mockBalances);
      expect(mockSuiClient.getAllBalances).toHaveBeenCalledWith({
        owner: address,
      });
    });
  });

  describe('Query Operations', () => {
    it('should query events', async () => {
      const query = { MoveEventType: 'intent::IntentSubmitted' };
      const mockEvents = { data: [mockSuiIntentEvent], hasNextPage: false };

      mockSuiClient.queryEvents.mockResolvedValue(mockEvents);

      const result = await service.queryEvents(query);

      expect(result).toEqual(mockEvents);
      expect(mockSuiClient.queryEvents).toHaveBeenCalledWith({
        query,
        cursor: undefined,
        limit: undefined,
        order: undefined,
      });
    });
  });

  describe('getSuiClient', () => {
    it('should return underlying Sui client', () => {
      const client = service.getSuiClient();
      expect(client).toBe(mockSuiClient);
    });
  });
});
