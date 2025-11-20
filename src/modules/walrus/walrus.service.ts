import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import type { IntenusWalrusClient, StorageResult } from '@intenus/walrus';
import type { Signer } from '@mysten/sui/cryptography';
import { IntenusWalrusClient as WalrusClient } from '@intenus/walrus';
import type { WalrusConfig } from '../../config/walrus.config';
import type { IGSIntent } from '../../common/types/igs-intent.types';
import type { IGSSolution } from '../../common/types/igs-solution.types';
import { firstValueFrom } from 'rxjs';

/**
 * Walrus Service - Wrapper around @intenus/walrus SDK
 * Handles fetching encrypted intents and solutions from Walrus
 *
 * Flow:
 * 1. Receive on-chain event with Walrus blob ID
 * 2. Fetch encrypted data from Walrus using blob ID
 * 3. Decrypt using Sui Seal (handled by SDK)
 * 4. Return typed intent/solution data
 */
@Injectable()
export class WalrusService implements OnModuleInit {
  private readonly logger = new Logger(WalrusService.name);
  private client: IntenusWalrusClient;
  private config: WalrusConfig;
  private readonly walrusUrl: string = 'https://walrus.xyz/v1/blobs/';

  constructor(
    private configService: ConfigService,
    private readonly http: HttpService,
  ) {
    this.config = this.configService.get<WalrusConfig>('walrus')!;
  }

  async onModuleInit() {
    try {
      const network =
        this.config.network === 'devnet' ? 'testnet' : this.config.network;

      this.client = new WalrusClient({
        network: network as 'mainnet' | 'testnet',
      });

      this.logger.log(`Walrus client initialized for ${network}`);
    } catch (error) {
      this.logger.error('Failed to initialize Walrus client', error);
      throw error;
    }
  }

  // ===== INTENT OPERATIONS =====

