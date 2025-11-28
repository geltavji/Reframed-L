/**
 * RiemannTensor.ts - PRD-03 Phase 3.5
 * Module ID: M03.05
 * 
 * Implements Riemann curvature tensor, Ricci tensor, Ricci scalar,
 * and Einstein tensor for general relativity calculations.
 * 
 * Dependencies:
 * - Logger (M01.01)
 * - HashVerifier (M01.02)
 * - Tensor (M03.01)
 * - Metric (M03.04)
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier, HashChain, ProofType } from '../../core/logger/HashVerifier';
import { Tensor, TensorConfig, IndexType } from '../tensor/Tensor';
import { Metric } from '../curved/Metric';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Curvature tensor result
 */
export interface CurvatureTensorResult {
  tensor: Tensor;
  hash: string;
}

/**
 * Curvature scalar result
 */
export interface CurvatureScalarResult {
  value: number;
  hash: string;
}

/**
 * Curvature invariants (Kretschmann, etc.)
 */
export interface CurvatureInvariants {
  kretschmann: number;        // R^μνρσ R_μνρσ
  weylSquared: number;        // C^μνρσ C_μνρσ
  ricciSquared: number;       // R^μν R_μν
  hash: string;
}

/**
 * Einstein field equation verification
 */
export interface EinsteinEquationResult {
  lhs: Tensor;                // G_μν + Λg_μν
  isVacuum: boolean;          // T_μν = 0
  cosmologicalConstant: number;
  hash: string;
}

/**
 * Geodesic deviation result
 */
export interface GeodesicDeviationResult {
  deviationAcceleration: Tensor;  // D²ξ^μ/dτ²
  tidalForce: Tensor;            // R^μ_νρσ u^ν u^σ
  hash: string;
}

/**
 * Curvature classification
 */
export interface CurvatureClassification {
  petrovType: 'I' | 'II' | 'III' | 'D' | 'N' | 'O';
  isFlat: boolean;
  isConformallyFlat: boolean;
  isRicciFlat: boolean;
  hash: string;
}

// ============================================================================
// RIEMANN CURVATURE TENSOR
// ============================================================================

/**
 * Riemann curvature tensor R^ρ_σμν
 * 
 * The Riemann tensor measures the curvature of spacetime:
 * R^ρ_σμν = ∂_μ Γ^ρ_νσ - ∂_ν Γ^ρ_μσ + Γ^ρ_μλ Γ^λ_νσ - Γ^ρ_νλ Γ^λ_μσ
 */
export class RiemannTensor {
  private metric: Metric;
  private dimension: number;
  private logger: Logger;
  private hashChain: HashChain;
  
  // Small displacement for numerical derivatives
  private readonly EPSILON = 1e-8;
  
