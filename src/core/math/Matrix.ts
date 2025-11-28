/**
 * Qlaws Ham - Matrix Module (M01.05)
 * 
 * N-dimensional matrix support with arbitrary precision.
 * Includes eigenvalue computation, decompositions, and more.
 * 
 * @module Matrix
 * @version 1.0.0
 * @dependencies Logger (M01.01), BigNumber (M01.03), Complex (M01.04)
 */

import { Logger } from '../logger/Logger';
import { BigNumber } from './BigNumber';
import { Complex } from './Complex';

/**
 * Matrix type for numeric operations
 */
type MatrixElement = BigNumber | Complex | number;

/**
 * Vector class - 1D matrix
 */
export class Vector {
  public readonly data: BigNumber[];
  public readonly size: number;

  constructor(data: (BigNumber | number | string)[]) {
    this.data = data.map(v => v instanceof BigNumber ? v : new BigNumber(v));
    this.size = this.data.length;
  }

  /**
   * Get element at index
   */
  public get(index: number): BigNumber {
    if (index < 0 || index >= this.size) {
      throw new Error(`Index ${index} out of bounds for vector of size ${this.size}`);
    }
    return this.data[index];
  }

  /**
   * Create zero vector
   */
  public static zeros(size: number): Vector {
    return new Vector(new Array(size).fill(0));
  }

  /**
   * Create ones vector
   */
  public static ones(size: number): Vector {
    return new Vector(new Array(size).fill(1));
  }

  /**
   * Create unit vector
   */
  public static unit(size: number, index: number): Vector {
    const data = new Array(size).fill(0);
    data[index] = 1;
    return new Vector(data);
  }

  /**
   * Add vectors
   */
  public add(other: Vector): Vector {
    if (this.size !== other.size) {
      throw new Error('Vector sizes must match for addition');
    }
    return new Vector(this.data.map((v, i) => v.add(other.data[i])));
  }

  /**
   * Subtract vectors
   */
  public subtract(other: Vector): Vector {
    if (this.size !== other.size) {
      throw new Error('Vector sizes must match for subtraction');
    }
    return new Vector(this.data.map((v, i) => v.subtract(other.data[i])));
  }

  /**
   * Scalar multiplication
   */
  public scale(scalar: BigNumber | number): Vector {
    const s = scalar instanceof BigNumber ? scalar : new BigNumber(scalar);
    return new Vector(this.data.map(v => v.multiply(s)));
  }

  /**
   * Dot product
   */
  public dot(other: Vector): BigNumber {
    if (this.size !== other.size) {
      throw new Error('Vector sizes must match for dot product');
    }
    return this.data.reduce(
      (sum, v, i) => sum.add(v.multiply(other.data[i])),
      new BigNumber(0)
    );
  }

  /**
   * Magnitude (L2 norm)
   */
  public magnitude(): BigNumber {
    return this.dot(this).sqrt();
  }

  /**
   * Normalize vector
   */
  public normalize(): Vector {
    const mag = this.magnitude();
    if (mag.isZero()) {
      throw new Error('Cannot normalize zero vector');
    }
    return new Vector(this.data.map(v => v.divide(mag)));
  }

  /**
   * Cross product (3D only)
   */
  public cross(other: Vector): Vector {
    if (this.size !== 3 || other.size !== 3) {
      throw new Error('Cross product only defined for 3D vectors');
    }
    return new Vector([
      this.data[1].multiply(other.data[2]).subtract(this.data[2].multiply(other.data[1])),
      this.data[2].multiply(other.data[0]).subtract(this.data[0].multiply(other.data[2])),
      this.data[0].multiply(other.data[1]).subtract(this.data[1].multiply(other.data[0]))
    ]);
  }

  /**
   * Convert to array of numbers
   */
  public toArray(): number[] {
    return this.data.map(v => v.toNumber());
  }

  /**
   * String representation
   */
  public toString(): string {
    return `[${this.data.map(v => v.toString()).join(', ')}]`;
  }
}

/**
 * Matrix class
 */
export class Matrix {
  public readonly data: BigNumber[][];
  public readonly rows: number;
  public readonly cols: number;
  private static logger: Logger | null = null;