  /**
   * Fetch encrypted intent from Walrus and decrypt
   * Called when IntentSubmitted event is received
   */
  async fetchIntent(blobId: string): Promise<IGSIntent> {
    try {
      this.logger.log(`Fetching intent from Walrus: ${blobId}`);

      const buffer = await this.client.fetchRaw(blobId);
      const intent = JSON.parse(buffer.toString()) as IGSIntent;

      this.logger.log(
        `Intent fetched successfully: ${intent.object.userAddress}`,
      );
      return intent;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch intent from Walrus: ${error.message}`,
        error.stack,
      );
      throw new Error(`Intent not found on Walrus: ${blobId}`);
    }
  }

  /**
   * Fetch encrypted intent from Walrus via HTTP and decrypt
   * Called when IntentSubmitted event is received
   */
  async fetchIntentHttp(blobId: string): Promise<IGSIntent> {
    try {
      this.logger.log(`Fetching intent from Walrus via HTTP: ${blobId}`);
      
      const response = await firstValueFrom(
        this.http.get<Buffer>(`${this.walrusUrl}${blobId}`, {
          responseType: 'arraybuffer',
        }),
      );
      const buffer = Buffer.from(response.data as any);
      const intent = JSON.parse(buffer.toString()) as IGSIntent;

      this.logger.log(
        `Intent fetched successfully via HTTP: ${intent.object.userAddress}`,
      );
      return intent;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch intent from Walrus via HTTP: ${error.message}`,
        error.stack,
      );
      throw new Error(`Intent not found on Walrus: ${blobId}`);
    }
  }

  /**
   * Fetch encrypted solution from Walrus and decrypt
   * Called when SolutionSubmitted event is received
   */
  async fetchSolution(blobId: string): Promise<IGSSolution> {
    try {
      this.logger.log(`Fetching solution from Walrus: ${blobId}`);

      const buffer = await this.client.fetchRaw(blobId);
      const solution = JSON.parse(buffer.toString()) as IGSSolution;

      this.logger.log(
        `Solution fetched successfully: ${solution.solverAddress}`,
      );
      return solution;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch solution from Walrus: ${error.message}`,
        error.stack,
      );
      throw new Error(`Solution not found on Walrus: ${blobId}`);
    }
  }

  /**
   * Fetch encrypted solution from Walrus via HTTP and decrypt
   * Called when SolutionSubmitted event is received
   */
  async fetchSolutionHttp(blobId: string): Promise<IGSSolution> {
    try {
      this.logger.log(`Fetching solution from Walrus via HTTP: ${blobId}`);

      const response = await firstValueFrom(
        this.http.get<Buffer>(`${this.walrusUrl}${blobId}`, {
          responseType: 'arraybuffer',
        }),
      );

      const buffer = Buffer.from(response.data as any);
      const solution = JSON.parse(buffer.toString()) as IGSSolution;

      this.logger.log(
        `Solution fetched successfully via HTTP: ${solution.solverAddress}`,
      );
      return solution;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch solution from Walrus via HTTP: ${error.message}`,
        error.stack,
      );
      throw new Error(`Solution not found on Walrus: ${blobId}`);
    }
  }

  /**
   * Verify blob exists on Walrus (lightweight check)
   */
  async verifyBlobExists(blobId: string): Promise<boolean> {
    const exists = await this.client.exists(blobId);
    if (!exists) {
      throw new Error(`Blob not found on Walrus: ${blobId}`);
    }
    return true;
  }

  /**
   * Fetch raw blob data
   */
  async fetchRaw(blobId: string): Promise<Buffer> {
    return this.client.fetchRaw(blobId);
  }

  // ===== BATCH OPERATIONS =====

  /**
   * Store batch manifest to Walrus
   */
  async storeBatchManifest(
    manifest: any,
    signer: Signer,
  ): Promise<StorageResult> {
    return this.client.batches.storeManifest(manifest, signer);
  }

  /**
   * Fetch batch manifest by epoch
   */
  async fetchBatchManifest(epoch: number): Promise<any> {
    return this.client.batches.fetchManifest(epoch);
  }

  /**
   * Check if batch manifest exists
   */
  async batchManifestExists(epoch: number): Promise<boolean> {
    return this.client.batches.manifestExists(epoch);
  }

  /**
   * Store intents efficiently (uses SDK's writeFiles internally)
   * Note: This method's signature may change as SDK stabilizes
   */
  async storeIntents(
    intents: Array<{ intent_id: string; data: any; category?: string }>,
    batchId: string,
    signer: Signer,
    epochs?: number,
  ): Promise<any> {
    // Use underlying client directly for now
    return (
      (this.client.batches as any).storeIntents?.(
        intents,
        batchId,
        signer,
        epochs,
      ) || Promise.reject(new Error('storeIntents not implemented in SDK yet'))
    );
  }

  /**
   * Fetch intents by epoch
   */
  async fetchIntentsByEpoch(epoch: number): Promise<
    Array<{
      intent_id: string;
      data: any;
      category: string;
    }>
  > {
    // Use underlying client directly for now
    return (
      (this.client.batches as any).fetchIntentsByEpoch?.(epoch) ||
      Promise.reject(
        new Error('fetchIntentsByEpoch not implemented in SDK yet'),
      )
    );
  }

  // ===== ARCHIVE OPERATIONS =====

  /**
   * Store execution archive
   */
  async storeArchive(archive: any, signer: Signer): Promise<StorageResult> {
    return this.client.archives.storeArchive(archive, signer);
  }

  /**
   * Fetch archive by batch ID
   */
  async fetchArchive(epoch: number, batchId: string): Promise<any> {
    return this.client.archives.fetchArchive(epoch, batchId);
  }

  /**
   * Check if archive exists
   */
  async archiveExists(epoch: number, batchId: string): Promise<boolean> {
    return this.client.archives.archiveExists(epoch, batchId);
  }

  // ===== USER OPERATIONS =====

  /**
   * Store user history
   */
  async storeUserHistory(history: any, signer: Signer): Promise<StorageResult> {
    return this.client.users.storeHistory(history, signer);
  }

  /**
   * Fetch user history
   */
  async fetchUserHistory(userAddress: string): Promise<any> {
    return this.client.users.fetchHistory(userAddress);
  }

  /**
   * Check if user history exists
   */
  async userHistoryExists(userAddress: string): Promise<boolean> {
    return this.client.users.historyExists(userAddress);
  }

  // ===== TRAINING OPERATIONS =====

  /**
   * Store training dataset
   * Note: Returns composite result, not single StorageResult
   */
  async storeTrainingDataset(
    version: string,
    features: Buffer,
    labels: Buffer,
    metadata: any,
    signer: Signer,
  ): Promise<any> {
    return (
      (this.client.training as any).storeDataset?.(
        version,
        features,
        labels,
        metadata,
        signer,
      ) ||
      Promise.reject(new Error('storeDataset not fully implemented in SDK'))
    );
  }

  /**
   * Store trained model
   * Note: Returns composite result, not single StorageResult
   */
  async storeModel(
    modelName: string,
    version: string,
    modelBuffer: Buffer,
    metadata: any,
    signer: Signer,
  ): Promise<any> {
    return (
      (this.client.training as any).storeModel?.(
        modelName,
        version,
        modelBuffer,
        metadata,
        signer,
      ) || Promise.reject(new Error('storeModel not fully implemented in SDK'))
    );
  }

  /**
   * Fetch training dataset metadata
   */
  async fetchDatasetMetadata(metadataBlobId: string): Promise<any> {
    return (
      (this.client.training as any).fetchDatasetMetadata?.(metadataBlobId) ||
      Promise.reject(
        new Error('fetchDatasetMetadata not implemented in SDK yet'),
      )
    );
  }

  /**
   * Fetch model metadata
   */
  async fetchModelMetadata(metadataBlobId: string): Promise<any> {
    return (
      (this.client.training as any).fetchModelMetadata?.(metadataBlobId) ||
      Promise.reject(new Error('fetchModelMetadata not implemented in SDK yet'))
    );
  }

  /**
   * Fetch trained model
   */
  async fetchModel(
    modelBlobId: string,
    modelName: string,
    version: string,
  ): Promise<Buffer> {
    return (
      (this.client.training as any).fetchModel?.(
        modelBlobId,
        modelName,
        version,
      ) ||
      Promise.reject(new Error('fetchModel signature may have changed in SDK'))
    );
  }

  // ===== LOW-LEVEL OPERATIONS =====

  /**
   * Store raw data to Walrus
   */
  async storeRaw(
    path: string,
    data: Buffer,
    epochs: number,
    signer: Signer,
  ): Promise<StorageResult> {
    return this.client.storeRaw(path, data, epochs, signer);
  }

  /**
   * Check if blob exists
   */
  async exists(blobId: string): Promise<boolean> {
    return this.client.exists(blobId);
  }

  /**
   * Get underlying Walrus client for advanced operations
   */
  getWalrusClient(): IntenusWalrusClient {
    return this.client;
  }
}
