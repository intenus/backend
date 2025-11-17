/**
 * Sui Event Types
 * Events emitted from on-chain intent/solution submissions
 */

export interface IntentSubmittedEvent {
  intentId: string;
  userAddress: string;
  walrusBlobId: string;
  createdTs: number;
  solverAccessWindow: {
    startMs: number;
    endMs: number;
  };
  autoRevokeTime: number;
}

export interface SolutionSubmittedEvent {
  solutionId: string;
  intentId: string;
  solverAddress: string;
  walrusBlobId: string;
  submittedAt: number;
}

export interface EventCursor {
  eventSeq: string;
  txDigest: string;
}
