/**
 * LorentzGroup.ts - PRD-03 Phase 3.3
 * Module ID: M03.03
 * 
 * Implements the Lorentz group SO(3,1) for special relativity.
 * Includes boost generators, rotation generators, and Lie algebra calculations.
 * 
 * The Lorentz group is the group of all transformations that preserve the
 * Minkowski metric: x'^μ η_μν x'^ν = x^μ η_μν x^ν
 * 
 * The Lie algebra so(3,1) has 6 generators:
 * - 3 boost generators K_i (hyperbolic rotations in t-x_i plane)
 * - 3 rotation generators J_i (rotations in x_j-x_k plane)
 * 
 * Dependencies:
 * - Tensor (M03.01)
 * - Matrix (M01.05)
 * - Complex (M01.04)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain } from '../../core/logger/HashVerifier';
import { Complex } from '../../core/math/Complex';
import { Matrix } from '../../core/math/Matrix';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Generator type: boost or rotation
 */
export enum GeneratorType {
  BOOST = 'boost',
  ROTATION = 'rotation'
}

/**
 * Generator specification
 */
export interface GeneratorSpec {
  type: GeneratorType;
  axis: 'x' | 'y' | 'z';
  index: number;  // 0, 1, or 2
}

/**
 * Lie algebra commutator result
 */
export interface CommutatorResult {
  result: Matrix;
  generators: string[];  // Which generators produced this
  structure: string;     // Structural form [A, B] = C
  hash: string;
}

/**
 * Group element parameters
 */
export interface GroupElementParams {
  boostRapidity?: number[];   // [ξx, ξy, ξz] - rapidities for boosts
  rotationAngle?: number[];   // [θx, θy, θz] - angles for rotations
}

/**
 * Group representation type
 */
export enum RepresentationType {
  VECTOR = 'vector',           // 4D vector representation
  SPINOR = 'spinor',           // 2D complex spinor representation
  ADJOINT = 'adjoint'          // 6D adjoint representation
}

/**
 * Representation result
 */
export interface RepresentationResult {
  type: RepresentationType;
  dimension: number;
  matrix: Matrix | Complex[][];
  hash: string;
}

// ============================================================================
// GENERATOR CLASS
// ============================================================================

/**
 * Lorentz group generator.
 * Generators of the Lorentz Lie algebra so(3,1).
 * 
 * Boost generators (K_i): Generate boosts in the x^i direction
 * (K_i)^μ_ν = η^μ_0 δ^i_ν + η^i_ν δ^μ_0
 * 
 * Rotation generators (J_i): Generate rotations in the j-k plane
 * (J_i)^j_k = -ε^ijk (Levi-Civita symbol)
 */
export class Generator {
  private logger: Logger;
  private hashChain: HashChain;
  readonly type: GeneratorType;
  readonly axis: 'x' | 'y' | 'z';
  readonly index: number;
  private matrix: number[][];

  constructor(spec: GeneratorSpec) {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.WARN,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('Generator');
    
    this.type = spec.type;
    this.axis = spec.axis;
    this.index = spec.index;
    this.matrix = this.computeMatrix();
    
    this.hashChain.addRecord('AXIOM' as any, `Generator:${this.type}:${this.axis}`, 'initialized');
  }

  /**
   * Compute the generator matrix
   */
  private computeMatrix(): number[][] {
    const M = Array.from({ length: 4 }, () => Array(4).fill(0));
    
    if (this.type === GeneratorType.BOOST) {
      // Boost generator K_i:
      // K_1 generates boosts in x direction: (K_1)^0_1 = (K_1)^1_0 = 1
      // K_2 generates boosts in y direction: (K_2)^0_2 = (K_2)^2_0 = 1
      // K_3 generates boosts in z direction: (K_3)^0_3 = (K_3)^3_0 = 1
      const i = this.index + 1; // 1, 2, or 3
      M[0][i] = 1;
      M[i][0] = 1;
    } else {
      // Rotation generator J_i:
      // J_1 rotates in y-z plane: (J_1)^2_3 = -1, (J_1)^3_2 = 1
      // J_2 rotates in z-x plane: (J_2)^3_1 = -1, (J_2)^1_3 = 1
      // J_3 rotates in x-y plane: (J_3)^1_2 = -1, (J_3)^2_1 = 1
      const cyclic = [[1, 2, 3], [2, 3, 1], [3, 1, 2]];
      const [_, j, k] = cyclic[this.index];
      M[j][k] = -1;
      M[k][j] = 1;
    }
    
    return M;
  }

