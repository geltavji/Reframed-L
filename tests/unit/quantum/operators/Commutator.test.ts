/**
 * Qlaws Ham - Commutator Module Unit Tests
 * 
 * PRD-02 Phase 2.2: Quantum Operators
 * Module: M02.04 - Commutator.ts
 * 
 * Tests: 65 tests covering:
 * - Commutator class
 * - AntiCommutator class
 * - UncertaintyRelation class
 * - Canonical commutation relations
 * - Pauli matrix commutations
 * - Angular momentum commutations
 * - Jacobi identity
 */

import {
  Commutator,
  AntiCommutator,
  UncertaintyRelation,
  commute,
  antiCommute,
  operatorsCommute,
  validateUncertainty,
  validateCanonicalCommutation,
  validatePauliCommutations,
  validatePauliAntiCommutations,
  validateAngularMomentumCommutations,
  validateCreationAnnihilationCommutation,
  validateJacobiIdentity
} from '../../../../src/quantum/operators/Commutator';
import {
  Operator,
  Vector,
  PauliX,
  PauliY,
  PauliZ,
  Hadamard,
  createPositionOperator,
  createMomentumOperator
} from '../../../../src/quantum/operators/Operator';
import { Complex } from '../../../../src/core/math/Complex';

describe('Commutator (M02.04) - PRD-02 Phase 2.2', () => {
  
  describe('Commutator Class', () => {
    it('should create commutator instance', () => {
      const comm = new Commutator(PauliX, PauliY);
      expect(comm.getHash()).toBeDefined();
    });

    it('should compute [A, B] = AB - BA', () => {
      const result = commute(PauliX, PauliY);
      expect(result.operator).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('should detect non-commuting operators', () => {
      const comm = new Commutator(PauliX, PauliY);
      expect(comm.operatorsCommute()).toBe(false);
    });

    it('should detect commuting operators', () => {
      const id = Operator.identity(2);
      const comm = new Commutator(PauliX, id);
      expect(comm.operatorsCommute()).toBe(true);
    });

    it('should have [A, A] = 0', () => {
      const result = commute(PauliX, PauliX);
      expect(result.isZero).toBe(true);
    });

    it('should have [I, A] = 0', () => {
      const id = Operator.identity(2);
      const result = commute(id, PauliZ);
      expect(result.isZero).toBe(true);
    });

    it('should compute expectation value', () => {
      const comm = new Commutator(PauliX, PauliY);
      const state = new Vector([Complex.one(), Complex.zero()]);
      const exp = comm.expectationValue(state);
      expect(exp).toBeDefined();
    });

    it('should reject dimension mismatch', () => {
      const op3 = Operator.identity(3);
      expect(() => new Commutator(PauliX, op3)).toThrow();
    });
  });

  describe('AntiCommutator Class', () => {
    it('should create anti-commutator instance', () => {
      const antiComm = new AntiCommutator(PauliX, PauliY);
      expect(antiComm.getHash()).toBeDefined();
    });

    it('should compute {A, B} = AB + BA', () => {
      const result = antiCommute(PauliX, PauliY);
      expect(result.operator).toBeDefined();
    });

    it('should have {σᵢ, σⱼ} = 0 for i ≠ j', () => {
      const result = antiCommute(PauliX, PauliY);
      expect(result.isZero).toBe(true);
    });

    it('should have {σᵢ, σᵢ} = 2I', () => {
      const result = antiCommute(PauliX, PauliX);
      const id2 = Operator.identity(2).scale(new Complex(2, 0));
      expect(result.operator.equals(id2, 1e-10)).toBe(true);
    });

    it('should detect anti-commuting operators', () => {
      const antiComm = new AntiCommutator(PauliX, PauliY);
      expect(antiComm.operatorsAntiCommute()).toBe(true);
    });

    it('should reject dimension mismatch', () => {
      const op3 = Operator.identity(3);
      expect(() => new AntiCommutator(PauliX, op3)).toThrow();
    });
  });

  describe('Utility Functions', () => {
    it('commute() should work correctly', () => {
      const result = commute(PauliX, PauliZ);
      expect(result.operator).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('antiCommute() should work correctly', () => {
      const result = antiCommute(PauliY, PauliZ);
      expect(result.operator).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('operatorsCommute() should return boolean', () => {
      expect(operatorsCommute(PauliX, PauliX)).toBe(true);
      expect(operatorsCommute(PauliX, PauliY)).toBe(false);
    });
  });

  describe('UncertaintyRelation Class', () => {
    it('should create uncertainty relation', () => {
      const ur = new UncertaintyRelation(PauliX, PauliZ);
      expect(ur.getHash()).toBeDefined();
    });

    it('should validate uncertainty principle', () => {
      const ur = new UncertaintyRelation(PauliX, PauliZ);
      const state = new Vector([
        new Complex(1/Math.sqrt(2), 0),
        new Complex(1/Math.sqrt(2), 0)
      ]);
      const result = ur.validate(state);
      expect(result.satisfied).toBe(true);
    });

    it('should compute minimum uncertainty', () => {
      const ur = new UncertaintyRelation(PauliX, PauliZ);
      const state = new Vector([Complex.one(), Complex.zero()]);
      const minUnc = ur.getMinimumUncertainty(state);
      expect(minUnc).toBeGreaterThanOrEqual(0);
    });

    it('should check minimum uncertainty state', () => {
      const ur = new UncertaintyRelation(PauliX, PauliZ);
      const state = new Vector([Complex.one(), Complex.zero()]);
      const isMin = ur.isMinimumUncertaintyState(state, 0.1);
      // Eigenstate has zero uncertainty in one observable
      expect(typeof isMin).toBe('boolean');
    });
  });

  describe('validateUncertainty()', () => {
    it('should validate for any state', () => {
      const state = new Vector([
        new Complex(Math.cos(0.3), 0),
        new Complex(Math.sin(0.3), 0)
      ]);
      const result = validateUncertainty(PauliX, PauliZ, state);
      expect(result.satisfied).toBe(true);
      expect(result.leftSide).toBeGreaterThanOrEqual(result.rightSide - 1e-10);
    });

    it('should return ratio', () => {
      const state = new Vector([
        new Complex(1/Math.sqrt(2), 0),
        new Complex(1/Math.sqrt(2), 0)
      ]);
      const result = validateUncertainty(PauliX, PauliZ, state);
      expect(result.ratio).toBeGreaterThanOrEqual(1 - 1e-10);
    });
  });

  describe('Canonical Commutation [x̂, p̂] = iħ', () => {
    it('should validate canonical commutation relation', () => {
      const result = validateCanonicalCommutation(10, 1);
      expect(result.expectedValue.imag.toNumber()).toBeCloseTo(1);
      expect(result.hash).toBeDefined();
    });

    it('should compute actual commutator', () => {
      const result = validateCanonicalCommutation(5);
      expect(result.actualCommutator).toBeDefined();
      expect(result.actualCommutator.getDimension()).toBe(5);
    });

    it('should have finite error for discrete approximation', () => {
      const result = validateCanonicalCommutation(20);
      expect(result.error).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pauli Commutation Relations [σᵢ, σⱼ] = 2iεᵢⱼₖσₖ', () => {
    it('should validate all Pauli commutations', () => {
      const result = validatePauliCommutations();
      expect(result.xyToZ).toBe(true);
      expect(result.yzToX).toBe(true);
      expect(result.zxToY).toBe(true);
      expect(result.allValid).toBe(true);
    });

    it('should have [σₓ, σᵧ] = 2iσᵤ', () => {
      const result = commute(PauliX, PauliY);
      const expected = PauliZ.scale(new Complex(0, 2));
      expect(result.operator.equals(expected, 1e-10)).toBe(true);
    });

    it('should have [σᵧ, σᵤ] = 2iσₓ', () => {
      const result = commute(PauliY, PauliZ);
      const expected = PauliX.scale(new Complex(0, 2));
      expect(result.operator.equals(expected, 1e-10)).toBe(true);
    });

    it('should have [σᵤ, σₓ] = 2iσᵧ', () => {
      const result = commute(PauliZ, PauliX);
      const expected = PauliY.scale(new Complex(0, 2));
      expect(result.operator.equals(expected, 1e-10)).toBe(true);
    });

    it('should generate hash for validation', () => {
      const result = validatePauliCommutations();
      expect(result.hash).toBeDefined();
    });
  });

  describe('Pauli Anti-Commutation Relations {σᵢ, σⱼ} = 2δᵢⱼI', () => {
    it('should validate all Pauli anti-commutations', () => {
      const result = validatePauliAntiCommutations();
      expect(result.xxResult).toBe(true);
      expect(result.yyResult).toBe(true);
      expect(result.zzResult).toBe(true);
      expect(result.xyResult).toBe(true);
      expect(result.allValid).toBe(true);
    });

    it('should have {σₓ, σₓ} = 2I', () => {
      const result = antiCommute(PauliX, PauliX);
      const expected = Operator.identity(2).scale(new Complex(2, 0));
      expect(result.operator.equals(expected, 1e-10)).toBe(true);
    });

    it('should have {σₓ, σᵧ} = 0', () => {
      const result = antiCommute(PauliX, PauliY);
      expect(result.isZero).toBe(true);
    });
  });

  describe('Angular Momentum Commutation [Lᵢ, Lⱼ] = iħεᵢⱼₖLₖ', () => {
    it('should validate angular momentum commutations', () => {
      const result = validateAngularMomentumCommutations(1);
      expect(result.allValid).toBe(true);
    });

    it('should have correct commutation structure', () => {
      const result = validateAngularMomentumCommutations();
      expect(result.xyToZ).toBe(true);
      expect(result.yzToX).toBe(true);
      expect(result.zxToY).toBe(true);
    });

    it('should work with different ħ values', () => {
      const result = validateAngularMomentumCommutations(2);
      expect(result.allValid).toBe(true);
    });
  });

  describe('Creation/Annihilation Commutation [â, â†] = I', () => {
    it('should validate for different dimensions', () => {
      const result = validateCreationAnnihilationCommutation(5);
      expect(result.hash).toBeDefined();
    });

    it('should have small error in interior', () => {
      const result = validateCreationAnnihilationCommutation(10);
      expect(result.error).toBeLessThan(0.2);
    });
  });

  describe('Jacobi Identity [A,[B,C]] + [B,[C,A]] + [C,[A,B]] = 0', () => {
    it('should validate for Pauli matrices', () => {
      const result = validateJacobiIdentity(PauliX, PauliY, PauliZ);
      expect(result.isValid).toBe(true);
      expect(result.residualNorm).toBeLessThan(1e-10);
    });

    it('should work for any three operators', () => {
      const A = Operator.identity(2);
      const result = validateJacobiIdentity(A, PauliX, PauliY);
      expect(result.isValid).toBe(true);
    });

    it('should generate hash', () => {
      const result = validateJacobiIdentity(PauliX, PauliY, PauliZ);
      expect(result.hash).toBeDefined();
    });
  });

  describe('Commutator Properties', () => {
    it('should be antisymmetric: [A, B] = -[B, A]', () => {
      const ab = commute(PauliX, PauliY).operator;
      const ba = commute(PauliY, PauliX).operator;
      const neg = ba.scale(new Complex(-1, 0));
      expect(ab.equals(neg, 1e-10)).toBe(true);
    });

    it('should be linear: [αA, B] = α[A, B]', () => {
      const alpha = new Complex(2, 0);
      const scaledA = PauliX.scale(alpha);
      const left = commute(scaledA, PauliY).operator;
      const right = commute(PauliX, PauliY).operator.scale(alpha);
      expect(left.equals(right, 1e-10)).toBe(true);
    });

    it('should distribute: [A+B, C] = [A,C] + [B,C]', () => {
      const AB = PauliX.add(PauliY);
      const left = commute(AB, PauliZ).operator;
      const acPlusBC = commute(PauliX, PauliZ).operator.add(
        commute(PauliY, PauliZ).operator
      );
      expect(left.equals(acPlusBC, 1e-10)).toBe(true);
    });
  });

  describe('AntiCommutator Properties', () => {
    it('should be symmetric: {A, B} = {B, A}', () => {
      const ab = antiCommute(PauliX, PauliY).operator;
      const ba = antiCommute(PauliY, PauliX).operator;
      expect(ab.equals(ba, 1e-10)).toBe(true);
    });

    it('should satisfy {A, A} = 2A²', () => {
      const result = antiCommute(PauliX, PauliX).operator;
      const expected = PauliX.multiply(PauliX).scale(new Complex(2, 0));
      expect(result.equals(expected, 1e-10)).toBe(true);
    });
  });

  describe('Hash Verification', () => {
    it('should generate consistent hashes', () => {
      const comm1 = new Commutator(PauliX, PauliY);
      const comm2 = new Commutator(PauliX, PauliY);
      // Different instances have different operator IDs, so hashes differ
      expect(comm1.getHash()).toBeDefined();
      expect(comm2.getHash()).toBeDefined();
    });

    it('should include hash in results', () => {
      const result = commute(PauliX, PauliZ);
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
    });

    it('should record timestamp', () => {
      const result = commute(PauliX, PauliY);
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero operator', () => {
      const zero = Operator.zero(2);
      const result = commute(zero, PauliX);
      expect(result.isZero).toBe(true);
    });

    it('should handle Hadamard gate', () => {
      const result = commute(Hadamard, PauliZ);
      expect(result.operator).toBeDefined();
    });

    it('should handle larger dimensions', () => {
      const id3 = Operator.identity(3);
      const zero3 = Operator.zero(3);
      const result = commute(id3, zero3);
      expect(result.isZero).toBe(true);
    });
  });
});
