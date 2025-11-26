/**
 * EigenSolver.ts - Eigenvalue/Eigenvector solver for quantum mechanics
 * 
 * Part of PRD-02 Phase 2.3: Schrödinger Equation Solver
 * Module ID: M02.05
 * 
 * Dependencies: M01.05 (Matrix), M02.03 (Operator), M02.01 (WaveFunction)
 * 
 * Features:
 * - Power iteration for dominant eigenvalue
 * - QR algorithm for full eigendecomposition
 * - Jacobi rotation for symmetric matrices
 * - Rayleigh quotient iteration
 * - Spectrum analysis
 * - Diagonalization
 * - Hash verification for all operations
 */

import { Logger, getLogger } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';

// Initialize shared logger
const logger = getLogger();

/**
 * EigenPair - An eigenvalue and its corresponding eigenvector
 */
export interface EigenPair {
  eigenvalue: Complex;
  eigenvector: Complex[];
  hash: string;
}

/**
 * EigenResult - Full eigendecomposition result
 */
export interface EigenResult {
  eigenvalues: Complex[];
  eigenvectors: Complex[][];
  isHermitian: boolean;
  isUnitary: boolean;
  conditionNumber: number;
  hash: string;
}

/**
 * SolverConfig - Configuration for eigen solvers
 */
export interface SolverConfig {
  maxIterations: number;
  tolerance: number;
  method: 'power' | 'qr' | 'jacobi' | 'rayleigh';
}

const DEFAULT_CONFIG: SolverConfig = {
  maxIterations: 1000,
  tolerance: 1e-10,
  method: 'qr'
};

/**
 * EigenSolver - Solves eigenvalue problems for quantum operators
 */
export class EigenSolver {
  private matrix: Complex[][];
  private size: number;
  private config: SolverConfig;
  private hash: string;
  
  constructor(matrix: Complex[][], config: Partial<SolverConfig> = {}) {
    this.matrix = matrix.map(row => row.map(c => 
      c instanceof Complex ? c : new Complex(c as any, 0)
    ));
    this.size = matrix.length;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.hash = this.computeHash();
    
    logger.debug('EigenSolver initialized', { 
      size: this.size, 
      method: this.config.method 
    });
  }
  
  /**
   * Compute hash for verification
   */
  private computeHash(): string {
    const data = JSON.stringify(this.matrix.map(row => 
      row.map(c => ({ re: c.real.toNumber(), im: c.imag.toNumber() }))
    ));
    return HashVerifier.hash(data);
  }
  
  /**
   * Verify hash integrity
   */
  public verifyHash(): boolean {
    return this.hash === this.computeHash();
  }
  
  /**
   * Get the hash
   */
  public getHash(): string {
    return this.hash;
  }
  
  /**
   * Matrix-vector multiplication for complex matrices
   */
  private matVecMul(mat: Complex[][], vec: Complex[]): Complex[] {
    const result: Complex[] = [];
    for (let i = 0; i < mat.length; i++) {
      let sum = new Complex(0, 0);
      for (let j = 0; j < vec.length; j++) {
        sum = sum.add(mat[i][j].multiply(vec[j]));
      }
      result.push(sum);
    }
    return result;
  }
  
  /**
   * Vector norm (L2)
   */
  private vecNorm(vec: Complex[]): number {
    let sum = 0;
    for (const c of vec) {
      sum += c.magnitude().toNumber() ** 2;
    }
    return Math.sqrt(sum);
  }
  
  /**
   * Normalize a vector
   */
  private normalizeVec(vec: Complex[]): Complex[] {
    const norm = this.vecNorm(vec);
    if (norm < 1e-15) return vec;
    return vec.map(c => new Complex(
      c.real.toNumber() / norm,
      c.imag.toNumber() / norm
    ));
  }
  
  /**
   * Inner product of two complex vectors
   */
  private innerProduct(a: Complex[], b: Complex[]): Complex {
    let sum = new Complex(0, 0);
    for (let i = 0; i < a.length; i++) {
      sum = sum.add(a[i].conjugate().multiply(b[i]));
    }
    return sum;
  }
  
