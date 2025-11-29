/**
 * Qlaws Ham - Qubit Module Tests (M08.01)
 * 
 * Comprehensive tests for qubit simulation.
 * 
 * @module Qubit.test
 * @version 1.0.0
 */

import {
  Qubit,
  QubitState,
  MultiQubitState,
  BlochSphere,
  QubitRegister,
  QubitFactory,
  BlochCoordinates,
  MeasurementResult,
  MultiQubitMeasurement
} from '../../../src/qcomputing/qubit/Qubit';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';
import { Complex } from '../../../src/core/math/Complex';

describe('Qubit Module (M08.01)', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    Qubit.setLogger(logger);
    Qubit.resetCounter();
  });

  afterEach(() => {
    Logger.resetInstance();
  });

  describe('QubitState Class', () => {
    it('should create |0⟩ state correctly', () => {
      const state = QubitState.zero();
      expect(state.getAlpha().real.toNumber()).toBeCloseTo(1);
      expect(state.getAlpha().imag.toNumber()).toBeCloseTo(0);
      expect(state.getBeta().real.toNumber()).toBeCloseTo(0);
      expect(state.getBeta().imag.toNumber()).toBeCloseTo(0);
    });

    it('should create |1⟩ state correctly', () => {
      const state = QubitState.one();
      expect(state.getAlpha().real.toNumber()).toBeCloseTo(0);
      expect(state.getBeta().real.toNumber()).toBeCloseTo(1);
    });

    it('should create |+⟩ state correctly', () => {
      const state = QubitState.plus();
      const sqrt2Inv = 1 / Math.sqrt(2);
      expect(state.getAlpha().real.toNumber()).toBeCloseTo(sqrt2Inv);
      expect(state.getBeta().real.toNumber()).toBeCloseTo(sqrt2Inv);
    });

    it('should create |-⟩ state correctly', () => {
      const state = QubitState.minus();
      const sqrt2Inv = 1 / Math.sqrt(2);
      expect(state.getAlpha().real.toNumber()).toBeCloseTo(sqrt2Inv);
      expect(state.getBeta().real.toNumber()).toBeCloseTo(-sqrt2Inv);
    });

    it('should create state from Bloch angles', () => {
      // |0⟩ is at north pole (theta=0)
      const state0 = QubitState.fromBloch(0, 0);
      expect(state0.fidelity(QubitState.zero())).toBeCloseTo(1);
      
      // |1⟩ is at south pole (theta=π)
      const state1 = QubitState.fromBloch(Math.PI, 0);
      expect(state1.fidelity(QubitState.one())).toBeCloseTo(1);
    });

    it('should be normalized', () => {
      const state = QubitState.plus();
      expect(state.isNormalized()).toBe(true);
    });

    it('should calculate probabilities correctly for |0⟩', () => {
      const state = QubitState.zero();
      expect(state.probabilityZero()).toBeCloseTo(1);
      expect(state.probabilityOne()).toBeCloseTo(0);
    });

    it('should calculate probabilities correctly for |+⟩', () => {
      const state = QubitState.plus();
      expect(state.probabilityZero()).toBeCloseTo(0.5);
      expect(state.probabilityOne()).toBeCloseTo(0.5);
    });

    it('should perform measurement', () => {
      const state = QubitState.zero();
      const result = state.measure();
      expect(result.outcome).toBe(0);
      expect(result.probability).toBeCloseTo(1);
      expect(result.hash).toBeDefined();
    });

    it('should convert to Bloch coordinates', () => {
      const state0 = QubitState.zero();
      const bloch = state0.toBloch();
      expect(bloch.z).toBeCloseTo(1);
      expect(bloch.x).toBeCloseTo(0);
      expect(bloch.y).toBeCloseTo(0);
    });

    it('should calculate fidelity correctly', () => {
      const state1 = QubitState.zero();
      const state2 = QubitState.zero();
      expect(state1.fidelity(state2)).toBeCloseTo(1);
      
      const state3 = QubitState.one();
      expect(state1.fidelity(state3)).toBeCloseTo(0);
    });

    it('should check equality correctly', () => {
      const state1 = QubitState.plus();
      const state2 = QubitState.plus();
      expect(state1.equals(state2)).toBe(true);
    });

    it('should clone correctly', () => {
      const state = QubitState.plus();
      const clone = state.clone();
      expect(state.equals(clone)).toBe(true);
    });

    it('should generate hash', () => {
      const state = QubitState.zero();
      expect(state.getHash()).toBeDefined();
      expect(state.getHash().length).toBeGreaterThan(0);
    });

    it('should convert to string', () => {
      const state = QubitState.zero();
      const str = state.toString();
      expect(str).toContain('|0⟩');
    });

    it('should convert to density matrix', () => {
      const state = QubitState.zero();
      const rho = state.toDensityMatrix();
      expect(rho[0][0].real.toNumber()).toBeCloseTo(1);
      expect(rho[1][1].real.toNumber()).toBeCloseTo(0);
    });

    it('should create random states on Bloch sphere', () => {
      const states = Array(10).fill(null).map(() => QubitState.random());
      states.forEach(s => {
        expect(s.isNormalized()).toBe(true);
      });
    });

    it('should create |+i⟩ state correctly', () => {
      const state = QubitState.plusI();
      expect(state.isNormalized()).toBe(true);
      const bloch = state.toBloch();
      expect(bloch.y).toBeCloseTo(1, 1);
    });

    it('should create |-i⟩ state correctly', () => {
      const state = QubitState.minusI();
      expect(state.isNormalized()).toBe(true);
    });
  });

  describe('MultiQubitState Class', () => {
    it('should create |00⟩ state correctly', () => {
      const state = MultiQubitState.zeros(2);
      expect(state.getNumQubits()).toBe(2);
      expect(state.getAmplitude(0).real.toNumber()).toBeCloseTo(1);
    });

    it('should create state from tensor product', () => {
      const q0 = QubitState.zero();
      const q1 = QubitState.zero();
      const state = MultiQubitState.tensorProduct(q0, q1);
      expect(state.getNumQubits()).toBe(2);
      expect(state.getAmplitude(0).real.toNumber()).toBeCloseTo(1);
    });

    it('should create Bell state |Φ+⟩ correctly', () => {
      const bell = MultiQubitState.bellPhiPlus();
      expect(bell.getNumQubits()).toBe(2);
      expect(bell.probability(0)).toBeCloseTo(0.5); // |00⟩
      expect(bell.probability(1)).toBeCloseTo(0);   // |01⟩
      expect(bell.probability(2)).toBeCloseTo(0);   // |10⟩
      expect(bell.probability(3)).toBeCloseTo(0.5); // |11⟩
    });

    it('should create Bell state |Φ-⟩ correctly', () => {
      const bell = MultiQubitState.bellPhiMinus();
      expect(bell.probability(0)).toBeCloseTo(0.5);
      expect(bell.probability(3)).toBeCloseTo(0.5);
    });

    it('should create Bell state |Ψ+⟩ correctly', () => {
      const bell = MultiQubitState.bellPsiPlus();
      expect(bell.probability(1)).toBeCloseTo(0.5); // |01⟩
      expect(bell.probability(2)).toBeCloseTo(0.5); // |10⟩
    });

    it('should create Bell state |Ψ-⟩ correctly', () => {
      const bell = MultiQubitState.bellPsiMinus();
      expect(bell.probability(1)).toBeCloseTo(0.5);
      expect(bell.probability(2)).toBeCloseTo(0.5);
    });

    it('should create GHZ state correctly', () => {
      const ghz = MultiQubitState.ghz(3);
      expect(ghz.getNumQubits()).toBe(3);
      expect(ghz.probability(0)).toBeCloseTo(0.5); // |000⟩
      expect(ghz.probability(7)).toBeCloseTo(0.5); // |111⟩
    });

    it('should create W state correctly', () => {
      const w = MultiQubitState.w(3);
      expect(w.getNumQubits()).toBe(3);
      // W state has equal probability for |100⟩, |010⟩, |001⟩
      expect(w.probability(4)).toBeCloseTo(1/3); // |100⟩
      expect(w.probability(2)).toBeCloseTo(1/3); // |010⟩
      expect(w.probability(1)).toBeCloseTo(1/3); // |001⟩
    });

    it('should be normalized', () => {
      const state = MultiQubitState.bellPhiPlus();
      expect(state.isNormalized()).toBe(true);
    });

    it('should get all probabilities', () => {
      const state = MultiQubitState.zeros(2);
      const probs = state.probabilities();
      expect(probs.length).toBe(4);
      expect(probs[0]).toBeCloseTo(1);
      expect(probs.slice(1).every(p => Math.abs(p) < 1e-10)).toBe(true);
    });

    it('should perform measurement', () => {
      const state = MultiQubitState.zeros(2);
      const result = state.measure();
      expect(result.outcome).toBe(0);
      expect(result.bitString).toBe('00');
      expect(result.hash).toBeDefined();
    });

    it('should perform partial measurement', () => {
      const state = MultiQubitState.zeros(2);
      const result = state.measureQubit(0);
      expect(result.outcome).toBe(0);
      expect(result.probability).toBeCloseTo(1);
    });

    it('should calculate fidelity', () => {
      const state1 = MultiQubitState.bellPhiPlus();
      const state2 = MultiQubitState.bellPhiPlus();
      expect(state1.fidelity(state2)).toBeCloseTo(1);
    });

    it('should detect entanglement in Bell states', () => {
      const bell = MultiQubitState.bellPhiPlus();
      expect(bell.isSeparable()).toBe(false);
    });

    it('should detect separability in product states', () => {
      const product = MultiQubitState.tensorProduct(
        QubitState.zero(),
        QubitState.zero()
      );
      expect(product.isSeparable()).toBe(true);
    });

    it('should calculate reduced density matrix', () => {
      const bell = MultiQubitState.bellPhiPlus();
      const rho = bell.reducedDensityMatrix([0]);
      // Reduced density matrix of Bell state should be maximally mixed
      expect(rho[0][0].real.toNumber()).toBeCloseTo(0.5);
      expect(rho[1][1].real.toNumber()).toBeCloseTo(0.5);
    });

    it('should calculate entanglement entropy', () => {
      const bell = MultiQubitState.bellPhiPlus();
      const entropy = bell.entanglementEntropy([0]);
      // Maximally entangled state has entropy = 1
      expect(entropy).toBeCloseTo(1);
    });

    it('should clone correctly', () => {
      const state = MultiQubitState.ghz(3);
      const clone = state.clone();
      expect(state.fidelity(clone)).toBeCloseTo(1);
    });

    it('should generate hash', () => {
      const state = MultiQubitState.bellPhiPlus();
      expect(state.getHash()).toBeDefined();
    });

    it('should convert to string', () => {
      const state = MultiQubitState.zeros(2);
      const str = state.toString();
      expect(str).toContain('|00⟩');
    });

    it('should throw for invalid amplitude count', () => {
      expect(() => new MultiQubitState([Complex.one(), Complex.zero(), Complex.zero()])).toThrow();
    });
  });

  describe('BlochSphere Class', () => {
    it('should convert coordinates to state', () => {
      const state = BlochSphere.toState(0, 0);
      expect(state.fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should convert state to coordinates', () => {
      const coords = BlochSphere.fromState(QubitState.zero());
      expect(coords.z).toBeCloseTo(1);
    });

    it('should calculate distance between points', () => {
      const c1: BlochCoordinates = { theta: 0, phi: 0, x: 0, y: 0, z: 1 };
      const c2: BlochCoordinates = { theta: Math.PI, phi: 0, x: 0, y: 0, z: -1 };
      expect(BlochSphere.distance(c1, c2)).toBeCloseTo(2);
    });

    it('should provide basis states', () => {
      const basis = BlochSphere.basisStates();
      expect(basis.size).toBe(6);
      expect(basis.has('|0⟩')).toBe(true);
      expect(basis.has('|1⟩')).toBe(true);
    });

    it('should generate hash for coordinates', () => {
      const coords: BlochCoordinates = { theta: 0, phi: 0, x: 0, y: 0, z: 1 };
      expect(BlochSphere.getHash(coords)).toBeDefined();
    });
  });

  describe('Qubit Class', () => {
    it('should create qubit in |0⟩ state', () => {
      const qubit = Qubit.zero();
      expect(qubit.getState().fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should create qubit in |1⟩ state', () => {
      const qubit = Qubit.one();
      expect(qubit.getState().fidelity(QubitState.one())).toBeCloseTo(1);
    });

    it('should create qubit in |+⟩ state', () => {
      const qubit = Qubit.plus();
      expect(qubit.getState().fidelity(QubitState.plus())).toBeCloseTo(1);
    });

    it('should create qubit in |-⟩ state', () => {
      const qubit = Qubit.minus();
      expect(qubit.getState().fidelity(QubitState.minus())).toBeCloseTo(1);
    });

    it('should create qubit from Bloch angles', () => {
      const qubit = Qubit.fromBloch(0, 0);
      expect(qubit.getState().fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should create random qubit', () => {
      const qubit = Qubit.random();
      expect(qubit.getState().isNormalized()).toBe(true);
    });

    it('should have unique IDs', () => {
      Qubit.resetCounter();
      const q1 = Qubit.zero();
      const q2 = Qubit.zero();
      expect(q1.getId()).not.toBe(q2.getId());
    });

    it('should get and set labels', () => {
      const qubit = Qubit.zero({ label: 'test' });
      expect(qubit.getLabel()).toBe('test');
      qubit.setLabel('new');
      expect(qubit.getLabel()).toBe('new');
    });

    it('should set state', () => {
      const qubit = Qubit.zero();
      qubit.setState(QubitState.one());
      expect(qubit.getState().fidelity(QubitState.one())).toBeCloseTo(1);
    });

    it('should convert to Bloch coordinates', () => {
      const qubit = Qubit.zero();
      const bloch = qubit.toBloch();
      expect(bloch.z).toBeCloseTo(1);
    });

    it('should measure and collapse', () => {
      const qubit = Qubit.zero();
      const result = qubit.measure();
      expect(result.outcome).toBe(0);
      // After measurement, state should be collapsed
      expect(qubit.getState().fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should reset to |0⟩', () => {
      const qubit = Qubit.one();
      qubit.reset();
      expect(qubit.getState().fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should clone correctly', () => {
      const qubit = Qubit.plus();
      const clone = qubit.clone();
      expect(qubit.getState().fidelity(clone.getState())).toBeCloseTo(1);
      expect(qubit.getId()).not.toBe(clone.getId());
    });

    it('should generate hash', () => {
      const qubit = Qubit.zero();
      expect(qubit.getHash()).toBeDefined();
    });

    it('should convert to string', () => {
      const qubit = Qubit.zero();
      const str = qubit.toString();
      expect(str).toContain('|0⟩');
    });
  });

  describe('QubitRegister Class', () => {
    it('should create register with specified size', () => {
      const reg = new QubitRegister(3);
      expect(reg.size()).toBe(3);
    });

    it('should get qubit by index', () => {
      const reg = new QubitRegister(2);
      const qubit = reg.get(0);
      expect(qubit).toBeDefined();
      expect(qubit.getState().fidelity(QubitState.zero())).toBeCloseTo(1);
    });

    it('should throw for invalid index', () => {
      const reg = new QubitRegister(2);
      expect(() => reg.get(5)).toThrow();
    });

    it('should get all qubits', () => {
      const reg = new QubitRegister(3);
      expect(reg.getQubits().length).toBe(3);
    });

    it('should get combined state', () => {
      const reg = new QubitRegister(2);
      const state = reg.getCombinedState();
      expect(state.getNumQubits()).toBe(2);
    });

    it('should measure all qubits', () => {
      const reg = new QubitRegister(2);
      const results = reg.measureAll();
      expect(results.length).toBe(2);
      results.forEach(r => expect(r.outcome).toBe(0));
    });

    it('should reset all qubits', () => {
      const reg = new QubitRegister(2);
      reg.get(0).setState(QubitState.one());
      reg.reset();
      reg.getQubits().forEach(q => {
        expect(q.getState().fidelity(QubitState.zero())).toBeCloseTo(1);
      });
    });

    it('should get label', () => {
      const reg = new QubitRegister(2, 'test');
      expect(reg.getLabel()).toBe('test');
    });

    it('should generate hash', () => {
      const reg = new QubitRegister(2);
      expect(reg.getHash()).toBeDefined();
    });

    it('should convert to string', () => {
      const reg = new QubitRegister(2);
      expect(reg.toString()).toContain('[2]');
    });
  });

  describe('QubitFactory Class', () => {
    it('should create computational basis qubits', () => {
      const q0 = QubitFactory.computational(0);
      const q1 = QubitFactory.computational(1);
      expect(q0.getState().fidelity(QubitState.zero())).toBeCloseTo(1);
      expect(q1.getState().fidelity(QubitState.one())).toBeCloseTo(1);
    });

    it('should create Bell pair', () => {
      const [q1, q2, state] = QubitFactory.bellPair();
      expect(q1).toBeDefined();
      expect(q2).toBeDefined();
      expect(state.getNumQubits()).toBe(2);
      expect(state.isSeparable()).toBe(false);
    });

    it('should create GHZ qubits', () => {
      const { qubits, state } = QubitFactory.ghzQubits(3);
      expect(qubits.length).toBe(3);
      expect(state.getNumQubits()).toBe(3);
      expect(state.probability(0)).toBeCloseTo(0.5);
      expect(state.probability(7)).toBeCloseTo(0.5);
    });

    it('should create W qubits', () => {
      const { qubits, state } = QubitFactory.wQubits(3);
      expect(qubits.length).toBe(3);
      expect(state.getNumQubits()).toBe(3);
    });

    it('should create qubit register', () => {
      const reg = QubitFactory.register(4, 'qreg');
      expect(reg.size()).toBe(4);
      expect(reg.getLabel()).toBe('qreg');
    });
  });

  describe('Integration Tests', () => {
    it('should maintain normalization through operations', () => {
      const state = QubitState.random();
      expect(state.isNormalized()).toBe(true);
      
      const clone = state.clone();
      expect(clone.isNormalized()).toBe(true);
    });

    it('should correctly model quantum measurement statistics', () => {
      // Test |+⟩ state measurement distribution
      let zeros = 0;
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const state = QubitState.plus();
        const result = state.measure();
        if (result.outcome === 0) zeros++;
      }
      
      // Should be approximately 50% zeros
      const zeroRatio = zeros / iterations;
      expect(zeroRatio).toBeGreaterThan(0.4);
      expect(zeroRatio).toBeLessThan(0.6);
    });

    it('should preserve Bell state correlations', () => {
      const bell = MultiQubitState.bellPhiPlus();
      
      // Measure both qubits many times
      let correlations = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const result = bell.clone().measure();
        const bits = result.bitString;
        // In |Φ+⟩, both qubits should always match
        if (bits[0] === bits[1]) correlations++;
      }
      
      expect(correlations).toBe(iterations);
    });

    it('should correctly calculate entropy for product states', () => {
      const product = MultiQubitState.tensorProduct(
        QubitState.zero(),
        QubitState.zero()
      );
      const entropy = product.entanglementEntropy([0]);
      expect(entropy).toBeCloseTo(0);
    });
  });
});
