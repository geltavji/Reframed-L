/**
 * QuantumState.ts - PRD-02 Phase 2.1
 * Module ID: M02.02
 * 
 * Implements quantum state representation including pure and mixed states,
 * density matrices, and state evolution tracking.
 * 
 * Dependencies:
 * - Logger (M01.01)
 * - HashVerifier (M01.02)
 * - BigNumber (M01.03)
 * - Complex (M01.04)
 * - Matrix (M01.05)
 * - WaveFunction (M02.01)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';
import { BigNumber } from '../../core/math/BigNumber';
import { Complex } from '../../core/math/Complex';
import { Matrix, Vector } from '../../core/math/Matrix';
import { WaveFunction } from '../wavefunction/WaveFunction';

// ============================================================================
// INTERFACES
// ============================================================================

export interface QuantumStateConfig {
  dimension: number;
  enableHashVerification?: boolean;
}

export interface StateVectorInfo {
  dimension: number;
  norm: number;
  isPure: boolean;
  hash: string;
}

export interface DensityMatrixInfo {
  dimension: number;
  trace: number;
  purity: number;
  isPure: boolean;
  eigenvalues: number[];
  vonNeumannEntropy: number;
  hash: string;
}

export interface EntanglementMeasure {
  entanglement: number;
  type: 'separable' | 'entangled' | 'maximally_entangled';
  hash: string;
}

export interface BlochVector {
  x: number;
  y: number;
  z: number;
  norm: number;
}

// ============================================================================
// STATE VECTOR CLASS
// ============================================================================

/**
 * StateVector represents a pure quantum state |ψ⟩ as a complex vector.
 */
export class StateVector {
  private components: Complex[];
  private dimension: number;
  private logger: Logger;
  private hashChain: HashChain;
  private enableHashVerification: boolean;

  /**
   * Create a state vector
   * @param components - Array of complex amplitudes or dimension for computational basis
   * @param basisIndex - Optional index for computational basis state
   */
  constructor(components: Complex[] | number, basisIndex?: number) {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`statevector-${Date.now()}`);
    this.enableHashVerification = true;

    if (typeof components === 'number') {
      // Create dimension-sized state vector
      this.dimension = components;
      this.components = new Array(components).fill(null).map(() => Complex.zero());
      
      // If basis index provided, set that component to 1
      if (basisIndex !== undefined && basisIndex >= 0 && basisIndex < components) {
        this.components[basisIndex] = Complex.one();
      }
    } else {
      this.dimension = components.length;
      this.components = [...components];
    }

