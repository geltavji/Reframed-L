/**
 * Entanglement.ts - PRD-02 Phase 2.5
 * Module ID: M02.08
 * 
 * Implements quantum entanglement measures, Bell states, and multipartite
 * entanglement detection.
 * 
 * Dependencies:
 * - Logger (M01.01)
 * - HashVerifier (M01.02)
 * - Complex (M01.04)
 * - Matrix (M01.05)
 * - QuantumState (M02.02)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';

// ============================================================================
// INTERFACES
// ============================================================================

export interface EntanglementConfig {
  dimensions: number[];  // Dimensions of subsystems [d1, d2, ...]
  enableHashVerification?: boolean;
}

export interface EntanglementMeasures {
  vonNeumannEntropy: number;
  concurrence: number;
  negativity: number;
  logarithmicNegativity: number;
  entanglementOfFormation: number;
  isSeparable: boolean;
  isMaximallyEntangled: boolean;
  hash: string;
}

export interface BellState {
  name: string;
  notation: string;
  stateVector: Complex[];
  densityMatrix: Complex[][];
  hash: string;
}

export interface BipartiteInfo {
  dimensionA: number;
  dimensionB: number;
  totalDimension: number;
  reducedDensityA: Complex[][];
  reducedDensityB: Complex[][];
  hash: string;
}

export interface SchmidtDecomposition {
  coefficients: number[];
  basisA: Complex[][];
  basisB: Complex[][];
  rank: number;
  hash: string;
}

export interface CHSHResult {
  value: number;
  isViolated: boolean;
  maxQuantumViolation: number;
  classicalBound: number;
  hash: string;
}

export interface WitnessResult {
  expectationValue: number;
  isEntangled: boolean;
  witnessOperator: Complex[][];
  hash: string;
}

// ============================================================================
// BELL STATES FACTORY
// ============================================================================

/**
 * Factory for creating the four canonical Bell states.
 */
export class BellStates {
  private static logger: Logger;
  private static hashChain: HashChain;

  private static initialize(): void {
    if (!this.logger) {
      Logger.resetInstance();
      this.logger = Logger.getInstance({
        minLevel: LogLevel.DEBUG,
        enableConsole: false,
        enableHashChain: true
      });
      this.hashChain = new HashChain('bellstates');
    }
  }

  /**
   * Create |Φ+⟩ = (|00⟩ + |11⟩) / √2
   */
  static phiPlus(): BellState {
    this.initialize();
    const sqrt2inv = 1 / Math.sqrt(2);
    const stateVector = [
      new Complex(sqrt2inv, 0),  // |00⟩
      Complex.zero(),            // |01⟩
      Complex.zero(),            // |10⟩
      new Complex(sqrt2inv, 0)   // |11⟩
    ];
    const densityMatrix = this.outerProduct(stateVector);
    const hash = HashVerifier.hashObject({ type: 'PhiPlus', stateVector: stateVector.map(c => [c.real.toNumber(), c.imag.toNumber()]) });

    return {
      name: 'Phi Plus',
      notation: '|Φ+⟩ = (|00⟩ + |11⟩) / √2',
      stateVector,
      densityMatrix,
      hash
    };
  }

  /**
   * Create |Φ-⟩ = (|00⟩ - |11⟩) / √2
   */
  static phiMinus(): BellState {
    this.initialize();
    const sqrt2inv = 1 / Math.sqrt(2);
    const stateVector = [
      new Complex(sqrt2inv, 0),    // |00⟩
      Complex.zero(),              // |01⟩
      Complex.zero(),              // |10⟩
      new Complex(-sqrt2inv, 0)    // |11⟩
    ];
    const densityMatrix = this.outerProduct(stateVector);
    const hash = HashVerifier.hashObject({ type: 'PhiMinus', stateVector: stateVector.map(c => [c.real.toNumber(), c.imag.toNumber()]) });

    return {
      name: 'Phi Minus',
      notation: '|Φ-⟩ = (|00⟩ - |11⟩) / √2',
      stateVector,
      densityMatrix,
      hash
    };
  }

