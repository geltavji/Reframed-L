/**
 * QuantumCrypto - PRD-15 Phase 15.4
 * Quantum cryptography and security protocols
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Protocol types
export type CryptoProtocol = 
  | 'bb84'
  | 'e91'
  | 'b92'
  | 'sarg04'
  | 'cv_qkd'
  | 'mdi_qkd';

// Quantum Key Distribution
export interface QuantumKeyDistribution {
  id: string;
  name: string;
  protocol: CryptoProtocol;
  keyRate: number; // bits per second
  securityLevel: number; // bits
  maxDistance: number; // km
  errorTolerance: number;
  hash: string;
}

// Quantum Random Number Generator
export interface QuantumRNG {
  id: string;
  name: string;
  method: string;
  bitRate: number;
  randomnessQuality: number;
  deviceIndependent: boolean;
  hash: string;
}

// Quantum-Safe Protocol
export interface QuantumSafeProtocol {
  id: string;
  name: string;
  type: string;
  algorithm: string;
  securityAssumption: string;
  keySize: number;
  signatureSize: number;
  hash: string;
}

// Key exchange result
export interface KeyExchangeResult {
  success: boolean;
  protocolId: string;
  keyLength: number;
  errorRate: number;
  securityParameter: number;
  time: number;
  hash: string;
}

/**
 * QuantumCrypto - Main quantum cryptography class
 */
