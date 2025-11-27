/**
 * GaugeField.ts - Gauge Theory Foundation for Unified Field Theory
 * PRD-05 Phase 5.1: Gauge Theory Foundation
 * 
 * Implements:
 * - Lie algebras and Lie groups (SU(2), SU(3), U(1))
 * - Gauge fields and gauge transformations
 * - Yang-Mills action functional
 * - Covariant derivatives
 * - Field strength tensors
 */

import { createHash } from 'crypto';

// ============================================================================
// Utility Functions
// ============================================================================

function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 12);
}

// ============================================================================
// Complex Number Support
// ============================================================================

export interface ComplexNumber {
  re: number;
  im: number;
}

export function complex(re: number, im: number = 0): ComplexNumber {
  return { re, im };
}

export function complexAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexSub(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function complexMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

export function complexScale(a: ComplexNumber, s: number): ComplexNumber {
  return { re: a.re * s, im: a.im * s };
}

export function complexConj(a: ComplexNumber): ComplexNumber {
  return { re: a.re, im: -a.im };
}

export function complexAbs(a: ComplexNumber): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function complexExp(a: ComplexNumber): ComplexNumber {
  const expRe = Math.exp(a.re);
  return { re: expRe * Math.cos(a.im), im: expRe * Math.sin(a.im) };
}

// ============================================================================
// Matrix Operations for Lie Groups
// ============================================================================

export type ComplexMatrix = ComplexNumber[][];

export function matrixCreate(rows: number, cols: number): ComplexMatrix {
  const m: ComplexMatrix = [];
  for (let i = 0; i < rows; i++) {
    m[i] = [];
    for (let j = 0; j < cols; j++) {
      m[i][j] = complex(0);
    }
  }
  return m;
}

export function matrixIdentity(n: number): ComplexMatrix {
  const m = matrixCreate(n, n);
  for (let i = 0; i < n; i++) {
    m[i][i] = complex(1);
  }
  return m;
}

export function matrixAdd(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  const rows = a.length;
  const cols = a[0].length;
  const result = matrixCreate(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = complexAdd(a[i][j], b[i][j]);
    }
  }
  return result;
}

export function matrixSub(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  const rows = a.length;
  const cols = a[0].length;
  const result = matrixCreate(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = complexSub(a[i][j], b[i][j]);
    }
  }
  return result;
}