    this.logger.info('StateVector created', {
      dimension: this.dimension,
      norm: this.norm()
    });
  }

  // ============================================================================
  // BASIC PROPERTIES
  // ============================================================================

  getDimension(): number {
    return this.dimension;
  }

  getComponents(): Complex[] {
    return [...this.components];
  }

  getComponent(index: number): Complex {
    if (index < 0 || index >= this.dimension) {
      throw new Error(`Index ${index} out of bounds [0, ${this.dimension - 1}]`);
    }
    return this.components[index];
  }

  setComponent(index: number, value: Complex): void {
    if (index < 0 || index >= this.dimension) {
      throw new Error(`Index ${index} out of bounds [0, ${this.dimension - 1}]`);
    }
    this.components[index] = value;
  }

  // ============================================================================
  // NORM AND NORMALIZATION
  // ============================================================================

  /**
   * Calculate the norm ||ψ|| = √⟨ψ|ψ⟩
   */
  norm(): number {
    let sumSquared = 0;
    for (const c of this.components) {
      sumSquared += c.magnitude().toNumber() ** 2;
    }
    return Math.sqrt(sumSquared);
  }

  /**
   * Check if state is normalized
   */
  isNormalized(tolerance: number = 1e-10): boolean {
    return Math.abs(this.norm() - 1) < tolerance;
  }

  /**
   * Normalize the state vector
   */
  normalize(): StateVector {
    const n = this.norm();
    if (n === 0) {
      throw new Error('Cannot normalize zero state');
    }
    const newComponents = this.components.map(c => c.multiply(1 / n));
    return new StateVector(newComponents);
  }

  // ============================================================================
  // STATE OPERATIONS
  // ============================================================================

  /**
   * Add two state vectors
   */
  add(other: StateVector): StateVector {
    if (this.dimension !== other.dimension) {
      throw new Error('State vectors must have same dimension');
    }
    const newComponents = this.components.map((c, i) => c.add(other.components[i]));
    return new StateVector(newComponents);
  }

  /**
   * Subtract two state vectors
   */
  subtract(other: StateVector): StateVector {
    if (this.dimension !== other.dimension) {
      throw new Error('State vectors must have same dimension');
    }
    const newComponents = this.components.map((c, i) => c.subtract(other.components[i]));
    return new StateVector(newComponents);
  }

  /**
   * Scale state vector by complex number
   */
  scale(factor: Complex | number): StateVector {
    const f = typeof factor === 'number' ? new Complex(factor, 0) : factor;
    const newComponents = this.components.map(c => c.multiply(f));
    return new StateVector(newComponents);
  }

  /**
   * Inner product ⟨this|other⟩
   */
  innerProduct(other: StateVector): Complex {
    if (this.dimension !== other.dimension) {
      throw new Error('State vectors must have same dimension');
    }
    let result = Complex.zero();
    for (let i = 0; i < this.dimension; i++) {
      result = result.add(this.components[i].conjugate().multiply(other.components[i]));
    }
    return result;
  }

  /**
   * Overlap probability |⟨this|other⟩|²
   */
  overlap(other: StateVector): number {
    return this.innerProduct(other).magnitude().toNumber() ** 2;
  }

  /**
   * Check orthogonality
   */
  isOrthogonal(other: StateVector, tolerance: number = 1e-10): boolean {
    return this.innerProduct(other).magnitude().toNumber() < tolerance;
  }

  /**
   * Tensor product |ψ⟩ ⊗ |φ⟩
   */
  tensorProduct(other: StateVector): StateVector {
    const newDim = this.dimension * other.dimension;
    const newComponents: Complex[] = [];

    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < other.dimension; j++) {
        newComponents.push(this.components[i].multiply(other.components[j]));
      }
    }

    return new StateVector(newComponents);
  }

  /**
   * Create outer product |ψ⟩⟨φ|
   */
  outerProduct(other: StateVector): DensityMatrix {
    const elements: Complex[][] = [];
    
    for (let i = 0; i < this.dimension; i++) {
      elements[i] = [];
      for (let j = 0; j < other.dimension; j++) {
        elements[i][j] = this.components[i].multiply(other.components[j].conjugate());
      }
    }

    return DensityMatrix.fromArray(elements);
  }

  /**
   * Convert to density matrix ρ = |ψ⟩⟨ψ|
   */
  toDensityMatrix(): DensityMatrix {
    return this.outerProduct(this);
  }

  /**
   * Convert to wave function
   */
  toWaveFunction(): WaveFunction {
    return new WaveFunction(this.components, { dimensions: 1 });
  }

  // ============================================================================
  // BLOCH SPHERE (for qubit states)
  // ============================================================================

  /**
   * Get Bloch vector representation (only for 2D states)
   */
  toBlochVector(): BlochVector {
    if (this.dimension !== 2) {
      throw new Error('Bloch vector only defined for 2D states (qubits)');
    }

    // Ensure normalized
    const normalized = this.isNormalized() ? this : this.normalize();
    const alpha = normalized.components[0];
    const beta = normalized.components[1];

    // Bloch vector components
    // x = 2*Re(α*β̄) = ⟨σx⟩
    // y = 2*Im(α*β̄) = ⟨σy⟩
    // z = |α|² - |β|² = ⟨σz⟩

    const alphaBetaStar = alpha.multiply(beta.conjugate());
    const x = 2 * alphaBetaStar.real.toNumber();
    const y = 2 * alphaBetaStar.imag.toNumber();
    const z = alpha.magnitude().toNumber() ** 2 - beta.magnitude().toNumber() ** 2;

    return {
      x,
      y,
      z,
      norm: Math.sqrt(x * x + y * y + z * z)
    };
  }

  /**
   * Create state from Bloch angles
   */
  static fromBlochAngles(theta: number, phi: number): StateVector {
    // |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
    const alpha = new Complex(Math.cos(theta / 2), 0);
    const betaPhase = Complex.fromPolar(1, phi);
    const beta = betaPhase.multiply(Math.sin(theta / 2));

    return new StateVector([alpha, beta]);
  }

  // ============================================================================
  // PROBABILITY MEASUREMENTS
  // ============================================================================

  /**
   * Get probability of measuring basis state |n⟩
   */
  probability(n: number): number {
    if (n < 0 || n >= this.dimension) {
      throw new Error(`Index ${n} out of bounds`);
    }
    return this.components[n].magnitude().toNumber() ** 2;
  }

  /**
   * Get all probabilities
   */
  probabilities(): number[] {
    return this.components.map(c => c.magnitude().toNumber() ** 2);
  }

  /**
   * Perform projective measurement (collapse state)
   */
  measure(): { outcome: number; probability: number; postState: StateVector } {
    const probs = this.probabilities();
    const random = Math.random();
    
    let cumulative = 0;
    let outcome = 0;
    for (let i = 0; i < this.dimension; i++) {
      cumulative += probs[i];
      if (random < cumulative) {
        outcome = i;
        break;
      }
    }

    // Post-measurement state is basis state
    const postState = StateVector.computationalBasis(this.dimension, outcome);

    return {
      outcome,
      probability: probs[outcome],
      postState
    };
  }

  // ============================================================================
  // HASH AND VERIFICATION
  // ============================================================================

  getHash(): string {
    const stateStr = this.components.map(c => c.toString()).join('|');
    return HashVerifier.hash(stateStr);
  }

  getInfo(): StateVectorInfo {
    return {
      dimension: this.dimension,
      norm: this.norm(),
      isPure: true,
      hash: this.getHash()
    };
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toJson(): string {
    return JSON.stringify({
      dimension: this.dimension,
      components: this.components.map(c => ({
        real: c.real.toString(),
        imag: c.imag.toString()
      }))
    });
  }

  static fromJson(json: string): StateVector {
    const data = JSON.parse(json);
    const components = data.components.map((c: any) => 
      new Complex(parseFloat(c.real), parseFloat(c.imag))
    );
    return new StateVector(components);
  }

  clone(): StateVector {
    return new StateVector([...this.components]);
  }

  toString(): string {
    const parts = this.components
      .map((c, i) => `(${c.toString()})|${i}⟩`)
      .filter(s => !s.startsWith('(0'));
    return parts.join(' + ') || '0';
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // ============================================================================

  /**
   * Create computational basis state |n⟩
   */
  static computationalBasis(dimension: number, n: number): StateVector {
    return new StateVector(dimension, n);
  }

  /**
   * Create |0⟩ state
   */
  static ket0(dimension: number = 2): StateVector {
    return StateVector.computationalBasis(dimension, 0);
  }

  /**
   * Create |1⟩ state
   */
  static ket1(dimension: number = 2): StateVector {
    return StateVector.computationalBasis(dimension, 1);
  }

  /**
   * Create |+⟩ = (|0⟩ + |1⟩)/√2
   */
  static ketPlus(): StateVector {
    const amp = 1 / Math.sqrt(2);
    return new StateVector([new Complex(amp, 0), new Complex(amp, 0)]);
  }

  /**
   * Create |-⟩ = (|0⟩ - |1⟩)/√2
   */
  static ketMinus(): StateVector {
    const amp = 1 / Math.sqrt(2);
    return new StateVector([new Complex(amp, 0), new Complex(-amp, 0)]);
  }

  /**
   * Create |+i⟩ = (|0⟩ + i|1⟩)/√2
   */
  static ketPlusI(): StateVector {
    const amp = 1 / Math.sqrt(2);
    return new StateVector([new Complex(amp, 0), new Complex(0, amp)]);
  }

  /**
   * Create |-i⟩ = (|0⟩ - i|1⟩)/√2
   */
  static ketMinusI(): StateVector {
    const amp = 1 / Math.sqrt(2);
    return new StateVector([new Complex(amp, 0), new Complex(0, -amp)]);
  }

  /**
   * Create uniform superposition
   */
  static uniform(dimension: number): StateVector {
    const amp = 1 / Math.sqrt(dimension);
    const components = new Array(dimension).fill(null).map(() => new Complex(amp, 0));
    return new StateVector(components);
  }

  /**
   * Create random normalized state
   */
  static random(dimension: number): StateVector {
    const components = new Array(dimension).fill(null).map(() => 
      new Complex(Math.random() - 0.5, Math.random() - 0.5)
    );
    const sv = new StateVector(components);
    return sv.normalize();
  }
}

// ============================================================================
// DENSITY MATRIX CLASS
// ============================================================================

/**
 * DensityMatrix represents a general quantum state (pure or mixed).
 * ρ = Σᵢ pᵢ |ψᵢ⟩⟨ψᵢ|
 */
export class DensityMatrix {
  private matrix: Complex[][];
  private dimension: number;
  private logger: Logger;
  private hashChain: HashChain;

  constructor(dimension: number) {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`densitymatrix-${Date.now()}`);
    
    this.dimension = dimension;
    // Initialize as zero matrix
    this.matrix = [];
    for (let i = 0; i < dimension; i++) {
      this.matrix[i] = [];
      for (let j = 0; j < dimension; j++) {
        this.matrix[i][j] = Complex.zero();
      }
    }
  }

  // ============================================================================
  // BASIC PROPERTIES
  // ============================================================================

  getDimension(): number {
    return this.dimension;
  }

  getElement(i: number, j: number): Complex {
    if (i < 0 || i >= this.dimension || j < 0 || j >= this.dimension) {
      throw new Error(`Index (${i}, ${j}) out of bounds`);
    }
    return this.matrix[i][j];
  }

  setElement(i: number, j: number, value: Complex): void {
    if (i < 0 || i >= this.dimension || j < 0 || j >= this.dimension) {
      throw new Error(`Index (${i}, ${j}) out of bounds`);
    }
    this.matrix[i][j] = value;
  }

  // ============================================================================
  // DENSITY MATRIX PROPERTIES
  // ============================================================================

  /**
   * Calculate trace Tr(ρ) - should equal 1 for valid density matrix
   */
  trace(): Complex {
    let sum = Complex.zero();
    for (let i = 0; i < this.dimension; i++) {
      sum = sum.add(this.matrix[i][i]);
    }
    return sum;
  }

  /**
   * Check if trace equals 1
   */
  isTraceOne(tolerance: number = 1e-10): boolean {
    const tr = this.trace();
    return Math.abs(tr.real.toNumber() - 1) < tolerance && 
           Math.abs(tr.imag.toNumber()) < tolerance;
  }

  /**
   * Calculate purity Tr(ρ²) - equals 1 for pure states
   */
  purity(): number {
    const rhoSquared = this.multiply(this);
    return rhoSquared.trace().real.toNumber();
  }

  /**
   * Check if state is pure (purity = 1)
   */
  isPure(tolerance: number = 1e-10): boolean {
    return Math.abs(this.purity() - 1) < tolerance;
  }

  /**
   * Check if matrix is Hermitian (ρ = ρ†)
   */
  isHermitian(tolerance: number = 1e-10): boolean {
    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        const diff = this.matrix[i][j].subtract(this.matrix[j][i].conjugate());
        if (diff.magnitude().toNumber() > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if density matrix is valid (Hermitian, trace 1, positive semi-definite)
   */
  isValid(tolerance: number = 1e-10): boolean {
    return this.isHermitian(tolerance) && this.isTraceOne(tolerance);
    // Note: positive semi-definiteness check would require eigenvalue computation
  }

  // ============================================================================
  // MATRIX OPERATIONS
  // ============================================================================

  /**
   * Add two density matrices
   */
  add(other: DensityMatrix): DensityMatrix {
    if (this.dimension !== other.dimension) {
      throw new Error('Dimensions must match');
    }
    const result = new DensityMatrix(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        result.matrix[i][j] = this.matrix[i][j].add(other.matrix[i][j]);
      }
    }
    return result;
  }

  /**
   * Scale by a scalar
   */
  scale(factor: number): DensityMatrix {
    const result = new DensityMatrix(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        result.matrix[i][j] = this.matrix[i][j].multiply(factor);
      }
    }
    return result;
  }

  /**
   * Multiply two density matrices
   */
  multiply(other: DensityMatrix): DensityMatrix {
    if (this.dimension !== other.dimension) {
      throw new Error('Dimensions must match');
    }
    const result = new DensityMatrix(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < this.dimension; k++) {
          sum = sum.add(this.matrix[i][k].multiply(other.matrix[k][j]));
        }
        result.matrix[i][j] = sum;
      }
    }
    return result;
  }

  /**
   * Conjugate transpose (Hermitian adjoint)
   */
  dagger(): DensityMatrix {
    const result = new DensityMatrix(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        result.matrix[i][j] = this.matrix[j][i].conjugate();
      }
    }
    return result;
  }

  /**
   * Tensor product ρ ⊗ σ
   */
  tensorProduct(other: DensityMatrix): DensityMatrix {
    const newDim = this.dimension * other.dimension;
    const result = new DensityMatrix(newDim);

    for (let i1 = 0; i1 < this.dimension; i1++) {
      for (let j1 = 0; j1 < this.dimension; j1++) {
        for (let i2 = 0; i2 < other.dimension; i2++) {
          for (let j2 = 0; j2 < other.dimension; j2++) {
            const i = i1 * other.dimension + i2;
            const j = j1 * other.dimension + j2;
            result.matrix[i][j] = this.matrix[i1][j1].multiply(other.matrix[i2][j2]);
          }
        }
      }
    }

    return result;
  }

  /**
   * Partial trace over subsystem B (assuming ρ_AB with dim_A × dim_B)
   */
  partialTraceB(dimA: number, dimB: number): DensityMatrix {
    if (dimA * dimB !== this.dimension) {
      throw new Error('Dimensions must satisfy dimA × dimB = total dimension');
    }

    const result = new DensityMatrix(dimA);

    for (let i = 0; i < dimA; i++) {
      for (let j = 0; j < dimA; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < dimB; k++) {
          sum = sum.add(this.matrix[i * dimB + k][j * dimB + k]);
        }
        result.matrix[i][j] = sum;
      }
    }

    return result;
  }

  /**
   * Partial trace over subsystem A
   */
  partialTraceA(dimA: number, dimB: number): DensityMatrix {
    if (dimA * dimB !== this.dimension) {
      throw new Error('Dimensions must satisfy dimA × dimB = total dimension');
    }

    const result = new DensityMatrix(dimB);

    for (let i = 0; i < dimB; i++) {
      for (let j = 0; j < dimB; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < dimA; k++) {
          sum = sum.add(this.matrix[k * dimB + i][k * dimB + j]);
        }
        result.matrix[i][j] = sum;
      }
    }

    return result;
  }

  // ============================================================================
  // ENTROPY AND INFORMATION
  // ============================================================================

  /**
   * Compute eigenvalues (simplified for small matrices)
   * Note: Full implementation would use numerical methods
   */
  eigenvalues(): number[] {
    if (this.dimension === 2) {
      // For 2x2 Hermitian matrix, eigenvalues from characteristic polynomial
      const a = this.matrix[0][0].real.toNumber();
      const d = this.matrix[1][1].real.toNumber();
      const bc = this.matrix[0][1].magnitude().toNumber() ** 2;
      
      const trace = a + d;
      const det = a * d - bc;
      const disc = Math.sqrt(trace * trace - 4 * det);
      
      return [(trace + disc) / 2, (trace - disc) / 2];
    }

    // For larger matrices, return diagonal elements as approximation
    // (Real implementation would use QR algorithm)
    return Array.from({ length: this.dimension }, (_, i) => 
      this.matrix[i][i].real.toNumber()
    ).sort((a, b) => b - a);
  }

  /**
   * Calculate von Neumann entropy S = -Tr(ρ log ρ)
   */
  vonNeumannEntropy(): number {
    const eigenvalues = this.eigenvalues();
    let entropy = 0;

    for (const lambda of eigenvalues) {
      if (lambda > 1e-15) { // Avoid log(0)
        entropy -= lambda * Math.log2(lambda);
      }
    }

    return entropy;
  }

  /**
   * Calculate linear entropy S_L = 1 - Tr(ρ²)
   */
  linearEntropy(): number {
    return 1 - this.purity();
  }

  // ============================================================================
  // EXPECTATION VALUES
  // ============================================================================

  /**
   * Calculate expectation value ⟨O⟩ = Tr(ρO)
   */
  expectationValue(operator: DensityMatrix): Complex {
    if (this.dimension !== operator.dimension) {
      throw new Error('Dimensions must match');
    }

    const product = this.multiply(operator);
    return product.trace();
  }

  // ============================================================================
  // HASH AND VERIFICATION
  // ============================================================================

  getHash(): string {
    const elements = this.matrix.flat().map(c => c.toString()).join('|');
    return HashVerifier.hash(elements);
  }

  getInfo(): DensityMatrixInfo {
    return {
      dimension: this.dimension,
      trace: this.trace().real.toNumber(),
      purity: this.purity(),
      isPure: this.isPure(),
      eigenvalues: this.eigenvalues(),
      vonNeumannEntropy: this.vonNeumannEntropy(),
      hash: this.getHash()
    };
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toJson(): string {
    return JSON.stringify({
      dimension: this.dimension,
      matrix: this.matrix.map(row => 
        row.map(c => ({ real: c.real.toString(), imag: c.imag.toString() }))
      )
    });
  }

  static fromJson(json: string): DensityMatrix {
    const data = JSON.parse(json);
    const result = new DensityMatrix(data.dimension);
    for (let i = 0; i < data.dimension; i++) {
      for (let j = 0; j < data.dimension; j++) {
        result.matrix[i][j] = new Complex(
          parseFloat(data.matrix[i][j].real),
          parseFloat(data.matrix[i][j].imag)
        );
      }
    }
    return result;
  }

  clone(): DensityMatrix {
    const result = new DensityMatrix(this.dimension);
    for (let i = 0; i < this.dimension; i++) {
      for (let j = 0; j < this.dimension; j++) {
        result.matrix[i][j] = this.matrix[i][j];
      }
    }
    return result;
  }

  toMatrix(): Matrix {
    const data: number[][] = [];
    for (let i = 0; i < this.dimension; i++) {
      data[i] = [];
      for (let j = 0; j < this.dimension; j++) {
        // Take real part for Matrix compatibility
        data[i][j] = this.matrix[i][j].real.toNumber();
      }
    }
    return new Matrix(data);
  }

  toString(): string {
    let result = '';
    for (let i = 0; i < this.dimension; i++) {
      result += '| ';
      for (let j = 0; j < this.dimension; j++) {
        result += `${this.matrix[i][j].toString()} `;
      }
      result += '|\n';
    }
    return result;
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // ============================================================================

  /**
   * Create from array of complex numbers
   */
  static fromArray(elements: Complex[][]): DensityMatrix {
    const dim = elements.length;
    const result = new DensityMatrix(dim);
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        result.matrix[i][j] = elements[i][j];
      }
    }
    return result;
  }

  /**
   * Create from state vector |ψ⟩⟨ψ|
   */
  static fromStateVector(sv: StateVector): DensityMatrix {
    return sv.toDensityMatrix();
  }

  /**
   * Create mixed state from ensemble
   */
  static fromEnsemble(states: StateVector[], probabilities: number[]): DensityMatrix {
    if (states.length !== probabilities.length) {
      throw new Error('Number of states must match number of probabilities');
    }
    if (Math.abs(probabilities.reduce((a, b) => a + b, 0) - 1) > 1e-10) {
      throw new Error('Probabilities must sum to 1');
    }

    const dim = states[0].getDimension();
    const result = new DensityMatrix(dim);

    for (let k = 0; k < states.length; k++) {
      const dm = states[k].toDensityMatrix();
      const scaled = dm.scale(probabilities[k]);
      
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          result.matrix[i][j] = result.matrix[i][j].add(scaled.matrix[i][j]);
        }
      }
    }

    return result;
  }

  /**
   * Create maximally mixed state ρ = I/d
   */
  static maximallyMixed(dimension: number): DensityMatrix {
    const result = new DensityMatrix(dimension);
    const prob = 1 / dimension;
    for (let i = 0; i < dimension; i++) {
      result.matrix[i][i] = new Complex(prob, 0);
    }
    return result;
  }

  /**
   * Create |0⟩⟨0| state
   */
  static pureState0(dimension: number = 2): DensityMatrix {
    return StateVector.ket0(dimension).toDensityMatrix();
  }

  /**
   * Create |1⟩⟨1| state
   */
  static pureState1(dimension: number = 2): DensityMatrix {
    return StateVector.ket1(dimension).toDensityMatrix();
  }
}

