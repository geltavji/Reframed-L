/**
 * Qlaws Ham - Commutator Module (M02.04)
 * 
 * PRD-02 Phase 2.2: Quantum Operators - Commutator System
 * 
 * Dependencies:
 * - M02.03: Operator
 * - M01.01: Logger
 * - M01.05: Matrix
 * - M01.04: Complex
 * 
 * Exports:
 * - Commutator: Computes [A, B] = AB - BA
 * - AntiCommutator: Computes {A, B} = AB + BA
 * - UncertaintyRelation: Validates ΔAΔb ≥ |⟨[A,B]⟩|/2
 * - commute: Quick commutator function
 * - antiCommute: Quick anti-commutator function
 * 
 * @module Commutator
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';
import { 
  Operator,
  Vector,
  createPositionOperator, 
  createMomentumOperator,
  PauliX,
  PauliY,
  PauliZ 
} from './Operator';

// Initialize logger for commutator operations
Logger.resetInstance();
const logger = Logger.getInstance({
  minLevel: LogLevel.DEBUG,
  enableConsole: false,
  enableHashChain: true
});

/**
 * Commutator result with validation
 */
export interface CommutatorResult {
  operator: Operator;
  isZero: boolean;
  commutatorNorm: number;
  hash: string;
  timestamp: number;
}

/**
 * Anti-commutator result
 */
export interface AntiCommutatorResult {
  operator: Operator;
  isZero: boolean;
  antiCommutatorNorm: number;
  hash: string;
  timestamp: number;
}

/**
 * Uncertainty relation validation result
 */
export interface UncertaintyResult {
  leftSide: number;       // ΔA × ΔB
  rightSide: number;      // |⟨[A,B]⟩|/2
  satisfied: boolean;     // leftSide >= rightSide
  ratio: number;          // leftSide / rightSide
  hash: string;
}

/**
 * Commutator class for quantum mechanical calculations
 * 
 * The commutator [A, B] = AB - BA is fundamental in quantum mechanics,
 * determining which observables can be simultaneously measured.
 */
export class Commutator {
  private operatorA: Operator;
  private operatorB: Operator;
  private result: Operator | null = null;
  private hash: string;

  constructor(A: Operator, B: Operator) {
    if (A.getDimension() !== B.getDimension()) {
      throw new Error('Operators must have the same dimension for commutator');
    }
    
    this.operatorA = A;
    this.operatorB = B;
    this.hash = this.computeHash();
    
    logger.debug(`Created Commutator [${A.getName()}, ${B.getName()}]`, {
      dimension: A.getDimension(),
      hash: this.hash
    });
  }

  private computeHash(): string {
    return HashVerifier.hashObject({
      operatorA: this.operatorA.getHash(),
      operatorB: this.operatorB.getHash(),
      type: 'commutator'
    });
  }

  /**
   * Compute the commutator: [A, B] = AB - BA
   */
  compute(): CommutatorResult {
    const AB = this.operatorA.multiply(this.operatorB);
    const BA = this.operatorB.multiply(this.operatorA);
    
    this.result = AB.subtract(BA);
    
    const norm = this.result.norm();
    const isZero = norm < 1e-10;
    
    const resultHash = HashVerifier.hashObject({
      operatorA: this.operatorA.getHash(),
      operatorB: this.operatorB.getHash(),
      resultNorm: norm,
      isZero
    });
    
    logger.proof(`Computed [${this.operatorA.getName()}, ${this.operatorB.getName()}]`, {
      norm,
      isZero,
      hash: resultHash
    });
    
    return {
      operator: this.result,
      isZero,
      commutatorNorm: norm,
      hash: resultHash,
      timestamp: Date.now()
    };
  }

  /**
   * Get the result operator
   */
  getResult(): Operator {
    if (!this.result) {
      this.compute();
    }
    return this.result!;
  }

  /**
   * Check if operators commute: [A, B] = 0
   */
  operatorsCommute(tolerance: number = 1e-10): boolean {
    const { isZero } = this.compute();
    return isZero;
  }

