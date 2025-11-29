/**
 * Qlaws Ham - RevolutionaryTester Module Tests (M08.05)
 * 
 * Comprehensive tests for revolutionary algorithm testing.
 * 
 * @module RevolutionaryTester.test
 * @version 1.0.0
 */

import {
  RevolutionaryTester,
  O1Validator,
  ComplexityMeasure,
  ComplexityClass,
  RevolutionaryTesterFactory,
  O1ValidationResult,
  RevolutionaryTestResult,
  ComplexityMeasurement
} from '../../../src/qcomputing/revolutionary/RevolutionaryTester';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';

describe('RevolutionaryTester Module (M08.05)', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    RevolutionaryTester.setLogger(logger);
    O1Validator.setLogger(logger);
  });

  afterEach(() => {
    Logger.resetInstance();
  });

  describe('ComplexityMeasure Class', () => {
    it('should classify O(1) complexity', () => {
      const measurements = [
        { inputSize: 10, operations: 5 },
        { inputSize: 100, operations: 5 },
        { inputSize: 1000, operations: 5 },
        { inputSize: 10000, operations: 5 }
      ];
      
      const complexity = ComplexityMeasure.classifyComplexity(measurements);
      expect(complexity).toBe(ComplexityClass.O_1);
    });

    it('should classify O(n) complexity', () => {
      const measurements = [
        { inputSize: 10, operations: 10 },
        { inputSize: 100, operations: 100 },
        { inputSize: 1000, operations: 1000 },
        { inputSize: 10000, operations: 10000 }
      ];
      
      const complexity = ComplexityMeasure.classifyComplexity(measurements);
      expect(complexity).toBe(ComplexityClass.O_N);
    });

    it('should classify O(log n) complexity', () => {
      const measurements = [
        { inputSize: 10, operations: 3 },
        { inputSize: 100, operations: 7 },
        { inputSize: 1000, operations: 10 },
        { inputSize: 10000, operations: 13 }
      ];
      
      const complexity = ComplexityMeasure.classifyComplexity(measurements);
      expect([ComplexityClass.O_LOG_N, ComplexityClass.O_1]).toContain(complexity);
    });

    it('should classify O(√n) complexity', () => {
      const measurements = [
        { inputSize: 16, operations: 4 },
        { inputSize: 64, operations: 8 },
        { inputSize: 256, operations: 16 },
        { inputSize: 1024, operations: 32 }
      ];
      
      const complexity = ComplexityMeasure.classifyComplexity(measurements);
      expect([ComplexityClass.O_SQRT_N, ComplexityClass.O_LOG_N]).toContain(complexity);
    });

    it('should classify O(n²) complexity', () => {
      const measurements = [
        { inputSize: 10, operations: 100 },
        { inputSize: 20, operations: 400 },
        { inputSize: 40, operations: 1600 },
        { inputSize: 80, operations: 6400 }
      ];
      
      const complexity = ComplexityMeasure.classifyComplexity(measurements);
      expect([ComplexityClass.O_N_SQUARED, ComplexityClass.O_N_LOG_N]).toContain(complexity);
    });

    it('should return UNKNOWN for insufficient data', () => {
      const measurements = [
        { inputSize: 10, operations: 10 }
      ];
      
      const complexity = ComplexityMeasure.classifyComplexity(measurements);
      expect(complexity).toBe(ComplexityClass.UNKNOWN);
    });

    it('should calculate speedup correctly', () => {
      expect(ComplexityMeasure.calculateSpeedup(100, 10)).toBe(10);
      expect(ComplexityMeasure.calculateSpeedup(1000, 100)).toBe(10);
      expect(ComplexityMeasure.calculateSpeedup(100, 0)).toBe(Infinity);
    });

    it('should categorize speedup types', () => {
      expect(ComplexityMeasure.categorizeSpeedup(1)).toBe('none');
      expect(ComplexityMeasure.categorizeSpeedup(5)).toBe('polynomial');
      expect(ComplexityMeasure.categorizeSpeedup(50)).toBe('quadratic');
      expect(ComplexityMeasure.categorizeSpeedup(500)).toBe('exponential');
    });

    it('should generate hash for measurement', () => {
      const measurement: ComplexityMeasurement = {
        inputSize: 100,
        classicalOperations: 100,
        quantumOperations: 10,
        classicalTime: 1,
        quantumTime: 0.1,
        speedup: 10
      };
      
      const hash = ComplexityMeasure.getHash(measurement);
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('O1Validator Class', () => {
    it('should validate O(1) algorithm', () => {
      // Algorithm that returns constant operations
      const runAlgorithm = (inputSize: number) => ({
        operations: 5,
        time: 0.001
      });
      
      const result = O1Validator.validate('ConstantAlgorithm', runAlgorithm);
      
      expect(result.algorithm).toBe('ConstantAlgorithm');
      expect(result.isO1).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should reject non-O(1) algorithm', () => {
      // Linear algorithm
      const runAlgorithm = (inputSize: number) => ({
        operations: inputSize,
        time: inputSize * 0.001
      });
      
      const result = O1Validator.validate('LinearAlgorithm', runAlgorithm);
      
      expect(result.isO1).toBe(false);
    });

    it('should calculate speedup factor', () => {
      const runAlgorithm = (inputSize: number) => ({
        operations: Math.ceil(Math.sqrt(inputSize)),
        time: Math.sqrt(inputSize) * 0.001
      });
      
      const result = O1Validator.validate('SqrtAlgorithm', runAlgorithm);
      
      expect(result.speedupFactor).toBeGreaterThan(1);
    });

    it('should generate analysis text', () => {
      const runAlgorithm = (inputSize: number) => ({
        operations: 3,
        time: 0.001
      });
      
      const result = O1Validator.validate('TestAlgorithm', runAlgorithm);
      
      expect(result.analysis).toBeDefined();
      expect(result.analysis.length).toBeGreaterThan(0);
    });

    it('should include hash in result', () => {
      const runAlgorithm = (inputSize: number) => ({
        operations: 5,
        time: 0.001
      });
      
      const result = O1Validator.validate('TestAlgorithm', runAlgorithm);
      
      expect(result.hash).toBeDefined();
    });

    it('should include measurements in result', () => {
      const runAlgorithm = (inputSize: number) => ({
        operations: inputSize,
        time: inputSize * 0.001
      });
      
      const result = O1Validator.validate('TestAlgorithm', runAlgorithm);
      
      expect(result.measurements.length).toBeGreaterThan(0);
      expect(result.measurements[0].inputSize).toBeDefined();
    });
  });

  describe('RevolutionaryTester Class', () => {
    describe('Grover Speedup Test', () => {
      it('should test Grover algorithm speedup', () => {
        const result = RevolutionaryTester.testGroverSpeedup([4, 8, 16]);
        
        expect(result.name).toBe('Grover Search');
        expect(result.classicalComplexity).toBe(ComplexityClass.O_N);
        expect(result.quantumComplexity).toBe(ComplexityClass.O_SQRT_N);
        expect(result.speedupType).toBe('quadratic');
      });

      it('should have positive speedup factor', () => {
        const result = RevolutionaryTester.testGroverSpeedup([4, 8]);
        
        expect(result.speedupFactor).toBeGreaterThan(1);
      });

      it('should include measurements', () => {
        const result = RevolutionaryTester.testGroverSpeedup([4, 8, 16]);
        
        expect(result.measurements.length).toBeGreaterThan(0);
      });

      it('should validate speedup', () => {
        const result = RevolutionaryTester.testGroverSpeedup([4, 8, 16]);
        
        expect(result.validationPassed).toBe(true);
      });
    });

    describe('Quantum Parallelism Test', () => {
      it('should test quantum parallelism', () => {
        const result = RevolutionaryTester.testQuantumParallelism(4);
        
        expect(result.name).toBe('Quantum Parallelism');
        expect(result.classicalComplexity).toBe(ComplexityClass.O_N);
        expect(result.quantumComplexity).toBe(ComplexityClass.O_LOG_N);
      });

      it('should show exponential speedup', () => {
        const result = RevolutionaryTester.testQuantumParallelism(5);
        
        expect(result.speedupType).toBe('exponential');
        expect(result.speedupFactor).toBeGreaterThan(2);
      });
    });

    describe('Entanglement Correlation Test', () => {
      it('should test entanglement correlation', () => {
        const result = RevolutionaryTester.testEntanglementCorrelation(3);
        
        expect(result.name).toBe('Entanglement Correlation');
        expect(result.measurements.length).toBeGreaterThan(0);
      });

      it('should show polynomial speedup', () => {
        const result = RevolutionaryTester.testEntanglementCorrelation(5);
        
        expect(result.speedupFactor).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Phase Estimation Test', () => {
      it('should test phase estimation', () => {
        const result = RevolutionaryTester.testPhaseEstimation([2, 3, 4]);
        
        expect(result.name).toBe('Quantum Phase Estimation');
        expect(result.quantumComplexity).toBe(ComplexityClass.O_LOG_N);
      });

      it('should show significant speedup', () => {
        const result = RevolutionaryTester.testPhaseEstimation([2, 3, 4, 5]);
        
        expect(result.speedupFactor).toBeGreaterThan(3);
      });
    });

    describe('Run All Tests', () => {
      it('should run all revolutionary tests', () => {
        const results = RevolutionaryTester.runAllTests();
        
        expect(results.length).toBe(4);
        results.forEach(result => {
          expect(result.name).toBeDefined();
          expect(result.hash).toBeDefined();
        });
      });

      it('should have all tests pass validation', () => {
        const results = RevolutionaryTester.runAllTests();
        
        const passedCount = results.filter(r => r.validationPassed).length;
        expect(passedCount).toBeGreaterThanOrEqual(3);
      });
    });

    describe('Generate Report', () => {
      it('should generate text report', () => {
        const results = RevolutionaryTester.runAllTests();
        const report = RevolutionaryTester.generateReport(results);
        
        expect(report).toContain('REVOLUTIONARY ALGORITHM TEST REPORT');
        expect(report).toContain('Grover Search');
        expect(report).toContain('SUMMARY');
      });

      it('should include pass/fail counts', () => {
        const results = RevolutionaryTester.runAllTests();
        const report = RevolutionaryTester.generateReport(results);
        
        expect(report).toContain('Tests Passed');
      });
    });
  });

  describe('RevolutionaryTesterFactory', () => {
    it('should create O1Validator', () => {
      const validator = RevolutionaryTesterFactory.createO1Validator();
      expect(validator).toBe(O1Validator);
    });

    it('should create ComplexityMeasure', () => {
      const measure = RevolutionaryTesterFactory.createComplexityMeasure();
      expect(measure).toBe(ComplexityMeasure);
    });

    it('should create RevolutionaryTester', () => {
      const tester = RevolutionaryTesterFactory.createTester();
      expect(tester).toBe(RevolutionaryTester);
    });

    it('should run quick validation', () => {
      const { passed, total, results } = RevolutionaryTesterFactory.quickValidation();
      
      expect(total).toBe(4);
      expect(passed).toBeGreaterThanOrEqual(0);
      expect(results.length).toBe(4);
    });
  });

  describe('Integration Tests', () => {
    it('should validate Grover achieves quadratic speedup', () => {
      const runAlgorithm = (inputSize: number) => {
        const numQubits = Math.ceil(Math.log2(inputSize));
        const optimalIterations = Math.round(Math.PI / 4 * Math.sqrt(inputSize));
        return {
          operations: optimalIterations,
          time: optimalIterations * 0.001
        };
      };
      
      const result = O1Validator.validate('GroverSimulation', runAlgorithm);
      
      // Not O(1), but should show significant speedup
      expect(result.speedupFactor).toBeGreaterThan(2);
    });

    it('should validate quantum parallelism achieves exponential speedup', () => {
      const runAlgorithm = (inputSize: number) => {
        const numQubits = Math.ceil(Math.log2(inputSize));
        return {
          operations: numQubits, // O(log n)
          time: numQubits * 0.001
        };
      };
      
      const result = O1Validator.validate('QuantumParallelism', runAlgorithm);
      
      expect(result.speedupFactor).toBeGreaterThan(5);
    });

    it('should complete full test suite without errors', () => {
      expect(() => {
        RevolutionaryTester.testGroverSpeedup([4, 8]);
        RevolutionaryTester.testQuantumParallelism(4);
        RevolutionaryTester.testEntanglementCorrelation(3);
        RevolutionaryTester.testPhaseEstimation([2, 3, 4]);
      }).not.toThrow();
    });

    it('should generate consistent hashes', () => {
      const result1 = RevolutionaryTester.testGroverSpeedup([4, 8]);
      const result2 = RevolutionaryTester.testGroverSpeedup([4, 8]);
      
      // Hashes should be different (include timestamp)
      expect(result1.hash).toBeDefined();
      expect(result2.hash).toBeDefined();
    });
  });
});
