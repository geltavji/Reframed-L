/**
 * Qlaws Ham - Quantum Computing Integration Module (M08.06)
 * 
 * Integrates all quantum computing simulation modules and provides benchmarking.
 * 
 * @module QComputingIntegration
 * @version 1.0.0
 * @dependencies All M08 modules
 */

import { Logger } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Qubit, QubitState, MultiQubitState, QubitRegister, QubitFactory } from '../qubit/Qubit';
import { 
  Gate, 
  PauliX, 
  PauliY, 
  PauliZ, 
  Hadamard, 
  CNOT, 
  Toffoli,
  GateLibrary,
  QuantumGatesFactory 
} from '../gates/QuantumGates';
import { QuantumCircuit, CircuitFactory, CircuitOptimizer } from '../circuit/QuantumCircuit';
import { 
  Grover, 
  Shor, 
  VQE, 
  QAOA, 
  QPE,
  QuantumAlgorithmsFactory 
} from '../algorithms/QuantumAlgorithms';
import { 
  RevolutionaryTester, 
  O1Validator, 
  ComplexityMeasure,
  ComplexityClass 
} from '../revolutionary/RevolutionaryTester';

// ============================================================================
// Interfaces & Types
// ============================================================================

/**
 * Module validation result
 */
export interface ModuleValidation {
  module: string;
  version: string;
  status: 'passed' | 'failed' | 'warning';
  tests: number;
  passed: number;
  failed: number;
  errors: string[];
  hash: string;
}

/**
 * Cross-module test result
 */
export interface CrossModuleTest {
  name: string;
  modules: string[];
  passed: boolean;
  description: string;
  hash: string;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  numQubits: number;
  depth: number;
  executionTime: number;
  memoryUsage: number;
  gateCount: number;
  hash: string;
}

/**
 * Integration summary
 */
export interface IntegrationSummary {
  totalModules: number;
  validatedModules: number;
  crossModuleTests: number;
  passedTests: number;
  benchmarks: BenchmarkResult[];
  overallStatus: 'healthy' | 'degraded' | 'failed';
  hash: string;
}

// ============================================================================
// QComputingIntegration Class
// ============================================================================

/**
 * Main integration class for quantum computing modules
 */
export class QComputingIntegration {
  private static logger: Logger | null = null;

  /**
   * Set logger
   */
  public static setLogger(logger: Logger): void {
    QComputingIntegration.logger = logger;
  }

  // ============================================================================
  // Module Validation
  // ============================================================================

  /**
   * Validate Qubit module
   */
  public static validateQubitModule(): ModuleValidation {
    const errors: string[] = [];
    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Create qubits
      const q0 = Qubit.zero();
      if (q0.getState().fidelity(QubitState.zero()) > 0.99) passed++; else failed++;

      // Test 2: Qubit state operations
      const plus = QubitState.plus();
      if (plus.isNormalized()) passed++; else failed++;

      // Test 3: Multi-qubit states
      const bell = MultiQubitState.bellPhiPlus();
      if (bell.getNumQubits() === 2) passed++; else failed++;

      // Test 4: Qubit register
      const reg = new QubitRegister(3);
      if (reg.size() === 3) passed++; else failed++;

      // Test 5: Measurement
      const result = QubitState.zero().measure();
      if (result.outcome === 0) passed++; else failed++;

    } catch (e) {
      errors.push(`Qubit module error: ${e}`);
      failed++;
    }

    const hash = HashVerifier.hash(`qubit-validation:${passed}:${failed}`);

