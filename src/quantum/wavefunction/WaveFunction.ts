/**
 * WaveFunction.ts - PRD-02 Phase 2.1
 * Module ID: M02.01
 * 
 * Implements quantum wave function representation, probability density
 * calculations, and normalization verification with hash verification.
 * 
 * Dependencies:
 * - Logger (M01.01)
 * - HashVerifier (M01.02)
 * - BigNumber (M01.03)
 * - Complex (M01.04)
 * - Matrix (M01.05)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';
import { BigNumber } from '../../core/math/BigNumber';
import { Complex } from '../../core/math/Complex';
import { Matrix, Vector } from '../../core/math/Matrix';

// ============================================================================
// INTERFACES
// ============================================================================

export interface WaveFunctionConfig {
  dimensions: number;
  gridPoints?: number;
  normalizationTolerance?: number;
  enableHashVerification?: boolean;
}

export interface ProbabilityDensity {
  position: number[];
  density: number;
  hash: string;
}

export interface NormalizationResult {
  normalized: boolean;
  norm: number;
  tolerance: number;
  hash: string;
}

export interface InnerProductResult {
  value: Complex;
  hash: string;
}

export interface ExpectationValue {
  observable: string;
  value: Complex;
  uncertainty: number;
  hash: string;
}

export interface WaveFunctionState {
  id: string;
  dimensions: number;
  gridPoints: number;
  amplitudes: Complex[];
  isNormalized: boolean;
  norm: number;
  hash: string;
  timestamp: Date;
}

// ============================================================================
// WAVE FUNCTION CLASS
// ============================================================================

/**
 * WaveFunction represents a quantum mechanical wave function.
 * Supports arbitrary dimensions and provides probability calculations.
 */
export class WaveFunction {
  private id: string;
  private dimensions: number;
  private gridPoints: number;
  private amplitudes: Complex[];
  private logger: Logger;
  private hashChain: HashChain;
  private normalizationTolerance: number;
  private enableHashVerification: boolean;

