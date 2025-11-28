/**
 * Measurement.ts - PRD-02 Phase 2.4
 * Module ID: M02.07
 * 
 * Implements quantum measurement theory including projective measurements,
 * POVMs, Born rule probability calculations, and state collapse.
 * 
 * Dependencies:
 * - Logger (M01.01)
 * - HashVerifier (M01.02)
 * - BigNumber (M01.03)
 * - Complex (M01.04)
 * - Matrix (M01.05)
 * - WaveFunction (M02.01)
 * - QuantumState (M02.02)
 * - Operator (M02.03)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';
import { BigNumber } from '../../core/math/BigNumber';
import { Complex } from '../../core/math/Complex';
import { Vector, Matrix, Operator, Hermitian, EigenPair } from '../operators/Operator';

// Initialize logger for measurement module
Logger.resetInstance();
const logger = Logger.getInstance({
  minLevel: LogLevel.DEBUG,
  enableConsole: false,
  enableHashChain: true
});

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Measurement outcome interface
 */
export interface MeasurementOutcome {
  eigenvalue: number;
  probability: number;
  postMeasurementState: Vector;
  projector: Matrix;
  hash: string;
  timestamp: number;
}

/**
 * Full measurement result interface
 */
export interface MeasurementResult {
  measuredValue: number;
  probability: number;
  priorState: Vector;
  postState: Vector;
  collapsed: boolean;
  outcomeIndex: number;
  allPossibleOutcomes: MeasurementOutcome[];
  expectationValue: number;
  variance: number;
  uncertainty: number;
  observableHash: string;
  stateHash: string;
  resultHash: string;
  timestamp: number;
}

/**
 * POVM element interface
 */
export interface POVMElement {
  id: string;
  operator: Matrix;
  probability: number;
  hash: string;
}

/**
 * POVM measurement result
 */
export interface POVMMeasurementResult {
  outcomeIndex: number;
  probability: number;
  priorState: Vector;
  postState: Vector | null; // POVM doesn't always specify post-state
  allProbabilities: number[];
  hash: string;
  timestamp: number;
}

/**
 * Observable statistics
 */
export interface ObservableStatistics {
  observable: string;
  expectationValue: number;
  variance: number;
  standardDeviation: number;
  moments: number[]; // First few moments
  possibleValues: number[];
  probabilities: number[];
  hash: string;
}

/**
 * Repeated measurement result
 */
export interface RepeatedMeasurementResult {
  outcomes: number[];
  frequencies: Map<number, number>;
  sampleMean: number;
  sampleVariance: number;
  theoreticalMean: number;
  theoreticalVariance: number;
  chiSquared: number;
  pValue: number;
  hash: string;
}

// ============================================================================
// PROJECTOR CLASS
// ============================================================================

/**
 * Projector represents a projection operator |ψ⟩⟨ψ|
 * P² = P, P† = P
 */
export class Projector {
  private matrix: Matrix;
  private rank: number;
  private hash: string;
  private id: string;

  /**
   * Create a projector from a state vector
   */
  constructor(state: Vector) {
    this.id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Normalize the state
    const norm = state.norm();
    if (norm < 1e-15) {
      throw new Error('Cannot create projector from zero vector');
    }
    const normalizedState = state.scale(1 / norm);
    
    // Build outer product |ψ⟩⟨ψ|
    const dim = normalizedState.getDimension();
    const data: Complex[][] = [];
    
    for (let i = 0; i < dim; i++) {
      data[i] = [];
      for (let j = 0; j < dim; j++) {
        // |ψ⟩⟨ψ| = ψᵢψⱼ*
        data[i][j] = normalizedState.getComponent(i).multiply(
          normalizedState.getComponent(j).conjugate()
        );
      }
    }
    
    this.matrix = new Matrix(data);
    this.rank = 1; // Rank-1 projector from single state
    this.hash = this.computeHash();
    
    logger.debug(`Created projector with dimension ${dim}`, { id: this.id, hash: this.hash });
  }

  private computeHash(): string {
    const data = {
      id: this.id,
      rank: this.rank,
      matrix: this.matrix.getData().map(row =>
        row.map(c => ({ re: c.real.toNumber(), im: c.imag.toNumber() }))
      )
    };
    return HashVerifier.hashObject(data);
  }

  getId(): string {
    return this.id;
  }

  getHash(): string {
    return this.hash;
  }

  getMatrix(): Matrix {
    return this.matrix;
  }

  getRank(): number {
    return this.rank;
  }

  getDimension(): number {
    return this.matrix.getRows();
  }

  /**
   * Apply projector to a state vector
   */
  apply(state: Vector): Vector {
    if (state.getDimension() !== this.getDimension()) {
      throw new Error('Projector and state dimensions must match');
    }
    
    const dim = this.getDimension();
    const result: Complex[] = [];
    
    for (let i = 0; i < dim; i++) {
      let sum = Complex.zero();
      for (let j = 0; j < dim; j++) {
        sum = sum.add(this.matrix.get(i, j).multiply(state.getComponent(j)));
      }
      result.push(sum);
    }
    
    return new Vector(result);
  }