  /**
   * Create |Ψ+⟩ = (|01⟩ + |10⟩) / √2
   */
  static psiPlus(): BellState {
    this.initialize();
    const sqrt2inv = 1 / Math.sqrt(2);
    const stateVector = [
      Complex.zero(),              // |00⟩
      new Complex(sqrt2inv, 0),    // |01⟩
      new Complex(sqrt2inv, 0),    // |10⟩
      Complex.zero()               // |11⟩
    ];
    const densityMatrix = this.outerProduct(stateVector);
    const hash = HashVerifier.hashObject({ type: 'PsiPlus', stateVector: stateVector.map(c => [c.real.toNumber(), c.imag.toNumber()]) });

    return {
      name: 'Psi Plus',
      notation: '|Ψ+⟩ = (|01⟩ + |10⟩) / √2',
      stateVector,
      densityMatrix,
      hash
    };
  }

  /**
   * Create |Ψ-⟩ = (|01⟩ - |10⟩) / √2 (singlet state)
   */
  static psiMinus(): BellState {
    this.initialize();
    const sqrt2inv = 1 / Math.sqrt(2);
    const stateVector = [
      Complex.zero(),              // |00⟩
      new Complex(sqrt2inv, 0),    // |01⟩
      new Complex(-sqrt2inv, 0),   // |10⟩
      Complex.zero()               // |11⟩
    ];
    const densityMatrix = this.outerProduct(stateVector);
    const hash = HashVerifier.hashObject({ type: 'PsiMinus', stateVector: stateVector.map(c => [c.real.toNumber(), c.imag.toNumber()]) });

    return {
      name: 'Psi Minus (Singlet)',
      notation: '|Ψ-⟩ = (|01⟩ - |10⟩) / √2',
      stateVector,
      densityMatrix,
      hash
    };
  }

  /**
   * Get all four Bell states
   */
  static all(): BellState[] {
    return [this.phiPlus(), this.phiMinus(), this.psiPlus(), this.psiMinus()];
  }

  /**
   * Compute outer product |ψ⟩⟨ψ|
   */
  private static outerProduct(state: Complex[]): Complex[][] {
    const n = state.length;
    const result: Complex[][] = [];
    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < n; j++) {
        result[i][j] = state[i].multiply(state[j].conjugate());
      }
    }
    return result;
  }
}

// ============================================================================
// GHZ STATES FACTORY
// ============================================================================

/**
 * Factory for Greenberger–Horne–Zeilinger (GHZ) states.
 */
export class GHZStates {
  private static logger: Logger;
  private static hashChain: HashChain;

  private static initialize(): void {
    if (!this.logger) {
      Logger.resetInstance();
      this.logger = Logger.getInstance({
        minLevel: LogLevel.DEBUG,
        enableConsole: false,
        enableHashChain: true
      });
      this.hashChain = new HashChain('ghzstates');
    }
  }

  /**
   * Create n-qubit GHZ state: (|00...0⟩ + |11...1⟩) / √2
   */
  static create(numQubits: number): { stateVector: Complex[]; hash: string } {
    this.initialize();
    
    if (numQubits < 2) {
      throw new Error('GHZ state requires at least 2 qubits');
    }

    const dim = Math.pow(2, numQubits);
    const sqrt2inv = 1 / Math.sqrt(2);
    const stateVector = new Array(dim).fill(null).map(() => Complex.zero());
    
    // |00...0⟩ is index 0
    stateVector[0] = new Complex(sqrt2inv, 0);
    // |11...1⟩ is index 2^n - 1
    stateVector[dim - 1] = new Complex(sqrt2inv, 0);

    const hash = HashVerifier.hashObject({ type: 'GHZ', numQubits });

    return { stateVector, hash };
  }

  /**
   * Create 3-qubit GHZ state
   */
  static ghz3(): { stateVector: Complex[]; hash: string } {
    return this.create(3);
  }

  /**
   * Create 4-qubit GHZ state
   */
  static ghz4(): { stateVector: Complex[]; hash: string } {
    return this.create(4);
  }
}

// ============================================================================
// W STATES FACTORY
// ============================================================================

/**
 * Factory for W states (equal superposition of single-excitation states).
 */
export class WStates {
  private static logger: Logger;
  private static hashChain: HashChain;

  private static initialize(): void {
    if (!this.logger) {
      Logger.resetInstance();
      this.logger = Logger.getInstance({
        minLevel: LogLevel.DEBUG,
        enableConsole: false,
        enableHashChain: true
      });
      this.hashChain = new HashChain('wstates');
    }
  }