  /**
   * Get the generator matrix
   */
  getMatrix(): number[][] {
    return this.matrix.map(row => [...row]);
  }

  /**
   * Get the generator as a Matrix object
   */
  toMatrix(): Matrix {
    return new Matrix(this.matrix);
  }

  /**
   * Get generator name (K_1, K_2, K_3, J_1, J_2, J_3)
   */
  getName(): string {
    const prefix = this.type === GeneratorType.BOOST ? 'K' : 'J';
    return `${prefix}_${this.index + 1}`;
  }

  /**
   * Exponentiate generator: exp(parameter * Generator)
   * For boosts: parameter = rapidity ξ
   * For rotations: parameter = angle θ
   */
  exponentiate(parameter: number): number[][] {
    const M = this.matrix;
    const result = Array.from({ length: 4 }, (_, i) => 
      Array.from({ length: 4 }, (_, j) => i === j ? 1 : 0)
    );
    
    if (this.type === GeneratorType.BOOST) {
      // exp(ξK) = I + sinh(ξ)K + (cosh(ξ)-1)K²
      const sinh_xi = Math.sinh(parameter);
      const cosh_xi = Math.cosh(parameter);
      
      // K² has diagonal elements
      const K2 = this.multiplyMatrices(M, M);
      
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result[i][j] += sinh_xi * M[i][j] + (cosh_xi - 1) * K2[i][j];
        }
      }
    } else {
      // exp(θJ) = I + sin(θ)J + (1-cos(θ))J²
      const sin_theta = Math.sin(parameter);
      const cos_theta = Math.cos(parameter);
      
      // J² has diagonal elements
      const J2 = this.multiplyMatrices(M, M);
      
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result[i][j] += sin_theta * M[i][j] + (1 - cos_theta) * J2[i][j];
        }
      }
    }
    
    return result;
  }

  /**
   * Matrix multiplication helper
   */
  private multiplyMatrices(A: number[][], B: number[][]): number[][] {
    const result = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`Generator:${this.type}:${this.axis}:${JSON.stringify(this.matrix)}`);
  }
}

// ============================================================================
// LIE ALGEBRA CLASS
// ============================================================================

/**
 * Lorentz Lie algebra so(3,1).
 * 
 * The algebra has 6 generators with commutation relations:
 * [J_i, J_j] = ε_ijk J_k
 * [K_i, K_j] = -ε_ijk J_k
 * [J_i, K_j] = ε_ijk K_k
 */
export class LorentzAlgebra {
  private logger: Logger;
  private hashChain: HashChain;
  
  // Generators
  readonly K: Generator[];  // K_1, K_2, K_3 (boosts)
  readonly J: Generator[];  // J_1, J_2, J_3 (rotations)

  constructor() {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.WARN,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('LorentzAlgebra');
    
    // Create boost generators
    this.K = [
      new Generator({ type: GeneratorType.BOOST, axis: 'x', index: 0 }),
      new Generator({ type: GeneratorType.BOOST, axis: 'y', index: 1 }),
      new Generator({ type: GeneratorType.BOOST, axis: 'z', index: 2 })
    ];
    
    // Create rotation generators
    this.J = [
      new Generator({ type: GeneratorType.ROTATION, axis: 'x', index: 0 }),
      new Generator({ type: GeneratorType.ROTATION, axis: 'y', index: 1 }),
      new Generator({ type: GeneratorType.ROTATION, axis: 'z', index: 2 })
    ];
    
    this.hashChain.addRecord('AXIOM' as any, 'LorentzAlgebra:so(3,1)', 'initialized');
  }