  /**
   * Calculate probability of measurement outcome: P = ⟨ψ|P|ψ⟩
   */
  probability(state: Vector): number {
    const projected = this.apply(state);
    const prob = state.innerProduct(projected).real.toNumber();
    return Math.max(0, Math.min(1, prob)); // Clamp to [0, 1]
  }

  /**
   * Check if this is a valid projector (P² = P)
   */
  isValid(): boolean {
    const squared = this.matrix.multiply(this.matrix);
    const dim = this.getDimension();
    
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const diff = squared.get(i, j).subtract(this.matrix.get(i, j)).magnitude().toNumber();
        if (diff > 1e-10) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Create projector onto computational basis state |n⟩
   */
  static computationalBasis(dimension: number, index: number): Projector {
    if (index < 0 || index >= dimension) {
      throw new Error(`Index ${index} out of bounds for dimension ${dimension}`);
    }
    
    const components: Complex[] = [];
    for (let i = 0; i < dimension; i++) {
      components.push(i === index ? Complex.one() : Complex.zero());
    }
    
    return new Projector(new Vector(components));
  }

  /**
   * Create projector onto superposition of basis states
   */
  static superposition(dimension: number, indices: number[], amplitudes: Complex[]): Projector {
    if (indices.length !== amplitudes.length) {
      throw new Error('Number of indices must match number of amplitudes');
    }
    
    const components: Complex[] = [];
    for (let i = 0; i < dimension; i++) {
      const idx = indices.indexOf(i);
      components.push(idx >= 0 ? amplitudes[idx] : Complex.zero());
    }
    
    return new Projector(new Vector(components));
  }
}

// ============================================================================
// PROJECTIVE MEASUREMENT CLASS
// ============================================================================

/**
 * ProjectiveMeasurement implements von Neumann measurement
 * 
 * For observable O with eigendecomposition O = Σ λᵢ Pᵢ,
 * measurement yields eigenvalue λᵢ with probability pᵢ = ⟨ψ|Pᵢ|ψ⟩
 * and collapses state to Pᵢ|ψ⟩/√pᵢ
 */
export class ProjectiveMeasurement {
  private observable: Hermitian;
  private eigenpairs: EigenPair[];
  private projectors: Projector[];
  private id: string;
  private hash: string;
  private hashChain: HashChain;

  constructor(observable: Hermitian) {
    this.id = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.hashChain = new HashChain(this.id);
    this.observable = observable;
    
    // Compute eigenpairs
    this.eigenpairs = this.computeEigenpairs();
    
    // Build projectors for each eigenspace
    this.projectors = this.eigenpairs.map(ep => new Projector(ep.eigenvector));
    
    this.hash = this.computeHash();
    
    logger.info(`Created projective measurement for observable`, {
      id: this.id,
      dimension: observable.getDimension(),
      eigenvalues: this.eigenpairs.map(ep => ep.eigenvalue.real.toNumber())
    });
  }

  private computeHash(): string {
    const data = {
      id: this.id,
      observableHash: this.observable.getHash(),
      eigenvalues: this.eigenpairs.map(ep => ep.eigenvalue.real.toNumber()),
      timestamp: Date.now()
    };
    return HashVerifier.hashObject(data);
  }

  /**
   * Compute eigenpairs using power iteration and deflation
   * For small dimensions, use direct diagonalization
   */
  private computeEigenpairs(): EigenPair[] {
    const dim = this.observable.getDimension();
    const pairs: EigenPair[] = [];
    
    // For 2x2, use analytical solution
    if (dim === 2) {
      return this.eigenpairs2x2();
    }
    
    // For larger dimensions, use iterative methods
    const matrix = this.observable.getMatrix();
    let workMatrix = matrix;
    
    for (let i = 0; i < dim; i++) {
      const { eigenvalue, eigenvector } = this.powerIteration(workMatrix, 100);
      
      pairs.push({
        eigenvalue: new Complex(eigenvalue, 0),
        eigenvector,
        degeneracy: 1,
        hash: HashVerifier.hashObject({ eigenvalue, index: i })
      });
      
      // Deflate matrix if not last iteration
      if (i < dim - 1) {
        workMatrix = this.deflate(workMatrix, eigenvalue, eigenvector);
      }
    }
    
    return pairs;
  }

