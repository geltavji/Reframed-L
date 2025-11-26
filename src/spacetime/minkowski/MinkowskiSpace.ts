/**
 * MinkowskiSpace.ts - PRD-03 Phase 3.2
 * Module ID: M03.02
 * 
 * Implements Minkowski spacetime for special relativity.
 * Includes the Minkowski metric, Lorentz transformations, and proper time calculations.
 * 
 * The Minkowski metric is:
 * ds² = -c²dt² + dx² + dy² + dz²
 * η_μν = diag(-1, 1, 1, 1)
 * 
 * Dependencies:
 * - Tensor (M03.01)
 * - Matrix (M01.05)
 * - PhysicalConstants (M01.06)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';
import { Tensor, TensorFactory, IndexType } from '../tensor/Tensor';
import { PhysicalConstants } from '../../core/constants/PhysicalConstants';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Four-vector components [t, x, y, z] or [ct, x, y, z]
 */
export interface FourVector {
  t: number;  // Time component (or ct)
  x: number;  // x spatial component
  y: number;  // y spatial component
  z: number;  // z spatial component
}

/**
 * Lorentz transformation parameters
 */
export interface LorentzParams {
  beta: number[];      // Velocity as fraction of c [βx, βy, βz]
  gamma?: number;      // Lorentz factor (computed if not provided)
}

/**
 * Boost parameters
 */
export interface BoostParams {
  velocity: number[];  // Velocity [vx, vy, vz] in m/s
  direction?: number[]; // Unit direction vector (computed from velocity if not provided)
}

/**
 * Spacetime interval result
 */
export interface SpacetimeInterval {
  ds_squared: number;       // ds² value
  intervalType: 'timelike' | 'spacelike' | 'lightlike';
  properTime?: number;      // τ for timelike intervals
  properDistance?: number;  // s for spacelike intervals
  hash: string;
}

/**
 * Proper time calculation result
 */
export interface ProperTimeResult {
  properTime: number;    // τ in seconds
  coordinateTime: number; // t in seconds
  gamma: number;         // Lorentz factor
  hash: string;
}

/**
 * Length contraction result
 */
export interface LengthContractionResult {
  properLength: number;    // L₀ in meters
  contractedLength: number; // L in meters
  gamma: number;            // Lorentz factor
  hash: string;
}

/**
 * Time dilation result
 */
export interface TimeDilationResult {
  properTime: number;      // τ (rest frame time)
  dilatedTime: number;     // t (moving frame time)
  gamma: number;           // Lorentz factor
  hash: string;
}

// ============================================================================
// MINKOWSKI METRIC CLASS
// ============================================================================

/**
 * Minkowski metric tensor η_μν for flat spacetime.
 * Uses the (-,+,+,+) signature convention.
 */
export class MinkowskiMetric {
  private metric: Tensor;
  private inverseMetric: Tensor;
  private logger: Logger;
  private hashChain: HashChain;
  private c: number;  // Speed of light

  constructor() {
    // Initialize logger
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('minkowski-metric');

    // Get speed of light from physical constants
    const constants = PhysicalConstants.getInstance();
    this.c = constants.get('speed_of_light').numericValue;

    // Create covariant metric tensor η_μν = diag(-1, 1, 1, 1)
    this.metric = TensorFactory.minkowskiMetric();
    
    // Create contravariant metric tensor η^μν = diag(-1, 1, 1, 1)
    this.inverseMetric = TensorFactory.inverseMinkowskiMetric();

    this.logger.debug('MinkowskiMetric initialized', { c: this.c });
  }

  /**
   * Get the covariant metric tensor η_μν
   */
  getMetric(): Tensor {
    return this.metric;
  }

  /**
   * Get the contravariant (inverse) metric tensor η^μν
   */
  getInverseMetric(): Tensor {
    return this.inverseMetric;
  }

  /**
   * Get the speed of light
   */
  getSpeedOfLight(): number {
    return this.c;
  }

