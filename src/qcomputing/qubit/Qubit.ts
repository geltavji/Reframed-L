/**
 * Qlaws Ham - Qubit Simulation Module (M08.01)
 * 
 * Implements qubit simulation with Bloch sphere representation.
 * Supports single and multi-qubit states.
 * 
 * @module Qubit
 * @version 1.0.0
 * @dependencies Complex (M01.04), Matrix (M01.05), Logger (M01.01)
 */

import { Logger } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';
import { Matrix } from '../../core/math/Matrix';

// ============================================================================
// Interfaces & Types
// ============================================================================

/**
 * Qubit state amplitudes
 */
export interface QubitAmplitudes {
  alpha: Complex;  // |0⟩ amplitude
  beta: Complex;   // |1⟩ amplitude
}

/**
 * Bloch sphere coordinates
 */
export interface BlochCoordinates {
  theta: number;  // Polar angle [0, π]
  phi: number;    // Azimuthal angle [0, 2π]
  x: number;      // Bloch sphere x coordinate
  y: number;      // Bloch sphere y coordinate
  z: number;      // Bloch sphere z coordinate
}

/**
 * Measurement result
 */
export interface MeasurementResult {
  outcome: 0 | 1;
  probability: number;
  collapsedState: QubitState;
  hash: string;
}

/**
 * Multi-qubit measurement result
 */
export interface MultiQubitMeasurement {
  outcome: number;
  bitString: string;
  probability: number;
  hash: string;
}

/**
 * Qubit state configuration
 */
export interface QubitConfig {
  label?: string;
  id?: string;
}

// ============================================================================
// QubitState Class
// ============================================================================

/**
 * Represents a single qubit state
 */
export class QubitState {
  private alpha: Complex;
  private beta: Complex;
  private static logger: Logger | null = null;
  private static hashVerifier: HashVerifier = new HashVerifier();

  constructor(alpha: Complex, beta: Complex) {
    this.alpha = alpha;
    this.beta = beta;
    this.normalize();
  }

  /**
   * Set logger for QubitState operations
   */
  public static setLogger(logger: Logger): void {
    QubitState.logger = logger;
  }

  /**
   * Create |0⟩ state
   */
  public static zero(): QubitState {
    return new QubitState(Complex.one(), Complex.zero());
  }

  /**
   * Create |1⟩ state
   */
  public static one(): QubitState {
    return new QubitState(Complex.zero(), Complex.one());
  }

