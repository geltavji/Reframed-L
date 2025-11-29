/**
 * Qlaws Ham - Quantum Computing Module Exports
 * 
 * @module qcomputing
 * @version 1.0.0
 */

// Qubit Module (M08.01)
export {
  Qubit,
  QubitState,
  MultiQubitState,
  BlochSphere,
  QubitRegister,
  QubitFactory,
  QubitAmplitudes,
  BlochCoordinates,
  MeasurementResult,
  MultiQubitMeasurement,
  QubitConfig
} from './qubit/Qubit';

// Gates Module (M08.02)
export {
  Gate,
  CustomGate,
  PauliX,
  PauliY,
  PauliZ,
  Hadamard,
  SGate,
  SDagger,
  TGate,
  TDagger,
  Identity,
  RotationX,
  RotationY,
  RotationZ,
  Phase,
  U3,
  CNOT,
  CZ,
  SWAP,
  iSWAP,
  SqrtSWAP,
  CPhase,
  CRX,
  Toffoli,
  Fredkin,
  ControlledGate,
  GateLibrary,
  QuantumGatesFactory,
  GateType,
  GateProperties,
  GateResult
} from './gates/QuantumGates';

// Circuit Module (M08.03)
export {
  QuantumCircuit,
  CircuitOptimizer,
  CircuitFactory,
  CircuitOperation,
  MeasurementOp,
  CircuitResult,
  ShotResults,
  CircuitStats,
  OptimizationOptions
} from './circuit/QuantumCircuit';

// Algorithms Module (M08.04)
export {
  Grover,
  Shor,
  VQE,
  QAOA,
  QPE,
  QuantumAlgorithmsFactory,
  OracleFunction,
  AlgorithmResult,
  GroverResult,
  ShorResult,
  VQEResult,
  QAOAResult,
  QPEResult,
  CostFunction
} from './algorithms/QuantumAlgorithms';

// Revolutionary Tester Module (M08.05)
export {
  RevolutionaryTester,
  O1Validator,
  ComplexityMeasure,
  RevolutionaryTesterFactory,
  ComplexityClass,
  ComplexityMeasurement,
  O1ValidationResult,
  RevolutionaryTestResult,
  BenchmarkConfig
} from './revolutionary/RevolutionaryTester';

// Integration Module (M08.06)
export {
  QComputingIntegration,
  QComputingIntegrationFactory,
  ModuleValidation,
  CrossModuleTest,
  BenchmarkResult,
  IntegrationSummary
} from './integration/QComputingIntegration';
