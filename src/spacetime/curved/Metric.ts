/**
 * Metric.ts - PRD-03 Phase 3.4
 * Module ID: M03.04
 * 
 * Implements curved spacetime metrics, Christoffel symbols, and geodesic equations.
 * Supports arbitrary metric tensors with numerical computation of geometric quantities.
 * 
 * Dependencies:
 * - Logger (M01.01)
 * - HashVerifier (M01.02)
 * - BigNumber (M01.03)
 * - Tensor (M03.01)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';
import { Tensor, TensorConfig, IndexType, TensorFactory } from '../tensor/Tensor';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Metric tensor configuration
 */
export interface MetricConfig {
  dimension: number;           // Spacetime dimension (usually 4)
  signature?: number[];        // Metric signature (e.g., [-1,1,1,1] for Lorentzian)
  name?: string;               // Optional name (e.g., "Schwarzschild")
}

/**
 * Christoffel symbol result
 */
export interface ChristoffelResult {
  symbol: Tensor;              // Γ^λ_μν
  hash: string;
}

/**
 * Geodesic equation parameters
 */
export interface GeodesicParams {
  initialPosition: number[];   // x^μ(0)
  initialVelocity: number[];   // dx^μ/dτ(0)
  properTimeRange: [number, number];  // [τ_start, τ_end]
  steps: number;               // Number of integration steps
}

/**
 * Geodesic solution point
 */
export interface GeodesicPoint {
  properTime: number;          // τ
  position: number[];          // x^μ(τ)
  velocity: number[];          // dx^μ/dτ
}

/**
 * Geodesic solution
 */
export interface GeodesicSolution {
  points: GeodesicPoint[];
  isTimelike: boolean;
  isNull: boolean;
  isSpacelike: boolean;
  hash: string;
}

/**
 * Parallel transport result
 */
export interface ParallelTransportResult {
  finalVector: number[];
  path: GeodesicPoint[];
  hash: string;
}

/**
 * Covariant derivative result
 */
export interface CovariantDerivativeResult {
  derivative: Tensor;
  hash: string;
}

/**
 * Metric function type - g_μν(x)
 */
export type MetricFunction = (x: number[]) => number[][];

// ============================================================================
// METRIC CLASS
// ============================================================================

/**
 * Metric tensor class for curved spacetime.
 * 
 * The metric g_μν defines the geometry of spacetime:
 * - Line element: ds² = g_μν dx^μ dx^ν
 * - Christoffel symbols: Γ^λ_μν = (1/2) g^λρ (∂_μ g_ρν + ∂_ν g_ρμ - ∂_ρ g_μν)
 * - Geodesic equation: d²x^λ/dτ² + Γ^λ_μν (dx^μ/dτ)(dx^ν/dτ) = 0
 */
export class Metric {
  private dimension: number;
  private signature: number[];
  private name: string;
  private metricFunction: MetricFunction;
  private logger: Logger;
  private hashChain: HashChain;
  private id: string;

  // Numerical derivative step size
  private static readonly EPSILON = 1e-8;