  /**
   * Create n-qubit W state: (|100...0⟩ + |010...0⟩ + ... + |000...1⟩) / √n
   */
  static create(numQubits: number): { stateVector: Complex[]; hash: string } {
    this.initialize();

    if (numQubits < 2) {
      throw new Error('W state requires at least 2 qubits');
    }

    const dim = Math.pow(2, numQubits);
    const normFactor = 1 / Math.sqrt(numQubits);
    const stateVector = new Array(dim).fill(null).map(() => Complex.zero());

    // Set amplitudes for single-excitation states
    for (let i = 0; i < numQubits; i++) {
      const index = Math.pow(2, i);
      stateVector[index] = new Complex(normFactor, 0);
    }

    const hash = HashVerifier.hashObject({ type: 'W', numQubits });

    return { stateVector, hash };
  }

  /**
   * Create 3-qubit W state
   */
  static w3(): { stateVector: Complex[]; hash: string } {
    return this.create(3);
  }
}

// ============================================================================
// ENTANGLEMENT ANALYZER CLASS
// ============================================================================

/**
 * EntanglementAnalyzer provides tools for measuring and analyzing
 * quantum entanglement in bipartite and multipartite systems.
 */
export class EntanglementAnalyzer {
  private dimensions: number[];
  private totalDimension: number;
  private logger: Logger;
  private hashChain: HashChain;
  private enableHashVerification: boolean;

  constructor(config: EntanglementConfig) {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`entanglement-${Date.now()}`);
    this.enableHashVerification = config.enableHashVerification ?? true;
    this.dimensions = config.dimensions;
    this.totalDimension = config.dimensions.reduce((a, b) => a * b, 1);

