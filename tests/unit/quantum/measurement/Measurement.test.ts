/**
 * Measurement.test.ts - Tests for PRD-02 Phase 2.4
 * Module ID: M02.07
 * 
 * Tests for quantum measurement theory including:
 * - Projector operations
 * - Projective measurements (von Neumann)
 * - POVM measurements
 * - Born rule validation
 * - State collapse
 * - Measurement statistics
 * - Weak measurements
 * - Quantum tomography
 */

import {
  Projector,
  ProjectiveMeasurement,
  POVM,
  MeasurementFactory,
  WeakMeasurement,
  QuantumTomography,
  MeasurementOutcome,
  MeasurementResult
} from '../../../../src/quantum/measurement/Measurement';
import { Vector, Matrix, Hermitian } from '../../../../src/quantum/operators/Operator';
import { Complex } from '../../../../src/core/math/Complex';

describe('Quantum Measurement Module (M02.07)', () => {
  
  // ========================================================================
  // PROJECTOR TESTS
  // ========================================================================
  
  describe('Projector', () => {
    
    describe('Construction', () => {
      
      test('should create projector from state vector', () => {
        const state = new Vector([Complex.one(), Complex.zero()]);
        const projector = new Projector(state);
        
        expect(projector.getDimension()).toBe(2);
        expect(projector.getRank()).toBe(1);
        expect(projector.getId()).toBeDefined();
        expect(projector.getHash()).toBeDefined();
      });
      
      test('should normalize input state', () => {
        const state = new Vector([new Complex(2, 0), Complex.zero()]);
        const projector = new Projector(state);
        
        // P|0⟩ should equal |0⟩
        const result = projector.apply(new Vector([Complex.one(), Complex.zero()]));
        expect(result.norm()).toBeCloseTo(1, 10);
      });
      
      test('should throw for zero vector', () => {
        const zeroState = new Vector([Complex.zero(), Complex.zero()]);
        expect(() => new Projector(zeroState)).toThrow();
      });
      
      test('should create from complex state', () => {
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(0, 1 / Math.sqrt(2))
        ]);
        const projector = new Projector(state);
        
        expect(projector.getDimension()).toBe(2);
        expect(projector.isValid()).toBe(true);
      });
      
    });
    
    describe('Projector Properties', () => {
      
      test('should satisfy P² = P', () => {
        const state = new Vector([Complex.one(), Complex.zero()]);
        const projector = new Projector(state);
        
        expect(projector.isValid()).toBe(true);
      });
      
      test('should be idempotent for superposition', () => {
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        const projector = new Projector(state);
        
        expect(projector.isValid()).toBe(true);
      });
      
      test('should project onto subspace correctly', () => {
        const state = new Vector([Complex.one(), Complex.zero()]);
        const projector = new Projector(state);
        
        // Project |1⟩ onto |0⟩ should give 0
        const orthogonal = new Vector([Complex.zero(), Complex.one()]);
        const result = projector.apply(orthogonal);
        
        expect(result.norm()).toBeCloseTo(0, 10);
      });
      
    });
    
    describe('Probability Calculation', () => {
      
      test('should calculate probability 1 for identical state', () => {
        const state = new Vector([Complex.one(), Complex.zero()]);
        const projector = new Projector(state);
        
        const prob = projector.probability(state);
        expect(prob).toBeCloseTo(1, 10);
      });
      
      test('should calculate probability 0 for orthogonal state', () => {
        const state = new Vector([Complex.one(), Complex.zero()]);
        const projector = new Projector(state);
        
        const orthogonal = new Vector([Complex.zero(), Complex.one()]);
        const prob = projector.probability(orthogonal);
        
        expect(prob).toBeCloseTo(0, 10);
      });
      
      test('should calculate probability 0.5 for equal superposition', () => {
        const basis0 = new Vector([Complex.one(), Complex.zero()]);
        const projector = new Projector(basis0);
        
        const superposition = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const prob = projector.probability(superposition);
        expect(prob).toBeCloseTo(0.5, 10);
      });
      
      test('probabilities should sum to 1 for complete set', () => {
        const proj0 = Projector.computationalBasis(2, 0);
        const proj1 = Projector.computationalBasis(2, 1);
        
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const totalProb = proj0.probability(state) + proj1.probability(state);
        expect(totalProb).toBeCloseTo(1, 10);
      });
      
    });
    
    describe('Static Constructors', () => {
      
      test('should create computational basis projector |0⟩⟨0|', () => {
        const projector = Projector.computationalBasis(2, 0);
        
        const state0 = new Vector([Complex.one(), Complex.zero()]);
        const state1 = new Vector([Complex.zero(), Complex.one()]);
        
        expect(projector.probability(state0)).toBeCloseTo(1, 10);
        expect(projector.probability(state1)).toBeCloseTo(0, 10);
      });
      
      test('should create computational basis projector |1⟩⟨1|', () => {
        const projector = Projector.computationalBasis(2, 1);
        
        const state0 = new Vector([Complex.one(), Complex.zero()]);
        const state1 = new Vector([Complex.zero(), Complex.one()]);
        
        expect(projector.probability(state0)).toBeCloseTo(0, 10);
        expect(projector.probability(state1)).toBeCloseTo(1, 10);
      });
      
      test('should create projector for higher dimension', () => {
        const projector = Projector.computationalBasis(4, 2);
        
        expect(projector.getDimension()).toBe(4);
        
        // Check probability
        const state2 = new Vector([
          Complex.zero(), Complex.zero(), Complex.one(), Complex.zero()
        ]);
        expect(projector.probability(state2)).toBeCloseTo(1, 10);
      });
      
      test('should throw for invalid index', () => {
        expect(() => Projector.computationalBasis(2, 2)).toThrow();
        expect(() => Projector.computationalBasis(3, -1)).toThrow();
      });
      
    });
    
  });
  
  // ========================================================================
  // PROJECTIVE MEASUREMENT TESTS
  // ========================================================================
  
  describe('ProjectiveMeasurement', () => {
    
    describe('Construction', () => {
      
      test('should create from Pauli Z observable', () => {
        const measurement = MeasurementFactory.pauliZ();
        
        expect(measurement.getId()).toBeDefined();
        expect(measurement.getHash()).toBeDefined();
        expect(measurement.getEigenpairs().length).toBe(2);
      });
      
      test('should create from Pauli X observable', () => {
        const measurement = MeasurementFactory.pauliX();
        
        const eigenpairs = measurement.getEigenpairs();
        expect(eigenpairs.length).toBe(2);
        
        // Eigenvalues should be +1 and -1
        const eigenvalues = eigenpairs.map(ep => ep.eigenvalue.real.toNumber()).sort((a, b) => a - b);
        expect(eigenvalues[0]).toBeCloseTo(-1, 5);
        expect(eigenvalues[1]).toBeCloseTo(1, 5);
      });
      
      test('should create from custom Hermitian', () => {
        const data: Complex[][] = [
          [new Complex(2, 0), Complex.zero()],
          [Complex.zero(), new Complex(3, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Custom');
        const measurement = new ProjectiveMeasurement(observable);
        
        expect(measurement.getEigenpairs().length).toBe(2);
      });
      
    });
    
    describe('Measurement Outcomes', () => {
      
      test('should calculate all outcomes for Z measurement', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]); // |0⟩
        
        const outcomes = measurement.calculateOutcomes(state);
        
        expect(outcomes.length).toBe(2);
        expect(outcomes.some(o => Math.abs(o.probability - 1) < 0.01)).toBe(true);
        expect(outcomes.some(o => Math.abs(o.probability) < 0.01)).toBe(true);
      });
      
      test('should have probabilities summing to 1', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const outcomes = measurement.calculateOutcomes(state);
        const totalProb = outcomes.reduce((sum, o) => sum + o.probability, 0);
        
        expect(totalProb).toBeCloseTo(1, 10);
      });
      
      test('should return normalized post-measurement states', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const outcomes = measurement.calculateOutcomes(state);
        
        for (const outcome of outcomes) {
          if (outcome.probability > 0.01) {
            expect(outcome.postMeasurementState.norm()).toBeCloseTo(1, 10);
          }
        }
      });
      
      test('should include hash for each outcome', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        const outcomes = measurement.calculateOutcomes(state);
        
        for (const outcome of outcomes) {
          expect(outcome.hash).toBeDefined();
          expect(outcome.hash.length).toBeGreaterThan(0);
        }
      });
      
    });
    
    describe('Measurement Execution', () => {
      
      test('should perform measurement and return result', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]); // |0⟩
        
        const result = measurement.measure(state);
        
        expect(result.measuredValue).toBeDefined();
        expect(result.probability).toBeDefined();
        expect(result.collapsed).toBe(true);
        expect(result.postState).toBeDefined();
        expect(result.resultHash).toBeDefined();
      });
      
      test('should always measure +1 for |0⟩ state in Z basis', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        // Run multiple times
        for (let i = 0; i < 10; i++) {
          const result = measurement.measure(state);
          expect(result.measuredValue).toBeCloseTo(1, 5);
        }
      });
      
      test('should always measure -1 for |1⟩ state in Z basis', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.zero(), Complex.one()]);
        
        for (let i = 0; i < 10; i++) {
          const result = measurement.measure(state);
          expect(result.measuredValue).toBeCloseTo(-1, 5);
        }
      });
      
      test('should measure +1 or -1 for superposition', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const result = measurement.measure(state);
        
        expect(Math.abs(result.measuredValue)).toBeCloseTo(1, 5);
      });
      
    });
    
    describe('Expectation Values', () => {
      
      test('should calculate expectation value for |0⟩', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        const expectation = measurement.expectationValue(state);
        expect(expectation).toBeCloseTo(1, 10);
      });
      
      test('should calculate expectation value for |1⟩', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.zero(), Complex.one()]);
        
        const expectation = measurement.expectationValue(state);
        expect(expectation).toBeCloseTo(-1, 10);
      });
      
      test('should calculate zero expectation for equal superposition', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const expectation = measurement.expectationValue(state);
        expect(expectation).toBeCloseTo(0, 10);
      });
      
    });
    
    describe('Variance and Uncertainty', () => {
      
      test('should calculate zero variance for eigenstate', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        const variance = measurement.variance(state);
        expect(variance).toBeCloseTo(0, 10);
      });
      
      test('should calculate variance 1 for equal superposition', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const variance = measurement.variance(state);
        expect(variance).toBeCloseTo(1, 10);
      });
      
      test('should calculate uncertainty correctly', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const uncertainty = measurement.uncertainty(state);
        expect(uncertainty).toBeCloseTo(1, 10);
      });
      
    });
    
    describe('Observable Statistics', () => {
      
      test('should return complete statistics', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const stats = measurement.getStatistics(state);
        
        expect(stats.expectationValue).toBeCloseTo(0, 10);
        expect(stats.variance).toBeCloseTo(1, 10);
        expect(stats.standardDeviation).toBeCloseTo(1, 10);
        expect(stats.possibleValues.length).toBe(2);
        expect(stats.probabilities.length).toBe(2);
        expect(stats.moments.length).toBe(4);
        expect(stats.hash).toBeDefined();
      });
      
      test('should calculate moments correctly', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        const stats = measurement.getStatistics(state);
        
        // For eigenstate |0⟩ with eigenvalue +1
        // All moments should be 1^n = 1
        expect(stats.moments[0]).toBeCloseTo(1, 10); // First moment
        expect(stats.moments[1]).toBeCloseTo(1, 10); // Second moment
      });
      
    });
    
    describe('Repeated Measurements', () => {
      
      test('should perform multiple measurements', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const result = measurement.measureRepeated(state, 100);
        
        expect(result.outcomes.length).toBe(100);
        expect(result.sampleMean).toBeDefined();
        expect(result.sampleVariance).toBeDefined();
        expect(result.theoreticalMean).toBeCloseTo(0, 5);
        expect(result.hash).toBeDefined();
      });
      
      test('should have sample mean close to theoretical for large N', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([
          new Complex(Math.sqrt(0.7), 0),
          new Complex(Math.sqrt(0.3), 0)
        ]);
        
        const result = measurement.measureRepeated(state, 1000);
        
        // Theoretical mean: 0.7 * 1 + 0.3 * (-1) = 0.4
        expect(Math.abs(result.sampleMean - 0.4)).toBeLessThan(0.15);
      });
      
      test('should track frequencies correctly', () => {
        const measurement = MeasurementFactory.pauliZ();
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        const result = measurement.measureRepeated(state, 100);
        
        // Should always measure +1
        expect(result.frequencies.get(1) || 0).toBe(100);
        expect(result.frequencies.get(-1) || 0).toBe(0);
      });
      
    });
    
  });
  
  // ========================================================================
  // POVM TESTS
  // ========================================================================
  
  describe('POVM', () => {
    
    describe('Construction', () => {
      
      test('should create computational basis POVM', () => {
        const povm = POVM.computationalBasis(2);
        
        expect(povm.getNumOutcomes()).toBe(2);
        expect(povm.getDimension()).toBe(2);
        expect(povm.getId()).toBeDefined();
        expect(povm.getHash()).toBeDefined();
      });
      
      test('should throw for invalid POVM (doesn\'t sum to identity)', () => {
        const element1: Complex[][] = [
          [new Complex(0.5, 0), Complex.zero()],
          [Complex.zero(), Complex.zero()]
        ];
        
        // This doesn't sum to identity
        expect(() => new POVM([new Matrix(element1)])).toThrow();
      });
      
      test('should create higher dimensional POVM', () => {
        const povm = POVM.computationalBasis(4);
        
        expect(povm.getNumOutcomes()).toBe(4);
        expect(povm.getDimension()).toBe(4);
      });
      
    });
    
    describe('Probability Calculation', () => {
      
      test('should calculate probabilities for computational basis', () => {
        const povm = POVM.computationalBasis(2);
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        const probs = povm.calculateProbabilities(state);
        
        expect(probs[0]).toBeCloseTo(1, 10);
        expect(probs[1]).toBeCloseTo(0, 10);
      });
      
      test('should have probabilities sum to 1', () => {
        const povm = POVM.computationalBasis(2);
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const probs = povm.calculateProbabilities(state);
        const total = probs.reduce((a, b) => a + b, 0);
        
        expect(total).toBeCloseTo(1, 10);
      });
      
      test('should work for superposition state', () => {
        const povm = POVM.computationalBasis(2);
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const probs = povm.calculateProbabilities(state);
        
        expect(probs[0]).toBeCloseTo(0.5, 10);
        expect(probs[1]).toBeCloseTo(0.5, 10);
      });
      
    });
    
    describe('POVM Measurement', () => {
      
      test('should perform measurement', () => {
        const povm = POVM.computationalBasis(2);
        const state = new Vector([Complex.one(), Complex.zero()]);
        
        const result = povm.measure(state);
        
        expect(result.outcomeIndex).toBe(0);
        expect(result.probability).toBeCloseTo(1, 10);
        expect(result.hash).toBeDefined();
      });
      
      test('should return all probabilities', () => {
        const povm = POVM.computationalBasis(2);
        const state = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const result = povm.measure(state);
        
        expect(result.allProbabilities.length).toBe(2);
        expect(result.allProbabilities[0]).toBeCloseTo(0.5, 10);
        expect(result.allProbabilities[1]).toBeCloseTo(0.5, 10);
      });
      
    });
    
  });
  
  // ========================================================================
  // MEASUREMENT FACTORY TESTS
  // ========================================================================
  
  describe('MeasurementFactory', () => {
    
    test('should create Pauli Z measurement', () => {
      const measurement = MeasurementFactory.pauliZ();
      expect(measurement.getEigenpairs().length).toBe(2);
    });
    
    test('should create Pauli X measurement', () => {
      const measurement = MeasurementFactory.pauliX();
      expect(measurement.getEigenpairs().length).toBe(2);
    });
    
    test('should create Pauli Y measurement', () => {
      const measurement = MeasurementFactory.pauliY();
      expect(measurement.getEigenpairs().length).toBe(2);
    });
    
    test('should create computational basis measurement', () => {
      const measurement = MeasurementFactory.computationalBasis(4);
      expect(measurement.getEigenpairs().length).toBe(4);
    });
    
    test('should create number operator measurement', () => {
      const measurement = MeasurementFactory.numberOperator(5);
      expect(measurement.getEigenpairs().length).toBe(5);
    });
    
    test('should create position measurement', () => {
      const measurement = MeasurementFactory.position(10);
      expect(measurement.getEigenpairs().length).toBe(10);
    });
    
    test('should create momentum measurement', () => {
      const measurement = MeasurementFactory.momentum(10);
      expect(measurement.getEigenpairs().length).toBe(10);
    });
    
    test('should create spin measurements', () => {
      const spinX = MeasurementFactory.spin('x');
      const spinY = MeasurementFactory.spin('y');
      const spinZ = MeasurementFactory.spin('z');
      
      expect(spinX.getEigenpairs().length).toBe(2);
      expect(spinY.getEigenpairs().length).toBe(2);
      expect(spinZ.getEigenpairs().length).toBe(2);
    });
    
    test('should create spin along arbitrary direction', () => {
      const measurement = MeasurementFactory.spinDirection(Math.PI / 4, 0);
      expect(measurement.getEigenpairs().length).toBe(2);
    });
    
  });
  
  // ========================================================================
  // WEAK MEASUREMENT TESTS
  // ========================================================================
  
  describe('WeakMeasurement', () => {
    
    describe('Construction', () => {
      
      test('should create with default strength', () => {
        const data: Complex[][] = [
          [Complex.one(), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Test');
        const weak = new WeakMeasurement(observable);
        
        expect(weak.getStrength()).toBe(0.1);
        expect(weak.getId()).toBeDefined();
        expect(weak.getHash()).toBeDefined();
      });
      
      test('should create with custom strength', () => {
        const data: Complex[][] = [
          [Complex.one(), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Test');
        const weak = new WeakMeasurement(observable, 0.5);
        
        expect(weak.getStrength()).toBe(0.5);
      });
      
      test('should clamp strength to [0, 1]', () => {
        const data: Complex[][] = [
          [Complex.one(), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Test');
        
        const weak1 = new WeakMeasurement(observable, 2.0);
        expect(weak1.getStrength()).toBe(1);
        
        const weak2 = new WeakMeasurement(observable, -0.5);
        expect(weak2.getStrength()).toBe(0);
      });
      
    });
    
    describe('Weak Measurement', () => {
      
      test('should perform weak measurement', () => {
        const data: Complex[][] = [
          [Complex.one(), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Test');
        const weak = new WeakMeasurement(observable, 0.1);
        
        const state = new Vector([Complex.one(), Complex.zero()]);
        const result = weak.measure(state);
        
        expect(result.weakValue).toBeDefined();
        expect(result.postState).toBeDefined();
        expect(result.postState.norm()).toBeCloseTo(1, 10);
        expect(result.hash).toBeDefined();
      });
      
      test('should have weak value close to expectation for eigenstate', () => {
        const data: Complex[][] = [
          [Complex.one(), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Test');
        const weak = new WeakMeasurement(observable, 0.9);
        
        const state = new Vector([Complex.one(), Complex.zero()]);
        const result = weak.measure(state);
        
        // Weak value should be close to +1 (the eigenvalue)
        expect(Math.abs(result.weakValue - 1)).toBeLessThan(0.5);
      });
      
    });
    
    describe('Post-selected Weak Value', () => {
      
      test('should calculate weak value with post-selection', () => {
        const data: Complex[][] = [
          [Complex.one(), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Test');
        const weak = new WeakMeasurement(observable);
        
        const preState = new Vector([Complex.one(), Complex.zero()]);
        const postState = new Vector([
          new Complex(1 / Math.sqrt(2), 0),
          new Complex(1 / Math.sqrt(2), 0)
        ]);
        
        const weakValue = weak.weakValuePostSelected(preState, postState);
        
        expect(weakValue).toBeDefined();
      });
      
      test('should throw for orthogonal post-selection', () => {
        const data: Complex[][] = [
          [Complex.one(), Complex.zero()],
          [Complex.zero(), new Complex(-1, 0)]
        ];
        const observable = new Hermitian(new Matrix(data), 'Test');
        const weak = new WeakMeasurement(observable);
        
        const preState = new Vector([Complex.one(), Complex.zero()]);
        const postState = new Vector([Complex.zero(), Complex.one()]);
        
        expect(() => weak.weakValuePostSelected(preState, postState)).toThrow();
      });
      
    });
    
  });
  
  // ========================================================================
  // QUANTUM TOMOGRAPHY TESTS
  // ========================================================================
  
  describe('QuantumTomography', () => {
    
    describe('Construction', () => {
      
      test('should create tomography for specified dimension', () => {
        const tomo = new QuantumTomography(2);
        
        expect(tomo.getId()).toBeDefined();
        expect(tomo.getHash()).toBeDefined();
      });
      
    });
    
    describe('Qubit Reconstruction', () => {
      
      test('should reconstruct |0⟩ state', () => {
        const tomo = new QuantumTomography(2);
        
        // |0⟩ has Bloch vector (0, 0, 1)
        const result = tomo.reconstructQubit(0, 0, 1);
        
        expect(result.blochVector.z).toBeCloseTo(1, 10);
        expect(result.purity).toBeCloseTo(1, 10);
        expect(result.hash).toBeDefined();
      });
      
      test('should reconstruct |1⟩ state', () => {
        const tomo = new QuantumTomography(2);
        
        // |1⟩ has Bloch vector (0, 0, -1)
        const result = tomo.reconstructQubit(0, 0, -1);
        
        expect(result.blochVector.z).toBeCloseTo(-1, 10);
        expect(result.purity).toBeCloseTo(1, 10);
      });
      
      test('should reconstruct |+⟩ state', () => {
        const tomo = new QuantumTomography(2);
        
        // |+⟩ has Bloch vector (1, 0, 0)
        const result = tomo.reconstructQubit(1, 0, 0);
        
        expect(result.blochVector.x).toBeCloseTo(1, 10);
        expect(result.purity).toBeCloseTo(1, 10);
      });
      
      test('should reconstruct mixed state', () => {
        const tomo = new QuantumTomography(2);
        
        // Maximally mixed state has Bloch vector (0, 0, 0)
        const result = tomo.reconstructQubit(0, 0, 0);
        
        expect(result.purity).toBeCloseTo(0.5, 10);
      });
      
      test('should return density matrix', () => {
        const tomo = new QuantumTomography(2);
        const result = tomo.reconstructQubit(0, 0, 1);
        
        expect(result.densityMatrix.getRows()).toBe(2);
        expect(result.densityMatrix.getCols()).toBe(2);
        
        // Check trace = 1
        expect(result.densityMatrix.trace().real.toNumber()).toBeCloseTo(1, 10);
      });
      
    });
    
    describe('Linear Inversion', () => {
      
      test('should perform linear inversion tomography', () => {
        const tomo = new QuantumTomography(2);
        
        const measurements = [
          MeasurementFactory.pauliX(),
          MeasurementFactory.pauliY(),
          MeasurementFactory.pauliZ()
        ];
        
        // Simulated outcomes for |0⟩ state
        const outcomes = [
          new Array(100).fill(1).map(() => Math.random() > 0.5 ? 1 : -1),
          new Array(100).fill(1).map(() => Math.random() > 0.5 ? 1 : -1),
          new Array(100).fill(1) // Always +1 for Z
        ];
        
        const result = tomo.linearInversion(measurements, outcomes);
        
        expect(result.densityMatrix).toBeDefined();
        expect(result.hash).toBeDefined();
      });
      
    });
    
  });
  
  // ========================================================================
  // BORN RULE VALIDATION TESTS
  // ========================================================================
  
  describe('Born Rule Validation', () => {
    
    test('should satisfy Born rule for computational basis', () => {
      const measurement = MeasurementFactory.pauliZ();
      const alpha = Math.sqrt(0.7);
      const beta = Math.sqrt(0.3);
      
      const state = new Vector([
        new Complex(alpha, 0),
        new Complex(beta, 0)
      ]);
      
      const outcomes = measurement.calculateOutcomes(state);
      
      // P(+1) should be |α|² = 0.7
      // P(-1) should be |β|² = 0.3
      const probPlus1 = outcomes.find(o => o.eigenvalue > 0)?.probability ?? 0;
      const probMinus1 = outcomes.find(o => o.eigenvalue < 0)?.probability ?? 0;
      
      expect(probPlus1).toBeCloseTo(0.7, 10);
      expect(probMinus1).toBeCloseTo(0.3, 10);
    });
    
    test('should satisfy Born rule for X basis', () => {
      const measurement = MeasurementFactory.pauliX();
      
      // |0⟩ = (|+⟩ + |-⟩)/√2
      const state = new Vector([Complex.one(), Complex.zero()]);
      
      const outcomes = measurement.calculateOutcomes(state);
      
      // Should have 50-50 probability
      for (const outcome of outcomes) {
        expect(outcome.probability).toBeCloseTo(0.5, 5);
      }
    });
    
    test('should preserve norm after collapse', () => {
      const measurement = MeasurementFactory.pauliZ();
      const state = new Vector([
        new Complex(1 / Math.sqrt(2), 0),
        new Complex(1 / Math.sqrt(2), 0)
      ]);
      
      const result = measurement.measure(state);
      
      expect(result.postState.norm()).toBeCloseTo(1, 10);
    });
    
  });
  
  // ========================================================================
  // HASH VERIFICATION TESTS
  // ========================================================================
  
  describe('Hash Verification', () => {
    
    test('should generate unique hashes for different measurements', () => {
      const m1 = MeasurementFactory.pauliZ();
      const m2 = MeasurementFactory.pauliX();
      
      expect(m1.getHash()).not.toBe(m2.getHash());
    });
    
    test('should include hash in measurement result', () => {
      const measurement = MeasurementFactory.pauliZ();
      const state = new Vector([Complex.one(), Complex.zero()]);
      
      const result = measurement.measure(state);
      
      expect(result.resultHash).toBeDefined();
      expect(result.resultHash.length).toBeGreaterThan(0);
      expect(result.observableHash).toBeDefined();
      expect(result.stateHash).toBeDefined();
    });
    
    test('should include hash in statistics', () => {
      const measurement = MeasurementFactory.pauliZ();
      const state = new Vector([Complex.one(), Complex.zero()]);
      
      const stats = measurement.getStatistics(state);
      
      expect(stats.hash).toBeDefined();
      expect(stats.hash.length).toBeGreaterThan(0);
    });
    
    test('should include hash in POVM result', () => {
      const povm = POVM.computationalBasis(2);
      const state = new Vector([Complex.one(), Complex.zero()]);
      
      const result = povm.measure(state);
      
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
    });
    
  });
  
});
