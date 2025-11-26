/**
 * Metric.test.ts - Tests for PRD-03 Phase 3.4
 * Module ID: M03.04
 * 
 * Tests curved spacetime metrics, Christoffel symbols, and geodesic equations.
 */

import {
  Metric,
  MetricFactory,
  GeodesicUtils,
  MetricConfig,
  GeodesicParams
} from '../../../src/spacetime/curved/Metric';
import { IndexType } from '../../../src/spacetime/tensor/Tensor';

describe('Metric - PRD-03 Phase 3.4: Curved Spacetime Basics', () => {
  // ============================================================================
  // METRIC CREATION TESTS
  // ============================================================================

  describe('Metric Creation', () => {
    test('should create Minkowski metric', () => {
      const metric = MetricFactory.minkowski();
      
      expect(metric.getDimension()).toBe(4);
      expect(metric.getSignature()).toEqual([-1, 1, 1, 1]);
      expect(metric.getName()).toBe('Minkowski');
    });

    test('should create Schwarzschild metric', () => {
      const rs = 2; // Schwarzschild radius
      const metric = MetricFactory.schwarzschild(rs);
      
      expect(metric.getDimension()).toBe(4);
      expect(metric.getName()).toBe('Schwarzschild');
    });

    test('should create Kerr metric', () => {
      const M = 1;
      const a = 0.5;
      const metric = MetricFactory.kerr(M, a);
      
      expect(metric.getDimension()).toBe(4);
      expect(metric.getName()).toBe('Kerr');
    });

    test('should create FLRW metric', () => {
      const scaleFactor = (t: number) => Math.exp(t * 0.1); // de Sitter-like
      const metric = MetricFactory.flrw(scaleFactor, 0);
      
      expect(metric.getDimension()).toBe(4);
      expect(metric.getName()).toBe('FLRW');
    });

    test('should create 2D sphere metric', () => {
      const R = 1;
      const metric = MetricFactory.sphere2D(R);
      
      expect(metric.getDimension()).toBe(2);
      expect(metric.getSignature()).toEqual([1, 1]);
    });

    test('should create custom metric', () => {
      const metricFn = (x: number[]) => [
        [1, 0],
        [0, x[0] * x[0]] // Polar coordinates in 2D
      ];
      
      const metric = MetricFactory.custom(2, metricFn, 'Polar');
      expect(metric.getDimension()).toBe(2);
      expect(metric.getName()).toBe('Polar');
    });

    test('should throw for invalid dimension', () => {
      const metricFn = () => [[1]];
      expect(() => {
        new Metric({ dimension: 0 }, metricFn);
      }).toThrow();
    });
  });

  // ============================================================================
  // MINKOWSKI METRIC TESTS
  // ============================================================================

  describe('Minkowski Metric', () => {
    let minkowski: Metric;

    beforeEach(() => {
      minkowski = MetricFactory.minkowski();
    });

    test('should have correct metric tensor components', () => {
      const x = [0, 0, 0, 0];
      const g = minkowski.getMetricTensor(x);
      
      expect(g[0][0]).toBe(-1);
      expect(g[1][1]).toBe(1);
      expect(g[2][2]).toBe(1);
      expect(g[3][3]).toBe(1);
      
      // Off-diagonal elements should be zero
      expect(g[0][1]).toBe(0);
      expect(g[1][2]).toBe(0);
    });

    test('should compute correct inverse metric', () => {
      const x = [0, 0, 0, 0];
      const gInv = minkowski.getInverseMetric(x);
      
      expect(gInv[0][0]).toBeCloseTo(-1, 10);
      expect(gInv[1][1]).toBeCloseTo(1, 10);
      expect(gInv[2][2]).toBeCloseTo(1, 10);
      expect(gInv[3][3]).toBeCloseTo(1, 10);
    });

    test('should compute correct line element for timelike interval', () => {
      const x = [0, 0, 0, 0];
      const dx = [1, 0, 0, 0]; // Pure time displacement
      
      const ds2 = minkowski.lineElement(x, dx);
      expect(ds2).toBe(-1); // Timelike
    });

    test('should compute correct line element for spacelike interval', () => {
      const x = [0, 0, 0, 0];
      const dx = [0, 1, 0, 0]; // Pure space displacement
      
      const ds2 = minkowski.lineElement(x, dx);
      expect(ds2).toBe(1); // Spacelike
    });

    test('should compute correct line element for null interval', () => {
      const x = [0, 0, 0, 0];
      const dx = [1, 1, 0, 0]; // Light-like
      
      const ds2 = minkowski.lineElement(x, dx);
      expect(ds2).toBeCloseTo(0, 10); // Null
    });

    test('should classify intervals correctly', () => {
      const x = [0, 0, 0, 0];
      
      expect(minkowski.classifyInterval(x, [1, 0, 0, 0])).toBe('timelike');
      expect(minkowski.classifyInterval(x, [0, 1, 0, 0])).toBe('spacelike');
      expect(minkowski.classifyInterval(x, [1, 1, 0, 0])).toBe('null');
    });

    test('should have zero Christoffel symbols', () => {
      const x = [0, 0, 0, 0];
      const result = minkowski.christoffelSymbol(x);
      
      // All Christoffel symbols should be zero for flat spacetime
      for (let lambda = 0; lambda < 4; lambda++) {
        for (let mu = 0; mu < 4; mu++) {
          for (let nu = 0; nu < 4; nu++) {
            expect(Math.abs(result.symbol.get(lambda, mu, nu))).toBeLessThan(1e-6);
          }
        }
      }
    });

    test('should return geodesics as straight lines', () => {
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 0.5, 0, 0],
        properTimeRange: [0, 2],
        steps: 20
      };

      const solution = minkowski.solveGeodesic(params);
      
      // In flat spacetime, velocity should be constant
      const firstV = solution.points[0].velocity;
      const lastV = solution.points[solution.points.length - 1].velocity;
      
      for (let i = 0; i < 4; i++) {
        expect(lastV[i]).toBeCloseTo(firstV[i], 4);
      }
    });
  });

  // ============================================================================
  // SCHWARZSCHILD METRIC TESTS
  // ============================================================================

  describe('Schwarzschild Metric', () => {
    let schwarzschild: Metric;
    const rs = 2; // Schwarzschild radius

    beforeEach(() => {
      schwarzschild = MetricFactory.schwarzschild(rs);
    });

    test('should have correct g_tt component', () => {
      const r = 10;
      const x = [0, r, Math.PI / 2, 0]; // [t, r, θ, φ]
      const g = schwarzschild.getMetricTensor(x);
      
      const expected_gtt = -(1 - rs / r);
      expect(g[0][0]).toBeCloseTo(expected_gtt, 10);
    });

    test('should have correct g_rr component', () => {
      const r = 10;
      const x = [0, r, Math.PI / 2, 0];
      const g = schwarzschild.getMetricTensor(x);
      
      const expected_grr = 1 / (1 - rs / r);
      expect(g[1][1]).toBeCloseTo(expected_grr, 10);
    });

    test('should have correct angular components', () => {
      const r = 10;
      const theta = Math.PI / 3;
      const x = [0, r, theta, 0];
      const g = schwarzschild.getMetricTensor(x);
      
      expect(g[2][2]).toBeCloseTo(r * r, 10);
      expect(g[3][3]).toBeCloseTo(r * r * Math.sin(theta) ** 2, 10);
    });

    test('should approach Minkowski at large r', () => {
      const r = 1000; // Far from black hole
      const x = [0, r, Math.PI / 2, 0];
      const g = schwarzschild.getMetricTensor(x);
      
      expect(g[0][0]).toBeCloseTo(-1, 2); // Approaches -1
      expect(g[1][1]).toBeCloseTo(1, 2);  // Approaches 1
    });

    test('should throw for r <= rs', () => {
      const x = [0, rs * 0.5, Math.PI / 2, 0];
      expect(() => schwarzschild.getMetricTensor(x)).toThrow();
    });

    test('should have non-zero Christoffel symbols', () => {
      const r = 10;
      const x = [0, r, Math.PI / 2, 0];
      const result = schwarzschild.christoffelSymbol(x);
      
      // Γ^r_tt should be non-zero
      const gamma_r_tt = result.symbol.get(1, 0, 0);
      expect(Math.abs(gamma_r_tt)).toBeGreaterThan(1e-8);
    });

    test('should compute radial geodesic', () => {
      const r0 = 20;
      const params: GeodesicParams = {
        initialPosition: [0, r0, Math.PI / 2, 0],
        initialVelocity: [1, -0.1, 0, 0], // Falling inward
        properTimeRange: [0, 5],
        steps: 50
      };

      const solution = schwarzschild.solveGeodesic(params);
      
      // Particle should fall inward (r decreases)
      const firstR = solution.points[0].position[1];
      const lastR = solution.points[solution.points.length - 1].position[1];
      expect(lastR).toBeLessThan(firstR);
    });
  });

  // ============================================================================
  // CHRISTOFFEL SYMBOL TESTS
  // ============================================================================

  describe('Christoffel Symbols', () => {
    test('should be symmetric in lower indices', () => {
      const metric = MetricFactory.schwarzschild(2);
      const x = [0, 10, Math.PI / 2, 0];
      const result = metric.christoffelSymbol(x);
      
      // Γ^λ_μν = Γ^λ_νμ
      for (let lambda = 0; lambda < 4; lambda++) {
        for (let mu = 0; mu < 4; mu++) {
          for (let nu = mu; nu < 4; nu++) {
            const gamma_muNu = result.symbol.get(lambda, mu, nu);
            const gamma_nuMu = result.symbol.get(lambda, nu, mu);
            expect(gamma_muNu).toBeCloseTo(gamma_nuMu, 6);
          }
        }
      }
    });

    test('should have correct hash', () => {
      const metric = MetricFactory.minkowski();
      const x = [0, 0, 0, 0];
      const result = metric.christoffelSymbol(x);
      
      expect(result.hash).toBeDefined();
      expect(typeof result.hash).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // GEODESIC EQUATION TESTS
  // ============================================================================

  describe('Geodesic Equation', () => {
    test('should classify timelike geodesics', () => {
      const metric = MetricFactory.minkowski();
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 0.5, 0, 0], // u² < c² (timelike)
        properTimeRange: [0, 1],
        steps: 10
      };

      const solution = metric.solveGeodesic(params);
      expect(solution.isTimelike).toBe(true);
      expect(solution.isNull).toBe(false);
      expect(solution.isSpacelike).toBe(false);
    });

    test('should classify null geodesics', () => {
      const metric = MetricFactory.minkowski();
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 1, 0, 0], // u = c (null)
        properTimeRange: [0, 1],
        steps: 10
      };

      const solution = metric.solveGeodesic(params);
      expect(solution.isNull).toBe(true);
    });

    test('should classify spacelike geodesics', () => {
      const metric = MetricFactory.minkowski();
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [0.5, 1, 0, 0], // u > c (spacelike)
        properTimeRange: [0, 1],
        steps: 10
      };

      const solution = metric.solveGeodesic(params);
      expect(solution.isSpacelike).toBe(true);
    });

    test('should conserve energy for Schwarzschild geodesics', () => {
      const metric = MetricFactory.schwarzschild(2);
      const r0 = 10;
      const x0 = [0, r0, Math.PI / 2, 0];
      
      // Calculate initial energy E = -g_tt * dt/dτ
      const g0 = metric.getMetricTensor(x0);
      const v0 = [1, 0, 0, 0.1]; // Circular-ish motion
      const E0 = -g0[0][0] * v0[0];

      const params: GeodesicParams = {
        initialPosition: x0,
        initialVelocity: v0,
        properTimeRange: [0, 5],
        steps: 50
      };

      const solution = metric.solveGeodesic(params);
      
      // Check energy at end (approximately conserved)
      const lastPoint = solution.points[solution.points.length - 1];
      const gLast = metric.getMetricTensor(lastPoint.position);
      const ELast = -gLast[0][0] * lastPoint.velocity[0];
      
      // Energy should be approximately conserved (within numerical error)
      expect(ELast).toBeCloseTo(E0, 1);
    });
  });

  // ============================================================================
  // PARALLEL TRANSPORT TESTS
  // ============================================================================

  describe('Parallel Transport', () => {
    test('should preserve vector length in flat spacetime', () => {
      const metric = MetricFactory.minkowski();
      const vector = [0, 1, 0, 0]; // Spatial vector
      
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 0, 0, 0],
        properTimeRange: [0, 2],
        steps: 20
      };

      const result = metric.parallelTransport(vector, params);
      
      // Vector should be unchanged in flat spacetime
      for (let i = 0; i < 4; i++) {
        expect(result.finalVector[i]).toBeCloseTo(vector[i], 4);
      }
    });

    test('should produce valid hash', () => {
      const metric = MetricFactory.minkowski();
      const vector = [0, 1, 0, 0];
      
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 0, 0, 0],
        properTimeRange: [0, 1],
        steps: 10
      };

      const result = metric.parallelTransport(vector, params);
      expect(result.hash).toBeDefined();
      expect(result.path.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // COVARIANT DERIVATIVE TESTS
  // ============================================================================

  describe('Covariant Derivative', () => {
    test('should equal partial derivative in flat spacetime', () => {
      const metric = MetricFactory.minkowski();
      
      // Constant vector field
      const vectorField = (_x: number[]) => [0, 1, 0, 0];
      const x = [0, 0, 0, 0];
      
      const result = metric.covariantDerivativeVector(vectorField, x);
      
      // All components should be zero for constant field
      for (let mu = 0; mu < 4; mu++) {
        for (let nu = 0; nu < 4; nu++) {
          expect(Math.abs(result.derivative.get(mu, nu))).toBeLessThan(1e-6);
        }
      }
    });

    test('should have correct tensor structure', () => {
      const metric = MetricFactory.minkowski();
      const vectorField = (x: number[]) => [x[0], x[1], 0, 0];
      const point = [1, 1, 0, 0];
      
      const result = metric.covariantDerivativeVector(vectorField, point);
      
      expect(result.derivative.getRank()).toBe(2);
      expect(result.derivative.getDimensions()).toEqual([4, 4]);
    });
  });

  // ============================================================================
  // KERR METRIC TESTS
  // ============================================================================

  describe('Kerr Metric', () => {
    test('should reduce to Schwarzschild for a=0', () => {
      const M = 1;
      const kerr = MetricFactory.kerr(M, 0);
      const schwarzschild = MetricFactory.schwarzschild(2 * M);
      
      const r = 10;
      const x = [0, r, Math.PI / 2, 0];
      
      const gKerr = kerr.getMetricTensor(x);
      const gSch = schwarzschild.getMetricTensor(x);
      
      // Diagonal components should match
      expect(gKerr[0][0]).toBeCloseTo(gSch[0][0], 6);
      expect(gKerr[1][1]).toBeCloseTo(gSch[1][1], 6);
      expect(gKerr[2][2]).toBeCloseTo(gSch[2][2], 6);
      expect(gKerr[3][3]).toBeCloseTo(gSch[3][3], 6);
    });

    test('should have non-zero g_tφ component for a≠0', () => {
      const M = 1;
      const a = 0.5;
      const kerr = MetricFactory.kerr(M, a);
      
      const x = [0, 10, Math.PI / 2, 0];
      const g = kerr.getMetricTensor(x);
      
      // Off-diagonal component should be non-zero
      expect(g[0][3]).not.toBe(0);
      expect(g[3][0]).not.toBe(0);
      expect(g[0][3]).toBe(g[3][0]); // Symmetric
    });
  });

  // ============================================================================
  // FLRW METRIC TESTS
  // ============================================================================

  describe('FLRW Metric', () => {
    test('should have scale factor dependence', () => {
      const a0 = 1;
      const H = 0.1;
      const scaleFactor = (t: number) => a0 * Math.exp(H * t);
      const metric = MetricFactory.flrw(scaleFactor, 0);
      
      const t1 = 0;
      const t2 = 10;
      const x1 = [t1, 1, Math.PI / 2, 0];
      const x2 = [t2, 1, Math.PI / 2, 0];
      
      const g1 = metric.getMetricTensor(x1);
      const g2 = metric.getMetricTensor(x2);
      
      // Spatial components should be larger at later time
      expect(g2[1][1]).toBeGreaterThan(g1[1][1]);
    });

    test('should have correct g_tt = -1', () => {
      const scaleFactor = (t: number) => 1 + 0.1 * t;
      const metric = MetricFactory.flrw(scaleFactor, 0);
      
      const x = [5, 1, Math.PI / 2, 0];
      const g = metric.getMetricTensor(x);
      
      expect(g[0][0]).toBe(-1);
    });
  });

  // ============================================================================
  // GEODESIC UTILITIES TESTS
  // ============================================================================

  describe('GeodesicUtils', () => {
    test('should compute path length', () => {
      const metric = MetricFactory.minkowski();
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 0, 0, 0],
        properTimeRange: [0, 5],
        steps: 50
      };

      const solution = metric.solveGeodesic(params);
      const length = GeodesicUtils.pathLength(solution);
      
      expect(length).toBeCloseTo(5, 5);
    });

    test('should check normalization', () => {
      const metric = MetricFactory.minkowski();
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 0, 0, 0],
        properTimeRange: [0, 1],
        steps: 10
      };

      const solution = metric.solveGeodesic(params);
      const norm = GeodesicUtils.checkNormalization(metric, solution.points[0]);
      
      expect(norm).toBeCloseTo(-1, 10); // Timelike, normalized
    });

    test('should detect non-closed geodesic', () => {
      const metric = MetricFactory.minkowski();
      const params: GeodesicParams = {
        initialPosition: [0, 0, 0, 0],
        initialVelocity: [1, 0.5, 0, 0],
        properTimeRange: [0, 2],
        steps: 20
      };

      const solution = metric.solveGeodesic(params);
      expect(GeodesicUtils.isClosed(solution)).toBe(false);
    });
  });

  // ============================================================================
  // 2D SPHERE TESTS
  // ============================================================================

  describe('2D Sphere Metric', () => {
    test('should have correct components', () => {
      const R = 2;
      const sphere = MetricFactory.sphere2D(R);
      
      const theta = Math.PI / 3;
      const x = [theta, 0];
      const g = sphere.getMetricTensor(x);
      
      expect(g[0][0]).toBeCloseTo(R * R, 10);
      expect(g[1][1]).toBeCloseTo(R * R * Math.sin(theta) ** 2, 10);
      expect(g[0][1]).toBe(0);
      expect(g[1][0]).toBe(0);
    });

    test('should have non-zero Christoffel symbols', () => {
      const R = 1;
      const sphere = MetricFactory.sphere2D(R);
      
      const theta = Math.PI / 3;
      const x = [theta, 0];
      const result = sphere.christoffelSymbol(x);
      
      // Γ^θ_φφ = -sin(θ)cos(θ)
      const gamma_theta_phiphi = result.symbol.get(0, 1, 1);
      const expected = -Math.sin(theta) * Math.cos(theta);
      expect(gamma_theta_phiphi).toBeCloseTo(expected, 4);
    });
  });

  // ============================================================================
  // REISSNER-NORDSTRÖM METRIC TESTS
  // ============================================================================

  describe('Reissner-Nordström Metric', () => {
    test('should reduce to Schwarzschild for Q=0', () => {
      const M = 1;
      const rn = MetricFactory.reissnerNordstrom(M, 0);
      const schwarzschild = MetricFactory.schwarzschild(2 * M);
      
      const x = [0, 10, Math.PI / 2, 0];
      
      const gRN = rn.getMetricTensor(x);
      const gSch = schwarzschild.getMetricTensor(x);
      
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          expect(gRN[i][j]).toBeCloseTo(gSch[i][j], 8);
        }
      }
    });

    test('should have charge correction', () => {
      const M = 1;
      const Q = 0.5;
      const rn = MetricFactory.reissnerNordstrom(M, Q);
      
      const r = 10;
      const x = [0, r, Math.PI / 2, 0];
      const g = rn.getMetricTensor(x);
      
      const factor = 1 - 2 * M / r + Q * Q / (r * r);
      expect(g[0][0]).toBeCloseTo(-factor, 10);
    });
  });

  // ============================================================================
  // DE SITTER METRIC TESTS
  // ============================================================================

  describe('de Sitter Metric', () => {
    test('should have cosmological horizon', () => {
      const alpha = 10;
      const deSitter = MetricFactory.deSitter(alpha);
      
      // At r < α, should work fine
      const x1 = [0, 5, Math.PI / 2, 0];
      const g1 = deSitter.getMetricTensor(x1);
      expect(g1[0][0]).toBeLessThan(0);
      
      // At r > α, should throw
      const x2 = [0, 15, Math.PI / 2, 0];
      expect(() => deSitter.getMetricTensor(x2)).toThrow();
    });

    test('should approach Minkowski at small r', () => {
      const alpha = 1000;
      const deSitter = MetricFactory.deSitter(alpha);
      
      const x = [0, 1, Math.PI / 2, 0];
      const g = deSitter.getMetricTensor(x);
      
      expect(g[0][0]).toBeCloseTo(-1, 4);
      expect(g[1][1]).toBeCloseTo(1, 4);
    });
  });

  // ============================================================================
  // ANTI-DE SITTER METRIC TESTS
  // ============================================================================

  describe('Anti-de Sitter Metric', () => {
    test('should not have horizon', () => {
      const alpha = 10;
      const adS = MetricFactory.antiDeSitter(alpha);
      
      // Should work for any r
      const x = [0, 100, Math.PI / 2, 0];
      const g = adS.getMetricTensor(x);
      expect(g[0][0]).toBeLessThan(0);
    });

    test('should have increasing |g_tt| with r', () => {
      const alpha = 10;
      const adS = MetricFactory.antiDeSitter(alpha);
      
      const x1 = [0, 1, Math.PI / 2, 0];
      const x2 = [0, 10, Math.PI / 2, 0];
      
      const g1 = adS.getMetricTensor(x1);
      const g2 = adS.getMetricTensor(x2);
      
      expect(Math.abs(g2[0][0])).toBeGreaterThan(Math.abs(g1[0][0]));
    });
  });

  // ============================================================================
  // HASH VERIFICATION TESTS
  // ============================================================================

  describe('Hash Verification', () => {
    test('should generate consistent hashes', () => {
      const metric = MetricFactory.minkowski();
      const x = [0, 0, 0, 0];
      
      const result1 = metric.christoffelSymbol(x);
      const result2 = metric.christoffelSymbol(x);
      
      // Hashes should be deterministic for same input
      expect(result1.hash).toBe(result2.hash);
    });

    test('should export proof chain', () => {
      const metric = MetricFactory.schwarzschild(2);
      const x = [0, 10, Math.PI / 2, 0];
      
      metric.christoffelSymbol(x);
      metric.christoffelSymbol([0, 15, Math.PI / 2, 0]);
      
      const proofChain = metric.exportProofChain();
      expect(proofChain).toBeDefined();
    });
  });

  // ============================================================================
  // METRIC AS TENSOR TESTS
  // ============================================================================

  describe('Metric as Tensor', () => {
    test('should return correct tensor structure', () => {
      const metric = MetricFactory.minkowski();
      const x = [0, 0, 0, 0];
      const tensor = metric.getMetricAsTensor(x);
      
      expect(tensor.getRank()).toBe(2);
      expect(tensor.getDimensions()).toEqual([4, 4]);
      expect(tensor.getIndexTypes()).toEqual([IndexType.COVARIANT, IndexType.COVARIANT]);
    });

    test('should have correct components', () => {
      const metric = MetricFactory.minkowski();
      const x = [0, 0, 0, 0];
      const tensor = metric.getMetricAsTensor(x);
      
      expect(tensor.get(0, 0)).toBe(-1);
      expect(tensor.get(1, 1)).toBe(1);
      expect(tensor.get(0, 1)).toBe(0);
    });
  });
});
