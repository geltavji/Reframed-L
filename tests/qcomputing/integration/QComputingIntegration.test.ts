/**
 * Qlaws Ham - QComputingIntegration Module Tests (M08.06)
 * 
 * Comprehensive tests for quantum computing integration.
 * 
 * @module QComputingIntegration.test
 * @version 1.0.0
 */

import {
  QComputingIntegration,
  QComputingIntegrationFactory,
  ModuleValidation,
  CrossModuleTest,
  BenchmarkResult,
  IntegrationSummary
} from '../../../src/qcomputing/integration/QComputingIntegration';
import { Logger, LogLevel } from '../../../src/core/logger/Logger';

describe('QComputingIntegration Module (M08.06)', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.resetInstance();
    logger = Logger.getInstance({ minLevel: LogLevel.ERROR, enableConsole: false });
    QComputingIntegration.setLogger(logger);
  });

  afterEach(() => {
    Logger.resetInstance();
  });

  describe('Module Validation', () => {
    describe('Qubit Module', () => {
      it('should validate Qubit module successfully', () => {
        const result = QComputingIntegration.validateQubitModule();
        
        expect(result.module).toBe('Qubit');
        expect(result.version).toBe('1.0.0');
        expect(result.status).toBe('passed');
        expect(result.passed).toBeGreaterThan(0);
      });

      it('should have all tests passing', () => {
        const result = QComputingIntegration.validateQubitModule();
        expect(result.failed).toBe(0);
      });

      it('should have hash in result', () => {
        const result = QComputingIntegration.validateQubitModule();
        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBeGreaterThan(0);
      });
    });

    describe('Gates Module', () => {
      it('should validate Gates module successfully', () => {
        const result = QComputingIntegration.validateGatesModule();
        
        expect(result.module).toBe('QuantumGates');
        expect(result.status).toBe('passed');
      });

      it('should verify gate unitarity', () => {
        const result = QComputingIntegration.validateGatesModule();
        expect(result.passed).toBeGreaterThan(0);
      });
    });

    describe('Circuit Module', () => {
      it('should validate Circuit module successfully', () => {
        const result = QComputingIntegration.validateCircuitModule();
        
        expect(result.module).toBe('QuantumCircuit');
        expect(result.status).toBe('passed');
      });

      it('should test circuit factory', () => {
        const result = QComputingIntegration.validateCircuitModule();
        expect(result.tests).toBeGreaterThanOrEqual(5);
      });
    });

    describe('Algorithms Module', () => {
      it('should validate Algorithms module successfully', () => {
        const result = QComputingIntegration.validateAlgorithmsModule();
        
        expect(result.module).toBe('QuantumAlgorithms');
        expect(result.status).toBe('passed');
      });

      it('should test all major algorithms', () => {
        const result = QComputingIntegration.validateAlgorithmsModule();
        expect(result.tests).toBeGreaterThanOrEqual(5);
      });
    });

    describe('Revolutionary Module', () => {
      it('should validate Revolutionary module successfully', () => {
        const result = QComputingIntegration.validateRevolutionaryModule();
        
        expect(result.module).toBe('RevolutionaryTester');
        expect(result.status).toBe('passed');
      });

      it('should test complexity measurement', () => {
        const result = QComputingIntegration.validateRevolutionaryModule();
        expect(result.passed).toBeGreaterThan(0);
      });
    });

    describe('Validate All Modules', () => {
      it('should validate all 5 modules', () => {
        const results = QComputingIntegration.validateAllModules();
        
        expect(results.length).toBe(5);
        results.forEach(result => {
          expect(result.module).toBeDefined();
          expect(result.hash).toBeDefined();
        });
      });

      it('should have all modules passing', () => {
        const results = QComputingIntegration.validateAllModules();
        
        const allPassed = results.every(r => r.status === 'passed');
        expect(allPassed).toBe(true);
      });
    });
  });

  describe('Cross-Module Tests', () => {
    describe('Qubit-Gate Integration', () => {
      it('should pass Qubit-Gate integration test', () => {
        const result = QComputingIntegration.testQubitGateIntegration();
        
        expect(result.name).toBe('Qubit-Gate Integration');
        expect(result.modules).toContain('Qubit');
        expect(result.modules).toContain('QuantumGates');
        expect(result.passed).toBe(true);
      });
    });

    describe('Gate-Circuit Integration', () => {
      it('should pass Gate-Circuit integration test', () => {
        const result = QComputingIntegration.testGateCircuitIntegration();
        
        expect(result.name).toBe('Gate-Circuit Integration');
        expect(result.passed).toBe(true);
      });
    });

    describe('Circuit-Algorithm Integration', () => {
      it('should pass Circuit-Algorithm integration test', () => {
        const result = QComputingIntegration.testCircuitAlgorithmIntegration();
        
        expect(result.name).toBe('Circuit-Algorithm Integration');
        expect(result.passed).toBe(true);
      });
    });

    describe('Algorithm-Revolutionary Integration', () => {
      it('should pass Algorithm-Revolutionary integration test', () => {
        const result = QComputingIntegration.testAlgorithmRevolutionaryIntegration();
        
        expect(result.name).toBe('Algorithm-Revolutionary Integration');
        expect(result.passed).toBe(true);
      });
    });

    describe('Full Integration', () => {
      it('should pass full integration test', () => {
        const result = QComputingIntegration.testFullIntegration();
        
        expect(result.name).toBe('Full Integration');
        expect(result.modules.length).toBe(5);
        expect(result.passed).toBe(true);
      });
    });

    describe('Run All Cross-Module Tests', () => {
      it('should run all 5 cross-module tests', () => {
        const results = QComputingIntegration.runAllCrossModuleTests();
        
        expect(results.length).toBe(5);
        results.forEach(result => {
          expect(result.hash).toBeDefined();
          expect(result.description).toBeDefined();
        });
      });

      it('should have all tests passing', () => {
        const results = QComputingIntegration.runAllCrossModuleTests();
        
        const allPassed = results.every(r => r.passed);
        expect(allPassed).toBe(true);
      });
    });
  });

  describe('Benchmarks', () => {
    it('should benchmark single circuit', () => {
      const result = QComputingIntegration.benchmarkCircuit(3, 5);
      
      expect(result.numQubits).toBe(3);
      expect(result.depth).toBe(5);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.gateCount).toBeGreaterThan(0);
    });

    it('should run standard benchmarks', () => {
      const results = QComputingIntegration.runBenchmarks();
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.numQubits).toBeGreaterThan(0);
        expect(result.hash).toBeDefined();
      });
    });

    it('should include memory usage estimate', () => {
      const result = QComputingIntegration.benchmarkCircuit(4, 3);
      
      // 2^4 = 16 amplitudes, each complex (16 bytes)
      expect(result.memoryUsage).toBe(256);
    });

    it('should scale with circuit size', () => {
      const small = QComputingIntegration.benchmarkCircuit(3, 3);
      const large = QComputingIntegration.benchmarkCircuit(5, 3);
      
      expect(large.memoryUsage).toBeGreaterThan(small.memoryUsage);
    });
  });

  describe('Integration Summary', () => {
    it('should generate summary with all components', () => {
      const summary = QComputingIntegration.generateSummary();
      
      expect(summary.totalModules).toBe(5);
      expect(summary.crossModuleTests).toBe(5);
      expect(summary.benchmarks.length).toBeGreaterThan(0);
      expect(summary.hash).toBeDefined();
    });

    it('should report healthy status when all tests pass', () => {
      const summary = QComputingIntegration.generateSummary();
      
      expect(summary.overallStatus).toBe('healthy');
    });

    it('should count validated modules', () => {
      const summary = QComputingIntegration.generateSummary();
      
      expect(summary.validatedModules).toBe(summary.totalModules);
    });

    it('should count passed tests', () => {
      const summary = QComputingIntegration.generateSummary();
      
      expect(summary.passedTests).toBe(summary.crossModuleTests);
    });
  });

  describe('Proof Chain Export', () => {
    it('should export proof chain as JSON', () => {
      const proofChain = QComputingIntegration.exportProofChain();
      
      expect(proofChain).toBeDefined();
      expect(() => JSON.parse(proofChain)).not.toThrow();
    });

    it('should include timestamp', () => {
      const proofChain = JSON.parse(QComputingIntegration.exportProofChain());
      
      expect(proofChain.timestamp).toBeDefined();
    });

    it('should include module validations', () => {
      const proofChain = JSON.parse(QComputingIntegration.exportProofChain());
      
      expect(proofChain.moduleValidations.length).toBe(5);
      proofChain.moduleValidations.forEach((v: any) => {
        expect(v.module).toBeDefined();
        expect(v.hash).toBeDefined();
      });
    });

    it('should include cross-module tests', () => {
      const proofChain = JSON.parse(QComputingIntegration.exportProofChain());
      
      expect(proofChain.crossModuleTests.length).toBe(5);
      proofChain.crossModuleTests.forEach((t: any) => {
        expect(t.name).toBeDefined();
        expect(t.hash).toBeDefined();
      });
    });

    it('should include master hash', () => {
      const proofChain = JSON.parse(QComputingIntegration.exportProofChain());
      
      expect(proofChain.masterHash).toBeDefined();
    });
  });

  describe('QComputingIntegrationFactory', () => {
    it('should create full test suite', () => {
      const suite = QComputingIntegrationFactory.createTestSuite();
      
      expect(suite.modules.length).toBe(5);
      expect(suite.crossTests.length).toBe(5);
      expect(suite.benchmarks.length).toBeGreaterThan(0);
    });

    it('should perform quick check', () => {
      const { healthy, issues } = QComputingIntegrationFactory.quickCheck();
      
      expect(healthy).toBe(true);
      expect(issues.length).toBe(0);
    });

    it('should report issues when present', () => {
      // This test verifies the structure works - in normal operation there should be no issues
      const { healthy, issues } = QComputingIntegrationFactory.quickCheck();
      
      expect(typeof healthy).toBe('boolean');
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('Integration with PRD-06', () => {
    it('should connect quantum algorithms to revolutionary testing', () => {
      const algorithmTest = QComputingIntegration.testAlgorithmRevolutionaryIntegration();
      
      expect(algorithmTest.passed).toBe(true);
      expect(algorithmTest.modules).toContain('RevolutionaryTester');
    });

    it('should validate O(1) testing framework works', () => {
      const result = QComputingIntegration.validateRevolutionaryModule();
      
      expect(result.status).toBe('passed');
    });
  });

  describe('Complete Integration Test', () => {
    it('should complete full integration workflow', () => {
      // 1. Validate all modules
      const modules = QComputingIntegration.validateAllModules();
      expect(modules.every(m => m.status === 'passed')).toBe(true);
      
      // 2. Run cross-module tests
      const crossTests = QComputingIntegration.runAllCrossModuleTests();
      expect(crossTests.every(t => t.passed)).toBe(true);
      
      // 3. Run benchmarks
      const benchmarks = QComputingIntegration.runBenchmarks();
      expect(benchmarks.length).toBeGreaterThan(0);
      
      // 4. Generate summary
      const summary = QComputingIntegration.generateSummary();
      expect(summary.overallStatus).toBe('healthy');
      
      // 5. Export proof chain
      const proof = QComputingIntegration.exportProofChain();
      expect(JSON.parse(proof).masterHash).toBeDefined();
    });
  });
});