  /**
   * Analytical eigenpairs for 2x2 Hermitian matrix
   */
  private eigenpairs2x2(): EigenPair[] {
    const m = this.observable.getMatrix();
    const a = m.get(0, 0).real.toNumber();
    const b = m.get(0, 1);
    const c = m.get(1, 1).real.toNumber();
    
    const trace = a + c;
    const det = a * c - b.magnitude().toNumber() ** 2;
    
    const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
    
    const lambda1 = trace / 2 + disc;
    const lambda2 = trace / 2 - disc;
    
    // Compute eigenvectors
    let v1: Vector, v2: Vector;
    
    if (Math.abs(b.magnitude().toNumber()) < 1e-15) {
      // Diagonal case
      v1 = new Vector([Complex.one(), Complex.zero()]);
      v2 = new Vector([Complex.zero(), Complex.one()]);
    } else {
      // General case
      const denom1 = Math.sqrt((lambda1 - a) ** 2 + b.magnitude().toNumber() ** 2);
      const denom2 = Math.sqrt((lambda2 - a) ** 2 + b.magnitude().toNumber() ** 2);
      
      v1 = new Vector([
        b.divide(denom1),
        new Complex(lambda1 - a, 0).divide(denom1)
      ]).normalize();
      
      v2 = new Vector([
        b.divide(denom2),
        new Complex(lambda2 - a, 0).divide(denom2)
      ]).normalize();
    }
    
    return [
      {
        eigenvalue: new Complex(lambda1, 0),
        eigenvector: v1,
        degeneracy: 1,
        hash: HashVerifier.hashObject({ eigenvalue: lambda1, index: 0 })
      },
      {
        eigenvalue: new Complex(lambda2, 0),
        eigenvector: v2,
        degeneracy: 1,
        hash: HashVerifier.hashObject({ eigenvalue: lambda2, index: 1 })
      }
    ];
  }

  /**
   * Power iteration to find dominant eigenvalue
   */
  private powerIteration(matrix: Matrix, maxIter: number): { eigenvalue: number; eigenvector: Vector } {
    const dim = matrix.getRows();
    
    // Start with random vector
    let v: Complex[] = [];
    for (let i = 0; i < dim; i++) {
      v.push(new Complex(Math.random() - 0.5, Math.random() - 0.5));
    }
    let vec = new Vector(v).normalize();
    
    let eigenvalue = 0;
    
    for (let iter = 0; iter < maxIter; iter++) {
      // Apply matrix
      const newVec: Complex[] = [];
      for (let i = 0; i < dim; i++) {
        let sum = Complex.zero();
        for (let j = 0; j < dim; j++) {
          sum = sum.add(matrix.get(i, j).multiply(vec.getComponent(j)));
        }
        newVec.push(sum);
      }
      
      const w = new Vector(newVec);
      
      // Rayleigh quotient
      eigenvalue = vec.innerProduct(w).real.toNumber();
      
      // Normalize
      vec = w.normalize();
    }
    
    return { eigenvalue, eigenvector: vec };
  }

  /**
   * Deflate matrix by removing eigenspace
   */
  private deflate(matrix: Matrix, eigenvalue: number, eigenvector: Vector): Matrix {
    const dim = matrix.getRows();
    const data: Complex[][] = [];
    
    for (let i = 0; i < dim; i++) {
      data[i] = [];
      for (let j = 0; j < dim; j++) {
        const outer = eigenvector.getComponent(i).multiply(
          eigenvector.getComponent(j).conjugate()
        );
        data[i][j] = matrix.get(i, j).subtract(outer.multiply(eigenvalue));
      }
    }
    
    return new Matrix(data);
  }

  getId(): string {
    return this.id;
  }

  getHash(): string {
    return this.hash;
  }

  getObservable(): Hermitian {
    return this.observable;
  }

  getEigenpairs(): EigenPair[] {
    return this.eigenpairs;
  }

  getProjectors(): Projector[] {
    return this.projectors;
  }

