/**
 * ExperimentDesigner - Scientific Experiment Design System (M09.01)
 * PRD-09 Phase 9.1: Experimental Verification Design
 * 
 * Creates verification experiments, simulation frameworks, and reproducibility systems
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Variable {
  name: string;
  type: 'independent' | 'dependent' | 'controlled';
  domain: { min: number; max: number } | string[];
  unit?: string;
  description: string;
}

export interface Hypothesis {
  id: string;
  statement: string;
  variables: Variable[];
  predictions: Prediction[];
  nullHypothesis: string;
  alternativeHypothesis: string;
  significance: number; // alpha level
  hash: string;
  createdAt: Date;
}

export interface Prediction {
  id: string;
  condition: string;
  expectedOutcome: string;
  quantitative?: {
    value: number;
    uncertainty: number;
    unit: string;
  };
  confidence: number;
  hash: string;
}

export interface ExperimentConfig {
  sampleSize: number;
  repetitions: number;
  randomization: boolean;
  blinding: 'none' | 'single' | 'double';
  controlGroup: boolean;
  timeframe?: { start: Date; end: Date };
}

export interface ExperimentStep {
  order: number;
  description: string;
  duration?: number; // seconds
  inputs: string[];
  outputs: string[];
  validation?: (result: unknown) => boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: Hypothesis;
  config: ExperimentConfig;
  steps: ExperimentStep[];
  equipment: string[];
  safetyPrecautions: string[];
  expectedDuration: number; // seconds
  status: 'designed' | 'ready' | 'running' | 'completed' | 'failed';
  results?: ExperimentResult[];
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentResult {
  experimentId: string;
  runNumber: number;
  startTime: Date;
  endTime: Date;
  data: Record<string, number | string | boolean>;
  observations: string[];
  anomalies: string[];
  valid: boolean;
  hash: string;
}

export interface ReproducibilityGuide {
  experimentId: string;
  version: string;
  materials: { name: string; specification: string; quantity: string }[];
  equipment: { name: string; model: string; calibration: string }[];
  environment: { parameter: string; value: string; tolerance: string }[];
  procedure: { step: number; instruction: string; criticalPoints: string[] }[];
  expectedResults: { metric: string; value: number; tolerance: number }[];
  troubleshooting: { issue: string; solution: string }[];
  hash: string;
}

export interface SimulationConfig {
  iterations: number;
  seed?: number;
  precision: number;
  parallelization: boolean;
  checkpoints: number[];
}

export interface SimulationResult {
  id: string;
  config: SimulationConfig;
  iterations: number;
  duration: number;
  results: Record<string, number[]>;
  statistics: {
    mean: Record<string, number>;
    std: Record<string, number>;
    min: Record<string, number>;
    max: Record<string, number>;
  };
  hash: string;
}

// ============================================================================
// HYPOTHESIS BUILDER
// ============================================================================

export class HypothesisBuilder {
  private id: string = '';
  private statement: string = '';
  private variables: Variable[] = [];
  private predictions: Prediction[] = [];
  private nullHypothesis: string = '';
  private alternativeHypothesis: string = '';
  private significance: number = 0.05;

  setId(id: string): HypothesisBuilder {
    this.id = id;
    return this;
  }

  setStatement(statement: string): HypothesisBuilder {
    this.statement = statement;
    return this;
  }

  addVariable(variable: Variable): HypothesisBuilder {
    this.variables.push(variable);
    return this;
  }

  addPrediction(prediction: Omit<Prediction, 'hash'>): HypothesisBuilder {
    const hash = HashVerifier.hash(JSON.stringify(prediction));
    this.predictions.push({ ...prediction, hash });
    return this;
  }

  setNullHypothesis(h0: string): HypothesisBuilder {
    this.nullHypothesis = h0;
    return this;
  }

  setAlternativeHypothesis(h1: string): HypothesisBuilder {
    this.alternativeHypothesis = h1;
    return this;
  }

  setSignificanceLevel(alpha: number): HypothesisBuilder {
    if (alpha <= 0 || alpha >= 1) {
      throw new Error('Significance level must be between 0 and 1');
    }
    this.significance = alpha;
    return this;
  }

  build(): Hypothesis {
    if (!this.id || !this.statement) {
      throw new Error('Hypothesis must have id and statement');
    }
    if (this.variables.length === 0) {
      throw new Error('Hypothesis must have at least one variable');
    }
    if (!this.nullHypothesis || !this.alternativeHypothesis) {
      throw new Error('Hypothesis must have null and alternative hypotheses');
    }

    const hypothesis: Omit<Hypothesis, 'hash'> = {
      id: this.id,
      statement: this.statement,
      variables: this.variables,
      predictions: this.predictions,
      nullHypothesis: this.nullHypothesis,
      alternativeHypothesis: this.alternativeHypothesis,
      significance: this.significance,
      createdAt: new Date()
    };

    return {
      ...hypothesis,
      hash: HashVerifier.hash(JSON.stringify(hypothesis))
    };
  }
}

// ============================================================================
// EXPERIMENT DESIGNER
// ============================================================================

export class ExperimentDesigner {
  private logger: Logger;
  private experiments: Map<string, Experiment> = new Map();
  private results: Map<string, ExperimentResult[]> = new Map();

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
  }

  /**
   * Create a new hypothesis using builder pattern
   */
  createHypothesis(): HypothesisBuilder {
    return new HypothesisBuilder();
  }

  /**
   * Design a new experiment based on hypothesis
   */
  designExperiment(
    name: string,
    description: string,
    hypothesis: Hypothesis,
    config: ExperimentConfig
  ): Experiment {
    const id = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Validate config
    this.validateConfig(config);

    const experiment: Omit<Experiment, 'hash'> = {
      id,
      name,
      description,
      hypothesis,
      config,
      steps: [],
      equipment: [],
      safetyPrecautions: [],
      expectedDuration: 0,
      status: 'designed',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const hash = HashVerifier.hash(JSON.stringify(experiment));
    const finalExperiment: Experiment = { ...experiment, hash };

    this.experiments.set(id, finalExperiment);
    this.logger.info(`Designed experiment: ${name}`, { experimentId: id });

    return finalExperiment;
  }

  /**
   * Add steps to an experiment
   */
  addStep(experimentId: string, step: ExperimentStep): Experiment {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.steps.push(step);
    experiment.expectedDuration += step.duration || 0;
    experiment.updatedAt = new Date();
    experiment.hash = HashVerifier.hash(JSON.stringify({ ...experiment, hash: '' }));

    return experiment;
  }

  /**
   * Add equipment to an experiment
   */
  addEquipment(experimentId: string, equipment: string[]): Experiment {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.equipment.push(...equipment);
    experiment.updatedAt = new Date();
    experiment.hash = HashVerifier.hash(JSON.stringify({ ...experiment, hash: '' }));

    return experiment;
  }

  /**
   * Add safety precautions
   */
  addSafetyPrecautions(experimentId: string, precautions: string[]): Experiment {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.safetyPrecautions.push(...precautions);
    experiment.updatedAt = new Date();
    experiment.hash = HashVerifier.hash(JSON.stringify({ ...experiment, hash: '' }));

    return experiment;
  }

  /**
   * Mark experiment as ready for execution
   */
  finalizeExperiment(experimentId: string): Experiment {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Validate experiment completeness
    if (experiment.steps.length === 0) {
      throw new Error('Experiment must have at least one step');
    }

    experiment.status = 'ready';
    experiment.updatedAt = new Date();
    experiment.hash = HashVerifier.hash(JSON.stringify({ ...experiment, hash: '' }));

    this.logger.info(`Finalized experiment: ${experiment.name}`, { experimentId });

    return experiment;
  }

  /**
   * Run a simulation of the experiment
   */
  runSimulation(experimentId: string, config: SimulationConfig): SimulationResult {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const startTime = Date.now();
    const results: Record<string, number[]> = {};
    
    // Initialize random seed
    let rng = config.seed !== undefined ? this.seededRandom(config.seed) : Math.random;

    // Get dependent variables
    const dependentVars = experiment.hypothesis.variables
      .filter(v => v.type === 'dependent')
      .map(v => v.name);

    // Initialize result arrays
    for (const varName of dependentVars) {
      results[varName] = [];
    }

    // Run iterations
    for (let i = 0; i < config.iterations; i++) {
      for (const varName of dependentVars) {
        // Simulate result based on predictions
        const prediction = experiment.hypothesis.predictions.find(
          p => p.expectedOutcome.includes(varName)
        );
        
        let value: number;
        if (prediction?.quantitative) {
          // Generate value around predicted value with uncertainty
          value = this.gaussianRandom(
            prediction.quantitative.value,
            prediction.quantitative.uncertainty,
            rng
          );
        } else {
          // Generate uniform random value
          value = rng();
        }
        
        results[varName].push(value);
      }
    }

    const duration = Date.now() - startTime;

    // Calculate statistics
    const statistics = {
      mean: {} as Record<string, number>,
      std: {} as Record<string, number>,
      min: {} as Record<string, number>,
      max: {} as Record<string, number>
    };

    for (const [varName, values] of Object.entries(results)) {
      statistics.mean[varName] = this.mean(values);
      statistics.std[varName] = this.std(values);
      statistics.min[varName] = Math.min(...values);
      statistics.max[varName] = Math.max(...values);
    }

    const simResult: Omit<SimulationResult, 'hash'> = {
      id: `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      config,
      iterations: config.iterations,
      duration,
      results,
      statistics
    };

    return {
      ...simResult,
      hash: HashVerifier.hash(JSON.stringify(simResult))
    };
  }

  /**
   * Record experiment result
   */
  recordResult(
    experimentId: string,
    runNumber: number,
    data: Record<string, number | string | boolean>,
    observations: string[] = [],
    anomalies: string[] = []
  ): ExperimentResult {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const result: Omit<ExperimentResult, 'hash'> = {
      experimentId,
      runNumber,
      startTime: new Date(),
      endTime: new Date(),
      data,
      observations,
      anomalies,
      valid: anomalies.length === 0
    };

    const finalResult: ExperimentResult = {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };

    if (!this.results.has(experimentId)) {
      this.results.set(experimentId, []);
    }
    this.results.get(experimentId)!.push(finalResult);

    if (!experiment.results) {
      experiment.results = [];
    }
    experiment.results.push(finalResult);

    this.logger.info(`Recorded result for experiment ${experimentId}`, { runNumber });

    return finalResult;
  }

  /**
   * Generate reproducibility guide for an experiment
   */
  generateReproducibilityGuide(experimentId: string): ReproducibilityGuide {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const guide: Omit<ReproducibilityGuide, 'hash'> = {
      experimentId,
      version: '1.0.0',
      materials: [],
      equipment: experiment.equipment.map(e => ({
        name: e,
        model: 'Specified in original experiment',
        calibration: 'Required before use'
      })),
      environment: [
        { parameter: 'Temperature', value: '20°C', tolerance: '±2°C' },
        { parameter: 'Humidity', value: '50%', tolerance: '±10%' },
        { parameter: 'Pressure', value: '1 atm', tolerance: '±5%' }
      ],
      procedure: experiment.steps.map((step, index) => ({
        step: index + 1,
        instruction: step.description,
        criticalPoints: step.inputs.concat(step.outputs)
      })),
      expectedResults: experiment.hypothesis.predictions
        .filter(p => p.quantitative)
        .map(p => ({
          metric: p.condition,
          value: p.quantitative!.value,
          tolerance: p.quantitative!.uncertainty
        })),
      troubleshooting: [
        { issue: 'Results outside expected range', solution: 'Verify calibration and repeat measurement' },
        { issue: 'Equipment malfunction', solution: 'Check connections and power supply' }
      ]
    };

    return {
      ...guide,
      hash: HashVerifier.hash(JSON.stringify(guide))
    };
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get results for an experiment
   */
  getResults(experimentId: string): ExperimentResult[] {
    return this.results.get(experimentId) || [];
  }

  /**
   * Validate experiment configuration
   */
  private validateConfig(config: ExperimentConfig): void {
    if (config.sampleSize < 1) {
      throw new Error('Sample size must be at least 1');
    }
    if (config.repetitions < 1) {
      throw new Error('Repetitions must be at least 1');
    }
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  /**
   * Generate gaussian random number
   */
  private gaussianRandom(mean: number, std: number, rng: () => number = Math.random): number {
    // Box-Muller transform
    const u1 = rng();
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z;
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private std(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * Export proof chain
   */
  exportProofChain(): { experiments: Experiment[]; results: ExperimentResult[] } {
    return {
      experiments: Array.from(this.experiments.values()),
      results: Array.from(this.results.values()).flat()
    };
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    const data = {
      experiments: Array.from(this.experiments.entries()),
      results: Array.from(this.results.entries())
    };
    return HashVerifier.hash(JSON.stringify(data));
  }
}

// ============================================================================
// EXPERIMENT FACTORY
// ============================================================================

export class ExperimentFactory {
  /**
   * Create a quantum experiment template
   */
  static quantumExperiment(designer: ExperimentDesigner, name: string): Experiment {
    const hypothesis = designer.createHypothesis()
      .setId(`QH-${Date.now()}`)
      .setStatement('Quantum superposition enables parallel state exploration')
      .addVariable({
        name: 'qubitCount',
        type: 'independent',
        domain: { min: 1, max: 20 },
        description: 'Number of qubits in the system'
      })
      .addVariable({
        name: 'superpositionFidelity',
        type: 'dependent',
        domain: { min: 0, max: 1 },
        description: 'Quality of superposition state'
      })
      .addVariable({
        name: 'temperature',
        type: 'controlled',
        domain: { min: 0.01, max: 0.1 },
        unit: 'K',
        description: 'Operating temperature'
      })
      .setNullHypothesis('Superposition fidelity is independent of qubit count')
      .setAlternativeHypothesis('Superposition fidelity decreases with qubit count')
      .addPrediction({
        id: 'P1',
        condition: 'qubitCount <= 10',
        expectedOutcome: 'superpositionFidelity > 0.99',
        quantitative: { value: 0.995, uncertainty: 0.005, unit: '' },
        confidence: 0.95
      })
      .build();

    const experiment = designer.designExperiment(
      name,
      'Measure quantum superposition fidelity across different qubit counts',
      hypothesis,
      {
        sampleSize: 100,
        repetitions: 10,
        randomization: true,
        blinding: 'double',
        controlGroup: true
      }
    );

    designer.addStep(experiment.id, {
      order: 1,
      description: 'Initialize quantum register',
      duration: 10,
      inputs: ['qubitCount'],
      outputs: ['initialState']
    });

    designer.addStep(experiment.id, {
      order: 2,
      description: 'Apply Hadamard gates to create superposition',
      duration: 5,
      inputs: ['initialState'],
      outputs: ['superpositionState']
    });

    designer.addStep(experiment.id, {
      order: 3,
      description: 'Measure state fidelity',
      duration: 20,
      inputs: ['superpositionState'],
      outputs: ['superpositionFidelity']
    });

    designer.addEquipment(experiment.id, [
      'Quantum processor',
      'Dilution refrigerator',
      'Control electronics',
      'Measurement system'
    ]);

    designer.addSafetyPrecautions(experiment.id, [
      'Maintain cryogenic safety protocols',
      'Verify electrical isolation',
      'Monitor quench protection system'
    ]);

    return designer.finalizeExperiment(experiment.id);
  }

  /**
   * Create a complexity analysis experiment template
   */
  static complexityExperiment(designer: ExperimentDesigner, name: string): Experiment {
    const hypothesis = designer.createHypothesis()
      .setId(`CH-${Date.now()}`)
      .setStatement('Algorithm complexity scales predictably with input size')
      .addVariable({
        name: 'inputSize',
        type: 'independent',
        domain: { min: 10, max: 1000000 },
        description: 'Size of input data'
      })
      .addVariable({
        name: 'executionTime',
        type: 'dependent',
        domain: { min: 0, max: 1000000 },
        unit: 'ms',
        description: 'Time to complete algorithm'
      })
      .addVariable({
        name: 'systemLoad',
        type: 'controlled',
        domain: { min: 0, max: 0.1 },
        description: 'Background system load'
      })
      .setNullHypothesis('Execution time is independent of input size')
      .setAlternativeHypothesis('Execution time scales with input size')
      .addPrediction({
        id: 'P1',
        condition: 'O(n) algorithm',
        expectedOutcome: 'executionTime proportional to inputSize',
        confidence: 0.99
      })
      .build();

    const experiment = designer.designExperiment(
      name,
      'Measure algorithm execution time across different input sizes',
      hypothesis,
      {
        sampleSize: 50,
        repetitions: 100,
        randomization: true,
        blinding: 'none',
        controlGroup: false
      }
    );

    designer.addStep(experiment.id, {
      order: 1,
      description: 'Generate input data of specified size',
      duration: 1,
      inputs: ['inputSize'],
      outputs: ['inputData']
    });

    designer.addStep(experiment.id, {
      order: 2,
      description: 'Execute algorithm and measure time',
      duration: 60,
      inputs: ['inputData'],
      outputs: ['executionTime']
    });

    designer.addStep(experiment.id, {
      order: 3,
      description: 'Record results and verify correctness',
      duration: 1,
      inputs: ['executionTime'],
      outputs: ['verifiedResult']
    });

    designer.addEquipment(experiment.id, [
      'High-precision timer',
      'Isolated compute environment',
      'Memory profiler'
    ]);

    return designer.finalizeExperiment(experiment.id);
  }

  /**
   * Create a physics validation experiment template
   */
  static physicsExperiment(designer: ExperimentDesigner, name: string): Experiment {
    const hypothesis = designer.createHypothesis()
      .setId(`PH-${Date.now()}`)
      .setStatement('Physical constant relationships hold within measurement precision')
      .addVariable({
        name: 'measuredConstant',
        type: 'dependent',
        domain: { min: 0, max: 1e50 },
        description: 'Measured physical constant value'
      })
      .addVariable({
        name: 'theoreticalValue',
        type: 'controlled',
        domain: { min: 0, max: 1e50 },
        description: 'CODATA theoretical value'
      })
      .setNullHypothesis('Measured value equals theoretical value within uncertainty')
      .setAlternativeHypothesis('Measured value differs from theoretical value')
      .addPrediction({
        id: 'P1',
        condition: 'Standard measurement conditions',
        expectedOutcome: 'Agreement within 3 sigma',
        confidence: 0.997
      })
      .build();

    const experiment = designer.designExperiment(
      name,
      'Validate physical constant measurements against theoretical predictions',
      hypothesis,
      {
        sampleSize: 1000,
        repetitions: 50,
        randomization: true,
        blinding: 'single',
        controlGroup: true
      }
    );

    designer.addStep(experiment.id, {
      order: 1,
      description: 'Calibrate measurement apparatus',
      duration: 300,
      inputs: ['calibrationStandard'],
      outputs: ['calibrationFactor']
    });

    designer.addStep(experiment.id, {
      order: 2,
      description: 'Perform measurement series',
      duration: 600,
      inputs: ['calibrationFactor'],
      outputs: ['rawMeasurements']
    });

    designer.addStep(experiment.id, {
      order: 3,
      description: 'Apply corrections and calculate result',
      duration: 60,
      inputs: ['rawMeasurements'],
      outputs: ['measuredConstant']
    });

    designer.addEquipment(experiment.id, [
      'Precision measurement instrument',
      'Environmental control system',
      'Reference standard',
      'Data acquisition system'
    ]);

    designer.addSafetyPrecautions(experiment.id, [
      'Follow radiation safety protocols if applicable',
      'Maintain cleanroom conditions',
      'Document all environmental conditions'
    ]);

    return designer.finalizeExperiment(experiment.id);
  }
}