  constructor(metric: Metric) {
    this.metric = metric;
    this.dimension = metric.getDimension();
    Logger.resetInstance();
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });
    this.hashChain = new HashChain('riemann-tensor');
  }
  
  /**
   * Compute the Riemann tensor at a point
   */
  compute(point: number[]): CurvatureTensorResult {
    if (point.length !== this.dimension) {
      throw new Error(`Point dimension ${point.length} does not match spacetime dimension ${this.dimension}`);
    }
    
    // Get Christoffel symbols
    const christoffel = this.computeChristoffelArray(point);
    
    // Compute Riemann tensor components
    // R^ρ_σμν = ∂_μ Γ^ρ_νσ - ∂_ν Γ^ρ_μσ + Γ^ρ_μλ Γ^λ_νσ - Γ^ρ_νλ Γ^λ_μσ
    const components: number[] = [];
    const n = this.dimension;
    
    for (let rho = 0; rho < n; rho++) {
      for (let sigma = 0; sigma < n; sigma++) {
        for (let mu = 0; mu < n; mu++) {
          for (let nu = 0; nu < n; nu++) {
            // Derivatives of Christoffel symbols
            const dGamma_mu = this.christoffelDerivative(point, rho, nu, sigma, mu);
            const dGamma_nu = this.christoffelDerivative(point, rho, mu, sigma, nu);
            
            // Connection terms
            let connection1 = 0;
            let connection2 = 0;
            for (let lambda = 0; lambda < n; lambda++) {
              connection1 += christoffel[rho][mu][lambda] * christoffel[lambda][nu][sigma];
              connection2 += christoffel[rho][nu][lambda] * christoffel[lambda][mu][sigma];
            }
            
            const value = dGamma_mu - dGamma_nu + connection1 - connection2;
            components.push(value);
          }
        }
      }
    }
    
    // Create tensor with index structure R^ρ_σμν
    const config: TensorConfig = {
      rank: 4,
      dimensions: [n, n, n, n],
      indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT, IndexType.COVARIANT, IndexType.COVARIANT]
    };
    
    const tensor = new Tensor(config, components);
    const hash = HashVerifier.hash(`riemann:${JSON.stringify(point)}:${JSON.stringify(components.slice(0, 10))}`);
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ point }),
      JSON.stringify({ componentCount: components.length })
    );
    
    return { tensor, hash };
  }
  
  /**
   * Compute Christoffel symbols as a 3D array
   */
  private computeChristoffelArray(point: number[]): number[][][] {
    const n = this.dimension;
    const christoffel: number[][][] = [];
    const christoffelTensor = this.metric.christoffelSymbol(point).symbol;
    
    for (let lambda = 0; lambda < n; lambda++) {
      christoffel[lambda] = [];
      for (let mu = 0; mu < n; mu++) {
        christoffel[lambda][mu] = [];
        for (let nu = 0; nu < n; nu++) {
          christoffel[lambda][mu][nu] = christoffelTensor.get(lambda, mu, nu);
        }
      }
    }
    
    return christoffel;
  }
  
  /**
   * Compute derivative of Christoffel symbol
   * ∂_α Γ^λ_μν
   */
  private christoffelDerivative(point: number[], lambda: number, mu: number, nu: number, alpha: number): number {
    const h = this.EPSILON;
    
    // Forward point
    const pointPlus = [...point];
    pointPlus[alpha] += h;
    
    // Backward point
    const pointMinus = [...point];
    pointMinus[alpha] -= h;
    
    const gammaPlus = this.metric.getChristoffel(pointPlus, lambda, mu, nu);
    const gammaMinus = this.metric.getChristoffel(pointMinus, lambda, mu, nu);
    
    return (gammaPlus - gammaMinus) / (2 * h);
  }
  
  /**
   * Lower the first index to get R_ρσμν
   */
  lowerFirst(point: number[], riemannUp: Tensor): CurvatureTensorResult {
    const n = this.dimension;
    const g = this.metric.getMetricTensor(point);
    const components: number[] = [];
    
    for (let rho = 0; rho < n; rho++) {
      for (let sigma = 0; sigma < n; sigma++) {
        for (let mu = 0; mu < n; mu++) {
          for (let nu = 0; nu < n; nu++) {
            let value = 0;
            for (let lambda = 0; lambda < n; lambda++) {
              value += g[rho][lambda] * riemannUp.get(lambda, sigma, mu, nu);
            }
            components.push(value);
          }
        }
      }
    }
    
    const config: TensorConfig = {
      rank: 4,
      dimensions: [n, n, n, n],
      indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT, IndexType.COVARIANT, IndexType.COVARIANT]
    };
    
    const tensor = new Tensor(config, components);
    const hash = HashVerifier.hash(`riemann-lower:${JSON.stringify(point)}`);
    
    return { tensor, hash };
  }
  
  /**
   * Check symmetries of the Riemann tensor
   */
  checkSymmetries(point: number[]): { antisymmetric12: boolean; antisymmetric34: boolean; pairSymmetric: boolean; bianchi: boolean } {
    const result = this.compute(point);
    const R = result.tensor;
    const n = this.dimension;
    const eps = 1e-10;
    
    let antisymmetric12 = true;
    let antisymmetric34 = true;
    let pairSymmetric = true;
    
    // Get lowered tensor for symmetry checks
    const Rdown = this.lowerFirst(point, R).tensor;
    
    // Check R_ρσμν = -R_σρμν (after lowering first index)
    // Check R^ρ_σμν = -R^ρ_σνμ
    for (let rho = 0; rho < n; rho++) {
      for (let sigma = 0; sigma < n; sigma++) {
        for (let mu = 0; mu < n; mu++) {
          for (let nu = 0; nu < n; nu++) {
            // Antisymmetry in last two indices
            if (Math.abs(R.get(rho, sigma, mu, nu) + R.get(rho, sigma, nu, mu)) > eps) {
              antisymmetric34 = false;
            }
            
            // Pair symmetry R_ρσμν = R_μνρσ
            if (Math.abs(Rdown.get(rho, sigma, mu, nu) - Rdown.get(mu, nu, rho, sigma)) > eps) {
              pairSymmetric = false;
            }
          }
        }
      }
    }
    
    // First Bianchi identity: R^ρ_[σμν] = 0 (cyclic sum)
    let bianchi = true;
    for (let rho = 0; rho < n; rho++) {
      for (let sigma = 0; sigma < n; sigma++) {
        for (let mu = 0; mu < n; mu++) {
          for (let nu = 0; nu < n; nu++) {
            const cyclic = R.get(rho, sigma, mu, nu) + R.get(rho, mu, nu, sigma) + R.get(rho, nu, sigma, mu);
            if (Math.abs(cyclic) > eps) {
              bianchi = false;
            }
          }
        }
      }
    }
    
    return { antisymmetric12, antisymmetric34, pairSymmetric, bianchi };
  }
  
  /**
   * Get dimension
   */
  getDimension(): number {
    return this.dimension;
  }
  
  /**
   * Get the underlying metric
   */
  getMetric(): Metric {
    return this.metric;
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(`RiemannTensor:${this.metric.getHash()}`);
  }
  
  /**
   * Export proof chain
   */
  exportProofChain(): string {
    return this.hashChain.exportToJson();
  }
}