  /**
   * Calculate all possible measurement outcomes with probabilities
   */
  calculateOutcomes(state: Vector): MeasurementOutcome[] {
    const outcomes: MeasurementOutcome[] = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < this.eigenpairs.length; i++) {
      const eigenvalue = this.eigenpairs[i].eigenvalue.real.toNumber();
      const projector = this.projectors[i];
      
      // Born rule probability
      const probability = projector.probability(state);
      
      // Post-measurement state (normalized)
      let postState: Vector;
      if (probability > 1e-15) {
        postState = projector.apply(state);
        const norm = postState.norm();
        postState = postState.scale(1 / norm);
      } else {
        postState = state; // Keep original if probability is zero
      }
      
      outcomes.push({
        eigenvalue,
        probability,
        postMeasurementState: postState,
        projector: projector.getMatrix(),
        hash: HashVerifier.hashObject({ eigenvalue, probability, index: i }),
        timestamp
      });
    }
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ operation: 'calculate_outcomes', timestamp }),
      JSON.stringify({ outcomes: outcomes.length })
    );
    
    return outcomes;
  }

  /**
   * Perform a measurement (with random collapse)
   */
  measure(state: Vector): MeasurementResult {
    const timestamp = Date.now();
    const outcomes = this.calculateOutcomes(state);
    
    // Select outcome based on Born rule probabilities
    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;
    
    for (let i = 0; i < outcomes.length; i++) {
      cumulative += outcomes[i].probability;
      if (rand < cumulative) {
        selectedIndex = i;
        break;
      }
    }
    
    const selectedOutcome = outcomes[selectedIndex];
    
    // Calculate expectation value and variance
    const expectationValue = this.expectationValue(state);
    const variance = this.variance(state);
    
    const result: MeasurementResult = {
      measuredValue: selectedOutcome.eigenvalue,
      probability: selectedOutcome.probability,
      priorState: state,
      postState: selectedOutcome.postMeasurementState,
      collapsed: true,
      outcomeIndex: selectedIndex,
      allPossibleOutcomes: outcomes,
      expectationValue,
      variance,
      uncertainty: Math.sqrt(variance),
      observableHash: this.observable.getHash(),
      stateHash: HashVerifier.hashObject({
        components: state.toArray().map(c => ({ re: c.real.toNumber(), im: c.imag.toNumber() }))
      }),
      resultHash: '',
      timestamp
    };
    
    result.resultHash = HashVerifier.hashObject({
      measuredValue: result.measuredValue,
      probability: result.probability,
      outcomeIndex: result.outcomeIndex,
      timestamp
    });
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ operation: 'measure', timestamp }),
      JSON.stringify({ result: result.measuredValue, probability: result.probability })
    );
    
    logger.info(`Measurement performed`, {
      measuredValue: result.measuredValue,
      probability: result.probability,
      hash: result.resultHash
    });
    
    return result;
  }

  /**
   * Calculate expectation value ⟨O⟩ = ⟨ψ|O|ψ⟩
   */
  expectationValue(state: Vector): number {
    let sum = 0;
    for (let i = 0; i < this.eigenpairs.length; i++) {
      const eigenvalue = this.eigenpairs[i].eigenvalue.real.toNumber();
      const probability = this.projectors[i].probability(state);
      sum += eigenvalue * probability;
    }
    return sum;
  }

  /**
   * Calculate variance Δ²O = ⟨O²⟩ - ⟨O⟩²
   */
  variance(state: Vector): number {
    const mean = this.expectationValue(state);
    let meanSquare = 0;
    
    for (let i = 0; i < this.eigenpairs.length; i++) {
      const eigenvalue = this.eigenpairs[i].eigenvalue.real.toNumber();
      const probability = this.projectors[i].probability(state);
      meanSquare += eigenvalue * eigenvalue * probability;
    }
    
    return Math.max(0, meanSquare - mean * mean);
  }

  /**
   * Calculate standard deviation (uncertainty)
   */
  uncertainty(state: Vector): number {
    return Math.sqrt(this.variance(state));
  }

  /**
   * Get full observable statistics
   */
  getStatistics(state: Vector): ObservableStatistics {
    const outcomes = this.calculateOutcomes(state);
    const expectation = this.expectationValue(state);
    const var_ = this.variance(state);
    
    // Calculate first few moments
    const moments: number[] = [];
    for (let n = 1; n <= 4; n++) {
      let moment = 0;
      for (const outcome of outcomes) {
        moment += Math.pow(outcome.eigenvalue, n) * outcome.probability;
      }
      moments.push(moment);
    }
    
    return {
      observable: this.observable.getName(),
      expectationValue: expectation,
      variance: var_,
      standardDeviation: Math.sqrt(var_),
      moments,
      possibleValues: outcomes.map(o => o.eigenvalue),
      probabilities: outcomes.map(o => o.probability),
      hash: HashVerifier.hashObject({
        expectation,
        variance: var_,
        moments,
        timestamp: Date.now()
      })
    };
  }

  /**
   * Perform repeated measurements (ensemble)
   */
  measureRepeated(state: Vector, numMeasurements: number): RepeatedMeasurementResult {
    const outcomes: number[] = [];
    const frequencies = new Map<number, number>();
    
    // Perform measurements
    for (let i = 0; i < numMeasurements; i++) {
      const result = this.measure(state);
      outcomes.push(result.measuredValue);
      
      const count = frequencies.get(result.measuredValue) || 0;
      frequencies.set(result.measuredValue, count + 1);
    }
    
    // Calculate sample statistics
    const sampleMean = outcomes.reduce((a, b) => a + b, 0) / numMeasurements;
    const sampleVariance = outcomes.reduce((a, b) => a + (b - sampleMean) ** 2, 0) / (numMeasurements - 1);
    
    // Calculate theoretical statistics
    const theoreticalMean = this.expectationValue(state);
    const theoreticalVariance = this.variance(state);
    
    // Chi-squared test
    let chiSquared = 0;
    const possibleOutcomes = this.calculateOutcomes(state);
    for (const outcome of possibleOutcomes) {
      const expected = outcome.probability * numMeasurements;
      const observed = frequencies.get(outcome.eigenvalue) || 0;
      if (expected > 0) {
        chiSquared += (observed - expected) ** 2 / expected;
      }
    }
    
    // Approximate p-value (chi-squared distribution with k-1 degrees of freedom)
    const k = possibleOutcomes.length;
    const pValue = this.chiSquaredPValue(chiSquared, k - 1);
    
    return {
      outcomes,
      frequencies,
      sampleMean,
      sampleVariance,
      theoreticalMean,
      theoreticalVariance,
      chiSquared,
      pValue,
      hash: HashVerifier.hashObject({
        numMeasurements,
        sampleMean,
        chiSquared,
        timestamp: Date.now()
      })
    };
  }

  /**
   * Approximate chi-squared p-value using Wilson-Hilferty transformation
   */
  private chiSquaredPValue(x: number, k: number): number {
    if (k <= 0 || x < 0) return 1;
    
    // Wilson-Hilferty transformation
    const z = Math.pow(x / k, 1/3) - (1 - 2 / (9 * k));
    const sigma = Math.sqrt(2 / (9 * k));
    
    // Standard normal CDF approximation
    const t = z / sigma;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = t < 0 ? -1 : 1;
    const absT = Math.abs(t);
    const t2 = 1 / (1 + p * absT);
    const y = 1 - (((((a5 * t2 + a4) * t2) + a3) * t2 + a2) * t2 + a1) * t2 * Math.exp(-absT * absT / 2);
    
    return 1 - 0.5 * (1 + sign * y);
  }
}

