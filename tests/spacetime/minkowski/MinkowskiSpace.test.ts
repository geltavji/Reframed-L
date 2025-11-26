/**
 * MinkowskiSpace.test.ts - PRD-03 Phase 3.2 Tests
 * 
 * Tests for Minkowski spacetime implementation including:
 * - Minkowski metric
 * - Lorentz transformations
 * - Proper time calculations
 * - Special relativity effects
 */

import {
  MinkowskiMetric,
  LorentzTransform,
  ProperTime,
  FourMomentum,
  FourVector,
  relativisticVelocityAddition,
  relativisticVelocityAddition3D,
  lorentzFactor,
  rapidity,
  velocityFromRapidity
} from '../../../src/spacetime/minkowski/MinkowskiSpace';
import { PhysicalConstants } from '../../../src/core/constants/PhysicalConstants';

describe('MinkowskiSpace (M03.02) - Phase 3.2', () => {
  let c: number;

  beforeAll(() => {
    const constants = PhysicalConstants.getInstance();
    c = constants.get('speed_of_light').numericValue;
  });

  describe('MinkowskiMetric', () => {
    let metric: MinkowskiMetric;

    beforeEach(() => {
      metric = new MinkowskiMetric();
    });

    it('should create Minkowski metric with signature (-,+,+,+)', () => {
      expect(metric.get(0, 0)).toBe(-1);
      expect(metric.get(1, 1)).toBe(1);
      expect(metric.get(2, 2)).toBe(1);
      expect(metric.get(3, 3)).toBe(1);
      expect(metric.get(0, 1)).toBe(0);
    });

    it('should have correct inverse metric', () => {
      const inverse = metric.getInverseMetric();
      expect(inverse.get(0, 0)).toBe(-1);
      expect(inverse.get(1, 1)).toBe(1);
    });

    it('should compute timelike interval correctly', () => {
      // Pure time interval (at rest)
      const dx: FourVector = { t: 1, x: 0, y: 0, z: 0 };
      const interval = metric.computeInterval(dx);
      
      expect(interval.intervalType).toBe('timelike');
      expect(interval.ds_squared).toBeLessThan(0);
      expect(interval.properTime).toBeCloseTo(1, 5);
    });

    it('should compute spacelike interval correctly', () => {
      // Pure space interval
      const dx: FourVector = { t: 0, x: 1, y: 0, z: 0 };
      const interval = metric.computeInterval(dx);
      
      expect(interval.intervalType).toBe('spacelike');
      expect(interval.ds_squared).toBeGreaterThan(0);
      expect(interval.properDistance).toBeCloseTo(1, 5);
    });

    it('should compute lightlike interval correctly', () => {
      // Light travels at 45° in spacetime
      const dx: FourVector = { t: 1 / c, x: 1, y: 0, z: 0 };
      const interval = metric.computeInterval(dx);
      
      expect(interval.intervalType).toBe('lightlike');
      expect(Math.abs(interval.ds_squared)).toBeLessThan(1e-6);
    });

    it('should compute inner product correctly', () => {
      const A: FourVector = { t: 2, x: 1, y: 0, z: 0 };
      const B: FourVector = { t: 3, x: 2, y: 0, z: 0 };
      
      // η_μν A^μ B^ν = -c²*2*3 + 1*2 + 0 + 0
      const expected = -c * c * 2 * 3 + 1 * 2;
      expect(metric.innerProduct(A, B)).toBeCloseTo(expected, 5);
    });

    it('should raise and lower indices correctly', () => {
      const A: FourVector = { t: 1, x: 2, y: 3, z: 4 };
      
      const A_lower = metric.lowerIndex(A);
      expect(A_lower.t).toBe(-1);  // η_00 = -1
      expect(A_lower.x).toBe(2);
      
      const A_raised = metric.raiseIndex(A_lower);
      expect(A_raised.t).toBeCloseTo(A.t, 10);
      expect(A_raised.x).toBeCloseTo(A.x, 10);
    });

    it('should correctly identify timelike vectors', () => {
      // Four-velocity is always timelike with |u|² = -c²
      const u: FourVector = { t: 1, x: 0.1, y: 0, z: 0 };
      expect(metric.isTimelike(u)).toBe(true);
    });

    it('should correctly identify spacelike vectors', () => {
      const s: FourVector = { t: 0, x: 1, y: 1, z: 1 };
      expect(metric.isSpacelike(s)).toBe(true);
    });

    it('should have valid hash', () => {
      expect(metric.getHash()).toHaveLength(64);
    });
  });

  describe('LorentzTransform', () => {
    it('should create identity transform for zero velocity', () => {
      const L = new LorentzTransform({ beta: [0, 0, 0] });
      const x: FourVector = { t: 1, x: 2, y: 3, z: 4 };
      const xPrime = L.transform(x);
      
      expect(xPrime.t).toBeCloseTo(1, 10);
      expect(xPrime.x).toBeCloseTo(2, 10);
      expect(xPrime.y).toBeCloseTo(3, 10);
      expect(xPrime.z).toBeCloseTo(4, 10);
    });

    it('should compute correct Lorentz factor', () => {
      const L = LorentzTransform.boostX(0.6);
      // γ = 1/√(1-0.36) = 1/√0.64 = 1/0.8 = 1.25
      expect(L.getGamma()).toBeCloseTo(1.25, 10);
    });

    it('should transform x-boost correctly', () => {
      const beta = 0.6;
      const gamma = 1.25;
      const L = LorentzTransform.boostX(beta);
      
      // Event at (t=1, x=0) in rest frame
      const x: FourVector = { t: 1, x: 0, y: 0, z: 0 };
      const xPrime = L.transform(x);
      
      // t' = γ(t - βx/c) = γt for x=0
      // x' = γ(x - βct) = -γβct for x=0
      expect(xPrime.t).toBeCloseTo(gamma, 10);
      expect(xPrime.x).toBeCloseTo(-gamma * beta * c, 5);
    });

    it('should preserve spacetime interval', () => {
      const L = LorentzTransform.boostX(0.8);
      const metric = new MinkowskiMetric();
      
      const dx: FourVector = { t: 2, x: 1, y: 0.5, z: 0.3 };
      const dxPrime = L.transform(dx);
      
      const ds2 = metric.computeInterval(dx).ds_squared;
      const ds2Prime = metric.computeInterval(dxPrime).ds_squared;
      
      // Check relative error is small (floating point precision)
      const relError = Math.abs((ds2Prime - ds2) / ds2);
      expect(relError).toBeLessThan(1e-10);
    });

    it('should have inverse that undoes transformation', () => {
      const L = LorentzTransform.boostX(0.5);
      const Linv = L.inverse();
      
      const x: FourVector = { t: 1, x: 2, y: 3, z: 4 };
      const xPrime = L.transform(x);
      const xBack = Linv.transform(xPrime);
      
      expect(xBack.t).toBeCloseTo(x.t, 10);
      expect(xBack.x).toBeCloseTo(x.x, 10);
      expect(xBack.y).toBeCloseTo(x.y, 10);
      expect(xBack.z).toBeCloseTo(x.z, 10);
    });

    it('should compose boosts correctly', () => {
      const L1 = LorentzTransform.boostX(0.3);
      const L2 = LorentzTransform.boostX(0.4);
      const Lcomposed = L1.compose(L2);
      
      const x: FourVector = { t: 1, x: 0, y: 0, z: 0 };
      
      // Apply L1 then L2
      const x1 = L1.transform(x);
      const x12 = L2.transform(x1);
      
      // Apply composed
      const xComp = Lcomposed.transform(x);
      
      expect(xComp.t).toBeCloseTo(x12.t, 8);
      expect(xComp.x).toBeCloseTo(x12.x, 8);
    });

    it('should throw for superluminal speeds', () => {
      expect(() => new LorentzTransform({ beta: [1.1, 0, 0] })).toThrow();
      expect(() => new LorentzTransform({ beta: [0.8, 0.7, 0] })).toThrow(); // |β| > 1
    });

    it('should create boost from velocity', () => {
      const v = 0.5 * c;
      const L = LorentzTransform.fromVelocity([v, 0, 0]);
      expect(L.getBeta()[0]).toBeCloseTo(0.5, 10);
    });

    it('should have valid hash', () => {
      const L = LorentzTransform.boostX(0.5);
      expect(L.getHash()).toHaveLength(64);
    });
  });

  describe('ProperTime', () => {
    let properTime: ProperTime;

    beforeEach(() => {
      properTime = new ProperTime();
    });

    it('should compute proper time from coordinate time', () => {
      const coordTime = 10; // seconds
      const v = 0.6 * c;
      const result = properTime.fromCoordinateTime(coordTime, v);
      
      // γ = 1.25, τ = t/γ = 10/1.25 = 8
      expect(result.gamma).toBeCloseTo(1.25, 10);
      expect(result.properTime).toBeCloseTo(8, 10);
    });

    it('should compute time dilation correctly', () => {
      const tau = 1; // 1 second proper time
      const v = 0.8 * c;
      const result = properTime.timeDilation(tau, v);
      
      // γ = 1/√(1-0.64) = 1/0.6 ≈ 1.667
      // t = γτ ≈ 1.667 seconds
      expect(result.gamma).toBeCloseTo(1 / 0.6, 5);
      expect(result.dilatedTime).toBeCloseTo(1.667, 2);
    });

    it('should compute length contraction correctly', () => {
      const L0 = 10; // 10 meters proper length
      const v = 0.6 * c;
      const result = properTime.lengthContraction(L0, v);
      
      // γ = 1.25, L = L0/γ = 10/1.25 = 8 meters
      expect(result.gamma).toBeCloseTo(1.25, 10);
      expect(result.contractedLength).toBeCloseTo(8, 10);
    });

    it('should compute proper time along worldline', () => {
      // Stationary worldline: just time passing
      const events: FourVector[] = [
        { t: 0, x: 0, y: 0, z: 0 },
        { t: 1, x: 0, y: 0, z: 0 },
        { t: 2, x: 0, y: 0, z: 0 }
      ];
      
      const tau = properTime.alongWorldline(events);
      expect(tau).toBeCloseTo(2, 10);
    });

    it('should throw for superluminal speeds', () => {
      expect(() => properTime.timeDilation(1, 1.1 * c)).toThrow();
      expect(() => properTime.lengthContraction(1, c)).toThrow();
    });

    it('should have valid hash', () => {
      expect(properTime.getHash()).toHaveLength(64);
    });
  });

  describe('FourMomentum', () => {
    it('should compute energy and momentum correctly', () => {
      const m = 1; // 1 kg
      const v = [0.6 * c, 0, 0];
      const p = new FourMomentum(m, v);
      
      const gamma = 1.25;
      
      // E = γmc²
      expect(p.getEnergy()).toBeCloseTo(gamma * m * c * c, 0);
      
      // p = γmv
      expect(p.getMomentum()[0]).toBeCloseTo(gamma * m * 0.6 * c, 0);
    });

    it('should compute invariant mass correctly', () => {
      const m = 2; // 2 kg
      const v = [0.5 * c, 0, 0];
      const p = new FourMomentum(m, v);
      
      // Invariant mass should equal rest mass
      expect(p.invariantMass()).toBeCloseTo(m, 5);
    });

    it('should satisfy E² = (mc²)² + (pc)²', () => {
      const m = 1;
      const v = [0.8 * c, 0, 0];
      const fourP = new FourMomentum(m, v);
      
      const E = fourP.getEnergy();
      const p = fourP.getMomentum();
      const pMag = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
      
      const E2 = E * E;
      const mc2_squared = (m * c * c) * (m * c * c);
      const pc_squared = (pMag * c) * (pMag * c);
      
      expect(E2).toBeCloseTo(mc2_squared + pc_squared, -10);
    });

    it('should have timelike four-momentum', () => {
      const p = new FourMomentum(1, [0.5 * c, 0, 0]);
      const pVec = p.toFourVector();
      const metric = new MinkowskiMetric();
      
      expect(metric.isTimelike(pVec)).toBe(true);
    });

    it('should have valid hash', () => {
      const p = new FourMomentum(1, [0, 0, 0]);
      expect(p.getHash()).toHaveLength(64);
    });
  });

  describe('Relativistic Velocity Addition', () => {
    it('should add collinear velocities correctly', () => {
      // 0.5c + 0.5c ≠ c (special relativity)
      const u = 0.5 * c;
      const v = 0.5 * c;
      const w = relativisticVelocityAddition(u, v);
      
      // w = (0.5 + 0.5)/(1 + 0.25) = 1/1.25 = 0.8c
      expect(w).toBeCloseTo(0.8 * c, 5);
    });

    it('should never exceed speed of light', () => {
      const u = 0.9 * c;
      const v = 0.9 * c;
      const w = relativisticVelocityAddition(u, v);
      
      expect(w).toBeLessThan(c);
    });

    it('should give c when adding c to any velocity', () => {
      const u = c;
      const v = 0.5 * c;
      const w = relativisticVelocityAddition(u, v);
      
      expect(w).toBeCloseTo(c, 10);
    });

    it('should reduce to Galilean addition at low speeds', () => {
      const u = 10; // m/s
      const v = 20; // m/s
      const w = relativisticVelocityAddition(u, v);
      
      // At low speeds, w ≈ u + v
      expect(w).toBeCloseTo(30, 5);
    });
  });

  describe('Rapidity', () => {
    it('should compute rapidity correctly', () => {
      const v = 0.5 * c;
      const phi = rapidity(v);
      
      // φ = arctanh(0.5) ≈ 0.5493
      expect(phi).toBeCloseTo(Math.atanh(0.5), 10);
    });

    it('should convert rapidity back to velocity', () => {
      const v_original = 0.7 * c;
      const phi = rapidity(v_original);
      const v_back = velocityFromRapidity(phi);
      
      expect(v_back).toBeCloseTo(v_original, 5);
    });

    it('should add linearly for collinear boosts', () => {
      // Rapidity adds linearly: φ_total = φ_1 + φ_2
      const v1 = 0.3 * c;
      const v2 = 0.4 * c;
      
      const phi1 = rapidity(v1);
      const phi2 = rapidity(v2);
      const phiTotal = phi1 + phi2;
      
      // Compute the combined velocity
      const vTotal = velocityFromRapidity(phiTotal);
      
      // Compare with relativistic addition
      const vRelativistic = relativisticVelocityAddition(v1, v2);
      
      expect(vTotal).toBeCloseTo(vRelativistic, 5);
    });
  });

  describe('Lorentz Factor', () => {
    it('should compute γ correctly', () => {
      expect(lorentzFactor(0)).toBeCloseTo(1, 10);
      expect(lorentzFactor(0.6 * c)).toBeCloseTo(1.25, 10);
      expect(lorentzFactor(0.8 * c)).toBeCloseTo(1 / 0.6, 5);
    });

    it('should approach infinity as v approaches c', () => {
      const gamma = lorentzFactor(0.99 * c);
      expect(gamma).toBeGreaterThan(7);
    });

    it('should throw for v >= c', () => {
      expect(() => lorentzFactor(c)).toThrow();
      expect(() => lorentzFactor(1.1 * c)).toThrow();
    });
  });

  describe('Special Relativity Consistency', () => {
    it('should have consistent time dilation and length contraction', () => {
      const v = 0.6 * c;
      const gamma = lorentzFactor(v);
      
      const properTime = new ProperTime();
      const tdResult = properTime.timeDilation(1, v);
      const lcResult = properTime.lengthContraction(1, v);
      
      // Time dilation: t = γτ
      expect(tdResult.dilatedTime).toBeCloseTo(gamma, 10);
      
      // Length contraction: L = L₀/γ
      expect(lcResult.contractedLength).toBeCloseTo(1 / gamma, 10);
    });

    it('should preserve the spacetime interval under boosts', () => {
      const metric = new MinkowskiMetric();
      const L = LorentzTransform.boostX(0.9);
      
      // Create an event with small values to avoid precision issues
      const event: FourVector = { t: 5e-8, x: 3, y: 2, z: 1 };
      const eventPrime = L.transform(event);
      
      const ds2 = metric.normSquared(event);
      const ds2Prime = metric.normSquared(eventPrime);
      
      // Check relative difference is small
      const relError = Math.abs((ds2Prime - ds2) / ds2);
      expect(relError).toBeLessThan(1e-10);
    });

    it('should satisfy the twin paradox scenario', () => {
      const properTime = new ProperTime();
      
      // Twin A stays on Earth
      // Twin B travels at 0.8c for 5 years (Earth time) out, then back
      const v = 0.8 * c;
      const earthTime = 10; // Total Earth time (5 years out + 5 years back)
      
      const result = properTime.fromCoordinateTime(earthTime, v);
      
      // Twin B ages less
      expect(result.properTime).toBeLessThan(earthTime);
      
      // With γ ≈ 1.667, τ ≈ 6 years
      expect(result.properTime).toBeCloseTo(6, 0);
    });
  });
});
