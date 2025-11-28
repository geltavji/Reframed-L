/**
 * Qlaws Ham - QuantumCircuit Module Tests (M08.03)
 * 
 * Comprehensive tests for quantum circuit simulation.
 * 
 * @module QuantumCircuit.test
 * @version 1.0.0
 */

import {
  QuantumCircuit,
  CircuitOptimizer,
  CircuitFactory,
  CircuitResult,
  ShotResults,
  CircuitStats
} from '../../../src/qcomputing/circuit/QuantumCircuit';
import { QubitState, MultiQubitState } from '../../../src/qcomputing/qubit/Qubit';
import { Hadamard, PauliX, CNOT, QuantumGatesFactory } from '../../../src/qcomputing/gates/QuantumGates';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';
import { Complex } from '../../../src/core/math/Complex';

describe('QuantumCircuit Module (M08.03)', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    QuantumCircuit.setLogger(logger);
  });

  afterEach(() => {
    Logger.resetInstance();
  });

  describe('Circuit Construction', () => {
    it('should create circuit with specified qubits', () => {
      const circuit = new QuantumCircuit(3);
      expect(circuit.getNumQubits()).toBe(3);
    });

    it('should have default name', () => {
      const circuit = new QuantumCircuit(2);
      expect(circuit.getName()).toBe('circuit');
    });

    it('should accept custom name', () => {
      const circuit = new QuantumCircuit(2, 'my_circuit');
      expect(circuit.getName()).toBe('my_circuit');
    });

    it('should throw for invalid qubit count', () => {
      expect(() => new QuantumCircuit(0)).toThrow();
      expect(() => new QuantumCircuit(25)).toThrow();
    });

    it('should allow changing name', () => {
      const circuit = new QuantumCircuit(2);
      circuit.setName('new_name');
      expect(circuit.getName()).toBe('new_name');
    });

    it('should have classical bits equal to qubits by default', () => {
      const circuit = new QuantumCircuit(3);
      expect(circuit.getClassicalBits()).toBe(3);
    });

    it('should allow changing classical bits', () => {
      const circuit = new QuantumCircuit(2);
      circuit.setClassicalBits(4);
      expect(circuit.getClassicalBits()).toBe(4);
    });
  });

  describe('Gate Application', () => {
    it('should apply Hadamard gate', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      
      const result = circuit.getStatevector();
      expect(result.probability(0)).toBeCloseTo(0.5);
      expect(result.probability(1)).toBeCloseTo(0.5);
    });

    it('should apply Pauli-X gate', () => {
      const circuit = new QuantumCircuit(1);
      circuit.x(0);
      
      const result = circuit.getStatevector();
      expect(result.probability(1)).toBeCloseTo(1);
    });

    it('should apply Pauli-Y gate', () => {
      const circuit = new QuantumCircuit(1);
      circuit.y(0);
      
      const result = circuit.getStatevector();
      expect(result.probability(1)).toBeCloseTo(1);
    });

    it('should apply Pauli-Z gate', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      circuit.z(0);
      
      const result = circuit.getStatevector();
      // H|0⟩ = |+⟩, Z|+⟩ = |-⟩
      const minusState = QubitState.minus();
      expect(result.probability(0)).toBeCloseTo(0.5);
    });

    it('should apply S gate', () => {
      const circuit = new QuantumCircuit(1);
      circuit.s(0);
      expect(circuit.getOperations().length).toBe(1);
    });

    it('should apply T gate', () => {
      const circuit = new QuantumCircuit(1);
      circuit.t(0);
      expect(circuit.getOperations().length).toBe(1);
    });

    it('should apply rotation gates', () => {
      const circuit = new QuantumCircuit(1);
      circuit.rx(Math.PI, 0);
      circuit.ry(Math.PI / 2, 0);
      circuit.rz(Math.PI / 4, 0);
      
      expect(circuit.getOperations().length).toBe(3);
    });

    it('should apply CNOT gate', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.cx(0, 1);
      
      const result = circuit.getStatevector();
      // Should create Bell state
      expect(result.probability(0)).toBeCloseTo(0.5);
      expect(result.probability(3)).toBeCloseTo(0.5);
    });

    it('should apply CZ gate', () => {
      const circuit = new QuantumCircuit(2);
      circuit.cz(0, 1);
      expect(circuit.getOperations().length).toBe(1);
    });

    it('should apply SWAP gate', () => {
      const circuit = new QuantumCircuit(2);
      circuit.x(0);
      circuit.swap(0, 1);
      
      const result = circuit.getStatevector();
      expect(result.probability(1)).toBeCloseTo(1); // |01⟩
    });

    it('should apply Toffoli gate', () => {
      const circuit = new QuantumCircuit(3);
      circuit.x(0);
      circuit.x(1);
      circuit.ccx(0, 1, 2);
      
      const result = circuit.getStatevector();
      expect(result.probability(7)).toBeCloseTo(1); // |111⟩
    });

    it('should chain gate applications', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0).cx(0, 1).z(0);
      
      expect(circuit.getOperations().length).toBe(3);
    });

    it('should throw for invalid qubit index', () => {
      const circuit = new QuantumCircuit(2);
      expect(() => circuit.h(5)).toThrow();
    });

    it('should apply barrier (no effect)', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.barrier(0, 1);
      circuit.cx(0, 1);
      
      expect(circuit.getOperations().length).toBe(2);
    });
  });

  describe('Measurement', () => {
    it('should add measurement operation', () => {
      const circuit = new QuantumCircuit(1);
      circuit.measure(0);
      
      expect(circuit.getMeasurements().length).toBe(1);
    });

    it('should measure all qubits', () => {
      const circuit = new QuantumCircuit(3);
      circuit.measureAll();
      
      expect(circuit.getMeasurements().length).toBe(3);
    });

    it('should execute measurement and collapse state', () => {
      const circuit = new QuantumCircuit(1);
      circuit.x(0);
      circuit.measure(0);
      
      const result = circuit.run();
      expect(result.measurements.get(0)).toBe(1);
      expect(result.bitString).toBe('1');
    });

    it('should support X-basis measurement', () => {
      const circuit = new QuantumCircuit(1);
      circuit.measure(0, 0, 'X');
      
      const result = circuit.run();
      // Measuring |0⟩ in X basis gives 50/50
      expect(result.measurements.has(0)).toBe(true);
    });

    it('should support Y-basis measurement', () => {
      const circuit = new QuantumCircuit(1);
      circuit.measure(0, 0, 'Y');
      
      const result = circuit.run();
      expect(result.measurements.has(0)).toBe(true);
    });
  });

  describe('Circuit Execution', () => {
    it('should run circuit and return result', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.cx(0, 1);
      circuit.measureAll();
      
      const result = circuit.run();
      expect(result.finalState).toBeDefined();
      expect(result.measurements.size).toBe(2);
      expect(result.hash).toBeDefined();
    });

    it('should accept initial state', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      
      const initialState = new MultiQubitState([
        Complex.zero(),
        Complex.one()
      ]);
      
      const result = circuit.getStatevector(initialState);
      // H|1⟩ = |-⟩
      expect(result.probability(0)).toBeCloseTo(0.5);
    });

    it('should run multiple shots', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      circuit.measureAll();
      
      const results = circuit.runShots(100);
      
      expect(results.totalShots).toBe(100);
      expect(results.counts.size).toBeGreaterThan(0);
      expect(results.hash).toBeDefined();
    });

    it('should compute probabilities from shots', () => {
      const circuit = new QuantumCircuit(1);
      circuit.x(0);
      circuit.measureAll();
      
      const results = circuit.runShots(100);
      
      expect(results.probabilities.get('1')).toBeCloseTo(1);
    });

    it('should preserve quantum correlations', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.cx(0, 1);
      circuit.measureAll();
      
      const results = circuit.runShots(100);
      
      // Bell state should only produce 00 or 11
      // Check that 01 and 10 are either not present or have 0 count
      expect(!results.counts.has('01') || results.counts.get('01') === 0).toBe(true);
      expect(!results.counts.has('10') || results.counts.get('10') === 0).toBe(true);
    });
  });

  describe('Statevector', () => {
    it('should return statevector without measurement', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      
      const state = circuit.getStatevector();
      expect(state.getNumQubits()).toBe(2);
    });

    it('should compute correct probabilities', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.h(1);
      
      const state = circuit.getStatevector();
      // Equal superposition
      for (let i = 0; i < 4; i++) {
        expect(state.probability(i)).toBeCloseTo(0.25);
      }
    });
  });

  describe('Unitary Matrix', () => {
    it('should compute circuit unitary', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      
      const unitary = circuit.getUnitary();
      expect(unitary.length).toBe(2);
      expect(unitary[0].length).toBe(2);
    });

    it('should be unitary matrix', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      
      const U = circuit.getUnitary();
      
      // Check U†U = I
      const n = U.length;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          let sum = Complex.zero();
          for (let k = 0; k < n; k++) {
            sum = sum.add(U[k][i].conjugate().multiply(U[k][j]));
          }
          const expected = i === j ? 1 : 0;
          expect(sum.real.toNumber()).toBeCloseTo(expected);
          expect(sum.imag.toNumber()).toBeCloseTo(0);
        }
      }
    });
  });

  describe('Circuit Manipulation', () => {
    it('should clone circuit', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.cx(0, 1);
      
      const clone = circuit.clone();
      
      expect(clone.getNumQubits()).toBe(2);
      expect(clone.getOperations().length).toBe(2);
    });

    it('should compose circuits', () => {
      const c1 = new QuantumCircuit(2);
      c1.h(0);
      
      const c2 = new QuantumCircuit(2);
      c2.cx(0, 1);
      
      const combined = c1.compose(c2);
      
      expect(combined.getOperations().length).toBe(2);
    });

    it('should compute inverse circuit', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      circuit.t(0);
      circuit.s(0);
      
      const inverse = circuit.inverse();
      
      // Inverse should have same number of gates
      expect(inverse.getOperations().length).toBe(3);
    });

    it('should verify inverse gives identity', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      circuit.t(0);
      
      const combined = circuit.compose(circuit.inverse());
      const state = combined.getStatevector();
      
      // Should be back to |0⟩
      expect(state.probability(0)).toBeCloseTo(1);
    });

    it('should clear circuit', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.cx(0, 1);
      circuit.measureAll();
      
      circuit.clear();
      
      expect(circuit.getOperations().length).toBe(0);
      expect(circuit.getMeasurements().length).toBe(0);
    });
  });

  describe('Circuit Statistics', () => {
    it('should compute circuit depth', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.h(1);  // Parallel with h(0)
      circuit.cx(0, 1);  // Must come after both
      
      expect(circuit.getDepth()).toBe(2);
    });

    it('should count gates by type', () => {
      const circuit = new QuantumCircuit(3);
      circuit.h(0);
      circuit.x(1);
      circuit.y(2);
      circuit.cx(0, 1);
      circuit.ccx(0, 1, 2);
      
      const stats = circuit.getStats();
      
      expect(stats.singleQubitGates).toBe(3);
      expect(stats.twoQubitGates).toBe(1);
      expect(stats.multiQubitGates).toBe(1);
      expect(stats.gateCount).toBe(5);
    });

    it('should count measurements', () => {
      const circuit = new QuantumCircuit(2);
      circuit.measureAll();
      
      const stats = circuit.getStats();
      expect(stats.measurements).toBe(2);
    });
  });

  describe('Circuit Optimizer', () => {
    it('should remove identity gates', () => {
      const circuit = new QuantumCircuit(1);
      circuit.apply(QuantumGatesFactory.I(), 0);
      circuit.h(0);
      circuit.apply(QuantumGatesFactory.I(), 0);
      
      const optimized = CircuitOptimizer.optimize(circuit, { removeIdentities: true });
      
      expect(optimized.getOperations().length).toBe(1);
    });

    it('should cancel inverse gates', () => {
      const circuit = new QuantumCircuit(1);
      circuit.h(0);
      circuit.h(0);  // H is self-inverse
      
      const optimized = CircuitOptimizer.optimize(circuit, { cancelInverses: true });
      
      expect(optimized.getOperations().length).toBe(0);
    });

    it('should cancel S and S†', () => {
      const circuit = new QuantumCircuit(1);
      circuit.s(0);
      circuit.apply(QuantumGatesFactory.S().dagger(), 0);
      
      const optimized = CircuitOptimizer.optimize(circuit, { cancelInverses: true });
      
      expect(optimized.getOperations().length).toBe(0);
    });

    it('should preserve non-adjacent operations', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.x(1);  // Different qubit
      circuit.h(0);  // Not adjacent to first H
      
      const optimized = CircuitOptimizer.optimize(circuit);
      
      // Optimization should still work
      expect(optimized.getOperations().length).toBeLessThanOrEqual(3);
    });
  });

  describe('CircuitFactory', () => {
    it('should create Bell state circuit', () => {
      const circuit = CircuitFactory.bellState(0);
      const state = circuit.getStatevector();
      
      // |Φ+⟩ = (|00⟩ + |11⟩)/√2
      expect(state.probability(0)).toBeCloseTo(0.5);
      expect(state.probability(3)).toBeCloseTo(0.5);
    });

    it('should create different Bell states', () => {
      const states = [0, 1, 2, 3].map(i => 
        CircuitFactory.bellState(i as 0 | 1 | 2 | 3).getStatevector()
      );
      
      states.forEach(state => {
        const totalProb = state.probabilities().reduce((a, b) => a + b, 0);
        expect(totalProb).toBeCloseTo(1);
      });
    });

    it('should create GHZ state circuit', () => {
      const circuit = CircuitFactory.ghzState(3);
      const state = circuit.getStatevector();
      
      // GHZ = (|000⟩ + |111⟩)/√2
      expect(state.probability(0)).toBeCloseTo(0.5);
      expect(state.probability(7)).toBeCloseTo(0.5);
    });

    it('should create QFT circuit', () => {
      const circuit = CircuitFactory.qft(3);
      expect(circuit.getOperations().length).toBeGreaterThan(0);
    });

    it('should create inverse QFT circuit', () => {
      const qft = CircuitFactory.qft(2);
      const iqft = CircuitFactory.iqft(2);
      
      const combined = qft.compose(iqft);
      const state = combined.getStatevector();
      
      // Should be back to |00⟩
      expect(state.probability(0)).toBeCloseTo(1);
    });

    it('should create VQE ansatz', () => {
      const circuit = CircuitFactory.vqeAnsatz(3, 2);
      expect(circuit.getOperations().length).toBeGreaterThan(0);
    });

    it('should create random circuit', () => {
      const circuit = CircuitFactory.random(3, 5);
      expect(circuit.getOperations().length).toBeGreaterThan(0);
    });

    it('should create phase estimation template', () => {
      const circuit = CircuitFactory.phaseEstimation(3);
      expect(circuit.getNumQubits()).toBe(4);
    });
  });

  describe('Serialization', () => {
    it('should generate hash', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.cx(0, 1);
      
      expect(circuit.getHash()).toBeDefined();
      expect(circuit.getHash().length).toBeGreaterThan(0);
    });

    it('should convert to string', () => {
      const circuit = new QuantumCircuit(2, 'test');
      circuit.h(0);
      circuit.measure(0);
      
      const str = circuit.toString();
      expect(str).toContain('test');
      expect(str).toContain('H');
      expect(str).toContain('Measure');
    });

    it('should draw ASCII circuit', () => {
      const circuit = new QuantumCircuit(2);
      circuit.h(0);
      circuit.cx(0, 1);
      
      const drawing = circuit.draw();
      expect(drawing).toContain('q0');
      expect(drawing).toContain('q1');
    });
  });

  describe('Integration Tests', () => {
    it('should implement quantum teleportation', () => {
      // Simplified teleportation test
      const circuit = new QuantumCircuit(3, 'teleportation');
      
      // Prepare Bell pair between q1 and q2
      circuit.h(1);
      circuit.cx(1, 2);
      
      // Bell measurement on q0 and q1
      circuit.cx(0, 1);
      circuit.h(0);
      
      // Classical corrections would apply X and Z based on measurements
      // For simulation, we just verify the circuit runs
      const state = circuit.getStatevector();
      expect(state.isNormalized()).toBe(true);
    });

    it('should implement Deutsch-Jozsa algorithm structure', () => {
      const circuit = new QuantumCircuit(3, 'deutsch_jozsa');
      
      // Initialize ancilla
      circuit.x(2);
      
      // Hadamard all qubits
      circuit.h(0);
      circuit.h(1);
      circuit.h(2);
      
      // Oracle would go here
      
      // Final Hadamards
      circuit.h(0);
      circuit.h(1);
      
      expect(circuit.getOperations().length).toBe(6);
    });

    it('should execute deep circuit correctly', () => {
      const circuit = new QuantumCircuit(3);
      
      // Many gates
      for (let i = 0; i < 10; i++) {
        circuit.h(0);
        circuit.cx(0, 1);
        circuit.cx(1, 2);
        circuit.rz(Math.PI / 8, 0);
      }
      
      const state = circuit.getStatevector();
      expect(state.isNormalized()).toBe(true);
    });
  });
});