// ============================================================================
// POVM CLASS
// ============================================================================

/**
 * POVM (Positive Operator-Valued Measure) implements generalized measurements
 * 
 * A POVM is a set of positive operators {Eᵢ} such that Σᵢ Eᵢ = I
 * Probability of outcome i is pᵢ = ⟨ψ|Eᵢ|ψ⟩
 */
export class POVM {
  private elements: POVMElement[];
  private id: string;
  private hash: string;
  private hashChain: HashChain;

  constructor(elements: Matrix[]) {
    this.id = `povm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.hashChain = new HashChain(this.id);
    
    if (elements.length === 0) {
      throw new Error('POVM must have at least one element');
    }
    
    // Verify dimensions match
    const dim = elements[0].getRows();
    for (const e of elements) {
      if (e.getRows() !== dim || e.getCols() !== dim) {
        throw new Error('All POVM elements must have the same dimensions');
      }
    }
    
    // Verify completeness (Σᵢ Eᵢ = I)
    const sum = this.sumElements(elements);
    if (!this.isIdentity(sum, dim)) {
      throw new Error('POVM elements must sum to identity');
    }
    
    // Verify positivity (⟨ψ|Eᵢ|ψ⟩ ≥ 0 for all |ψ⟩)
    // This is implied by eigenvalues being non-negative
    
    this.elements = elements.map((e, i) => ({
      id: `element_${i}`,
      operator: e,
      probability: 0,
      hash: HashVerifier.hashObject({
        index: i,
        trace: e.trace().real.toNumber()
      })
    }));
    
    this.hash = this.computeHash();
    
    logger.info(`Created POVM with ${elements.length} elements`, {
      id: this.id,
      dimension: dim
    });
  }

  private computeHash(): string {
    return HashVerifier.hashObject({
      id: this.id,
      numElements: this.elements.length,
      timestamp: Date.now()
    });
  }

  private sumElements(elements: Matrix[]): Matrix {
    let sum = elements[0];
    for (let i = 1; i < elements.length; i++) {
      sum = sum.add(elements[i]);
    }
    return sum;
  }

  private isIdentity(matrix: Matrix, dim: number): boolean {
    const tolerance = 1e-10;
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const expected = i === j ? 1 : 0;
        if (Math.abs(matrix.get(i, j).real.toNumber() - expected) > tolerance ||
            Math.abs(matrix.get(i, j).imag.toNumber()) > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  getId(): string {
    return this.id;
  }

  getHash(): string {
    return this.hash;
  }

  getElements(): POVMElement[] {
    return this.elements;
  }

  getNumOutcomes(): number {
    return this.elements.length;
  }

  getDimension(): number {
    return this.elements[0].operator.getRows();
  }

  /**
   * Calculate probability of each outcome
   */
  calculateProbabilities(state: Vector): number[] {
    const probabilities: number[] = [];
    
    for (const element of this.elements) {
      // pᵢ = ⟨ψ|Eᵢ|ψ⟩
      const eState = this.applyMatrix(element.operator, state);
      const prob = state.innerProduct(eState).real.toNumber();
      probabilities.push(Math.max(0, Math.min(1, prob)));
    }
    
    return probabilities;
  }

  private applyMatrix(matrix: Matrix, state: Vector): Vector {
    const dim = matrix.getRows();
    const result: Complex[] = [];
    
    for (let i = 0; i < dim; i++) {
      let sum = Complex.zero();
      for (let j = 0; j < dim; j++) {
        sum = sum.add(matrix.get(i, j).multiply(state.getComponent(j)));
      }
      result.push(sum);
    }
    
    return new Vector(result);
  }

  /**
   * Perform POVM measurement
   */
  measure(state: Vector): POVMMeasurementResult {
    const timestamp = Date.now();
    const probabilities = this.calculateProbabilities(state);
    
    // Select outcome
    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (rand < cumulative) {
        selectedIndex = i;
        break;
      }
    }
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ operation: 'povm_measure', timestamp }),
      JSON.stringify({ outcomeIndex: selectedIndex, probability: probabilities[selectedIndex] })
    );
    
    return {
      outcomeIndex: selectedIndex,
      probability: probabilities[selectedIndex],
      priorState: state,
      postState: null, // POVM doesn't specify post-measurement state in general
      allProbabilities: probabilities,
      hash: HashVerifier.hashObject({
        outcomeIndex: selectedIndex,
        probabilities,
        timestamp
      }),
      timestamp
    };
  }

  /**
   * Create a computational basis POVM
   */
  static computationalBasis(dimension: number): POVM {
    const elements: Matrix[] = [];
    
    for (let i = 0; i < dimension; i++) {
      const data: Complex[][] = [];
      for (let j = 0; j < dimension; j++) {
        data[j] = [];
        for (let k = 0; k < dimension; k++) {
          data[j][k] = (j === i && k === i) ? Complex.one() : Complex.zero();
        }
      }
      elements.push(new Matrix(data));
    }
    
    return new POVM(elements);
  }

  /**
   * Create a symmetric informationally complete POVM (SIC-POVM) for qubits
   */
  static sicPOVM2(): POVM {
    // SIC-POVM for a qubit consists of 4 elements
    // Based on tetrahedron vertices on Bloch sphere
    const sqrt3 = Math.sqrt(3);
    const sqrt2 = Math.sqrt(2);
    
    const vectors = [
      [1, 0],
      [1/sqrt3, sqrt2/sqrt3],
      [1/sqrt3, -1/(sqrt2*sqrt3)],
      [1/sqrt3, -1/(sqrt2*sqrt3)]
    ];
    
    // Construct POVM elements: Eᵢ = |φᵢ⟩⟨φᵢ|/2
    const elements: Matrix[] = [];
    
    for (let v = 0; v < 4; v++) {
      const theta = (v === 0) ? 0 : Math.acos(1/sqrt3);
      const phi = (v === 0) ? 0 : (v - 1) * 2 * Math.PI / 3;
      
      const alpha = Math.cos(theta/2);
      const beta = Math.sin(theta/2) * Math.cos(phi);
      const gamma = Math.sin(theta/2) * Math.sin(phi);
      
      const vec = new Vector([
        new Complex(alpha, 0),
        new Complex(beta, gamma)
      ]);
      
      const dim = 2;
      const data: Complex[][] = [];
      for (let i = 0; i < dim; i++) {
        data[i] = [];
        for (let j = 0; j < dim; j++) {
          data[i][j] = vec.getComponent(i).multiply(
            vec.getComponent(j).conjugate()
          ).multiply(0.5);
        }
      }
      elements.push(new Matrix(data));
    }
    
    return new POVM(elements);
  }
}

// ============================================================================
// MEASUREMENT FACTORY
// ============================================================================

/**
 * Factory for creating common measurements
 */
export class MeasurementFactory {
  /**
   * Create Z-basis (computational basis) measurement for qubits
   */
  static pauliZ(): ProjectiveMeasurement {
    const data: Complex[][] = [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(-1, 0)]
    ];
    return new ProjectiveMeasurement(new Hermitian(new Matrix(data), 'PauliZ'));
  }

  /**
   * Create X-basis measurement for qubits
   */
  static pauliX(): ProjectiveMeasurement {
    const data: Complex[][] = [
      [Complex.zero(), Complex.one()],
      [Complex.one(), Complex.zero()]
    ];
    return new ProjectiveMeasurement(new Hermitian(new Matrix(data), 'PauliX'));
  }

  /**
   * Create Y-basis measurement for qubits
   */
  static pauliY(): ProjectiveMeasurement {
    const data: Complex[][] = [
      [Complex.zero(), new Complex(0, -1)],
      [new Complex(0, 1), Complex.zero()]
    ];
    return new ProjectiveMeasurement(new Hermitian(new Matrix(data), 'PauliY'));
  }

  /**
   * Create computational basis measurement for n-dimensional system
   */
  static computationalBasis(dimension: number): ProjectiveMeasurement {
    // Identity observable measures computational basis
    const data: Complex[][] = [];
    for (let i = 0; i < dimension; i++) {
      data[i] = [];
      for (let j = 0; j < dimension; j++) {
        data[i][j] = (i === j) ? new Complex(i, 0) : Complex.zero();
      }
    }
    return new ProjectiveMeasurement(new Hermitian(new Matrix(data), 'Computational'));
  }

  /**
   * Create number operator measurement
   */
  static numberOperator(dimension: number): ProjectiveMeasurement {
    const data: Complex[][] = [];
    for (let i = 0; i < dimension; i++) {
      data[i] = [];
      for (let j = 0; j < dimension; j++) {
        data[i][j] = (i === j) ? new Complex(i, 0) : Complex.zero();
      }
    }
    return new ProjectiveMeasurement(new Hermitian(new Matrix(data), 'Number'));
  }

  /**
   * Create position-like measurement (discretized)
   */
  static position(dimension: number): ProjectiveMeasurement {
    const data: Complex[][] = [];
    const dx = 2.0 / (dimension - 1);
    
    for (let i = 0; i < dimension; i++) {
      data[i] = [];
      for (let j = 0; j < dimension; j++) {
        data[i][j] = (i === j) ? new Complex(-1 + i * dx, 0) : Complex.zero();
      }
    }
    return new ProjectiveMeasurement(new Hermitian(new Matrix(data), 'Position'));
  }

  /**
   * Create momentum-like measurement (discretized)
   */
  static momentum(dimension: number): ProjectiveMeasurement {
    // Momentum eigenstates are Fourier transforms of position eigenstates
    const data: Complex[][] = [];
    const dp = 2 * Math.PI / dimension;
    
    for (let i = 0; i < dimension; i++) {
      data[i] = [];
      for (let j = 0; j < dimension; j++) {
        if (i === j) {
          const p = -Math.PI + i * dp;
          data[i][j] = new Complex(p, 0);
        } else {
          data[i][j] = Complex.zero();
        }
      }
    }
    return new ProjectiveMeasurement(new Hermitian(new Matrix(data), 'Momentum'));
  }

  /**
   * Create spin component measurement (spin-1/2)
   */
  static spin(direction: 'x' | 'y' | 'z'): ProjectiveMeasurement {
    switch (direction) {
      case 'x': return this.pauliX();
      case 'y': return this.pauliY();
      case 'z': return this.pauliZ();
    }
  }

  /**
   * Create spin component measurement along arbitrary direction
   * Direction given by angles (θ, φ) on Bloch sphere
   */
  static spinDirection(theta: number, phi: number): ProjectiveMeasurement {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    
    // σ·n = sin(θ)cos(φ)σx + sin(θ)sin(φ)σy + cos(θ)σz
    const data: Complex[][] = [
      [new Complex(cosTheta, 0), new Complex(sinTheta * cosPhi, -sinTheta * sinPhi)],
      [new Complex(sinTheta * cosPhi, sinTheta * sinPhi), new Complex(-cosTheta, 0)]
    ];
    
    return new ProjectiveMeasurement(
      new Hermitian(new Matrix(data), `Spin(${theta.toFixed(2)},${phi.toFixed(2)})`)
    );
  }
}

// ============================================================================
// WEAK MEASUREMENT CLASS
// ============================================================================

/**
 * WeakMeasurement implements weak measurements with small disturbance
 * 
 * Weak measurements extract partial information without full collapse
 */
export class WeakMeasurement {
  private observable: Hermitian;
  private strength: number; // Measurement strength (0 = no measurement, 1 = strong)
  private id: string;
  private hash: string;

  constructor(observable: Hermitian, strength: number = 0.1) {
    this.id = `wm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.observable = observable;
    this.strength = Math.max(0, Math.min(1, strength));
    this.hash = HashVerifier.hashObject({
      id: this.id,
      observableHash: observable.getHash(),
      strength: this.strength
    });
  }

