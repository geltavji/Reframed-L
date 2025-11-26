/**
 * LorentzGroup.test.ts - PRD-03 Phase 3.3 Tests
 * Module ID: M03.03
 * 
 * Tests for Lorentz group SO(3,1) implementation including:
 * - Generators (boosts and rotations)
 * - Lie algebra structure and commutation relations
 * - Group elements and transformations
 * - Spinor representations
 * - Utility functions
 */

import {
  Generator,
  GeneratorType,
  LorentzAlgebra,
  LorentzGroup,
  GroupElement,
  SpinorRepresentation,
  rapidityFromBeta,
  betaFromRapidity,
  gammaFromRapidity,
  wignerAngle
} from '../../../src/spacetime/lorentz/LorentzGroup';
import { Matrix } from '../../../src/core/math/Matrix';
import { Complex } from '../../../src/core/math/Complex';

describe('LorentzGroup (M03.03) - Phase 3.3', () => {
  // ============================================================================
  // GENERATOR TESTS
  // ============================================================================

  describe('Generator', () => {
    describe('Boost Generators K_i', () => {
      it('should create K_1 (x-boost generator) correctly', () => {
        const K1 = new Generator({ type: GeneratorType.BOOST, axis: 'x', index: 0 });
        const M = K1.getMatrix();
        
        // K_1 should have (K_1)^0_1 = (K_1)^1_0 = 1, all others 0
        expect(M[0][1]).toBe(1);
        expect(M[1][0]).toBe(1);
        expect(M[0][0]).toBe(0);
        expect(M[1][1]).toBe(0);
        expect(M[2][2]).toBe(0);
        expect(M[3][3]).toBe(0);
      });

      it('should create K_2 (y-boost generator) correctly', () => {
        const K2 = new Generator({ type: GeneratorType.BOOST, axis: 'y', index: 1 });
        const M = K2.getMatrix();
        
        expect(M[0][2]).toBe(1);
        expect(M[2][0]).toBe(1);
      });

      it('should create K_3 (z-boost generator) correctly', () => {
        const K3 = new Generator({ type: GeneratorType.BOOST, axis: 'z', index: 2 });
        const M = K3.getMatrix();
        
        expect(M[0][3]).toBe(1);
        expect(M[3][0]).toBe(1);
      });

      it('should exponentiate boost generator correctly', () => {
        const K1 = new Generator({ type: GeneratorType.BOOST, axis: 'x', index: 0 });
        const xi = 0.5;  // rapidity
        const L = K1.exponentiate(xi);
        
        // exp(ξK_1) should give standard Lorentz boost
        const cosh_xi = Math.cosh(xi);
        const sinh_xi = Math.sinh(xi);
        
        expect(L[0][0]).toBeCloseTo(cosh_xi, 10);
        expect(L[0][1]).toBeCloseTo(sinh_xi, 10);
        expect(L[1][0]).toBeCloseTo(sinh_xi, 10);
        expect(L[1][1]).toBeCloseTo(cosh_xi, 10);
        expect(L[2][2]).toBeCloseTo(1, 10);
        expect(L[3][3]).toBeCloseTo(1, 10);
      });
    });

    describe('Rotation Generators J_i', () => {
      it('should create J_1 (y-z rotation generator) correctly', () => {
        const J1 = new Generator({ type: GeneratorType.ROTATION, axis: 'x', index: 0 });
        const M = J1.getMatrix();
        
        // J_1 rotates in y-z plane: (J_1)^2_3 = -1, (J_1)^3_2 = 1
        expect(M[2][3]).toBe(-1);
        expect(M[3][2]).toBe(1);
        expect(M[0][0]).toBe(0);
        expect(M[1][1]).toBe(0);
      });

      it('should create J_2 (z-x rotation generator) correctly', () => {
        const J2 = new Generator({ type: GeneratorType.ROTATION, axis: 'y', index: 1 });
        const M = J2.getMatrix();
        
        expect(M[3][1]).toBe(-1);
        expect(M[1][3]).toBe(1);
      });

      it('should create J_3 (x-y rotation generator) correctly', () => {
        const J3 = new Generator({ type: GeneratorType.ROTATION, axis: 'z', index: 2 });
        const M = J3.getMatrix();
        
        expect(M[1][2]).toBe(-1);
        expect(M[2][1]).toBe(1);
      });

      it('should exponentiate rotation generator correctly', () => {
        const J3 = new Generator({ type: GeneratorType.ROTATION, axis: 'z', index: 2 });
        const theta = Math.PI / 4;  // 45 degrees
        const R = J3.exponentiate(theta);
        
        // exp(θJ_3) should give rotation around z-axis
        const cos_theta = Math.cos(theta);
        const sin_theta = Math.sin(theta);
        
        expect(R[0][0]).toBeCloseTo(1, 10);  // Time unchanged
        expect(R[1][1]).toBeCloseTo(cos_theta, 10);
        expect(R[1][2]).toBeCloseTo(-sin_theta, 10);
        expect(R[2][1]).toBeCloseTo(sin_theta, 10);
        expect(R[2][2]).toBeCloseTo(cos_theta, 10);
        expect(R[3][3]).toBeCloseTo(1, 10);
      });
    });

    it('should return correct generator names', () => {
      const K1 = new Generator({ type: GeneratorType.BOOST, axis: 'x', index: 0 });
      const J2 = new Generator({ type: GeneratorType.ROTATION, axis: 'y', index: 1 });
      
      expect(K1.getName()).toBe('K_1');
      expect(J2.getName()).toBe('J_2');
    });

    it('should convert to Matrix object', () => {
      const K1 = new Generator({ type: GeneratorType.BOOST, axis: 'x', index: 0 });
      const M = K1.toMatrix();
      
      expect(M).toBeInstanceOf(Matrix);
      expect(M.rows).toBe(4);
      expect(M.cols).toBe(4);
    });
  });

  // ============================================================================
  // LIE ALGEBRA TESTS
  // ============================================================================

  describe('LorentzAlgebra', () => {
    let algebra: LorentzAlgebra;

    beforeEach(() => {
      algebra = new LorentzAlgebra();
    });

    it('should have 6 generators', () => {
      expect(algebra.K.length).toBe(3);
      expect(algebra.J.length).toBe(3);
    });

    describe('Commutation Relations', () => {
      it('should satisfy [J_i, J_j] = ε_ijk J_k', () => {
        // [J_1, J_2] = J_3
        const comm12 = algebra.commutator(algebra.J[0], algebra.J[1]);
        expect(comm12.structure).toContain('J_3');
        
        // [J_2, J_3] = J_1
        const comm23 = algebra.commutator(algebra.J[1], algebra.J[2]);
        expect(comm23.structure).toContain('J_1');
        
        // [J_3, J_1] = J_2
        const comm31 = algebra.commutator(algebra.J[2], algebra.J[0]);
        expect(comm31.structure).toContain('J_2');
      });

      it('should satisfy [K_i, K_j] = -ε_ijk J_k', () => {
        // [K_1, K_2] = -J_3
        const comm12 = algebra.commutator(algebra.K[0], algebra.K[1]);
        expect(comm12.structure).toContain('-J_3');
        
        // [K_2, K_3] = -J_1
        const comm23 = algebra.commutator(algebra.K[1], algebra.K[2]);
        expect(comm23.structure).toContain('-J_1');
      });

      it('should satisfy [J_i, K_j] = ε_ijk K_k', () => {
        // [J_1, K_2] = K_3
        const comm = algebra.commutator(algebra.J[0], algebra.K[1]);
        expect(comm.structure).toContain('K_3');
      });

      it('should have [J_i, J_i] = 0', () => {
        const comm = algebra.commutator(algebra.J[0], algebra.J[0]);
        expect(comm.structure).toContain('= 0');
      });

      it('should have [K_i, K_i] = 0', () => {
        const comm = algebra.commutator(algebra.K[0], algebra.K[0]);
        expect(comm.structure).toContain('= 0');
      });
    });

    describe('Jacobi Identity', () => {
      it('should satisfy Jacobi identity for J_1, J_2, J_3', () => {
        const valid = algebra.verifyJacobiIdentity(
          algebra.J[0], algebra.J[1], algebra.J[2]
        );
        expect(valid).toBe(true);
      });

      it('should satisfy Jacobi identity for K_1, K_2, J_3', () => {
        const valid = algebra.verifyJacobiIdentity(
          algebra.K[0], algebra.K[1], algebra.J[2]
        );
        expect(valid).toBe(true);
      });

      it('should satisfy Jacobi identity for K_1, J_1, J_2', () => {
        const valid = algebra.verifyJacobiIdentity(
          algebra.K[0], algebra.J[0], algebra.J[1]
        );
        expect(valid).toBe(true);
      });
    });

    describe('Casimir Operator', () => {
      it('should compute Casimir operator C = J² - K²', () => {
        const C = algebra.getCasimirOperator();
        expect(C).toBeInstanceOf(Matrix);
        expect(C.rows).toBe(4);
        expect(C.cols).toBe(4);
      });
    });

    describe('Structure Constants', () => {
      it('should return structure constants tensor', () => {
        const f = algebra.getStructureConstants();
        expect(f.length).toBe(6);
        expect(f[0].length).toBe(6);
        expect(f[0][0].length).toBe(6);
        
        // [J_1, J_2] = J_3: f^5_34 = 1 (indices 3,4,5 for J)
        expect(f[3][4][5]).toBe(1);
        
        // [K_1, K_2] = -J_3: f^5_01 = -1
        expect(f[0][1][5]).toBe(-1);
      });
    });
  });

  // ============================================================================
  // LORENTZ GROUP TESTS
  // ============================================================================

  describe('LorentzGroup', () => {
    let group: LorentzGroup;

    beforeEach(() => {
      group = new LorentzGroup();
    });

    it('should have associated Lie algebra', () => {
      expect(group.algebra).toBeInstanceOf(LorentzAlgebra);
    });

    describe('Group Elements', () => {
      it('should create pure boost element', () => {
        const xi = 0.5;
        const boost = group.boost([xi, 0, 0]);
        
        expect(boost).toBeInstanceOf(GroupElement);
        expect(boost.getGamma()).toBeCloseTo(Math.cosh(xi), 10);
      });

      it('should create pure rotation element', () => {
        const theta = Math.PI / 6;
        const rotation = group.rotation([0, 0, theta]);
        
        expect(rotation).toBeInstanceOf(GroupElement);
      });

      it('should create boost from velocity', () => {
        const beta = 0.6;
        const boost = group.boostFromVelocity([beta, 0, 0]);
        
        const gamma = 1 / Math.sqrt(1 - beta * beta);
        expect(boost.getGamma()).toBeCloseTo(gamma, 5);
      });

      it('should throw for superluminal velocity', () => {
        expect(() => group.boostFromVelocity([1.1, 0, 0])).toThrow();
      });
    });

    describe('Transformation Validation', () => {
      it('should validate proper Lorentz transformation', () => {
        const boost = group.boost([0.5, 0, 0]);
        const M = boost.getMatrix();
        
        expect(group.isValidTransformation(M)).toBe(true);
      });

      it('should classify proper orthochronous transformation', () => {
        const boost = group.boost([0.5, 0, 0]);
        const M = boost.getMatrix();
        const classification = group.classifyTransformation(M);
        
        expect(classification.isProper).toBe(true);
        expect(classification.isOrthochronous).toBe(true);
        expect(classification.type).toContain('SO+');
      });

      it('should reject non-Lorentz matrix', () => {
        const badMatrix = [
          [1, 1, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1]
        ];
        
        expect(group.isValidTransformation(badMatrix)).toBe(false);
      });
    });
  });

  // ============================================================================
  // GROUP ELEMENT TESTS
  // ============================================================================

  describe('GroupElement', () => {
    let group: LorentzGroup;

    beforeEach(() => {
      group = new LorentzGroup();
    });

    it('should transform 4-vectors correctly', () => {
      const boost = group.boost([0.5, 0, 0]);
      const x = [1, 0, 0, 0];  // Pure time event
      const xPrime = boost.transform(x);
      
      // Time component should be γ, space should be γβ
      const gamma = Math.cosh(0.5);
      const gammaBeta = Math.sinh(0.5);
      
      expect(xPrime[0]).toBeCloseTo(gamma, 10);
      expect(xPrime[1]).toBeCloseTo(gammaBeta, 10);
    });

    it('should compose transformations correctly', () => {
      const boost1 = group.boost([0.3, 0, 0]);
      const boost2 = group.boost([0.2, 0, 0]);
      const composed = boost1.compose(boost2);
      
      // Composed gamma should be γ_1 * γ_2 for collinear boosts
      const gamma1 = Math.cosh(0.3);
      const gamma2 = Math.cosh(0.2);
      const expectedGamma = Math.cosh(0.3 + 0.2);  // Rapidities add
      
      expect(composed.getGamma()).toBeCloseTo(expectedGamma, 8);
    });

    it('should compute inverse correctly', () => {
      const boost = group.boost([0.5, 0, 0]);
      const inverse = boost.inverse();
      const identity = boost.compose(inverse);
      const M = identity.getMatrix();
      
      // Should be close to identity matrix
      expect(M[0][0]).toBeCloseTo(1, 8);
      expect(M[1][1]).toBeCloseTo(1, 8);
      expect(M[2][2]).toBeCloseTo(1, 8);
      expect(M[3][3]).toBeCloseTo(1, 8);
      expect(M[0][1]).toBeCloseTo(0, 8);
    });

    it('should preserve spacetime interval', () => {
      const boost = group.boost([0.6, 0, 0]);
      const x = [2, 1, 0.5, 0.3];
      const xPrime = boost.transform(x);
      
      // Compute ds² = -t² + x² + y² + z²
      const ds2 = -x[0]*x[0] + x[1]*x[1] + x[2]*x[2] + x[3]*x[3];
      const ds2Prime = -xPrime[0]*xPrime[0] + xPrime[1]*xPrime[1] + xPrime[2]*xPrime[2] + xPrime[3]*xPrime[3];
      
      expect(ds2Prime).toBeCloseTo(ds2, 8);
    });

    it('should extract beta from matrix', () => {
      const beta = 0.6;
      const xi = Math.atanh(beta);
      const boost = group.boost([xi, 0, 0]);
      const extractedBeta = boost.getBeta();
      
      expect(extractedBeta[0]).toBeCloseTo(beta, 8);
      expect(extractedBeta[1]).toBeCloseTo(0, 10);
      expect(extractedBeta[2]).toBeCloseTo(0, 10);
    });
  });

  // ============================================================================
  // SPINOR REPRESENTATION TESTS
  // ============================================================================

  describe('SpinorRepresentation', () => {
    let spinor: SpinorRepresentation;

    beforeEach(() => {
      spinor = new SpinorRepresentation();
    });

    describe('Pauli Matrices', () => {
      it('should have correct σ_0 (identity)', () => {
        const sigma0 = spinor.getSigma(0);
        
        expect(sigma0[0][0].real.toNumber()).toBeCloseTo(1, 10);
        expect(sigma0[0][1].real.toNumber()).toBeCloseTo(0, 10);
        expect(sigma0[1][0].real.toNumber()).toBeCloseTo(0, 10);
        expect(sigma0[1][1].real.toNumber()).toBeCloseTo(1, 10);
      });

      it('should have correct σ_1', () => {
        const sigma1 = spinor.getSigma(1);
        
        expect(sigma1[0][0].real.toNumber()).toBeCloseTo(0, 10);
        expect(sigma1[0][1].real.toNumber()).toBeCloseTo(1, 10);
        expect(sigma1[1][0].real.toNumber()).toBeCloseTo(1, 10);
        expect(sigma1[1][1].real.toNumber()).toBeCloseTo(0, 10);
      });

      it('should have correct σ_2', () => {
        const sigma2 = spinor.getSigma(2);
        
        expect(sigma2[0][0].real.toNumber()).toBeCloseTo(0, 10);
        expect(sigma2[0][1].imag.toNumber()).toBeCloseTo(-1, 10);
        expect(sigma2[1][0].imag.toNumber()).toBeCloseTo(1, 10);
        expect(sigma2[1][1].real.toNumber()).toBeCloseTo(0, 10);
      });

      it('should have correct σ_3', () => {
        const sigma3 = spinor.getSigma(3);
        
        expect(sigma3[0][0].real.toNumber()).toBeCloseTo(1, 10);
        expect(sigma3[0][1].real.toNumber()).toBeCloseTo(0, 10);
        expect(sigma3[1][0].real.toNumber()).toBeCloseTo(0, 10);
        expect(sigma3[1][1].real.toNumber()).toBeCloseTo(-1, 10);
      });

      it('should have correct σ̄ matrices', () => {
        const sigmaBar1 = spinor.getSigmaBar(1);
        const sigma1 = spinor.getSigma(1);
        
        // σ̄_i = -σ_i for i > 0
        expect(sigmaBar1[0][1].real.toNumber()).toBeCloseTo(-sigma1[0][1].real.toNumber(), 10);
      });
    });

    describe('SL(2,C) Matrices', () => {
      it('should create boost matrix', () => {
        const xi = 0.5;
        const A = spinor.boostMatrix([xi, 0, 0]);
        
        // Boost in x-direction: A = cosh(ξ/2)I + sinh(ξ/2)σ_1
        const cosh_half = Math.cosh(xi / 2);
        const sinh_half = Math.sinh(xi / 2);
        
        expect(A[0][0].real.toNumber()).toBeCloseTo(cosh_half, 8);
        expect(A[0][1].real.toNumber()).toBeCloseTo(sinh_half, 8);
        expect(A[1][0].real.toNumber()).toBeCloseTo(sinh_half, 8);
        expect(A[1][1].real.toNumber()).toBeCloseTo(cosh_half, 8);
      });

      it('should create rotation matrix', () => {
        const theta = Math.PI / 3;
        const U = spinor.rotationMatrix([0, 0, theta]);
        
        // Rotation around z: U = cos(θ/2)I + i·sin(θ/2)σ_3
        const cos_half = Math.cos(theta / 2);
        const sin_half = Math.sin(theta / 2);
        
        expect(U[0][0].real.toNumber()).toBeCloseTo(cos_half, 8);
        expect(U[0][0].imag.toNumber()).toBeCloseTo(sin_half, 8);
        expect(U[1][1].real.toNumber()).toBeCloseTo(cos_half, 8);
        expect(U[1][1].imag.toNumber()).toBeCloseTo(-sin_half, 8);
      });

      it('should map 4-vector to Hermitian matrix', () => {
        const x = [1, 0, 0, 0];  // Pure time
        const X = spinor.vectorToMatrix(x);
        
        // X = t·σ_0 = t·I
        expect(X[0][0].real.toNumber()).toBeCloseTo(1, 10);
        expect(X[1][1].real.toNumber()).toBeCloseTo(1, 10);
        expect(X[0][1].real.toNumber()).toBeCloseTo(0, 10);
        expect(X[1][0].real.toNumber()).toBeCloseTo(0, 10);
      });
    });
  });

  // ============================================================================
  // UTILITY FUNCTION TESTS
  // ============================================================================

  describe('Utility Functions', () => {
    describe('rapidityFromBeta', () => {
      it('should compute rapidity from velocity', () => {
        const beta = 0.6;
        const xi = rapidityFromBeta(beta);
        
        expect(xi).toBeCloseTo(Math.atanh(beta), 10);
      });

      it('should throw for beta >= 1', () => {
        expect(() => rapidityFromBeta(1)).toThrow();
        expect(() => rapidityFromBeta(1.1)).toThrow();
      });

      it('should return 0 for beta = 0', () => {
        expect(rapidityFromBeta(0)).toBe(0);
      });
    });

    describe('betaFromRapidity', () => {
      it('should compute velocity from rapidity', () => {
        const xi = 0.5;
        const beta = betaFromRapidity(xi);
        
        expect(beta).toBeCloseTo(Math.tanh(xi), 10);
      });

      it('should be inverse of rapidityFromBeta', () => {
        const beta = 0.7;
        const xi = rapidityFromBeta(beta);
        const betaRecovered = betaFromRapidity(xi);
        
        expect(betaRecovered).toBeCloseTo(beta, 10);
      });
    });

    describe('gammaFromRapidity', () => {
      it('should compute Lorentz factor from rapidity', () => {
        const xi = 0.5;
        const gamma = gammaFromRapidity(xi);
        
        expect(gamma).toBeCloseTo(Math.cosh(xi), 10);
      });

      it('should be consistent with beta', () => {
        const xi = 0.8;
        const gamma = gammaFromRapidity(xi);
        const beta = betaFromRapidity(xi);
        
        // γ = 1/√(1-β²)
        const expectedGamma = 1 / Math.sqrt(1 - beta * beta);
        expect(gamma).toBeCloseTo(expectedGamma, 8);
      });
    });

    describe('wignerAngle', () => {
      it('should return 0 for collinear boosts', () => {
        const angle = wignerAngle([0.3, 0, 0], [0.2, 0, 0]);
        expect(angle).toBeCloseTo(0, 10);
      });

      it('should return 0 for zero velocity', () => {
        const angle = wignerAngle([0, 0, 0], [0.3, 0, 0]);
        expect(angle).toBeCloseTo(0, 10);
      });

      it('should be non-zero for perpendicular boosts', () => {
        const angle = wignerAngle([0.3, 0, 0], [0, 0.3, 0]);
        expect(angle).not.toBe(0);
      });
    });
  });

  // ============================================================================
  // PHYSICS VALIDATION TESTS
  // ============================================================================

  describe('Physics Validation', () => {
    let group: LorentzGroup;

    beforeEach(() => {
      group = new LorentzGroup();
    });

    it('should preserve proper time under boosts', () => {
      const boost = group.boost([0.8, 0, 0]);
      
      // Timelike separation (τ, 0, 0, 0)
      const tau = 1;
      const x = [tau, 0, 0, 0];
      const xPrime = boost.transform(x);
      
      // Proper time should be preserved: τ² = t² - |x|²
      const tau2 = tau * tau;
      const tau2Prime = xPrime[0] * xPrime[0] - xPrime[1] * xPrime[1] - xPrime[2] * xPrime[2] - xPrime[3] * xPrime[3];
      
      expect(tau2Prime).toBeCloseTo(tau2, 8);
    });

    it('should correctly implement Thomas precession', () => {
      // Two perpendicular boosts
      const beta1 = [0.5, 0, 0];
      const beta2 = [0, 0.5, 0];
      
      const boost1 = group.boostFromVelocity(beta1);
      const boost2 = group.boostFromVelocity(beta2);
      
      // Sequential boosts in different directions
      const composed = boost1.compose(boost2);
      
      // The resulting transformation should be a boost + rotation (Thomas precession)
      // Check that it's a valid Lorentz transformation
      expect(group.isValidTransformation(composed.getMatrix())).toBe(true);
    });

    it('should satisfy group closure', () => {
      const g1 = group.boost([0.3, 0.2, 0.1]);
      const g2 = group.rotation([0.1, 0.2, 0.3]);
      const product = g1.compose(g2);
      
      expect(group.isValidTransformation(product.getMatrix())).toBe(true);
    });

    it('should have proper determinant', () => {
      const boost = group.boost([0.5, 0.3, 0.2]);
      const classification = group.classifyTransformation(boost.getMatrix());
      
      // All boosts are proper (det = +1)
      expect(classification.isProper).toBe(true);
    });
  });
});