  /**
   * Get metric component
   */
  get(mu: number, nu: number): number {
    return this.metric.get(mu, nu);
  }

  /**
   * Compute spacetime interval ds² = η_μν dx^μ dx^ν
   * @param dx Four-vector displacement
   * @returns Spacetime interval result
   */
  computeInterval(dx: FourVector): SpacetimeInterval {
    // ds² = -c²dt² + dx² + dy² + dz²
    const ds_squared = -(this.c * this.c) * dx.t * dx.t + 
                       dx.x * dx.x + dx.y * dx.y + dx.z * dx.z;

    let intervalType: 'timelike' | 'spacelike' | 'lightlike';
    let properTime: number | undefined;
    let properDistance: number | undefined;

    const epsilon = 1e-10;

    if (ds_squared < -epsilon) {
      intervalType = 'timelike';
      // τ² = -ds²/c²
      properTime = Math.sqrt(-ds_squared) / this.c;
    } else if (ds_squared > epsilon) {
      intervalType = 'spacelike';
      // s = √(ds²)
      properDistance = Math.sqrt(ds_squared);
    } else {
      intervalType = 'lightlike';
    }

    const hash = HashVerifier.hash(`interval:${ds_squared}:${intervalType}`);
    this.hashChain.addRecord(ProofType.COMPUTATION, 'computeInterval', hash);

    this.logger.debug('Computed spacetime interval', { ds_squared, intervalType });

    return {
      ds_squared,
      intervalType,
      properTime,
      properDistance,
      hash
    };
  }

  /**
   * Compute inner product of two four-vectors using Minkowski metric
   * ⟨A, B⟩ = η_μν A^μ B^ν
   */
  innerProduct(A: FourVector, B: FourVector): number {
    return -this.c * this.c * A.t * B.t + A.x * B.x + A.y * B.y + A.z * B.z;
  }

  /**
   * Compute the norm squared of a four-vector
   * |A|² = η_μν A^μ A^ν
   */
  normSquared(A: FourVector): number {
    return this.innerProduct(A, A);
  }

  /**
   * Raise index of a covariant four-vector
   * A^μ = η^μν A_ν
   */
  raiseIndex(A_cov: FourVector): FourVector {
    return {
      t: -A_cov.t,  // η^00 = -1
      x: A_cov.x,   // η^11 = 1
      y: A_cov.y,   // η^22 = 1
      z: A_cov.z    // η^33 = 1
    };
  }

  /**
   * Lower index of a contravariant four-vector
   * A_μ = η_μν A^ν
   */
  lowerIndex(A_contra: FourVector): FourVector {
    return {
      t: -A_contra.t,  // η_00 = -1
      x: A_contra.x,   // η_11 = 1
      y: A_contra.y,   // η_22 = 1
      z: A_contra.z    // η_33 = 1
    };
  }

  /**
   * Check if a four-vector is timelike (|A|² < 0)
   */
  isTimelike(A: FourVector): boolean {
    return this.normSquared(A) < -1e-10;
  }

  /**
   * Check if a four-vector is spacelike (|A|² > 0)
   */
  isSpacelike(A: FourVector): boolean {
    return this.normSquared(A) > 1e-10;
  }

  /**
   * Check if a four-vector is lightlike/null (|A|² ≈ 0)
   */
  isLightlike(A: FourVector): boolean {
    return Math.abs(this.normSquared(A)) < 1e-10;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash('MinkowskiMetric:(-1,1,1,1)');
  }
}

// ============================================================================
// LORENTZ TRANSFORM CLASS
// ============================================================================

/**
 * Lorentz transformations for special relativity.
 * Implements boosts and rotations in Minkowski spacetime.
 */
export class LorentzTransform {
  private logger: Logger;
  private hashChain: HashChain;
  private c: number;
  private matrix: number[][];
  private beta: number[];
  private gamma: number;

