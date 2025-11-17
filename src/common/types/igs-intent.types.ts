/**
 * IGS Intent Types - Generated from igs-intent-schema.json
 * On-chain/Walrus stored types
 */

export interface IGSObject {
  userAddress: string;
  createdTs: number;
  policy: IGSPolicy;
}

export interface IGSPolicy {
  solverAccessWindow: {
    startMs: number;
    endMs: number;
  };
  autoRevokeTime: number;
  accessCondition: {
    requiresSolverRegistration: boolean;
    minSolverStake: string;
    requiresTeeAttestation: boolean;
    expectedMeasurement: string;
    purpose: string;
  };
}

export interface IGSIntent {
  igsVersion: string;
  object: IGSObject;
  userAddress: string;
  intentType: 'swap.exact_input' | 'swap.exact_output' | 'limit.sell' | 'limit.buy';
  description?: string;
  operation: IGSOperation;
  constraints?: IGSConstraints;
  preferences?: IGSPreferences;
  metadata?: IGSMetadata;
}

export interface IGSOperation {
  mode: 'exact_input' | 'exact_output' | 'limit_order';
  inputs: IGSAssetFlow[];
  outputs: IGSAssetFlow[];
  expectedOutcome?: IGSExpectedOutcome;
}

export interface IGSAssetFlow {
  assetId: string;
  assetInfo?: {
    symbol: string;
    decimals: number;
    name?: string;
  };
  amount: IGSAmount;
}

export type IGSAmount =
  | { type: 'exact'; value: string }
  | { type: 'range'; min: string; max: string }
  | { type: 'all' };

export interface IGSExpectedOutcome {
  expectedOutputs: Array<{
    assetId: string;
    amount: string;
  }>;
  expectedCosts?: {
    gasEstimate?: string;
    protocolFees?: string;
    slippageEstimate?: string;
  };
  benchmark?: {
    source: 'dex_aggregator' | 'oracle' | 'manual' | 'calculated';
    timestamp: number;
    confidence: number;
  };
  marketPrice?: {
    price: string;
    priceAsset: string;
  };
}

export interface IGSConstraints {
  maxSlippageBps?: number;
  deadlineMs?: number;
  maxInputs?: Array<{
    assetId: string;
    amount: string;
  }>;
  minOutputs?: Array<{
    assetId: string;
    amount: string;
  }>;
  maxGasCost?: {
    assetId: string;
    amount: string;
  };
  routing?: {
    maxHops?: number;
    blacklistProtocols?: string[];
    whitelistProtocols?: string[];
  };
  limitPrice?: {
    price: string;
    comparison: 'gte' | 'lte';
    priceAsset: string;
  };
}

export interface IGSPreferences {
  optimizationGoal?: 'maximize_output' | 'minimize_gas' | 'fastest_execution' | 'balanced';
  rankingWeights?: {
    surplusWeight?: number;
    gasCostWeight?: number;
    executionSpeedWeight?: number;
    reputationWeight?: number;
  };
  execution?: {
    mode?: 'best_solution' | 'top_n_with_best_incentive';
    showTopN?: number;
  };
  privacy?: {
    encryptIntent?: boolean;
    anonymousExecution?: boolean;
  };
}

export interface IGSMetadata {
  originalInput?: {
    text: string;
    language: string;
    confidence: number;
  };
  client?: {
    name: string;
    version: string;
    platform: string;
  };
  warnings?: string[];
  clarifications?: string[];
  tags?: string[];
}
