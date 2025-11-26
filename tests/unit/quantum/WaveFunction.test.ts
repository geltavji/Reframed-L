/**
 * WaveFunction.test.ts - Tests for PRD-02 Phase 2.1 WaveFunction module
 */

import { WaveFunction, ProbabilityDensity, NormalizationResult } from '../../../src/quantum/wavefunction/WaveFunction';
import { Complex } from '../../../src/core/math/Complex';

describe('WaveFunction (M02.01) - PRD-02 Phase 2.1', () => {
  beforeEach(() => {
    // Reset any static state
  });

  describe('Creation and Basic Properties', () => {
    test('should create zero wave function with specified size', () => {
      const wf = new WaveFunction(10);
      expect(wf.getGridPoints()).toBe(10);
      expect(wf.getDimensions()).toBe(1);
    });

    test('should create wave function from amplitudes', () => {
      const amplitudes = [
        new Complex(1, 0),
        new Complex(0, 1),
        new Complex(0.5, 0.5)
      ];
      const wf = new WaveFunction(amplitudes);
      expect(wf.getGridPoints()).toBe(3);
    });

    test('should get and set individual amplitudes', () => {
      const wf = new WaveFunction(5);
      wf.setAmplitude(2, new Complex(1, 0));
      const amp = wf.getAmplitude(2);
      expect(amp.real.toNumber()).toBe(1);
    });

    test('should throw error for out of bounds index', () => {
      const wf = new WaveFunction(5);
      expect(() => wf.getAmplitude(10)).toThrow();
      expect(() => wf.setAmplitude(-1, Complex.zero())).toThrow();
    });

    test('should have unique ID', () => {
      const wf1 = new WaveFunction(5);
      const wf2 = new WaveFunction(5);
      expect(wf1.getId()).not.toBe(wf2.getId());
    });
  });

  describe('Normalization', () => {
    test('should calculate norm correctly', () => {
      const wf = WaveFunction.basisState(0, 5);
      expect(wf.calculateNorm()).toBeCloseTo(1, 10);
    });

    test('should detect normalized state', () => {
      const wf = WaveFunction.basisState(0, 5);
      expect(wf.isNormalized()).toBe(true);
    });

    test('should detect unnormalized state', () => {
      const amplitudes = [
        new Complex(2, 0),
        new Complex(0, 0)
      ];
      const wf = new WaveFunction(amplitudes);
      expect(wf.isNormalized()).toBe(false);
    });

    test('should normalize wave function', () => {
      const amplitudes = [
        new Complex(3, 0),
        new Complex(4, 0)
      ];
      const wf = new WaveFunction(amplitudes);
      expect(wf.isNormalized()).toBe(false);
      
      const result = wf.normalize();
      expect(result.normalized).toBe(true);
      expect(wf.calculateNorm()).toBeCloseTo(1, 10);
    });

    test('should throw error when normalizing zero function', () => {
      const wf = new WaveFunction(5);
      expect(() => wf.normalize()).toThrow();
    });

    test('should return hash in normalization result', () => {
      const wf = WaveFunction.basisState(0, 5);
      const result = wf.verifyNormalization();
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64);
    });
  });

  describe('Probability Calculations', () => {
    test('should calculate probability density at point', () => {
      const wf = WaveFunction.basisState(2, 5);
      const density = wf.probabilityDensity(2);
      expect(density.density).toBeCloseTo(1, 10);
    });

    test('should have zero probability at other points for basis state', () => {
      const wf = WaveFunction.basisState(2, 5);
      const density = wf.probabilityDensity(0);
      expect(density.density).toBeCloseTo(0, 10);
    });

    test('should calculate probability in range', () => {
      const wf = WaveFunction.uniformSuperposition(4);
      const prob = wf.probabilityInRange(0, 1);
      expect(prob.probability).toBeCloseTo(0.5, 10);
    });

    test('should return position in probability density', () => {
      const wf = WaveFunction.basisState(3, 10);
      const density = wf.probabilityDensity(3);
      expect(density.position).toBeDefined();
      expect(density.position.length).toBe(1);
    });

    test('should find most probable position', () => {
      const wf = WaveFunction.basisState(3, 5);
      const most = wf.mostProbablePosition();
      expect(most.index).toBe(3);
      expect(most.density).toBeCloseTo(1, 10);
    });

    test('should get all probability densities', () => {
      const wf = WaveFunction.uniformSuperposition(4);
      const densities = wf.getAllProbabilityDensities();
      expect(densities.length).toBe(4);
      densities.forEach(d => expect(d).toBeCloseTo(0.25, 10));
    });
  });

  describe('Inner Product and Overlap', () => {
    test('should calculate inner product of orthogonal states', () => {
      const wf1 = WaveFunction.basisState(0, 5);
      const wf2 = WaveFunction.basisState(1, 5);
      const inner = wf1.innerProduct(wf2);
      expect(inner.value.magnitude().toNumber()).toBeCloseTo(0, 10);
    });

    test('should calculate inner product of same state', () => {
      const wf = WaveFunction.basisState(0, 5);
      const inner = wf.innerProduct(wf);
      expect(inner.value.real.toNumber()).toBeCloseTo(1, 10);
    });

    test('should calculate overlap', () => {
      const wf1 = WaveFunction.basisState(0, 5);
      const wf2 = WaveFunction.basisState(0, 5);
      const overlap = wf1.overlap(wf2);
      expect(overlap.overlap).toBeCloseTo(1, 10);
    });

    test('should detect orthogonality', () => {
      const wf1 = WaveFunction.basisState(0, 5);
      const wf2 = WaveFunction.basisState(1, 5);
      expect(wf1.isOrthogonal(wf2)).toBe(true);
    });

    test('should throw error for mismatched sizes in inner product', () => {
      const wf1 = new WaveFunction(5);
      const wf2 = new WaveFunction(10);
      expect(() => wf1.innerProduct(wf2)).toThrow();
    });
  });

  describe('Wave Function Operations', () => {
    test('should add wave functions', () => {
      const wf1 = WaveFunction.basisState(0, 2);
      const wf2 = WaveFunction.basisState(1, 2);
      const sum = wf1.add(wf2);
      expect(sum.getGridPoints()).toBe(2);
      expect(sum.calculateNorm()).toBeCloseTo(Math.sqrt(2), 10);
    });

    test('should subtract wave functions', () => {
      const wf1 = WaveFunction.basisState(0, 2);
      const wf2 = WaveFunction.basisState(0, 2);
      const diff = wf1.subtract(wf2);
      expect(diff.calculateNorm()).toBeCloseTo(0, 10);
    });

    test('should scale wave function', () => {
      const wf = WaveFunction.basisState(0, 2);
      const scaled = wf.scale(2);
      expect(scaled.calculateNorm()).toBeCloseTo(2, 10);
    });

    test('should scale by complex number', () => {
      const wf = WaveFunction.basisState(0, 2);
      const scaled = wf.scale(new Complex(0, 1)); // Multiply by i
      expect(scaled.calculateNorm()).toBeCloseTo(1, 10);
    });

    test('should conjugate wave function', () => {
      const amplitudes = [new Complex(1, 1), new Complex(2, -1)];
      const wf = new WaveFunction(amplitudes);
      const conj = wf.conjugate();
      expect(conj.getAmplitude(0).imag.toNumber()).toBe(-1);
      expect(conj.getAmplitude(1).imag.toNumber()).toBe(1);
    });

    test('should apply phase factor', () => {
      const wf = WaveFunction.basisState(0, 2);
      const phased = wf.applyPhase(Math.PI / 2);
      expect(phased.calculateNorm()).toBeCloseTo(1, 10);
    });
  });

  describe('Tensor Product', () => {
    test('should compute tensor product', () => {
      const wf1 = WaveFunction.basisState(0, 2);
      const wf2 = WaveFunction.basisState(1, 2);
      const product = wf1.tensorProduct(wf2);
      expect(product.getGridPoints()).toBe(4);
    });

    test('should maintain normalization in tensor product', () => {
      const wf1 = WaveFunction.basisState(0, 2);
      const wf2 = WaveFunction.basisState(1, 2);
      const product = wf1.tensorProduct(wf2);
      expect(product.calculateNorm()).toBeCloseTo(1, 10);
    });

    test('should increase dimensions in tensor product', () => {
      const wf1 = new WaveFunction(2, { dimensions: 1 });
      const wf2 = new WaveFunction(2, { dimensions: 1 });
      wf1.setAmplitude(0, Complex.one());
      wf2.setAmplitude(1, Complex.one());
      const product = wf1.tensorProduct(wf2);
      expect(product.getDimensions()).toBe(2);
    });
  });

  describe('Fourier Transform', () => {
    test('should transform to momentum space', () => {
      const wf = WaveFunction.basisState(0, 4);
      const momentum = wf.toMomentumSpace();
      expect(momentum.getGridPoints()).toBe(4);
      expect(momentum.calculateNorm()).toBeCloseTo(1, 10);
    });

    test('should transform back to position space', () => {
      const wf = WaveFunction.basisState(2, 8);
      const momentum = wf.toMomentumSpace();
      const position = momentum.toPositionSpace();
      
      // Should recover original (approximately)
      const originalDensities = wf.getAllProbabilityDensities();
      const recoveredDensities = position.getAllProbabilityDensities();
      
      for (let i = 0; i < originalDensities.length; i++) {
        expect(recoveredDensities[i]).toBeCloseTo(originalDensities[i], 5);
      }
    });

    test('should preserve normalization in Fourier transform', () => {
      const wf = WaveFunction.gaussianWavePacket(16, 0.5, 0.1);
      const momentum = wf.toMomentumSpace();
      expect(momentum.calculateNorm()).toBeCloseTo(1, 5);
    });
  });

  describe('Static Factory Methods', () => {
    test('should create zero wave function', () => {
      const wf = WaveFunction.zero(10);
      expect(wf.calculateNorm()).toBe(0);
    });

    test('should create basis state', () => {
      const wf = WaveFunction.basisState(2, 5);
      expect(wf.probabilityDensity(2).density).toBeCloseTo(1, 10);
      expect(wf.isNormalized()).toBe(true);
    });

    test('should create uniform superposition', () => {
      const wf = WaveFunction.uniformSuperposition(4);
      expect(wf.isNormalized()).toBe(true);
      const densities = wf.getAllProbabilityDensities();
      densities.forEach(d => expect(d).toBeCloseTo(0.25, 10));
    });

    test('should create Gaussian wave packet', () => {
      const wf = WaveFunction.gaussianWavePacket(100, 0.5, 0.1);
      expect(wf.isNormalized()).toBe(true);
      
      // Should peak near center
      const most = wf.mostProbablePosition();
      expect(most.position[0]).toBeCloseTo(0.5, 1);
    });

    test('should create plane wave', () => {
      const wf = WaveFunction.planeWave(16, 1);
      expect(wf.isNormalized()).toBe(true);
    });

    test('should create from superposition', () => {
      const coeffs = [new Complex(1, 0), new Complex(1, 0)];
      const wf = WaveFunction.fromSuperposition(coeffs, 4);
      expect(wf.isNormalized()).toBe(true);
    });
  });

  describe('Hash Verification', () => {
    test('should generate state hash', () => {
      const wf = WaveFunction.basisState(0, 5);
      const hash = wf.getStateHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    test('should verify state against hash', () => {
      const wf = WaveFunction.basisState(0, 5);
      const hash = wf.getStateHash();
      expect(wf.verifyState(hash)).toBe(true);
    });

    test('should fail verification for wrong hash', () => {
      const wf = WaveFunction.basisState(0, 5);
      expect(wf.verifyState('wrong-hash')).toBe(false);
    });

    test('should maintain proof chain', () => {
      const wf = WaveFunction.basisState(0, 5);
      const chain = wf.getProofChain();
      expect(chain).toBeDefined();
      expect(chain.getRecordCount()).toBeGreaterThan(0);
    });

    test('should verify proof chain integrity', () => {
      const wf = WaveFunction.basisState(0, 5);
      expect(wf.verifyProofChain()).toBe(true);
    });
  });

  describe('Export and Serialization', () => {
    test('should export to state object', () => {
      const wf = WaveFunction.basisState(0, 5);
      const state = wf.toState();
      expect(state.id).toBe(wf.getId());
      expect(state.gridPoints).toBe(5);
      expect(state.isNormalized).toBe(true);
    });

    test('should export to JSON', () => {
      const wf = WaveFunction.basisState(0, 3);
      const json = wf.toJson();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    test('should recreate from JSON', () => {
      const original = WaveFunction.basisState(1, 3);
      const json = original.toJson();
      const restored = WaveFunction.fromJson(json);
      
      expect(restored.getGridPoints()).toBe(3);
      expect(restored.probabilityDensity(1).density).toBeCloseTo(1, 10);
    });

    test('should clone wave function', () => {
      const original = WaveFunction.gaussianWavePacket(20, 0.5, 0.1);
      const clone = original.clone();
      
      expect(clone.getGridPoints()).toBe(original.getGridPoints());
      expect(clone.calculateNorm()).toBeCloseTo(original.calculateNorm(), 10);
    });

    test('should have meaningful toString', () => {
      const wf = WaveFunction.basisState(0, 5);
      const str = wf.toString();
      expect(str).toContain('WaveFunction');
      expect(str).toContain('points=5');
    });
  });

  describe('Position/Momentum Representation', () => {
    test('should convert index to position', () => {
      const wf = new WaveFunction(10);
      const pos = wf.indexToPosition(0);
      expect(pos[0]).toBe(0);
      
      const posEnd = wf.indexToPosition(9);
      expect(posEnd[0]).toBeCloseTo(1, 10);
    });

    test('should convert position to index', () => {
      const wf = new WaveFunction(10);
      const idx = wf.positionToIndex([0.5]);
      expect(idx).toBeCloseTo(5, 0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle single-point wave function', () => {
      const wf = WaveFunction.basisState(0, 1);
      expect(wf.isNormalized()).toBe(true);
      expect(wf.calculateNorm()).toBe(1);
    });

    test('should handle large wave functions', () => {
      const wf = WaveFunction.uniformSuperposition(1000);
      expect(wf.isNormalized()).toBe(true);
    });

    test('should handle wave function with only imaginary amplitudes', () => {
      const amplitudes = [new Complex(0, 1), new Complex(0, 0)];
      const wf = new WaveFunction(amplitudes);
      expect(wf.calculateNorm()).toBeCloseTo(1, 10);
    });
  });
});
