/**
 * Qlaws Ham - QuantumShortcut Module Tests (M06.02)
 * 
 * Comprehensive tests for quantum shortcut algorithms.
 * 
 * @module QuantumShortcut.test
 * @version 1.0.0
 */

import {
  QuantumShortcut,
  QuantumShortcutFactory,
  InstantCorrelation,
  NonLocalComputation,
  ShortcutType,
  BellStateType,
  QuantumStateVector,
  ShortcutResult,
  EntanglementPair,
  GroverResult,
  TeleportationResult
} from '../../../src/revolutionary/shortcuts/QuantumShortcut';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';
import { Complex } from '../../../src/core/math/Complex';

describe('QuantumShortcut Module (M06.02)', () => {
  let logger: Logger;
  let shortcut: QuantumShortcut;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    QuantumShortcut.setLogger(logger);
    shortcut = new QuantumShortcut();
  });

  afterEach(() => {
    shortcut.clear();
    Logger.resetInstance();
  });

  describe('InstantCorrelation Class', () => {
    let correlator: InstantCorrelation;

    beforeEach(() => {
      correlator = new InstantCorrelation();
    });

    afterEach(() => {
      correlator.clear();
    });

    it('should create entanglement pairs', () => {
      const pair = correlator.createEntanglementPair(BellStateType.PHI_PLUS);
      
      expect(pair).toBeDefined();
      expect(pair.id).toMatch(/^EPR-/);
      expect(pair.bellState).toBe(BellStateType.PHI_PLUS);
      expect(pair.isConsumed).toBe(false);
      expect(pair.hash).toHaveLength(64);
    });

    it('should create different Bell state types', () => {
      const phiPlus = correlator.createEntanglementPair(BellStateType.PHI_PLUS);
      const phiMinus = correlator.createEntanglementPair(BellStateType.PHI_MINUS);
      const psiPlus = correlator.createEntanglementPair(BellStateType.PSI_PLUS);
      const psiMinus = correlator.createEntanglementPair(BellStateType.PSI_MINUS);
      
      expect(phiPlus.bellState).toBe(BellStateType.PHI_PLUS);
      expect(phiMinus.bellState).toBe(BellStateType.PHI_MINUS);
      expect(psiPlus.bellState).toBe(BellStateType.PSI_PLUS);
      expect(psiMinus.bellState).toBe(BellStateType.PSI_MINUS);
    });

    it('should measure correlated qubits', () => {
      const pair = correlator.createEntanglementPair(BellStateType.PHI_PLUS);
      const result = correlator.measureCorrelation(pair.id);
      
      expect(result.resultA).toBeDefined();
      expect(result.resultB).toBeDefined();
      expect([0, 1]).toContain(result.resultA);
      expect([0, 1]).toContain(result.resultB);
      expect(result.hash).toHaveLength(64);
    });

    it('should show perfect correlation for Φ+ state in Z basis', () => {
      // Run multiple measurements to verify correlation
      let sameCount = 0;
      const trials = 100;
      
      for (let i = 0; i < trials; i++) {
        const pair = correlator.createEntanglementPair(BellStateType.PHI_PLUS);
        const result = correlator.measureCorrelation(pair.id, 'Z', 'Z');
        if (result.resultA === result.resultB) sameCount++;
      }
      
      // Φ+ should always give same results in Z basis
      expect(sameCount).toBe(trials);
    });

    it('should show anti-correlation for Ψ+ state in Z basis', () => {
      // Ψ+ = (|01⟩ + |10⟩)/√2 should give opposite results
      let differentCount = 0;
      const trials = 100;
      
      for (let i = 0; i < trials; i++) {
        const pair = correlator.createEntanglementPair(BellStateType.PSI_PLUS);
        const result = correlator.measureCorrelation(pair.id, 'Z', 'Z');
        if (result.resultA !== result.resultB) differentCount++;
      }
      
      expect(differentCount).toBe(trials);
    });

    it('should mark pair as consumed after measurement', () => {
      const pair = correlator.createEntanglementPair();
      correlator.measureCorrelation(pair.id);
      
      const updatedPair = correlator.getPair(pair.id);
      expect(updatedPair?.isConsumed).toBe(true);
    });

    it('should throw error when measuring consumed pair', () => {
      const pair = correlator.createEntanglementPair();
      correlator.measureCorrelation(pair.id);
      
      expect(() => correlator.measureCorrelation(pair.id)).toThrow('already been consumed');
    });

    it('should throw error for non-existent pair', () => {
      expect(() => correlator.measureCorrelation('non-existent')).toThrow('not found');
    });

    it('should get all pairs', () => {
      correlator.createEntanglementPair();
      correlator.createEntanglementPair();
      correlator.createEntanglementPair();
      
      expect(correlator.getAllPairs()).toHaveLength(3);
    });

    it('should get available (unconsumed) pairs', () => {
      const pair1 = correlator.createEntanglementPair();
      correlator.createEntanglementPair();
      correlator.createEntanglementPair();
      
      correlator.measureCorrelation(pair1.id);
      
      expect(correlator.getAvailablePairs()).toHaveLength(2);
    });

    it('should track correlation history', () => {
      const pair1 = correlator.createEntanglementPair();
      const pair2 = correlator.createEntanglementPair();
      
      correlator.measureCorrelation(pair1.id);
      correlator.measureCorrelation(pair2.id);
      
      const history = correlator.getCorrelationHistory();
      expect(history).toHaveLength(2);
      expect(history[0].pairId).toBe(pair1.id);
      expect(history[1].pairId).toBe(pair2.id);
    });

    it('should calculate correlation coefficient', () => {
      // Create and measure several pairs
      for (let i = 0; i < 10; i++) {
        const pair = correlator.createEntanglementPair(BellStateType.PHI_PLUS);
        correlator.measureCorrelation(pair.id, 'Z', 'Z');
      }
      
      const coefficient = correlator.calculateCorrelationCoefficient();
      // Φ+ in Z basis should give coefficient close to 1
      expect(coefficient).toBe(1);
    });

    it('should clear all data', () => {
      correlator.createEntanglementPair();
      const pair = correlator.createEntanglementPair();
      correlator.measureCorrelation(pair.id);
      
      correlator.clear();
      
      expect(correlator.getAllPairs()).toHaveLength(0);
      expect(correlator.getCorrelationHistory()).toHaveLength(0);
    });
  });

  describe('NonLocalComputation Class', () => {
    let nonLocal: NonLocalComputation;

    beforeEach(() => {
      nonLocal = new NonLocalComputation();
    });

    afterEach(() => {
      nonLocal.clear();
    });

    it('should perform non-local AND computation', () => {
      const result = nonLocal.nonLocalAnd(true, true);
      
      expect(result).toBeDefined();
      expect(result.computation).toBe('Distributed AND');
      expect([0, 1]).toContain(result.result);
      expect(result.hash).toHaveLength(64);
    });

    it('should perform non-local XOR computation', () => {
      const result = nonLocal.nonLocalXor(true, false);
      
      expect(result).toBeDefined();
      expect(result.computation).toBe('Distributed XOR');
      expect([0, 1]).toContain(result.result);
    });

    it('should track correlation strength', () => {
      for (let i = 0; i < 10; i++) {
        nonLocal.nonLocalAnd(Math.random() > 0.5, Math.random() > 0.5);
      }
      
      const history = nonLocal.getHistory();
      expect(history.length).toBe(10);
      
      for (const result of history) {
        expect(result.correlationStrength).toBeGreaterThanOrEqual(0);
        expect(result.correlationStrength).toBeLessThanOrEqual(1);
      }
    });

    it('should provide quantum advantage indicator', () => {
      const result = nonLocal.nonLocalAnd(true, false);
      expect(typeof result.isQuantumAdvantage).toBe('boolean');
    });

    it('should get computation history', () => {
      nonLocal.nonLocalAnd(true, true);
      nonLocal.nonLocalXor(false, true);
      
      const history = nonLocal.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should clear history', () => {
      nonLocal.nonLocalAnd(true, true);
      nonLocal.clear();
      
      expect(nonLocal.getHistory()).toHaveLength(0);
    });
  });

  describe('QuantumShortcut - State Creation', () => {
    it('should create normalized state from amplitudes', () => {
      const state = shortcut.createState([
        new Complex(1, 0),
        new Complex(1, 0)
      ]);
      
      expect(state.isNormalized).toBe(true);
      expect(state.dimension).toBe(2);
      expect(state.hash).toHaveLength(64);
      
      // Check normalization
      let normSquared = 0;
      for (const amp of state.amplitudes) {
        normSquared += amp.real.toNumber() ** 2 + amp.imag.toNumber() ** 2;
      }
      expect(Math.abs(normSquared - 1)).toBeLessThan(1e-10);
    });

    it('should create uniform superposition', () => {
      const state = shortcut.createSuperposition(4);
      
      expect(state.dimension).toBe(4);
      expect(state.isNormalized).toBe(true);
      
      // All amplitudes should be equal
      const expectedAmp = 0.5; // 1/√4 = 0.5
      for (const amp of state.amplitudes) {
        expect(Math.abs(amp.real.toNumber() - expectedAmp)).toBeLessThan(1e-10);
        expect(Math.abs(amp.imag.toNumber())).toBeLessThan(1e-10);
      }
    });

    it('should create computational basis states', () => {
      const state0 = shortcut.createBasisState(0, 4);
      const state3 = shortcut.createBasisState(3, 4);
      
      expect(state0.amplitudes[0].real.toNumber()).toBeCloseTo(1);
      expect(state0.amplitudes[1].real.toNumber()).toBeCloseTo(0);
      
      expect(state3.amplitudes[3].real.toNumber()).toBeCloseTo(1);
      expect(state3.amplitudes[0].real.toNumber()).toBeCloseTo(0);
    });
  });

  describe('QuantumShortcut - Grover Search', () => {
    it('should perform Grover search', () => {
      const result = shortcut.groverSearch(8, 3);
      
      expect(result).toBeDefined();
      expect(result.targetIndex).toBe(3);
      expect(result.probability).toBeGreaterThan(0);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.optimalIterations).toBe(Math.round(Math.PI / 4 * Math.sqrt(8)));
      expect(result.hash).toHaveLength(64);
    });

    it('should find target with high probability using optimal iterations', () => {
      const dimension = 16;
      const targetIndex = 7;
      
      const result = shortcut.groverSearch(dimension, targetIndex);
      
      // With optimal iterations, probability should be high
      expect(result.probability).toBeGreaterThan(0.5);
    });

    it('should calculate optimal iterations as π/4 * √N', () => {
      const dimension = 64;
      const result = shortcut.groverSearch(dimension, 0);
      
      const expectedOptimal = Math.round(Math.PI / 4 * Math.sqrt(dimension));
      expect(result.optimalIterations).toBe(expectedOptimal);
    });

    it('should use custom iteration count when specified', () => {
      const result = shortcut.groverSearch(16, 0, 3);
      expect(result.iterations).toBe(3);
    });

    it('should return final state after search', () => {
      const result = shortcut.groverSearch(8, 5);
      
      expect(result.finalState).toBeDefined();
      expect(result.finalState.dimension).toBe(8);
      expect(result.finalState.isNormalized).toBe(true);
    });

    it('should mark target as found when probability > 0.5', () => {
      // Use optimal iterations for high probability
      const result = shortcut.groverSearch(8, 3);
      
      if (result.probability > 0.5) {
        expect(result.targetFound).toBe(true);
      } else {
        expect(result.targetFound).toBe(false);
      }
    });
  });

  describe('QuantumShortcut - Teleportation', () => {
    it('should teleport a qubit state', () => {
      const inputState = shortcut.createState([
        new Complex(0.6, 0),
        new Complex(0.8, 0)
      ]);
      
      const result = shortcut.teleport(inputState);
      
      expect(result).toBeDefined();
      expect(result.originalState).toBeDefined();
      expect(result.teleportedState).toBeDefined();
      expect(result.bellMeasurement).toHaveLength(2);
      expect(result.classicalBits).toHaveLength(2);
      expect(result.hash).toHaveLength(64);
    });

    it('should achieve high fidelity teleportation', () => {
      const inputState = shortcut.createBasisState(0, 2);
      const result = shortcut.teleport(inputState);
      
      // Perfect teleportation should have fidelity 1
      expect(result.fidelity).toBeGreaterThan(0.99);
      expect(result.success).toBe(true);
    });

    it('should throw error for non-qubit input', () => {
      const state3D = shortcut.createSuperposition(3);
      
      expect(() => shortcut.teleport(state3D)).toThrow('requires a qubit');
    });

    it('should return Bell measurement results', () => {
      const inputState = shortcut.createBasisState(0, 2);
      const result = shortcut.teleport(inputState);
      
      expect([0, 1]).toContain(result.bellMeasurement[0]);
      expect([0, 1]).toContain(result.bellMeasurement[1]);
    });

    it('should return classical bits from Bell measurement', () => {
      const inputState = shortcut.createBasisState(0, 2);
      const result = shortcut.teleport(inputState);
      
      expect(typeof result.classicalBits[0]).toBe('boolean');
      expect(typeof result.classicalBits[1]).toBe('boolean');
    });
  });

  describe('QuantumShortcut - Execute Shortcut', () => {
    it('should execute superposition search shortcut', () => {
      const inputState = shortcut.createSuperposition(8);
      const result = shortcut.executeShortcut(
        ShortcutType.SUPERPOSITION_SEARCH,
        inputState,
        { targetIndex: 3 }
      );
      
      expect(result.success).toBe(true);
      expect(result.shortcutType).toBe(ShortcutType.SUPERPOSITION_SEARCH);
      expect(result.outputState).toBeDefined();
      expect(result.probability).toBeDefined();
    });

    it('should execute quantum teleportation shortcut', () => {
      const inputState = shortcut.createBasisState(0, 2);
      const result = shortcut.executeShortcut(
        ShortcutType.QUANTUM_TELEPORTATION,
        inputState
      );
      
      expect(result.success).toBe(true);
      expect(result.shortcutType).toBe(ShortcutType.QUANTUM_TELEPORTATION);
      expect(result.operationCount).toBe(4);
    });

    it('should execute entanglement transfer shortcut', () => {
      const inputState = shortcut.createBasisState(1, 2);
      const result = shortcut.executeShortcut(
        ShortcutType.ENTANGLEMENT_TRANSFER,
        inputState
      );
      
      expect(result.success).toBe(true);
      expect(result.operationCount).toBe(3);
    });

    it('should execute measurement-based shortcut', () => {
      const inputState = shortcut.createSuperposition(4);
      const result = shortcut.executeShortcut(
        ShortcutType.MEASUREMENT_BASED,
        inputState
      );
      
      expect(result.success).toBe(true);
      expect(result.measurement).toBeDefined();
      expect([0, 1, 2, 3]).toContain(result.measurement);
    });

    it('should track execution time', () => {
      const inputState = shortcut.createSuperposition(8);
      const result = shortcut.executeShortcut(
        ShortcutType.SUPERPOSITION_SEARCH,
        inputState,
        { targetIndex: 0 }
      );
      
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should store shortcut results', () => {
      const inputState = shortcut.createBasisState(0, 2);
      
      shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      shortcut.executeShortcut(ShortcutType.ENTANGLEMENT_TRANSFER, inputState);
      
      const shortcuts = shortcut.getShortcuts();
      expect(shortcuts).toHaveLength(2);
    });

    it('should generate unique hashes for shortcuts', () => {
      const inputState = shortcut.createBasisState(0, 2);
      
      const result1 = shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      const result2 = shortcut.executeShortcut(ShortcutType.ENTANGLEMENT_TRANSFER, inputState);
      
      expect(result1.hash).not.toBe(result2.hash);
    });
  });

  describe('QuantumShortcut - Oracles', () => {
    it('should register an oracle', () => {
      const oracle = shortcut.registerOracle('test_oracle', [0, 3], 8);
      
      expect(oracle.name).toBe('test_oracle');
      expect(oracle.targetStates).toEqual([0, 3]);
      expect(oracle.isPhaseOracle).toBe(true);
      expect(oracle.hash).toHaveLength(64);
    });

    it('should create correct oracle matrix', () => {
      const oracle = shortcut.registerOracle('single', [1], 4);
      
      // Target state should have -1, others should have 1
      expect(oracle.oracleMatrix[0][0].real.toNumber()).toBe(1);
      expect(oracle.oracleMatrix[1][1].real.toNumber()).toBe(-1);
      expect(oracle.oracleMatrix[2][2].real.toNumber()).toBe(1);
      expect(oracle.oracleMatrix[3][3].real.toNumber()).toBe(1);
    });

    it('should get oracle by name', () => {
      shortcut.registerOracle('my_oracle', [2], 8);
      
      const oracle = shortcut.getOracle('my_oracle');
      expect(oracle).toBeDefined();
      expect(oracle?.targetStates).toEqual([2]);
    });

    it('should return undefined for non-existent oracle', () => {
      const oracle = shortcut.getOracle('non_existent');
      expect(oracle).toBeUndefined();
    });
  });

  describe('QuantumShortcut - Statistics', () => {
    it('should provide statistics', () => {
      const inputState = shortcut.createBasisState(0, 2);
      
      shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      shortcut.executeShortcut(ShortcutType.ENTANGLEMENT_TRANSFER, inputState);
      
      const stats = shortcut.getStatistics();
      
      expect(stats.totalShortcuts).toBe(2);
      expect(stats.byType[ShortcutType.MEASUREMENT_BASED]).toBe(1);
      expect(stats.byType[ShortcutType.ENTANGLEMENT_TRANSFER]).toBe(1);
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBe(1);
    });

    it('should get shortcuts by type', () => {
      const inputState = shortcut.createBasisState(0, 2);
      
      shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      shortcut.executeShortcut(ShortcutType.ENTANGLEMENT_TRANSFER, inputState);
      
      const measurementShortcuts = shortcut.getShortcutsByType(ShortcutType.MEASUREMENT_BASED);
      expect(measurementShortcuts).toHaveLength(2);
    });
  });

  describe('QuantumShortcut - Export and Hash', () => {
    it('should export to JSON', () => {
      const inputState = shortcut.createBasisState(0, 2);
      shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      shortcut.registerOracle('test', [0], 4);
      
      const json = shortcut.exportToJson();
      const parsed = JSON.parse(json);
      
      expect(parsed.shortcuts).toBeDefined();
      expect(parsed.oracles).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.exportTimestamp).toBeDefined();
    });

    it('should generate proof chain hash', () => {
      const inputState = shortcut.createBasisState(0, 2);
      shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      shortcut.registerOracle('test', [0], 4);
      
      const hash = shortcut.getProofChainHash();
      expect(hash).toHaveLength(64);
    });

    it('should clear all data', () => {
      const inputState = shortcut.createBasisState(0, 2);
      shortcut.executeShortcut(ShortcutType.MEASUREMENT_BASED, inputState);
      shortcut.registerOracle('test', [0], 4);
      
      shortcut.clear();
      
      expect(shortcut.getShortcuts()).toHaveLength(0);
      expect(shortcut.getOracle('test')).toBeUndefined();
    });
  });

  describe('QuantumShortcutFactory', () => {
    it('should create shortcut without logger', () => {
      const newShortcut = QuantumShortcutFactory.create();
      expect(newShortcut).toBeInstanceOf(QuantumShortcut);
    });

    it('should create shortcut with logger', () => {
      const newShortcut = QuantumShortcutFactory.create(logger);
      expect(newShortcut).toBeInstanceOf(QuantumShortcut);
    });

    it('should create shortcut with pre-registered oracles', () => {
      const newShortcut = QuantumShortcutFactory.createWithOracles(logger);
      
      expect(newShortcut.getOracle('single_target')).toBeDefined();
      expect(newShortcut.getOracle('two_targets')).toBeDefined();
      expect(newShortcut.getOracle('half_targets')).toBeDefined();
    });
  });

  describe('Hash Verification', () => {
    it('should generate different hashes for different states', () => {
      const state1 = shortcut.createBasisState(0, 4);
      const state2 = shortcut.createBasisState(1, 4);
      
      expect(state1.hash).not.toBe(state2.hash);
    });

    it('should generate consistent hashes for same state', () => {
      const state1 = shortcut.createBasisState(0, 2);
      const state2 = shortcut.createBasisState(0, 2);
      
      expect(state1.hash).toBe(state2.hash);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single element dimension', () => {
      const state = shortcut.createSuperposition(1);
      expect(state.dimension).toBe(1);
      expect(state.amplitudes[0].real.toNumber()).toBeCloseTo(1);
    });

    it('should handle large dimensions', () => {
      const state = shortcut.createSuperposition(1024);
      expect(state.dimension).toBe(1024);
      expect(state.isNormalized).toBe(true);
    });

    it('should handle complex amplitudes', () => {
      const state = shortcut.createState([
        new Complex(0.5, 0.5),
        new Complex(0.5, -0.5)
      ]);
      
      expect(state.isNormalized).toBe(true);
    });

    it('should handle zero amplitude states', () => {
      const state = shortcut.createState([
        new Complex(1, 0),
        new Complex(0, 0),
        new Complex(0, 0),
        new Complex(0, 0)
      ]);
      
      expect(state.dimension).toBe(4);
      expect(state.amplitudes[0].real.toNumber()).toBe(1);
    });
  });
});