  /**
   * Compute the commutator [A, B] = AB - BA
   */
  commutator(A: Generator, B: Generator): CommutatorResult {
    const MA = A.getMatrix();
    const MB = B.getMatrix();
    
    // Compute AB
    const AB = this.multiplyMatrices(MA, MB);
    
    // Compute BA
    const BA = this.multiplyMatrices(MB, MA);
    
    // [A, B] = AB - BA
    const result: number[][] = Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => AB[i][j] - BA[i][j])
    );
    
    // Identify the resulting generator
    const structure = this.identifyCommutatorResult(A, B, result);
    
    return {
      result: new Matrix(result),
      generators: [A.getName(), B.getName()],
      structure,
      hash: HashVerifier.hash(`Commutator:${A.getName()}:${B.getName()}`)
    };
  }

  /**
   * Identify which generator(s) the commutator result corresponds to
   */
  private identifyCommutatorResult(A: Generator, B: Generator, result: number[][]): string {
    // Check if result is zero
    const isZero = result.every(row => row.every(val => Math.abs(val) < 1e-10));
    if (isZero) {
      return `[${A.getName()}, ${B.getName()}] = 0`;
    }
    
    // Levi-Civita permutations: ε_123 = ε_231 = ε_312 = 1, ε_132 = ε_213 = ε_321 = -1
    const eps = (i: number, j: number, k: number): number => {
      if ((i === 0 && j === 1 && k === 2) || (i === 1 && j === 2 && k === 0) || (i === 2 && j === 0 && k === 1)) return 1;
      if ((i === 0 && j === 2 && k === 1) || (i === 2 && j === 1 && k === 0) || (i === 1 && j === 0 && k === 2)) return -1;
      return 0;
    };
    
    const aType = A.type;
    const bType = B.type;
    const i = A.index;
    const j = B.index;
    
    // [J_i, J_j] = ε_ijk J_k
    if (aType === GeneratorType.ROTATION && bType === GeneratorType.ROTATION) {
      for (let k = 0; k < 3; k++) {
        const coeff = eps(i, j, k);
        if (coeff !== 0) {
          return `[${A.getName()}, ${B.getName()}] = ${coeff > 0 ? '' : '-'}J_${k + 1}`;
        }
      }
    }
    
    // [K_i, K_j] = -ε_ijk J_k
    if (aType === GeneratorType.BOOST && bType === GeneratorType.BOOST) {
      for (let k = 0; k < 3; k++) {
        const coeff = -eps(i, j, k);
        if (coeff !== 0) {
          return `[${A.getName()}, ${B.getName()}] = ${coeff > 0 ? '' : '-'}J_${k + 1}`;
        }
      }
    }
    
    // [J_i, K_j] = ε_ijk K_k
    if (aType === GeneratorType.ROTATION && bType === GeneratorType.BOOST) {
      for (let k = 0; k < 3; k++) {
        const coeff = eps(i, j, k);
        if (coeff !== 0) {
          return `[${A.getName()}, ${B.getName()}] = ${coeff > 0 ? '' : '-'}K_${k + 1}`;
        }
      }
    }
    
    // [K_i, J_j] = -[J_j, K_i] = -ε_jik K_k = ε_ijk K_k
    if (aType === GeneratorType.BOOST && bType === GeneratorType.ROTATION) {
      for (let k = 0; k < 3; k++) {
        const coeff = eps(j, i, k);
        if (coeff !== 0) {
          return `[${A.getName()}, ${B.getName()}] = ${coeff > 0 ? '-' : ''}K_${k + 1}`;
        }
      }
    }
    
    return `[${A.getName()}, ${B.getName()}] = ?`;
  }

  /**
   * Matrix multiplication helper
   */
  private multiplyMatrices(A: number[][], B: number[][]): number[][] {
    const result = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }

  /**
   * Get all structure constants f^c_ab for [T_a, T_b] = f^c_ab T_c
   * Ordering: T = [K_1, K_2, K_3, J_1, J_2, J_3]
   */
  getStructureConstants(): number[][][] {
    const generators = [...this.K, ...this.J];
    const n = 6;
    const f: number[][][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => Array(n).fill(0))
    );
    
    // [J_i, J_j] = ε_ijk J_k (indices 3,4,5 for J_1,J_2,J_3)
    f[3][4][5] = 1; f[4][3][5] = -1;  // [J_1, J_2] = J_3
    f[4][5][3] = 1; f[5][4][3] = -1;  // [J_2, J_3] = J_1
    f[5][3][4] = 1; f[3][5][4] = -1;  // [J_3, J_1] = J_2
    
    // [K_i, K_j] = -ε_ijk J_k (indices 0,1,2 for K_1,K_2,K_3)
    f[0][1][5] = -1; f[1][0][5] = 1;  // [K_1, K_2] = -J_3
    f[1][2][3] = -1; f[2][1][3] = 1;  // [K_2, K_3] = -J_1
    f[2][0][4] = -1; f[0][2][4] = 1;  // [K_3, K_1] = -J_2
    
    // [J_i, K_j] = ε_ijk K_k
    f[3][1][2] = 1; f[1][3][2] = -1;  // [J_1, K_2] = K_3, [K_2, J_1] = -K_3
    f[3][2][1] = -1; f[2][3][1] = 1;  // [J_1, K_3] = -K_2
    f[4][0][2] = -1; f[0][4][2] = 1;  // [J_2, K_1] = -K_3
    f[4][2][0] = 1; f[2][4][0] = -1;  // [J_2, K_3] = K_1
    f[5][0][1] = 1; f[0][5][1] = -1;  // [J_3, K_1] = K_2
    f[5][1][0] = -1; f[1][5][0] = 1;  // [J_3, K_2] = -K_1
    
    return f;
  }

  /**
   * Verify Jacobi identity: [A, [B, C]] + [B, [C, A]] + [C, [A, B]] = 0
   */
  verifyJacobiIdentity(A: Generator, B: Generator, C: Generator): boolean {
    const MA = A.getMatrix();
    const MB = B.getMatrix();
    const MC = C.getMatrix();
    
    // [B, C]
    const BC = this.computeCommutator(MB, MC);
    // [C, A]
    const CA = this.computeCommutator(MC, MA);
    // [A, B]
    const AB = this.computeCommutator(MA, MB);
    
    // [A, [B, C]]
    const ABC = this.computeCommutator(MA, BC);
    // [B, [C, A]]
    const BCA = this.computeCommutator(MB, CA);
    // [C, [A, B]]
    const CAB = this.computeCommutator(MC, AB);
    
    // Sum should be zero
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const sum = ABC[i][j] + BCA[i][j] + CAB[i][j];
        if (Math.abs(sum) > 1e-10) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Compute commutator of two matrices
   */
  private computeCommutator(A: number[][], B: number[][]): number[][] {
    const AB = this.multiplyMatrices(A, B);
    const BA = this.multiplyMatrices(B, A);
    return Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => AB[i][j] - BA[i][j])
    );
  }

  /**
   * Get Casimir operator C = J² - K²
   * This commutes with all generators
   */
  getCasimirOperator(): Matrix {
    let C = Array.from({ length: 4 }, () => Array(4).fill(0));
    
    // J² = J_1² + J_2² + J_3²
    for (const J of this.J) {
      const M = J.getMatrix();
      const M2 = this.multiplyMatrices(M, M);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          C[i][j] += M2[i][j];
        }
      }
    }
    
    // -K² = -(K_1² + K_2² + K_3²)
    for (const K of this.K) {
      const M = K.getMatrix();
      const M2 = this.multiplyMatrices(M, M);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          C[i][j] -= M2[i][j];
        }
      }
    }
    
    return new Matrix(C);
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return this.hashChain.getLastHash();
  }
}