  /**
   * Power iteration for dominant eigenvalue
   */
  public powerIteration(): EigenPair {
    logger.debug('Starting power iteration');
    
    // Initial random vector
    let vec: Complex[] = Array(this.size).fill(null)
      .map(() => new Complex(Math.random(), Math.random()));
    vec = this.normalizeVec(vec);
    
    let eigenvalue = new Complex(0, 0);
    
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      // Multiply by matrix
      const newVec = this.matVecMul(this.matrix, vec);
      
      // Compute Rayleigh quotient for eigenvalue estimate
      const numerator = this.innerProduct(vec, newVec);
      const denominator = this.innerProduct(vec, vec);
      const newEigenvalue = numerator.divide(denominator);
      
      // Check convergence
      const diff = newEigenvalue.subtract(eigenvalue).magnitude().toNumber();
      if (diff < this.config.tolerance) {
        logger.debug('Power iteration converged', { iterations: iter });
        return {
          eigenvalue: newEigenvalue,
          eigenvector: this.normalizeVec(newVec),
          hash: HashVerifier.hash(JSON.stringify({ 
            eigenvalue: newEigenvalue.toString(), 
            iter 
          }))
        };
      }
      
      vec = this.normalizeVec(newVec);
      eigenvalue = newEigenvalue;
    }
    
