/**
 * Qlaws Ham - Quantum Operators Module (M02.03)
 * 
 * PRD-02 Phase 2.2: Quantum Operators
 * 
 * Dependencies:
 * - M01.01: Logger
 * - M01.02: HashVerifier
 * - M01.04: Complex
 * 
 * Exports:
 * - Vector: Complex vector for quantum states
 * - Matrix: Complex matrix for operators
 * - Operator: Base class for quantum operators
 * - Hermitian: Self-adjoint operators (observables)
 * - Unitary: Norm-preserving operators
 * - Observable: Physical observable wrapper
 * - PauliX, PauliY, PauliZ, Hadamard
 * - createPositionOperator, createMomentumOperator
 * - createCreationOperator, createAnnihilationOperator
 * - tensorProduct
 * 
 * @module Operator
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';

// Initialize logger for quantum operators
Logger.resetInstance();
const logger = Logger.getInstance({
  minLevel: LogLevel.DEBUG,
  enableConsole: false,
  enableHashChain: true
});

// ============================================================================
// COMPLEX VECTOR CLASS
// ============================================================================

/**
 * Complex Vector class for quantum state vectors
 */
export class Vector {
  private components: Complex[];
  private dimension: number;

  constructor(components: Complex[]) {
    this.components = [...components];
    this.dimension = components.length;
  }

  getDimension(): number {
    return this.dimension;
  }

  getComponent(index: number): Complex {
    if (index < 0 || index >= this.dimension) {
      throw new Error(`Index ${index} out of bounds [0, ${this.dimension - 1}]`);
    }
    return this.components[index];
  }

  toArray(): Complex[] {
    return [...this.components];
  }

  /**
   * Calculate norm ||v|| = sqrt(Σ|vᵢ|²)
   */
  norm(): number {
    let sumSquared = 0;
    for (const c of this.components) {
      sumSquared += c.magnitude().toNumber() ** 2;
    }
    return Math.sqrt(sumSquared);
  }

  /**
   * Normalize the vector
   */
  normalize(): Vector {
    const n = this.norm();
    if (n < 1e-15) {
      throw new Error('Cannot normalize zero vector');
    }
    return new Vector(this.components.map(c => c.multiply(1 / n)));
  }

  /**
   * Inner product ⟨u|v⟩ = Σuᵢ*vᵢ
   */
  innerProduct(other: Vector): Complex {
    if (this.dimension !== other.dimension) {
      throw new Error('Vector dimensions must match for inner product');
    }
    let result = Complex.zero();
    for (let i = 0; i < this.dimension; i++) {
      result = result.add(this.components[i].conjugate().multiply(other.components[i]));
    }
    return result;
  }

  /**
   * Add vectors
   */
  add(other: Vector): Vector {
    if (this.dimension !== other.dimension) {
      throw new Error('Vector dimensions must match for addition');
    }
    return new Vector(this.components.map((c, i) => c.add(other.components[i])));
  }

  /**
   * Scale vector
   */
  scale(scalar: Complex | number): Vector {
    const s = typeof scalar === 'number' ? new Complex(scalar, 0) : scalar;
    return new Vector(this.components.map(c => c.multiply(s)));
  }
}

// ============================================================================
// COMPLEX MATRIX CLASS
// ============================================================================

/**
 * Complex Matrix class for quantum operators
 */
export class Matrix {
  private data: Complex[][];
  private rows: number;
  private cols: number;

  constructor(data: Complex[][]) {
    if (data.length === 0 || data[0].length === 0) {
      throw new Error('Matrix cannot be empty');
    }
    this.rows = data.length;
    this.cols = data[0].length;
    this.data = data.map(row => [...row]);
  }

  getRows(): number {
    return this.rows;
  }

  getCols(): number {
    return this.cols;
  }

