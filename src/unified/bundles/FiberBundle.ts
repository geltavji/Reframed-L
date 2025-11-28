/**
 * FiberBundle.ts
 * Fiber Bundle Mathematics for Unified Field Theory (PRD-05 Phase 5.2)
 * 
 * Implements mathematical structures for gauge theories including:
 * - Fiber bundles (principal and associated)
 * - Connection forms and curvature 2-forms
 * - Parallel transport and holonomy
 * - Chern classes and characteristic classes
 */

import { createHash } from 'crypto';

/**
 * Generate hash for verification
 */
function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Manifold - Base space for fiber bundles
 */
export class Manifold {
  private readonly name: string;
  private readonly dimension: number;
  private readonly coordinates: string[];
  private readonly hash: string;

  constructor(name: string, dimension: number, coordinates?: string[]) {
    if (dimension <= 0) {
      throw new Error('Dimension must be positive');
    }
    this.name = name;
    this.dimension = dimension;
    this.coordinates = coordinates || this.generateDefaultCoordinates(dimension);
    if (this.coordinates.length !== dimension) {
      throw new Error(`Number of coordinates (${this.coordinates.length}) must equal dimension (${dimension})`);
    }
    this.hash = generateHash(`Manifold:${name}:${dimension}:${this.coordinates.join(',')}`);
  }

  private generateDefaultCoordinates(dim: number): string[] {
    const coords: string[] = [];
    for (let i = 0; i < dim; i++) {
      coords.push(`x${i}`);
    }
    return coords;
  }

  getName(): string { return this.name; }
  getDimension(): number { return this.dimension; }
  getCoordinates(): string[] { return [...this.coordinates]; }
  getHash(): string { return this.hash; }

  /**
   * Create a chart (local coordinate system)
   */
  createChart(point: number[]): Chart {
    if (point.length !== this.dimension) {
      throw new Error(`Point dimension (${point.length}) must equal manifold dimension (${this.dimension})`);
    }
    return new Chart(this, point);
  }

  /**
   * Check if point is in manifold (abstract - always true for base class)
   */
  containsPoint(point: number[]): boolean {
    return point.length === this.dimension;
  }
}

/**
 * Chart - Local coordinate patch on a manifold
 */
export class Chart {
  private readonly manifold: Manifold;
  private readonly center: number[];
  private readonly hash: string;

  constructor(manifold: Manifold, center: number[]) {
    this.manifold = manifold;
    this.center = [...center];
    this.hash = generateHash(`Chart:${manifold.getHash()}:${center.join(',')}`);
  }

  getManifold(): Manifold { return this.manifold; }
  getCenter(): number[] { return [...this.center]; }
  getHash(): string { return this.hash; }

  /**
   * Transform coordinates in this chart
   */
  localCoordinates(point: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < point.length; i++) {
      result.push(point[i] - this.center[i]);
    }
    return result;
  }
}

/**
 * LieGroup - Structure group for fiber bundles
 */
export class LieGroup {
  private readonly name: string;
  private readonly dimension: number;
  private readonly generators: number[][][]; // Lie algebra generators
  private readonly hash: string;

  constructor(name: string, dimension: number, generators?: number[][][]) {
    this.name = name;
    this.dimension = dimension;
    this.generators = generators || [];
    this.hash = generateHash(`LieGroup:${name}:${dimension}`);
  }

  getName(): string { return this.name; }
  getDimension(): number { return this.dimension; }
  getGenerators(): number[][][] { return this.generators.map(g => g.map(r => [...r])); }
  getHash(): string { return this.hash; }

  /**
   * Get Lie algebra dimension
   */
  getAlgebraDimension(): number {
    return this.generators.length;
  }