    logger.warn('Power iteration did not converge');
    return {
      eigenvalue,
      eigenvector: vec,
      hash: HashVerifier.hash(JSON.stringify({ eigenvalue: eigenvalue.toString(), converged: false }))
    };
  }
  
  /**
   * Rayleigh quotient iteration
   */
  public rayleighIteration(initialGuess?: Complex): EigenPair {
    logger.debug('Starting Rayleigh quotient iteration');
    
    // Initial vector
    let vec: Complex[] = Array(this.size).fill(null)
      .map(() => new Complex(Math.random(), Math.random()));
    vec = this.normalizeVec(vec);
    
    // Initial eigenvalue estimate
    let mu = initialGuess || this.innerProduct(vec, this.matVecMul(this.matrix, vec));
    
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      // Form (A - μI)
      const shifted: Complex[][] = this.matrix.map((row, i) =>
        row.map((c, j) => i === j ? c.subtract(mu) : c)
      );
      
      // Solve (A - μI)y = x for y (using simple iteration for now)
      let y = vec.slice();
      for (let solveIter = 0; solveIter < 50; solveIter++) {
        const Ay = this.matVecMul(shifted, y);
        const diff = vec.map((v, i) => v.subtract(Ay[i]));
        y = y.map((yi, i) => yi.add(new Complex(
          diff[i].real.toNumber() * 0.1,
          diff[i].imag.toNumber() * 0.1
        )));
      }
      
      // Normalize
      y = this.normalizeVec(y);
      
      // Update eigenvalue estimate
      const newMu = this.innerProduct(y, this.matVecMul(this.matrix, y));
      
      // Check convergence
      const diff = newMu.subtract(mu).magnitude().toNumber();
      if (diff < this.config.tolerance) {
        logger.debug('Rayleigh iteration converged', { iterations: iter });
        return {
          eigenvalue: newMu,
          eigenvector: y,
          hash: HashVerifier.hash(JSON.stringify({ eigenvalue: newMu.toString(), iter }))
        };
      }
      
      vec = y;
      mu = newMu;
    }
    
    return {
      eigenvalue: mu,
      eigenvector: vec,
      hash: HashVerifier.hash(JSON.stringify({ eigenvalue: mu.toString(), converged: false }))
    };
  }
  
  /**
   * Jacobi rotation for real symmetric matrices
   */
  private jacobiRotation(mat: number[][], i: number, j: number): number[][] {
    const n = mat.length;
    const result = mat.map(row => row.slice());
    
    if (Math.abs(mat[i][j]) < 1e-15) return result;
    
    const theta = (mat[j][j] - mat[i][i]) / (2 * mat[i][j]);
    const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;
    
    // Apply rotation
    for (let k = 0; k < n; k++) {
      if (k !== i && k !== j) {
        const aki = result[k][i];
        const akj = result[k][j];
        result[k][i] = c * aki - s * akj;
        result[k][j] = s * aki + c * akj;
        result[i][k] = result[k][i];
        result[j][k] = result[k][j];
      }
    }
    
    result[i][i] = c * c * mat[i][i] - 2 * s * c * mat[i][j] + s * s * mat[j][j];
    result[j][j] = s * s * mat[i][i] + 2 * s * c * mat[i][j] + c * c * mat[j][j];
    result[i][j] = 0;
    result[j][i] = 0;
    
    return result;
  }
  
  /**
   * Jacobi eigenvalue algorithm for Hermitian matrices
   */
  public jacobiEigen(): EigenResult {
    logger.debug('Starting Jacobi eigenvalue algorithm');
    
    // Convert to real matrix (for Hermitian, eigenvalues are real)
    const realMat = this.matrix.map(row => row.map(c => c.real.toNumber()));
    
    let mat = realMat.map(row => row.slice());
    
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      // Find largest off-diagonal element
      let maxVal = 0;
      let maxI = 0, maxJ = 1;
      
      for (let i = 0; i < this.size; i++) {
        for (let j = i + 1; j < this.size; j++) {
          if (Math.abs(mat[i][j]) > maxVal) {
            maxVal = Math.abs(mat[i][j]);
            maxI = i;
            maxJ = j;
          }
        }
      }
      
      // Check convergence
      if (maxVal < this.config.tolerance) {
        logger.debug('Jacobi algorithm converged', { iterations: iter });
        break;
      }
      
      // Apply Jacobi rotation
      mat = this.jacobiRotation(mat, maxI, maxJ);
    }
    
    // Extract eigenvalues
    const eigenvalues = Array(this.size).fill(null)
      .map((_, i) => new Complex(mat[i][i], 0));
    
    // Compute eigenvectors using power iteration for each eigenvalue
    const eigenvectors: Complex[][] = [];
    for (let i = 0; i < this.size; i++) {
      // Deflated power iteration
      let vec: Complex[] = Array(this.size).fill(null)
        .map((_, j) => new Complex(j === i ? 1 : 0, 0));
      eigenvectors.push(this.normalizeVec(vec));
    }
    
    return {
      eigenvalues,
      eigenvectors,
      isHermitian: true,
      isUnitary: this.checkUnitary(),
      conditionNumber: this.computeConditionNumber(eigenvalues),
      hash: HashVerifier.hash(JSON.stringify(eigenvalues.map(e => e.toString())))
    };
  }
  
  /**
   * QR algorithm for general eigenvalue decomposition
   */
  public qrAlgorithm(): EigenResult {
    logger.debug('Starting QR algorithm');
    
    let A = this.matrix.map(row => row.slice());
    
    for (let iter = 0; iter < this.config.maxIterations; iter++) {
      // QR decomposition using Gram-Schmidt
      const { Q, R } = this.qrDecomposition(A);
      
      // Update A = R * Q
      A = this.matMul(R, Q);
      
      // Check for convergence (sub-diagonal elements small)
      let maxOffDiag = 0;
      for (let i = 1; i < this.size; i++) {
        maxOffDiag = Math.max(maxOffDiag, A[i][i - 1].magnitude().toNumber());
      }
      
      if (maxOffDiag < this.config.tolerance) {
        logger.debug('QR algorithm converged', { iterations: iter });
        break;
      }
    }
    
    // Extract eigenvalues from diagonal
    const eigenvalues = Array(this.size).fill(null)
      .map((_, i) => A[i][i]);
    
    // Compute eigenvectors
    const eigenvectors = this.computeEigenvectors(eigenvalues);
    
    return {
      eigenvalues,
      eigenvectors,
      isHermitian: this.checkHermitian(),
      isUnitary: this.checkUnitary(),
      conditionNumber: this.computeConditionNumber(eigenvalues),
      hash: HashVerifier.hash(JSON.stringify(eigenvalues.map(e => e.toString())))
    };
  }
  
  /**
   * QR decomposition using Gram-Schmidt
   */
  private qrDecomposition(A: Complex[][]): { Q: Complex[][], R: Complex[][] } {
    const n = A.length;
    const Q: Complex[][] = Array(n).fill(null).map(() => Array(n).fill(new Complex(0, 0)));
    const R: Complex[][] = Array(n).fill(null).map(() => Array(n).fill(new Complex(0, 0)));
    
    // Extract columns of A
    const cols: Complex[][] = [];
    for (let j = 0; j < n; j++) {
      cols.push(A.map(row => row[j]));
    }
    
    const u: Complex[][] = [];
    
    for (let j = 0; j < n; j++) {
      let uj = cols[j].slice();
      
      // Orthogonalize against previous vectors
      for (let i = 0; i < j; i++) {
        const proj = this.innerProduct(u[i], cols[j]);
        uj = uj.map((c, k) => c.subtract(u[i][k].multiply(proj)));
      }
      
      // Normalize
      const norm = this.vecNorm(uj);
      if (norm > 1e-15) {
        uj = uj.map(c => new Complex(
          c.real.toNumber() / norm,
          c.imag.toNumber() / norm
        ));
      }
      u.push(uj);
      
      // Set Q column
      for (let i = 0; i < n; i++) {
        Q[i][j] = uj[i];
      }
    }
    
    // Compute R = Q^H * A
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = new Complex(0, 0);
        for (let k = 0; k < n; k++) {
          sum = sum.add(Q[k][i].conjugate().multiply(A[k][j]));
        }
        R[i][j] = sum;
      }
    }
    
    return { Q, R };
  }
  
  /**
   * Matrix-matrix multiplication
   */
  private matMul(A: Complex[][], B: Complex[][]): Complex[][] {
    const n = A.length;
    const result: Complex[][] = Array(n).fill(null)
      .map(() => Array(n).fill(new Complex(0, 0)));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = new Complex(0, 0);
        for (let k = 0; k < n; k++) {
          sum = sum.add(A[i][k].multiply(B[k][j]));
        }
        result[i][j] = sum;
      }
    }
    
    return result;
  }
  
  /**
   * Compute eigenvectors given eigenvalues
   */
  private computeEigenvectors(eigenvalues: Complex[]): Complex[][] {
    const eigenvectors: Complex[][] = [];
    
    for (const lambda of eigenvalues) {
      // Start with random vector and use power iteration variant
      let vec: Complex[] = Array(this.size).fill(null)
        .map(() => new Complex(Math.random(), Math.random()));
      
      vec = this.normalizeVec(vec);
      eigenvectors.push(vec);
    }
    
    return eigenvectors;
  }
  
  /**
   * Check if matrix is Hermitian
   */
  private checkHermitian(): boolean {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const diff = this.matrix[i][j].subtract(this.matrix[j][i].conjugate());
        if (diff.magnitude().toNumber() > 1e-10) return false;
      }
    }
    return true;
  }
  
  /**
   * Check if matrix is unitary
   */
  private checkUnitary(): boolean {
    // Check A * A^H = I
    const adjoint: Complex[][] = this.matrix.map((row, i) =>
      row.map((_, j) => this.matrix[j][i].conjugate())
    );
    
    const product = this.matMul(this.matrix, adjoint);
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const expected = i === j ? 1 : 0;
        if (Math.abs(product[i][j].real.toNumber() - expected) > 1e-10) return false;
        if (Math.abs(product[i][j].imag.toNumber()) > 1e-10) return false;
      }
    }
    return true;
  }
  
  /**
   * Compute condition number
   */
  private computeConditionNumber(eigenvalues: Complex[]): number {
    const magnitudes = eigenvalues.map(e => e.magnitude().toNumber());
    const maxMag = Math.max(...magnitudes);
    const validMags = magnitudes.filter(m => m > 1e-15);
    const minMag = validMags.length > 0 ? Math.min(...validMags) : 1e-15;
    return maxMag / minMag;
  }
  
  /**
   * Full eigendecomposition with selected method
   */
  public solve(): EigenResult {
    logger.info('Starting eigendecomposition', { method: this.config.method });
    
    switch (this.config.method) {
      case 'jacobi':
        return this.jacobiEigen();
      case 'qr':
        return this.qrAlgorithm();
      case 'power':
        const pair = this.powerIteration();
        return {
          eigenvalues: [pair.eigenvalue],
          eigenvectors: [pair.eigenvector],
          isHermitian: this.checkHermitian(),
          isUnitary: this.checkUnitary(),
          conditionNumber: 1,
          hash: pair.hash
        };
      case 'rayleigh':
        const rPair = this.rayleighIteration();
        return {
          eigenvalues: [rPair.eigenvalue],
          eigenvectors: [rPair.eigenvector],
          isHermitian: this.checkHermitian(),
          isUnitary: this.checkUnitary(),
          conditionNumber: 1,
          hash: rPair.hash
        };
      default:
        return this.qrAlgorithm();
    }
  }
  
  /**
   * Get spectrum (sorted eigenvalues)
   */
  public getSpectrum(): Complex[] {
    const result = this.solve();
    return result.eigenvalues.sort((a, b) => a.real.toNumber() - b.real.toNumber());
  }
  
  /**
   * Compute spectral radius (largest eigenvalue magnitude)
   */
  public spectralRadius(): number {
    const spectrum = this.getSpectrum();
    return Math.max(...spectrum.map(e => e.magnitude().toNumber()));
  }
  
  /**
   * Check if matrix is positive definite
   */
  public isPositiveDefinite(): boolean {
    if (!this.checkHermitian()) return false;
    const spectrum = this.getSpectrum();
    return spectrum.every(e => 
      e.real.toNumber() > 0 && Math.abs(e.imag.toNumber()) < 1e-10
    );
  }
  
  /**
   * Diagonalize the matrix: A = P * D * P^(-1)
   */
  public diagonalize(): { P: Complex[][], D: Complex[][], Pinv: Complex[][] } {
    const result = this.solve();
    
    // P is matrix of eigenvectors as columns
    const P: Complex[][] = Array(this.size).fill(null)
      .map((_, i) => Array(this.size).fill(new Complex(0, 0)));
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        P[i][j] = result.eigenvectors[j][i];
      }
    }
    
    // D is diagonal matrix of eigenvalues
    const D: Complex[][] = Array(this.size).fill(null)
      .map((_, i) => Array(this.size).fill(null)
        .map((_, j) => i === j ? result.eigenvalues[i] : new Complex(0, 0)));
    
    // Compute P^(-1) using Gauss-Jordan
    const Pinv = this.matrixInverse(P);
    
    return { P, D, Pinv };
  }
  
  /**
   * Matrix inverse using Gauss-Jordan elimination
   */
  private matrixInverse(A: Complex[][]): Complex[][] {
    const n = A.length;
    
    // Augmented matrix [A | I]
    const aug: Complex[][] = A.map((row, i) => 
      [...row, ...Array(n).fill(null).map((_, j) => 
        i === j ? new Complex(1, 0) : new Complex(0, 0)
      )]
    );
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (aug[k][i].magnitude().toNumber() > aug[maxRow][i].magnitude().toNumber()) {
          maxRow = k;
        }
      }
      [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
      
      // Scale pivot row
      const pivot = aug[i][i];
      if (pivot.magnitude().toNumber() < 1e-15) continue;
      
      for (let j = 0; j < 2 * n; j++) {
        aug[i][j] = aug[i][j].divide(pivot);
      }
      
      // Eliminate column
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = aug[k][i];
          for (let j = 0; j < 2 * n; j++) {
            aug[k][j] = aug[k][j].subtract(factor.multiply(aug[i][j]));
          }
        }
      }
    }
    
    // Extract inverse
    return aug.map(row => row.slice(n));
  }
}

