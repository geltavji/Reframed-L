/**
 * Qlaws Ham - HashVerifier Module (M01.02)
 * 
 * SHA-256 implementation for formula validation.
 * Chain verification for proof sequences.
 * Timestamp embedding for temporal validation.
 * Collision detection and handling.
 * 
 * @module HashVerifier
 * @version 1.0.0
 * @dependencies NONE (uses native crypto)
 */

import * as crypto from 'crypto';

/**
 * Record of a single proof in the chain
 */
export interface ProofRecord {
  id: string;
  timestamp: Date;
  type: ProofType;
  input: string;
  output: string;
  inputHash: string;
  outputHash: string;
  previousHash: string;
  chainHash: string;
  metadata?: Record<string, unknown>;
}

/**
 * Types of proofs that can be recorded
 */
export enum ProofType {
  FORMULA = 'FORMULA',
  THEOREM = 'THEOREM',
  COMPUTATION = 'COMPUTATION',
  AXIOM = 'AXIOM',
  VALIDATION = 'VALIDATION',
  INTEGRATION = 'INTEGRATION'
}

/**
 * Hash verification result
 */
export interface VerificationResult {
  valid: boolean;
  hash: string;
  expectedHash?: string;
  errorMessage?: string;
  timestamp: Date;
}

/**
 * Chain verification result
 */
export interface ChainVerificationResult {
  valid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  brokenLinks: number[];
  firstError?: string;
}

/**
 * HashChain - Manages a sequence of linked proof records
 */
export class HashChain {
  private chainId: string;
  private records: ProofRecord[] = [];
  private lastHash: string = '0'.repeat(64);
  private recordCounter: number = 0;
  private createdAt: Date;

  constructor(chainId?: string) {
    this.chainId = chainId || this.generateChainId();
    this.createdAt = new Date();
  }

  /**
   * Generate unique chain ID
   */
  private generateChainId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `CHAIN-${timestamp}-${random}`;
  }

  /**
   * Generate record ID
   */
  private generateRecordId(): string {
    this.recordCounter++;
    return `${this.chainId}-REC-${this.recordCounter.toString().padStart(8, '0')}`;
  }

  /**
   * Add a proof record to the chain
   */
  public addRecord(
    type: ProofType,
    input: string,
    output: string,
    metadata?: Record<string, unknown>
  ): ProofRecord {
    const inputHash = HashVerifier.hash(input);
    const outputHash = HashVerifier.hash(output);
    
    const partialRecord = {
      id: this.generateRecordId(),
      timestamp: new Date(),
      type,
      input,
      output,
      inputHash,
      outputHash,
      previousHash: this.lastHash,
      metadata
    };

    const chainHash = HashVerifier.hash(JSON.stringify({
      id: partialRecord.id,
      timestamp: partialRecord.timestamp.toISOString(),
      type: partialRecord.type,
      inputHash: partialRecord.inputHash,
      outputHash: partialRecord.outputHash,
      previousHash: partialRecord.previousHash
    }));

    const record: ProofRecord = {
      ...partialRecord,
      chainHash
    };

    this.records.push(record);
    this.lastHash = chainHash;

    return record;
  }

  /**
   * Get all records in the chain
   */
  public getRecords(): ProofRecord[] {
    return [...this.records];
  }

  /**
   * Get chain ID
   */
  public getChainId(): string {
    return this.chainId;
  }

  /**
   * Get last hash
   */
  public getLastHash(): string {
    return this.lastHash;
  }

  /**
   * Get record count
   */
  public getRecordCount(): number {
    return this.records.length;
  }

  /**
   * Get chain creation time
   */
  public getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Verify the entire chain
   */
  public verify(): ChainVerificationResult {
    if (this.records.length === 0) {
      return {
        valid: true,
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        brokenLinks: []
      };
    }

    let valid = true;
    let validRecords = 0;
    let invalidRecords = 0;
    const brokenLinks: number[] = [];
    let firstError: string | undefined;
    let previousHash = '0'.repeat(64);

    for (let i = 0; i < this.records.length; i++) {
      const record = this.records[i];
      
      // Verify previous hash link
      if (record.previousHash !== previousHash) {
        valid = false;
        brokenLinks.push(i);
        if (!firstError) {
          firstError = `Broken link at record ${i}: previousHash mismatch`;
        }
      }

      // Verify chain hash
      const expectedChainHash = HashVerifier.hash(JSON.stringify({
        id: record.id,
        timestamp: record.timestamp.toISOString(),
        type: record.type,
        inputHash: record.inputHash,
        outputHash: record.outputHash,
        previousHash: record.previousHash
      }));

      if (record.chainHash !== expectedChainHash) {
        valid = false;
        invalidRecords++;
        if (!firstError) {
          firstError = `Invalid chain hash at record ${i}`;
        }
      } else {
        validRecords++;
      }

      // Verify input hash
      const computedInputHash = HashVerifier.hash(record.input);
      if (record.inputHash !== computedInputHash) {
        valid = false;
        if (!firstError) {
          firstError = `Invalid input hash at record ${i}`;
        }
      }

      // Verify output hash
      const computedOutputHash = HashVerifier.hash(record.output);
      if (record.outputHash !== computedOutputHash) {
        valid = false;
        if (!firstError) {
          firstError = `Invalid output hash at record ${i}`;
        }
      }

      previousHash = record.chainHash;
    }

    return {
      valid,
      totalRecords: this.records.length,
      validRecords,
      invalidRecords,
      brokenLinks,
      firstError
    };
  }

  /**
   * Get record by ID
   */
  public getRecordById(id: string): ProofRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  /**
   * Get records by type
   */
  public getRecordsByType(type: ProofType): ProofRecord[] {
    return this.records.filter(r => r.type === type);
  }

  /**
   * Export chain to JSON
   */
  public exportToJson(): string {
    const verification = this.verify();
    return JSON.stringify({
      chainId: this.chainId,
      createdAt: this.createdAt.toISOString(),
      recordCount: this.records.length,
      lastHash: this.lastHash,
      verified: verification.valid,
      records: this.records
    }, null, 2);
  }

  /**
   * Import chain from JSON
   */
  public static importFromJson(json: string): HashChain {
    const data = JSON.parse(json);
    const chain = new HashChain(data.chainId);
    chain.createdAt = new Date(data.createdAt);
    chain.records = data.records.map((r: ProofRecord) => ({
      ...r,
      timestamp: new Date(r.timestamp)
    }));
    chain.lastHash = data.lastHash;
    chain.recordCounter = data.records.length;
    return chain;
  }

  /**
   * Clear chain (for testing)
   */
  public clear(): void {
    this.records = [];
    this.lastHash = '0'.repeat(64);
    this.recordCounter = 0;
  }
}