  /**
   * Create |+⟩ state (superposition)
   */
  public static plus(): QubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new QubitState(
      new Complex(sqrt2Inv, 0),
      new Complex(sqrt2Inv, 0)
    );
  }

  /**
   * Create |-⟩ state
   */
  public static minus(): QubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new QubitState(
      new Complex(sqrt2Inv, 0),
      new Complex(-sqrt2Inv, 0)
    );
  }

  /**
   * Create |i⟩ state
   */
  public static plusI(): QubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new QubitState(
      new Complex(sqrt2Inv, 0),
      new Complex(0, sqrt2Inv)
    );
  }

  /**
   * Create |-i⟩ state
   */
  public static minusI(): QubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new QubitState(
      new Complex(sqrt2Inv, 0),
      new Complex(0, -sqrt2Inv)
    );
  }

  /**
   * Create state from Bloch sphere angles
   */
  public static fromBloch(theta: number, phi: number): QubitState {
    const cosHalfTheta = Math.cos(theta / 2);
    const sinHalfTheta = Math.sin(theta / 2);
    
    return new QubitState(
      new Complex(cosHalfTheta, 0),
      new Complex(
        sinHalfTheta * Math.cos(phi),
        sinHalfTheta * Math.sin(phi)
      )
    );
  }

  /**
   * Create random state (uniformly distributed on Bloch sphere)
   */
  public static random(): QubitState {
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = 2 * Math.PI * Math.random();
    return QubitState.fromBloch(theta, phi);
  }

  /**
   * Get alpha amplitude
   */
  public getAlpha(): Complex {
    return this.alpha;
  }

  /**
   * Get beta amplitude
   */
  public getBeta(): Complex {
    return this.beta;
  }

  /**
   * Get amplitudes
   */
  public getAmplitudes(): QubitAmplitudes {
    return { alpha: this.alpha, beta: this.beta };
  }

  /**
   * Normalize the state
   */
  private normalize(): void {
    const norm = Math.sqrt(
      this.alpha.magnitude().toNumber() ** 2 +
      this.beta.magnitude().toNumber() ** 2
    );
    
    if (norm > 0) {
      this.alpha = this.alpha.scale(1 / norm);
      this.beta = this.beta.scale(1 / norm);
    }
  }

  /**
   * Check if normalized
   */
  public isNormalized(tolerance: number = 1e-10): boolean {
    const norm = Math.sqrt(
      this.alpha.magnitude().toNumber() ** 2 +
      this.beta.magnitude().toNumber() ** 2
    );
    return Math.abs(norm - 1) < tolerance;
  }

  /**
   * Get probability of measuring |0⟩
   */
  public probabilityZero(): number {
    return this.alpha.magnitude().toNumber() ** 2;
  }

  /**
   * Get probability of measuring |1⟩
   */
  public probabilityOne(): number {
    return this.beta.magnitude().toNumber() ** 2;
  }

  /**
   * Perform measurement (collapses state)
   */
  public measure(): MeasurementResult {
    const p0 = this.probabilityZero();
    const rand = Math.random();
    
    const outcome: 0 | 1 = rand < p0 ? 0 : 1;
    const probability = outcome === 0 ? p0 : (1 - p0);
    const collapsedState = outcome === 0 ? QubitState.zero() : QubitState.one();
    
    const hash = QubitState.hashVerifier.hash(
      `measure:${outcome}:${probability}:${Date.now()}`
    );
    
    return { outcome, probability, collapsedState, hash };
  }

  /**
   * Get Bloch sphere coordinates
   */
  public toBloch(): BlochCoordinates {
    // Calculate theta from |alpha|
    const alphaAbs = this.alpha.magnitude().toNumber();
    const theta = 2 * Math.acos(Math.min(1, alphaAbs));
    
    // Calculate phi from phase difference
    const alphaPhase = this.alpha.phase().toNumber();
    const betaPhase = this.beta.phase().toNumber();
    const phi = betaPhase - alphaPhase;
    
    // Bloch sphere Cartesian coordinates
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    
    return { theta, phi, x, y, z };
  }

  /**
   * Get state as column vector
   */
  public toVector(): Complex[] {
    return [this.alpha, this.beta];
  }

  /**
   * Get density matrix representation
   */
  public toDensityMatrix(): Complex[][] {
    return [
      [this.alpha.multiply(this.alpha.conjugate()), this.alpha.multiply(this.beta.conjugate())],
      [this.beta.multiply(this.alpha.conjugate()), this.beta.multiply(this.beta.conjugate())]
    ];
  }

  /**
   * Calculate fidelity with another state
   */
  public fidelity(other: QubitState): number {
    const overlap = this.alpha.multiply(other.alpha.conjugate())
      .add(this.beta.multiply(other.beta.conjugate()));
    return overlap.magnitude().toNumber() ** 2;
  }

  /**
   * Check if states are equal (up to global phase)
   */
  public equals(other: QubitState, tolerance: number = 1e-10): boolean {
    return Math.abs(this.fidelity(other) - 1) < tolerance;
  }

  /**
   * Clone this state
   */
  public clone(): QubitState {
    return new QubitState(
      new Complex(this.alpha.real, this.alpha.imag),
      new Complex(this.beta.real, this.beta.imag)
    );
  }

  /**
   * Generate hash for this state
   */
  public getHash(): string {
    return QubitState.hashVerifier.hash(
      `qubit:${this.alpha.toString()}:${this.beta.toString()}`
    );
  }

  /**
   * String representation
   */
  public toString(): string {
    const a = this.alpha.toString();
    const b = this.beta.toString();
    return `${a}|0⟩ + ${b}|1⟩`;
  }
}

// ============================================================================
// MultiQubitState Class
// ============================================================================

/**
 * Represents a multi-qubit quantum state
 */
export class MultiQubitState {
  private amplitudes: Complex[];
  private numQubits: number;
  private static logger: Logger | null = null;
  private static hashVerifier: HashVerifier = new HashVerifier();