  /**
   * Identity element
   */
  identity(matrixDim: number): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < matrixDim; i++) {
      result.push(new Array(matrixDim).fill(0));
      result[i][i] = 1;
    }
    return result;
  }

  /**
   * Group multiplication (matrix multiplication)
   */
  multiply(g1: number[][], g2: number[][]): number[][] {
    const n = g1.length;
    const result: number[][] = [];
    for (let i = 0; i < n; i++) {
      result.push(new Array(n).fill(0));
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          result[i][j] += g1[i][k] * g2[k][j];
        }
      }
    }
    return result;
  }

  /**
   * Group inverse (matrix inverse for small matrices)
   */
  inverse(g: number[][]): number[][] {
    const n = g.length;
    if (n === 1) {
      return [[1 / g[0][0]]];
    }
    if (n === 2) {
      const det = g[0][0] * g[1][1] - g[0][1] * g[1][0];
      return [
        [g[1][1] / det, -g[0][1] / det],
        [-g[1][0] / det, g[0][0] / det]
      ];
    }
    // For larger matrices, use adjugate method
    return this.matrixInverse(g);
  }

  private matrixInverse(m: number[][]): number[][] {
    const n = m.length;
    const aug: number[][] = m.map((row, i) => {
      const augRow = [...row];
      for (let j = 0; j < n; j++) {
        augRow.push(i === j ? 1 : 0);
      }
      return augRow;
    });

    // Gaussian elimination
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
          maxRow = row;
        }
      }
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

      const pivot = aug[col][col];
      for (let j = 0; j < 2 * n; j++) {
        aug[col][j] /= pivot;
      }

      for (let row = 0; row < n; row++) {
        if (row !== col) {
          const factor = aug[row][col];
          for (let j = 0; j < 2 * n; j++) {
            aug[row][j] -= factor * aug[col][j];
          }
        }
      }
    }

    return aug.map(row => row.slice(n));
  }
}

/**
 * Fiber - The fiber space attached to each point
 */
export class Fiber {
  private readonly dimension: number;
  private readonly type: 'vector' | 'principal' | 'associated';
  private readonly structureGroup: LieGroup;
  private readonly hash: string;

  constructor(dimension: number, type: 'vector' | 'principal' | 'associated', structureGroup: LieGroup) {
    this.dimension = dimension;
    this.type = type;
    this.structureGroup = structureGroup;
    this.hash = generateHash(`Fiber:${dimension}:${type}:${structureGroup.getHash()}`);
  }

  getDimension(): number { return this.dimension; }
  getType(): string { return this.type; }
  getStructureGroup(): LieGroup { return this.structureGroup; }
  getHash(): string { return this.hash; }

  /**
   * Get a point in the fiber
   */
  point(coords: number[]): FiberPoint {
    if (coords.length !== this.dimension) {
      throw new Error(`Coordinates dimension must equal fiber dimension`);
    }
    return new FiberPoint(this, coords);
  }
}

/**
 * FiberPoint - A point in the fiber
 */
export class FiberPoint {
  private readonly fiber: Fiber;
  private readonly coordinates: number[];
  private readonly hash: string;

  constructor(fiber: Fiber, coordinates: number[]) {
    this.fiber = fiber;
    this.coordinates = [...coordinates];
    this.hash = generateHash(`FiberPoint:${fiber.getHash()}:${coordinates.join(',')}`);
  }

  getFiber(): Fiber { return this.fiber; }
  getCoordinates(): number[] { return [...this.coordinates]; }
  getHash(): string { return this.hash; }

  /**
   * Apply group action to fiber point
   */
  act(groupElement: number[][]): FiberPoint {
    const n = this.coordinates.length;
    const result: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        result[i] += groupElement[i][j] * this.coordinates[j];
      }
    }
    return new FiberPoint(this.fiber, result);
  }
}

/**
 * FiberBundle - Principal or associated fiber bundle
 */
export class FiberBundle {
  private readonly name: string;
  private readonly base: Manifold;
  private readonly fiber: Fiber;
  private readonly structureGroup: LieGroup;
  private readonly hash: string;