// ============================================================================
// LORENTZ GROUP CLASS
// ============================================================================

/**
 * Lorentz group SO(3,1).
 * The group of all linear transformations that preserve the Minkowski metric.
 * 
 * Group elements can be parameterized by:
 * - 3 boost rapidities (ξx, ξy, ξz)
 * - 3 rotation angles (θx, θy, θz)
 */
export class LorentzGroup {
  private logger: Logger;
  private hashChain: HashChain;
  readonly algebra: LorentzAlgebra;

  constructor() {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.WARN,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('LorentzGroup');
    this.algebra = new LorentzAlgebra();
    
    this.hashChain.addRecord('AXIOM' as any, 'LorentzGroup:SO(3,1)', 'initialized');
  }

  /**
   * Create a group element from parameters
   */
  createElement(params: GroupElementParams): GroupElement {
    return new GroupElement(this.algebra, params);
  }

  /**
   * Create a pure boost
   */
  boost(rapidity: number[], direction?: number[]): GroupElement {
    if (direction) {
      // Boost in arbitrary direction
      const mag = Math.sqrt(direction.reduce((s, d) => s + d * d, 0));
      const n = direction.map(d => d / mag);
      const xi = Math.sqrt(rapidity.reduce((s, r) => s + r * r, 0));
      return new GroupElement(this.algebra, {
        boostRapidity: n.map(ni => ni * xi)
      });
    }
    return new GroupElement(this.algebra, { boostRapidity: rapidity });
  }