  getId(): string {
    return this.id;
  }

  getHash(): string {
    return this.hash;
  }

  getStrength(): number {
    return this.strength;
  }

  /**
   * Perform weak measurement
   * 
   * Returns weak value and slightly perturbed state
   */
  measure(state: Vector): { weakValue: number; postState: Vector; hash: string } {
    const timestamp = Date.now();
    
    // Weak value approximation: ⟨A⟩_w ≈ ⟨ψ|A|ψ⟩ + noise
    const projMeasurement = new ProjectiveMeasurement(this.observable);
    const expectation = projMeasurement.expectationValue(state);
    const variance = projMeasurement.variance(state);
    
    // Add measurement noise inversely proportional to strength
    const noise = (1 - this.strength) * Math.sqrt(variance) * (Math.random() - 0.5) * 2;
    const weakValue = expectation + noise;
    
    // Slight state perturbation based on strength
    const dim = state.getDimension();
    const perturbedComponents: Complex[] = [];
    
    for (let i = 0; i < dim; i++) {
      const original = state.getComponent(i);
      const perturbation = new Complex(
        (Math.random() - 0.5) * this.strength * 0.1,
        (Math.random() - 0.5) * this.strength * 0.1
      );
      perturbedComponents.push(original.add(perturbation));
    }
    
    // Normalize
    const postState = new Vector(perturbedComponents).normalize();
    
    return {
      weakValue,
      postState,
      hash: HashVerifier.hashObject({
        weakValue,
        strength: this.strength,
        timestamp
      })
    };
  }

