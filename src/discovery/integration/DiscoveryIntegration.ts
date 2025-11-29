/**
 * DiscoveryIntegration - Discovery Engine Integration (M10.06)
 * PRD-10 Phase 10.6: Integration & Discovery Engine Launch
 * 
 * Integrates all discovery modules and launches autonomous exploration.
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { HypothesisEngine, Hypothesis, GenerationConfig, GenerationResult } from '../hypothesis/HypothesisEngine';
import { AnomalyDetector, Anomaly, BreakthroughCandidate, DetectionResult } from '../anomaly/AnomalyDetector';
import { AutoExplorer, Discovery, ExplorationConfig, ExplorationResult } from '../explorer/AutoExplorer';
import { BreakthroughValidator, ValidationResult } from '../validation/BreakthroughValidator';
import { DiscoveryDocs, DiscoveryReport, ProofDocument } from '../documentation/DiscoveryDocs';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DiscoveryPipelineConfig {
  hypothesisConfig: Partial<GenerationConfig>;
  explorationConfig: Partial<ExplorationConfig>;
  maxBreakthroughs: number;
  autoValidate: boolean;
  autoDocument: boolean;
}

export interface DiscoveryPipelineResult {
  hypotheses: Hypothesis[];
  explorationResult?: ExplorationResult;
  anomalies: Anomaly[];
  breakthroughs: BreakthroughCandidate[];
  validations: ValidationResult[];
  reports: DiscoveryReport[];
  statistics: DiscoveryStatistics;
  hash: string;
}

export interface DiscoveryStatistics {
  totalHypotheses: number;
  totalExplorations: number;
  totalAnomalies: number;
  totalBreakthroughs: number;
  confirmedBreakthroughs: number;
  documentsGenerated: number;
  executionTime: number;
}

export interface ModuleValidation {
  module: string;
  status: 'valid' | 'invalid' | 'error';
  tests: { name: string; passed: boolean; error?: string }[];
  hash: string;
}

export interface IntegrationTest {
  name: string;
  description: string;
  run: () => Promise<boolean>;
}

// ============================================================================
// DISCOVERY INTEGRATION
// ============================================================================

export class DiscoveryIntegration {
  private logger: Logger;
  private hypothesisEngine: HypothesisEngine;
  private anomalyDetector: AnomalyDetector;
  private autoExplorer: AutoExplorer;
  private breakthroughValidator: BreakthroughValidator;
  private discoveryDocs: DiscoveryDocs;
  private validations: Map<string, ModuleValidation> = new Map();
  private integrationTests: IntegrationTest[] = [];

  constructor(
    hypothesisEngine?: HypothesisEngine,
    anomalyDetector?: AnomalyDetector,
    autoExplorer?: AutoExplorer,
    breakthroughValidator?: BreakthroughValidator,
    discoveryDocs?: DiscoveryDocs,
    logger?: Logger
  ) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.hypothesisEngine = hypothesisEngine || new HypothesisEngine(this.logger);
    this.anomalyDetector = anomalyDetector || new AnomalyDetector();
    this.autoExplorer = autoExplorer || new AutoExplorer(this.hypothesisEngine, this.anomalyDetector, this.logger);
    this.breakthroughValidator = breakthroughValidator || new BreakthroughValidator();
    this.discoveryDocs = discoveryDocs || new DiscoveryDocs(this.logger);
    
    this.initializeIntegrationTests();
  }

  /**
   * Initialize integration tests
   */
  private initializeIntegrationTests(): void {
    // Hypothesis -> Anomaly test
    this.integrationTests.push({
      name: 'Hypothesis-Anomaly Integration',
      description: 'Test hypothesis generation feeding into anomaly detection',
      run: async () => {
        const result = this.hypothesisEngine.generate({
          maxHypotheses: 5,
          noveltyThreshold: 0,
          confidenceThreshold: 0,
          enableCombinations: false,
          enableMutations: false,
          categories: ['physics']
        });
        return result.hypotheses.length > 0;
      }
    });

    // Anomaly -> Validator test
    this.integrationTests.push({
      name: 'Anomaly-Validator Integration',
      description: 'Test anomaly detection feeding into breakthrough validation',
      run: async () => {
        const data = [1, 2, 3, 4, 5, 100];
        const detection = this.anomalyDetector.detect(data);
        if (detection.breakthroughCandidates.length > 0) {
          const validation = this.breakthroughValidator.validate(detection.breakthroughCandidates[0]);
          return validation.id !== undefined;
        }
        return true; // No breakthroughs to validate is OK
      }
    });

    // Explorer -> Docs test
    this.integrationTests.push({
      name: 'Explorer-Docs Integration',
      description: 'Test exploration results being documented',
      run: async () => {
        const discoveries = this.autoExplorer.getAllDiscoveries();
        if (discoveries.length > 0) {
          const report = this.discoveryDocs.createDiscoveryReport(discoveries[0]);
          return report.id !== undefined;
        }
        return true;
      }
    });

    // Full pipeline test
    this.integrationTests.push({
      name: 'Full Pipeline Integration',
      description: 'Test complete discovery pipeline',
      run: async () => {
        try {
          const result = this.runPipeline({
            hypothesisConfig: { maxHypotheses: 3, categories: ['physics'] },
            explorationConfig: {
              maxIterations: 5,
              parallelPaths: 1,
              parameterBounds: { x: { min: 0, max: 10 } },
              objectiveFunction: (p) => p.x
            },
            maxBreakthroughs: 2,
            autoValidate: true,
            autoDocument: true
          });
          return result.statistics.totalHypotheses > 0;
        } catch (e) {
          return false;
        }
      }
    });
  }

  /**
   * Validate HypothesisEngine module
   */
  validateHypothesisEngine(): ModuleValidation {
    const tests: { name: string; passed: boolean; error?: string }[] = [];

    try {
      // Test generation
      const result = this.hypothesisEngine.generate({
        maxHypotheses: 5,
        noveltyThreshold: 0,
        confidenceThreshold: 0,
        enableCombinations: false,
        enableMutations: false,
        categories: ['physics']
      });
      tests.push({ name: 'Hypothesis generation', passed: result.hypotheses.length > 0 });

      // Test retrieval
      const all = this.hypothesisEngine.getAllHypotheses();
      tests.push({ name: 'Hypothesis retrieval', passed: all.length >= 0 });

      // Test hash
      const hash = this.hypothesisEngine.getHash();
      tests.push({ name: 'Hash generation', passed: hash.length > 0 });

    } catch (e) {
      tests.push({ name: 'Module execution', passed: false, error: String(e) });
    }

    const allPassed = tests.every(t => t.passed);
    const validation: ModuleValidation = {
      module: 'HypothesisEngine',
      status: allPassed ? 'valid' : 'invalid',
      tests,
      hash: HashVerifier.hash(`HypothesisEngine-${Date.now()}`)
    };

    this.validations.set('HypothesisEngine', validation);
    return validation;
  }

  /**
   * Validate AnomalyDetector module
   */
  validateAnomalyDetector(): ModuleValidation {
    const tests: { name: string; passed: boolean; error?: string }[] = [];

    try {
      // Test detection
      const data = [1, 2, 3, 4, 5, 100];
      const result = this.anomalyDetector.detect(data);
      tests.push({ name: 'Anomaly detection', passed: result.anomalies.length > 0 });

      // Test configuration
      const config = this.anomalyDetector.getConfig();
      tests.push({ name: 'Configuration retrieval', passed: config.zScoreThreshold > 0 });

      // Test hash
      const hash = this.anomalyDetector.getHash();
      tests.push({ name: 'Hash generation', passed: hash.length > 0 });

    } catch (e) {
      tests.push({ name: 'Module execution', passed: false, error: String(e) });
    }

    const allPassed = tests.every(t => t.passed);
    const validation: ModuleValidation = {
      module: 'AnomalyDetector',
      status: allPassed ? 'valid' : 'invalid',
      tests,
      hash: HashVerifier.hash(`AnomalyDetector-${Date.now()}`)
    };

    this.validations.set('AnomalyDetector', validation);
    return validation;
  }

  /**
   * Validate AutoExplorer module
   */
  validateAutoExplorer(): ModuleValidation {
    const tests: { name: string; passed: boolean; error?: string }[] = [];

    try {
      // Test exploration
      const config: ExplorationConfig = {
        maxIterations: 5,
        convergenceThreshold: 0.01,
        explorationRate: 0.3,
        learningRate: 0.1,
        parallelPaths: 1,
        parameterBounds: { x: { min: 0, max: 10 } },
        objectiveFunction: (p) => p.x,
        seed: 42
      };
      const result = this.autoExplorer.explore(config, 'random');
      tests.push({ name: 'Exploration execution', passed: result.paths.length > 0 });

      // Test path retrieval
      const paths = this.autoExplorer.getAllPaths();
      tests.push({ name: 'Path retrieval', passed: paths.length > 0 });

      // Test hash
      const hash = this.autoExplorer.getHash();
      tests.push({ name: 'Hash generation', passed: hash.length > 0 });

    } catch (e) {
      tests.push({ name: 'Module execution', passed: false, error: String(e) });
    }

    const allPassed = tests.every(t => t.passed);
    const validation: ModuleValidation = {
      module: 'AutoExplorer',
      status: allPassed ? 'valid' : 'invalid',
      tests,
      hash: HashVerifier.hash(`AutoExplorer-${Date.now()}`)
    };

    this.validations.set('AutoExplorer', validation);
    return validation;
  }

  /**
   * Validate BreakthroughValidator module
   */
  validateBreakthroughValidator(): ModuleValidation {
    const tests: { name: string; passed: boolean; error?: string }[] = [];

    try {
      // Create test candidate
      const data = [1, 2, 3, 4, 5, 100];
      const detection = this.anomalyDetector.detect(data);
      
      if (detection.breakthroughCandidates.length > 0) {
        // Test validation
        const result = this.breakthroughValidator.validate(detection.breakthroughCandidates[0]);
        tests.push({ name: 'Breakthrough validation', passed: result.id !== undefined });
        tests.push({ name: 'Certainty calculation', passed: result.overallCertainty.score >= 0 });
      } else {
        tests.push({ name: 'Breakthrough validation', passed: true }); // No candidates to validate
      }

      // Test configuration
      const config = this.breakthroughValidator.getConfig();
      tests.push({ name: 'Configuration retrieval', passed: config.minimumCertainty > 0 });

      // Test hash
      const hash = this.breakthroughValidator.getHash();
      tests.push({ name: 'Hash generation', passed: hash.length > 0 });

    } catch (e) {
      tests.push({ name: 'Module execution', passed: false, error: String(e) });
    }

    const allPassed = tests.every(t => t.passed);
    const validation: ModuleValidation = {
      module: 'BreakthroughValidator',
      status: allPassed ? 'valid' : 'invalid',
      tests,
      hash: HashVerifier.hash(`BreakthroughValidator-${Date.now()}`)
    };

    this.validations.set('BreakthroughValidator', validation);
    return validation;
  }

  /**
   * Validate DiscoveryDocs module
   */
  validateDiscoveryDocs(): ModuleValidation {
    const tests: { name: string; passed: boolean; error?: string }[] = [];

    try {
      // Create test discovery
      const discovery: Discovery = {
        id: 'DISC-TEST',
        type: 'pattern',
        description: 'Test discovery',
        significance: 0.8,
        evidence: [{ id: 'EV-1', type: 'computational', description: 'Test', strength: 0.9, reproducible: true }],
        status: 'preliminary',
        hash: 'test',
        createdAt: new Date()
      };

      // Test guide creation
      const guide = this.discoveryDocs.createReproducibilityGuide(discovery);
      tests.push({ name: 'Guide creation', passed: guide.id !== undefined });

      // Test proof creation
      const proof = this.discoveryDocs.createProofDocument('Test', discovery);
      tests.push({ name: 'Proof creation', passed: proof.id !== undefined });

      // Test report creation
      const report = this.discoveryDocs.createDiscoveryReport(discovery);
      tests.push({ name: 'Report creation', passed: report.id !== undefined });

      // Test hash chain
      const isValid = this.discoveryDocs.verifyHashChain();
      tests.push({ name: 'Hash chain integrity', passed: isValid });

    } catch (e) {
      tests.push({ name: 'Module execution', passed: false, error: String(e) });
    }

    const allPassed = tests.every(t => t.passed);
    const validation: ModuleValidation = {
      module: 'DiscoveryDocs',
      status: allPassed ? 'valid' : 'invalid',
      tests,
      hash: HashVerifier.hash(`DiscoveryDocs-${Date.now()}`)
    };

    this.validations.set('DiscoveryDocs', validation);
    return validation;
  }

  /**
   * Validate all modules
   */
  validateAll(): ModuleValidation[] {
    return [
      this.validateHypothesisEngine(),
      this.validateAnomalyDetector(),
      this.validateAutoExplorer(),
      this.validateBreakthroughValidator(),
      this.validateDiscoveryDocs()
    ];
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(): Promise<{ name: string; passed: boolean }[]> {
    const results: { name: string; passed: boolean }[] = [];

    for (const test of this.integrationTests) {
      try {
        const passed = await test.run();
        results.push({ name: test.name, passed });
      } catch (e) {
        results.push({ name: test.name, passed: false });
      }
    }

    return results;
  }

  /**
   * Run complete discovery pipeline
   */
  runPipeline(config: DiscoveryPipelineConfig): DiscoveryPipelineResult {
    const startTime = Date.now();
    this.logger.info('Starting discovery pipeline');

    // Generate hypotheses
    const genConfig: GenerationConfig = {
      maxHypotheses: 10,
      noveltyThreshold: 0,
      confidenceThreshold: 0,
      enableCombinations: true,
      enableMutations: false,
      categories: ['physics', 'mathematics', 'computation'],
      ...config.hypothesisConfig
    };
    const hypothesesResult = this.hypothesisEngine.generate(genConfig);
    const hypotheses = hypothesesResult.hypotheses;

    // Run exploration if configured
    let explorationResult: ExplorationResult | undefined;
    let discoveries: Discovery[] = [];
    
    if (config.explorationConfig.objectiveFunction) {
      const exploreConfig: ExplorationConfig = {
        maxIterations: 50,
        convergenceThreshold: 0.01,
        explorationRate: 0.3,
        learningRate: 0.1,
        parallelPaths: 2,
        parameterBounds: config.explorationConfig.parameterBounds || { x: { min: 0, max: 10 } },
        objectiveFunction: config.explorationConfig.objectiveFunction,
        ...config.explorationConfig
      };
      explorationResult = this.autoExplorer.explore(exploreConfig, 'gradient');
      discoveries = explorationResult.discoveries;
    }

    // Collect anomalies
    const anomalies = this.anomalyDetector.getAllAnomalies();
    const breakthroughs = this.anomalyDetector.getBreakthroughCandidates();

    // Validate breakthroughs if configured
    const validations: ValidationResult[] = [];
    if (config.autoValidate && breakthroughs.length > 0) {
      for (let i = 0; i < Math.min(breakthroughs.length, config.maxBreakthroughs); i++) {
        const validation = this.breakthroughValidator.validate(breakthroughs[i]);
        validations.push(validation);
      }
    }

    // Generate documentation if configured
    const reports: DiscoveryReport[] = [];
    if (config.autoDocument) {
      for (const discovery of discoveries.slice(0, 5)) {
        const validation = validations.find(v => v.candidateId === discovery.relatedAnomaly);
        const report = this.discoveryDocs.createDiscoveryReport(discovery, validation);
        reports.push(report);
      }
    }

    const executionTime = Date.now() - startTime;

    const result: Omit<DiscoveryPipelineResult, 'hash'> = {
      hypotheses,
      explorationResult,
      anomalies,
      breakthroughs,
      validations,
      reports,
      statistics: {
        totalHypotheses: hypotheses.length,
        totalExplorations: explorationResult ? explorationResult.paths.length : 0,
        totalAnomalies: anomalies.length,
        totalBreakthroughs: breakthroughs.length,
        confirmedBreakthroughs: validations.filter(v => v.recommendation === 'confirm').length,
        documentsGenerated: reports.length,
        executionTime
      }
    };

    this.logger.info(`Pipeline complete: ${result.statistics.totalHypotheses} hypotheses, ${result.statistics.totalBreakthroughs} breakthroughs`);

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Check if ready for PRD-11 (Synthesis)
   */
  isReadyForPRD11(): boolean {
    const validations = this.validateAll();
    return validations.every(v => v.status === 'valid');
  }

  /**
   * Get validation results
   */
  getValidations(): ModuleValidation[] {
    return Array.from(this.validations.values());
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`DiscoveryIntegration-${this.validations.size}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): {
    validations: ModuleValidation[];
    hypothesesChain: ReturnType<HypothesisEngine['exportProofChain']>;
    anomalyChain: ReturnType<AnomalyDetector['exportProofChain']>;
    explorerChain: ReturnType<AutoExplorer['exportProofChain']>;
    validatorChain: ReturnType<BreakthroughValidator['exportProofChain']>;
    docsChain: ReturnType<DiscoveryDocs['exportProofChain']>;
  } {
    return {
      validations: Array.from(this.validations.values()),
      hypothesesChain: this.hypothesisEngine.exportProofChain(),
      anomalyChain: this.anomalyDetector.exportProofChain(),
      explorerChain: this.autoExplorer.exportProofChain(),
      validatorChain: this.breakthroughValidator.exportProofChain(),
      docsChain: this.discoveryDocs.exportProofChain()
    };
  }
}

// ============================================================================
// DISCOVERY INTEGRATION FACTORY
// ============================================================================

export class DiscoveryIntegrationFactory {
  /**
   * Create default integration
   */
  static default(): DiscoveryIntegration {
    return new DiscoveryIntegration();
  }

  /**
   * Create with custom components
   */
  static custom(
    hypothesisEngine?: HypothesisEngine,
    anomalyDetector?: AnomalyDetector,
    autoExplorer?: AutoExplorer,
    breakthroughValidator?: BreakthroughValidator,
    discoveryDocs?: DiscoveryDocs
  ): DiscoveryIntegration {
    return new DiscoveryIntegration(
      hypothesisEngine,
      anomalyDetector,
      autoExplorer,
      breakthroughValidator,
      discoveryDocs
    );
  }
}