  /**
   * Create a Lorentz transformation
   * @param params Boost parameters (velocity or beta)
   */
  constructor(params: BoostParams | LorentzParams) {
    // Initialize logger
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('lorentz-transform');

    // Get speed of light
    const constants = PhysicalConstants.getInstance();
    this.c = constants.get('speed_of_light').numericValue;

    // Determine beta from params
    if ('beta' in params) {
      this.beta = params.beta;
      this.gamma = params.gamma || this.computeGamma(this.beta);
    } else {
      // Convert velocity to beta
      this.beta = params.velocity.map(v => v / this.c);
      this.gamma = this.computeGamma(this.beta);
    }

    // Build the transformation matrix
    this.matrix = this.buildTransformMatrix();

    this.logger.debug('LorentzTransform created', { beta: this.beta, gamma: this.gamma });
  }

  /**
   * Compute Lorentz factor γ = 1/√(1 - β²)
   */
  private computeGamma(beta: number[]): number {
    const betaSquared = beta.reduce((sum, b) => sum + b * b, 0);
    if (betaSquared >= 1) {
      throw new Error('Speed must be less than speed of light (β < 1)');
    }
    return 1 / Math.sqrt(1 - betaSquared);
  }

  /**
   * Build the 4x4 Lorentz transformation matrix
   * For a general boost in direction n̂ with speed β:
   * 
   * Λ^0_0 = γ
   * Λ^0_i = -γβ_i
   * Λ^i_0 = -γβ_i
   * Λ^i_j = δ^i_j + (γ-1)n̂^i n̂_j
   */
  private buildTransformMatrix(): number[][] {
    const betaSquared = this.beta.reduce((sum, b) => sum + b * b, 0);
    const betaMag = Math.sqrt(betaSquared);

    // Initialize as identity
    const L: number[][] = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];

    if (betaMag < 1e-10) {
      // No boost, return identity
      return L;
    }

    // Direction unit vector
    const n = this.beta.map(b => b / betaMag);

    // Build transformation matrix
    L[0][0] = this.gamma;
    
    for (let i = 0; i < 3; i++) {
      L[0][i + 1] = -this.gamma * this.beta[i];
      L[i + 1][0] = -this.gamma * this.beta[i];
      
      for (let j = 0; j < 3; j++) {
        L[i + 1][j + 1] = (i === j ? 1 : 0) + (this.gamma - 1) * n[i] * n[j];
      }
    }