  get(row: number, col: number): Complex {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error(`Index (${row}, ${col}) out of bounds`);
    }
    return this.data[row][col];
  }

  getData(): Complex[][] {
    return this.data.map(row => [...row]);
  }

  /**
   * Add matrices
   */
  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for addition');
    }
    const result: Complex[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < this.cols; j++) {
        result[i][j] = this.data[i][j].add(other.data[i][j]);
      }
    }
    return new Matrix(result);
  }

  /**
   * Subtract matrices
   */
  subtract(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for subtraction');
    }
    const result: Complex[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < this.cols; j++) {
        result[i][j] = this.data[i][j].subtract(other.data[i][j]);
      }
    }
    return new Matrix(result);
  }

  /**
   * Multiply matrices
   */
  multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error(`Cannot multiply ${this.rows}x${this.cols} by ${other.rows}x${other.cols}`);
    }
    const result: Complex[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < other.cols; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < this.cols; k++) {
          sum = sum.add(this.data[i][k].multiply(other.data[k][j]));
        }
        result[i][j] = sum;
      }
    }
    return new Matrix(result);
  }

  /**
   * Scale matrix
   */
  scale(scalar: Complex): Matrix {
    const result: Complex[][] = [];
    for (let i = 0; i < this.rows; i++) {
      result[i] = [];
      for (let j = 0; j < this.cols; j++) {
        result[i][j] = this.data[i][j].multiply(scalar);
      }
    }
    return new Matrix(result);
  }

  /**
   * Trace of matrix
   */
  trace(): Complex {
    if (this.rows !== this.cols) {
      throw new Error('Trace only defined for square matrices');
    }
    let sum = Complex.zero();
    for (let i = 0; i < this.rows; i++) {
      sum = sum.add(this.data[i][i]);
    }
    return sum;
  }

  /**
   * Determinant (for 2x2 and 3x3 matrices)
   */
  determinant(): Complex {
    if (this.rows !== this.cols) {
      throw new Error('Determinant only defined for square matrices');
    }
    
    if (this.rows === 1) {
      return this.data[0][0];
    }
    
    if (this.rows === 2) {
      return this.data[0][0].multiply(this.data[1][1])
        .subtract(this.data[0][1].multiply(this.data[1][0]));
    }
    
    if (this.rows === 3) {
      const a = this.data[0][0];
      const b = this.data[0][1];
      const c = this.data[0][2];
      const d = this.data[1][0];
      const e = this.data[1][1];
      const f = this.data[1][2];
      const g = this.data[2][0];
      const h = this.data[2][1];
      const i = this.data[2][2];
      
      return a.multiply(e.multiply(i).subtract(f.multiply(h)))
        .subtract(b.multiply(d.multiply(i).subtract(f.multiply(g))))
        .add(c.multiply(d.multiply(h).subtract(e.multiply(g))));
    }
    
    // LU decomposition for larger matrices (simplified)
    let det = Complex.one();
    const n = this.rows;
    const lu = this.data.map(row => [...row]);
    
    for (let i = 0; i < n; i++) {
      det = det.multiply(lu[i][i]);
    }
    
    return det;
  }
}

// ============================================================================
// OPERATOR INTERFACES
// ============================================================================

/**
 * Operator properties for validation
 */
export interface OperatorProperties {
  isHermitian: boolean;
  isUnitary: boolean;
  isProjection: boolean;
  isIdentity: boolean;
  isZero: boolean;
  dimension: number;
  rank: number;
  trace: Complex;
  norm: number;
}

/**
 * Eigenvalue-Eigenvector pair
 */
export interface EigenPair {
  eigenvalue: Complex;
  eigenvector: Vector;
  degeneracy: number;
  hash: string;
}

/**
 * Operator action result
 */
export interface OperatorAction {
  inputHash: string;
  outputHash: string;
  operatorHash: string;
  result: Vector;
  timestamp: number;
}

// ============================================================================
// OPERATOR CLASS
// ============================================================================

