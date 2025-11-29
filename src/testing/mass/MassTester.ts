/**
 * Qlaws Ham - Mass Tester Module (M07.04)
 * 
 * Runs thousands of automated tests, tracks all results, and identifies
 * promising formulas through comprehensive multi-dimensional testing.
 * 
 * @module MassTester
 * @version 1.0.0
 * @dependencies FormulaEngine (M07.01), DimensionTester (M07.02), Logger (M01.01)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';
import { 
  FormulaEngine, 
  Formula, 
  EvaluationResult,
  ValidationStatus,
  ParameterType,
  ParameterDefinition
} from '../formula/FormulaEngine';
import { 
  DimensionTester,
  DimensionalExponents,
  DIMENSIONLESS
} from '../dimensions/DimensionTester';

/**
 * Test result status
 */
export enum TestResultStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  SKIPPED = 'skipped'
}

/**
 * Test category
 */
export enum TestCategory {
  DIMENSIONAL = 'dimensional',
  NUMERICAL = 'numerical',
  EDGE_CASE = 'edge_case',
  PERFORMANCE = 'performance',
  CONSISTENCY = 'consistency',
  RANDOM = 'random'
}

/**
 * Individual test result
 */
export interface TestResult {
  id: string;
  formulaId: string;
  formulaName: string;
  category: TestCategory;
  status: TestResultStatus;
  inputParameters: Map<string, number>;
  expectedOutput?: number;
  actualOutput: number | null;
  error?: string;
  executionTime: number;
  dimension?: number;
  hash: string;
}

/**
 * Test batch result
 */
export interface TestBatchResult {
  id: string;
  formulaId: string;
  totalTests: number;
  passed: number;
  failed: number;
  errors: number;
  passRate: number;
  avgExecutionTime: number;
  results: TestResult[];
  startTime: Date;
  endTime: Date;
  hash: string;
}

/**
 * Statistical analysis of tests
 */
export interface StatisticalAnalysis {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
  variance: number;
  percentile95: number;
  outliers: number[];
  sampleSize: number;
}

/**
 * Promising formula identification
 */
export interface PromisingFormula {
  formulaId: string;
  formulaName: string;
  score: number;
  passRate: number;
  avgExecutionTime: number;
  consistencyScore: number;
  dimensionalCoverage: number;
  reasons: string[];
  hash: string;
}

/**
 * Mass test configuration
 */
export interface MassTestConfig {
  testsPerFormula: number;
  dimensionRange: { min: number; max: number };
  parameterVariations: number;
  timeout: number;
  categories: TestCategory[];
  randomSeed?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: MassTestConfig = {
  testsPerFormula: 1000,
  dimensionRange: { min: 3, max: 11 },
  parameterVariations: 100,
  timeout: 5000,
  categories: [
    TestCategory.NUMERICAL,
    TestCategory.DIMENSIONAL,
    TestCategory.EDGE_CASE,
    TestCategory.RANDOM
  ]
};

/**
 * Test Generator for creating test cases
 */
export class TestGenerator {
  private readonly logger: Logger | null;
  private seed: number;

  constructor(logger: Logger | null = null, seed: number = Date.now()) {
    this.logger = logger;
    this.seed = seed;
  }

  /**
   * Generate random parameter values
   */
  public generateRandomParameters(
    formula: Formula,
    count: number
  ): Map<string, number>[] {
    const results: Map<string, number>[] = [];
    const params = formula.getParameters();

    for (let i = 0; i < count; i++) {
      const values = new Map<string, number>();
      
      for (const [name, param] of params) {
        if (typeof param.value === 'number') {
          const value = this.randomInRange(
            param.constraints?.min ?? -1000,
            param.constraints?.max ?? 1000
          );
          values.set(name, value);
        }
      }
      
      results.push(values);
    }

    return results;
  }

