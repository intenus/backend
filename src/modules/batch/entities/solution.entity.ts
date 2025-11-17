import { Entity, Column, PrimaryColumn, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BatchEntity } from './batch.entity';

export enum SolutionStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
}

@Entity('solutions')
export class SolutionEntity {
  @PrimaryColumn('uuid')
  solution_id: string;

  @Column('uuid')
  @Index()
  batch_id: string;

  @Column('varchar', { length: 66 })
  @Index()
  solver_address: string;

  @Column('varchar', { length: 64 })
  ptb_hash: string;

  @Column('varchar', { length: 128 })
  walrus_blob_id: string;

  @Column('simple-json')
  outcomes: any[];

  @Column('decimal', { precision: 20, scale: 8 })
  total_surplus_usd: string;

  @Column('bigint')
  estimated_gas: string;

  @Column('int')
  estimated_slippage_bps: number;

  @Column('simple-json', { nullable: true })
  strategy_summary?: {
    p2p_matches: number;
    protocol_routes: string[];
    unique_techniques?: string;
  };

  @Column('simple-json', { nullable: true })
  tee_attestation?: {
    enclave_measurement: string;
    input_hash: string;
    output_hash: string;
    timestamp: number;
    signature: string;
    verification_key: string;
  };

  @Column({
    type: 'varchar',
    length: 20,
    default: SolutionStatus.PENDING
  })
  @Index()
  status: SolutionStatus;

  @Column('bigint')
  submitted_at: number;

  @CreateDateColumn()
  created_at: Date;

  // Relationship
  @ManyToOne(() => BatchEntity)
  @JoinColumn({ name: 'batch_id' })
  batch: BatchEntity;
}