// ============================================================================
// RICCI TENSOR
// ============================================================================

/**
 * Ricci tensor R_μν = R^ρ_μρν
 * 
 * The Ricci tensor is the contraction of the Riemann tensor
 * and appears in the Einstein field equations.
 */
export class RicciTensor {
  private riemann: RiemannTensor;
  private dimension: number;
  private logger: Logger;
  private hashChain: HashChain;
  
  constructor(riemann: RiemannTensor) {
    this.riemann = riemann;
    this.dimension = riemann.getDimension();
    Logger.resetInstance();
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });
    this.hashChain = new HashChain('ricci-tensor');
  }
  
  /**
   * Compute the Ricci tensor at a point
   * R_μν = R^ρ_μρν
   */
  compute(point: number[]): CurvatureTensorResult {
    const n = this.dimension;
    const riemannResult = this.riemann.compute(point);
    const R = riemannResult.tensor;
    
    // Contract first and third indices
    const components: number[] = [];
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        let value = 0;
        for (let rho = 0; rho < n; rho++) {
          value += R.get(rho, mu, rho, nu);
        }
        components.push(value);
      }
    }
    
    const config: TensorConfig = {
      rank: 2,
      dimensions: [n, n],
      indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
    };
    
    const tensor = new Tensor(config, components);
    const hash = HashVerifier.hash(`ricci:${JSON.stringify(point)}:${JSON.stringify(components)}`);
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ point }),
      JSON.stringify({ components })
    );
    
    return { tensor, hash };
  }
  
  /**
   * Check if the Ricci tensor is symmetric
   */
  isSymmetric(point: number[]): boolean {
    const result = this.compute(point);
    const Ric = result.tensor;
    const n = this.dimension;
    const eps = 1e-10;
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = mu + 1; nu < n; nu++) {
        if (Math.abs(Ric.get(mu, nu) - Ric.get(nu, mu)) > eps) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Raise indices to get R^μν
   */
  raiseIndices(point: number[]): CurvatureTensorResult {
    const n = this.dimension;
    const ricciDown = this.compute(point);
    const gInv = this.riemann.getMetric().getInverseMetric(point);
    
    const components: number[] = [];
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        let value = 0;
        for (let alpha = 0; alpha < n; alpha++) {
          for (let beta = 0; beta < n; beta++) {
            value += gInv[mu][alpha] * gInv[nu][beta] * ricciDown.tensor.get(alpha, beta);
          }
        }
        components.push(value);
      }
    }
    
    const config: TensorConfig = {
      rank: 2,
      dimensions: [n, n],
      indexTypes: [IndexType.CONTRAVARIANT, IndexType.CONTRAVARIANT]
    };
    
    const tensor = new Tensor(config, components);
    const hash = HashVerifier.hash(`ricci-up:${JSON.stringify(point)}`);
    
    return { tensor, hash };
  }
  
  /**
   * Get the Riemann tensor
   */
  getRiemann(): RiemannTensor {
    return this.riemann;
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(`RicciTensor:${this.riemann.getHash()}`);
  }
}