  /**
   * Create a new WaveFunction
   * @param amplitudes - Array of complex amplitudes or number of grid points
   * @param config - Configuration options
   */
  constructor(amplitudes: Complex[] | number, config: Partial<WaveFunctionConfig> = {}) {
    this.id = `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.dimensions = config.dimensions || 1;
    this.normalizationTolerance = config.normalizationTolerance || 1e-10;
    this.enableHashVerification = config.enableHashVerification !== false;

    // Initialize logger with console disabled for tests
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`wavefunction-${this.id}`);

    if (typeof amplitudes === 'number') {
      // Create zero wave function with specified number of points
      this.gridPoints = amplitudes;
      this.amplitudes = new Array(amplitudes).fill(null).map(() => Complex.zero());
    } else {
      // Use provided amplitudes
      this.amplitudes = [...amplitudes];
      this.gridPoints = amplitudes.length;
    }

    // Log creation
    this.logger.info('WaveFunction created', {
      id: this.id,
      dimensions: this.dimensions,
      gridPoints: this.gridPoints
    });

    if (this.enableHashVerification) {
      this.hashChain.addRecord(
        ProofType.COMPUTATION,
        JSON.stringify({ dimensions: this.dimensions, gridPoints: this.gridPoints }),
        this.getStateHash()
      );
    }
  }

  // ============================================================================
  // BASIC PROPERTIES
  // ============================================================================

  getId(): string {
    return this.id;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getGridPoints(): number {
    return this.gridPoints;
  }

  getAmplitudes(): Complex[] {
    return [...this.amplitudes];
  }

  getAmplitude(index: number): Complex {
    if (index < 0 || index >= this.gridPoints) {
      throw new Error(`Index ${index} out of bounds [0, ${this.gridPoints - 1}]`);
    }
    return this.amplitudes[index];
  }

  setAmplitude(index: number, value: Complex): void {
    if (index < 0 || index >= this.gridPoints) {
      throw new Error(`Index ${index} out of bounds [0, ${this.gridPoints - 1}]`);
    }
    this.amplitudes[index] = value;

    if (this.enableHashVerification) {
      this.hashChain.addRecord(
        ProofType.COMPUTATION,
        `setAmplitude(${index})`,
        this.getStateHash()
      );
    }
  }

  // ============================================================================
  // NORMALIZATION
  // ============================================================================

  /**
   * Calculate the norm (total probability) of the wave function
   */
  calculateNorm(): number {
    let normSquared = 0;
    for (const amp of this.amplitudes) {
      const magSquared = amp.magnitude().toNumber() ** 2;
      normSquared += magSquared;
    }
    return Math.sqrt(normSquared);
  }

  /**
   * Check if the wave function is normalized (norm = 1)
   */
  isNormalized(tolerance?: number): boolean {
    const tol = tolerance ?? this.normalizationTolerance;
    const norm = this.calculateNorm();
    return Math.abs(norm - 1) < tol;
  }

  /**
   * Normalize the wave function to have norm = 1
   */
  normalize(): NormalizationResult {
    const norm = this.calculateNorm();
    
    if (norm === 0) {
      throw new Error('Cannot normalize zero wave function');
    }

    // Divide all amplitudes by norm
    this.amplitudes = this.amplitudes.map(amp => 
      amp.divide(new Complex(norm, 0))
    );

    const newNorm = this.calculateNorm();
    const normalized = Math.abs(newNorm - 1) < this.normalizationTolerance;

    const result: NormalizationResult = {
      normalized,
      norm: newNorm,
      tolerance: this.normalizationTolerance,
      hash: HashVerifier.hash(`normalize:${norm}:${newNorm}`)
    };

    if (this.enableHashVerification) {
      this.hashChain.addRecord(
        ProofType.COMPUTATION,
        `normalize(${norm})`,
        result.hash
      );
    }

    this.logger.proof('Wave function normalized', { originalNorm: norm, newNorm });

    return result;
  }

  /**
   * Verify normalization with hash
   */
  verifyNormalization(): NormalizationResult {
    const norm = this.calculateNorm();
    const normalized = Math.abs(norm - 1) < this.normalizationTolerance;

    return {
      normalized,
      norm,
      tolerance: this.normalizationTolerance,
      hash: HashVerifier.hash(`verify:${norm}:${normalized}`)
    };
  }

  // ============================================================================
  // PROBABILITY CALCULATIONS
  // ============================================================================

  /**
   * Calculate probability density at a specific point
   */
  probabilityDensity(index: number): ProbabilityDensity {
    if (index < 0 || index >= this.gridPoints) {
      throw new Error(`Index ${index} out of bounds`);
    }

    const amplitude = this.amplitudes[index];
    const density = amplitude.magnitude().toNumber() ** 2;
    const position = this.indexToPosition(index);

    const result: ProbabilityDensity = {
      position,
      density,
      hash: HashVerifier.hash(`density:${index}:${density}`)
    };

    return result;
  }

  /**
   * Calculate probability of finding particle in a range [start, end]
   */
  probabilityInRange(start: number, end: number): { probability: number; hash: string } {
    if (start < 0 || end >= this.gridPoints || start > end) {
      throw new Error(`Invalid range [${start}, ${end}]`);
    }

    let probability = 0;
    for (let i = start; i <= end; i++) {
      const magSquared = this.amplitudes[i].magnitude().toNumber() ** 2;
      probability += magSquared;
    }

    return {
      probability,
      hash: HashVerifier.hash(`prob:${start}:${end}:${probability}`)
    };
  }

  /**
   * Get all probability densities as array
   */
  getAllProbabilityDensities(): number[] {
    return this.amplitudes.map(amp => amp.magnitude().toNumber() ** 2);
  }

  /**
   * Find most probable position (maximum probability density)
   */
  mostProbablePosition(): { index: number; density: number; position: number[] } {
    let maxDensity = 0;
    let maxIndex = 0;

    for (let i = 0; i < this.gridPoints; i++) {
      const density = this.amplitudes[i].magnitude().toNumber() ** 2;
      if (density > maxDensity) {
        maxDensity = density;
        maxIndex = i;
      }
    }

    return {
      index: maxIndex,
      density: maxDensity,
      position: this.indexToPosition(maxIndex)
    };
  }

  // ============================================================================
  // INNER PRODUCT AND OVERLAP
  // ============================================================================

  /**
   * Calculate inner product <this|other> = ∫ψ*(x)φ(x)dx
   */
  innerProduct(other: WaveFunction): InnerProductResult {
    if (this.gridPoints !== other.gridPoints) {
      throw new Error('Wave functions must have same number of grid points');
    }

    let result = Complex.zero();
    for (let i = 0; i < this.gridPoints; i++) {
      // <ψ|φ> = ψ* · φ
      const conjugate = this.amplitudes[i].conjugate();
      const product = conjugate.multiply(other.amplitudes[i]);
      result = result.add(product);
    }

    return {
      value: result,
      hash: HashVerifier.hash(`inner:${result.toString()}`)
    };
  }

  /**
   * Calculate overlap probability |<this|other>|²
   */
  overlap(other: WaveFunction): { overlap: number; hash: string } {
    const inner = this.innerProduct(other);
    const overlapValue = inner.value.magnitude().toNumber() ** 2;

    return {
      overlap: overlapValue,
      hash: HashVerifier.hash(`overlap:${overlapValue}`)
    };
  }

  /**
   * Check orthogonality with another wave function
   */
  isOrthogonal(other: WaveFunction, tolerance: number = 1e-10): boolean {
    const inner = this.innerProduct(other);
    const magnitude = inner.value.magnitude().toNumber();
    return magnitude < tolerance;
  }

  // ============================================================================
  // WAVE FUNCTION OPERATIONS
  // ============================================================================

  /**
   * Add two wave functions
   */
  add(other: WaveFunction): WaveFunction {
    if (this.gridPoints !== other.gridPoints) {
      throw new Error('Wave functions must have same number of grid points');
    }

    const newAmplitudes = this.amplitudes.map((amp, i) => 
      amp.add(other.amplitudes[i])
    );

    const result = new WaveFunction(newAmplitudes, {
      dimensions: this.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });

    if (this.enableHashVerification) {
      this.hashChain.addRecord(
        ProofType.COMPUTATION,
        `add(${other.id})`,
        result.getStateHash()
      );
    }

    return result;
  }

  /**
   * Subtract two wave functions
   */
  subtract(other: WaveFunction): WaveFunction {
    if (this.gridPoints !== other.gridPoints) {
      throw new Error('Wave functions must have same number of grid points');
    }

    const newAmplitudes = this.amplitudes.map((amp, i) => 
      amp.subtract(other.amplitudes[i])
    );

    return new WaveFunction(newAmplitudes, {
      dimensions: this.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });
  }

  /**
   * Scale wave function by a complex number
   */
  scale(factor: Complex | number): WaveFunction {
    const complexFactor = typeof factor === 'number' ? new Complex(factor, 0) : factor;
    
    const newAmplitudes = this.amplitudes.map(amp => 
      amp.multiply(complexFactor)
    );

    return new WaveFunction(newAmplitudes, {
      dimensions: this.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });
  }

  /**
   * Create complex conjugate of wave function
   */
  conjugate(): WaveFunction {
    const newAmplitudes = this.amplitudes.map(amp => amp.conjugate());

    return new WaveFunction(newAmplitudes, {
      dimensions: this.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });
  }

  /**
   * Apply a phase factor e^(iθ) to entire wave function
   */
  applyPhase(theta: number): WaveFunction {
    const phaseFactor = Complex.fromPolar(1, theta);
    return this.scale(phaseFactor);
  }

  // ============================================================================
  // TENSOR PRODUCT (for multi-particle systems)
  // ============================================================================

  /**
   * Compute tensor product |ψ⟩ ⊗ |φ⟩
   */
  tensorProduct(other: WaveFunction): WaveFunction {
    const newSize = this.gridPoints * other.gridPoints;
    const newAmplitudes: Complex[] = [];

    for (let i = 0; i < this.gridPoints; i++) {
      for (let j = 0; j < other.gridPoints; j++) {
        newAmplitudes.push(this.amplitudes[i].multiply(other.amplitudes[j]));
      }
    }

    return new WaveFunction(newAmplitudes, {
      dimensions: this.dimensions + other.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });
  }

  // ============================================================================
  // POSITION/MOMENTUM REPRESENTATION
  // ============================================================================

  /**
   * Convert grid index to physical position
   */
  indexToPosition(index: number): number[] {
    // Simple 1D mapping, can be extended for multi-dimensional
    if (this.dimensions === 1) {
      return [index / (this.gridPoints - 1)]; // Normalized to [0, 1]
    }
    
    // For multi-dimensional, use row-major order
    const positions: number[] = [];
    let remaining = index;
    const pointsPerDim = Math.round(Math.pow(this.gridPoints, 1 / this.dimensions));
    
    for (let d = this.dimensions - 1; d >= 0; d--) {
      positions.unshift(remaining % pointsPerDim);
      remaining = Math.floor(remaining / pointsPerDim);
    }
    
    return positions;
  }

  /**
   * Convert physical position to grid index
   */
  positionToIndex(position: number[]): number {
    if (position.length !== this.dimensions) {
      throw new Error(`Position must have ${this.dimensions} dimensions`);
    }

    if (this.dimensions === 1) {
      return Math.round(position[0] * (this.gridPoints - 1));
    }

    const pointsPerDim = Math.round(Math.pow(this.gridPoints, 1 / this.dimensions));
    let index = 0;
    for (let d = 0; d < this.dimensions; d++) {
      index = index * pointsPerDim + Math.round(position[d]);
    }
    return index;
  }

  // ============================================================================
  // FOURIER TRANSFORM (Position ↔ Momentum)
  // ============================================================================

  /**
   * Compute discrete Fourier transform to get momentum representation
   */
  toMomentumSpace(): WaveFunction {
    const n = this.gridPoints;
    const momentumAmplitudes: Complex[] = new Array(n);

    // DFT: φ(k) = (1/√N) Σ ψ(x) e^(-2πikx/N)
    const normFactor = 1 / Math.sqrt(n);

    for (let k = 0; k < n; k++) {
      let sum = Complex.zero();
      for (let x = 0; x < n; x++) {
        const angle = -2 * Math.PI * k * x / n;
        const expFactor = Complex.fromPolar(1, angle);
        sum = sum.add(this.amplitudes[x].multiply(expFactor));
      }
      momentumAmplitudes[k] = sum.multiply(normFactor);
    }

    return new WaveFunction(momentumAmplitudes, {
      dimensions: this.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });
  }

  /**
   * Compute inverse Fourier transform to get position representation
   */
  toPositionSpace(): WaveFunction {
    const n = this.gridPoints;
    const positionAmplitudes: Complex[] = new Array(n);

    // Inverse DFT: ψ(x) = (1/√N) Σ φ(k) e^(2πikx/N)
    const normFactor = 1 / Math.sqrt(n);

    for (let x = 0; x < n; x++) {
      let sum = Complex.zero();
      for (let k = 0; k < n; k++) {
        const angle = 2 * Math.PI * k * x / n;
        const expFactor = Complex.fromPolar(1, angle);
        sum = sum.add(this.amplitudes[k].multiply(expFactor));
      }
      positionAmplitudes[x] = sum.multiply(normFactor);
    }

    return new WaveFunction(positionAmplitudes, {
      dimensions: this.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });
  }

  // ============================================================================
  // STATE HASH AND VERIFICATION
  // ============================================================================

  /**
   * Generate hash of current wave function state
   */
  getStateHash(): string {
    const stateString = this.amplitudes
      .map(amp => `${amp.real.toString()}:${amp.imag.toString()}`)
      .join('|');
    return HashVerifier.hash(`${this.id}:${stateString}`);
  }

  /**
   * Verify wave function state against expected hash
   */
  verifyState(expectedHash: string): boolean {
    return this.getStateHash() === expectedHash;
  }

  /**
   * Get proof chain for this wave function
   */
  getProofChain(): HashChain {
    return this.hashChain;
  }

  /**
   * Verify proof chain integrity
   */
  verifyProofChain(): boolean {
    return this.hashChain.verify().valid;
  }

  // ============================================================================
  // EXPORT AND SERIALIZATION
  // ============================================================================

  /**
   * Export wave function state
   */
  toState(): WaveFunctionState {
    return {
      id: this.id,
      dimensions: this.dimensions,
      gridPoints: this.gridPoints,
      amplitudes: [...this.amplitudes],
      isNormalized: this.isNormalized(),
      norm: this.calculateNorm(),
      hash: this.getStateHash(),
      timestamp: new Date()
    };
  }

  /**
   * Export to JSON
   */
  toJson(): string {
    const state = this.toState();
    return JSON.stringify({
      ...state,
      amplitudes: state.amplitudes.map(a => ({
        real: a.real.toString(),
        imag: a.imag.toString()
      }))
    }, null, 2);
  }

  /**
   * Create wave function from JSON
   */
  static fromJson(json: string): WaveFunction {
    const data = JSON.parse(json);
    const amplitudes = data.amplitudes.map((a: any) => 
      new Complex(parseFloat(a.real), parseFloat(a.imag))
    );
    return new WaveFunction(amplitudes, {
      dimensions: data.dimensions
    });
  }

  /**
   * Create copy of wave function
   */
  clone(): WaveFunction {
    return new WaveFunction([...this.amplitudes], {
      dimensions: this.dimensions,
      normalizationTolerance: this.normalizationTolerance,
      enableHashVerification: this.enableHashVerification
    });
  }

  // ============================================================================
  // STRING REPRESENTATION
  // ============================================================================

  toString(): string {
    const norm = this.calculateNorm();
    return `WaveFunction(id=${this.id}, dim=${this.dimensions}, points=${this.gridPoints}, norm=${norm.toFixed(6)})`;
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // ============================================================================

  /**
   * Create a zero (vacuum) wave function
   */
  static zero(gridPoints: number, dimensions: number = 1): WaveFunction {
    return new WaveFunction(gridPoints, { dimensions });
  }

  /**
   * Create a normalized basis state |n⟩
   */
  static basisState(n: number, gridPoints: number, dimensions: number = 1): WaveFunction {
    if (n < 0 || n >= gridPoints) {
      throw new Error(`Basis state index ${n} out of range [0, ${gridPoints - 1}]`);
    }

    const amplitudes = new Array(gridPoints).fill(null).map(() => Complex.zero());
    amplitudes[n] = Complex.one();

    return new WaveFunction(amplitudes, { dimensions });
  }

  /**
   * Create a uniform superposition of all basis states
   */
  static uniformSuperposition(gridPoints: number, dimensions: number = 1): WaveFunction {
    const normFactor = 1 / Math.sqrt(gridPoints);
    const amplitudes = new Array(gridPoints).fill(null).map(() => 
      new Complex(normFactor, 0)
    );

    return new WaveFunction(amplitudes, { dimensions });
  }

  /**
   * Create a Gaussian wave packet
   */
  static gaussianWavePacket(
    gridPoints: number,
    center: number,
    width: number,
    momentum: number = 0,
    dimensions: number = 1
  ): WaveFunction {
    const amplitudes: Complex[] = [];
    let normSquared = 0;

    for (let i = 0; i < gridPoints; i++) {
      const x = i / (gridPoints - 1); // Normalized position [0, 1]
      
      // Gaussian envelope: exp(-(x-x0)²/(4σ²))
      const envelope = Math.exp(-Math.pow(x - center, 2) / (4 * width * width));
      
      // Plane wave phase: exp(ikx)
      const phase = 2 * Math.PI * momentum * x;
      
      const amplitude = Complex.fromPolar(envelope, phase);
      amplitudes.push(amplitude);
      normSquared += envelope * envelope;
    }

    // Normalize
    const norm = Math.sqrt(normSquared);
    const normalizedAmplitudes = amplitudes.map(a => a.multiply(1 / norm));

    return new WaveFunction(normalizedAmplitudes, { dimensions });
  }

  /**
   * Create a plane wave with momentum k
   */
  static planeWave(gridPoints: number, momentum: number, dimensions: number = 1): WaveFunction {
    const normFactor = 1 / Math.sqrt(gridPoints);
    const amplitudes: Complex[] = [];

    for (let i = 0; i < gridPoints; i++) {
      const x = i / (gridPoints - 1);
      const phase = 2 * Math.PI * momentum * x;
      amplitudes.push(Complex.fromPolar(normFactor, phase));
    }

    return new WaveFunction(amplitudes, { dimensions });
  }

  /**
   * Create wave function from superposition coefficients
   */
  static fromSuperposition(coefficients: Complex[], basisSize: number): WaveFunction {
    if (coefficients.length > basisSize) {
      throw new Error('More coefficients than basis states');
    }

    const amplitudes = new Array(basisSize).fill(null).map(() => Complex.zero());
    
    for (let i = 0; i < coefficients.length; i++) {
      amplitudes[i] = coefficients[i];
    }

    const wf = new WaveFunction(amplitudes, { dimensions: 1 });
    wf.normalize();
    return wf;
  }
}

// ============================================================================
// Note: All interfaces are already exported at their definitions
// ============================================================================