  /**
   * Weak value between pre-selected and post-selected states
   * A_w = ⟨φ|A|ψ⟩/⟨φ|ψ⟩
   */
  weakValuePostSelected(preState: Vector, postState: Vector): Complex {
    const dim = this.observable.getDimension();
    
    // Apply observable to pre-state
    const aPreState: Complex[] = [];
    const matrix = this.observable.getMatrix();
    
    for (let i = 0; i < dim; i++) {
      let sum = Complex.zero();
      for (let j = 0; j < dim; j++) {
        sum = sum.add(matrix.get(i, j).multiply(preState.getComponent(j)));
      }
      aPreState.push(sum);
    }
    
    // Calculate ⟨φ|A|ψ⟩
    const numerator = postState.innerProduct(new Vector(aPreState));
    
    // Calculate ⟨φ|ψ⟩
    const denominator = postState.innerProduct(preState);
    
    if (denominator.magnitude().toNumber() < 1e-15) {
      throw new Error('Post-selected state is orthogonal to pre-selected state');
    }
    
    return numerator.divide(denominator);
  }
}

// ============================================================================
// QUANTUM TOMOGRAPHY CLASS
// ============================================================================

/**
 * QuantumTomography reconstructs quantum states from measurements
 */
export class QuantumTomography {
  private dimension: number;
  private id: string;
  private hash: string;