export function matrixMul(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  const rows = a.length;
  const cols = b[0].length;
  const inner = a[0].length;
  const result = matrixCreate(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = complex(0);
      for (let k = 0; k < inner; k++) {
        sum = complexAdd(sum, complexMul(a[i][k], b[k][j]));
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function matrixScale(m: ComplexMatrix, s: ComplexNumber): ComplexMatrix {
  const rows = m.length;
  const cols = m[0].length;
  const result = matrixCreate(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = complexMul(m[i][j], s);
    }
  }
  return result;
}

export function matrixDagger(m: ComplexMatrix): ComplexMatrix {
  const rows = m.length;
  const cols = m[0].length;
  const result = matrixCreate(cols, rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = complexConj(m[i][j]);
    }
  }
  return result;
}

export function matrixTrace(m: ComplexMatrix): ComplexNumber {
  let sum = complex(0);
  const n = Math.min(m.length, m[0].length);
  for (let i = 0; i < n; i++) {
    sum = complexAdd(sum, m[i][i]);
  }
  return sum;
}

export function matrixCommutator(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  return matrixSub(matrixMul(a, b), matrixMul(b, a));
}

export function matrixAntiCommutator(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
  return matrixAdd(matrixMul(a, b), matrixMul(b, a));
}

// ============================================================================
// Pauli Matrices (Generators for SU(2))
// ============================================================================

export const PAULI_X: ComplexMatrix = [
  [complex(0), complex(1)],
  [complex(1), complex(0)]
];

export const PAULI_Y: ComplexMatrix = [
  [complex(0), complex(0, -1)],
  [complex(0, 1), complex(0)]
];

export const PAULI_Z: ComplexMatrix = [
  [complex(1), complex(0)],
  [complex(0), complex(-1)]
];

export const PAULI_MATRICES = [PAULI_X, PAULI_Y, PAULI_Z];

// SU(2) generators: T_a = σ_a / 2
export const SU2_GENERATORS: ComplexMatrix[] = PAULI_MATRICES.map(m => 
  matrixScale(m, complex(0.5))
);

// ============================================================================
// Gell-Mann Matrices (Generators for SU(3))
// ============================================================================

export const GELL_MANN_1: ComplexMatrix = [
  [complex(0), complex(1), complex(0)],
  [complex(1), complex(0), complex(0)],
  [complex(0), complex(0), complex(0)]
];

export const GELL_MANN_2: ComplexMatrix = [
  [complex(0), complex(0, -1), complex(0)],
  [complex(0, 1), complex(0), complex(0)],
  [complex(0), complex(0), complex(0)]
];

export const GELL_MANN_3: ComplexMatrix = [
  [complex(1), complex(0), complex(0)],
  [complex(0), complex(-1), complex(0)],
  [complex(0), complex(0), complex(0)]
];

export const GELL_MANN_4: ComplexMatrix = [
  [complex(0), complex(0), complex(1)],
  [complex(0), complex(0), complex(0)],
  [complex(1), complex(0), complex(0)]
];

export const GELL_MANN_5: ComplexMatrix = [
  [complex(0), complex(0), complex(0, -1)],
  [complex(0), complex(0), complex(0)],
  [complex(0, 1), complex(0), complex(0)]
];

export const GELL_MANN_6: ComplexMatrix = [
  [complex(0), complex(0), complex(0)],
  [complex(0), complex(0), complex(1)],
  [complex(0), complex(1), complex(0)]
];

export const GELL_MANN_7: ComplexMatrix = [
  [complex(0), complex(0), complex(0)],
  [complex(0), complex(0), complex(0, -1)],
  [complex(0), complex(0, 1), complex(0)]
];

const sqrt3 = Math.sqrt(3);
export const GELL_MANN_8: ComplexMatrix = [
  [complex(1/sqrt3), complex(0), complex(0)],
  [complex(0), complex(1/sqrt3), complex(0)],
  [complex(0), complex(0), complex(-2/sqrt3)]
];

export const GELL_MANN_MATRICES = [
  GELL_MANN_1, GELL_MANN_2, GELL_MANN_3, GELL_MANN_4,
  GELL_MANN_5, GELL_MANN_6, GELL_MANN_7, GELL_MANN_8
];

// SU(3) generators: T_a = λ_a / 2
export const SU3_GENERATORS: ComplexMatrix[] = GELL_MANN_MATRICES.map(m =>
  matrixScale(m, complex(0.5))
);

// ============================================================================
// LieAlgebra Class
// ============================================================================

export interface StructureConstants {
  values: number[][][]; // f^{abc}
  dimension: number;
}

export class LieAlgebra {
  private readonly name: string;
  private readonly generators: ComplexMatrix[];
  private readonly dimension: number;
  private readonly structureConstants: StructureConstants;
  private readonly hash: string;

  constructor(name: string, generators: ComplexMatrix[]) {
    this.name = name;
    this.generators = generators;
    this.dimension = generators.length;
    this.structureConstants = this.computeStructureConstants();
    this.hash = generateHash(`LieAlgebra:${name}:${this.dimension}`);
  }

  private computeStructureConstants(): StructureConstants {
    const n = this.dimension;
    const values: number[][][] = [];
    
    for (let a = 0; a < n; a++) {
      values[a] = [];
      for (let b = 0; b < n; b++) {
        values[a][b] = [];
        for (let c = 0; c < n; c++) {
          values[a][b][c] = 0;
        }
      }
    }

    // Compute [T_a, T_b] = i f^{abc} T_c
    for (let a = 0; a < n; a++) {
      for (let b = 0; b < n; b++) {
        const commutator = matrixCommutator(this.generators[a], this.generators[b]);
        for (let c = 0; c < n; c++) {
          // Extract f^{abc} from Tr([T_a, T_b] T_c) = i f^{abc} Tr(T_c T_c)
          const product = matrixMul(commutator, this.generators[c]);
          const trace = matrixTrace(product);
          // f^{abc} = -2i * Tr([T_a, T_b] T_c) for normalized generators
          values[a][b][c] = -2 * trace.im;
        }
      }
    }

    return { values, dimension: n };
  }

  getName(): string {
    return this.name;
  }

  getDimension(): number {
    return this.dimension;
  }

  getGenerator(index: number): ComplexMatrix {
    if (index < 0 || index >= this.dimension) {
      throw new Error(`Generator index out of range: ${index}`);
    }
    return this.generators[index];
  }

  getGenerators(): ComplexMatrix[] {
    return [...this.generators];
  }

  getStructureConstant(a: number, b: number, c: number): number {
    return this.structureConstants.values[a][b][c];
  }

  getStructureConstants(): StructureConstants {
    return this.structureConstants;
  }

  commutator(a: number, b: number): ComplexMatrix {
    return matrixCommutator(this.generators[a], this.generators[b]);
  }

  // Verify Jacobi identity: [T_a, [T_b, T_c]] + [T_b, [T_c, T_a]] + [T_c, [T_a, T_b]] = 0
  verifyJacobiIdentity(a: number, b: number, c: number, tolerance: number = 1e-10): boolean {
    const Ta = this.generators[a];
    const Tb = this.generators[b];
    const Tc = this.generators[c];

    const term1 = matrixCommutator(Ta, matrixCommutator(Tb, Tc));
    const term2 = matrixCommutator(Tb, matrixCommutator(Tc, Ta));
    const term3 = matrixCommutator(Tc, matrixCommutator(Ta, Tb));

    const sum = matrixAdd(matrixAdd(term1, term2), term3);

    // Check if sum is approximately zero
    for (let i = 0; i < sum.length; i++) {
      for (let j = 0; j < sum[0].length; j++) {
        if (complexAbs(sum[i][j]) > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  // Killing form: K(X, Y) = Tr(ad_X ad_Y)
  killingForm(a: number, b: number): number {
    let sum = 0;
    for (let c = 0; c < this.dimension; c++) {
      for (let d = 0; d < this.dimension; d++) {
        sum += this.structureConstants.values[a][c][d] * 
               this.structureConstants.values[b][d][c];
      }
    }
    return sum;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// LieGroup Class
// ============================================================================

export class LieGroup {
  private readonly name: string;
  private readonly algebra: LieAlgebra;
  private readonly matrixDimension: number;
  private readonly hash: string;

  constructor(name: string, algebra: LieAlgebra, matrixDimension: number) {
    this.name = name;
    this.algebra = algebra;
    this.matrixDimension = matrixDimension;
    this.hash = generateHash(`LieGroup:${name}:${matrixDimension}`);
  }

  getName(): string {
    return this.name;
  }

  getAlgebra(): LieAlgebra {
    return this.algebra;
  }

  getMatrixDimension(): number {
    return this.matrixDimension;
  }

  getDimension(): number {
    return this.algebra.getDimension();
  }

  // Exponential map: exp(i θ^a T_a)
  exponentialMap(parameters: number[]): ComplexMatrix {
    if (parameters.length !== this.algebra.getDimension()) {
      throw new Error('Parameter count must match algebra dimension');
    }

    // Compute θ^a T_a
    let generator = matrixCreate(this.matrixDimension, this.matrixDimension);
    for (let a = 0; a < parameters.length; a++) {
      const scaled = matrixScale(this.algebra.getGenerator(a), complex(parameters[a]));
      generator = matrixAdd(generator, scaled);
    }

    // Multiply by i
    generator = matrixScale(generator, complex(0, 1));

    // Compute exp using Taylor series (for small angles)
    return this.matrixExp(generator);
  }

  private matrixExp(m: ComplexMatrix, terms: number = 20): ComplexMatrix {
    const n = m.length;
    let result = matrixIdentity(n);
    let power = matrixIdentity(n);
    let factorial = 1;

    for (let k = 1; k <= terms; k++) {
      factorial *= k;
      power = matrixMul(power, m);
      const term = matrixScale(power, complex(1 / factorial));
      result = matrixAdd(result, term);
    }

    return result;
  }

  // Create group element from parameters
  createElement(parameters: number[]): GroupElement {
    const matrix = this.exponentialMap(parameters);
    return new GroupElement(this, matrix, parameters);
  }

  // Identity element
  identity(): GroupElement {
    const params = new Array(this.getDimension()).fill(0);
    return new GroupElement(this, matrixIdentity(this.matrixDimension), params);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// GroupElement Class
// ============================================================================

export class GroupElement {
  private readonly group: LieGroup;
  private readonly matrix: ComplexMatrix;
  private readonly parameters: number[];
  private readonly hash: string;

  constructor(group: LieGroup, matrix: ComplexMatrix, parameters: number[]) {
    this.group = group;
    this.matrix = matrix;
    this.parameters = [...parameters];
    this.hash = generateHash(`GroupElement:${JSON.stringify(parameters)}`);
  }

  getMatrix(): ComplexMatrix {
    return this.matrix;
  }

  getParameters(): number[] {
    return [...this.parameters];
  }

  getGroup(): LieGroup {
    return this.group;
  }

  // Group multiplication
  multiply(other: GroupElement): GroupElement {
    const product = matrixMul(this.matrix, other.matrix);
    // Parameters are approximate for the product
    const params = this.parameters.map((p, i) => p + other.parameters[i]);
    return new GroupElement(this.group, product, params);
  }

  // Inverse element
  inverse(): GroupElement {
    const inv = matrixDagger(this.matrix); // For unitary groups, U^{-1} = U^†
    const params = this.parameters.map(p => -p);
    return new GroupElement(this.group, inv, params);
  }

  // Adjoint representation: Ad_g(X) = g X g^{-1}
  adjoint(algebraElement: ComplexMatrix): ComplexMatrix {
    const inv = matrixDagger(this.matrix);
    return matrixMul(matrixMul(this.matrix, algebraElement), inv);
  }

  // Check if unitary: U U^† = I
  isUnitary(tolerance: number = 1e-10): boolean {
    const product = matrixMul(this.matrix, matrixDagger(this.matrix));
    const identity = matrixIdentity(this.matrix.length);
    
    for (let i = 0; i < product.length; i++) {
      for (let j = 0; j < product[0].length; j++) {
        const diff = complexSub(product[i][j], identity[i][j]);
        if (complexAbs(diff) > tolerance) {
          return false;
        }
      }
    }
    return true;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// GaugeField Class
// ============================================================================

export interface SpacetimePoint {
  t: number;
  x: number;
  y: number;
  z: number;
}

export type GaugePotentialFunction = (point: SpacetimePoint, mu: number, a: number) => number;

export class GaugeField {
  private readonly group: LieGroup;
  private readonly potential: GaugePotentialFunction;
  private readonly hash: string;

  constructor(group: LieGroup, potential: GaugePotentialFunction) {
    this.group = group;
    this.potential = potential;
    this.hash = generateHash(`GaugeField:${group.getName()}`);
  }

  getGroup(): LieGroup {
    return this.group;
  }

  // Get gauge potential A^a_μ(x)
  getPotential(point: SpacetimePoint, mu: number, a: number): number {
    return this.potential(point, mu, a);
  }

  // Get gauge potential as matrix: A_μ = A^a_μ T_a
  getPotentialMatrix(point: SpacetimePoint, mu: number): ComplexMatrix {
    const algebra = this.group.getAlgebra();
    const n = this.group.getMatrixDimension();
    let result = matrixCreate(n, n);

    for (let a = 0; a < algebra.getDimension(); a++) {
      const Aa = this.potential(point, mu, a);
      const scaled = matrixScale(algebra.getGenerator(a), complex(Aa));
      result = matrixAdd(result, scaled);
    }

    return result;
  }

  // Field strength tensor: F^a_{μν} = ∂_μ A^a_ν - ∂_ν A^a_μ + g f^{abc} A^b_μ A^c_ν
  fieldStrength(point: SpacetimePoint, mu: number, nu: number, a: number, 
                couplingConstant: number = 1, epsilon: number = 1e-6): number {
    const algebra = this.group.getAlgebra();
    
    // Compute partial derivatives numerically
    const pointMuPlus = { ...point };
    const pointMuMinus = { ...point };
    const pointNuPlus = { ...point };
    const pointNuMinus = { ...point };

    const coords = ['t', 'x', 'y', 'z'] as const;
    (pointMuPlus as any)[coords[mu]] += epsilon;
    (pointMuMinus as any)[coords[mu]] -= epsilon;
    (pointNuPlus as any)[coords[nu]] += epsilon;
    (pointNuMinus as any)[coords[nu]] -= epsilon;

    // ∂_μ A^a_ν
    const dMuANu = (this.potential(pointMuPlus, nu, a) - this.potential(pointMuMinus, nu, a)) / (2 * epsilon);
    
    // ∂_ν A^a_μ
    const dNuAMu = (this.potential(pointNuPlus, mu, a) - this.potential(pointNuMinus, mu, a)) / (2 * epsilon);

    // Non-Abelian term: g f^{abc} A^b_μ A^c_ν
    let nonAbelian = 0;
    for (let b = 0; b < algebra.getDimension(); b++) {
      for (let c = 0; c < algebra.getDimension(); c++) {
        const f = algebra.getStructureConstant(a, b, c);
        if (Math.abs(f) > 1e-10) {
          nonAbelian += f * this.potential(point, mu, b) * this.potential(point, nu, c);
        }
      }
    }

    return dMuANu - dNuAMu + couplingConstant * nonAbelian;
  }

  // Field strength as matrix: F_{μν} = F^a_{μν} T_a
  fieldStrengthMatrix(point: SpacetimePoint, mu: number, nu: number,
                      couplingConstant: number = 1): ComplexMatrix {
    const algebra = this.group.getAlgebra();
    const n = this.group.getMatrixDimension();
    let result = matrixCreate(n, n);

    for (let a = 0; a < algebra.getDimension(); a++) {
      const Fa = this.fieldStrength(point, mu, nu, a, couplingConstant);
      const scaled = matrixScale(algebra.getGenerator(a), complex(Fa));
      result = matrixAdd(result, scaled);
    }

    return result;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// GaugeTransform Class
// ============================================================================

export type GaugeTransformFunction = (point: SpacetimePoint) => number[];

export class GaugeTransform {
  private readonly group: LieGroup;
  private readonly transformParams: GaugeTransformFunction;
  private readonly hash: string;

  constructor(group: LieGroup, transformParams: GaugeTransformFunction) {
    this.group = group;
    this.transformParams = transformParams;
    this.hash = generateHash(`GaugeTransform:${group.getName()}`);
  }

  getGroup(): LieGroup {
    return this.group;
  }

  // Get transformation matrix U(x) at a point
  getTransformMatrix(point: SpacetimePoint): ComplexMatrix {
    const params = this.transformParams(point);
    return this.group.exponentialMap(params);
  }

  // Get group element at a point
  getElement(point: SpacetimePoint): GroupElement {
    const params = this.transformParams(point);
    return this.group.createElement(params);
  }

  // Transform gauge field: A'_μ = U A_μ U^† + (i/g) U ∂_μ U^†
  transformField(field: GaugeField, couplingConstant: number = 1): GaugeField {
    const newPotential: GaugePotentialFunction = (point, mu, a) => {
      const U = this.getTransformMatrix(point);
      const Udagger = matrixDagger(U);
      const A = field.getPotentialMatrix(point, mu);

      // U A_μ U^†
      const transformed = matrixMul(matrixMul(U, A), Udagger);

      // For the derivative term, we'd need numerical differentiation
      // Simplified: just return the transformed part
      const algebra = this.group.getAlgebra();
      const generator = algebra.getGenerator(a);
      const trace = matrixTrace(matrixMul(transformed, generator));
      return 2 * trace.re; // Tr(A T_a) extracts coefficient
    };

    return new GaugeField(this.group, newPotential);
  }

  // Transform matter field: ψ'(x) = U(x) ψ(x)
  transformMatter(field: ComplexMatrix, point: SpacetimePoint): ComplexMatrix {
    const U = this.getTransformMatrix(point);
    return matrixMul(U, field);
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// CovariantDerivative Class
// ============================================================================

export class CovariantDerivative {
  private readonly field: GaugeField;
  private readonly couplingConstant: number;
  private readonly hash: string;

  constructor(field: GaugeField, couplingConstant: number = 1) {
    this.field = field;
    this.couplingConstant = couplingConstant;
    this.hash = generateHash(`CovariantDerivative:${field.getHash()}`);
  }

  getField(): GaugeField {
    return this.field;
  }

  getCouplingConstant(): number {
    return this.couplingConstant;
  }

  // Covariant derivative: D_μ ψ = ∂_μ ψ + i g A_μ ψ
  apply(psi: ComplexMatrix, point: SpacetimePoint, mu: number, 
        psiDerivative: ComplexMatrix): ComplexMatrix {
    const A = this.field.getPotentialMatrix(point, mu);
    const igA = matrixScale(A, complex(0, this.couplingConstant));
    const connection = matrixMul(igA, psi);
    return matrixAdd(psiDerivative, connection);
  }

  // Commutator of covariant derivatives: [D_μ, D_ν] = i g F_{μν}
  commutator(point: SpacetimePoint, mu: number, nu: number): ComplexMatrix {
    const F = this.field.fieldStrengthMatrix(point, mu, nu, this.couplingConstant);
    return matrixScale(F, complex(0, this.couplingConstant));
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// YangMillsAction Class
// ============================================================================

export class YangMillsAction {
  private readonly field: GaugeField;
  private readonly couplingConstant: number;
  private readonly hash: string;

  constructor(field: GaugeField, couplingConstant: number = 1) {
    this.field = field;
    this.couplingConstant = couplingConstant;
    this.hash = generateHash(`YangMillsAction:${field.getHash()}`);
  }

  getField(): GaugeField {
    return this.field;
  }

  getCouplingConstant(): number {
    return this.couplingConstant;
  }

  // Lagrangian density: L = -1/4 F^a_{μν} F^{a μν}
  lagrangianDensity(point: SpacetimePoint): number {
    const algebra = this.field.getGroup().getAlgebra();
    let sum = 0;

    // Minkowski metric: η^{μν} = diag(-1, 1, 1, 1)
    const eta = [-1, 1, 1, 1];

    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        for (let a = 0; a < algebra.getDimension(); a++) {
          const F = this.field.fieldStrength(point, mu, nu, a, this.couplingConstant);
          // F^{μν} = η^{μρ} η^{νσ} F_{ρσ}
          sum += eta[mu] * eta[nu] * F * F;
        }
      }
    }

    return -0.25 * sum;
  }

  // Action: S = ∫ d⁴x L
  // Numerical integration over a region
  action(tRange: [number, number], xRange: [number, number],
         yRange: [number, number], zRange: [number, number],
         steps: number = 10): number {
    const dt = (tRange[1] - tRange[0]) / steps;
    const dx = (xRange[1] - xRange[0]) / steps;
    const dy = (yRange[1] - yRange[0]) / steps;
    const dz = (zRange[1] - zRange[0]) / steps;
    const dV = dt * dx * dy * dz;

    let sum = 0;
    for (let it = 0; it < steps; it++) {
      for (let ix = 0; ix < steps; ix++) {
        for (let iy = 0; iy < steps; iy++) {
          for (let iz = 0; iz < steps; iz++) {
            const point: SpacetimePoint = {
              t: tRange[0] + (it + 0.5) * dt,
              x: xRange[0] + (ix + 0.5) * dx,
              y: yRange[0] + (iy + 0.5) * dy,
              z: zRange[0] + (iz + 0.5) * dz
            };
            sum += this.lagrangianDensity(point) * dV;
          }
        }
      }
    }

    return sum;
  }

  // Energy-momentum tensor: T^{μν} = F^{aμρ} F^{aν}_ρ - (1/4) η^{μν} F^{aρσ} F^a_{ρσ}
  energyMomentumTensor(point: SpacetimePoint, mu: number, nu: number): number {
    const algebra = this.field.getGroup().getAlgebra();
    const eta = [-1, 1, 1, 1];

    let firstTerm = 0;
    for (let rho = 0; rho < 4; rho++) {
      for (let a = 0; a < algebra.getDimension(); a++) {
        const FMuRho = this.field.fieldStrength(point, mu, rho, a, this.couplingConstant);
        const FNuRho = this.field.fieldStrength(point, nu, rho, a, this.couplingConstant);
        firstTerm += eta[rho] * FMuRho * FNuRho;
      }
    }

    let secondTerm = 0;
    for (let rho = 0; rho < 4; rho++) {
      for (let sigma = 0; sigma < 4; sigma++) {
        for (let a = 0; a < algebra.getDimension(); a++) {
          const F = this.field.fieldStrength(point, rho, sigma, a, this.couplingConstant);
          secondTerm += eta[rho] * eta[sigma] * F * F;
        }
      }
    }

    return firstTerm - 0.25 * eta[mu] * eta[nu] * secondTerm;
  }

  getHash(): string {
    return this.hash;
  }
}

// ============================================================================
// GaugeFieldFactory
// ============================================================================

export class GaugeFieldFactory {
  // Create U(1) gauge theory (electromagnetism)
  static u1(): { group: LieGroup; algebra: LieAlgebra } {
    // U(1) has single generator (identity matrix scaled)
    const generator: ComplexMatrix = [[complex(1)]];
    const algebra = new LieAlgebra('u(1)', [generator]);
    const group = new LieGroup('U(1)', algebra, 1);
    return { group, algebra };
  }

  // Create SU(2) gauge theory (weak force)
  static su2(): { group: LieGroup; algebra: LieAlgebra } {
    const algebra = new LieAlgebra('su(2)', SU2_GENERATORS);
    const group = new LieGroup('SU(2)', algebra, 2);
    return { group, algebra };
  }

  // Create SU(3) gauge theory (strong force / QCD)
  static su3(): { group: LieGroup; algebra: LieAlgebra } {
    const algebra = new LieAlgebra('su(3)', SU3_GENERATORS);
    const group = new LieGroup('SU(3)', algebra, 3);
    return { group, algebra };
  }

  // Create a constant gauge field
  static constantField(group: LieGroup, values: number[][]): GaugeField {
    // values[mu][a] = A^a_μ (constant)
    const potential: GaugePotentialFunction = (_point, mu, a) => {
      return values[mu]?.[a] ?? 0;
    };
    return new GaugeField(group, potential);
  }

  // Create a plane wave gauge field
  static planeWaveField(group: LieGroup, amplitude: number, 
                        wavevector: number[], frequency: number,
                        generatorIndex: number = 0): GaugeField {
    const potential: GaugePotentialFunction = (point, mu, a) => {
      if (a !== generatorIndex) return 0;
      if (mu !== 1) return 0; // Only A_x component
      
      const phase = frequency * point.t - 
                    wavevector[0] * point.x - 
                    wavevector[1] * point.y - 
                    wavevector[2] * point.z;
      return amplitude * Math.cos(phase);
    };
    return new GaugeField(group, potential);
  }

  // Create Coulomb-like gauge field (for U(1))
  static coulombField(group: LieGroup, charge: number): GaugeField {
    const potential: GaugePotentialFunction = (point, mu, a) => {
      if (a !== 0) return 0;
      if (mu !== 0) return 0; // Only A_0 (scalar potential)
      
      const r = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
      if (r < 1e-10) return 0;
      return charge / (4 * Math.PI * r);
    };
    return new GaugeField(group, potential);
  }

  // Create instanton-like configuration for SU(2)
  static instantonField(group: LieGroup, rho: number, center: SpacetimePoint): GaugeField {
    const potential: GaugePotentialFunction = (point, mu, a) => {
      // BPST instanton in singular gauge (simplified)
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const dz = point.z - center.z;
      const dt = point.t - center.t;
      
      const r2 = dx * dx + dy * dy + dz * dz + dt * dt;
      const factor = rho * rho / (r2 + rho * rho);
      
      // Simplified instanton profile
      if (mu === 0) return 0;
      
      const coords = [dt, dx, dy, dz];
      // η^a_{μν} symbols (simplified)
      return factor * coords[a] / (r2 + 1e-10);
    };
    return new GaugeField(group, potential);
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  generateHash,
  matrixCreate,
  matrixIdentity,
  matrixAdd,
  matrixSub,
  matrixMul,
  matrixScale,
  matrixDagger,
  matrixTrace,
  matrixCommutator,
  matrixAntiCommutator
};
