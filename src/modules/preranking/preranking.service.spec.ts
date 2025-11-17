import { Test, TestingModule } from '@nestjs/testing';
import { PreRankingService } from './preranking.service';
import { ConstraintValidator } from './validators/constraint.validator';
import { SuiService } from '../sui/sui.service';
import { mockSwapIntent, mockLimitBuyIntent } from '../../../test/mocks/intent.mock';
import { mockValidSolution, mockFailedSolution } from '../../../test/mocks/solution.mock';

describe('PreRankingService', () => {
  let service: PreRankingService;
  let constraintValidator: ConstraintValidator;
  let suiService: SuiService;

  const mockDryRunSuccess = {
    effects: {
      status: {
        status: 'success',
      },
    },
    events: [],
    objectChanges: [],
  };

  const mockDryRunFailure = {
    effects: {
      status: {
        status: 'failure',
        error: 'Insufficient balance',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreRankingService,
        {
          provide: ConstraintValidator,
          useValue: {
            validate: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
          },
        },
        {
          provide: SuiService,
          useValue: {
            dryRunTransactionBlock: jest.fn().mockResolvedValue(mockDryRunSuccess),
          },
        },
      ],
    }).compile();

    service = module.get<PreRankingService>(PreRankingService);
    constraintValidator = module.get<ConstraintValidator>(ConstraintValidator);
    suiService = module.get<SuiService>(SuiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processSingleSolution (Instant Preranking)', () => {
    it('should pass valid solution through all validation steps', async () => {
      const result = await service.processSingleSolution(
        mockSwapIntent,
        'solution-123',
        mockValidSolution,
      );

      expect(result.passed).toBe(true);
      expect(result.features).toBeDefined();
      expect(result.dryRunResult).toBeDefined();
      expect(constraintValidator.validate).toHaveBeenCalledWith(
        mockSwapIntent,
        mockValidSolution,
      );
      expect(suiService.dryRunTransactionBlock).toHaveBeenCalledWith(
        mockValidSolution.transactionBytes,
      );
    });

    it('should fail solution with invalid constraints', async () => {
      jest.spyOn(constraintValidator, 'validate').mockResolvedValue({
        isValid: false,
        errors: [{ field: 'slippage', message: 'Exceeds max slippage', severity: 'error' }],
      });

      const result = await service.processSingleSolution(
        mockSwapIntent,
        'solution-123',
        mockValidSolution,
      );

      expect(result.passed).toBe(false);
      expect(result.failureReason).toBe('Constraint validation failed');
      expect(result.errors).toHaveLength(1);
      expect(suiService.dryRunTransactionBlock).not.toHaveBeenCalled();
    });

    it('should fail solution with failed dry run', async () => {
      jest.spyOn(suiService, 'dryRunTransactionBlock').mockResolvedValue(mockDryRunFailure);

      const result = await service.processSingleSolution(
        mockSwapIntent,
        'solution-123',
        mockValidSolution,
      );

      expect(result.passed).toBe(false);
      expect(result.failureReason).toBe('Dry run failed');
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: 'Insufficient balance' }),
      );
    });

    it('should handle processing errors gracefully', async () => {
      jest.spyOn(constraintValidator, 'validate').mockRejectedValue(
        new Error('Validation service unavailable'),
      );

      const result = await service.processSingleSolution(
        mockSwapIntent,
        'solution-123',
        mockValidSolution,
      );

      expect(result.passed).toBe(false);
      expect(result.failureReason).toBe('Processing error');
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: 'Validation service unavailable' }),
      );
    });

    it('should extract features from valid solution', async () => {
      const result = await service.processSingleSolution(
        mockSwapIntent,
        'solution-123',
        mockValidSolution,
      );

      expect(result.features).toBeDefined();
      // Features should include solver address, transaction data, etc.
    });
  });

  describe('processIntent (Batch Processing - Deprecated)', () => {
    it('should process multiple solutions for an intent', async () => {
      const solutions = [
        { solutionId: 'sol-1', solution: mockValidSolution },
        { solutionId: 'sol-2', solution: mockValidSolution },
      ];

      const result = await service.processIntent(mockSwapIntent, solutions);

      expect(result.passedSolutionIds).toHaveLength(2);
      expect(result.failedSolutionIds).toHaveLength(0);
      expect(result.featureVectors).toHaveLength(2);
      expect(result.dryRunResults).toHaveLength(2);
    });

    it('should separate passed and failed solutions', async () => {
      jest.spyOn(constraintValidator, 'validate')
        .mockResolvedValueOnce({ isValid: true, errors: [] })
        .mockResolvedValueOnce({ isValid: false, errors: [{ field: 'constraint', message: 'Invalid', severity: 'error' }] });

      const solutions = [
        { solutionId: 'sol-1', solution: mockValidSolution },
        { solutionId: 'sol-2', solution: mockValidSolution },
      ];

      const result = await service.processIntent(mockSwapIntent, solutions);

      expect(result.passedSolutionIds).toHaveLength(1);
      expect(result.failedSolutionIds).toHaveLength(1);
    });

    it('should handle empty solutions array', async () => {
      const result = await service.processIntent(mockSwapIntent, []);

      expect(result.passedSolutionIds).toHaveLength(0);
      expect(result.failedSolutionIds).toHaveLength(0);
    });
  });

  describe('extractFeatures', () => {
    it('should extract features from solution and dry run result', () => {
      const features = (service as any).extractFeatures(
        mockSwapIntent,
        mockValidSolution,
        mockDryRunSuccess,
      );

      expect(features).toBeDefined();
      expect(features.gasCost).toBeDefined();
      expect(features.surplusUsd).toBeDefined();
      expect(features.totalCost).toBeDefined();
    });
  });

  describe('classifyIntent', () => {
    it('should classify swap intent correctly', () => {
      const classification = (service as any).classifyIntent(mockSwapIntent);

      expect(classification).toBeDefined();
      expect(classification.primaryCategory).toBe('swap');
      expect(classification.confidence).toBeGreaterThan(0);
    });

    it('should classify limit order intent correctly', () => {
      const classification = (service as any).classifyIntent(mockLimitBuyIntent);

      expect(classification).toBeDefined();
      expect(classification.primaryCategory).toBe('limit_order');
      expect(classification.confidence).toBeGreaterThan(0);
    });
  });
});