/**
 * HashVerifier - Static utility class for hash operations
 */
export class HashVerifier {
  private static collisionMap: Map<string, string[]> = new Map();

  /**
   * Generate SHA-256 hash of input
   */
  public static hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Generate hash with timestamp embedded
   */
  public static hashWithTimestamp(input: string, timestamp?: Date): string {
    const ts = timestamp || new Date();
    const data = `${ts.toISOString()}|${input}`;
    return this.hash(data);
  }

  /**
   * Verify that a hash matches the expected value
   */
  public static verify(input: string, expectedHash: string): VerificationResult {
    const computedHash = this.hash(input);
    const valid = computedHash === expectedHash;
    
    return {
      valid,
      hash: computedHash,
      expectedHash,
      errorMessage: valid ? undefined : 'Hash mismatch',
      timestamp: new Date()
    };
  }

  /**
   * Generate hash for an object (serialized to JSON)
   */
  public static hashObject(obj: unknown): string {
    const json = JSON.stringify(obj, Object.keys(obj as object).sort());
    return this.hash(json);
  }

  /**
   * Generate hash for a number (high precision)
   */
  public static hashNumber(value: number | bigint | string): string {
    const strValue = typeof value === 'bigint' ? value.toString() : String(value);
    return this.hash(`NUM:${strValue}`);
  }

  /**
   * Generate hash for formula input/output
   */
  public static hashFormula(
    formulaName: string,
    inputs: Record<string, unknown>,
    output: unknown
  ): string {
    const data = {
      formula: formulaName,
      inputs: Object.keys(inputs).sort().reduce((acc, key) => {
        acc[key] = inputs[key];
        return acc;
      }, {} as Record<string, unknown>),
      output
    };
    return this.hashObject(data);
  }

  /**
   * Batch verify multiple hashes
   */
  public static batchVerify(
    items: Array<{ input: string; expectedHash: string }>
  ): { valid: boolean; results: VerificationResult[] } {
    const results = items.map(item => this.verify(item.input, item.expectedHash));
    const valid = results.every(r => r.valid);
    return { valid, results };
  }

  /**
   * Check for potential collision (detection)
   */
  public static detectCollision(input: string): {
    isCollision: boolean;
    existingInputs: string[];
  } {
    const hash = this.hash(input);
    const existing = this.collisionMap.get(hash) || [];
    
    if (existing.length > 0 && !existing.includes(input)) {
      return { isCollision: true, existingInputs: existing };
    }
    
    // Track this input
    if (!existing.includes(input)) {
      this.collisionMap.set(hash, [...existing, input]);
    }
    
    return { isCollision: false, existingInputs: [] };
  }

  /**
   * Clear collision tracking (for testing)
   */
  public static clearCollisionMap(): void {
    this.collisionMap.clear();
  }

  /**
   * Get collision map size
   */
  public static getCollisionMapSize(): number {
    return this.collisionMap.size;
  }

  /**
   * Generate proof hash for scientific validation
   */
  public static generateProofHash(
    type: ProofType,
    statement: string,
    evidence: unknown[]
  ): string {
    const data = {
      type,
      statement,
      evidence: evidence.map(e => this.hashObject(e)),
      timestamp: new Date().toISOString()
    };
    return this.hashObject(data);
  }

  /**
   * Create a verification signature
   */
  public static createSignature(
    data: string,
    chainId: string,
    recordId: string
  ): string {
    const signatureData = `${chainId}|${recordId}|${data}|${new Date().toISOString()}`;
    return this.hash(signatureData);
  }

  /**
   * Compare two hashes (constant time comparison)
   */
  public static compareHashes(hash1: string, hash2: string): boolean {
    if (hash1.length !== hash2.length) return false;
    
    let result = 0;
    for (let i = 0; i < hash1.length; i++) {
      result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Generate merkle root from array of hashes
   */
  public static merkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return this.hash('');
    if (hashes.length === 1) return hashes[0];

    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      nextLevel.push(this.hash(left + right));
    }

    return this.merkleRoot(nextLevel);
  }
}

// Export factory function for HashChain
export const createHashChain = (chainId?: string): HashChain => {
  return new HashChain(chainId);
};