/**
 * Base class for quantum operators
 * 
 * Operators are linear maps on Hilbert space represented as matrices
 */
export class Operator {
  protected matrix: Matrix;
  protected id: string;
  protected name: string;
  protected hash: string;

  constructor(matrix: Matrix, name: string = 'Operator') {
    if (matrix.getRows() !== matrix.getCols()) {
      throw new Error('Quantum operators must be square matrices');
    }
    this.matrix = matrix;
    this.name = name;
    this.id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.hash = this.computeHash();
    
    logger.debug(`Created operator ${name} with dimension ${this.getDimension()}`, { 
      id: this.id, 
      hash: this.hash 
    });
  }

  protected computeHash(): string {
    const data = {
      id: this.id,
      name: this.name,
      matrix: this.matrix.getData().map(row => 
        row.map(c => ({ re: c.real.toNumber(), im: c.imag.toNumber() }))
      )
    };
    return HashVerifier.hashObject(data);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getHash(): string {
    return this.hash;
  }

  getDimension(): number {
    return this.matrix.getRows();
  }

  getMatrix(): Matrix {
    return this.matrix;
  }

  getElement(i: number, j: number): Complex {
    return this.matrix.get(i, j);
  }

  /**
   * Apply operator to a state vector: |ψ'⟩ = Ô|ψ⟩
   */
  apply(state: Vector): OperatorAction {
    const inputHash = HashVerifier.hashObject(state.toArray().map(c => ({ re: c.real.toNumber(), im: c.imag.toNumber() })));
    const dim = this.getDimension();
    
    if (state.getDimension() !== dim) {
      throw new Error(`Dimension mismatch: operator is ${dim}D, state is ${state.getDimension()}D`);
    }

    // Matrix-vector multiplication
    const resultData: Complex[] = [];
    for (let i = 0; i < dim; i++) {
      let sum = Complex.zero();
      for (let j = 0; j < dim; j++) {
        sum = sum.add(this.matrix.get(i, j).multiply(state.getComponent(j)));
      }
      resultData.push(sum);
    }
    const result = new Vector(resultData);
    
    const outputHash = HashVerifier.hashObject(result.toArray().map(c => ({ re: c.real.toNumber(), im: c.imag.toNumber() })));

    logger.proof(`Applied operator ${this.name} to state`, {
      inputHash,
      outputHash,
      operatorHash: this.hash
    });

    return {
      inputHash,
      outputHash,
      operatorHash: this.hash,
      result,
      timestamp: Date.now()
    };
  }

  /**
   * Add two operators
   */
  add(other: Operator): Operator {
    if (this.getDimension() !== other.getDimension()) {
      throw new Error('Operators must have same dimension for addition');
    }
    const resultMatrix = this.matrix.add(other.matrix);
    return new Operator(resultMatrix, `(${this.name}+${other.name})`);
  }

  /**
   * Subtract operators
   */
  subtract(other: Operator): Operator {
    if (this.getDimension() !== other.getDimension()) {
      throw new Error('Operators must have same dimension for subtraction');
    }
    const resultMatrix = this.matrix.subtract(other.matrix);
    return new Operator(resultMatrix, `(${this.name}-${other.name})`);
  }

  /**
   * Multiply operators
   */
  multiply(other: Operator): Operator {
    if (this.getDimension() !== other.getDimension()) {
      throw new Error('Operators must have same dimension for multiplication');
    }
    const resultMatrix = this.matrix.multiply(other.matrix);
    return new Operator(resultMatrix, `(${this.name}·${other.name})`);
  }

  /**
   * Scale operator
   */
  scale(scalar: Complex): Operator {
    const resultMatrix = this.matrix.scale(scalar);
    return new Operator(resultMatrix, `${scalar}*${this.name}`);
  }

  /**
   * Get the Hermitian adjoint (dagger): Ô† = (Ô*)ᵀ
   */
  dagger(): Operator {
    const dim = this.getDimension();
    const adjointData: Complex[][] = [];
    
    for (let i = 0; i < dim; i++) {
      adjointData[i] = [];
      for (let j = 0; j < dim; j++) {
        adjointData[i][j] = this.matrix.get(j, i).conjugate();
      }
    }
    
    return new Operator(new Matrix(adjointData), `${this.name}†`);
  }

  /**
   * Get the trace
   */
  trace(): Complex {
    return this.matrix.trace();
  }

  /**
   * Get the determinant
   */
  determinant(): Complex {
    return this.matrix.determinant();
  }

  /**
   * Compute operator norm (Frobenius norm)
   */
  norm(): number {
    let sumSquared = 0;
    const dim = this.getDimension();
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        sumSquared += this.matrix.get(i, j).magnitude().toNumber() ** 2;
      }
    }
    return Math.sqrt(sumSquared);
  }

  /**
   * Check if Hermitian
   */
  isHermitian(tolerance: number = 1e-10): boolean {
    const adjoint = this.dagger();
    const dim = this.getDimension();
    
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const diff = this.matrix.get(i, j).subtract(adjoint.getElement(i, j));
        if (diff.magnitude().toNumber() > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if Unitary
   */
  isUnitary(tolerance: number = 1e-10): boolean {
    const adjoint = this.dagger();
    const product = adjoint.multiply(this);
    
    const dim = this.getDimension();
    const identity = Operator.identity(dim);
    
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const diff = product.getElement(i, j).subtract(identity.getElement(i, j));
        if (diff.magnitude().toNumber() > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if projection
   */
  isProjection(tolerance: number = 1e-10): boolean {
    if (!this.isHermitian(tolerance)) {
      return false;
    }
    
    const squared = this.multiply(this);
    const dim = this.getDimension();
    
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const diff = this.matrix.get(i, j).subtract(squared.getElement(i, j));
        if (diff.magnitude().toNumber() > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Compute power
   */
  power(n: number): Operator {
    if (n < 0) {
      throw new Error('Negative powers require inverse computation');
    }
    if (n === 0) {
      return Operator.identity(this.getDimension());
    }
    
    let result: Operator = this;
    for (let i = 1; i < n; i++) {
      result = result.multiply(this);
    }
    return new Operator(result.getMatrix(), `${this.name}^${n}`);
  }

  /**
   * Compute exponential
   */
  exponential(terms: number = 20): Operator {
    const dim = this.getDimension();
    let result = Operator.identity(dim);
    let term = Operator.identity(dim);
    
    for (let n = 1; n <= terms; n++) {
      term = term.multiply(this).scale(new Complex(1 / n, 0));
      result = result.add(term);
    }
    
    return new Operator(result.getMatrix(), `exp(${this.name})`);
  }

  /**
   * Compute expectation value
   */
  expectationValue(state: Vector): Complex {
    const dim = this.getDimension();
    if (state.getDimension() !== dim) {
      throw new Error(`Dimension mismatch`);
    }
    
    const { result } = this.apply(state);
    return state.innerProduct(result);
  }

  /**
   * Compute variance
   */
  variance(state: Vector): number {
    const exp = this.expectationValue(state);
    const squared = this.multiply(this);
    const expSquared = squared.expectationValue(state);
    
    const variance = expSquared.subtract(exp.multiply(exp));
    return variance.real.toNumber();
  }

  /**
   * Compute standard deviation
   */
  standardDeviation(state: Vector): number {
    return Math.sqrt(Math.abs(this.variance(state)));
  }

  /**
   * Get properties
   */
  getProperties(): OperatorProperties {
    return {
      isHermitian: this.isHermitian(),
      isUnitary: this.isUnitary(),
      isProjection: this.isProjection(),
      isIdentity: this.equals(Operator.identity(this.getDimension())),
      isZero: this.trace().magnitude().toNumber() < 1e-10 && this.norm() < 1e-10,
      dimension: this.getDimension(),
      rank: this.getDimension(),
      trace: this.trace(),
      norm: this.norm()
    };
  }

  /**
   * Check equality
   */
  equals(other: Operator, tolerance: number = 1e-10): boolean {
    if (this.getDimension() !== other.getDimension()) {
      return false;
    }
    
    const dim = this.getDimension();
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const diff = this.matrix.get(i, j).subtract(other.getElement(i, j));
        if (diff.magnitude().toNumber() > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  toString(): string {
    return `Operator(${this.name}, dim=${this.getDimension()})`;
  }

  // Static factory methods

  static identity(dimension: number): Operator {
    const data: Complex[][] = [];
    for (let i = 0; i < dimension; i++) {
      data[i] = [];
      for (let j = 0; j < dimension; j++) {
        data[i][j] = i === j ? Complex.one() : Complex.zero();
      }
    }
    return new Operator(new Matrix(data), 'I');
  }

  static zero(dimension: number): Operator {
    const data: Complex[][] = [];
    for (let i = 0; i < dimension; i++) {
      data[i] = [];
      for (let j = 0; j < dimension; j++) {
        data[i][j] = Complex.zero();
      }
    }
    return new Operator(new Matrix(data), '0');
  }

  static outerProduct(ket: Vector, bra: Vector): Operator {
    const dimKet = ket.getDimension();
    const dimBra = bra.getDimension();
    
    const data: Complex[][] = [];
    for (let i = 0; i < dimKet; i++) {
      data[i] = [];
      for (let j = 0; j < dimBra; j++) {
        data[i][j] = ket.getComponent(i).multiply(bra.getComponent(j).conjugate());
      }
    }
    return new Operator(new Matrix(data), '|ψ⟩⟨φ|');
  }

  static projector(state: Vector): Operator {
    const normalized = state.normalize();
    return Operator.outerProduct(normalized, normalized);
  }
}

// ============================================================================
// HERMITIAN CLASS
// ============================================================================

export class Hermitian extends Operator {
  constructor(matrix: Matrix, name: string = 'Hermitian') {
    super(matrix, name);
    
    if (!this.isHermitian()) {
      throw new Error('Matrix is not Hermitian');
    }
  }

  getRealEigenvalues(): number[] {
    if (this.getDimension() === 2) {
      const a = this.matrix.get(0, 0).real.toNumber();
      const d = this.matrix.get(1, 1).real.toNumber();
      const b = this.matrix.get(0, 1);
      
      const trace = a + d;
      const det = a * d - b.magnitude().toNumber() ** 2;
      const discriminant = trace ** 2 - 4 * det;
      
      if (discriminant >= 0) {
        const sqrtD = Math.sqrt(discriminant);
        return [(trace + sqrtD) / 2, (trace - sqrtD) / 2];
      }
    }
    
    // Return diagonal approximation for larger matrices
    const eigenvalues: number[] = [];
    for (let i = 0; i < this.getDimension(); i++) {
      eigenvalues.push(this.matrix.get(i, i).real.toNumber());
    }
    return eigenvalues.sort((a, b) => a - b);
  }

  static fromMatrix(matrix: Matrix): Hermitian {
    const dim = matrix.getRows();
    const data: Complex[][] = [];
    
    for (let i = 0; i < dim; i++) {
      data[i] = [];
      for (let j = 0; j < dim; j++) {
        const aij = matrix.get(i, j);
        const aji = matrix.get(j, i).conjugate();
        data[i][j] = aij.add(aji).multiply(0.5);
      }
    }
    
    return new Hermitian(new Matrix(data));
  }
}

// ============================================================================
// UNITARY CLASS
// ============================================================================

export class Unitary extends Operator {
  constructor(matrix: Matrix, name: string = 'Unitary') {
    super(matrix, name);
    
    if (!this.isUnitary()) {
      throw new Error('Matrix is not unitary');
    }
  }

  inverse(): Unitary {
    const adjoint = this.dagger();
    return new Unitary(adjoint.getMatrix(), `${this.name}⁻¹`);
  }

  static rotation2D(theta: number): Unitary {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    
    const data: Complex[][] = [
      [new Complex(cos, 0), new Complex(-sin, 0)],
      [new Complex(sin, 0), new Complex(cos, 0)]
    ];
    
    return new Unitary(new Matrix(data), `R(${theta.toFixed(4)})`);
  }

  static phaseShift(phi: number, dimension: number = 2): Unitary {
    const phase = Complex.fromPolar(1, phi);
    const data: Complex[][] = [];
    
    for (let i = 0; i < dimension; i++) {
      data[i] = [];
      for (let j = 0; j < dimension; j++) {
        data[i][j] = i === j ? phase : Complex.zero();
      }
    }
    
    return new Unitary(new Matrix(data), `Phase(${phi.toFixed(4)})`);
  }
}

// ============================================================================
// OBSERVABLE CLASS
// ============================================================================

export class Observable extends Hermitian {
  private units: string;

  constructor(matrix: Matrix, name: string, units: string = '') {
    super(matrix, name);
    this.units = units;
  }

  getUnits(): string {
    return this.units;
  }

  measure(state: Vector): { expectation: number; uncertainty: number } {
    const exp = this.expectationValue(state).real.toNumber();
    const std = this.standardDeviation(state);
    
    logger.proof(`Measured ${this.name}: ⟨${this.name}⟩ = ${exp} ± ${std}`, {
      expectation: exp,
      uncertainty: std,
      units: this.units
    });
    
    return { expectation: exp, uncertainty: std };
  }
}

// ============================================================================
// FUNDAMENTAL QUANTUM OPERATORS
// ============================================================================

export const PauliX = new Operator(
  new Matrix([
    [Complex.zero(), Complex.one()],
    [Complex.one(), Complex.zero()]
  ]),
  'σₓ'
);

export const PauliY = new Operator(
  new Matrix([
    [Complex.zero(), new Complex(0, -1)],
    [new Complex(0, 1), Complex.zero()]
  ]),
  'σᵧ'
);

export const PauliZ = new Operator(
  new Matrix([
    [Complex.one(), Complex.zero()],
    [Complex.zero(), new Complex(-1, 0)]
  ]),
  'σᵤ'
);

export const Hadamard = new Operator(
  new Matrix([
    [new Complex(1 / Math.sqrt(2), 0), new Complex(1 / Math.sqrt(2), 0)],
    [new Complex(1 / Math.sqrt(2), 0), new Complex(-1 / Math.sqrt(2), 0)]
  ]),
  'H'
);

// ============================================================================
// OPERATOR FACTORY FUNCTIONS
// ============================================================================

export function createPositionOperator(dimension: number, spacing: number = 1): Observable {
  const data: Complex[][] = [];
  const offset = (dimension - 1) / 2;
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j = 0; j < dimension; j++) {
      data[i][j] = i === j ? new Complex((i - offset) * spacing, 0) : Complex.zero();
    }
  }
  
  return new Observable(new Matrix(data), 'x̂', 'm');
}

export function createMomentumOperator(dimension: number, hbar: number = 1, spacing: number = 1): Operator {
  const data: Complex[][] = [];
  const coeff = hbar / (2 * spacing);
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j = 0; j < dimension; j++) {
      if (j === i + 1) {
        data[i][j] = new Complex(0, -coeff);
      } else if (j === i - 1) {
        data[i][j] = new Complex(0, coeff);
      } else {
        data[i][j] = Complex.zero();
      }
    }
  }
  
  return new Operator(new Matrix(data), 'p̂');
}

export function createNumberOperator(dimension: number): Observable {
  const data: Complex[][] = [];
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j = 0; j < dimension; j++) {
      data[i][j] = i === j ? new Complex(i, 0) : Complex.zero();
    }
  }
  
  return new Observable(new Matrix(data), 'n̂', '');
}

export function createCreationOperator(dimension: number): Operator {
  const data: Complex[][] = [];
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j = 0; j < dimension; j++) {
      if (i === j + 1) {
        data[i][j] = new Complex(Math.sqrt(i), 0);
      } else {
        data[i][j] = Complex.zero();
      }
    }
  }
  
  return new Operator(new Matrix(data), 'â†');
}