  constructor(amplitudes: Complex[]) {
    // Validate that length is power of 2
    const numQubits = Math.log2(amplitudes.length);
    if (!Number.isInteger(numQubits)) {
      throw new Error('Number of amplitudes must be a power of 2');
    }
    
    this.numQubits = numQubits;
    this.amplitudes = [...amplitudes];
    this.normalize();
  }

  /**
   * Set logger for MultiQubitState operations
   */
  public static setLogger(logger: Logger): void {
    MultiQubitState.logger = logger;
  }

  /**
   * Create |00...0⟩ state with n qubits
   */
  public static zeros(numQubits: number): MultiQubitState {
    const size = 2 ** numQubits;
    const amplitudes = new Array(size).fill(Complex.zero());
    amplitudes[0] = Complex.one();
    return new MultiQubitState(amplitudes);
  }

  /**
   * Create state from tensor product of single qubits
   */
  public static tensorProduct(...states: QubitState[]): MultiQubitState {
    if (states.length === 0) {
      throw new Error('Need at least one qubit state');
    }
    
    let result = [states[0].getAlpha(), states[0].getBeta()];
    
    for (let i = 1; i < states.length; i++) {
      const state = states[i];
      const newResult: Complex[] = [];
      
      for (const a of result) {
        newResult.push(a.multiply(state.getAlpha()));
        newResult.push(a.multiply(state.getBeta()));
      }
      
      result = newResult;
    }
    
    return new MultiQubitState(result);
  }