  /**
   * Create a pure rotation
   */
  rotation(angles: number[]): GroupElement {
    return new GroupElement(this.algebra, { rotationAngle: angles });
  }

  /**
   * Create boost from velocity (in units of c)
   */
  boostFromVelocity(beta: number[]): GroupElement {
    const betaMag = Math.sqrt(beta.reduce((s, b) => s + b * b, 0));
    if (betaMag >= 1) {
      throw new Error('Velocity must be less than c');
    }
    
    // Rapidity: ξ = arctanh(β)
    const xi = Math.atanh(betaMag);
    const rapidity = beta.map(b => (betaMag > 0 ? b / betaMag * xi : 0));
    
    return new GroupElement(this.algebra, { boostRapidity: rapidity });
  }

  /**
   * Verify that a matrix is a valid Lorentz transformation
   * Λ^T η Λ = η
   */
  isValidTransformation(M: number[][]): boolean {
    const eta = [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
    
    // Compute Λ^T
    const MT: number[][] = Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => M[j][i])
    );
    
    // Compute Λ^T η
    const MTeta: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          MTeta[i][j] += MT[i][k] * eta[k][j];
        }
      }
    }
    
    // Compute (Λ^T η) Λ
    const result: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i][j] += MTeta[i][k] * M[k][j];
        }
      }
    }
    
    // Check if result equals η
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (Math.abs(result[i][j] - eta[i][j]) > 1e-10) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Classify a Lorentz transformation
   */
  classifyTransformation(M: number[][]): {
    isProper: boolean;      // det(Λ) = +1
    isOrthochronous: boolean; // Λ^0_0 >= 1
    type: string;
  } {
    // Compute determinant (simplified for 4x4)
    const det = this.determinant4x4(M);
    const isProper = Math.abs(det - 1) < 1e-10;
    
    // Check orthochronous: Λ^0_0 >= 1
    const isOrthochronous = M[0][0] >= 1 - 1e-10;
    
    let type: string;
    if (isProper && isOrthochronous) {
      type = 'SO+(3,1) - Proper orthochronous (restricted Lorentz group)';
    } else if (isProper && !isOrthochronous) {
      type = 'SO-(3,1) - Proper non-orthochronous';
    } else if (!isProper && isOrthochronous) {
      type = 'O+(3,1) - Improper orthochronous';
    } else {
      type = 'O-(3,1) - Improper non-orthochronous';
    }
    
    return { isProper, isOrthochronous, type };
  }

  /**
   * Compute 4x4 determinant using cofactor expansion
   */
  private determinant4x4(M: number[][]): number {
    let det = 0;
    for (let j = 0; j < 4; j++) {
      det += Math.pow(-1, j) * M[0][j] * this.minor3x3(M, 0, j);
    }
    return det;
  }

  /**
   * Compute 3x3 minor (determinant of submatrix with row i and column j removed)
   */
  private minor3x3(M: number[][], row: number, col: number): number {
    const sub: number[][] = [];
    for (let i = 0; i < 4; i++) {
      if (i === row) continue;
      const r: number[] = [];
      for (let j = 0; j < 4; j++) {
        if (j === col) continue;
        r.push(M[i][j]);
      }
      sub.push(r);
    }
    // 3x3 determinant
    return sub[0][0] * (sub[1][1] * sub[2][2] - sub[1][2] * sub[2][1])
         - sub[0][1] * (sub[1][0] * sub[2][2] - sub[1][2] * sub[2][0])
         + sub[0][2] * (sub[1][0] * sub[2][1] - sub[1][1] * sub[2][0]);
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return this.hashChain.getLastHash();
  }
}