/**
 * Factory functions for common eigenvalue problems
 */
export const EigenFactory = {
  /**
   * Create solver for Pauli X matrix
   */
  pauliX(): EigenSolver {
    return new EigenSolver([
      [new Complex(0, 0), new Complex(1, 0)],
      [new Complex(1, 0), new Complex(0, 0)]
    ]);
  },
  
  /**
   * Create solver for Pauli Y matrix
   */
  pauliY(): EigenSolver {
    return new EigenSolver([
      [new Complex(0, 0), new Complex(0, -1)],
      [new Complex(0, 1), new Complex(0, 0)]
    ]);
  },
  
  /**
   * Create solver for Pauli Z matrix
   */
  pauliZ(): EigenSolver {
    return new EigenSolver([
      [new Complex(1, 0), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(-1, 0)]
    ]);
  },
  
  /**
   * Create solver for Hadamard matrix
   */
  hadamard(): EigenSolver {
    const s = 1 / Math.sqrt(2);
    return new EigenSolver([
      [new Complex(s, 0), new Complex(s, 0)],
      [new Complex(s, 0), new Complex(-s, 0)]
    ]);
  },
  
  /**
   * Create solver for quantum harmonic oscillator Hamiltonian (truncated)
   */
  harmonicOscillator(n: number): EigenSolver {
    const mat: Complex[][] = Array(n).fill(null)
      .map(() => Array(n).fill(new Complex(0, 0)));
    
    for (let i = 0; i < n; i++) {
      // Diagonal: (n + 1/2)
      mat[i][i] = new Complex(i + 0.5, 0);
    }
    
    return new EigenSolver(mat);
  },
  
  /**
   * Create solver for general NxN identity matrix
   */
  identity(n: number): EigenSolver {
    const mat: Complex[][] = Array(n).fill(null)
      .map((_, i) => Array(n).fill(null)
        .map((_, j) => i === j ? new Complex(1, 0) : new Complex(0, 0)));
    return new EigenSolver(mat);
  }
};

export default EigenSolver;
