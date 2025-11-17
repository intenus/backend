import type { IGSSolution } from '../../src/common/types/igs-solution.types';

/**
 * Mock solution data for testing
 */
export const mockValidSolution: IGSSolution = {
  solverAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  transactionBytes: 'AAACAAgQJwAAAAAAAAAgKFIJyZPYx5gj2gPIFg3Vt8CHVVP3aI+3+NhzqZkCZx8CAQAAAAAAAACA8gUWAAAAAAA=',
};

export const mockSolution2: IGSSolution = {
  solverAddress: '0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
  transactionBytes: 'AAACAAgQJwAAAAAAAAAgKFIJyZPYx5gj2gPIFg3Vt8CHVVP3aI+3+NhzqZkCZx8CAQAAAAAAAACA8gUWBBBBBB==',
};

export const mockFailedSolution: IGSSolution = {
  solverAddress: '0x1234000000000000000000000000000000000000000000000000000000000000',
  transactionBytes: 'InvalidBase64String!!!',
};

/**
 * Create a custom mock solution with overrides
 */
export function createMockSolution(overrides?: Partial<IGSSolution>): IGSSolution {
  return {
    ...mockValidSolution,
    ...overrides,
  };
}