  constructor(name: string, base: Manifold, fiber: Fiber, structureGroup: LieGroup) {
    this.name = name;
    this.base = base;
    this.fiber = fiber;
    this.structureGroup = structureGroup;
    this.hash = generateHash(`FiberBundle:${name}:${base.getHash()}:${fiber.getHash()}:${structureGroup.getHash()}`);
  }

  getName(): string { return this.name; }
  getBase(): Manifold { return this.base; }
  getFiber(): Fiber { return this.fiber; }
  getStructureGroup(): LieGroup { return this.structureGroup; }
  getHash(): string { return this.hash; }

  /**
   * Get total space dimension
   */
  getTotalDimension(): number {
    return this.base.getDimension() + this.fiber.getDimension();
  }

  /**
   * Project from total space to base
   */
  project(totalPoint: number[]): number[] {
    const baseDim = this.base.getDimension();
    return totalPoint.slice(0, baseDim);
  }

  /**
   * Get fiber at a point
   */
  fiberAt(_basePoint: number[]): Fiber {
    // All fibers are isomorphic
    return this.fiber;
  }

  /**
   * Create a section of the bundle
   */
  createSection(sectionFn: (basePoint: number[]) => number[]): Section {
    return new Section(this, sectionFn);
  }

  /**
   * Check if bundle is trivial (locally always trivial)
   */
  isLocallyTrivial(): boolean {
    return true; // Fiber bundles are locally trivial by definition
  }
}

/**
 * Section - A cross-section of a fiber bundle
 */
export class Section {
  private readonly bundle: FiberBundle;
  private readonly sectionFn: (basePoint: number[]) => number[];
  private readonly hash: string;

  constructor(bundle: FiberBundle, sectionFn: (basePoint: number[]) => number[]) {
    this.bundle = bundle;
    this.sectionFn = sectionFn;
    this.hash = generateHash(`Section:${bundle.getHash()}:${Date.now()}`);
  }

  getBundle(): FiberBundle { return this.bundle; }
  getHash(): string { return this.hash; }

  /**
   * Evaluate section at a point
   */
  at(basePoint: number[]): number[] {
    return this.sectionFn(basePoint);
  }

  /**
   * Add two sections (for vector bundles)
   */
  add(other: Section): Section {
    return new Section(this.bundle, (p) => {
      const v1 = this.at(p);
      const v2 = other.at(p);
      return v1.map((x, i) => x + v2[i]);
    });
  }

  /**
   * Scale section by a function
   */
  scale(fn: (basePoint: number[]) => number): Section {
    return new Section(this.bundle, (p) => {
      const v = this.at(p);
      const s = fn(p);
      return v.map(x => x * s);
    });
  }
}

/**
 * Connection - Connection on a fiber bundle (gauge field)
 */
export class Connection {
  private readonly bundle: FiberBundle;
  private readonly connectionForm: (basePoint: number[], direction: number) => number[][];
  private readonly hash: string;

  constructor(bundle: FiberBundle, connectionForm: (basePoint: number[], direction: number) => number[][]) {
    this.bundle = bundle;
    this.connectionForm = connectionForm;
    this.hash = generateHash(`Connection:${bundle.getHash()}:${Date.now()}`);
  }

  getBundle(): FiberBundle { return this.bundle; }
  getHash(): string { return this.hash; }

  /**
   * Get connection 1-form component A_μ at a point
   */
  getComponent(basePoint: number[], direction: number): number[][] {
    return this.connectionForm(basePoint, direction);
  }

  /**
   * Covariant derivative of a section
   */
  covariantDerivative(section: Section, basePoint: number[], direction: number, epsilon: number = 1e-6): number[] {
    const baseDim = this.bundle.getBase().getDimension();
    
    // Ordinary derivative
    const pointPlus = [...basePoint];
    const pointMinus = [...basePoint];
    pointPlus[direction] += epsilon;
    pointMinus[direction] -= epsilon;
    
    const sPlus = section.at(pointPlus);
    const sMinus = section.at(pointMinus);
    const ordinaryDeriv = sPlus.map((x, i) => (x - sMinus[i]) / (2 * epsilon));
    
    // Connection term: A_μ · s
    const A = this.connectionForm(basePoint, direction);
    const s = section.at(basePoint);
    const connectionTerm: number[] = new Array(s.length).fill(0);
    for (let i = 0; i < s.length; i++) {
      for (let j = 0; j < s.length; j++) {
        connectionTerm[i] += A[i][j] * s[j];
      }
    }
    
    // D_μ s = ∂_μ s + A_μ · s
    return ordinaryDeriv.map((x, i) => x + connectionTerm[i]);
  }

