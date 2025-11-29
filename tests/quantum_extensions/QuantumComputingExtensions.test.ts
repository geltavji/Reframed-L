/**
 * Tests for QuantumComputingExtensions
 * PRD-15: Quantum Computing Extensions
 */

import { QuantumComputingExtensions, QuantumComputingExtensionsFactory } from '../../src/quantum_extensions/QuantumComputingExtensions';

describe('QuantumComputingExtensions', () => {
  let qce: QuantumComputingExtensions;

  beforeEach(() => {
    qce = QuantumComputingExtensionsFactory.createDefault();
  });

  describe('Initialization', () => {
    it('should initialize with quantum algorithms', () => {
      const algorithms = qce.getAllAlgorithms();
      expect(algorithms.length).toBeGreaterThan(0);
    });

    it('should initialize with error correction codes', () => {
      const codes = qce.getAllErrorCodes();
      expect(codes.length).toBeGreaterThan(0);
    });

    it('should initialize with mathematical formulas', () => {
      const formulas = qce.getAllMathFormulas();
      expect(formulas.length).toBeGreaterThan(0);
    });
  });

  describe('Quantum Algorithms', () => {
    it('should have Grover algorithm', () => {
      const algorithms = qce.getAllAlgorithms();
      const grover = algorithms.find(a => a.name.includes('Grover'));
      expect(grover).toBeDefined();
      expect(grover?.speedup.type).toBe('quadratic');
    });

    it('should have Shor algorithm', () => {
      const algorithms = qce.getAllAlgorithms();
      const shor = algorithms.find(a => a.name.includes('Shor'));
      expect(shor).toBeDefined();
      expect(shor?.speedup.type).toBe('exponential');
    });

    it('should have valid circuit descriptions', () => {
      const algorithms = qce.getAllAlgorithms();
      for (const alg of algorithms) {
        expect(alg.circuit.qubits).toBeGreaterThan(0);
        expect(alg.circuit.depth).toBeGreaterThan(0);
        expect(alg.circuit.gates.total).toBeGreaterThan(0);
      }
    });

    it('should have valid resource requirements', () => {
      const algorithms = qce.getAllAlgorithms();
      for (const alg of algorithms) {
        expect(alg.resourceRequirements.physicalQubits).toBeGreaterThan(0);
        expect(alg.resourceRequirements.logicalQubits).toBeGreaterThan(0);
      }
    });
  });

  describe('Speedup Analysis', () => {
    it('should get exponential speedup algorithms', () => {
      const exponential = qce.getAlgorithmsBySpeedup('exponential');
      expect(exponential.length).toBeGreaterThan(0);
    });

    it('should get quadratic speedup algorithms', () => {
      const quadratic = qce.getAlgorithmsBySpeedup('quadratic');
      expect(quadratic.length).toBeGreaterThan(0);
    });

    it('should analyze speedup correctly', () => {
      const analysis = qce.analyzeSpeedup('O(N)', 'O(√N)', 1000000);
      expect(analysis.speedup).toBeGreaterThan(1);
      expect(analysis.worthwhile).toBeDefined();
      expect(analysis.breakEven).toBeDefined();
    });
  });

  describe('Error Correction Codes', () => {
    it('should have surface code', () => {
      const codes = qce.getAllErrorCodes();
      const surface = codes.find(c => c.name.includes('Surface'));
      expect(surface).toBeDefined();
      expect(surface?.type).toBe('surface');
    });

    it('should have valid threshold error rates', () => {
      const codes = qce.getAllErrorCodes();
      for (const code of codes) {
        expect(code.thresholdErrorRate).toBeGreaterThan(0);
        expect(code.thresholdErrorRate).toBeLessThan(1);
      }
    });

    it('should have valid physical to logical ratios', () => {
      const codes = qce.getAllErrorCodes();
      for (const code of codes) {
        expect(code.physicalToLogicalRatio).toBeGreaterThan(1);
      }
    });
  });

  describe('Mathematical Formulas', () => {
    it('should have quantum state evolution formula', () => {
      const formulas = qce.getAllMathFormulas();
      const evolution = formulas.find(f => f.name.includes('Evolution'));
      expect(evolution).toBeDefined();
    });

    it('should have entanglement entropy formula', () => {
      const formulas = qce.getAllMathFormulas();
      const entropy = formulas.find(f => f.name.includes('Entropy'));
      expect(entropy).toBeDefined();
    });

    it('should have valid variable definitions', () => {
      const formulas = qce.getAllMathFormulas();
      for (const formula of formulas) {
        expect(formula.variables.length).toBeGreaterThan(0);
        for (const v of formula.variables) {
          expect(v.symbol).toBeDefined();
          expect(v.name).toBeDefined();
          expect(v.type).toBeDefined();
        }
      }
    });
  });

  describe('Hash Verification', () => {
    it('should verify algorithm hashes', () => {
      const algorithms = qce.getAllAlgorithms();
      for (const alg of algorithms) {
        expect(qce.verifyAlgorithm(alg.id)).toBe(true);
      }
    });

    it('should return false for non-existent algorithm', () => {
      expect(qce.verifyAlgorithm('non-existent')).toBe(false);
    });
  });

  describe('Export', () => {
    it('should export research data', () => {
      const data = qce.exportResearchData();
      expect(data).toHaveProperty('algorithms');
      expect(data).toHaveProperty('errorCodes');
      expect(data).toHaveProperty('mathFormulas');
      expect(data).toHaveProperty('hash');
    });
  });
});