  /**
   * Create a new metric
   * @param config - Metric configuration
   * @param metricFunction - Function that computes g_μν at a point x
   */
  constructor(config: MetricConfig, metricFunction: MetricFunction) {
    this.id = `M-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.dimension = config.dimension;
    this.signature = config.signature || this.defaultSignature();
    this.name = config.name || 'Custom';
    this.metricFunction = metricFunction;

    // Validate
    if (this.dimension < 1) {
      throw new Error('Dimension must be at least 1');
    }
    if (this.signature.length !== this.dimension) {
      throw new Error(`Signature length (${this.signature.length}) must equal dimension (${this.dimension})`);
    }

    // Initialize logger
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain(`metric-${this.id}`);

    this.logger.debug('Metric created', { name: this.name, dimension: this.dimension });
  }

  /**
   * Generate default Lorentzian signature (-,+,+,+)
   */
  private defaultSignature(): number[] {
    const sig = new Array(this.dimension).fill(1);
    if (this.dimension > 0) sig[0] = -1;
    return sig;
  }

  // ============================================================================
  // METRIC TENSOR OPERATIONS
  // ============================================================================

  /**
   * Get the metric tensor g_μν at a point
   */
  getMetricTensor(x: number[]): number[][] {
    this.validatePoint(x);
    return this.metricFunction(x);
  }

  /**
   * Get the metric as a Tensor object
   */
  getMetricAsTensor(x: number[]): Tensor {
    const g = this.getMetricTensor(x);
    const config: TensorConfig = {
      rank: 2,
      dimensions: [this.dimension, this.dimension],
      indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT],
      labels: ['μ', 'ν']
    };

    const components: number[] = [];
    for (let mu = 0; mu < this.dimension; mu++) {
      for (let nu = 0; nu < this.dimension; nu++) {
        components.push(g[mu][nu]);
      }
    }

    return new Tensor(config, components);
  }

  /**
   * Get the inverse metric g^μν at a point
   */
  getInverseMetric(x: number[]): number[][] {
    const g = this.getMetricTensor(x);
    return this.invertMatrix(g);
  }

  /**
   * Compute the line element ds² = g_μν dx^μ dx^ν
   */
  lineElement(x: number[], dx: number[]): number {
    this.validatePoint(x);
    this.validatePoint(dx);

    const g = this.getMetricTensor(x);
    let ds2 = 0;

    for (let mu = 0; mu < this.dimension; mu++) {
      for (let nu = 0; nu < this.dimension; nu++) {
        ds2 += g[mu][nu] * dx[mu] * dx[nu];
      }
    }

    return ds2;
  }

  /**
   * Classify interval: timelike, spacelike, or null
   */
  classifyInterval(x: number[], dx: number[]): 'timelike' | 'spacelike' | 'null' {
    const ds2 = this.lineElement(x, dx);
    const epsilon = 1e-10;

    if (ds2 < -epsilon) return 'timelike';
    if (ds2 > epsilon) return 'spacelike';
    return 'null';
  }

  // ============================================================================
  // CHRISTOFFEL SYMBOLS
  // ============================================================================

  /**
   * Compute Christoffel symbol Γ^λ_μν at a point
   * 
   * Γ^λ_μν = (1/2) g^λρ (∂_μ g_ρν + ∂_ν g_ρμ - ∂_ρ g_μν)
   */
  christoffelSymbol(x: number[]): ChristoffelResult {
    this.validatePoint(x);

    const gInv = this.getInverseMetric(x);
    const dgdx = this.metricDerivatives(x);

    // Create tensor for Christoffel symbols
    const config: TensorConfig = {
      rank: 3,
      dimensions: [this.dimension, this.dimension, this.dimension],
      indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT, IndexType.COVARIANT],
      labels: ['λ', 'μ', 'ν']
    };

    const components: number[] = [];

    for (let lambda = 0; lambda < this.dimension; lambda++) {
      for (let mu = 0; mu < this.dimension; mu++) {
        for (let nu = 0; nu < this.dimension; nu++) {
          let gamma = 0;

          for (let rho = 0; rho < this.dimension; rho++) {
            // ∂_μ g_ρν + ∂_ν g_ρμ - ∂_ρ g_μν
            const term = dgdx[mu][rho][nu] + dgdx[nu][rho][mu] - dgdx[rho][mu][nu];
            gamma += 0.5 * gInv[lambda][rho] * term;
          }

          components.push(gamma);
        }
      }
    }

    const symbol = new Tensor(config, components);
    const hash = this.computeHash('christoffel', { x, components });

    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ point: x }),
      JSON.stringify({ christoffel: 'Γ^λ_μν computed' }),
      { operation: 'christoffelSymbol' }
    );

    return { symbol, hash };
  }

  /**
   * Get a specific Christoffel symbol component Γ^λ_μν
   */
  getChristoffel(x: number[], lambda: number, mu: number, nu: number): number {
    const result = this.christoffelSymbol(x);
    return result.symbol.get(lambda, mu, nu);
  }

  /**
   * Compute metric derivatives ∂_σ g_μν
   */
  private metricDerivatives(x: number[]): number[][][] {
    const dgdx: number[][][] = [];

    for (let sigma = 0; sigma < this.dimension; sigma++) {
      dgdx[sigma] = [];
      for (let mu = 0; mu < this.dimension; mu++) {
        dgdx[sigma][mu] = [];
        for (let nu = 0; nu < this.dimension; nu++) {
          dgdx[sigma][mu][nu] = this.numericalDerivative(x, sigma, mu, nu);
        }
      }
    }

    return dgdx;
  }

  /**
   * Numerical derivative of g_μν with respect to x^σ
   */
  private numericalDerivative(x: number[], sigma: number, mu: number, nu: number): number {
    const eps = Metric.EPSILON;
    
    // Forward point
    const xPlus = [...x];
    xPlus[sigma] += eps;
    const gPlus = this.metricFunction(xPlus);

    // Backward point
    const xMinus = [...x];
    xMinus[sigma] -= eps;
    const gMinus = this.metricFunction(xMinus);

    // Central difference
    return (gPlus[mu][nu] - gMinus[mu][nu]) / (2 * eps);
  }

  // ============================================================================
  // GEODESIC EQUATION
  // ============================================================================

  /**
   * Solve the geodesic equation:
   * d²x^λ/dτ² + Γ^λ_μν (dx^μ/dτ)(dx^ν/dτ) = 0
   * 
   * Uses 4th-order Runge-Kutta integration
   */
  solveGeodesic(params: GeodesicParams): GeodesicSolution {
    const { initialPosition, initialVelocity, properTimeRange, steps } = params;
    
    this.validatePoint(initialPosition);
    this.validatePoint(initialVelocity);

    const [tau0, tau1] = properTimeRange;
    const dt = (tau1 - tau0) / steps;
    
    const points: GeodesicPoint[] = [];
    let x = [...initialPosition];
    let v = [...initialVelocity];

    // Initial point
    points.push({
      properTime: tau0,
      position: [...x],
      velocity: [...v]
    });

    // RK4 integration
    for (let i = 0; i < steps; i++) {
      const tau = tau0 + i * dt;
      
      // Compute RK4 coefficients
      const [k1x, k1v] = this.geodesicDerivatives(x, v);
      
      const x2 = x.map((xi, j) => xi + 0.5 * dt * k1x[j]);
      const v2 = v.map((vi, j) => vi + 0.5 * dt * k1v[j]);
      const [k2x, k2v] = this.geodesicDerivatives(x2, v2);
      
      const x3 = x.map((xi, j) => xi + 0.5 * dt * k2x[j]);
      const v3 = v.map((vi, j) => vi + 0.5 * dt * k2v[j]);
      const [k3x, k3v] = this.geodesicDerivatives(x3, v3);
      
      const x4 = x.map((xi, j) => xi + dt * k3x[j]);
      const v4 = v.map((vi, j) => vi + dt * k3v[j]);
      const [k4x, k4v] = this.geodesicDerivatives(x4, v4);

      // Update position and velocity
      for (let j = 0; j < this.dimension; j++) {
        x[j] += (dt / 6) * (k1x[j] + 2 * k2x[j] + 2 * k3x[j] + k4x[j]);
        v[j] += (dt / 6) * (k1v[j] + 2 * k2v[j] + 2 * k3v[j] + k4v[j]);
      }

      points.push({
        properTime: tau + dt,
        position: [...x],
        velocity: [...v]
      });
    }

    // Classify the geodesic
    const ds2 = this.lineElement(initialPosition, initialVelocity);
    const epsilon = 1e-10;
    const isTimelike = ds2 < -epsilon;
    const isSpacelike = ds2 > epsilon;
    const isNull = !isTimelike && !isSpacelike;

    const hash = this.computeHash('geodesic', { params, points: points.length });

    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify(params),
      JSON.stringify({ geodesicType: isTimelike ? 'timelike' : (isNull ? 'null' : 'spacelike') }),
      { operation: 'solveGeodesic', steps }
    );

    return { points, isTimelike, isNull, isSpacelike, hash };
  }

  /**
   * Compute geodesic equation derivatives
   * dx^λ/dτ = v^λ
   * dv^λ/dτ = -Γ^λ_μν v^μ v^ν
   */
  private geodesicDerivatives(x: number[], v: number[]): [number[], number[]] {
    const dx = [...v];
    const dv = new Array(this.dimension).fill(0);

    const christoffel = this.christoffelSymbol(x);

    for (let lambda = 0; lambda < this.dimension; lambda++) {
      for (let mu = 0; mu < this.dimension; mu++) {
        for (let nu = 0; nu < this.dimension; nu++) {
          dv[lambda] -= christoffel.symbol.get(lambda, mu, nu) * v[mu] * v[nu];
        }
      }
    }

    return [dx, dv];
  }

  // ============================================================================
  // PARALLEL TRANSPORT
  // ============================================================================

  /**
   * Parallel transport a vector along a geodesic
   * 
   * dV^μ/dτ = -Γ^μ_νρ V^ν (dx^ρ/dτ)
   */
  parallelTransport(
    vector: number[],
    geodesicParams: GeodesicParams
  ): ParallelTransportResult {
    this.validatePoint(vector);

    const geodesic = this.solveGeodesic(geodesicParams);
    let V = [...vector];

    // Transport along each segment
    for (let i = 0; i < geodesic.points.length - 1; i++) {
      const p1 = geodesic.points[i];
      const p2 = geodesic.points[i + 1];
      const dt = p2.properTime - p1.properTime;

      // Get Christoffel symbols at current position
      const christoffel = this.christoffelSymbol(p1.position);

      // Update vector using parallel transport equation
      const dV = new Array(this.dimension).fill(0);
      for (let mu = 0; mu < this.dimension; mu++) {
        for (let nu = 0; nu < this.dimension; nu++) {
          for (let rho = 0; rho < this.dimension; rho++) {
            dV[mu] -= christoffel.symbol.get(mu, nu, rho) * V[nu] * p1.velocity[rho];
          }
        }
      }

      // Euler step (could use RK4 for more accuracy)
      for (let mu = 0; mu < this.dimension; mu++) {
        V[mu] += dV[mu] * dt;
      }
    }

    const hash = this.computeHash('parallelTransport', { vector, finalVector: V });

    return {
      finalVector: V,
      path: geodesic.points,
      hash
    };
  }

  // ============================================================================
  // COVARIANT DERIVATIVE
  // ============================================================================

  /**
   * Compute covariant derivative of a vector field V^μ
   * 
   * ∇_ν V^μ = ∂_ν V^μ + Γ^μ_νρ V^ρ
   */
  covariantDerivativeVector(
    vectorField: (x: number[]) => number[],
    x: number[]
  ): CovariantDerivativeResult {
    this.validatePoint(x);

    const christoffel = this.christoffelSymbol(x);
    const V = vectorField(x);

    // Result tensor ∇_ν V^μ has indices (μ contravariant, ν covariant)
    const config: TensorConfig = {
      rank: 2,
      dimensions: [this.dimension, this.dimension],
      indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT],
      labels: ['μ', 'ν']
    };

    const components: number[] = [];

    for (let mu = 0; mu < this.dimension; mu++) {
      for (let nu = 0; nu < this.dimension; nu++) {
        // ∂_ν V^μ (numerical derivative)
        let partialV = this.numericalVectorDerivative(vectorField, x, mu, nu);

        // Γ^μ_νρ V^ρ
        for (let rho = 0; rho < this.dimension; rho++) {
          partialV += christoffel.symbol.get(mu, nu, rho) * V[rho];
        }

        components.push(partialV);
      }
    }

    const derivative = new Tensor(config, components);
    const hash = this.computeHash('covariantDerivative', { point: x, components });

    return { derivative, hash };
  }

  /**
   * Numerical derivative of vector field component
   */
  private numericalVectorDerivative(
    vectorField: (x: number[]) => number[],
    x: number[],
    mu: number,
    nu: number
  ): number {
    const eps = Metric.EPSILON;

    const xPlus = [...x];
    xPlus[nu] += eps;
    const vPlus = vectorField(xPlus);

    const xMinus = [...x];
    xMinus[nu] -= eps;
    const vMinus = vectorField(xMinus);

    return (vPlus[mu] - vMinus[mu]) / (2 * eps);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Validate that a point has correct dimension
   */
  private validatePoint(x: number[]): void {
    if (x.length !== this.dimension) {
      throw new Error(`Point dimension (${x.length}) must equal metric dimension (${this.dimension})`);
    }
  }

  /**
   * Invert a matrix using Gauss-Jordan elimination
   */
  private invertMatrix(matrix: number[][]): number[][] {
    const n = matrix.length;
    const augmented: number[][] = [];

    // Create augmented matrix [A|I]
    for (let i = 0; i < n; i++) {
      augmented[i] = [];
      for (let j = 0; j < n; j++) {
        augmented[i][j] = matrix[i][j];
      }
      for (let j = 0; j < n; j++) {
        augmented[i][n + j] = i === j ? 1 : 0;
      }
    }

    // Gauss-Jordan elimination
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
          maxRow = row;
        }
      }

      // Swap rows
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

      const pivot = augmented[col][col];
      if (Math.abs(pivot) < 1e-15) {
        throw new Error('Matrix is singular, cannot invert');
      }

      // Scale pivot row
      for (let j = 0; j < 2 * n; j++) {
        augmented[col][j] /= pivot;
      }

      // Eliminate column
      for (let row = 0; row < n; row++) {
        if (row !== col) {
          const factor = augmented[row][col];
          for (let j = 0; j < 2 * n; j++) {
            augmented[row][j] -= factor * augmented[col][j];
          }
        }
      }
    }

    // Extract inverse
    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = [];
      for (let j = 0; j < n; j++) {
        inverse[i][j] = augmented[i][n + j];
      }
    }

    return inverse;
  }

  /**
   * Compute hash for verification
   */
  private computeHash(operation: string, data: unknown): string {
    return HashVerifier.hashObject({ operation, data, metricId: this.id });
  }

  /**
   * Get metric dimension
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Get metric signature
   */
  getSignature(): number[] {
    return [...this.signature];
  }

  /**
   * Get metric name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get hash chain for verification
   */
  getHash(): string {
    return this.hashChain.getLastHash();
  }

  /**
   * Export proof chain
   */
  exportProofChain(): string {
    return this.hashChain.exportToJson();
  }
}

// ============================================================================
// METRIC FACTORY - COMMON SPACETIME METRICS
// ============================================================================

/**
 * Factory for creating common spacetime metrics
 */
export class MetricFactory {
  /**
   * Create Minkowski metric (flat spacetime)
   * ds² = -c²dt² + dx² + dy² + dz²
   */
  static minkowski(c: number = 1): Metric {
    const metricFunction: MetricFunction = (_x: number[]) => {
      return [
        [-c * c, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ];
    };

    return new Metric(
      { dimension: 4, signature: [-1, 1, 1, 1], name: 'Minkowski' },
      metricFunction
    );
  }

  /**
   * Create Schwarzschild metric (non-rotating black hole)
   * ds² = -(1-rs/r)c²dt² + dr²/(1-rs/r) + r²dθ² + r²sin²θ dφ²
   * 
   * Coordinates: [t, r, θ, φ]
   * @param rs - Schwarzschild radius (2GM/c²)
   * @param c - Speed of light (default 1)
   */
  static schwarzschild(rs: number, c: number = 1): Metric {
    const metricFunction: MetricFunction = (x: number[]) => {
      const r = x[1];
      const theta = x[2];

      // Avoid singularity at r = rs
      if (r <= rs) {
        throw new Error(`r (${r}) must be greater than Schwarzschild radius (${rs})`);
      }

      const factor = 1 - rs / r;
      const sinTheta = Math.sin(theta);

      return [
        [-c * c * factor, 0, 0, 0],
        [0, 1 / factor, 0, 0],
        [0, 0, r * r, 0],
        [0, 0, 0, r * r * sinTheta * sinTheta]
      ];
    };

    return new Metric(
      { dimension: 4, signature: [-1, 1, 1, 1], name: 'Schwarzschild' },
      metricFunction
    );
  }

  /**
   * Create Kerr metric (rotating black hole) - simplified Boyer-Lindquist form
   * 
   * Coordinates: [t, r, θ, φ]
   * @param M - Mass (in geometric units G=c=1)
   * @param a - Spin parameter (J/M)
   */
  static kerr(M: number, a: number): Metric {
    const rs = 2 * M;  // Schwarzschild radius in geometric units

    const metricFunction: MetricFunction = (x: number[]) => {
      const r = x[1];
      const theta = x[2];

      // Kerr metric functions
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      const sigma = r * r + a * a * cosTheta * cosTheta;
      const delta = r * r - rs * r + a * a;

      if (sigma < 1e-10) {
        throw new Error('Point too close to ring singularity');
      }

      const A = (r * r + a * a) ** 2 - a * a * delta * sinTheta * sinTheta;

      // g_tt
      const gtt = -(1 - rs * r / sigma);
      
      // g_tφ
      const gtphi = -rs * r * a * sinTheta * sinTheta / sigma;

      // g_rr
      const grr = sigma / delta;

      // g_θθ
      const gthth = sigma;

      // g_φφ
      const gphph = A * sinTheta * sinTheta / sigma;

      return [
        [gtt, 0, 0, gtphi],
        [0, grr, 0, 0],
        [0, 0, gthth, 0],
        [gtphi, 0, 0, gphph]
      ];
    };

    return new Metric(
      { dimension: 4, signature: [-1, 1, 1, 1], name: 'Kerr' },
      metricFunction
    );
  }

  /**
   * Create FLRW metric (expanding universe)
   * ds² = -dt² + a(t)²[dr²/(1-kr²) + r²dΩ²]
   * 
   * Coordinates: [t, r, θ, φ]
   * @param scaleFactorFn - Scale factor a(t) as function of time
   * @param k - Curvature: 0 (flat), 1 (closed), -1 (open)
   */
  static flrw(scaleFactorFn: (t: number) => number, k: number = 0): Metric {
    const metricFunction: MetricFunction = (x: number[]) => {
      const t = x[0];
      const r = x[1];
      const theta = x[2];

      const a = scaleFactorFn(t);
      const a2 = a * a;
      const sinTheta = Math.sin(theta);

      const spatialFactor = 1 - k * r * r;
      if (Math.abs(spatialFactor) < 1e-15) {
        throw new Error('Invalid spatial coordinate (denominator zero)');
      }

      return [
        [-1, 0, 0, 0],
        [0, a2 / spatialFactor, 0, 0],
        [0, 0, a2 * r * r, 0],
        [0, 0, 0, a2 * r * r * sinTheta * sinTheta]
      ];
    };

    return new Metric(
      { dimension: 4, signature: [-1, 1, 1, 1], name: 'FLRW' },
      metricFunction
    );
  }

  /**
   * Create Reissner-Nordström metric (charged black hole)
   * 
   * Coordinates: [t, r, θ, φ]
   * @param M - Mass (in geometric units)
   * @param Q - Charge (in geometric units)
   */
  static reissnerNordstrom(M: number, Q: number): Metric {
    const metricFunction: MetricFunction = (x: number[]) => {
      const r = x[1];
      const theta = x[2];

      const factor = 1 - 2 * M / r + Q * Q / (r * r);
      const sinTheta = Math.sin(theta);

      if (factor <= 0) {
        throw new Error(`Point inside horizon (r=${r})`);
      }

      return [
        [-factor, 0, 0, 0],
        [0, 1 / factor, 0, 0],
        [0, 0, r * r, 0],
        [0, 0, 0, r * r * sinTheta * sinTheta]
      ];
    };

    return new Metric(
      { dimension: 4, signature: [-1, 1, 1, 1], name: 'Reissner-Nordström' },
      metricFunction
    );
  }

  /**
   * Create de Sitter metric (positive cosmological constant)
   * ds² = -(1 - r²/α²)dt² + dr²/(1 - r²/α²) + r²dΩ²
   * 
   * @param alpha - Cosmological horizon radius α = √(3/Λ)
   */
  static deSitter(alpha: number): Metric {
    const metricFunction: MetricFunction = (x: number[]) => {
      const r = x[1];
      const theta = x[2];

      const factor = 1 - (r * r) / (alpha * alpha);
      const sinTheta = Math.sin(theta);

      if (factor <= 0) {
        throw new Error(`Point beyond cosmological horizon (r=${r}, α=${alpha})`);
      }

      return [
        [-factor, 0, 0, 0],
        [0, 1 / factor, 0, 0],
        [0, 0, r * r, 0],
        [0, 0, 0, r * r * sinTheta * sinTheta]
      ];
    };

    return new Metric(
      { dimension: 4, signature: [-1, 1, 1, 1], name: 'de Sitter' },
      metricFunction
    );
  }

  /**
   * Create anti-de Sitter metric (negative cosmological constant)
   */
  static antiDeSitter(alpha: number): Metric {
    const metricFunction: MetricFunction = (x: number[]) => {
      const r = x[1];
      const theta = x[2];

      const factor = 1 + (r * r) / (alpha * alpha);
      const sinTheta = Math.sin(theta);

      return [
        [-factor, 0, 0, 0],
        [0, 1 / factor, 0, 0],
        [0, 0, r * r, 0],
        [0, 0, 0, r * r * sinTheta * sinTheta]
      ];
    };

    return new Metric(
      { dimension: 4, signature: [-1, 1, 1, 1], name: 'Anti-de Sitter' },
      metricFunction
    );
  }

  /**
   * Create 2D metric on a sphere of radius R
   * ds² = R²(dθ² + sin²θ dφ²)
   */
  static sphere2D(R: number): Metric {
    const metricFunction: MetricFunction = (x: number[]) => {
      const theta = x[0];
      const sinTheta = Math.sin(theta);

      return [
        [R * R, 0],
        [0, R * R * sinTheta * sinTheta]
      ];
    };

    return new Metric(
      { dimension: 2, signature: [1, 1], name: '2-Sphere' },
      metricFunction
    );
  }

  /**
   * Create 3D Euclidean metric in spherical coordinates
   * ds² = dr² + r²dθ² + r²sin²θ dφ²
   */
  static euclideanSpherical(): Metric {
    const metricFunction: MetricFunction = (x: number[]) => {
      const r = x[0];
      const theta = x[1];
      const sinTheta = Math.sin(theta);

      return [
        [1, 0, 0],
        [0, r * r, 0],
        [0, 0, r * r * sinTheta * sinTheta]
      ];
    };

    return new Metric(
      { dimension: 3, signature: [1, 1, 1], name: 'Euclidean (spherical)' },
      metricFunction
    );
  }

  /**
   * Create custom metric from components
   */
  static custom(
    dimension: number,
    metricFunction: MetricFunction,
    name: string = 'Custom'
  ): Metric {
    return new Metric({ dimension, name }, metricFunction);
  }
}

// ============================================================================
// GEODESIC UTILITIES
// ============================================================================

/**
 * Utility class for geodesic computations
 */
export class GeodesicUtils {
  /**
   * Compute the affine parameter length of a geodesic
   */
  static pathLength(solution: GeodesicSolution): number {
    if (solution.points.length < 2) return 0;

    const first = solution.points[0];
    const last = solution.points[solution.points.length - 1];
    return last.properTime - first.properTime;
  }

  /**
   * Find the turning point (if any) in a geodesic
   */
  static findTurningPoint(solution: GeodesicSolution, coordinateIndex: number): GeodesicPoint | null {
    for (let i = 1; i < solution.points.length - 1; i++) {
      const prev = solution.points[i - 1].velocity[coordinateIndex];
      const curr = solution.points[i].velocity[coordinateIndex];
      
      if (prev * curr < 0) {
        return solution.points[i];
      }
    }
    return null;
  }

  /**
   * Check if geodesic is closed (returns to starting point)
   */
  static isClosed(solution: GeodesicSolution, tolerance: number = 0.01): boolean {
    if (solution.points.length < 2) return false;

    const first = solution.points[0];
    const last = solution.points[solution.points.length - 1];

    let sumSquared = 0;
    for (let i = 0; i < first.position.length; i++) {
      const diff = last.position[i] - first.position[i];
      sumSquared += diff * diff;
    }

    return Math.sqrt(sumSquared) < tolerance;
  }

  /**
   * Compute the 4-velocity normalization (should be -1 for timelike, 0 for null)
   */
  static checkNormalization(
    metric: Metric,
    point: GeodesicPoint
  ): number {
    return metric.lineElement(point.position, point.velocity);
  }
}