  constructor(dimension: number) {
    this.id = `qt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.dimension = dimension;
    this.hash = HashVerifier.hashObject({
      id: this.id,
      dimension
    });
  }

  getId(): string {
    return this.id;
  }

  getHash(): string {
    return this.hash;
  }

  /**
   * Reconstruct qubit state from Pauli measurements
   * 
   * Given ⟨X⟩, ⟨Y⟩, ⟨Z⟩, reconstruct ρ = (I + r·σ)/2
   */
  reconstructQubit(xExpectation: number, yExpectation: number, zExpectation: number): {
    densityMatrix: Matrix;
    blochVector: { x: number; y: number; z: number };
    purity: number;
    hash: string;
  } {
    // Bloch vector components
    const r = { x: xExpectation, y: yExpectation, z: zExpectation };
    const norm = Math.sqrt(r.x ** 2 + r.y ** 2 + r.z ** 2);
    
    // Construct density matrix ρ = (I + r·σ)/2
    // ρ = [[1+z, x-iy], [x+iy, 1-z]]/2
    const data: Complex[][] = [
      [new Complex((1 + r.z) / 2, 0), new Complex(r.x / 2, -r.y / 2)],
      [new Complex(r.x / 2, r.y / 2), new Complex((1 - r.z) / 2, 0)]
    ];
    
    const densityMatrix = new Matrix(data);
    const purity = 0.5 * (1 + norm ** 2);
    
    return {
      densityMatrix,
      blochVector: r,
      purity,
      hash: HashVerifier.hashObject({
        blochVector: r,
        purity,
        timestamp: Date.now()
      })
    };
  }

  /**
   * Linear inversion tomography for general states
   * 
   * Given measurement outcomes, reconstruct density matrix
   */
  linearInversion(
    measurements: ProjectiveMeasurement[],
    outcomes: number[][]
  ): { densityMatrix: Matrix; hash: string } {
    // This is a simplified implementation
    // Full tomography requires solving a system of linear equations
    
    if (this.dimension === 2 && measurements.length >= 3) {
      // For qubits with Pauli measurements
      const numTrials = outcomes[0].length;
      
      // Estimate expectations
      const expectations = measurements.map((_, i) => {
        return outcomes[i].reduce((a, b) => a + b, 0) / numTrials;
      });
      
      return {
        densityMatrix: this.reconstructQubit(
          expectations[0] || 0,
          expectations[1] || 0,
          expectations[2] || 0
        ).densityMatrix,
        hash: HashVerifier.hashObject({
          expectations,
          timestamp: Date.now()
        })
      };
    }
    
    // For higher dimensions, return maximally mixed state
    const data: Complex[][] = [];
    for (let i = 0; i < this.dimension; i++) {
      data[i] = [];
      for (let j = 0; j < this.dimension; j++) {
        data[i][j] = (i === j) 
          ? new Complex(1 / this.dimension, 0) 
          : Complex.zero();
      }
    }
    
    return {
      densityMatrix: new Matrix(data),
      hash: HashVerifier.hashObject({
        dimension: this.dimension,
        method: 'maximally_mixed',
        timestamp: Date.now()
      })
    };
  }
}

// Module exports are handled by individual class declarations
