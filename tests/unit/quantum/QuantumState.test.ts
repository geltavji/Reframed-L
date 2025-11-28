/**
 * QuantumState.test.ts - Tests for PRD-02 Phase 2.1 QuantumState module
 */

import { StateVector, DensityMatrix, QuantumState } from '../../../src/quantum/state/QuantumState';
import { Complex } from '../../../src/core/math/Complex';

describe('QuantumState (M02.02) - PRD-02 Phase 2.1', () => {
  describe('StateVector', () => {
    describe('Creation and Basic Properties', () => {
      test('should create state vector from components', () => {
        const sv = new StateVector([new Complex(1, 0), new Complex(0, 0)]);
        expect(sv.getDimension()).toBe(2);
      });

      test('should create computational basis state', () => {
        const sv = StateVector.computationalBasis(3, 1);
        expect(sv.getDimension()).toBe(3);
        expect(sv.getComponent(1).magnitude().toNumber()).toBe(1);
        expect(sv.getComponent(0).magnitude().toNumber()).toBe(0);
      });

      test('should create |0⟩ state', () => {
        const sv = StateVector.ket0();
        expect(sv.probability(0)).toBeCloseTo(1, 10);
        expect(sv.probability(1)).toBeCloseTo(0, 10);
      });

      test('should create |1⟩ state', () => {
        const sv = StateVector.ket1();
        expect(sv.probability(0)).toBeCloseTo(0, 10);
        expect(sv.probability(1)).toBeCloseTo(1, 10);
      });

      test('should create |+⟩ state', () => {
        const sv = StateVector.ketPlus();
        expect(sv.isNormalized()).toBe(true);
        expect(sv.probability(0)).toBeCloseTo(0.5, 10);
        expect(sv.probability(1)).toBeCloseTo(0.5, 10);
      });

      test('should create |-⟩ state', () => {
        const sv = StateVector.ketMinus();
        expect(sv.isNormalized()).toBe(true);
        expect(sv.probability(0)).toBeCloseTo(0.5, 10);
      });

      test('should create |+i⟩ state', () => {
        const sv = StateVector.ketPlusI();
        expect(sv.isNormalized()).toBe(true);
      });

      test('should create uniform superposition', () => {
        const sv = StateVector.uniform(4);
        expect(sv.isNormalized()).toBe(true);
        const probs = sv.probabilities();
        probs.forEach(p => expect(p).toBeCloseTo(0.25, 10));
      });

      test('should create random state', () => {
        const sv = StateVector.random(4);
        expect(sv.isNormalized()).toBe(true);
      });
    });

    describe('Norm and Normalization', () => {
      test('should calculate norm', () => {
        const sv = new StateVector([new Complex(3, 0), new Complex(4, 0)]);
        expect(sv.norm()).toBeCloseTo(5, 10);
      });

      test('should detect normalized state', () => {
        const sv = StateVector.ket0();
        expect(sv.isNormalized()).toBe(true);
      });

      test('should detect unnormalized state', () => {
        const sv = new StateVector([new Complex(2, 0), new Complex(0, 0)]);
        expect(sv.isNormalized()).toBe(false);
      });

      test('should normalize state', () => {
        const sv = new StateVector([new Complex(3, 0), new Complex(4, 0)]);
        const normalized = sv.normalize();
        expect(normalized.norm()).toBeCloseTo(1, 10);
      });

      test('should throw error normalizing zero state', () => {
        const sv = new StateVector(2);
        expect(() => sv.normalize()).toThrow();
      });
    });

    describe('State Operations', () => {
      test('should add states', () => {
        const sv1 = StateVector.ket0();
        const sv2 = StateVector.ket1();
        const sum = sv1.add(sv2);
        expect(sum.norm()).toBeCloseTo(Math.sqrt(2), 10);
      });

      test('should subtract states', () => {
        const sv1 = StateVector.ket0();
        const sv2 = StateVector.ket0();
        const diff = sv1.subtract(sv2);
        expect(diff.norm()).toBeCloseTo(0, 10);
      });

      test('should scale state', () => {
        const sv = StateVector.ket0();
        const scaled = sv.scale(2);
        expect(scaled.norm()).toBeCloseTo(2, 10);
      });

      test('should scale by complex number', () => {
        const sv = StateVector.ket0();
        const scaled = sv.scale(new Complex(0, 1));
        expect(scaled.norm()).toBeCloseTo(1, 10);
      });
    });

    describe('Inner Product and Overlap', () => {
      test('should calculate inner product ⟨0|0⟩ = 1', () => {
        const sv = StateVector.ket0();
        const inner = sv.innerProduct(sv);
        expect(inner.real.toNumber()).toBeCloseTo(1, 10);
        expect(inner.imag.toNumber()).toBeCloseTo(0, 10);
      });

      test('should calculate inner product ⟨0|1⟩ = 0', () => {
        const sv0 = StateVector.ket0();
        const sv1 = StateVector.ket1();
        const inner = sv0.innerProduct(sv1);
        expect(inner.magnitude().toNumber()).toBeCloseTo(0, 10);
      });

      test('should calculate overlap probability', () => {
        const sv1 = StateVector.ketPlus();
        const sv2 = StateVector.ket0();
        const overlap = sv1.overlap(sv2);
        expect(overlap).toBeCloseTo(0.5, 10);
      });

      test('should detect orthogonality', () => {
        const sv0 = StateVector.ket0();
        const sv1 = StateVector.ket1();
        expect(sv0.isOrthogonal(sv1)).toBe(true);
      });

      test('should detect non-orthogonality', () => {
        const sv0 = StateVector.ket0();
        const svPlus = StateVector.ketPlus();
        expect(sv0.isOrthogonal(svPlus)).toBe(false);
      });
    });

    describe('Tensor Product', () => {
      test('should compute tensor product |0⟩⊗|0⟩', () => {
        const sv0 = StateVector.ket0();
        const product = sv0.tensorProduct(sv0);
        expect(product.getDimension()).toBe(4);
        expect(product.probability(0)).toBeCloseTo(1, 10); // |00⟩
      });

      test('should compute tensor product |0⟩⊗|1⟩', () => {
        const sv0 = StateVector.ket0();
        const sv1 = StateVector.ket1();
        const product = sv0.tensorProduct(sv1);
        expect(product.probability(1)).toBeCloseTo(1, 10); // |01⟩ is index 1
      });

      test('should maintain normalization in tensor product', () => {
        const sv0 = StateVector.ket0();
        const sv1 = StateVector.ket1();
        const product = sv0.tensorProduct(sv1);
        expect(product.isNormalized()).toBe(true);
      });
    });

    describe('Bloch Sphere', () => {
      test('should get Bloch vector for |0⟩', () => {
        const sv = StateVector.ket0();
        const bloch = sv.toBlochVector();
        expect(bloch.z).toBeCloseTo(1, 10);
        expect(bloch.x).toBeCloseTo(0, 10);
        expect(bloch.y).toBeCloseTo(0, 10);
      });

      test('should get Bloch vector for |1⟩', () => {
        const sv = StateVector.ket1();
        const bloch = sv.toBlochVector();
        expect(bloch.z).toBeCloseTo(-1, 10);
      });

      test('should get Bloch vector for |+⟩', () => {
        const sv = StateVector.ketPlus();
        const bloch = sv.toBlochVector();
        expect(bloch.x).toBeCloseTo(1, 10);
        expect(bloch.z).toBeCloseTo(0, 10);
      });

      test('should create state from Bloch angles', () => {
        const sv = StateVector.fromBlochAngles(0, 0); // Should be |0⟩
        expect(sv.probability(0)).toBeCloseTo(1, 10);
      });

      test('should create state from Bloch angles (equator)', () => {
        const sv = StateVector.fromBlochAngles(Math.PI / 2, 0); // Should be |+⟩
        expect(sv.probability(0)).toBeCloseTo(0.5, 10);
        expect(sv.probability(1)).toBeCloseTo(0.5, 10);
      });

      test('should throw for non-qubit Bloch vector', () => {
        const sv = StateVector.uniform(3);
        expect(() => sv.toBlochVector()).toThrow();
      });
    });

    describe('Measurement', () => {
      test('should get probability of measurement outcome', () => {
        const sv = StateVector.ketPlus();
        expect(sv.probability(0)).toBeCloseTo(0.5, 10);
        expect(sv.probability(1)).toBeCloseTo(0.5, 10);
      });

      test('should get all probabilities', () => {
        const sv = StateVector.uniform(4);
        const probs = sv.probabilities();
        expect(probs.length).toBe(4);
        expect(probs.reduce((a, b) => a + b)).toBeCloseTo(1, 10);
      });

      test('should perform measurement', () => {
        const sv = StateVector.ket0();
        const result = sv.measure();
        expect(result.outcome).toBe(0);
        expect(result.probability).toBeCloseTo(1, 10);
      });
    });

    describe('Serialization', () => {
      test('should export to JSON', () => {
        const sv = StateVector.ketPlus();
        const json = sv.toJson();
        expect(() => JSON.parse(json)).not.toThrow();
      });

      test('should recreate from JSON', () => {
        const original = StateVector.ketPlus();
        const json = original.toJson();
        const restored = StateVector.fromJson(json);
        expect(restored.getDimension()).toBe(2);
        expect(restored.probability(0)).toBeCloseTo(0.5, 10);
      });

      test('should clone state', () => {
        const original = StateVector.random(4);
        const clone = original.clone();
        expect(clone.norm()).toBeCloseTo(original.norm(), 10);
      });

      test('should have meaningful toString', () => {
        const sv = StateVector.ket0();
        const str = sv.toString();
        expect(str).toContain('|0⟩');
      });
    });

    describe('Hash Verification', () => {
      test('should generate hash', () => {
        const sv = StateVector.ket0();
        const hash = sv.getHash();
        expect(hash).toBeDefined();
        expect(hash.length).toBe(64);
      });

      test('should get state info', () => {
        const sv = StateVector.ketPlus();
        const info = sv.getInfo();
        expect(info.dimension).toBe(2);
        expect(info.norm).toBeCloseTo(1, 10);
        expect(info.isPure).toBe(true);
      });
    });
  });

  describe('DensityMatrix', () => {
    describe('Creation and Basic Properties', () => {
      test('should create empty density matrix', () => {
        const dm = new DensityMatrix(2);
        expect(dm.getDimension()).toBe(2);
      });

      test('should create from state vector', () => {
        const sv = StateVector.ket0();
        const dm = DensityMatrix.fromStateVector(sv);
        expect(dm.getDimension()).toBe(2);
      });

      test('should create maximally mixed state', () => {
        const dm = DensityMatrix.maximallyMixed(2);
        expect(dm.trace().real.toNumber()).toBeCloseTo(1, 10);
        expect(dm.isPure()).toBe(false);
      });

      test('should create pure state |0⟩⟨0|', () => {
        const dm = DensityMatrix.pureState0();
        expect(dm.getElement(0, 0).real.toNumber()).toBeCloseTo(1, 10);
        expect(dm.getElement(1, 1).real.toNumber()).toBeCloseTo(0, 10);
      });

      test('should create from ensemble', () => {
        const states = [StateVector.ket0(), StateVector.ket1()];
        const probs = [0.5, 0.5];
        const dm = DensityMatrix.fromEnsemble(states, probs);
        expect(dm.trace().real.toNumber()).toBeCloseTo(1, 10);
      });
    });

    describe('Density Matrix Properties', () => {
      test('should calculate trace', () => {
        const dm = DensityMatrix.pureState0();
        const trace = dm.trace();
        expect(trace.real.toNumber()).toBeCloseTo(1, 10);
      });

      test('should detect trace one', () => {
        const dm = DensityMatrix.pureState0();
        expect(dm.isTraceOne()).toBe(true);
      });

      test('should calculate purity', () => {
        const dm = DensityMatrix.pureState0();
        expect(dm.purity()).toBeCloseTo(1, 10);
      });

      test('should detect pure state', () => {
        const dm = StateVector.ket0().toDensityMatrix();
        expect(dm.isPure()).toBe(true);
      });

      test('should detect mixed state', () => {
        const dm = DensityMatrix.maximallyMixed(2);
        expect(dm.isPure()).toBe(false);
      });

      test('should check Hermiticity', () => {
        const dm = DensityMatrix.pureState0();
        expect(dm.isHermitian()).toBe(true);
      });

      test('should validate density matrix', () => {
        const dm = DensityMatrix.pureState0();
        expect(dm.isValid()).toBe(true);
      });
    });

    describe('Matrix Operations', () => {
      test('should add density matrices', () => {
        const dm1 = DensityMatrix.pureState0();
        const dm2 = DensityMatrix.pureState1();
        const sum = dm1.add(dm2);
        expect(sum.trace().real.toNumber()).toBeCloseTo(2, 10);
      });

      test('should scale density matrix', () => {
        const dm = DensityMatrix.pureState0();
        const scaled = dm.scale(0.5);
        expect(scaled.trace().real.toNumber()).toBeCloseTo(0.5, 10);
      });

      test('should multiply density matrices', () => {
        const dm = DensityMatrix.pureState0();
        const squared = dm.multiply(dm);
        expect(squared.trace().real.toNumber()).toBeCloseTo(1, 10); // Pure state
      });

      test('should compute conjugate transpose', () => {
        const dm = DensityMatrix.pureState0();
        const dagger = dm.dagger();
        expect(dagger.getDimension()).toBe(2);
      });

      test('should compute tensor product', () => {
        const dm1 = DensityMatrix.pureState0();
        const dm2 = DensityMatrix.pureState1();
        const product = dm1.tensorProduct(dm2);
        expect(product.getDimension()).toBe(4);
        expect(product.trace().real.toNumber()).toBeCloseTo(1, 10);
      });
    });

    describe('Partial Trace', () => {
      test('should compute partial trace over B', () => {
        const sv0 = StateVector.ket0();
        const sv1 = StateVector.ket1();
        const product = sv0.tensorProduct(sv1);
        const dm = DensityMatrix.fromStateVector(product);
        
        const reduced = dm.partialTraceB(2, 2);
        expect(reduced.getDimension()).toBe(2);
        expect(reduced.trace().real.toNumber()).toBeCloseTo(1, 10);
      });

      test('should compute partial trace over A', () => {
        const sv0 = StateVector.ket0();
        const sv1 = StateVector.ket1();
        const product = sv0.tensorProduct(sv1);
        const dm = DensityMatrix.fromStateVector(product);
        
        const reduced = dm.partialTraceA(2, 2);
        expect(reduced.getDimension()).toBe(2);
        expect(reduced.trace().real.toNumber()).toBeCloseTo(1, 10);
      });
    });

    describe('Entropy and Information', () => {
      test('should compute eigenvalues', () => {
        const dm = DensityMatrix.pureState0();
        const eigenvalues = dm.eigenvalues();
        expect(eigenvalues.length).toBe(2);
        // For pure state, one eigenvalue is 1, other is 0
        expect(Math.max(...eigenvalues)).toBeCloseTo(1, 10);
      });

      test('should compute von Neumann entropy for pure state', () => {
        const dm = DensityMatrix.pureState0();
        const entropy = dm.vonNeumannEntropy();
        expect(entropy).toBeCloseTo(0, 5);
      });

      test('should compute von Neumann entropy for mixed state', () => {
        const dm = DensityMatrix.maximallyMixed(2);
        const entropy = dm.vonNeumannEntropy();
        expect(entropy).toBeCloseTo(1, 5); // log2(2) = 1 for maximally mixed 2D
      });

      test('should compute linear entropy', () => {
        const dm = DensityMatrix.pureState0();
        const entropy = dm.linearEntropy();
        expect(entropy).toBeCloseTo(0, 10);
      });
    });

    describe('Expectation Values', () => {
      test('should compute expectation value', () => {
        const dm = DensityMatrix.pureState0();
        const sigmaZ = DensityMatrix.fromArray([
          [new Complex(1, 0), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ]);
        const expect_val = dm.expectationValue(sigmaZ);
        expect(expect_val.real.toNumber()).toBeCloseTo(1, 10); // ⟨σz⟩ = 1 for |0⟩
      });
    });

    describe('Serialization', () => {
      test('should export to JSON', () => {
        const dm = DensityMatrix.pureState0();
        const json = dm.toJson();
        expect(() => JSON.parse(json)).not.toThrow();
      });

      test('should recreate from JSON', () => {
        const original = DensityMatrix.maximallyMixed(2);
        const json = original.toJson();
        const restored = DensityMatrix.fromJson(json);
        expect(restored.getDimension()).toBe(2);
        expect(restored.purity()).toBeCloseTo(original.purity(), 10);
      });

      test('should clone density matrix', () => {
        const original = DensityMatrix.maximallyMixed(2);
        const clone = original.clone();
        expect(clone.purity()).toBeCloseTo(original.purity(), 10);
      });

      test('should convert to Matrix', () => {
        const dm = DensityMatrix.pureState0();
        const matrix = dm.toMatrix();
        expect(matrix.rows).toBe(2);
        expect(matrix.cols).toBe(2);
      });
    });

    describe('Hash Verification', () => {
      test('should generate hash', () => {
        const dm = DensityMatrix.pureState0();
        const hash = dm.getHash();
        expect(hash.length).toBe(64);
      });

      test('should get density matrix info', () => {
        const dm = DensityMatrix.maximallyMixed(2);
        const info = dm.getInfo();
        expect(info.dimension).toBe(2);
        expect(info.trace).toBeCloseTo(1, 10);
        expect(info.isPure).toBe(false);
        expect(info.vonNeumannEntropy).toBeCloseTo(1, 5);
      });
    });
  });

  describe('QuantumState (Unified Interface)', () => {
    test('should create from state vector', () => {
      const qs = QuantumState.fromStateVector(StateVector.ket0());
      expect(qs.getDimension()).toBe(2);
      expect(qs.isPure()).toBe(true);
    });

    test('should create from density matrix', () => {
      const qs = QuantumState.fromDensityMatrix(DensityMatrix.maximallyMixed(2));
      expect(qs.getDimension()).toBe(2);
      expect(qs.isPure()).toBe(false);
    });

    test('should create pure state', () => {
      const qs = QuantumState.pure([new Complex(1, 0), new Complex(0, 0)]);
      expect(qs.isPure()).toBe(true);
    });

    test('should create mixed state', () => {
      const states = [StateVector.ket0(), StateVector.ket1()];
      const probs = [0.5, 0.5];
      const qs = QuantumState.mixed(states, probs);
      expect(qs.isPure()).toBe(false);
    });

    test('should create maximally mixed state', () => {
      const qs = QuantumState.maximallyMixed(4);
      expect(qs.purity()).toBeCloseTo(0.25, 10);
    });

    test('should get state vector from pure state', () => {
      const qs = QuantumState.fromStateVector(StateVector.ketPlus());
      const sv = qs.getStateVector();
      expect(sv).not.toBeNull();
      expect(sv!.probability(0)).toBeCloseTo(0.5, 10);
    });

    test('should get density matrix', () => {
      const qs = QuantumState.maximallyMixed(2);
      const dm = qs.getDensityMatrix();
      expect(dm.getDimension()).toBe(2);
    });

    test('should calculate purity', () => {
      const qs = QuantumState.fromStateVector(StateVector.ket0());
      expect(qs.purity()).toBeCloseTo(1, 10);
    });

    test('should calculate entropy', () => {
      const qs = QuantumState.maximallyMixed(2);
      expect(qs.entropy()).toBeCloseTo(1, 5);
    });

    test('should clone quantum state', () => {
      const original = QuantumState.maximallyMixed(2);
      const clone = original.clone();
      expect(clone.purity()).toBeCloseTo(original.purity(), 10);
    });

    test('should have meaningful toString', () => {
      const qs = QuantumState.fromStateVector(StateVector.ket0());
      const str = qs.toString();
      expect(str).toContain('Pure');
    });
  });

  describe('Edge Cases', () => {
    test('should handle higher dimensional states', () => {
      const sv = StateVector.uniform(8);
      expect(sv.isNormalized()).toBe(true);
      expect(sv.probabilities().length).toBe(8);
    });

    test('should handle pure state conversion roundtrip', () => {
      const original = StateVector.random(4);
      const dm = original.toDensityMatrix();
      expect(dm.isPure()).toBe(true);
      expect(dm.trace().real.toNumber()).toBeCloseTo(1, 10);
    });

    test('should handle complex amplitudes', () => {
      const sv = new StateVector([
        new Complex(0.5, 0.5),
        new Complex(0.5, -0.5)
      ]);
      const normalized = sv.normalize();
      expect(normalized.isNormalized()).toBe(true);
    });
  });
});