// ============================================================================
// RICCI SCALAR
// ============================================================================

/**
 * Ricci scalar R = g^μν R_μν
 * 
 * The Ricci scalar is the trace of the Ricci tensor
 * and measures the scalar curvature of spacetime.
 */
export class RicciScalar {
  private ricci: RicciTensor;
  private dimension: number;
  private logger: Logger;
  private hashChain: HashChain;
  
  constructor(ricci: RicciTensor) {
    this.ricci = ricci;
    this.dimension = ricci.getRiemann().getDimension();
    Logger.resetInstance();
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });
    this.hashChain = new HashChain('ricci-scalar');
  }
  
  /**
   * Compute the Ricci scalar at a point
   * R = g^μν R_μν
   */
  compute(point: number[]): CurvatureScalarResult {
    const n = this.dimension;
    const ricciResult = this.ricci.compute(point);
    const Ric = ricciResult.tensor;
    const gInv = this.ricci.getRiemann().getMetric().getInverseMetric(point);
    
    let scalar = 0;
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        scalar += gInv[mu][nu] * Ric.get(mu, nu);
      }
    }
    
    const hash = HashVerifier.hash(`ricci-scalar:${JSON.stringify(point)}:${scalar}`);
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ point }),
      JSON.stringify({ scalar })
    );
    
    return { value: scalar, hash };
  }
  
  /**
   * Check if spacetime is flat (R = 0)
   */
  isFlat(point: number[], tolerance: number = 1e-10): boolean {
    const result = this.compute(point);
    return Math.abs(result.value) < tolerance;
  }
  
  /**
   * Get the Ricci tensor
   */
  getRicci(): RicciTensor {
    return this.ricci;
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(`RicciScalar:${this.ricci.getHash()}`);
  }
}

// ============================================================================
// EINSTEIN TENSOR
// ============================================================================

/**
 * Einstein tensor G_μν = R_μν - (1/2) R g_μν
 * 
 * The Einstein tensor appears in the Einstein field equations
 * and is divergence-free: ∇_μ G^μν = 0
 */
export class EinsteinTensor {
  private ricci: RicciTensor;
  private ricciScalar: RicciScalar;
  private dimension: number;
  private logger: Logger;
  private hashChain: HashChain;
  