  /**
   * Compute curvature 2-form F_μν = ∂_μ A_ν - ∂_ν A_μ + [A_μ, A_ν]
   */
  curvature(basePoint: number[], mu: number, nu: number, epsilon: number = 1e-6): number[][] {
    const baseDim = this.bundle.getBase().getDimension();
    if (mu >= baseDim || nu >= baseDim) {
      throw new Error('Direction indices must be less than base dimension');
    }

    // ∂_μ A_ν
    const pointPlusMu = [...basePoint];
    const pointMinusMu = [...basePoint];
    pointPlusMu[mu] += epsilon;
    pointMinusMu[mu] -= epsilon;
    
    const Anu_plus = this.connectionForm(pointPlusMu, nu);
    const Anu_minus = this.connectionForm(pointMinusMu, nu);
    const dmuAnu = Anu_plus.map((row, i) => row.map((x, j) => (x - Anu_minus[i][j]) / (2 * epsilon)));

    // ∂_ν A_μ
    const pointPlusNu = [...basePoint];
    const pointMinusNu = [...basePoint];
    pointPlusNu[nu] += epsilon;
    pointMinusNu[nu] -= epsilon;
    
    const Amu_plus = this.connectionForm(pointPlusNu, mu);
    const Amu_minus = this.connectionForm(pointMinusNu, mu);
    const dnuAmu = Amu_plus.map((row, i) => row.map((x, j) => (x - Amu_minus[i][j]) / (2 * epsilon)));

    // [A_μ, A_ν] = A_μ A_ν - A_ν A_μ
    const Amu = this.connectionForm(basePoint, mu);
    const Anu = this.connectionForm(basePoint, nu);
    const n = Amu.length;
    const commutator: number[][] = [];
    for (let i = 0; i < n; i++) {
      commutator.push(new Array(n).fill(0));
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          commutator[i][j] += Amu[i][k] * Anu[k][j] - Anu[i][k] * Amu[k][j];
        }
      }
    }

    // F_μν = ∂_μ A_ν - ∂_ν A_μ + [A_μ, A_ν]
    const F: number[][] = [];
    for (let i = 0; i < n; i++) {
      F.push(new Array(n).fill(0));
      for (let j = 0; j < n; j++) {
        F[i][j] = dmuAnu[i][j] - dnuAmu[i][j] + commutator[i][j];
      }
    }

    return F;
  }

  /**
   * Check if connection is flat (curvature = 0)
   */
  isFlat(basePoint: number[], tolerance: number = 1e-10): boolean {
    const baseDim = this.bundle.getBase().getDimension();
    for (let mu = 0; mu < baseDim; mu++) {
      for (let nu = mu + 1; nu < baseDim; nu++) {
        const F = this.curvature(basePoint, mu, nu);
        for (const row of F) {
          for (const val of row) {
            if (Math.abs(val) > tolerance) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }
}

/**
 * Curvature2Form - Curvature 2-form on a bundle
 */
export class Curvature2Form {
  private readonly connection: Connection;
  private readonly hash: string;

  constructor(connection: Connection) {
    this.connection = connection;
    this.hash = generateHash(`Curvature2Form:${connection.getHash()}`);
  }

  getConnection(): Connection { return this.connection; }
  getHash(): string { return this.hash; }

  /**
   * Evaluate curvature F_μν at a point
   */
  at(basePoint: number[], mu: number, nu: number): number[][] {
    return this.connection.curvature(basePoint, mu, nu);
  }

  /**
   * Compute trace of curvature (for Chern class)
   */
  trace(basePoint: number[], mu: number, nu: number): number {
    const F = this.at(basePoint, mu, nu);
    let tr = 0;
    for (let i = 0; i < F.length; i++) {
      tr += F[i][i];
    }
    return tr;
  }

  /**
   * Compute curvature scalar F_μν F^μν
   */
  curvatureScalar(basePoint: number[], metric?: number[][]): number {
    const baseDim = this.connection.getBundle().getBase().getDimension();
    let scalar = 0;

    // Default Euclidean metric if not provided
    const g = metric || Array.from({ length: baseDim }, (_, i) => 
      Array.from({ length: baseDim }, (_, j) => i === j ? 1 : 0)
    );

    for (let mu = 0; mu < baseDim; mu++) {
      for (let nu = 0; nu < baseDim; nu++) {
        const F_munu = this.at(basePoint, mu, nu);
        for (let rho = 0; rho < baseDim; rho++) {
          for (let sigma = 0; sigma < baseDim; sigma++) {
            const F_rhosigma = this.at(basePoint, rho, sigma);
            const factor = g[mu][rho] * g[nu][sigma];
            for (let i = 0; i < F_munu.length; i++) {
              for (let j = 0; j < F_munu.length; j++) {
                scalar += factor * F_munu[i][j] * F_rhosigma[j][i];
              }
            }
          }
        }
      }
    }
    return scalar;
  }
}

/**
 * ParallelTransport - Parallel transport along a path
 */
export class ParallelTransport {
  private readonly connection: Connection;
  private readonly hash: string;

  constructor(connection: Connection) {
    this.connection = connection;
    this.hash = generateHash(`ParallelTransport:${connection.getHash()}`);
  }

  getConnection(): Connection { return this.connection; }
  getHash(): string { return this.hash; }

  /**
   * Transport a fiber element along a path
   * Path is parametrized as path(t) for t in [0, 1]
   */
  transport(
    initialPoint: number[],
    path: (t: number) => number[],
    steps: number = 100
  ): number[][] {
    const bundle = this.connection.getBundle();
    const fiberDim = bundle.getFiber().getDimension();
    const baseDim = bundle.getBase().getDimension();
    
    // Start with identity transformation
    let transport = bundle.getStructureGroup().identity(fiberDim);
    
    const dt = 1 / steps;
    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      const currentPoint = path(t);
      
      // Compute path velocity (tangent vector)
      const nextPoint = path(t + dt);
      const velocity: number[] = nextPoint.map((x, j) => (x - currentPoint[j]) / dt);
      
      // Compute connection contribution: A_μ dx^μ/dt
      const connectionMatrix: number[][] = Array.from({ length: fiberDim }, () => 
        new Array(fiberDim).fill(0)
      );
      
      for (let mu = 0; mu < baseDim; mu++) {
        const A_mu = this.connection.getComponent(currentPoint, mu);
        for (let a = 0; a < fiberDim; a++) {
          for (let b = 0; b < fiberDim; b++) {
            connectionMatrix[a][b] += A_mu[a][b] * velocity[mu];
          }
        }
      }
      
      // Evolution: dU/dt = -A U, so U(t+dt) ≈ (1 - A dt) U(t)
      const newTransport: number[][] = [];
      for (let a = 0; a < fiberDim; a++) {
        newTransport.push(new Array(fiberDim).fill(0));
        for (let b = 0; b < fiberDim; b++) {
          newTransport[a][b] = transport[a][b];
          for (let c = 0; c < fiberDim; c++) {
            newTransport[a][b] -= connectionMatrix[a][c] * transport[c][b] * dt;
          }
        }
      }
      transport = newTransport;
    }
    
    return transport;
  }

  /**
   * Compute holonomy around a closed loop
   */
  holonomy(
    basePoint: number[],
    loop: (t: number) => number[],
    steps: number = 100
  ): number[][] {
    return this.transport(basePoint, loop, steps);
  }
}

/**
 * ChernClass - Characteristic class calculations
 */
export class ChernClass {
  private readonly curvature: Curvature2Form;
  private readonly hash: string;

  constructor(curvature: Curvature2Form) {
    this.curvature = curvature;
    this.hash = generateHash(`ChernClass:${curvature.getHash()}`);
  }

  getCurvature(): Curvature2Form { return this.curvature; }
  getHash(): string { return this.hash; }

  /**
   * First Chern class c_1 = (i/2π) Tr(F)
   */
  firstChernNumber(basePoint: number[], mu: number, nu: number): number {
    const trace = this.curvature.trace(basePoint, mu, nu);
    return trace / (2 * Math.PI);
  }

  /**
   * Second Chern class contribution (for SU(n) bundles)
   * c_2 = (1/8π²) Tr(F ∧ F)
   */
  secondChernNumber(basePoint: number[]): number {
    const baseDim = this.curvature.getConnection().getBundle().getBase().getDimension();
    let c2 = 0;
    
    for (let mu = 0; mu < baseDim; mu++) {
      for (let nu = mu + 1; nu < baseDim; nu++) {
        const F_munu = this.curvature.at(basePoint, mu, nu);
        // Tr(F^2) contribution
        let trF2 = 0;
        for (let i = 0; i < F_munu.length; i++) {
          for (let j = 0; j < F_munu.length; j++) {
            trF2 += F_munu[i][j] * F_munu[j][i];
          }
        }
        c2 += trF2;
      }
    }
    
    return c2 / (8 * Math.PI * Math.PI);
  }

  /**
   * Chern character (exponential of curvature)
   */
  chernCharacter(basePoint: number[], order: number = 2): number {
    let ch = 1; // ch_0 = rank
    
    // ch_1 = c_1
    const baseDim = this.curvature.getConnection().getBundle().getBase().getDimension();
    if (order >= 1 && baseDim >= 2) {
      ch += this.firstChernNumber(basePoint, 0, 1);
    }
    
    // ch_2 = (c_1^2 - 2c_2)/2
    if (order >= 2 && baseDim >= 2) {
      const c1 = this.firstChernNumber(basePoint, 0, 1);
      const c2 = this.secondChernNumber(basePoint);
      ch += (c1 * c1 - 2 * c2) / 2;
    }
    
    return ch;
  }
}

/**
 * FiberBundleFactory - Factory for creating common fiber bundles
 */
export class FiberBundleFactory {
  /**
   * Create trivial bundle E = M × F
   */
  static trivial(baseDim: number, fiberDim: number): FiberBundle {
    const base = new Manifold('R' + baseDim, baseDim);
    const group = new LieGroup('GL(' + fiberDim + ')', fiberDim * fiberDim);
    const fiber = new Fiber(fiberDim, 'vector', group);
    return new FiberBundle('Trivial', base, fiber, group);
  }

  /**
   * Create tangent bundle TM
   */
  static tangent(baseDim: number): FiberBundle {
    const base = new Manifold('M' + baseDim, baseDim);
    const group = new LieGroup('GL(' + baseDim + ')', baseDim * baseDim);
    const fiber = new Fiber(baseDim, 'vector', group);
    return new FiberBundle('Tangent', base, fiber, group);
  }

  /**
   * Create cotangent bundle T*M
   */
  static cotangent(baseDim: number): FiberBundle {
    const base = new Manifold('M' + baseDim, baseDim);
    const group = new LieGroup('GL(' + baseDim + ')', baseDim * baseDim);
    const fiber = new Fiber(baseDim, 'vector', group);
    return new FiberBundle('Cotangent', base, fiber, group);
  }

  /**
   * Create principal U(1) bundle
   */
  static principalU1(baseDim: number): FiberBundle {
    const base = new Manifold('M' + baseDim, baseDim);
    const group = new LieGroup('U(1)', 1, [[[0, -1], [1, 0]]]);
    const fiber = new Fiber(1, 'principal', group);
    return new FiberBundle('U(1)-bundle', base, fiber, group);
  }

  /**
   * Create principal SU(2) bundle
   */
  static principalSU2(baseDim: number): FiberBundle {
    const base = new Manifold('M' + baseDim, baseDim);
    // Pauli matrices as generators
    const sigma1 = [[0, 1], [1, 0]];
    const sigma2 = [[0, -1], [1, 0]]; // simplified
    const sigma3 = [[1, 0], [0, -1]];
    const group = new LieGroup('SU(2)', 3, [sigma1, sigma2, sigma3]);
    const fiber = new Fiber(2, 'principal', group);
    return new FiberBundle('SU(2)-bundle', base, fiber, group);
  }

  /**
   * Create principal SU(3) bundle
   */
  static principalSU3(baseDim: number): FiberBundle {
    const base = new Manifold('M' + baseDim, baseDim);
    const group = new LieGroup('SU(3)', 8); // 8 Gell-Mann matrices
    const fiber = new Fiber(3, 'principal', group);
    return new FiberBundle('SU(3)-bundle', base, fiber, group);
  }

  /**
   * Create line bundle (complex line bundle)
   */
  static lineBundle(baseDim: number): FiberBundle {
    const base = new Manifold('M' + baseDim, baseDim);
    const group = new LieGroup('U(1)', 1);
    const fiber = new Fiber(2, 'associated', group); // Complex = R^2
    return new FiberBundle('LineBundle', base, fiber, group);
  }

  /**
   * Create flat connection on a bundle
   */
  static flatConnection(bundle: FiberBundle): Connection {
    const fiberDim = bundle.getFiber().getDimension();
    return new Connection(bundle, (_point, _dir) => {
      // Zero connection = flat
      return Array.from({ length: fiberDim }, () => new Array(fiberDim).fill(0));
    });
  }

  /**
   * Create constant connection on a bundle
   */
  static constantConnection(bundle: FiberBundle, A: number[][][]): Connection {
    const baseDim = bundle.getBase().getDimension();
    if (A.length !== baseDim) {
      throw new Error(`Need ${baseDim} connection components`);
    }
    return new Connection(bundle, (_point, dir) => {
      return A[dir];
    });
  }

  /**
   * Create instanton-like connection on 4D bundle
   */
  static instantonConnection(bundle: FiberBundle, center: number[], scale: number): Connection {
    const baseDim = bundle.getBase().getDimension();
    const fiberDim = bundle.getFiber().getDimension();
    
    if (baseDim !== 4 || fiberDim !== 2) {
      throw new Error('Instanton requires 4D base and 2D fiber (SU(2))');
    }
    
    return new Connection(bundle, (point, dir) => {
      // BPST instanton ansatz (simplified)
      const r2 = point.reduce((sum, x, i) => sum + (x - center[i]) ** 2, 0);
      const rho2 = scale * scale;
      const factor = rho2 / (r2 + rho2);
      
      // η symbols for self-dual connection
      const eta = [
        [[0, 1], [-1, 0]],  // η^1
        [[0, 0], [0, 0]],   // simplified η^2
        [[1, 0], [0, -1]]   // η^3
      ];
      
      const A: number[][] = [[0, 0], [0, 0]];
      if (dir < 3) {
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            A[i][j] = factor * eta[dir][i][j] * (point[3] - center[3]);
          }
        }
      }
      
      return A;
    });
  }
}

/**
 * Export proof chain for verification
 */
export function exportProofChain(): { module: string; classes: string[]; hash: string } {
  return {
    module: 'FiberBundle',
    classes: [
      'Manifold', 'Chart', 'LieGroup', 'Fiber', 'FiberPoint',
      'FiberBundle', 'Section', 'Connection', 'Curvature2Form',
      'ParallelTransport', 'ChernClass', 'FiberBundleFactory'
    ],
    hash: generateHash('FiberBundle:M05.02:complete')
  };
}