  /**
   * Create Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2
   */
  public static bellPhiPlus(): MultiQubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new MultiQubitState([
      new Complex(sqrt2Inv, 0),  // |00⟩
      Complex.zero(),            // |01⟩
      Complex.zero(),            // |10⟩
      new Complex(sqrt2Inv, 0)   // |11⟩
    ]);
  }

  /**
   * Create Bell state |Φ-⟩ = (|00⟩ - |11⟩)/√2
   */
  public static bellPhiMinus(): MultiQubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new MultiQubitState([
      new Complex(sqrt2Inv, 0),   // |00⟩
      Complex.zero(),             // |01⟩
      Complex.zero(),             // |10⟩
      new Complex(-sqrt2Inv, 0)   // |11⟩
    ]);
  }

  /**
   * Create Bell state |Ψ+⟩ = (|01⟩ + |10⟩)/√2
   */
  public static bellPsiPlus(): MultiQubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new MultiQubitState([
      Complex.zero(),            // |00⟩
      new Complex(sqrt2Inv, 0),  // |01⟩
      new Complex(sqrt2Inv, 0),  // |10⟩
      Complex.zero()             // |11⟩
    ]);
  }

  /**
   * Create Bell state |Ψ-⟩ = (|01⟩ - |10⟩)/√2
   */
  public static bellPsiMinus(): MultiQubitState {
    const sqrt2Inv = 1 / Math.sqrt(2);
    return new MultiQubitState([
      Complex.zero(),             // |00⟩
      new Complex(sqrt2Inv, 0),   // |01⟩
      new Complex(-sqrt2Inv, 0),  // |10⟩
      Complex.zero()              // |11⟩
    ]);
  }

  /**
   * Create GHZ state (|00...0⟩ + |11...1⟩)/√2
   */
  public static ghz(numQubits: number): MultiQubitState {
    const size = 2 ** numQubits;
    const amplitudes = new Array(size).fill(Complex.zero());
    const sqrt2Inv = 1 / Math.sqrt(2);
    amplitudes[0] = new Complex(sqrt2Inv, 0);
    amplitudes[size - 1] = new Complex(sqrt2Inv, 0);
    return new MultiQubitState(amplitudes);
  }

  /**
   * Create W state (|100...0⟩ + |010...0⟩ + ... + |00...01⟩)/√n
   */
  public static w(numQubits: number): MultiQubitState {
    const size = 2 ** numQubits;
    const amplitudes = new Array(size).fill(Complex.zero());
    const sqrtNInv = 1 / Math.sqrt(numQubits);
    
    for (let i = 0; i < numQubits; i++) {
      const index = 2 ** (numQubits - 1 - i);
      amplitudes[index] = new Complex(sqrtNInv, 0);
    }
    
    return new MultiQubitState(amplitudes);
  }

  /**
   * Get number of qubits
   */
  public getNumQubits(): number {
    return this.numQubits;
  }

  /**
   * Get amplitude for basis state
   */
  public getAmplitude(index: number): Complex {
    if (index < 0 || index >= this.amplitudes.length) {
      throw new Error(`Index ${index} out of bounds`);
    }
    return this.amplitudes[index];
  }

  /**
   * Get all amplitudes
   */
  public getAmplitudes(): Complex[] {
    return [...this.amplitudes];
  }

  /**
   * Get probability of measuring a specific basis state
   */
  public probability(index: number): number {
    return this.amplitudes[index].magnitude().toNumber() ** 2;
  }

  /**
   * Get all probabilities
   */
  public probabilities(): number[] {
    return this.amplitudes.map(a => a.magnitude().toNumber() ** 2);
  }

  /**
   * Normalize the state
   */
  private normalize(): void {
    const norm = Math.sqrt(
      this.amplitudes.reduce((sum, a) => sum + a.magnitude().toNumber() ** 2, 0)
    );
    
    if (norm > 0) {
      this.amplitudes = this.amplitudes.map(a => a.scale(1 / norm));
    }
  }

  /**
   * Check if normalized
   */
  public isNormalized(tolerance: number = 1e-10): boolean {
    const norm = Math.sqrt(
      this.amplitudes.reduce((sum, a) => sum + a.magnitude().toNumber() ** 2, 0)
    );
    return Math.abs(norm - 1) < tolerance;
  }

  /**
   * Measure all qubits
   */
  public measure(): MultiQubitMeasurement {
    const probs = this.probabilities();
    const rand = Math.random();
    
    let cumProb = 0;
    let outcome = 0;
    
    for (let i = 0; i < probs.length; i++) {
      cumProb += probs[i];
      if (rand < cumProb) {
        outcome = i;
        break;
      }
    }
    
    const bitString = outcome.toString(2).padStart(this.numQubits, '0');
    const probability = probs[outcome];
    const hash = MultiQubitState.hashVerifier.hash(
      `measure:${outcome}:${bitString}:${probability}:${Date.now()}`
    );
    
    return { outcome, bitString, probability, hash };
  }

  /**
   * Measure a single qubit (partial measurement)
   */
  public measureQubit(qubitIndex: number): { outcome: 0 | 1; newState: MultiQubitState; probability: number } {
    if (qubitIndex < 0 || qubitIndex >= this.numQubits) {
      throw new Error(`Qubit index ${qubitIndex} out of bounds`);
    }
    
    // Calculate probabilities for 0 and 1
    let prob0 = 0;
    let prob1 = 0;
    
    for (let i = 0; i < this.amplitudes.length; i++) {
      const bit = (i >> (this.numQubits - 1 - qubitIndex)) & 1;
      const probI = this.amplitudes[i].magnitude().toNumber() ** 2;
      
      if (bit === 0) {
        prob0 += probI;
      } else {
        prob1 += probI;
      }
    }
    
    // Randomly select outcome
    const rand = Math.random();
    const outcome: 0 | 1 = rand < prob0 ? 0 : 1;
    const probability = outcome === 0 ? prob0 : prob1;
    
    // Create new collapsed state
    const newAmplitudes: Complex[] = [];
    const normFactor = Math.sqrt(probability);
    
    for (let i = 0; i < this.amplitudes.length; i++) {
      const bit = (i >> (this.numQubits - 1 - qubitIndex)) & 1;
      
      if (bit === outcome) {
        newAmplitudes.push(this.amplitudes[i].scale(1 / normFactor));
      } else {
        newAmplitudes.push(Complex.zero());
      }
    }
    
    return {
      outcome,
      newState: new MultiQubitState(newAmplitudes),
      probability
    };
  }

  /**
   * Calculate fidelity with another state
   */
  public fidelity(other: MultiQubitState): number {
    if (this.numQubits !== other.numQubits) {
      throw new Error('States must have same number of qubits');
    }
    
    let overlap = Complex.zero();
    for (let i = 0; i < this.amplitudes.length; i++) {
      overlap = overlap.add(
        this.amplitudes[i].conjugate().multiply(other.amplitudes[i])
      );
    }
    
    return overlap.magnitude().toNumber() ** 2;
  }

  /**
   * Get reduced density matrix for specified qubits
   */
  public reducedDensityMatrix(qubits: number[]): Complex[][] {
    const numKeptQubits = qubits.length;
    const reducedSize = 2 ** numKeptQubits;
    
    // Initialize reduced density matrix
    const rho: Complex[][] = Array(reducedSize).fill(null).map(() =>
      Array(reducedSize).fill(Complex.zero())
    );
    
    // Calculate traced-out qubits
    const tracedQubits = [];
    for (let i = 0; i < this.numQubits; i++) {
      if (!qubits.includes(i)) {
        tracedQubits.push(i);
      }
    }
    
    // Build reduced density matrix by tracing out
    for (let i = 0; i < this.amplitudes.length; i++) {
      for (let j = 0; j < this.amplitudes.length; j++) {
        // Check if traced qubits match
        let match = true;
        for (const q of tracedQubits) {
          const bitI = (i >> (this.numQubits - 1 - q)) & 1;
          const bitJ = (j >> (this.numQubits - 1 - q)) & 1;
          if (bitI !== bitJ) {
            match = false;
            break;
          }
        }
        
        if (match) {
          // Extract kept qubit indices
          let rowIdx = 0;
          let colIdx = 0;
          for (let k = 0; k < numKeptQubits; k++) {
            const q = qubits[k];
            const bitI = (i >> (this.numQubits - 1 - q)) & 1;
            const bitJ = (j >> (this.numQubits - 1 - q)) & 1;
            rowIdx |= bitI << (numKeptQubits - 1 - k);
            colIdx |= bitJ << (numKeptQubits - 1 - k);
          }
          
          rho[rowIdx][colIdx] = rho[rowIdx][colIdx].add(
            this.amplitudes[i].multiply(this.amplitudes[j].conjugate())
          );
        }
      }
    }
    
    return rho;
  }

  /**
   * Calculate von Neumann entropy for subsystem
   */
  public entanglementEntropy(subsystemQubits: number[]): number {
    const rho = this.reducedDensityMatrix(subsystemQubits);
    const size = rho.length;
    
    // Simple eigenvalue calculation for 2x2 case
    if (size === 2) {
      const a = rho[0][0].real.toNumber();
      const b = rho[0][1].magnitude().toNumber();
      const d = rho[1][1].real.toNumber();
      
      const trace = a + d;
      const det = a * d - b * b;
      const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det));
      
      const lambda1 = Math.max(0, (trace + disc) / 2);
      const lambda2 = Math.max(0, (trace - disc) / 2);
      
      let entropy = 0;
      if (lambda1 > 1e-10) {
        entropy -= lambda1 * Math.log2(lambda1);
      }
      if (lambda2 > 1e-10) {
        entropy -= lambda2 * Math.log2(lambda2);
      }
      
      return entropy;
    }
    
    // For larger systems, use numerical methods (simplified)
    // This would need proper eigenvalue decomposition
    return 0;
  }

  /**
   * Check if state is separable (product state)
   */
  public isSeparable(tolerance: number = 1e-6): boolean {
    if (this.numQubits === 1) return true;
    
    // Check entanglement entropy for each single qubit
    for (let i = 0; i < this.numQubits; i++) {
      const entropy = this.entanglementEntropy([i]);
      if (entropy > tolerance) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Clone this state
   */
  public clone(): MultiQubitState {
    return new MultiQubitState(
      this.amplitudes.map(a => new Complex(a.real, a.imag))
    );
  }

  /**
   * Generate hash for this state
   */
  public getHash(): string {
    const amplitudeStr = this.amplitudes.map(a => a.toString()).join(',');
    return MultiQubitState.hashVerifier.hash(`multiqubit:${this.numQubits}:${amplitudeStr}`);
  }

  /**
   * String representation
   */
  public toString(): string {
    const terms: string[] = [];
    
    for (let i = 0; i < this.amplitudes.length; i++) {
      const amp = this.amplitudes[i];
      if (amp.magnitude().toNumber() > 1e-10) {
        const basis = i.toString(2).padStart(this.numQubits, '0');
        terms.push(`${amp.toString()}|${basis}⟩`);
      }
    }
    
    return terms.length > 0 ? terms.join(' + ') : '0';
  }
}

// ============================================================================
// BlochSphere Class
// ============================================================================

/**
 * Bloch sphere representation and utilities
 */
export class BlochSphere {
  private static hashVerifier: HashVerifier = new HashVerifier();

  /**
   * Convert Bloch coordinates to qubit state
   */
  public static toState(theta: number, phi: number): QubitState {
    return QubitState.fromBloch(theta, phi);
  }

  /**
   * Convert qubit state to Bloch coordinates
   */
  public static fromState(state: QubitState): BlochCoordinates {
    return state.toBloch();
  }

  /**
   * Calculate distance between two points on Bloch sphere
   */
  public static distance(coords1: BlochCoordinates, coords2: BlochCoordinates): number {
    const dx = coords1.x - coords2.x;
    const dy = coords1.y - coords2.y;
    const dz = coords1.z - coords2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get standard basis states
   */
  public static basisStates(): Map<string, BlochCoordinates> {
    return new Map([
      ['|0⟩', { theta: 0, phi: 0, x: 0, y: 0, z: 1 }],
      ['|1⟩', { theta: Math.PI, phi: 0, x: 0, y: 0, z: -1 }],
      ['|+⟩', { theta: Math.PI / 2, phi: 0, x: 1, y: 0, z: 0 }],
      ['|-⟩', { theta: Math.PI / 2, phi: Math.PI, x: -1, y: 0, z: 0 }],
      ['|+i⟩', { theta: Math.PI / 2, phi: Math.PI / 2, x: 0, y: 1, z: 0 }],
      ['|-i⟩', { theta: Math.PI / 2, phi: -Math.PI / 2, x: 0, y: -1, z: 0 }]
    ]);
  }

  /**
   * Get hash for Bloch coordinates
   */
  public static getHash(coords: BlochCoordinates): string {
    return BlochSphere.hashVerifier.hash(
      `bloch:${coords.theta}:${coords.phi}:${coords.x}:${coords.y}:${coords.z}`
    );
  }
}

// ============================================================================
// Qubit Class (Main Interface)
// ============================================================================

/**
 * Main qubit class providing unified interface
 */
export class Qubit {
  private state: QubitState;
  private label: string;
  private id: string;
  private static logger: Logger | null = null;
  private static hashVerifier: HashVerifier = new HashVerifier();
  private static qubitCounter: number = 0;

  constructor(
    state: QubitState = QubitState.zero(),
    config: QubitConfig = {}
  ) {
    this.state = state;
    this.id = config.id || `q${Qubit.qubitCounter++}`;
    this.label = config.label || this.id;
  }

  /**
   * Set logger for Qubit operations
   */
  public static setLogger(logger: Logger): void {
    Qubit.logger = logger;
    QubitState.setLogger(logger);
    MultiQubitState.setLogger(logger);
  }

  /**
   * Reset qubit counter
   */
  public static resetCounter(): void {
    Qubit.qubitCounter = 0;
  }

  /**
   * Create qubit in |0⟩ state
   */
  public static zero(config?: QubitConfig): Qubit {
    return new Qubit(QubitState.zero(), config);
  }

  /**
   * Create qubit in |1⟩ state
   */
  public static one(config?: QubitConfig): Qubit {
    return new Qubit(QubitState.one(), config);
  }

  /**
   * Create qubit in |+⟩ state
   */
  public static plus(config?: QubitConfig): Qubit {
    return new Qubit(QubitState.plus(), config);
  }

  /**
   * Create qubit in |-⟩ state
   */
  public static minus(config?: QubitConfig): Qubit {
    return new Qubit(QubitState.minus(), config);
  }

  /**
   * Create qubit from Bloch sphere angles
   */
  public static fromBloch(theta: number, phi: number, config?: QubitConfig): Qubit {
    return new Qubit(QubitState.fromBloch(theta, phi), config);
  }

  /**
   * Create random qubit
   */
  public static random(config?: QubitConfig): Qubit {
    return new Qubit(QubitState.random(), config);
  }

  /**
   * Get qubit ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get qubit label
   */
  public getLabel(): string {
    return this.label;
  }

  /**
   * Set qubit label
   */
  public setLabel(label: string): void {
    this.label = label;
  }

  /**
   * Get current state
   */
  public getState(): QubitState {
    return this.state;
  }

  /**
   * Set state
   */
  public setState(state: QubitState): void {
    this.state = state;
  }

  /**
   * Get Bloch sphere coordinates
   */
  public toBloch(): BlochCoordinates {
    return this.state.toBloch();
  }

  /**
   * Measure qubit
   */
  public measure(): MeasurementResult {
    const result = this.state.measure();
    this.state = result.collapsedState;
    return result;
  }

  /**
   * Reset to |0⟩
   */
  public reset(): void {
    this.state = QubitState.zero();
  }

  /**
   * Clone this qubit
   */
  public clone(): Qubit {
    return new Qubit(this.state.clone(), {
      id: `${this.id}_clone`,
      label: `${this.label}_clone`
    });
  }

  /**
   * Get hash
   */
  public getHash(): string {
    return Qubit.hashVerifier.hash(
      `qubit:${this.id}:${this.state.getHash()}`
    );
  }

  /**
   * String representation
   */
  public toString(): string {
    return `${this.label}: ${this.state.toString()}`;
  }
}

// ============================================================================
// QubitRegister Class
// ============================================================================

/**
 * Register of multiple qubits
 */
export class QubitRegister {
  private qubits: Qubit[];
  private label: string;
  private static logger: Logger | null = null;
  private static hashVerifier: HashVerifier = new HashVerifier();

  constructor(size: number, label: string = 'qreg') {
    this.label = label;
    this.qubits = [];
    
    for (let i = 0; i < size; i++) {
      this.qubits.push(Qubit.zero({
        id: `${label}[${i}]`,
        label: `${label}[${i}]`
      }));
    }
  }

  /**
   * Set logger for QubitRegister operations
   */
  public static setLogger(logger: Logger): void {
    QubitRegister.logger = logger;
  }

  /**
   * Get register size
   */
  public size(): number {
    return this.qubits.length;
  }

  /**
   * Get qubit at index
   */
  public get(index: number): Qubit {
    if (index < 0 || index >= this.qubits.length) {
      throw new Error(`Index ${index} out of bounds`);
    }
    return this.qubits[index];
  }

  /**
   * Get all qubits
   */
  public getQubits(): Qubit[] {
    return [...this.qubits];
  }

  /**
   * Get combined state as MultiQubitState
   */
  public getCombinedState(): MultiQubitState {
    return MultiQubitState.tensorProduct(
      ...this.qubits.map(q => q.getState())
    );
  }

  /**
   * Measure all qubits
   */
  public measureAll(): MeasurementResult[] {
    return this.qubits.map(q => q.measure());
  }

  /**
   * Reset all qubits to |0⟩
   */
  public reset(): void {
    this.qubits.forEach(q => q.reset());
  }

  /**
   * Get label
   */
  public getLabel(): string {
    return this.label;
  }

  /**
   * Get hash
   */
  public getHash(): string {
    const qubitHashes = this.qubits.map(q => q.getHash()).join(',');
    return QubitRegister.hashVerifier.hash(`register:${this.label}:${qubitHashes}`);
  }

  /**
   * String representation
   */
  public toString(): string {
    return `${this.label}[${this.qubits.length}]: ${this.getCombinedState().toString()}`;
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory for creating qubit objects
 */
export class QubitFactory {
  /**
   * Create single qubit in computational basis
   */
  public static computational(value: 0 | 1): Qubit {
    return value === 0 ? Qubit.zero() : Qubit.one();
  }

  /**
   * Create Bell pair
   */
  public static bellPair(): [Qubit, Qubit, MultiQubitState] {
    const q1 = Qubit.zero();
    const q2 = Qubit.zero();
    const bellState = MultiQubitState.bellPhiPlus();
    return [q1, q2, bellState];
  }

  /**
   * Create GHZ state qubits
   */
  public static ghzQubits(n: number): { qubits: Qubit[], state: MultiQubitState } {
    const qubits = Array(n).fill(null).map((_, i) => 
      Qubit.zero({ id: `ghz_${i}`, label: `GHZ[${i}]` })
    );
    const state = MultiQubitState.ghz(n);
    return { qubits, state };
  }

  /**
   * Create W state qubits
   */
  public static wQubits(n: number): { qubits: Qubit[], state: MultiQubitState } {
    const qubits = Array(n).fill(null).map((_, i) => 
      Qubit.zero({ id: `w_${i}`, label: `W[${i}]` })
    );
    const state = MultiQubitState.w(n);
    return { qubits, state };
  }

  /**
   * Create qubit register initialized to |0...0⟩
   */
  public static register(size: number, label?: string): QubitRegister {
    return new QubitRegister(size, label);
  }
}
