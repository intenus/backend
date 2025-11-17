import type { IGSIntent } from '../../src/common/types/igs-intent.types';

/**
 * Mock intent data for testing
 */
export const mockSwapIntent: IGSIntent = {
  igsVersion: '1.0.0',
  object: {
    userAddress: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    createdTs: Date.now(),
    policy: {
      solverAccessWindow: {
        startMs: Date.now(),
        endMs: Date.now() + 300000, // 5 minutes
      },
      autoRevokeTime: Date.now() + 600000, // 10 minutes
      accessCondition: {
        requiresSolverRegistration: false,
        minSolverStake: '0',
        requiresTeeAttestation: false,
        expectedMeasurement: '',
        purpose: 'test',
      },
    },
  },
  userAddress: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  intentType: 'swap.exact_input',
  description: 'Swap 100 USDC for SUI with minimum 95 SUI output',
  operation: {
    mode: 'exact_input',
    inputs: [
      {
        assetId: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        assetInfo: {
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
        amount: {
          type: 'exact',
          value: '100000000', // 100 USDC
        },
      },
    ],
    outputs: [
      {
        assetId: '0x2::sui::SUI',
        assetInfo: {
          symbol: 'SUI',
          decimals: 9,
          name: 'Sui',
        },
        amount: {
          type: 'range',
          min: '95000000000', // 95 SUI minimum
          max: '999999999999',
        },
      },
    ],
  },
  constraints: {
    deadlineMs: Date.now() + 3600000, // 1 hour from now
    maxSlippageBps: 500, // 5%
    minOutputs: [
      {
        assetId: '0x2::sui::SUI',
        amount: '95000000000',
      },
    ],
  },
};

export const mockLimitBuyIntent: IGSIntent = {
  igsVersion: '1.0.0',
  object: {
    userAddress: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    createdTs: Date.now(),
    policy: {
      solverAccessWindow: {
        startMs: Date.now(),
        endMs: Date.now() + 86400000, // 24 hours
      },
      autoRevokeTime: Date.now() + 86400000 * 2, // 48 hours
      accessCondition: {
        requiresSolverRegistration: true,
        minSolverStake: '1000000000',
        requiresTeeAttestation: false,
        expectedMeasurement: '',
        purpose: 'limit-order',
      },
    },
  },
  userAddress: '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
  intentType: 'limit.buy',
  description: 'Buy 1000 SUI at max price 1.5 USDC per SUI',
  operation: {
    mode: 'limit_order',
    inputs: [
      {
        assetId: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
        assetInfo: {
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
        amount: {
          type: 'range',
          min: '0',
          max: '1500000000', // 1500 USDC max
        },
      },
    ],
    outputs: [
      {
        assetId: '0x2::sui::SUI',
        assetInfo: {
          symbol: 'SUI',
          decimals: 9,
          name: 'Sui',
        },
        amount: {
          type: 'exact',
          value: '1000000000000', // 1000 SUI
        },
      },
    ],
  },
  constraints: {
    deadlineMs: Date.now() + 86400000, // 24 hours
  },
};

/**
 * Create a custom mock intent with overrides
 */
export function createMockIntent(overrides?: Partial<IGSIntent>): IGSIntent {
  return {
    ...mockSwapIntent,
    ...overrides,
  };
}