  /**
   * Generate edge case parameters
   */
  public generateEdgeCases(formula: Formula): Map<string, number>[] {
    const results: Map<string, number>[] = [];
    const params = formula.getParameters();

    // Zero values
    const zeros = new Map<string, number>();
    for (const [name] of params) {
      zeros.set(name, 0);
    }
    results.push(zeros);

    // One values
    const ones = new Map<string, number>();
    for (const [name] of params) {
      ones.set(name, 1);
    }
    results.push(ones);

    // Large values
    const large = new Map<string, number>();
    for (const [name] of params) {
      large.set(name, 1e10);
    }
    results.push(large);

    // Small values
    const small = new Map<string, number>();
    for (const [name] of params) {
      small.set(name, 1e-10);
    }
    results.push(small);

    // Negative values
    const negative = new Map<string, number>();
    for (const [name] of params) {
      negative.set(name, -1);
    }
    results.push(negative);

    return results;
  }

  /**
   * Generate dimension test cases
   */
  public generateDimensionCases(
    minDim: number,
    maxDim: number
  ): number[] {
    const dims: number[] = [];
    for (let d = minDim; d <= maxDim; d++) {
      dims.push(d);
    }
    return dims;
  }

  private randomInRange(min: number, max: number): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    const rand = this.seed / 0x7fffffff;
    return min + rand * (max - min);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[TestGenerator] ${message}`, context);
    }
  }
}

/**
 * Main MassTester class
 */
export class MassTester {
  private readonly logger: Logger | null;
  private readonly engine: FormulaEngine;
  private readonly dimensionTester: DimensionTester;
  private readonly generator: TestGenerator;
  private config: MassTestConfig;
  private testResults: TestResult[] = [];
  private batchResults: TestBatchResult[] = [];
  private promisingFormulas: PromisingFormula[] = [];

  constructor(
    engine: FormulaEngine,
    logger: Logger | null = null,
    config: MassTestConfig = DEFAULT_CONFIG
  ) {
    this.logger = logger;
    this.engine = engine;
    this.dimensionTester = new DimensionTester(engine, logger);
    this.generator = new TestGenerator(logger, config.randomSeed);
    this.config = config;
    this.log(LogLevel.INFO, 'MassTester initialized');
  }

  /**
   * Run mass tests on a formula
   */
  public runTests(formula: Formula): TestBatchResult {
    this.log(LogLevel.INFO, `Running mass tests on: ${formula.getName()}`);
    const startTime = new Date();

    const results: TestResult[] = [];

    // Run numerical tests
    if (this.config.categories.includes(TestCategory.NUMERICAL)) {
      const numTests = this.runNumericalTests(formula);
      results.push(...numTests);
    }

    // Run edge case tests
    if (this.config.categories.includes(TestCategory.EDGE_CASE)) {
      const edgeTests = this.runEdgeCaseTests(formula);
      results.push(...edgeTests);
    }

    // Run dimensional tests
    if (this.config.categories.includes(TestCategory.DIMENSIONAL)) {
      const dimTests = this.runDimensionalTests(formula);
      results.push(...dimTests);
    }

    // Run random tests
    if (this.config.categories.includes(TestCategory.RANDOM)) {
      const randomTests = this.runRandomTests(formula);
      results.push(...randomTests);
    }

    const endTime = new Date();
    const passed = results.filter(r => r.status === TestResultStatus.PASSED).length;
    const failed = results.filter(r => r.status === TestResultStatus.FAILED).length;
    const errors = results.filter(r => r.status === TestResultStatus.ERROR).length;

    const batch: TestBatchResult = {
      id: crypto.randomUUID(),
      formulaId: formula.getId(),
      totalTests: results.length,
      passed,
      failed,
      errors,
      passRate: results.length > 0 ? passed / results.length : 0,
      avgExecutionTime: results.length > 0 
        ? results.reduce((sum, r) => sum + r.executionTime, 0) / results.length 
        : 0,
      results,
      startTime,
      endTime,
      hash: ''
    };
    batch.hash = this.hashBatch(batch);

    this.testResults.push(...results);
    this.batchResults.push(batch);

    this.log(LogLevel.INFO, `Mass tests complete`, { 
      totalTests: batch.totalTests, 
      passRate: batch.passRate 
    });

    return batch;
  }

  /**
   * Run numerical tests
   */
  private runNumericalTests(formula: Formula): TestResult[] {
    const results: TestResult[] = [];
    const paramSets = this.generator.generateRandomParameters(
      formula,
      Math.floor(this.config.parameterVariations / 2)
    );

    for (const params of paramSets) {
      const result = this.runSingleTest(formula, params, TestCategory.NUMERICAL);
      results.push(result);
    }

    return results;
  }

  /**
   * Run edge case tests
   */
  private runEdgeCaseTests(formula: Formula): TestResult[] {
    const results: TestResult[] = [];
    const edgeCases = this.generator.generateEdgeCases(formula);

    for (const params of edgeCases) {
      const result = this.runSingleTest(formula, params, TestCategory.EDGE_CASE);
      results.push(result);
    }

    return results;
  }

  /**
   * Run dimensional tests
   */
  private runDimensionalTests(formula: Formula): TestResult[] {
    const results: TestResult[] = [];
    const dimensions = this.generator.generateDimensionCases(
      this.config.dimensionRange.min,
      this.config.dimensionRange.max
    );

    for (const dim of dimensions) {
      const params = new Map<string, number>();
      for (const [name, param] of formula.getParameters()) {
        if (typeof param.value === 'number') {
          params.set(name, param.value);
        }
      }

      const result = this.runSingleTest(formula, params, TestCategory.DIMENSIONAL, dim);
      results.push(result);
    }

    return results;
  }

  /**
   * Run random tests
   */
  private runRandomTests(formula: Formula): TestResult[] {
    const results: TestResult[] = [];
    const paramSets = this.generator.generateRandomParameters(
      formula,
      Math.floor(this.config.parameterVariations / 2)
    );

    for (const params of paramSets) {
      const result = this.runSingleTest(formula, params, TestCategory.RANDOM);
      results.push(result);
    }

    return results;
  }

  /**
   * Run a single test
   */
  private runSingleTest(
    formula: Formula,
    params: Map<string, number>,
    category: TestCategory,
    dimension?: number
  ): TestResult {
    const startTime = performance.now();

    try {
      // Set parameters
      for (const [name, value] of params) {
        formula.setParameter(name, value);
      }

      // Evaluate
      const evalResult = formula.evaluate();
      const executionTime = performance.now() - startTime;

      const status = evalResult.status === ValidationStatus.VALID
        ? TestResultStatus.PASSED
        : TestResultStatus.FAILED;

      const result: TestResult = {
        id: crypto.randomUUID(),
        formulaId: formula.getId(),
        formulaName: formula.getName(),
        category,
        status,
        inputParameters: params,
        actualOutput: typeof evalResult.result === 'number' ? evalResult.result : null,
        executionTime,
        dimension,
        hash: ''
      };
      result.hash = this.hashResult(result);

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const result: TestResult = {
        id: crypto.randomUUID(),
        formulaId: formula.getId(),
        formulaName: formula.getName(),
        category,
        status: TestResultStatus.ERROR,
        inputParameters: params,
        actualOutput: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        dimension,
        hash: ''
      };
      result.hash = this.hashResult(result);

      return result;
    }
  }

  /**
   * Run tests on all formulas in engine
   */
  public runAllTests(): TestBatchResult[] {
    const formulas = this.engine.getAllFormulas();
    const results: TestBatchResult[] = [];

    for (const formula of formulas) {
      const batch = this.runTests(formula);
      results.push(batch);
    }

    return results;
  }

  /**
   * Identify promising formulas
   */
  public identifyPromisingFormulas(minPassRate: number = 0.9): PromisingFormula[] {
    this.log(LogLevel.INFO, 'Identifying promising formulas');

    const formulas = this.engine.getAllFormulas();
    const promising: PromisingFormula[] = [];

    for (const formula of formulas) {
      const batchesForFormula = this.batchResults.filter(
        b => b.formulaId === formula.getId()
      );

      if (batchesForFormula.length === 0) continue;

      const avgPassRate = batchesForFormula.reduce((sum, b) => sum + b.passRate, 0) 
        / batchesForFormula.length;

      if (avgPassRate >= minPassRate) {
        const avgExecTime = batchesForFormula.reduce((sum, b) => sum + b.avgExecutionTime, 0)
          / batchesForFormula.length;

        const score = this.calculatePromisingScore(formula, batchesForFormula);

        const pf: PromisingFormula = {
          formulaId: formula.getId(),
          formulaName: formula.getName(),
          score,
          passRate: avgPassRate,
          avgExecutionTime: avgExecTime,
          consistencyScore: this.calculateConsistency(batchesForFormula),
          dimensionalCoverage: this.calculateDimensionalCoverage(batchesForFormula),
          reasons: this.generateReasons(avgPassRate, avgExecTime, score),
          hash: ''
        };
        pf.hash = this.hashPromisingFormula(pf);

        promising.push(pf);
      }
    }

    // Sort by score
    promising.sort((a, b) => b.score - a.score);
    this.promisingFormulas = promising;

    this.log(LogLevel.INFO, `Found ${promising.length} promising formulas`);
    return promising;
  }

  /**
   * Calculate promising score
   */
  private calculatePromisingScore(
    formula: Formula,
    batches: TestBatchResult[]
  ): number {
    const avgPassRate = batches.reduce((sum, b) => sum + b.passRate, 0) / batches.length;
    const avgExecTime = batches.reduce((sum, b) => sum + b.avgExecutionTime, 0) / batches.length;
    const consistency = this.calculateConsistency(batches);

    // Score based on pass rate (50%), consistency (30%), performance (20%)
    const passRateScore = avgPassRate * 50;
    const consistencyScore = consistency * 30;
    const perfScore = Math.max(0, 20 - (avgExecTime / 100)); // Lower time = higher score

    return passRateScore + consistencyScore + perfScore;
  }

  /**
   * Calculate consistency across batches
   */
  private calculateConsistency(batches: TestBatchResult[]): number {
    if (batches.length < 2) return 1;

    const passRates = batches.map(b => b.passRate);
    const mean = passRates.reduce((a, b) => a + b, 0) / passRates.length;
    const variance = passRates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / passRates.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = higher consistency
    return Math.max(0, 1 - stdDev);
  }

  /**
   * Calculate dimensional coverage
   */
  private calculateDimensionalCoverage(batches: TestBatchResult[]): number {
    const allResults = batches.flatMap(b => b.results);
    const dimResults = allResults.filter(r => r.dimension !== undefined);
    
    if (dimResults.length === 0) return 0;

    const uniqueDims = new Set(dimResults.map(r => r.dimension));
    const expectedDims = this.config.dimensionRange.max - this.config.dimensionRange.min + 1;

    return uniqueDims.size / expectedDims;
  }

  /**
   * Generate reasons for promising formula
   */
  private generateReasons(passRate: number, execTime: number, score: number): string[] {
    const reasons: string[] = [];

    if (passRate >= 0.99) reasons.push('Near-perfect pass rate');
    else if (passRate >= 0.95) reasons.push('Excellent pass rate');
    else if (passRate >= 0.9) reasons.push('Good pass rate');

    if (execTime < 1) reasons.push('Very fast execution');
    else if (execTime < 10) reasons.push('Fast execution');

    if (score >= 90) reasons.push('Outstanding overall score');
    else if (score >= 80) reasons.push('High overall score');

    return reasons;
  }

  /**
   * Perform statistical analysis on results
   */
  public analyzeResults(): StatisticalAnalysis {
    const values = this.testResults
      .filter(r => r.actualOutput !== null)
      .map(r => r.actualOutput as number);

    if (values.length === 0) {
      return {
        mean: 0, stdDev: 0, min: 0, max: 0,
        median: 0, variance: 0, percentile95: 0,
        outliers: [], sampleSize: 0
      };
    }

    // Sort for median and percentile
    const sorted = [...values].sort((a, b) => a - b);

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const median = sorted[Math.floor(sorted.length / 2)];
    const percentile95 = sorted[Math.floor(sorted.length * 0.95)];

    // Identify outliers (beyond 3 std dev)
    const outliers = values.filter(v => Math.abs(v - mean) > 3 * stdDev);

    return {
      mean,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median,
      variance,
      percentile95,
      outliers,
      sampleSize: values.length
    };
  }

  /**
   * Get configuration
   */
  public getConfig(): MassTestConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public setConfig(config: Partial<MassTestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get formula engine
   */
  public getEngine(): FormulaEngine {
    return this.engine;
  }

  /**
   * Get dimension tester
   */
  public getDimensionTester(): DimensionTester {
    return this.dimensionTester;
  }

  /**
   * Get all test results
   */
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  /**
   * Get batch results
   */
  public getBatchResults(): TestBatchResult[] {
    return [...this.batchResults];
  }

  /**
   * Get promising formulas
   */
  public getPromisingFormulas(): PromisingFormula[] {
    return [...this.promisingFormulas];
  }

  /**
   * Get results by category
   */
  public getResultsByCategory(category: TestCategory): TestResult[] {
    return this.testResults.filter(r => r.category === category);
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalTests: number;
    passed: number;
    failed: number;
    errors: number;
    passRate: number;
    batchCount: number;
    promisingCount: number;
  } {
    const passed = this.testResults.filter(r => r.status === TestResultStatus.PASSED).length;
    const failed = this.testResults.filter(r => r.status === TestResultStatus.FAILED).length;
    const errors = this.testResults.filter(r => r.status === TestResultStatus.ERROR).length;

    return {
      totalTests: this.testResults.length,
      passed,
      failed,
      errors,
      passRate: this.testResults.length > 0 ? passed / this.testResults.length : 0,
      batchCount: this.batchResults.length,
      promisingCount: this.promisingFormulas.length
    };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.testResults = [];
    this.batchResults = [];
    this.promisingFormulas = [];
    this.log(LogLevel.INFO, 'MassTester cleared');
  }

  /**
   * Export to JSON
   */
  public toJSON(): object {
    return {
      config: this.config,
      testResults: this.testResults.slice(0, 100), // Limit for size
      batchResults: this.batchResults,
      promisingFormulas: this.promisingFormulas,
      statistics: this.getStatistics(),
      analysis: this.analyzeResults()
    };
  }

  /**
   * Generate proof chain hash
   */
  public generateProofChainHash(): string {
    const data = JSON.stringify({
      totalTests: this.testResults.length,
      batchHashes: this.batchResults.map(b => b.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashResult(result: TestResult): string {
    const data = JSON.stringify({
      formulaId: result.formulaId,
      category: result.category,
      status: result.status,
      actualOutput: result.actualOutput
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private hashBatch(batch: TestBatchResult): string {
    const data = JSON.stringify({
      formulaId: batch.formulaId,
      totalTests: batch.totalTests,
      passRate: batch.passRate
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private hashPromisingFormula(pf: PromisingFormula): string {
    const data = JSON.stringify({
      formulaId: pf.formulaId,
      score: pf.score,
      passRate: pf.passRate
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[MassTester] ${message}`, context);
    }
  }
}

/**
 * Factory for creating MassTester instances
 */
export class MassTesterFactory {
  /**
   * Create MassTester with default config
   */
  public static create(engine?: FormulaEngine, logger?: Logger): MassTester {
    const eng = engine || new FormulaEngine(logger || null);
    return new MassTester(eng, logger || null);
  }

  /**
   * Create MassTester with custom config
   */
  public static createWithConfig(
    config: Partial<MassTestConfig>,
    engine?: FormulaEngine,
    logger?: Logger
  ): MassTester {
    const eng = engine || new FormulaEngine(logger || null);
    return new MassTester(eng, logger || null, { ...DEFAULT_CONFIG, ...config });
  }
}