// ============================================================================
// QUANTUM STATE (UNIFIED INTERFACE)
// ============================================================================

/**
 * QuantumState provides a unified interface for both pure and mixed states.
 */
export class QuantumState {
  private stateVector?: StateVector;
  private densityMatrix: DensityMatrix;
  private logger: Logger;
  private hashChain: HashChain;

  constructor(state: StateVector | DensityMatrix) {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`quantumstate-${Date.now()}`);

    if (state instanceof StateVector) {
      this.stateVector = state;
      this.densityMatrix = state.toDensityMatrix();
    } else {
      this.densityMatrix = state;
      // Cannot recover state vector from mixed state
    }

    this.logger.info('QuantumState created', {
      dimension: this.getDimension(),
      isPure: this.isPure()
    });
  }

  getDimension(): number {
    return this.densityMatrix.getDimension();
  }

  isPure(): boolean {
    return this.densityMatrix.isPure();
  }

  getStateVector(): StateVector | null {
    return this.stateVector || null;
  }

  getDensityMatrix(): DensityMatrix {
    return this.densityMatrix;
  }

  purity(): number {
    return this.densityMatrix.purity();
  }

  entropy(): number {
    return this.densityMatrix.vonNeumannEntropy();
  }

  expectationValue(operator: DensityMatrix): Complex {
    return this.densityMatrix.expectationValue(operator);
  }

  getHash(): string {
    return this.densityMatrix.getHash();
  }

  clone(): QuantumState {
    if (this.stateVector) {
      return new QuantumState(this.stateVector.clone());
    }
    return new QuantumState(this.densityMatrix.clone());
  }

  toString(): string {
    if (this.stateVector) {
      return `Pure: ${this.stateVector.toString()}`;
    }
    return `Mixed: purity=${this.purity().toFixed(4)}, entropy=${this.entropy().toFixed(4)}`;
  }

  // Static factories
  static fromStateVector(sv: StateVector): QuantumState {
    return new QuantumState(sv);
  }

  static fromDensityMatrix(dm: DensityMatrix): QuantumState {
    return new QuantumState(dm);
  }

  static pure(components: Complex[]): QuantumState {
    return new QuantumState(new StateVector(components).normalize());
  }

  static mixed(states: StateVector[], probabilities: number[]): QuantumState {
    return new QuantumState(DensityMatrix.fromEnsemble(states, probabilities));
  }

  static maximallyMixed(dimension: number): QuantumState {
    return new QuantumState(DensityMatrix.maximallyMixed(dimension));
  }
}

// ============================================================================
// Note: All interfaces are already exported at their definitions
// ============================================================================