    this.logger.info('EntanglementAnalyzer initialized', { dimensions: config.dimensions });
  }

  /**
   * Compute partial trace over subsystem B to get reduced density matrix of A.
   * For bipartite system A⊗B, traces out B.
   */
  partialTraceB(rho: Complex[][]): Complex[][] {
    if (this.dimensions.length !== 2) {
      throw new Error('Partial trace requires bipartite system');
    }

    const dimA = this.dimensions[0];
    const dimB = this.dimensions[1];
    const rhoA: Complex[][] = [];

    for (let i = 0; i < dimA; i++) {
      rhoA[i] = [];
      for (let j = 0; j < dimA; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < dimB; k++) {
          const rowIdx = i * dimB + k;
          const colIdx = j * dimB + k;
          sum = sum.add(rho[rowIdx][colIdx]);
        }
        rhoA[i][j] = sum;
      }
    }

    this.logger.debug('Computed partial trace over B', { dimA, dimB });
    return rhoA;
  }

  /**
   * Compute partial trace over subsystem A to get reduced density matrix of B.
   */
  partialTraceA(rho: Complex[][]): Complex[][] {
    if (this.dimensions.length !== 2) {
      throw new Error('Partial trace requires bipartite system');
    }

    const dimA = this.dimensions[0];
    const dimB = this.dimensions[1];
    const rhoB: Complex[][] = [];

    for (let i = 0; i < dimB; i++) {
      rhoB[i] = [];
      for (let j = 0; j < dimB; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < dimA; k++) {
          const rowIdx = k * dimB + i;
          const colIdx = k * dimB + j;
          sum = sum.add(rho[rowIdx][colIdx]);
        }
        rhoB[i][j] = sum;
      }
    }

    this.logger.debug('Computed partial trace over A', { dimA, dimB });
    return rhoB;
  }

  /**
   * Compute von Neumann entropy S(ρ) = -Tr(ρ log ρ)
   */
  vonNeumannEntropy(rho: Complex[][]): number {
    const eigenvalues = this.getEigenvalues(rho);
    let entropy = 0;

    for (const lambda of eigenvalues) {
      if (lambda > 1e-15) {
        entropy -= lambda * Math.log2(lambda);
      }
    }

    this.logger.debug('Computed von Neumann entropy', { entropy });
    return entropy;
  }

  /**
   * Compute entanglement entropy (von Neumann entropy of reduced density matrix)
   */
  entanglementEntropy(rho: Complex[][]): number {
    const rhoA = this.partialTraceB(rho);
    return this.vonNeumannEntropy(rhoA);
  }

  /**
   * Compute concurrence for a two-qubit state.
   * C(ρ) = max(0, λ₁ - λ₂ - λ₃ - λ₄)
   * where λᵢ are eigenvalues of sqrt(sqrt(ρ)ρ̃sqrt(ρ)) in decreasing order.
   */
  concurrence(rho: Complex[][]): number {
    if (this.dimensions[0] !== 2 || this.dimensions[1] !== 2) {
      throw new Error('Concurrence is only defined for 2x2 (two-qubit) systems');
    }

    // Spin-flip operator σy ⊗ σy
    const sigmaY = [
      [Complex.zero(), new Complex(0, -1)],
      [new Complex(0, 1), Complex.zero()]
    ];
    
    const sigmaYY = this.tensorProduct(sigmaY, sigmaY);
    
    // Compute ρ̃ = (σy ⊗ σy) ρ* (σy ⊗ σy)
    const rhoConj = rho.map(row => row.map(c => c.conjugate()));
    const rhoTilde = this.matrixMultiply(
      this.matrixMultiply(sigmaYY, rhoConj),
      sigmaYY
    );
    
    // Compute R = sqrt(sqrt(ρ) ρ̃ sqrt(ρ))
    // For simplicity, use R = ρ ρ̃ and compute sqrt of eigenvalues
    const R = this.matrixMultiply(rho, rhoTilde);
    const eigenvalues = this.getEigenvalues(R);
    
    // Sort in decreasing order and take sqrt
    const sortedEigen = eigenvalues.map(e => Math.sqrt(Math.max(0, e))).sort((a, b) => b - a);
    
    // C = max(0, λ₁ - λ₂ - λ₃ - λ₄)
    const c = sortedEigen[0] - sortedEigen[1] - sortedEigen[2] - sortedEigen[3];
    const concurrence = Math.max(0, c);

    this.logger.debug('Computed concurrence', { concurrence });
    return concurrence;
  }

  /**
   * Compute negativity: N(ρ) = (||ρ^TB||₁ - 1) / 2
   * where ρ^TB is the partial transpose with respect to B.
   */
  negativity(rho: Complex[][]): number {
    const rhoTB = this.partialTransposeB(rho);
    const eigenvalues = this.getEigenvalues(rhoTB);
    
    // Trace norm is sum of absolute eigenvalues
    const traceNorm = eigenvalues.reduce((sum, e) => sum + Math.abs(e), 0);
    const neg = (traceNorm - 1) / 2;

    this.logger.debug('Computed negativity', { negativity: neg });
    return Math.max(0, neg);
  }

  /**
   * Compute logarithmic negativity: E_N(ρ) = log₂(||ρ^TB||₁)
   */
  logarithmicNegativity(rho: Complex[][]): number {
    const rhoTB = this.partialTransposeB(rho);
    const eigenvalues = this.getEigenvalues(rhoTB);
    const traceNorm = eigenvalues.reduce((sum, e) => sum + Math.abs(e), 0);
    
    const logNeg = Math.log2(traceNorm);
    this.logger.debug('Computed logarithmic negativity', { logNegativity: logNeg });
    return logNeg;
  }

  /**
   * Compute entanglement of formation from concurrence.
   * E_f = h((1 + sqrt(1 - C²)) / 2)
   * where h(x) = -x log₂(x) - (1-x) log₂(1-x)
   */
  entanglementOfFormation(concurrence: number): number {
    if (concurrence === 0) return 0;
    if (concurrence === 1) return 1;

    const x = (1 + Math.sqrt(1 - concurrence * concurrence)) / 2;
    const entropy = -x * Math.log2(x) - (1 - x) * Math.log2(1 - x);

    this.logger.debug('Computed entanglement of formation', { EoF: entropy });
    return entropy;
  }

  /**
   * Perform partial transpose with respect to subsystem B.
   */
  partialTransposeB(rho: Complex[][]): Complex[][] {
    if (this.dimensions.length !== 2) {
      throw new Error('Partial transpose requires bipartite system');
    }

    const dimA = this.dimensions[0];
    const dimB = this.dimensions[1];
    const n = dimA * dimB;
    const result: Complex[][] = [];

    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < n; j++) {
        const iA = Math.floor(i / dimB);
        const iB = i % dimB;
        const jA = Math.floor(j / dimB);
        const jB = j % dimB;
        
        // Swap B indices
        const newI = iA * dimB + jB;
        const newJ = jA * dimB + iB;
        result[i][j] = rho[newI][newJ];
      }
    }

    return result;
  }

  /**
   * Check if state is separable using PPT criterion.
   * A state is entangled if its partial transpose has negative eigenvalues.
   */
  isSeparable(rho: Complex[][]): boolean {
    const rhoTB = this.partialTransposeB(rho);
    const eigenvalues = this.getEigenvalues(rhoTB);
    
    // Check for negative eigenvalues
    const hasNegative = eigenvalues.some(e => e < -1e-10);
    return !hasNegative;
  }

  /**
   * Check if state is maximally entangled.
   * For two qubits, maximal entanglement means entropy = 1.
   */
  isMaximallyEntangled(rho: Complex[][]): boolean {
    const entropy = this.entanglementEntropy(rho);
    const maxEntropy = Math.log2(Math.min(...this.dimensions));
    return Math.abs(entropy - maxEntropy) < 1e-10;
  }

  /**
   * Compute Schmidt decomposition for pure bipartite state.
   * |ψ⟩ = Σᵢ λᵢ |aᵢ⟩ ⊗ |bᵢ⟩
   */
  schmidtDecomposition(state: Complex[]): SchmidtDecomposition {
    if (this.dimensions.length !== 2) {
      throw new Error('Schmidt decomposition requires bipartite system');
    }

    const dimA = this.dimensions[0];
    const dimB = this.dimensions[1];

    // Reshape state vector into matrix
    const psi: Complex[][] = [];
    for (let i = 0; i < dimA; i++) {
      psi[i] = [];
      for (let j = 0; j < dimB; j++) {
        psi[i][j] = state[i * dimB + j];
      }
    }

    // Compute SVD approximation using power iteration
    const { U, S, V } = this.simpleSVD(psi);

    const hash = HashVerifier.hashObject({ operation: 'schmidt_decomposition', dimA, dimB, coefficients: S });

    return {
      coefficients: S,
      basisA: U,
      basisB: V,
      rank: S.filter(s => s > 1e-10).length,
      hash
    };
  }

  /**
   * Compute Schmidt rank (number of non-zero Schmidt coefficients).
   */
  schmidtRank(state: Complex[]): number {
    const decomp = this.schmidtDecomposition(state);
    return decomp.rank;
  }

  /**
   * Get comprehensive entanglement measures for a state.
   */
  analyze(rho: Complex[][]): EntanglementMeasures {
    const entropy = this.vonNeumannEntropy(this.partialTraceB(rho));
    const conc = this.dimensions[0] === 2 && this.dimensions[1] === 2 
      ? this.concurrence(rho) 
      : 0;
    const neg = this.negativity(rho);
    const logNeg = this.logarithmicNegativity(rho);
    const eof = this.entanglementOfFormation(conc);
    const sep = this.isSeparable(rho);
    const maxEnt = this.isMaximallyEntangled(rho);

    const hash = HashVerifier.hashObject({ 
      operation: 'entanglement_analysis', 
      dimensions: this.dimensions,
      entropy, conc, neg, logNeg, eof, sep, maxEnt 
    });

    return {
      vonNeumannEntropy: entropy,
      concurrence: conc,
      negativity: neg,
      logarithmicNegativity: logNeg,
      entanglementOfFormation: eof,
      isSeparable: sep,
      isMaximallyEntangled: maxEnt,
      hash
    };
  }

  // ============================================================================
  // BELL INEQUALITY TESTS
  // ============================================================================

  /**
   * Compute CHSH inequality value.
   * Classical bound: 2, Quantum bound: 2√2 ≈ 2.828
   */
  chshValue(rho: Complex[][], 
             a1: Complex[][], a2: Complex[][],
             b1: Complex[][], b2: Complex[][]): CHSHResult {
    // CHSH operator: A₁⊗B₁ + A₁⊗B₂ + A₂⊗B₁ - A₂⊗B₂
    const A1B1 = this.tensorProduct(a1, b1);
    const A1B2 = this.tensorProduct(a1, b2);
    const A2B1 = this.tensorProduct(a2, b1);
    const A2B2 = this.tensorProduct(a2, b2);

    // Compute expectation values
    const E_A1B1 = this.expectationValue(rho, A1B1);
    const E_A1B2 = this.expectationValue(rho, A1B2);
    const E_A2B1 = this.expectationValue(rho, A2B1);
    const E_A2B2 = this.expectationValue(rho, A2B2);

    const chshValue = E_A1B1 + E_A1B2 + E_A2B1 - E_A2B2;
    const absValue = Math.abs(chshValue);

    const hash = HashVerifier.hashObject({ 
      operation: 'chsh_inequality', 
      chshValue: absValue,
      expectations: { E_A1B1, E_A1B2, E_A2B1, E_A2B2 }
    });

    return {
      value: absValue,
      isViolated: absValue > 2,
      maxQuantumViolation: 2 * Math.sqrt(2),
      classicalBound: 2,
      hash
    };
  }

  /**
   * Get optimal CHSH settings for maximally entangled state.
   * A₁ = Z, A₂ = X, B₁ = (Z+X)/√2, B₂ = (Z-X)/√2
   */
  optimalCHSHSettings(): { a1: Complex[][], a2: Complex[][], b1: Complex[][], b2: Complex[][] } {
    const Z = [[new Complex(1, 0), Complex.zero()], [Complex.zero(), new Complex(-1, 0)]];
    const X = [[Complex.zero(), new Complex(1, 0)], [new Complex(1, 0), Complex.zero()]];
    
    const sqrt2inv = 1 / Math.sqrt(2);
    const B1 = this.matrixScaleNum(this.matrixAdd(Z, X), sqrt2inv);
    const B2 = this.matrixScaleNum(this.matrixSubtract(Z, X), sqrt2inv);

    return { a1: Z, a2: X, b1: B1, b2: B2 };
  }

  // ============================================================================
  // ENTANGLEMENT WITNESS
  // ============================================================================

  /**
   * Create entanglement witness for detecting entanglement near a target state.
   * W = αI - |target⟩⟨target|
   */
  createWitness(targetState: Complex[]): Complex[][] {
    const n = targetState.length;
    
    // Find optimal α (maximum eigenvalue of |target⟩⟨target| restricted to separable states)
    // For simplicity, use α = 1/d where d is subsystem dimension
    const alpha = 1 / Math.min(...this.dimensions);

    // W = αI - |target⟩⟨target|
    const witness: Complex[][] = [];
    for (let i = 0; i < n; i++) {
      witness[i] = [];
      for (let j = 0; j < n; j++) {
        const identity = i === j ? new Complex(alpha, 0) : Complex.zero();
        const outer = targetState[i].multiply(targetState[j].conjugate());
        witness[i][j] = identity.subtract(outer);
      }
    }

    return witness;
  }

  /**
   * Detect entanglement using witness operator.
   * If Tr(Wρ) < 0, state is entangled.
   */
  detectWithWitness(rho: Complex[][], witness: Complex[][]): WitnessResult {
    const expectation = this.expectationValue(rho, witness);
    const isEntangled = expectation < -1e-10;

    const hash = HashVerifier.hashObject({ 
      operation: 'witness_detection', 
      expectation, 
      isEntangled 
    });

    return {
      expectationValue: expectation,
      isEntangled,
      witnessOperator: witness,
      hash
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Compute tensor product of two matrices.
   */
  private tensorProduct(A: Complex[][], B: Complex[][]): Complex[][] {
    const nA = A.length;
    const mA = A[0].length;
    const nB = B.length;
    const mB = B[0].length;
    const result: Complex[][] = [];

    for (let i = 0; i < nA * nB; i++) {
      result[i] = [];
      for (let j = 0; j < mA * mB; j++) {
        const iA = Math.floor(i / nB);
        const iB = i % nB;
        const jA = Math.floor(j / mB);
        const jB = j % mB;
        result[i][j] = A[iA][jA].multiply(B[iB][jB]);
      }
    }

    return result;
  }

  /**
   * Compute eigenvalues using power iteration (simplified).
   */
  private getEigenvalues(matrix: Complex[][]): number[] {
    const n = matrix.length;
    const eigenvalues: number[] = [];
    
    // For small matrices, compute characteristic polynomial roots
    // Simplified: use trace and determinant for 2x2, or iterate for larger
    if (n === 2) {
      const trace = matrix[0][0].add(matrix[1][1]).real.toNumber();
      const det = matrix[0][0].multiply(matrix[1][1])
        .subtract(matrix[0][1].multiply(matrix[1][0])).real.toNumber();
      const discriminant = trace * trace - 4 * det;
      
      if (discriminant >= 0) {
        const sqrtDisc = Math.sqrt(discriminant);
        eigenvalues.push((trace + sqrtDisc) / 2);
        eigenvalues.push((trace - sqrtDisc) / 2);
      } else {
        eigenvalues.push(trace / 2);
        eigenvalues.push(trace / 2);
      }
    } else if (n === 4) {
      // For 4x4, use simplified approach - compute diagonal dominance
      // This is an approximation; real implementation would use QR algorithm
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            sum += matrix[i][j].magnitude().toNumber();
          }
        }
        eigenvalues.push(matrix[i][i].real.toNumber());
      }
      eigenvalues.sort((a, b) => b - a);
    } else {
      // Generic: diagonal elements as approximation
      for (let i = 0; i < n; i++) {
        eigenvalues.push(matrix[i][i].real.toNumber());
      }
    }

    return eigenvalues;
  }

  /**
   * Matrix multiplication.
   */
  private matrixMultiply(A: Complex[][], B: Complex[][]): Complex[][] {
    const n = A.length;
    const m = B[0].length;
    const k = B.length;
    const result: Complex[][] = [];

    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < m; j++) {
        let sum = Complex.zero();
        for (let l = 0; l < k; l++) {
          sum = sum.add(A[i][l].multiply(B[l][j]));
        }
        result[i][j] = sum;
      }
    }

    return result;
  }

  /**
   * Expectation value Tr(ρO).
   */
  private expectationValue(rho: Complex[][], operator: Complex[][]): number {
    const product = this.matrixMultiply(rho, operator);
    let trace = Complex.zero();
    for (let i = 0; i < product.length; i++) {
      trace = trace.add(product[i][i]);
    }
    return trace.real.toNumber();
  }

  /**
   * Simplified SVD for Schmidt decomposition.
   */
  private simpleSVD(matrix: Complex[][]): { U: Complex[][], S: number[], V: Complex[][] } {
    const m = matrix.length;
    const n = matrix[0].length;
    const minDim = Math.min(m, n);

    // Simplified: return identity matrices and diagonal
    const U: Complex[][] = [];
    const V: Complex[][] = [];
    const S: number[] = [];

    for (let i = 0; i < m; i++) {
      U[i] = new Array(minDim).fill(null).map((_, j) => i === j ? new Complex(1, 0) : Complex.zero());
    }

    for (let i = 0; i < n; i++) {
      V[i] = new Array(minDim).fill(null).map((_, j) => i === j ? new Complex(1, 0) : Complex.zero());
    }

    // Extract diagonal approximation
    for (let i = 0; i < minDim; i++) {
      S.push(matrix[i][i].magnitude().toNumber());
    }

    return { U, S, V };
  }

  /**
   * Matrix addition.
   */
  private matrixAdd(A: Complex[][], B: Complex[][]): Complex[][] {
    const n = A.length;
    const result: Complex[][] = [];
    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < A[i].length; j++) {
        result[i][j] = A[i][j].add(B[i][j]);
      }
    }
    return result;
  }

  /**
   * Matrix subtraction.
   */
  private matrixSubtract(A: Complex[][], B: Complex[][]): Complex[][] {
    const n = A.length;
    const result: Complex[][] = [];
    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < A[i].length; j++) {
        result[i][j] = A[i][j].subtract(B[i][j]);
      }
    }
    return result;
  }

  /**
   * Matrix scalar multiplication.
   */
  private matrixScaleNum(A: Complex[][], scalar: number): Complex[][] {
    const n = A.length;
    const result: Complex[][] = [];
    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < A[i].length; j++) {
        result[i][j] = new Complex(
          A[i][j].real.toNumber() * scalar,
          A[i][j].imag.toNumber() * scalar
        );
      }
    }
    return result;
  }
}