// ============================================================================
// GROUP ELEMENT CLASS
// ============================================================================

/**
 * Element of the Lorentz group.
 * Represents a specific Lorentz transformation.
 */
export class GroupElement {
  private logger: Logger;
  private hashChain: HashChain;
  private algebra: LorentzAlgebra;
  private matrix: number[][];
  readonly boostRapidity: number[];
  readonly rotationAngle: number[];

  constructor(algebra: LorentzAlgebra, params: GroupElementParams) {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.WARN,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('GroupElement');
    this.algebra = algebra;
    
    this.boostRapidity = params.boostRapidity || [0, 0, 0];
    this.rotationAngle = params.rotationAngle || [0, 0, 0];
    
    this.matrix = this.computeMatrix();
    this.hashChain.addRecord('AXIOM' as any, `GroupElement:boost=${this.boostRapidity}:rot=${this.rotationAngle}`, 'initialized');
  }

  /**
   * Compute the transformation matrix
   * Λ = exp(ξ·K + θ·J)
   * 
   * For small angles, use the Baker-Campbell-Hausdorff formula.
   * For general case, compute separately and compose.
   */
  private computeMatrix(): number[][] {
    // Start with identity
    let result: number[][] = Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => i === j ? 1 : 0)
    );
    
    // Apply boosts
    for (let i = 0; i < 3; i++) {
      if (Math.abs(this.boostRapidity[i]) > 1e-15) {
        const boostMatrix = this.algebra.K[i].exponentiate(this.boostRapidity[i]);
        result = this.multiplyMatrices(boostMatrix, result);
      }
    }
    
    // Apply rotations
    for (let i = 0; i < 3; i++) {
      if (Math.abs(this.rotationAngle[i]) > 1e-15) {
        const rotMatrix = this.algebra.J[i].exponentiate(this.rotationAngle[i]);
        result = this.multiplyMatrices(rotMatrix, result);
      }
    }
    
    return result;
  }

  /**
   * Matrix multiplication helper
   */
  private multiplyMatrices(A: number[][], B: number[][]): number[][] {
    const result = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }

  /**
   * Get the transformation matrix
   */
  getMatrix(): number[][] {
    return this.matrix.map(row => [...row]);
  }

  /**
   * Transform a 4-vector
   */
  transform(x: number[]): number[] {
    const result = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i] += this.matrix[i][j] * x[j];
      }
    }
    return result;
  }

  /**
   * Compose with another group element: this · other
   */
  compose(other: GroupElement): GroupElement {
    const newMatrix = this.multiplyMatrices(this.matrix, other.getMatrix());
    
    // Create new element and override its matrix
    const composed = new GroupElement(this.algebra, {});
    (composed as any).matrix = newMatrix;
    
    return composed;
  }

  /**
   * Get the inverse transformation
   */
  inverse(): GroupElement {
    // For Lorentz transformations: Λ^(-1) = η Λ^T η
    const eta = [
      [-1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
    
    // Compute Λ^T
    const MT: number[][] = Array.from({ length: 4 }, (_, i) =>
      Array.from({ length: 4 }, (_, j) => this.matrix[j][i])
    );
    
    // Compute η Λ^T
    const etaMT = this.multiplyMatrices(eta, MT);
    
    // Compute (η Λ^T) η
    const inv = this.multiplyMatrices(etaMT, eta);
    
    const result = new GroupElement(this.algebra, {});
    (result as any).matrix = inv;
    
    return result;
  }

  /**
   * Get the Lorentz factor γ
   */
  getGamma(): number {
    return this.matrix[0][0];
  }

  /**
   * Get the velocity parameter β
   */
  getBeta(): number[] {
    const gamma = this.matrix[0][0];
    // For boost: Λ^0_i = γβ_i, so β_i = Λ^0_i / γ
    return [
      this.matrix[0][1] / gamma,
      this.matrix[0][2] / gamma,
      this.matrix[0][3] / gamma
    ];
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`GroupElement:${JSON.stringify(this.matrix)}`);
  }
}