    return L;
  }

  /**
   * Get the Lorentz factor γ
   */
  getGamma(): number {
    return this.gamma;
  }

  /**
   * Get the velocity parameter β = v/c
   */
  getBeta(): number[] {
    return [...this.beta];
  }

  /**
   * Get the transformation matrix Λ^μ_ν
   */
  getMatrix(): number[][] {
    return this.matrix.map(row => [...row]);
  }

  /**
   * Transform a four-vector: x'^μ = Λ^μ_ν x^ν
   * Note: The matrix is for coordinates (ct, x, y, z), so we convert t ↔ ct
   */
  transform(x: FourVector): FourVector {
    // Convert to (ct, x, y, z)
    const xArray = [this.c * x.t, x.x, x.y, x.z];
    const xPrime = [0, 0, 0, 0];

    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        xPrime[mu] += this.matrix[mu][nu] * xArray[nu];
      }
    }

    // Convert back from ct to t
    return {
      t: xPrime[0] / this.c,
      x: xPrime[1],
      y: xPrime[2],
      z: xPrime[3]
    };
  }

  /**
   * Get the inverse transformation: Λ^(-1) = Λ(-β)
   */
  inverse(): LorentzTransform {
    return new LorentzTransform({
      beta: this.beta.map(b => -b),
      gamma: this.gamma
    });
  }

  /**
   * Compose two Lorentz transformations: Λ_total = Λ_2 · Λ_1
   * Note: This is not simply velocity addition due to Thomas precession
   */
  compose(other: LorentzTransform): LorentzTransform {
    // Matrix multiplication
    const L1 = this.matrix;
    const L2 = other.matrix;
    const result: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i][j] += L2[i][k] * L1[k][j];
        }
      }
    }

    // Extract beta from the resulting matrix
    // Λ^0_i = -γβ_i, so β_i = -Λ^0_i / Λ^0_0
    const gamma = result[0][0];
    const beta = [-result[0][1] / gamma, -result[0][2] / gamma, -result[0][3] / gamma];

    // Use factory method with pre-computed matrix
    return LorentzTransform.fromMatrix(result, beta, gamma);
  }

  /**
   * Create a boost along the x-axis
   */
  static boostX(beta: number): LorentzTransform {
    return new LorentzTransform({ beta: [beta, 0, 0] });
  }

  /**
   * Create a boost along the y-axis
   */
  static boostY(beta: number): LorentzTransform {
    return new LorentzTransform({ beta: [0, beta, 0] });
  }

  /**
   * Create a boost along the z-axis
   */
  static boostZ(beta: number): LorentzTransform {
    return new LorentzTransform({ beta: [0, 0, beta] });
  }

  /**
   * Create boost from velocity in m/s
   */
  static fromVelocity(velocity: number[]): LorentzTransform {
    return new LorentzTransform({ velocity });
  }

  /**
   * Create LorentzTransform from pre-computed matrix (internal use)
   */
  static fromMatrix(matrix: number[][], beta: number[], gamma: number): LorentzTransform {
    const transform = new LorentzTransform({ beta, gamma });
    transform.matrix = matrix.map(row => [...row]);
    return transform;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`LorentzTransform:${JSON.stringify(this.beta)}:${this.gamma}`);
  }
}

// ============================================================================
// PROPER TIME CLASS
// ============================================================================

/**
 * Proper time calculations in special relativity.
 * Proper time τ is the time measured by a clock moving with the object.
 */
export class ProperTime {
  private logger: Logger;
  private hashChain: HashChain;
  private c: number;

  constructor() {
    // Initialize logger
    Logger.resetInstance();
    this.logger = Logger.getInstance({
      minLevel: LogLevel.DEBUG,
      enableConsole: false,
      enableHashChain: true
    });
    this.hashChain = new HashChain('proper-time');

    // Get speed of light
    const constants = PhysicalConstants.getInstance();
    this.c = constants.get('speed_of_light').numericValue;
  }

  /**
   * Compute proper time from coordinate time and velocity
   * τ = t/γ = t√(1 - v²/c²)
   * 
   * @param coordinateTime Time in lab frame (seconds)
   * @param velocity Velocity magnitude (m/s)
   */
  fromCoordinateTime(coordinateTime: number, velocity: number): ProperTimeResult {
    const beta = velocity / this.c;
    if (beta >= 1) {
      throw new Error('Velocity must be less than speed of light');
    }

    const gamma = 1 / Math.sqrt(1 - beta * beta);
    const properTime = coordinateTime / gamma;

    const hash = HashVerifier.hash(`properTime:${properTime}:${coordinateTime}:${gamma}`);
    this.hashChain.addRecord(ProofType.COMPUTATION, 'fromCoordinateTime', hash);

    this.logger.debug('Computed proper time', { properTime, coordinateTime, gamma });

    return {
      properTime,
      coordinateTime,
      gamma,
      hash
    };
  }

  /**
   * Compute time dilation: Δt = γΔτ
   * Moving clocks run slower
   * 
   * @param properTime Time in rest frame (seconds)
   * @param velocity Velocity magnitude (m/s)
   */
  timeDilation(properTime: number, velocity: number): TimeDilationResult {
    const beta = velocity / this.c;
    if (beta >= 1) {
      throw new Error('Velocity must be less than speed of light');
    }

    const gamma = 1 / Math.sqrt(1 - beta * beta);
    const dilatedTime = gamma * properTime;

    const hash = HashVerifier.hash(`timeDilation:${properTime}:${dilatedTime}:${gamma}`);
    this.hashChain.addRecord(ProofType.COMPUTATION, 'timeDilation', hash);

    this.logger.debug('Computed time dilation', { properTime, dilatedTime, gamma });

    return {
      properTime,
      dilatedTime,
      gamma,
      hash
    };
  }