  /**
   * Get expectation value of commutator: ⟨ψ|[A,B]|ψ⟩
   */
  expectationValue(state: Vector): Complex {
    const commutator = this.getResult();
    return commutator.expectationValue(state);
  }

  /**
   * Get the hash
   */
  getHash(): string {
    return this.hash;
  }
}

/**
 * Anti-commutator class: {A, B} = AB + BA
 * 
 * Anti-commutators appear in fermionic systems and supersymmetry
 */
export class AntiCommutator {
  private operatorA: Operator;
  private operatorB: Operator;
  private result: Operator | null = null;
  private hash: string;

  constructor(A: Operator, B: Operator) {
    if (A.getDimension() !== B.getDimension()) {
      throw new Error('Operators must have the same dimension for anti-commutator');
    }
    
    this.operatorA = A;
    this.operatorB = B;
    this.hash = this.computeHash();
    
    logger.debug(`Created AntiCommutator {${A.getName()}, ${B.getName()}}`, {
      dimension: A.getDimension(),
      hash: this.hash
    });
  }

  private computeHash(): string {
    return HashVerifier.hashObject({
      operatorA: this.operatorA.getHash(),
      operatorB: this.operatorB.getHash(),
      type: 'anti-commutator'
    });
  }

  /**
   * Compute the anti-commutator: {A, B} = AB + BA
   */
  compute(): AntiCommutatorResult {
    const AB = this.operatorA.multiply(this.operatorB);
    const BA = this.operatorB.multiply(this.operatorA);
    
    this.result = AB.add(BA);
    
    const norm = this.result.norm();
    const isZero = norm < 1e-10;
    
    const resultHash = HashVerifier.hashObject({
      operatorA: this.operatorA.getHash(),
      operatorB: this.operatorB.getHash(),
      resultNorm: norm,
      isZero,
      type: 'anti-commutator'
    });
    
    logger.proof(`Computed {${this.operatorA.getName()}, ${this.operatorB.getName()}}`, {
      norm,
      isZero,
      hash: resultHash
    });
    
    return {
      operator: this.result,
      isZero,
      antiCommutatorNorm: norm,
      hash: resultHash,
      timestamp: Date.now()
    };
  }

  /**
   * Get the result operator
   */
  getResult(): Operator {
    if (!this.result) {
      this.compute();
    }
    return this.result!;
  }

  /**
   * Check if operators anti-commute: {A, B} = 0
   */
  operatorsAntiCommute(tolerance: number = 1e-10): boolean {
    const { isZero } = this.compute();
    return isZero;
  }

  /**
   * Get the hash
   */
  getHash(): string {
    return this.hash;
  }
}

/**
 * Uncertainty Relation validator
 * 
 * For any two observables A and B:
 * ΔA · ΔB ≥ |⟨[A, B]⟩| / 2
 * 
 * Where ΔA = √(⟨A²⟩ - ⟨A⟩²) is the standard deviation
 */
export class UncertaintyRelation {
  private operatorA: Operator;
  private operatorB: Operator;
  private commutator: Commutator;
  private hash: string;

  constructor(A: Operator, B: Operator) {
    this.operatorA = A;
    this.operatorB = B;
    this.commutator = new Commutator(A, B);
    this.hash = this.computeHash();
  }

  private computeHash(): string {
    return HashVerifier.hashObject({
      operatorA: this.operatorA.getHash(),
      operatorB: this.operatorB.getHash(),
      type: 'uncertainty-relation'
    });
  }