// ============================================================================
// SPINOR REPRESENTATION
// ============================================================================

/**
 * SL(2,C) spinor representation of the Lorentz group.
 * The covering group of SO(3,1) is SL(2,C).
 * 
 * Spinors transform under the (1/2, 0) or (0, 1/2) representations.
 */
export class SpinorRepresentation {
  private logger: Logger;
  private hashChain: HashChain;
  
  // Pauli matrices
  readonly sigma: Complex[][][];  // σ_0, σ_1, σ_2, σ_3

  constructor() {
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.WARN,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('SpinorRepresentation');
    
    this.sigma = this.initializePauliMatrices();
    this.hashChain.addRecord('AXIOM' as any, 'SpinorRepresentation:SL(2,C)', 'initialized');
  }

  /**
   * Initialize Pauli matrices (including σ_0 = I)
   */
  private initializePauliMatrices(): Complex[][][] {
    const i = new Complex(0, 1);  // imaginary unit
    const one = new Complex(1, 0);
    const zero = new Complex(0, 0);
    const negOne = new Complex(-1, 0);
    const negI = new Complex(0, -1);
    
    return [
      // σ_0 = I
      [[one, zero], [zero, one]],
      // σ_1 = [[0, 1], [1, 0]]
      [[zero, one], [one, zero]],
      // σ_2 = [[0, -i], [i, 0]]
      [[zero, negI], [i, zero]],
      // σ_3 = [[1, 0], [0, -1]]
      [[one, zero], [zero, negOne]]
    ];
  }

  /**
   * Get σ^μ = (σ_0, σ_1, σ_2, σ_3) = (I, σ)
   */
  getSigma(mu: number): Complex[][] {
    if (mu < 0 || mu > 3) throw new Error('Index must be 0-3');
    return this.sigma[mu].map(row => row.map(c => 
      new Complex(c.real.toNumber(), c.imag.toNumber())
    ));
  }

  /**
   * Get σ̄^μ = (σ_0, -σ_1, -σ_2, -σ_3) = (I, -σ)
   */
  getSigmaBar(mu: number): Complex[][] {
    if (mu < 0 || mu > 3) throw new Error('Index must be 0-3');
    if (mu === 0) {
      return this.sigma[0].map(row => row.map(c => 
        new Complex(c.real.toNumber(), c.imag.toNumber())
      ));
    }
    return this.sigma[mu].map(row => row.map(c => c.multiply(-1)));
  }

  /**
   * Create SL(2,C) matrix for a boost
   * A = exp(ξ·σ/2) = cosh(ξ/2)I + sinh(ξ/2)(n·σ)
   */
  boostMatrix(rapidity: number[]): Complex[][] {
    const xi = Math.sqrt(rapidity.reduce((s, r) => s + r * r, 0));
    if (xi < 1e-15) {
      // Identity
      return [[new Complex(1, 0), new Complex(0, 0)], 
              [new Complex(0, 0), new Complex(1, 0)]];
    }
    
    const n = rapidity.map(r => r / xi);
    const cosh_half = Math.cosh(xi / 2);
    const sinh_half = Math.sinh(xi / 2);
    
    // A = cosh(ξ/2)I + sinh(ξ/2)(n·σ)
    // n·σ = n_1 σ_1 + n_2 σ_2 + n_3 σ_3
    const result: Complex[][] = [
      [new Complex(cosh_half + sinh_half * n[2], 0),
       new Complex(sinh_half * n[0], -sinh_half * n[1])],
      [new Complex(sinh_half * n[0], sinh_half * n[1]),
       new Complex(cosh_half - sinh_half * n[2], 0)]
    ];
    
    return result;
  }