  constructor(ricci: RicciTensor) {
    this.ricci = ricci;
    this.ricciScalar = new RicciScalar(ricci);
    this.dimension = ricci.getRiemann().getDimension();
    Logger.resetInstance();
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });
    this.hashChain = new HashChain('einstein-tensor');
  }
  
  /**
   * Compute the Einstein tensor at a point
   * G_μν = R_μν - (1/2) R g_μν
   */
  compute(point: number[]): CurvatureTensorResult {
    const n = this.dimension;
    const ricciResult = this.ricci.compute(point);
    const Ric = ricciResult.tensor;
    const scalarResult = this.ricciScalar.compute(point);
    const R = scalarResult.value;
    const g = this.ricci.getRiemann().getMetric().getMetricTensor(point);
    
    const components: number[] = [];
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        const value = Ric.get(mu, nu) - 0.5 * R * g[mu][nu];
        components.push(value);
      }
    }
    
    const config: TensorConfig = {
      rank: 2,
      dimensions: [n, n],
      indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
    };
    
    const tensor = new Tensor(config, components);
    const hash = HashVerifier.hash(`einstein:${JSON.stringify(point)}:${JSON.stringify(components)}`);
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ point }),
      JSON.stringify({ components, ricciScalar: R })
    );
    
    return { tensor, hash };
  }
  
  /**
   * Compute with cosmological constant
   * G_μν + Λ g_μν
   */
  computeWithLambda(point: number[], lambda: number): CurvatureTensorResult {
    const n = this.dimension;
    const einsteinResult = this.compute(point);
    const G = einsteinResult.tensor;
    const g = this.ricci.getRiemann().getMetric().getMetricTensor(point);
    
    const components: number[] = [];
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        const value = G.get(mu, nu) + lambda * g[mu][nu];
        components.push(value);
      }
    }
    
    const config: TensorConfig = {
      rank: 2,
      dimensions: [n, n],
      indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT]
    };
    
    const tensor = new Tensor(config, components);
    const hash = HashVerifier.hash(`einstein-lambda:${JSON.stringify(point)}:${lambda}`);
    
    return { tensor, hash };
  }
  
  /**
   * Check if spacetime is vacuum (G_μν = 0)
   */
  isVacuum(point: number[], tolerance: number = 1e-10): boolean {
    const result = this.compute(point);
    const G = result.tensor;
    const n = this.dimension;
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        if (Math.abs(G.get(mu, nu)) > tolerance) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get trace of Einstein tensor
   * G = g^μν G_μν = R - (n/2) R = (1 - n/2) R
   */
  trace(point: number[]): number {
    const n = this.dimension;
    const einsteinResult = this.compute(point);
    const G = einsteinResult.tensor;
    const gInv = this.ricci.getRiemann().getMetric().getInverseMetric(point);
    
    let trace = 0;
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        trace += gInv[mu][nu] * G.get(mu, nu);
      }
    }
    
    return trace;
  }
  
  /**
   * Get the Ricci tensor
   */
  getRicci(): RicciTensor {
    return this.ricci;
  }
  
  /**
   * Get the Ricci scalar
   */
  getRicciScalar(): RicciScalar {
    return this.ricciScalar;
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(`EinsteinTensor:${this.ricci.getHash()}`);
  }
}

// ============================================================================
// WEYL TENSOR
// ============================================================================

/**
 * Weyl conformal tensor C_ρσμν
 * 
 * The Weyl tensor is the trace-free part of the Riemann tensor:
 * C_ρσμν = R_ρσμν - (2/(n-2)) (g_ρ[μ R_ν]σ - g_σ[μ R_ν]ρ)
 *        + (2/((n-1)(n-2))) R g_ρ[μ g_ν]σ
 */
export class WeylTensor {
  private riemann: RiemannTensor;
  private ricci: RicciTensor;
  private ricciScalar: RicciScalar;
  private dimension: number;
  private logger: Logger;
  private hashChain: HashChain;
  