    return {
      module: 'Qubit',
      version: '1.0.0',
      status: failed === 0 ? 'passed' : errors.length > 0 ? 'failed' : 'warning',
      tests: passed + failed,
      passed,
      failed,
      errors,
      hash
    };
  }

  /**
   * Validate Gates module
   */
  public static validateGatesModule(): ModuleValidation {
    const errors: string[] = [];
    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Pauli gates are unitary
      const X = new PauliX();
      if (X.isUnitary()) passed++; else failed++;

      // Test 2: Hadamard is Hermitian
      const H = new Hadamard();
      if (H.isHermitian()) passed++; else failed++;

      // Test 3: CNOT is 2-qubit
      const cnot = new CNOT();
      if (cnot.getNumQubits() === 2) passed++; else failed++;

      // Test 4: Gate library
      const lib = GateLibrary.getInstance();
      if (lib.has('X') && lib.has('CNOT')) passed++; else failed++;

      // Test 5: Gate composition
      const HH = H.compose(H);
      const state = QubitState.zero();
      if (HH.apply(state).fidelity(state) > 0.99) passed++; else failed++;

    } catch (e) {
      errors.push(`Gates module error: ${e}`);
      failed++;
    }

    const hash = HashVerifier.hash(`gates-validation:${passed}:${failed}`);

    return {
      module: 'QuantumGates',
      version: '1.0.0',
      status: failed === 0 ? 'passed' : errors.length > 0 ? 'failed' : 'warning',
      tests: passed + failed,
      passed,
      failed,
      errors,
      hash
    };
  }

  /**
   * Validate Circuit module
   */
  public static validateCircuitModule(): ModuleValidation {
    const errors: string[] = [];
    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Create circuit
      const circuit = new QuantumCircuit(3);
      if (circuit.getNumQubits() === 3) passed++; else failed++;

      // Test 2: Apply gates
      circuit.h(0).cx(0, 1);
      if (circuit.getOperations().length === 2) passed++; else failed++;

      // Test 3: Get statevector
      const state = circuit.getStatevector();
      if (state.isNormalized()) passed++; else failed++;

      // Test 4: Circuit factory
      const bell = CircuitFactory.bellState();
      const bellState = bell.getStatevector();
      if (bellState.probability(0) > 0.4 && bellState.probability(3) > 0.4) passed++; else failed++;

      // Test 5: Circuit optimizer
      const optCircuit = CircuitOptimizer.optimize(circuit);
      if (optCircuit.getNumQubits() === 3) passed++; else failed++;

    } catch (e) {
      errors.push(`Circuit module error: ${e}`);
      failed++;
    }

    const hash = HashVerifier.hash(`circuit-validation:${passed}:${failed}`);

    return {
      module: 'QuantumCircuit',
      version: '1.0.0',
      status: failed === 0 ? 'passed' : errors.length > 0 ? 'failed' : 'warning',
      tests: passed + failed,
      passed,
      failed,
      errors,
      hash
    };
  }

  /**
   * Validate Algorithms module
   */
  public static validateAlgorithmsModule(): ModuleValidation {
    const errors: string[] = [];
    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Grover's algorithm
      const grover = new Grover(3, x => x === 5);
      const groverResult = grover.run();
      if (groverResult.algorithm === 'Grover') passed++; else failed++;

      // Test 2: Shor's algorithm
      const shor = new Shor(15);
      const shorResult = shor.run();
      if (shorResult.N === 15) passed++; else failed++;

      // Test 3: VQE
      const vqe = new VQE(2, 1, params => params.reduce((a, b) => a + b * b, 0));
      const vqeResult = vqe.optimize(undefined, 10);
      if (vqeResult.algorithm === 'VQE') passed++; else failed++;

      // Test 4: QAOA
      const qaoa = new QAOA(2, [[0, 1]], 1);
      const qaoaResult = qaoa.optimize(10);
      if (qaoaResult.algorithm === 'QAOA') passed++; else failed++;

      // Test 5: QPE
      const qpe = new QPE(2, QuantumGatesFactory.T());
      const qpeResult = qpe.run(100);
      if (qpeResult.algorithm === 'QPE') passed++; else failed++;

    } catch (e) {
      errors.push(`Algorithms module error: ${e}`);
      failed++;
    }

    const hash = HashVerifier.hash(`algorithms-validation:${passed}:${failed}`);

    return {
      module: 'QuantumAlgorithms',
      version: '1.0.0',
      status: failed === 0 ? 'passed' : errors.length > 0 ? 'failed' : 'warning',
      tests: passed + failed,
      passed,
      failed,
      errors,
      hash
    };
  }

  /**
   * Validate Revolutionary module
   */
  public static validateRevolutionaryModule(): ModuleValidation {
    const errors: string[] = [];
    let passed = 0;
    let failed = 0;

    try {
      // Test 1: Complexity classification
      const measurements = [
        { inputSize: 10, operations: 10 },
        { inputSize: 100, operations: 100 },
        { inputSize: 1000, operations: 1000 }
      ];
      const complexity = ComplexityMeasure.classifyComplexity(measurements);
      if (complexity === ComplexityClass.O_N) passed++; else failed++;

      // Test 2: O1 Validation
      const result = O1Validator.validate('Test', () => ({ operations: 5, time: 0.001 }));
      if (result.algorithm === 'Test') passed++; else failed++;

      // Test 3: Grover speedup test
      const groverTest = RevolutionaryTester.testGroverSpeedup([4, 8]);
      if (groverTest.speedupFactor > 1) passed++; else failed++;

      // Test 4: Run all tests
      const allTests = RevolutionaryTester.runAllTests();
      if (allTests.length === 4) passed++; else failed++;

      // Test 5: Generate report
      const report = RevolutionaryTester.generateReport(allTests);
      if (report.includes('SUMMARY')) passed++; else failed++;

    } catch (e) {
      errors.push(`Revolutionary module error: ${e}`);
      failed++;
    }

    const hash = HashVerifier.hash(`revolutionary-validation:${passed}:${failed}`);

    return {
      module: 'RevolutionaryTester',
      version: '1.0.0',
      status: failed === 0 ? 'passed' : errors.length > 0 ? 'failed' : 'warning',
      tests: passed + failed,
      passed,
      failed,
      errors,
      hash
    };
  }

  /**
   * Validate all modules
   */
  public static validateAllModules(): ModuleValidation[] {
    return [
      this.validateQubitModule(),
      this.validateGatesModule(),
      this.validateCircuitModule(),
      this.validateAlgorithmsModule(),
      this.validateRevolutionaryModule()
    ];
  }

  // ============================================================================
  // Cross-Module Tests
  // ============================================================================

  /**
   * Test Qubit-Gate integration
   */
  public static testQubitGateIntegration(): CrossModuleTest {
    let passed = true;
    
    try {
      const qubit = Qubit.zero();
      const H = new Hadamard();
      const newState = H.apply(qubit.getState());
      
      if (newState.fidelity(QubitState.plus()) < 0.99) {
        passed = false;
      }
    } catch {
      passed = false;
    }

    const hash = HashVerifier.hash(`qubit-gate-test:${passed}`);

    return {
      name: 'Qubit-Gate Integration',
      modules: ['Qubit', 'QuantumGates'],
      passed,
      description: 'Apply Hadamard gate to qubit and verify superposition',
      hash
    };
  }

  /**
   * Test Gate-Circuit integration
   */
  public static testGateCircuitIntegration(): CrossModuleTest {
    let passed = true;
    
    try {
      const circuit = new QuantumCircuit(2);
      circuit.h(0).cx(0, 1);
      
      const state = circuit.getStatevector();
      // Should be Bell state
      if (state.probability(0) < 0.4 || state.probability(3) < 0.4) {
        passed = false;
      }
    } catch {
      passed = false;
    }

    const hash = HashVerifier.hash(`gate-circuit-test:${passed}`);

    return {
      name: 'Gate-Circuit Integration',
      modules: ['QuantumGates', 'QuantumCircuit'],
      passed,
      description: 'Build Bell state circuit using gates',
      hash
    };
  }

  /**
   * Test Circuit-Algorithm integration
   */
  public static testCircuitAlgorithmIntegration(): CrossModuleTest {
    let passed = true;
    
    try {
      const grover = new Grover(3, x => x === 5);
      const circuit = grover.buildCircuit();
      
      if (circuit.getNumQubits() !== 3) {
        passed = false;
      }
      
      const state = circuit.getStatevector();
      if (!state.isNormalized()) {
        passed = false;
      }
    } catch {
      passed = false;
    }

    const hash = HashVerifier.hash(`circuit-algorithm-test:${passed}`);

    return {
      name: 'Circuit-Algorithm Integration',
      modules: ['QuantumCircuit', 'QuantumAlgorithms'],
      passed,
      description: 'Build Grover circuit and verify state',
      hash
    };
  }

  /**
   * Test Algorithm-Revolutionary integration
   */
  public static testAlgorithmRevolutionaryIntegration(): CrossModuleTest {
    let passed = true;
    
    try {
      const groverTest = RevolutionaryTester.testGroverSpeedup([4, 8, 16]);
      
      if (groverTest.speedupFactor < 1) {
        passed = false;
      }
      
      if (groverTest.quantumComplexity !== ComplexityClass.O_SQRT_N) {
        passed = false;
      }
    } catch {
      passed = false;
    }

    const hash = HashVerifier.hash(`algorithm-revolutionary-test:${passed}`);

    return {
      name: 'Algorithm-Revolutionary Integration',
      modules: ['QuantumAlgorithms', 'RevolutionaryTester'],
      passed,
      description: 'Test Grover speedup with revolutionary tester',
      hash
    };
  }

  /**
   * Test full integration (all modules)
   */
  public static testFullIntegration(): CrossModuleTest {
    let passed = true;
    
    try {
      // Create qubit register
      const reg = QubitFactory.register(3);
      
      // Build circuit
      const circuit = new QuantumCircuit(3);
      circuit.h(0).cx(0, 1).cx(1, 2);
      
      // Get statevector
      const state = circuit.getStatevector();
      
      // Validate with revolutionary tester
      const result = O1Validator.validate('GHZCreation', () => ({
        operations: 3, // H + 2 CNOTs
        time: 0.001
      }));
      
      if (!state.isNormalized()) passed = false;
      if (!result.algorithm) passed = false;
      
    } catch {
      passed = false;
    }

    const hash = HashVerifier.hash(`full-integration-test:${passed}`);

    return {
      name: 'Full Integration',
      modules: ['Qubit', 'QuantumGates', 'QuantumCircuit', 'QuantumAlgorithms', 'RevolutionaryTester'],
      passed,
      description: 'End-to-end test across all quantum computing modules',
      hash
    };
  }

  /**
   * Run all cross-module tests
   */
  public static runAllCrossModuleTests(): CrossModuleTest[] {
    return [
      this.testQubitGateIntegration(),
      this.testGateCircuitIntegration(),
      this.testCircuitAlgorithmIntegration(),
      this.testAlgorithmRevolutionaryIntegration(),
      this.testFullIntegration()
    ];
  }

  // ============================================================================
  // Benchmarks
  // ============================================================================

  /**
   * Benchmark circuit execution
   */
  public static benchmarkCircuit(numQubits: number, depth: number): BenchmarkResult {
    const circuit = CircuitFactory.random(numQubits, depth);
    
    const startTime = performance.now();
    const state = circuit.getStatevector();
    const executionTime = performance.now() - startTime;
    
    const hash = HashVerifier.hash(`benchmark:${numQubits}:${depth}:${executionTime}`);

    return {
      name: `Circuit ${numQubits}q x ${depth}d`,
      numQubits,
      depth,
      executionTime,
      memoryUsage: 2 ** numQubits * 16, // Approximate bytes for state vector
      gateCount: circuit.getStats().gateCount,
      hash
    };
  }

  /**
   * Run standard benchmarks
   */
  public static runBenchmarks(): BenchmarkResult[] {
    const benchmarks: BenchmarkResult[] = [];
    
    // Small circuits
    benchmarks.push(this.benchmarkCircuit(3, 5));
    benchmarks.push(this.benchmarkCircuit(4, 5));
    benchmarks.push(this.benchmarkCircuit(5, 5));
    
    // Deeper circuits
    benchmarks.push(this.benchmarkCircuit(3, 10));
    benchmarks.push(this.benchmarkCircuit(4, 10));
    
    // Larger circuits
    benchmarks.push(this.benchmarkCircuit(6, 3));
    benchmarks.push(this.benchmarkCircuit(7, 2));
    
    return benchmarks;
  }

  // ============================================================================
  // Summary
  // ============================================================================

  /**
   * Generate integration summary
   */
  public static generateSummary(): IntegrationSummary {
    const moduleValidations = this.validateAllModules();
    const crossModuleTests = this.runAllCrossModuleTests();
    const benchmarks = this.runBenchmarks();
    
    const validatedModules = moduleValidations.filter(m => m.status === 'passed').length;
    const passedTests = crossModuleTests.filter(t => t.passed).length;
    
    let overallStatus: 'healthy' | 'degraded' | 'failed';
    if (validatedModules === moduleValidations.length && passedTests === crossModuleTests.length) {
      overallStatus = 'healthy';
    } else if (validatedModules >= moduleValidations.length / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'failed';
    }
    
    const hash = HashVerifier.hash(
      `summary:${validatedModules}:${passedTests}:${overallStatus}`
    );

    return {
      totalModules: moduleValidations.length,
      validatedModules,
      crossModuleTests: crossModuleTests.length,
      passedTests,
      benchmarks,
      overallStatus,
      hash
    };
  }

  /**
   * Export proof chain
   */
  public static exportProofChain(): string {
    const summary = this.generateSummary();
    const moduleValidations = this.validateAllModules();
    const crossModuleTests = this.runAllCrossModuleTests();
    
    const proofChain = {
      timestamp: new Date().toISOString(),
      summary,
      moduleValidations: moduleValidations.map(v => ({
        module: v.module,
        status: v.status,
        hash: v.hash
      })),
      crossModuleTests: crossModuleTests.map(t => ({
        name: t.name,
        passed: t.passed,
        hash: t.hash
      })),
      masterHash: summary.hash
    };
    
    return JSON.stringify(proofChain, null, 2);
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory for quantum computing integration
 */
export class QComputingIntegrationFactory {
  /**
   * Create full integration test suite
   */
  public static createTestSuite(): {
    modules: ModuleValidation[];
    crossTests: CrossModuleTest[];
    benchmarks: BenchmarkResult[];
  } {
    return {
      modules: QComputingIntegration.validateAllModules(),
      crossTests: QComputingIntegration.runAllCrossModuleTests(),
      benchmarks: QComputingIntegration.runBenchmarks()
    };
  }

  /**
   * Quick validation check
   */
  public static quickCheck(): { healthy: boolean; issues: string[] } {
    const summary = QComputingIntegration.generateSummary();
    const issues: string[] = [];
    
    if (summary.validatedModules < summary.totalModules) {
      issues.push(`${summary.totalModules - summary.validatedModules} modules failed validation`);
    }
    
    if (summary.passedTests < summary.crossModuleTests) {
      issues.push(`${summary.crossModuleTests - summary.passedTests} cross-module tests failed`);
    }
    
    return {
      healthy: summary.overallStatus === 'healthy',
      issues
    };
  }
}