  /**
   * Create SL(2,C) matrix for a rotation
   * U = exp(iθ·σ/2) = cos(θ/2)I + i·sin(θ/2)(n·σ)
   */
  rotationMatrix(angles: number[]): Complex[][] {
    const theta = Math.sqrt(angles.reduce((s, a) => s + a * a, 0));
    if (theta < 1e-15) {
      return [[new Complex(1, 0), new Complex(0, 0)],
              [new Complex(0, 0), new Complex(1, 0)]];
    }
    
    const n = angles.map(a => a / theta);
    const cos_half = Math.cos(theta / 2);
    const sin_half = Math.sin(theta / 2);
    
    // U = cos(θ/2)I + i·sin(θ/2)(n·σ)
    const result: Complex[][] = [
      [new Complex(cos_half, sin_half * n[2]),
       new Complex(sin_half * n[1], sin_half * n[0])],
      [new Complex(-sin_half * n[1], sin_half * n[0]),
       new Complex(cos_half, -sin_half * n[2])]
    ];
    
    return result;
  }

  /**
   * Map 4-vector to 2x2 Hermitian matrix: X = x^μ σ_μ
   */
  vectorToMatrix(x: number[]): Complex[][] {
    const result: Complex[][] = [[new Complex(0, 0), new Complex(0, 0)],
                                  [new Complex(0, 0), new Complex(0, 0)]];
    
    for (let mu = 0; mu < 4; mu++) {
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          result[i][j] = result[i][j].add(this.sigma[mu][i][j].multiply(x[mu]));
        }
      }
    }
    
    return result;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return this.hashChain.getLastHash();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compute rapidity from velocity (in units of c)
 */
export function rapidityFromBeta(beta: number): number {
  if (Math.abs(beta) >= 1) {
    throw new Error('Beta must be less than 1');
  }
  return Math.atanh(beta);
}

/**
 * Compute velocity from rapidity
 */
export function betaFromRapidity(xi: number): number {
  return Math.tanh(xi);
}

/**
 * Compute Lorentz factor from rapidity
 */
export function gammaFromRapidity(xi: number): number {
  return Math.cosh(xi);
}

/**
 * Compute Wigner rotation angle for two non-collinear boosts
 * This is the Thomas precession angle.
 */
export function wignerAngle(beta1: number[], beta2: number[]): number {
  const b1Mag = Math.sqrt(beta1.reduce((s, b) => s + b * b, 0));
  const b2Mag = Math.sqrt(beta2.reduce((s, b) => s + b * b, 0));
  
  if (b1Mag < 1e-15 || b2Mag < 1e-15) return 0;
  
  // Cross product b1 × b2
  const cross = [
    beta1[1] * beta2[2] - beta1[2] * beta2[1],
    beta1[2] * beta2[0] - beta1[0] * beta2[2],
    beta1[0] * beta2[1] - beta1[1] * beta2[0]
  ];
  const crossMag = Math.sqrt(cross.reduce((s, c) => s + c * c, 0));
  
  if (crossMag < 1e-15) return 0;  // Collinear boosts
  
  const gamma1 = 1 / Math.sqrt(1 - b1Mag * b1Mag);
  const gamma2 = 1 / Math.sqrt(1 - b2Mag * b2Mag);
  
  // Wigner angle approximation for small velocities
  // θ_W ≈ (γ₁γ₂/(γ₁+γ₂+...)) * |β₁ × β₂|
  const angle = (gamma1 - 1) * (gamma2 - 1) / (gamma1 + gamma2) * crossMag;
  
  return angle;
}