  /**
   * Create matrix from 2D array
   */
  constructor(data: (BigNumber | number | string)[][]) {
    if (data.length === 0 || data[0].length === 0) {
      throw new Error('Matrix cannot be empty');
    }
    
    this.rows = data.length;
    this.cols = data[0].length;
    
    // Verify all rows have same length
    for (const row of data) {
      if (row.length !== this.cols) {
        throw new Error('All rows must have same length');
      }
    }
    
    this.data = data.map(row => 
      row.map(v => v instanceof BigNumber ? v : new BigNumber(v))
    );
  }

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    Matrix.logger = logger;
  }

  /**
   * Get element at position
   */
  public get(row: number, col: number): BigNumber {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new Error(`Index (${row}, ${col}) out of bounds for matrix ${this.rows}x${this.cols}`);
    }
    return this.data[row][col];
  }

  /**
   * Get row as vector
   */
  public getRow(row: number): Vector {
    if (row < 0 || row >= this.rows) {
      throw new Error(`Row ${row} out of bounds`);
    }
    return new Vector(this.data[row]);
  }

  /**
   * Get column as vector
   */
  public getCol(col: number): Vector {
    if (col < 0 || col >= this.cols) {
      throw new Error(`Column ${col} out of bounds`);
    }
    return new Vector(this.data.map(row => row[col]));
  }

  /**
   * Create zero matrix
   */
  public static zeros(rows: number, cols: number): Matrix {
    const data = Array(rows).fill(null).map(() => Array(cols).fill(0));
    return new Matrix(data);
  }

  /**
   * Create ones matrix
   */
  public static ones(rows: number, cols: number): Matrix {
    const data = Array(rows).fill(null).map(() => Array(cols).fill(1));
    return new Matrix(data);
  }

  /**
   * Create identity matrix
   */
  public static identity(size: number): Matrix {
    const data = Array(size).fill(null).map((_, i) => 
      Array(size).fill(0).map((_, j) => i === j ? 1 : 0)
    );
    return new Matrix(data);
  }

  /**
   * Create diagonal matrix from array
   */
  public static diagonal(values: (BigNumber | number)[]): Matrix {
    const size = values.length;
    const data = Array(size).fill(null).map((_, i) => 
      Array(size).fill(0).map((_, j) => i === j ? values[i] : 0)
    );
    return new Matrix(data);
  }

  /**
   * Create matrix from vectors (as columns)
   */
  public static fromColumns(vectors: Vector[]): Matrix {
    if (vectors.length === 0) {
      throw new Error('Cannot create matrix from empty vector array');
    }
    const rows = vectors[0].size;
    const cols = vectors.length;
    
    for (const v of vectors) {
      if (v.size !== rows) {
        throw new Error('All vectors must have same size');
      }
    }
    
    const data: BigNumber[][] = [];
    for (let i = 0; i < rows; i++) {
      data.push(vectors.map(v => v.get(i)));
    }
    
    return new Matrix(data);
  }

  /**
   * Create matrix from vectors (as rows)
   */
  public static fromRows(vectors: Vector[]): Matrix {
    if (vectors.length === 0) {
      throw new Error('Cannot create matrix from empty vector array');
    }
    return new Matrix(vectors.map(v => v.data));
  }

  /**
   * Check if square
   */
  public isSquare(): boolean {
    return this.rows === this.cols;
  }

  /**
   * Check if symmetric
   */
  public isSymmetric(): boolean {
    if (!this.isSquare()) return false;
    for (let i = 0; i < this.rows; i++) {
      for (let j = i + 1; j < this.cols; j++) {
        if (this.data[i][j].compare(this.data[j][i]) !== 0) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Transpose
   */
  public transpose(): Matrix {
    const data = Array(this.cols).fill(null).map((_, i) =>
      Array(this.rows).fill(null).map((_, j) => this.data[j][i])
    );
    return new Matrix(data);
  }

  /**
   * Add matrices
   */
  public add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for addition');
    }
    const data = this.data.map((row, i) =>
      row.map((v, j) => v.add(other.data[i][j]))
    );
    return new Matrix(data);
  }

  /**
   * Subtract matrices
   */
  public subtract(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for subtraction');
    }
    const data = this.data.map((row, i) =>
      row.map((v, j) => v.subtract(other.data[i][j]))
    );
    return new Matrix(data);
  }

  /**
   * Scalar multiplication
   */
  public scale(scalar: BigNumber | number): Matrix {
    const s = scalar instanceof BigNumber ? scalar : new BigNumber(scalar);
    const data = this.data.map(row => row.map(v => v.multiply(s)));
    return new Matrix(data);
  }

  /**
   * Matrix multiplication
   */
  public multiply(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error(`Cannot multiply ${this.rows}x${this.cols} with ${other.rows}x${other.cols}`);
    }
    
    const data: BigNumber[][] = [];
    for (let i = 0; i < this.rows; i++) {
      const row: BigNumber[] = [];
      for (let j = 0; j < other.cols; j++) {
        let sum = new BigNumber(0);
        for (let k = 0; k < this.cols; k++) {
          sum = sum.add(this.data[i][k].multiply(other.data[k][j]));
        }
        row.push(sum);
      }
      data.push(row);
    }
    
    return new Matrix(data);
  }

  /**
   * Matrix-vector multiplication
   */
  public multiplyVector(v: Vector): Vector {
    if (this.cols !== v.size) {
      throw new Error(`Cannot multiply ${this.rows}x${this.cols} matrix with vector of size ${v.size}`);
    }
    
    const result: BigNumber[] = [];
    for (let i = 0; i < this.rows; i++) {
      let sum = new BigNumber(0);
      for (let j = 0; j < this.cols; j++) {
        sum = sum.add(this.data[i][j].multiply(v.data[j]));
      }
      result.push(sum);
    }
    
    return new Vector(result);
  }

  /**
   * Matrix power
   */
  public pow(n: number): Matrix {
    if (!this.isSquare()) {
      throw new Error('Matrix must be square for power operation');
    }
    if (n < 0) {
      throw new Error('Negative powers not yet supported');
    }
    if (n === 0) {
      return Matrix.identity(this.rows);
    }
    if (n === 1) {
      return new Matrix(this.data);
    }
    
    let result = Matrix.identity(this.rows);
    let base = new Matrix(this.data);
    let exp = n;
    
    while (exp > 0) {
      if (exp % 2 === 1) {
        result = result.multiply(base);
      }
      base = base.multiply(base);
      exp = Math.floor(exp / 2);
    }
    
    return result;
  }

  /**
   * Trace (sum of diagonal)
   */
  public trace(): BigNumber {
    if (!this.isSquare()) {
      throw new Error('Trace only defined for square matrices');
    }
    let sum = new BigNumber(0);
    for (let i = 0; i < this.rows; i++) {
      sum = sum.add(this.data[i][i]);
    }
    return sum;
  }

  /**
   * Determinant (using LU decomposition)
   */
  public determinant(): BigNumber {
    if (!this.isSquare()) {
      throw new Error('Determinant only defined for square matrices');
    }
    
    const n = this.rows;
    if (n === 1) return this.data[0][0];
    if (n === 2) {
      return this.data[0][0].multiply(this.data[1][1])
        .subtract(this.data[0][1].multiply(this.data[1][0]));
    }
    
    // LU decomposition approach
    const lu = this.luDecomposition();
    let det = new BigNumber(1);
    for (let i = 0; i < n; i++) {
      det = det.multiply(lu.U.data[i][i]);
    }
    
    // Count the number of transpositions in the permutation
    if (lu.P) {
      // Create a working copy and count actual swaps needed
      const perm = [...lu.P];
      let swaps = 0;
      for (let i = 0; i < n; i++) {
        while (perm[i] !== i) {
          const j = perm[i];
          [perm[i], perm[j]] = [perm[j], perm[i]];
          swaps++;
        }
      }
      if (swaps % 2 === 1) {
        det = det.negate();
      }
    }
    
    return det;
  }

  /**
   * LU Decomposition with partial pivoting
   */
  public luDecomposition(): { L: Matrix; U: Matrix; P: number[] } {
    if (!this.isSquare()) {
      throw new Error('LU decomposition only for square matrices');
    }
    
    const n = this.rows;
    const L = Matrix.zeros(n, n);
    const U = new Matrix(this.data.map(row => [...row]));
    const P: number[] = Array(n).fill(0).map((_, i) => i);
    
    for (let k = 0; k < n; k++) {
      // Find pivot
      let maxVal = U.data[k][k].abs();
      let maxRow = k;
      for (let i = k + 1; i < n; i++) {
        const absVal = U.data[i][k].abs();
        if (absVal.compare(maxVal) > 0) {
          maxVal = absVal;
          maxRow = i;
        }
      }
      
      // Swap rows
      if (maxRow !== k) {
        [U.data[k], U.data[maxRow]] = [U.data[maxRow], U.data[k]];
        [L.data[k], L.data[maxRow]] = [L.data[maxRow], L.data[k]];
        [P[k], P[maxRow]] = [P[maxRow], P[k]];
      }
      
      // Set L diagonal
      L.data[k][k] = new BigNumber(1);
      
      // Elimination
      for (let i = k + 1; i < n; i++) {
        if (!U.data[k][k].isZero()) {
          L.data[i][k] = U.data[i][k].divide(U.data[k][k]);
          for (let j = k; j < n; j++) {
            U.data[i][j] = U.data[i][j].subtract(L.data[i][k].multiply(U.data[k][j]));
          }
        }
      }
    }
    
    return { L: new Matrix(L.data), U: new Matrix(U.data), P };
  }

  /**
   * Inverse (using Gauss-Jordan elimination)
   */
  public inverse(): Matrix {
    if (!this.isSquare()) {
      throw new Error('Inverse only defined for square matrices');
    }
    
    const n = this.rows;
    const augmented: BigNumber[][] = this.data.map((row, i) => [
      ...row,
      ...Array(n).fill(0).map((_, j) => new BigNumber(i === j ? 1 : 0))
    ]);
    
    // Forward elimination
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col;
      let maxVal = augmented[col][col].abs();
      for (let row = col + 1; row < n; row++) {
        const absVal = augmented[row][col].abs();
        if (absVal.compare(maxVal) > 0) {
          maxVal = absVal;
          maxRow = row;
        }
      }
      
      if (maxVal.isZero()) {
        throw new Error('Matrix is singular');
      }
      
      // Swap rows
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
      
      // Scale pivot row
      const pivot = augmented[col][col];
      for (let j = 0; j < 2 * n; j++) {
        augmented[col][j] = augmented[col][j].divide(pivot);
      }
      
      // Eliminate column
      for (let row = 0; row < n; row++) {
        if (row !== col) {
          const factor = augmented[row][col];
          for (let j = 0; j < 2 * n; j++) {
            augmented[row][j] = augmented[row][j].subtract(factor.multiply(augmented[col][j]));
          }
        }
      }
    }
    
    // Extract inverse
    const inverse = augmented.map(row => row.slice(n));
    return new Matrix(inverse);
  }

  /**
   * Frobenius norm
   */
  public norm(): BigNumber {
    let sum = new BigNumber(0);
    for (const row of this.data) {
      for (const val of row) {
        sum = sum.add(val.multiply(val));
      }
    }
    return sum.sqrt();
  }

  /**
   * Element-wise multiplication (Hadamard product)
   */
  public hadamard(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for Hadamard product');
    }
    const data = this.data.map((row, i) =>
      row.map((v, j) => v.multiply(other.data[i][j]))
    );
    return new Matrix(data);
  }

  /**
   * Check equality
   */
  public equals(other: Matrix, epsilon?: number): boolean {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      return false;
    }
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (epsilon) {
          const diff = this.data[i][j].subtract(other.data[i][j]).abs();
          if (diff.compare(epsilon) > 0) return false;
        } else {
          if (this.data[i][j].compare(other.data[i][j]) !== 0) return false;
        }
      }
    }
    return true;
  }

  /**
   * Clone matrix
   */
  public clone(): Matrix {
    return new Matrix(this.data.map(row => [...row]));
  }

  /**
   * Convert to 2D number array
   */
  public toArray(): number[][] {
    return this.data.map(row => row.map(v => v.toNumber()));
  }

  /**
   * String representation
   */
  public toString(): string {
    const rows = this.data.map(row => 
      '  [' + row.map(v => v.toString().padStart(10)).join(', ') + ']'
    );
    return '[\n' + rows.join(',\n') + '\n]';
  }
}