  /**
   * Validate the uncertainty relation for a given state
   */
  validate(state: Vector): UncertaintyResult {
    // Compute ΔA = √(⟨A²⟩ - ⟨A⟩²)
    const deltaA = this.operatorA.standardDeviation(state);
    
    // Compute ΔB = √(⟨B²⟩ - ⟨B⟩²)
    const deltaB = this.operatorB.standardDeviation(state);
    
    // Left side: ΔA × ΔB
    const leftSide = deltaA * deltaB;
    
    // Right side: |⟨[A, B]⟩| / 2
    const commutatorExp = this.commutator.expectationValue(state);
    const rightSide = commutatorExp.magnitude().toNumber() / 2;
    
    const satisfied = leftSide >= rightSide - 1e-10; // Small tolerance
    const ratio = rightSide > 0 ? leftSide / rightSide : Infinity;
    
    const resultHash = HashVerifier.hashObject({
      leftSide,
      rightSide,
      satisfied,
      ratio,
      operatorA: this.operatorA.getHash(),
      operatorB: this.operatorB.getHash()
    });
    
    logger.proof(`Uncertainty relation: ΔA·ΔB ≥ |⟨[A,B]⟩|/2`, {
      leftSide,
      rightSide,
      satisfied,
      ratio,
      hash: resultHash
    });
    
    return {
      leftSide,
      rightSide,
      satisfied,
      ratio,
      hash: resultHash
    };
  }

  /**
   * Get the minimum uncertainty product from the commutator
   * This is the generalized uncertainty principle bound
   */
  getMinimumUncertainty(state: Vector): number {
    const commutatorExp = this.commutator.expectationValue(state);
    return commutatorExp.magnitude().toNumber() / 2;
  }

  /**
   * Check if the state is a minimum uncertainty state
   * (one that saturates the inequality)
   */
  isMinimumUncertaintyState(state: Vector, tolerance: number = 1e-6): boolean {
    const result = this.validate(state);
    return Math.abs(result.ratio - 1) < tolerance;
  }

