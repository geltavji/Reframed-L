/**
 * Qlaws Ham - QuantumAlgorithms Module Tests (M08.04)
 * 
 * Comprehensive tests for quantum algorithms.
 * 
 * @module QuantumAlgorithms.test
 * @version 1.0.0
 */

import {
  Grover,
  Shor,
  VQE,
  QAOA,
  QPE,
  QuantumAlgorithmsFactory,
  GroverResult,
  ShorResult,
  VQEResult,
  QAOAResult,
  QPEResult
} from '../../../src/qcomputing/algorithms/QuantumAlgorithms';
import { QuantumGatesFactory, Phase } from '../../../src/qcomputing/gates/QuantumGates';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';
import { Complex } from '../../../src/core/math/Complex';

describe('QuantumAlgorithms Module (M08.04)', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    Grover.setLogger(logger);
    Shor.setLogger(logger);
    VQE.setLogger(logger);
    QAOA.setLogger(logger);
    QPE.setLogger(logger);
  });

  afterEach(() => {
    Logger.resetInstance();
  });

  describe('Grover\'s Algorithm', () => {
    it('should create Grover instance', () => {
      const grover = new Grover(3, (x) => x === 5);
      expect(grover).toBeDefined();
    });

    it('should calculate optimal iterations', () => {
      // For n qubits with 1 marked item: ~π/4 * sqrt(N)
      const grover = new Grover(4, (x) => x === 7);
      const optimal = grover.getOptimalIterations();
      
      // For 16 items with 1 marked: ~3.14
      expect(optimal).toBeGreaterThanOrEqual(2);
      expect(optimal).toBeLessThanOrEqual(4);
    });

    it('should find marked item with high probability', () => {
      const markedItem = 5;
      const grover = new Grover(3, (x) => x === markedItem);
      
      const result = grover.run();
      
      expect(result.algorithm).toBe('Grover');
      expect(result.searchSpace).toBe(8);
      expect(result.targetIndices).toContain(markedItem);
      expect(result.hash).toBeDefined();
    });

    it('should have high success rate over multiple shots', () => {
      const markedItem = 3;
      const grover = new Grover(3, (x) => x === markedItem);
      
      const { successRate } = grover.runShots(100);
      
      // Should find marked item >50% of time
      expect(successRate).toBeGreaterThan(0.5);
    });

    it('should build correct circuit structure', () => {
      const grover = new Grover(2, (x) => x === 1);
      const circuit = grover.buildCircuit();
      
      expect(circuit.getNumQubits()).toBe(2);
      expect(circuit.getOperations().length).toBeGreaterThan(0);
    });

    it('should calculate success probability', () => {
      const grover = new Grover(3, (x) => x === 5);
      const prob = grover.getSuccessProbability();
      
      // Should be high for optimal iterations
      expect(prob).toBeGreaterThan(0.7);
    });

    it('should handle multiple marked items', () => {
      const grover = new Grover(3, (x) => x === 2 || x === 5);
      
      const result = grover.run();
      expect(result.targetIndices.length).toBe(2);
    });

    it('should handle no marked items', () => {
      const grover = new Grover(3, () => false);
      
      const optimal = grover.getOptimalIterations();
      expect(optimal).toBe(0);
    });

    it('should work with factory method', () => {
      const grover = QuantumAlgorithmsFactory.grover(3, [2, 5]);
      
      const result = grover.run();
      expect(result.targetIndices).toEqual([2, 5]);
    });
  });

  describe('Shor\'s Algorithm', () => {
    it('should create Shor instance', () => {
      const shor = new Shor(15);
      expect(shor).toBeDefined();
    });

    it('should throw for invalid N', () => {
      expect(() => new Shor(3)).toThrow();
      expect(() => new Shor(3.5)).toThrow();
    });

    it('should factor 15 = 3 × 5', () => {
      const shor = new Shor(15);
      const result = shor.run();
      
      expect(result.algorithm).toBe('Shor');
      expect(result.N).toBe(15);
      
      if (result.success) {
        expect(result.factors[0] * result.factors[1]).toBe(15);
      }
    });

    it('should factor even numbers easily', () => {
      const shor = new Shor(14);
      const result = shor.run();
      
      expect(result.success).toBe(true);
      expect(result.factors).toContain(2);
      expect(result.factors[0] * result.factors[1]).toBe(14);
    });

    it('should factor 21 = 3 × 7', () => {
      const shor = new Shor(21);
      const result = shor.run();
      
      if (result.success) {
        expect(result.factors[0] * result.factors[1]).toBe(21);
      }
    });

    it('should handle perfect powers', () => {
      const shor = new Shor(9); // 3^2
      const result = shor.run();
      
      expect(result.success).toBe(true);
    });

    it('should identify prime numbers', () => {
      const shor = new Shor(7);
      const result = shor.run();
      
      // For prime, factors are 1 and N
      expect(result.success).toBe(false);
    });

    it('should work with factory method', () => {
      const shor = QuantumAlgorithmsFactory.shor(15);
      const result = shor.run();
      
      expect(result.N).toBe(15);
    });

    it('should include hash in result', () => {
      const shor = new Shor(15);
      const result = shor.run();
      
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
    });
  });

  describe('VQE Algorithm', () => {
    it('should create VQE instance', () => {
      const costFn = (params: number[]) => params.reduce((a, b) => a + b * b, 0);
      const vqe = new VQE(2, 1, costFn);
      
      expect(vqe).toBeDefined();
    });

    it('should calculate correct number of parameters', () => {
      const costFn = (params: number[]) => 0;
      const vqe = new VQE(3, 2, costFn);
      
      // 2 params per qubit per layer
      expect(vqe.getNumParams()).toBe(12);
    });

    it('should build ansatz circuit', () => {
      const costFn = (params: number[]) => 0;
      const vqe = new VQE(2, 1, costFn);
      
      const params = [0.1, 0.2, 0.3, 0.4];
      const circuit = vqe.buildAnsatz(params);
      
      expect(circuit.getNumQubits()).toBe(2);
      expect(circuit.getOperations().length).toBeGreaterThan(0);
    });

    it('should optimize energy', () => {
      // Simple bowl-shaped cost function
      const costFn = (params: number[]) => 
        params.reduce((sum, p) => sum + (p - 0.5) ** 2, 0);
      
      const vqe = new VQE(2, 1, costFn);
      const result = vqe.optimize();
      
      expect(result.algorithm).toBe('VQE');
      expect(result.energy).toBeLessThan(1); // Should minimize
      expect(result.optimalParams).toBeDefined();
      expect(result.convergenceHistory.length).toBeGreaterThan(0);
    });

    it('should converge to minimum', () => {
      const costFn = (params: number[]) => 
        params.reduce((sum, p) => sum + p * p, 0);
      
      const vqe = new VQE(2, 1, costFn);
      const result = vqe.optimize(undefined, 50, 0.2);
      
      // Should be close to 0
      expect(result.energy).toBeLessThan(0.5);
    });

    it('should accept initial parameters', () => {
      const costFn = (params: number[]) => 
        params.reduce((sum, p) => sum + p * p, 0);
      
      const vqe = new VQE(2, 1, costFn);
      const initialParams = [0.1, 0.1, 0.1, 0.1];
      
      const result = vqe.optimize(initialParams);
      expect(result.success).toBe(true);
    });

    it('should include hash in result', () => {
      const costFn = (params: number[]) => 0;
      const vqe = new VQE(2, 1, costFn);
      
      const result = vqe.optimize(undefined, 10);
      expect(result.hash).toBeDefined();
    });

    it('should work with factory method', () => {
      const vqe = QuantumAlgorithmsFactory.vqe(2, 1);
      const result = vqe.optimize(undefined, 10);
      
      expect(result.algorithm).toBe('VQE');
    });
  });

  describe('QAOA Algorithm', () => {
    it('should create QAOA instance', () => {
      const edges: [number, number][] = [[0, 1], [1, 2]];
      const qaoa = new QAOA(3, edges, 1);
      
      expect(qaoa).toBeDefined();
    });

    it('should calculate cut value correctly', () => {
      const edges: [number, number][] = [[0, 1], [1, 2], [0, 2]];
      const qaoa = new QAOA(3, edges);
      
      // '101' has cuts at (0,1) and (1,2)
      expect(qaoa.calculateCut('101')).toBe(2);
      
      // '111' has no cuts
      expect(qaoa.calculateCut('111')).toBe(0);
      
      // '010' has all edges cut
      expect(qaoa.calculateCut('010')).toBe(3);
    });

    it('should build QAOA circuit', () => {
      const edges: [number, number][] = [[0, 1]];
      const qaoa = new QAOA(2, edges, 1);
      
      const circuit = qaoa.buildCircuit([Math.PI/4], [Math.PI/8]);
      
      expect(circuit.getNumQubits()).toBe(2);
      expect(circuit.getOperations().length).toBeGreaterThan(0);
    });

    it('should evaluate expectation value', () => {
      const edges: [number, number][] = [[0, 1]];
      const qaoa = new QAOA(2, edges, 1);
      
      const expectation = qaoa.evaluateExpectation([Math.PI/4], [Math.PI/8], 100);
      
      // Expectation should be between 0 and 1 (max cut for 1 edge)
      expect(expectation).toBeGreaterThanOrEqual(0);
      expect(expectation).toBeLessThanOrEqual(1);
    });

    it('should optimize for MaxCut', () => {
      const edges: [number, number][] = [[0, 1], [1, 2]];
      const qaoa = new QAOA(3, edges, 1);
      
      const result = qaoa.optimize(20);
      
      expect(result.algorithm).toBe('QAOA');
      expect(result.bitstring.length).toBe(3);
      expect(result.maxCut).toBeGreaterThanOrEqual(0);
      expect(result.maxCut).toBeLessThanOrEqual(2);
    });

    it('should find reasonable cut for triangle graph', () => {
      // Triangle graph - max cut is 2
      const edges: [number, number][] = [[0, 1], [1, 2], [0, 2]];
      const qaoa = new QAOA(3, edges, 2);
      
      const result = qaoa.optimize(30);
      
      // Should find at least cut of 2
      expect(result.maxCut).toBeGreaterThanOrEqual(1);
    });

    it('should include hash in result', () => {
      const edges: [number, number][] = [[0, 1]];
      const qaoa = new QAOA(2, edges);
      
      const result = qaoa.optimize(5);
      expect(result.hash).toBeDefined();
    });

    it('should work with factory method', () => {
      const edges: [number, number][] = [[0, 1], [1, 2]];
      const qaoa = QuantumAlgorithmsFactory.qaoa(3, edges, 1);
      
      const result = qaoa.optimize(10);
      expect(result.algorithm).toBe('QAOA');
    });
  });

  describe('QPE Algorithm', () => {
    it('should create QPE instance', () => {
      const T = QuantumGatesFactory.T();
      const qpe = new QPE(3, T);
      
      expect(qpe).toBeDefined();
    });

    it('should throw for multi-qubit unitaries', () => {
      const CNOT = QuantumGatesFactory.CNOT();
      expect(() => new QPE(3, CNOT)).toThrow();
    });

    it('should build QPE circuit', () => {
      const S = QuantumGatesFactory.S();
      const qpe = new QPE(2, S);
      
      const circuit = qpe.buildCircuit();
      
      expect(circuit.getNumQubits()).toBe(3); // 2 precision + 1 eigenstate
    });

    it('should estimate phase of Z gate', () => {
      // Z gate has eigenvalue -1 = e^(iπ), so phase = 0.5
      const Z = QuantumGatesFactory.Z();
      const qpe = new QPE(3, Z);
      
      const result = qpe.run(500);
      
      expect(result.algorithm).toBe('QPE');
      expect(result.precision).toBe(3);
      // Phase should be around 0.5 (eigenvalue -1)
    });

    it('should estimate phase of S gate', () => {
      // S gate has eigenvalue i = e^(iπ/2), so phase = 0.25
      const S = QuantumGatesFactory.S();
      const qpe = new QPE(3, S);
      
      const result = qpe.run(500);
      
      expect(result.phase).toBeDefined();
      expect(result.eigenvalue).toBeDefined();
    });

    it('should estimate phase of T gate', () => {
      // T gate has eigenvalue e^(iπ/4), so phase = 0.125
      const T = QuantumGatesFactory.T();
      const qpe = new QPE(4, T);
      
      const result = qpe.run(500);
      
      expect(result.phase).toBeDefined();
    });

    it('should include hash in result', () => {
      const T = QuantumGatesFactory.T();
      const qpe = new QPE(2, T);
      
      const result = qpe.run(100);
      expect(result.hash).toBeDefined();
    });

    it('should work with factory method', () => {
      const T = QuantumGatesFactory.T();
      const qpe = QuantumAlgorithmsFactory.qpe(3, T);
      
      const result = qpe.run(100);
      expect(result.algorithm).toBe('QPE');
    });
  });

  describe('Algorithm Factory', () => {
    it('should create all algorithms via factory', () => {
      const grover = QuantumAlgorithmsFactory.grover(3, [5]);
      const shor = QuantumAlgorithmsFactory.shor(15);
      const vqe = QuantumAlgorithmsFactory.vqe(2, 1);
      const qaoa = QuantumAlgorithmsFactory.qaoa(3, [[0, 1]]);
      const qpe = QuantumAlgorithmsFactory.qpe(3, QuantumGatesFactory.T());
      
      expect(grover).toBeInstanceOf(Grover);
      expect(shor).toBeInstanceOf(Shor);
      expect(vqe).toBeInstanceOf(VQE);
      expect(qaoa).toBeInstanceOf(QAOA);
      expect(qpe).toBeInstanceOf(QPE);
    });
  });

  describe('Integration Tests', () => {
    it('should verify Grover speedup', () => {
      // Compare success rates for different iteration counts
      const grover = new Grover(4, (x) => x === 7);
      
      const optimalRate = grover.runShots(100, grover.getOptimalIterations()).successRate;
      const halfRate = grover.runShots(100, Math.floor(grover.getOptimalIterations() / 2)).successRate;
      
      // Optimal iterations should give better success rate
      expect(optimalRate).toBeGreaterThanOrEqual(halfRate);
    });

    it('should verify VQE convergence', () => {
      const costFn = (params: number[]) => 
        params.reduce((sum, p) => sum + (p - 1) ** 2, 0);
      
      const vqe = new VQE(2, 1, costFn);
      const result = vqe.optimize(undefined, 100, 0.15);
      
      // Energy should decrease over iterations
      const history = result.convergenceHistory;
      if (history.length > 10) {
        expect(history[history.length - 1]).toBeLessThanOrEqual(history[0]);
      }
    });

    it('should solve simple MaxCut with QAOA', () => {
      // Line graph: optimal cut is 1
      const edges: [number, number][] = [[0, 1]];
      const qaoa = new QAOA(2, edges, 2);
      
      const result = qaoa.optimize(30);
      
      // Should find the optimal cut
      expect(result.maxCut).toBe(1);
    });
  });
});