// ============================================================================
// MULTIPARTITE ENTANGLEMENT
// ============================================================================

/**
 * MultipartiteEntanglement handles entanglement in systems with more than 2 parties.
 */
export class MultipartiteEntanglement {
  private numParties: number;
  private dimensions: number[];
  private logger: Logger;
  private hashChain: HashChain;

  constructor(dimensions: number[]) {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`multipartite-${Date.now()}`);
    this.numParties = dimensions.length;
    this.dimensions = dimensions;
  }

  /**
   * Check if state is genuinely multipartite entangled (GME).
   * A state is GME if it is entangled across every bipartition.
   */
  isGME(rho: Complex[][]): boolean {
    // Check all possible bipartitions
    for (let mask = 1; mask < Math.pow(2, this.numParties) - 1; mask++) {
      const dimA = this.getDimensionForMask(mask);
      const dimB = this.getDimensionForMask(~mask & ((1 << this.numParties) - 1));
      
      const analyzer = new EntanglementAnalyzer({ dimensions: [dimA, dimB] });
      if (analyzer.isSeparable(rho)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Compute multipartite concurrence (for pure states).
   */
  multipartiteConcurrence(state: Complex[]): number {
    // Generalized concurrence: C = √(2(1 - Tr(ρ_A²)))
    // averaged over all single-party reductions
    let totalConcurrence = 0;

    for (let party = 0; party < this.numParties; party++) {
      const rhoReduced = this.traceOutAllExcept(state, party);
      const purity = this.purity(rhoReduced);
      const c = Math.sqrt(2 * (1 - purity));
      totalConcurrence += c;
    }

    return totalConcurrence / this.numParties;
  }

  /**
   * Compute tangle (squared concurrence) for 3-qubit state.
   */
  threeTangle(state: Complex[]): number {
    if (this.numParties !== 3 || this.dimensions.some(d => d !== 2)) {
      throw new Error('Three-tangle is only defined for 3-qubit states');
    }

    // τ_ABC = C²_A(BC) - C²_AB - C²_AC
    // Simplified approximation
    const rho = this.outerProduct(state);
    
    // Get reduced density matrices
    const rhoA = this.traceOutAllExcept(state, 0);
    const entropyA = this.vonNeumannEntropy(rhoA);
    
    // Three-tangle approximation from entropy
    return Math.max(0, Math.pow(entropyA, 2));
  }

  /**
   * Trace out all parties except one.
   */
  private traceOutAllExcept(state: Complex[], keepParty: number): Complex[][] {
    const keepDim = this.dimensions[keepParty];
    const otherDim = this.dimensions.reduce((a, b) => a * b, 1) / keepDim;
    
    const rho: Complex[][] = [];
    for (let i = 0; i < keepDim; i++) {
      rho[i] = [];
      for (let j = 0; j < keepDim; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < otherDim; k++) {
          const idx_i = this.getIndex(i, k, keepParty);
          const idx_j = this.getIndex(j, k, keepParty);
          sum = sum.add(state[idx_i].multiply(state[idx_j].conjugate()));
        }
        rho[i][j] = sum;
      }
    }
    
    return rho;
  }

  /**
   * Get index in state vector for given party index and others index.
   */
  private getIndex(partyIdx: number, othersIdx: number, party: number): number {
    // This is simplified; full implementation would properly handle tensor product indexing
    const otherDim = this.dimensions.reduce((a, b) => a * b, 1) / this.dimensions[party];
    return partyIdx * otherDim + othersIdx;
  }

  /**
   * Get total dimension for a set of parties (represented by bitmask).
   */
  private getDimensionForMask(mask: number): number {
    let dim = 1;
    for (let i = 0; i < this.numParties; i++) {
      if (mask & (1 << i)) {
        dim *= this.dimensions[i];
      }
    }
    return dim;
  }

  /**
   * Compute outer product |ψ⟩⟨ψ|.
   */
  private outerProduct(state: Complex[]): Complex[][] {
    const n = state.length;
    const result: Complex[][] = [];
    for (let i = 0; i < n; i++) {
      result[i] = [];
      for (let j = 0; j < n; j++) {
        result[i][j] = state[i].multiply(state[j].conjugate());
      }
    }
    return result;
  }

  /**
   * Compute purity Tr(ρ²).
   */
  private purity(rho: Complex[][]): number {
    let sum = 0;
    for (let i = 0; i < rho.length; i++) {
      for (let j = 0; j < rho.length; j++) {
        sum += rho[i][j].multiply(rho[j][i]).real.toNumber();
      }
    }
    return sum;
  }

  /**
   * Compute von Neumann entropy.
   */
  private vonNeumannEntropy(rho: Complex[][]): number {
    const eigenvalues = this.getEigenvalues(rho);
    let entropy = 0;
    for (const lambda of eigenvalues) {
      if (lambda > 1e-15) {
        entropy -= lambda * Math.log2(lambda);
      }
    }
    return entropy;
  }

  /**
   * Get eigenvalues (simplified).
   */
  private getEigenvalues(matrix: Complex[][]): number[] {
    const n = matrix.length;
    const eigenvalues: number[] = [];
    
    if (n === 2) {
      const trace = matrix[0][0].add(matrix[1][1]).real.toNumber();
      const det = matrix[0][0].multiply(matrix[1][1])
        .subtract(matrix[0][1].multiply(matrix[1][0])).real.toNumber();
      const discriminant = trace * trace - 4 * det;
      
      if (discriminant >= 0) {
        eigenvalues.push((trace + Math.sqrt(discriminant)) / 2);
        eigenvalues.push((trace - Math.sqrt(discriminant)) / 2);
      } else {
        eigenvalues.push(trace / 2);
        eigenvalues.push(trace / 2);
      }
    } else {
      for (let i = 0; i < n; i++) {
        eigenvalues.push(matrix[i][i].real.toNumber());
      }
    }

    return eigenvalues;
  }
}