  /**
   * Get the hash
   */
  getHash(): string {
    return this.hash;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Quick commutator computation: [A, B] = AB - BA
 */
export function commute(A: Operator, B: Operator): CommutatorResult {
  const comm = new Commutator(A, B);
  return comm.compute();
}

/**
 * Quick anti-commutator computation: {A, B} = AB + BA
 */
export function antiCommute(A: Operator, B: Operator): AntiCommutatorResult {
  const antiComm = new AntiCommutator(A, B);
  return antiComm.compute();
}

/**
 * Check if operators commute
 */
export function operatorsCommute(A: Operator, B: Operator, tolerance: number = 1e-10): boolean {
  const comm = new Commutator(A, B);
  return comm.operatorsCommute(tolerance);
}

/**
 * Validate uncertainty relation for operators A and B with state
 */
export function validateUncertainty(A: Operator, B: Operator, state: Vector): UncertaintyResult {
  const ur = new UncertaintyRelation(A, B);
  return ur.validate(state);
}

// ============================================
// CANONICAL COMMUTATION RELATIONS
// ============================================

/**
 * Validate canonical commutation relation: [x̂, p̂] = iħ
 * 
 * This is the fundamental quantum mechanical commutation relation
 */
export function validateCanonicalCommutation(dimension: number, hbar: number = 1): {
  isValid: boolean;
  expectedValue: Complex;
  actualCommutator: Operator;
  error: number;
  hash: string;
} {
  const x = createPositionOperator(dimension);
  const p = createMomentumOperator(dimension, hbar);
  
  const comm = new Commutator(x, p);
  const { operator: actualCommutator } = comm.compute();
  
  // Expected: [x, p] = iħ·I
  const expectedValue = new Complex(0, hbar);
  
  // For finite dimensional approximation, check if [x,p] ≈ iħ·I
  // The diagonal elements should be approximately iħ
  let totalError = 0;
  let count = 0;
  
  for (let i = 0; i < dimension; i++) {
    for (let j = 0; j < dimension; j++) {
      const actual = actualCommutator.getElement(i, j);
      const expected = i === j ? expectedValue : Complex.zero();
      const diff = actual.subtract(expected);
      totalError += diff.magnitude().toNumber() ** 2;
      count++;
    }
  }
  
  const error = Math.sqrt(totalError / count);
  const isValid = error < 0.5; // Finite dimensional approximation has inherent error
  
  const hash = HashVerifier.hashObject({
    dimension,
    hbar,
    error,
    isValid
  });
  
  logger.proof(`Canonical commutation [x̂, p̂] = iħ validation`, {
    dimension,
    expectedValue: { re: expectedValue.real.toNumber(), im: expectedValue.imag.toNumber() },
    error,
    isValid,
    hash
  });
  
  return {
    isValid,
    expectedValue,
    actualCommutator,
    error,
    hash
  };
}

/**
 * Validate Pauli commutation relations: [σᵢ, σⱼ] = 2iεᵢⱼₖσₖ
 */
export function validatePauliCommutations(): {
  xyToZ: boolean;
  yzToX: boolean;
  zxToY: boolean;
  allValid: boolean;
  hash: string;
} {
  // [σₓ, σᵧ] = 2iσᵤ
  const commXY = commute(PauliX, PauliY);
  const expectedXY = PauliZ.scale(new Complex(0, 2));
  const xyToZ = commXY.operator.equals(expectedXY, 1e-10);
  
  // [σᵧ, σᵤ] = 2iσₓ
  const commYZ = commute(PauliY, PauliZ);
  const expectedYZ = PauliX.scale(new Complex(0, 2));
  const yzToX = commYZ.operator.equals(expectedYZ, 1e-10);
  
  // [σᵤ, σₓ] = 2iσᵧ
  const commZX = commute(PauliZ, PauliX);
  const expectedZX = PauliY.scale(new Complex(0, 2));
  const zxToY = commZX.operator.equals(expectedZX, 1e-10);
  
  const allValid = xyToZ && yzToX && zxToY;
  
  const hash = HashVerifier.hashObject({
    xyToZ,
    yzToX,
    zxToY,
    allValid
  });
  
  logger.proof('Pauli commutation relations validation', {
    xyToZ,
    yzToX,
    zxToY,
    allValid,
    hash
  });
  
  return {
    xyToZ,
    yzToX,
    zxToY,
    allValid,
    hash
  };
}

/**
 * Validate Pauli anti-commutation relations: {σᵢ, σⱼ} = 2δᵢⱼI
 */
export function validatePauliAntiCommutations(): {
  xxResult: boolean;
  yyResult: boolean;
  zzResult: boolean;
  xyResult: boolean;
  allValid: boolean;
  hash: string;
} {
  const identity = Operator.identity(2);
  const expectedSame = identity.scale(new Complex(2, 0));
  const expectedDiff = Operator.zero(2);
  
  // {σₓ, σₓ} = 2I
  const antiXX = antiCommute(PauliX, PauliX);
  const xxResult = antiXX.operator.equals(expectedSame, 1e-10);
  
  // {σᵧ, σᵧ} = 2I
  const antiYY = antiCommute(PauliY, PauliY);
  const yyResult = antiYY.operator.equals(expectedSame, 1e-10);
  
  // {σᵤ, σᵤ} = 2I
  const antiZZ = antiCommute(PauliZ, PauliZ);
  const zzResult = antiZZ.operator.equals(expectedSame, 1e-10);
  
  // {σₓ, σᵧ} = 0
  const antiXY = antiCommute(PauliX, PauliY);
  const xyResult = antiXY.isZero;
  
  const allValid = xxResult && yyResult && zzResult && xyResult;
  
  const hash = HashVerifier.hashObject({
    xxResult,
    yyResult,
    zzResult,
    xyResult,
    allValid
  });
  
  logger.proof('Pauli anti-commutation relations validation', {
    xxResult,
    yyResult,
    zzResult,
    xyResult,
    allValid,
    hash
  });
  
  return {
    xxResult,
    yyResult,
    zzResult,
    xyResult,
    allValid,
    hash
  };
}

/**
 * Validate angular momentum commutation: [Lᵢ, Lⱼ] = iħεᵢⱼₖLₖ
 */
export function validateAngularMomentumCommutations(hbar: number = 1): {
  xyToZ: boolean;
  yzToX: boolean;
  zxToY: boolean;
  allValid: boolean;
  hash: string;
} {
  // For spin-1/2, L = (ħ/2)σ
  const factor = hbar / 2;
  
  const Lx = PauliX.scale(new Complex(factor, 0));
  const Ly = PauliY.scale(new Complex(factor, 0));
  const Lz = PauliZ.scale(new Complex(factor, 0));
  
  // [Lₓ, Lᵧ] = iħLᵤ
  const commXY = commute(Lx, Ly);
  const expectedXY = Lz.scale(new Complex(0, hbar));
  const xyToZ = commXY.operator.equals(expectedXY, 1e-10);
  
  // [Lᵧ, Lᵤ] = iħLₓ
  const commYZ = commute(Ly, Lz);
  const expectedYZ = Lx.scale(new Complex(0, hbar));
  const yzToX = commYZ.operator.equals(expectedYZ, 1e-10);
  
  // [Lᵤ, Lₓ] = iħLᵧ
  const commZX = commute(Lz, Lx);
  const expectedZX = Ly.scale(new Complex(0, hbar));
  const zxToY = commZX.operator.equals(expectedZX, 1e-10);
  
  const allValid = xyToZ && yzToX && zxToY;
  
  const hash = HashVerifier.hashObject({
    hbar,
    xyToZ,
    yzToX,
    zxToY,
    allValid
  });
  
  logger.proof('Angular momentum commutation relations validation', {
    hbar,
    xyToZ,
    yzToX,
    zxToY,
    allValid,
    hash
  });
  
  return {
    xyToZ,
    yzToX,
    zxToY,
    allValid,
    hash
  };
}

/**
 * Validate creation/annihilation commutation: [â, â†] = I
 */
export function validateCreationAnnihilationCommutation(dimension: number): {
  isValid: boolean;
  error: number;
  hash: string;
} {
  // Import dynamically to avoid circular dependency
  const { createCreationOperator, createAnnihilationOperator } = require('./Operator');
  
  const a = createAnnihilationOperator(dimension);
  const aDagger = createCreationOperator(dimension);
  
  const comm = new Commutator(a, aDagger);
  const { operator: result } = comm.compute();
  
  const identity = Operator.identity(dimension);
  
  // Check if [a, a†] ≈ I (with boundary effects at edges)
  let totalError = 0;
  for (let i = 0; i < dimension - 1; i++) {
    for (let j = 0; j < dimension - 1; j++) {
      const diff = result.getElement(i, j).subtract(identity.getElement(i, j));
      totalError += diff.magnitude().toNumber() ** 2;
    }
  }
  
  const error = Math.sqrt(totalError / ((dimension - 1) * (dimension - 1)));
  const isValid = error < 0.1;
  
  const hash = HashVerifier.hashObject({
    dimension,
    error,
    isValid
  });
  
  logger.proof('Creation/Annihilation commutation [â, â†] = I validation', {
    dimension,
    error,
    isValid,
    hash
  });
  
  return {
    isValid,
    error,
    hash
  };
}

// ============================================
// JACOBI IDENTITY VALIDATION
// ============================================

/**
 * Validate Jacobi identity: [A, [B, C]] + [B, [C, A]] + [C, [A, B]] = 0
 */
export function validateJacobiIdentity(A: Operator, B: Operator, C: Operator): {
  isValid: boolean;
  residualNorm: number;
  hash: string;
} {
  // [B, C]
  const commBC = commute(B, C).operator;
  // [C, A]
  const commCA = commute(C, A).operator;
  // [A, B]
  const commAB = commute(A, B).operator;
  
  // [A, [B, C]]
  const term1 = commute(A, commBC).operator;
  // [B, [C, A]]
  const term2 = commute(B, commCA).operator;
  // [C, [A, B]]
  const term3 = commute(C, commAB).operator;
  
  // Sum should be zero
  const sum = term1.add(term2).add(term3);
  const residualNorm = sum.norm();
  const isValid = residualNorm < 1e-10;
  
  const hash = HashVerifier.hashObject({
    operatorA: A.getHash(),
    operatorB: B.getHash(),
    operatorC: C.getHash(),
    residualNorm,
    isValid
  });
  
  logger.proof('Jacobi identity validation', {
    residualNorm,
    isValid,
    hash
  });
  
  return {
    isValid,
    residualNorm,
    hash
  };
}