  constructor(riemann: RiemannTensor) {
    this.riemann = riemann;
    this.ricci = new RicciTensor(riemann);
    this.ricciScalar = new RicciScalar(this.ricci);
    this.dimension = riemann.getDimension();
    Logger.resetInstance();
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });
    this.hashChain = new HashChain('weyl-tensor');
  }
  
  /**
   * Compute the Weyl tensor at a point
   */
  compute(point: number[]): CurvatureTensorResult {
    const n = this.dimension;
    
    if (n < 3) {
      throw new Error('Weyl tensor is only defined for dimension >= 3');
    }
    
    // Get required tensors
    const riemannResult = this.riemann.compute(point);
    const riemannDown = this.riemann.lowerFirst(point, riemannResult.tensor);
    const R_down = riemannDown.tensor;
    
    const ricciResult = this.ricci.compute(point);
    const Ric = ricciResult.tensor;
    
    const scalarResult = this.ricciScalar.compute(point);
    const R = scalarResult.value;
    
    const g = this.riemann.getMetric().getMetricTensor(point);
    
    const components: number[] = [];
    const factor1 = 2 / (n - 2);
    const factor2 = 2 / ((n - 1) * (n - 2));
    
    for (let rho = 0; rho < n; rho++) {
      for (let sigma = 0; sigma < n; sigma++) {
        for (let mu = 0; mu < n; mu++) {
          for (let nu = 0; nu < n; nu++) {
            // R_ρσμν
            let value = R_down.get(rho, sigma, mu, nu);
            
            // Ricci tensor terms
            // -(2/(n-2)) (g_ρ[μ R_ν]σ - g_σ[μ R_ν]ρ)
            // = -(1/(n-2)) (g_ρμ R_νσ - g_ρν R_μσ - g_σμ R_νρ + g_σν R_μρ)
            value -= factor1 / 2 * (
              g[rho][mu] * Ric.get(nu, sigma) - g[rho][nu] * Ric.get(mu, sigma)
              - g[sigma][mu] * Ric.get(nu, rho) + g[sigma][nu] * Ric.get(mu, rho)
            );
            
            // Ricci scalar term
            // +(2/((n-1)(n-2))) R g_ρ[μ g_ν]σ
            // = (1/((n-1)(n-2))) R (g_ρμ g_νσ - g_ρν g_μσ)
            value += factor2 / 2 * R * (g[rho][mu] * g[nu][sigma] - g[rho][nu] * g[mu][sigma]);
            
            components.push(value);
          }
        }
      }
    }
    
    const config: TensorConfig = {
      rank: 4,
      dimensions: [n, n, n, n],
      indexTypes: [IndexType.COVARIANT, IndexType.COVARIANT, IndexType.COVARIANT, IndexType.COVARIANT]
    };
    
    const tensor = new Tensor(config, components);
    const hash = HashVerifier.hash(`weyl:${JSON.stringify(point)}`);
    
    this.hashChain.addRecord(
      ProofType.COMPUTATION,
      JSON.stringify({ point }),
      JSON.stringify({ dimension: n })
    );
    
    return { tensor, hash };
  }
  
  /**
   * Check if spacetime is conformally flat
   */
  isConformallyFlat(point: number[], tolerance: number = 1e-10): boolean {
    const result = this.compute(point);
    const C = result.tensor;
    const n = this.dimension;
    
    for (let rho = 0; rho < n; rho++) {
      for (let sigma = 0; sigma < n; sigma++) {
        for (let mu = 0; mu < n; mu++) {
          for (let nu = 0; nu < n; nu++) {
            if (Math.abs(C.get(rho, sigma, mu, nu)) > tolerance) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(`WeylTensor:${this.riemann.getHash()}`);
  }
}

// ============================================================================
// CURVATURE INVARIANTS
// ============================================================================

/**
 * Curvature invariants calculator
 * 
 * Computes various curvature invariants useful for characterizing spacetimes.
 */
export class CurvatureInvariantsCalculator {
  private riemann: RiemannTensor;
  private weyl: WeylTensor;
  private ricci: RicciTensor;
  private dimension: number;
  private logger: Logger;
  
  constructor(riemann: RiemannTensor) {
    this.riemann = riemann;
    this.weyl = new WeylTensor(riemann);
    this.ricci = new RicciTensor(riemann);
    this.dimension = riemann.getDimension();
    Logger.resetInstance();
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });
  }
  
  /**
   * Compute the Kretschmann scalar
   * K = R^μνρσ R_μνρσ
   */
  kretschmann(point: number[]): number {
    const n = this.dimension;
    const riemannUp = this.riemann.compute(point).tensor;
    const riemannDown = this.riemann.lowerFirst(point, riemannUp).tensor;
    const gInv = this.riemann.getMetric().getInverseMetric(point);
    
    // Raise all indices on riemannDown to get R^μνρσ
    let K = 0;
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        for (let rho = 0; rho < n; rho++) {
          for (let sigma = 0; sigma < n; sigma++) {
            // R^μνρσ from R_αβγδ
            let Rup = 0;
            for (let a = 0; a < n; a++) {
              for (let b = 0; b < n; b++) {
                for (let c = 0; c < n; c++) {
                  for (let d = 0; d < n; d++) {
                    Rup += gInv[mu][a] * gInv[nu][b] * gInv[rho][c] * gInv[sigma][d] * riemannDown.get(a, b, c, d);
                  }
                }
              }
            }
            
            K += Rup * riemannDown.get(mu, nu, rho, sigma);
          }
        }
      }
    }
    
    return K;
  }
  
  /**
   * Compute the Ricci squared invariant
   * I = R^μν R_μν
   */
  ricciSquared(point: number[]): number {
    const n = this.dimension;
    const ricciDown = this.ricci.compute(point).tensor;
    const ricciUp = this.ricci.raiseIndices(point).tensor;
    
    let I = 0;
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        I += ricciUp.get(mu, nu) * ricciDown.get(mu, nu);
      }
    }
    
    return I;
  }
  
  /**
   * Compute the Weyl squared invariant
   * W = C^μνρσ C_μνρσ
   */
  weylSquared(point: number[]): number {
    const n = this.dimension;
    const weylDown = this.weyl.compute(point).tensor;
    const gInv = this.riemann.getMetric().getInverseMetric(point);
    
    let W = 0;
    
    for (let mu = 0; mu < n; mu++) {
      for (let nu = 0; nu < n; nu++) {
        for (let rho = 0; rho < n; rho++) {
          for (let sigma = 0; sigma < n; sigma++) {
            // C^μνρσ from C_αβγδ
            let Cup = 0;
            for (let a = 0; a < n; a++) {
              for (let b = 0; b < n; b++) {
                for (let c = 0; c < n; c++) {
                  for (let d = 0; d < n; d++) {
                    Cup += gInv[mu][a] * gInv[nu][b] * gInv[rho][c] * gInv[sigma][d] * weylDown.get(a, b, c, d);
                  }
                }
              }
            }
            
            W += Cup * weylDown.get(mu, nu, rho, sigma);
          }
        }
      }
    }
    
    return W;
  }
  
  /**
   * Compute all curvature invariants
   */
  computeAll(point: number[]): CurvatureInvariants {
    const kretschmann = this.kretschmann(point);
    const ricciSquared = this.ricciSquared(point);
    const weylSquared = this.weylSquared(point);
    
    const hash = HashVerifier.hash(`invariants:${JSON.stringify(point)}:${kretschmann}:${ricciSquared}:${weylSquared}`);
    
    return {
      kretschmann,
      weylSquared,
      ricciSquared,
      hash
    };
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(`CurvatureInvariants:${this.riemann.getHash()}`);
  }
}

