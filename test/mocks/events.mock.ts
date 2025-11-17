import type { IntentSubmittedEvent, SolutionSubmittedEvent, EventCursor } from '../../src/common/types/sui-events.types';
import type { SuiEvent } from '@mysten/sui/client';

/**
 * Mock Sui events for testing
 */
export const mockIntentSubmittedEvent: IntentSubmittedEvent = {
  intentId: 'intent-123',
  userAddress: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  walrusBlobId: 'blob-intent-123',
  createdTs: Date.now(),
  solverAccessWindow: {
    startMs: Date.now(),
    endMs: Date.now() + 300000, // 5 minutes
  },
  autoRevokeTime: Date.now() + 600000, // 10 minutes
};

export const mockSolutionSubmittedEvent: SolutionSubmittedEvent = {
  solutionId: 'solution-456',
  intentId: 'intent-123',
  solverAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  walrusBlobId: 'blob-solution-456',
  submittedAt: Date.now(),
};

export const mockSuiIntentEvent: SuiEvent = {
  id: {
    txDigest: 'tx-digest-123',
    eventSeq: '1000',
  },
  packageId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  transactionModule: 'intents',
  sender: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  type: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::intents::IntentSubmitted',
  parsedJson: {
    intent_id: 'intent-123',
    user_address: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    walrus_blob_id: 'blob-intent-123',
    created_ts: Date.now().toString(),
    solver_access_window: {
      start_ms: Date.now().toString(),
      end_ms: (Date.now() + 300000).toString(),
    },
    auto_revoke_time: (Date.now() + 600000).toString(),
  },
  bcs: 'mock-bcs-data',
  bcsEncoding: 'base58' as const,
  timestampMs: Date.now().toString(),
};

export const mockSuiSolutionEvent: SuiEvent = {
  id: {
    txDigest: 'tx-digest-456',
    eventSeq: '1001',
  },
  packageId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  transactionModule: 'solutions',
  sender: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  type: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::solutions::SolutionSubmitted',
  parsedJson: {
    solution_id: 'solution-456',
    intent_id: 'intent-123',
    solver_address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    walrus_blob_id: 'blob-solution-456',
    submitted_at: Date.now().toString(),
  },
  bcs: 'mock-bcs-solution',
  bcsEncoding: 'base58' as const,
  timestampMs: Date.now().toString(),
};

export const mockEventCursor: EventCursor = {
  eventSeq: '1000',
  txDigest: 'tx-digest-123',
};

/**
 * Create multiple events for batch testing
 */
export function createMockEventBatch(count: number): SuiEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockSuiIntentEvent,
    id: {
      txDigest: `tx-digest-${i}`,
      eventSeq: (1000 + i).toString(),
    },
    parsedJson: {
      intent_id: `intent-${i}`,
      user_address: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      walrus_blob_id: `blob-intent-${i}`,
      created_ts: Date.now().toString(),
      solver_access_window: {
        start_ms: Date.now().toString(),
        end_ms: (Date.now() + 300000).toString(),
      },
      auto_revoke_time: (Date.now() + 600000).toString(),
    },
  }));
}