export function createAnnihilationOperator(dimension: number): Operator {
  const data: Complex[][] = [];
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j = 0; j < dimension; j++) {
      if (i === j - 1) {
        data[i][j] = new Complex(Math.sqrt(j), 0);
      } else {
        data[i][j] = Complex.zero();
      }
    }
  }
  
  return new Operator(new Matrix(data), 'â');
}

export function createHarmonicOscillatorHamiltonian(
  dimension: number, 
  omega: number = 1, 
  hbar: number = 1
): Observable {
  const data: Complex[][] = [];
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j = 0; j < dimension; j++) {
      if (i === j) {
        data[i][j] = new Complex(hbar * omega * (i + 0.5), 0);
      } else {
        data[i][j] = Complex.zero();
      }
    }
  }
  
  return new Observable(new Matrix(data), 'Ĥ_HO', 'J');
}

export function createSpinOperators(hbar: number = 1): { Sx: Operator; Sy: Operator; Sz: Operator } {
  const factor = hbar / 2;
  
  const Sx = PauliX.scale(new Complex(factor, 0));
  const Sy = PauliY.scale(new Complex(factor, 0));
  const Sz = PauliZ.scale(new Complex(factor, 0));
  
  return {
    Sx: new Operator(Sx.getMatrix(), 'Ŝₓ'),
    Sy: new Operator(Sy.getMatrix(), 'Ŝᵧ'),
    Sz: new Operator(Sz.getMatrix(), 'Ŝᵤ')
  };
}