  /**
   * Compute length contraction: L = L₀/γ
   * Moving lengths are contracted
   * 
   * @param properLength Length in rest frame (meters)
   * @param velocity Velocity magnitude (m/s)
   */
  lengthContraction(properLength: number, velocity: number): LengthContractionResult {
    const beta = velocity / this.c;
    if (beta >= 1) {
      throw new Error('Velocity must be less than speed of light');
    }

    const gamma = 1 / Math.sqrt(1 - beta * beta);
    const contractedLength = properLength / gamma;

    const hash = HashVerifier.hash(`lengthContraction:${properLength}:${contractedLength}:${gamma}`);
    this.hashChain.addRecord(ProofType.COMPUTATION, 'lengthContraction', hash);

    this.logger.debug('Computed length contraction', { properLength, contractedLength, gamma });

    return {
      properLength,
      contractedLength,
      gamma,
      hash
    };
  }

  /**
   * Compute proper time along a worldline given as a set of events
   * τ = ∫ √(-ds²) / c
   * 
   * @param events Array of spacetime events [t, x, y, z]
   */
  alongWorldline(events: FourVector[]): number {
    if (events.length < 2) {
      throw new Error('Need at least 2 events for worldline');
    }

    const metric = new MinkowskiMetric();
    let totalProperTime = 0;

    for (let i = 1; i < events.length; i++) {
      const dx: FourVector = {
        t: events[i].t - events[i - 1].t,
        x: events[i].x - events[i - 1].x,
        y: events[i].y - events[i - 1].y,
        z: events[i].z - events[i - 1].z
      };

      const interval = metric.computeInterval(dx);
      if (interval.intervalType === 'timelike' && interval.properTime) {
        totalProperTime += interval.properTime;
      } else if (interval.intervalType !== 'lightlike') {
        throw new Error('Worldline must be timelike (causal)');
      }
    }

    return totalProperTime;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`ProperTime:${this.c}`);
  }
}

// ============================================================================
// FOUR-MOMENTUM CLASS
// ============================================================================

/**
 * Four-momentum in special relativity.
 * p^μ = (E/c, p_x, p_y, p_z)
 */
export class FourMomentum {
  private E: number;      // Energy
  private p: number[];    // 3-momentum [px, py, pz]
  private m: number;      // Rest mass
  private c: number;

  constructor(mass: number, velocity: number[]) {
    const constants = PhysicalConstants.getInstance();
    this.c = constants.get('speed_of_light').numericValue;
    this.m = mass;

    // Compute speed and Lorentz factor
    const v2 = velocity.reduce((sum, v) => sum + v * v, 0);
    const v = Math.sqrt(v2);
    const beta = v / this.c;
    
    if (beta >= 1) {
      throw new Error('Velocity must be less than speed of light');
    }

    const gamma = 1 / Math.sqrt(1 - beta * beta);

    // E = γmc²
    this.E = gamma * mass * this.c * this.c;

    // p = γmv
    this.p = velocity.map(v => gamma * mass * v);
  }

  /**
   * Get energy
   */
  getEnergy(): number {
    return this.E;
  }

  /**
   * Get 3-momentum
   */
  getMomentum(): number[] {
    return [...this.p];
  }

  /**
   * Get rest mass
   */
  getRestMass(): number {
    return this.m;
  }

  /**
   * Get as four-vector (E/c, px, py, pz)
   */
  toFourVector(): FourVector {
    return {
      t: this.E / this.c,
      x: this.p[0],
      y: this.p[1],
      z: this.p[2]
    };
  }