export class QuantumCrypto {
  private logger: Logger;
  private qkdProtocols: Map<string, QuantumKeyDistribution> = new Map();
  private rngs: Map<string, QuantumRNG> = new Map();
  private safeProtocols: Map<string, QuantumSafeProtocol> = new Map();
  private protocolCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeProtocols();
  }

  private initializeProtocols(): void {
    // BB84 Protocol
    this.createQKD({
      name: 'BB84 Protocol',
      protocol: 'bb84',
      keyRate: 1e6,
      securityLevel: 256,
      maxDistance: 100,
      errorTolerance: 0.11
    });

    // E91 Protocol
    this.createQKD({
      name: 'E91 Entanglement Protocol',
      protocol: 'e91',
      keyRate: 1e5,
      securityLevel: 256,
      maxDistance: 50,
      errorTolerance: 0.15
    });

    // CV-QKD
    this.createQKD({
      name: 'Continuous Variable QKD',
      protocol: 'cv_qkd',
      keyRate: 1e7,
      securityLevel: 128,
      maxDistance: 200,
      errorTolerance: 0.2
    });

    // MDI-QKD
    this.createQKD({
      name: 'Measurement Device Independent QKD',
      protocol: 'mdi_qkd',
      keyRate: 1e4,
      securityLevel: 256,
      maxDistance: 400,
      errorTolerance: 0.25
    });

    // Vacuum Fluctuation QRNG
    this.createRNG({
      name: 'Vacuum Fluctuation QRNG',
      method: 'Homodyne detection of vacuum',
      bitRate: 1e9,
      randomnessQuality: 0.99,
      deviceIndependent: false
    });

    // Single Photon QRNG
    this.createRNG({
      name: 'Single Photon QRNG',
      method: 'Beam splitter path',
      bitRate: 1e6,
      randomnessQuality: 0.999,
      deviceIndependent: true
    });

    // CRYSTALS-Kyber
    this.createSafeProtocol({
      name: 'CRYSTALS-Kyber',
      type: 'Key Encapsulation',
      algorithm: 'Module-LWE',
      securityAssumption: 'Lattice hardness',
      keySize: 3168,
      signatureSize: 0
    });

    // CRYSTALS-Dilithium
    this.createSafeProtocol({
      name: 'CRYSTALS-Dilithium',
      type: 'Digital Signature',
      algorithm: 'Module-LWE',
      securityAssumption: 'Lattice hardness',
      keySize: 2528,
      signatureSize: 3293
    });

    // SPHINCS+
    this.createSafeProtocol({
      name: 'SPHINCS+',
      type: 'Digital Signature',
      algorithm: 'Hash-based',
      securityAssumption: 'Hash collision resistance',
      keySize: 64,
      signatureSize: 49856
    });
  }

  private createQKD(config: Omit<QuantumKeyDistribution, 'id' | 'hash'>): void {
    const id = `qkd-${++this.protocolCount}`;
    
    const qkd: QuantumKeyDistribution = {
      id,
      ...config,
      hash: ''
    };
    qkd.hash = HashVerifier.hash(JSON.stringify({ ...qkd, hash: '' }));

    this.qkdProtocols.set(id, qkd);

    this.logger.info('QKD protocol created', {
      id,
      name: config.name,
      protocol: config.protocol,
      hash: qkd.hash
    });
  }

  private createRNG(config: Omit<QuantumRNG, 'id' | 'hash'>): void {
    const id = `qrng-${++this.protocolCount}`;
    
    const rng: QuantumRNG = {
      id,
      ...config,
      hash: ''
    };
    rng.hash = HashVerifier.hash(JSON.stringify({ ...rng, hash: '' }));

    this.rngs.set(id, rng);

    this.logger.info('QRNG created', {
      id,
      name: config.name,
      bitRate: config.bitRate,
      hash: rng.hash
    });
  }

  private createSafeProtocol(config: Omit<QuantumSafeProtocol, 'id' | 'hash'>): void {
    const id = `qsafe-${++this.protocolCount}`;
    
    const protocol: QuantumSafeProtocol = {
      id,
      ...config,
      hash: ''
    };
    protocol.hash = HashVerifier.hash(JSON.stringify({ ...protocol, hash: '' }));

    this.safeProtocols.set(id, protocol);

    this.logger.info('Quantum-safe protocol created', {
      id,
      name: config.name,
      type: config.type,
      hash: protocol.hash
    });
  }

  /**
   * Exchange key using QKD
   */
  exchangeKey(protocolId: string, distance: number): KeyExchangeResult {
    const protocol = this.qkdProtocols.get(protocolId);
    if (!protocol) {
      return this.createFailedResult('Protocol not found');
    }

    if (distance > protocol.maxDistance) {
      return this.createFailedResult('Distance exceeds protocol maximum');
    }

    // Calculate effective key rate (decreases with distance)
    const distanceFactor = Math.exp(-distance / (protocol.maxDistance * 0.5));
    const effectiveRate = protocol.keyRate * distanceFactor;
    const keyLength = Math.floor(effectiveRate);
    const errorRate = protocol.errorTolerance * (1 + distance / protocol.maxDistance);

    const result: KeyExchangeResult = {
      success: errorRate < protocol.errorTolerance * 2,
      protocolId,
      keyLength,
      errorRate,
      securityParameter: protocol.securityLevel,
      time: keyLength / effectiveRate,
      hash: ''
    };
    result.hash = HashVerifier.hash(JSON.stringify({ ...result, hash: '' }));

    this.logger.proof('Key exchange complete', {
      protocolId,
      distance,
      keyLength,
      errorRate,
      hash: result.hash
    });

    return result;
  }

  private createFailedResult(reason: string): KeyExchangeResult {
    const result: KeyExchangeResult = {
      success: false,
      protocolId: '',
      keyLength: 0,
      errorRate: 1,
      securityParameter: 0,
      time: 0,
      hash: ''
    };
    result.hash = HashVerifier.hash(JSON.stringify({ ...result, hash: '' }));
    return result;
  }

  /**
   * Generate random numbers
   */
  generateRandom(rngId: string, bits: number): number[] | null {
    const rng = this.rngs.get(rngId);
    if (!rng) return null;

    // Simulate random number generation
    const bytes = Math.ceil(bits / 8);
    return Array(bytes).fill(0).map(() => Math.floor(Math.random() * 256));
  }

  /**
   * Get all QKD protocols
   */
  getAllQKDProtocols(): QuantumKeyDistribution[] {
    return Array.from(this.qkdProtocols.values());
  }

  /**
   * Get all RNGs
   */
  getAllRNGs(): QuantumRNG[] {
    return Array.from(this.rngs.values());
  }

  /**
   * Get all safe protocols
   */
  getAllSafeProtocols(): QuantumSafeProtocol[] {
    return Array.from(this.safeProtocols.values());
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      qkdCount: this.qkdProtocols.size,
      rngCount: this.rngs.size,
      safeCount: this.safeProtocols.size
    }));
  }
}

/**
 * Factory for creating QuantumCrypto
 */
export class QuantumCryptoFactory {
  static createDefault(): QuantumCrypto {
    return new QuantumCrypto();
  }
}