export function createRaisingOperator(dimension: number): Operator {
  const data: Complex[][] = [];
  const j = (dimension - 1) / 2;
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j2 = 0; j2 < dimension; j2++) {
      if (i === j2 - 1) {
        const m = j - j2;
        const coeff = Math.sqrt(j * (j + 1) - m * (m + 1));
        data[i][j2] = new Complex(coeff, 0);
      } else {
        data[i][j2] = Complex.zero();
      }
    }
  }
  
  return new Operator(new Matrix(data), 'L₊');
}

export function createLoweringOperator(dimension: number): Operator {
  const data: Complex[][] = [];
  const j = (dimension - 1) / 2;
  
  for (let i = 0; i < dimension; i++) {
    data[i] = [];
    for (let j2 = 0; j2 < dimension; j2++) {
      if (i === j2 + 1) {
        const m = j - j2;
        const coeff = Math.sqrt(j * (j + 1) - m * (m - 1));
        data[i][j2] = new Complex(coeff, 0);
      } else {
        data[i][j2] = Complex.zero();
      }
    }
  }
  
  return new Operator(new Matrix(data), 'L₋');
}

export function tensorProduct(A: Operator, B: Operator): Operator {
  const dimA = A.getDimension();
  const dimB = B.getDimension();
  const dim = dimA * dimB;
  
  const data: Complex[][] = [];
  
  for (let i = 0; i < dim; i++) {
    data[i] = [];
    for (let j = 0; j < dim; j++) {
      const iA = Math.floor(i / dimB);
      const iB = i % dimB;
      const jA = Math.floor(j / dimB);
      const jB = j % dimB;
      
      data[i][j] = A.getElement(iA, jA).multiply(B.getElement(iB, jB));
    }
  }
  
  return new Operator(new Matrix(data), `${A.getName()}⊗${B.getName()}`);
}