  /**
   * Compute invariant mass: m²c² = E²/c² - p²
   */
  invariantMass(): number {
    const pSquared = this.p.reduce((sum, pi) => sum + pi * pi, 0);
    const m2c2 = (this.E * this.E) / (this.c * this.c) - pSquared;
    return Math.sqrt(m2c2) / this.c;
  }

  /**
   * Create from energy and momentum
   */
  static fromEnergyMomentum(E: number, p: number[]): FourMomentum {
    const constants = PhysicalConstants.getInstance();
    const c = constants.get('speed_of_light').numericValue;
    
    // Compute mass from E² = (mc²)² + (pc)²
    const pSquared = p.reduce((sum, pi) => sum + pi * pi, 0);
    const m2c4 = E * E - pSquared * c * c;
    const m = Math.sqrt(m2c4) / (c * c);

    // Compute velocity from p = γmv
    const gamma = E / (m * c * c);
    const v = p.map(pi => pi / (gamma * m));

    return new FourMomentum(m, v);
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`FourMomentum:${this.E}:${JSON.stringify(this.p)}:${this.m}`);
  }
}

// ============================================================================
// RELATIVISTIC VELOCITY ADDITION
// ============================================================================

/**
 * Compute relativistic velocity addition
 * w = (u + v) / (1 + uv/c²) for collinear velocities
 */
export function relativisticVelocityAddition(u: number, v: number): number {
  const constants = PhysicalConstants.getInstance();
  const c = constants.get('speed_of_light').numericValue;
  
  return (u + v) / (1 + (u * v) / (c * c));
}

/**
 * Compute relativistic velocity addition for 3-vectors
 * Uses the full formula including transverse components
 */
export function relativisticVelocityAddition3D(u: number[], v: number[]): number[] {
  const constants = PhysicalConstants.getInstance();
  const c = constants.get('speed_of_light').numericValue;

  // Compute |v|² and γ_v
  const v2 = v.reduce((sum, vi) => sum + vi * vi, 0);
  const gamma_v = 1 / Math.sqrt(1 - v2 / (c * c));

  // Compute u·v
  const udotv = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

  // Denominator: 1 + u·v/c²
  const denom = 1 + udotv / (c * c);

  // Result: w = (v + u/γ_v + (γ_v/(γ_v+1)) * (u·v/c²) * v) / denom
  const factor = (gamma_v / (gamma_v + 1)) * (udotv / (c * c));
  
  return [
    (v[0] + u[0] / gamma_v + factor * v[0]) / denom,
    (v[1] + u[1] / gamma_v + factor * v[1]) / denom,
    (v[2] + u[2] / gamma_v + factor * v[2]) / denom
  ];
}

/**
 * Compute Lorentz factor from velocity
 */
export function lorentzFactor(velocity: number): number {
  const constants = PhysicalConstants.getInstance();
  const c = constants.get('speed_of_light').numericValue;
  const beta = velocity / c;
  
  if (beta >= 1) {
    throw new Error('Velocity must be less than speed of light');
  }
  
  return 1 / Math.sqrt(1 - beta * beta);
}

/**
 * Compute rapidity from velocity
 * φ = arctanh(v/c)
 */
export function rapidity(velocity: number): number {
  const constants = PhysicalConstants.getInstance();
  const c = constants.get('speed_of_light').numericValue;
  const beta = velocity / c;
  
  if (Math.abs(beta) >= 1) {
    throw new Error('Velocity must be less than speed of light');
  }
  
  return Math.atanh(beta);
}

/**
 * Compute velocity from rapidity
 * v = c * tanh(φ)
 */
export function velocityFromRapidity(phi: number): number {
  const constants = PhysicalConstants.getInstance();
  const c = constants.get('speed_of_light').numericValue;
  return c * Math.tanh(phi);
}

// Interfaces are already exported where they are defined above