/**
 * Matrix operations utility class
 */
export class MatrixOperations {
  /**
   * Kronecker product
   */
  public static kronecker(A: Matrix, B: Matrix): Matrix {
    const data: BigNumber[][] = [];
    for (let i = 0; i < A.rows; i++) {
      for (let k = 0; k < B.rows; k++) {
        const row: BigNumber[] = [];
        for (let j = 0; j < A.cols; j++) {
          for (let l = 0; l < B.cols; l++) {
            row.push(A.data[i][j].multiply(B.data[k][l]));
          }
        }
        data.push(row);
      }
    }
    return new Matrix(data);
  }

  /**
   * Outer product of two vectors
   */
  public static outerProduct(a: Vector, b: Vector): Matrix {
    const data: BigNumber[][] = [];
    for (let i = 0; i < a.size; i++) {
      const row: BigNumber[] = [];
      for (let j = 0; j < b.size; j++) {
        row.push(a.data[i].multiply(b.data[j]));
      }
      data.push(row);
    }
    return new Matrix(data);
  }

  /**
   * Solve linear system Ax = b using LU decomposition
   */
  public static solve(A: Matrix, b: Vector): Vector {
    if (A.rows !== A.cols) {
      throw new Error('Matrix must be square');
    }
    if (A.rows !== b.size) {
      throw new Error('Vector size must match matrix rows');
    }
    
    const n = A.rows;
    const { L, U, P } = A.luDecomposition();
    
    // Apply permutation to b
    const pb: BigNumber[] = P.map(i => b.data[i]);
    
    // Forward substitution: Ly = Pb
    const y: BigNumber[] = new Array(n);
    for (let i = 0; i < n; i++) {
      let sum = pb[i];
      for (let j = 0; j < i; j++) {
        sum = sum.subtract(L.data[i][j].multiply(y[j]));
      }
      y[i] = sum;
    }
    
    // Back substitution: Ux = y
    const x: BigNumber[] = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let sum = y[i];
      for (let j = i + 1; j < n; j++) {
        sum = sum.subtract(U.data[i][j].multiply(x[j]));
      }
      if (U.data[i][i].isZero()) {
        throw new Error('Matrix is singular');
      }
      x[i] = sum.divide(U.data[i][i]);
    }
    
    return new Vector(x);
  }
}