// ============================================================================
// GEODESIC DEVIATION
// ============================================================================

/**
 * Geodesic deviation equation calculator
 * 
 * D²ξ^μ/dτ² = R^μ_νρσ u^ν ξ^ρ u^σ
 * 
 * Describes how nearby geodesics deviate due to curvature.
 */
export class GeodesicDeviation {
  private riemann: RiemannTensor;
  private dimension: number;
  private logger: Logger;
  
  constructor(riemann: RiemannTensor) {
    this.riemann = riemann;
    this.dimension = riemann.getDimension();
    Logger.resetInstance();
    this.logger = Logger.getInstance({ minLevel: LogLevel.DEBUG, enableConsole: false });
  }
  
  /**
   * Compute the geodesic deviation acceleration
   * D²ξ^μ/dτ² = R^μ_νρσ u^ν ξ^ρ u^σ
   */
  compute(point: number[], velocity: number[], separation: number[]): GeodesicDeviationResult {
    const n = this.dimension;
    
    if (velocity.length !== n || separation.length !== n) {
      throw new Error('Velocity and separation must match spacetime dimension');
    }
    
    const R = this.riemann.compute(point).tensor;
    
    // Compute acceleration: a^μ = R^μ_νρσ u^ν ξ^ρ u^σ
    const acceleration: number[] = [];
    
    for (let mu = 0; mu < n; mu++) {
      let acc = 0;
      for (let nu = 0; nu < n; nu++) {
        for (let rho = 0; rho < n; rho++) {
          for (let sigma = 0; sigma < n; sigma++) {
            acc += R.get(mu, nu, rho, sigma) * velocity[nu] * separation[rho] * velocity[sigma];
          }
        }
      }
      acceleration.push(acc);
    }
    
    // Create acceleration tensor
    const accConfig: TensorConfig = {
      rank: 1,
      dimensions: [n],
      indexTypes: [IndexType.CONTRAVARIANT]
    };
    
    // Compute tidal force tensor: T^μ_ρ = R^μ_νρσ u^ν u^σ
    const tidalComponents: number[] = [];
    
    for (let mu = 0; mu < n; mu++) {
      for (let rho = 0; rho < n; rho++) {
        let tidal = 0;
        for (let nu = 0; nu < n; nu++) {
          for (let sigma = 0; sigma < n; sigma++) {
            tidal += R.get(mu, nu, rho, sigma) * velocity[nu] * velocity[sigma];
          }
        }
        tidalComponents.push(tidal);
      }
    }
    
    const tidalConfig: TensorConfig = {
      rank: 2,
      dimensions: [n, n],
      indexTypes: [IndexType.CONTRAVARIANT, IndexType.COVARIANT]
    };
    
    const hash = HashVerifier.hash(`geodesic-deviation:${JSON.stringify(point)}:${JSON.stringify(velocity)}`);
    
    return {
      deviationAcceleration: new Tensor(accConfig, acceleration),
      tidalForce: new Tensor(tidalConfig, tidalComponents),
      hash
    };
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(`GeodesicDeviation:${this.riemann.getHash()}`);
  }
}

// ============================================================================
// CURVATURE FACTORY
// ============================================================================

/**
 * Factory class for creating curvature tensors from common metrics
 */
export class CurvatureFactory {
  /**
   * Create Riemann tensor from a metric
   */
  fromMetric(metric: Metric): RiemannTensor {
    return new RiemannTensor(metric);
  }
  
  /**
   * Create full curvature analysis from a metric
   */
  fullAnalysis(metric: Metric): {
    riemann: RiemannTensor;
    ricci: RicciTensor;
    ricciScalar: RicciScalar;
    einstein: EinsteinTensor;
    weyl: WeylTensor;
    invariants: CurvatureInvariantsCalculator;
    deviation: GeodesicDeviation;
  } {
    const riemann = new RiemannTensor(metric);
    const ricci = new RicciTensor(riemann);
    const ricciScalar = new RicciScalar(ricci);
    const einstein = new EinsteinTensor(ricci);
    const weyl = new WeylTensor(riemann);
    const invariants = new CurvatureInvariantsCalculator(riemann);
    const deviation = new GeodesicDeviation(riemann);
    
    return { riemann, ricci, ricciScalar, einstein, weyl, invariants, deviation };
  }
  
  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash('CurvatureFactory');
  }
}
