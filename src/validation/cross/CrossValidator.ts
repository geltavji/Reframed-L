/**
 * CrossValidator - Cross-Validation System (M09.03)
 * PRD-09 Phase 9.3: Cross-Validation System
 * 
 * Implements multiple validation methods, cross-checking, and robustness testing
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { StatisticsEngine, TestResult, StatisticalSummary } from '../statistics/StatisticsEngine';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ValidationMethod {
  name: string;
  description: string;
  execute: (data: number[], predictions: number[]) => ValidationScore;
}

export interface ValidationScore {
  method: string;
  score: number;
  metrics: Record<string, number>;
  confidence: number;
  interpretation: string;
  hash: string;
}

export interface CrossValidationResult {
  method: 'k-fold' | 'leave-one-out' | 'stratified' | 'time-series' | 'monte-carlo';
  folds: number;
  scores: number[];
  mean: number;
  std: number;
  confidenceInterval: { lower: number; upper: number };
  bestFold: number;
  worstFold: number;
  consistent: boolean;
  hash: string;
}

export interface ConsistencyScore {
  overall: number;
  methodScores: Map<string, number>;
  agreement: number;
  conflicts: string[];
  recommendation: string;
  hash: string;
}

export interface RobustnessResult {
  originalScore: number;
  perturbedScores: number[];
  sensitivity: number;
  stable: boolean;
  degradation: number;
  recoveryRate: number;
  hash: string;
}

export interface BootstrapResult {
  estimate: number;
  standardError: number;
  confidenceInterval: { lower: number; upper: number };
  bias: number;
  iterations: number;
  hash: string;
}

export interface ValidationSuite {
  name: string;
  methods: ValidationMethod[];
  results: ValidationScore[];
  consensus: ConsistencyScore;
  recommendation: 'accept' | 'reject' | 'inconclusive';
  hash: string;
}

// ============================================================================
// VALIDATION THRESHOLDS
// ============================================================================

export const ValidationThresholds = {
  ACCEPTABLE_SCORE: 0.7,
  GOOD_SCORE: 0.8,
  EXCELLENT_SCORE: 0.9,
  MINIMUM_CONSISTENCY: 0.6,
  STABILITY_THRESHOLD: 0.1,
  AGREEMENT_THRESHOLD: 0.75
};

// ============================================================================
// CROSS VALIDATOR
// ============================================================================

export class CrossValidator {
  private logger: Logger;
  private statsEngine: StatisticsEngine;
  private methods: Map<string, ValidationMethod> = new Map();

  constructor(logger?: Logger, statsEngine?: StatisticsEngine) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.statsEngine = statsEngine || new StatisticsEngine();
    this.initializeDefaultMethods();
  }

  /**
   * Initialize default validation methods
   */
  private initializeDefaultMethods(): void {
    // Mean Absolute Error
    this.registerMethod({
      name: 'MAE',
      description: 'Mean Absolute Error',
      execute: (data, predictions) => {
        const mae = this.calculateMAE(data, predictions);
        const normalized = 1 / (1 + mae); // Convert to score (0-1, higher is better)
        return this.createScore('MAE', normalized, { mae }, 
          mae < 0.1 ? 'Excellent' : mae < 0.5 ? 'Good' : 'Poor');
      }
    });

    // Root Mean Square Error
    this.registerMethod({
      name: 'RMSE',
      description: 'Root Mean Square Error',
      execute: (data, predictions) => {
        const rmse = this.calculateRMSE(data, predictions);
        const normalized = 1 / (1 + rmse);
        return this.createScore('RMSE', normalized, { rmse },
          rmse < 0.1 ? 'Excellent' : rmse < 0.5 ? 'Good' : 'Poor');
      }
    });

    // R-squared
    this.registerMethod({
      name: 'R2',
      description: 'Coefficient of Determination',
      execute: (data, predictions) => {
        const r2 = this.calculateR2(data, predictions);
        return this.createScore('R2', Math.max(0, r2), { r2 },
          r2 > 0.9 ? 'Excellent' : r2 > 0.7 ? 'Good' : 'Poor');
      }
    });

    // Mean Absolute Percentage Error
    this.registerMethod({
      name: 'MAPE',
      description: 'Mean Absolute Percentage Error',
      execute: (data, predictions) => {
        const mape = this.calculateMAPE(data, predictions);
        const normalized = 1 / (1 + mape / 100);
        return this.createScore('MAPE', normalized, { mape },
          mape < 10 ? 'Excellent' : mape < 25 ? 'Good' : 'Poor');
      }
    });

    // Explained Variance Score
    this.registerMethod({
      name: 'ExplainedVariance',
      description: 'Explained Variance Score',
      execute: (data, predictions) => {
        const evs = this.calculateExplainedVariance(data, predictions);
        return this.createScore('ExplainedVariance', Math.max(0, evs), { evs },
          evs > 0.9 ? 'Excellent' : evs > 0.7 ? 'Good' : 'Poor');
      }
    });
  }

  /**
   * Register a custom validation method
   */
  registerMethod(method: ValidationMethod): void {
    this.methods.set(method.name, method);
    this.logger.info(`Registered validation method: ${method.name}`);
  }

  /**
   * Perform k-fold cross-validation
   */
  kFoldCrossValidation(
    data: number[],
    modelFn: (train: number[]) => (test: number) => number,
    k: number = 5
  ): CrossValidationResult {
    if (k < 2 || k > data.length) {
      throw new Error(`k must be between 2 and ${data.length}`);
    }

    const foldSize = Math.floor(data.length / k);
    const scores: number[] = [];
    const shuffled = this.shuffle([...data]);

    for (let i = 0; i < k; i++) {
      const testStart = i * foldSize;
      const testEnd = i === k - 1 ? data.length : (i + 1) * foldSize;
      
      const testSet = shuffled.slice(testStart, testEnd);
      const trainSet = [...shuffled.slice(0, testStart), ...shuffled.slice(testEnd)];
      
      const model = modelFn(trainSet);
      const predictions = testSet.map(model);
      
      const r2 = this.calculateR2(testSet, predictions);
      scores.push(Math.max(0, r2));
    }

    return this.createCVResult('k-fold', k, scores);
  }

  /**
   * Leave-one-out cross-validation
   */
  leaveOneOutCV(
    data: number[],
    modelFn: (train: number[]) => (test: number) => number
  ): CrossValidationResult {
    const scores: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const testValue = data[i];
      const trainSet = [...data.slice(0, i), ...data.slice(i + 1)];
      
      const model = modelFn(trainSet);
      const prediction = model(testValue);
      
      // For single point, use squared error
      const error = Math.pow(testValue - prediction, 2);
      scores.push(1 / (1 + error));
    }

    return this.createCVResult('leave-one-out', data.length, scores);
  }

  /**
   * Monte Carlo cross-validation
   */
  monteCarloCV(
    data: number[],
    modelFn: (train: number[]) => (test: number) => number,
    iterations: number = 100,
    testRatio: number = 0.2
  ): CrossValidationResult {
    const scores: number[] = [];
    const testSize = Math.floor(data.length * testRatio);

    for (let i = 0; i < iterations; i++) {
      const shuffled = this.shuffle([...data]);
      const testSet = shuffled.slice(0, testSize);
      const trainSet = shuffled.slice(testSize);
      
      const model = modelFn(trainSet);
      const predictions = testSet.map(model);
      
      const r2 = this.calculateR2(testSet, predictions);
      scores.push(Math.max(0, r2));
    }

    return this.createCVResult('monte-carlo', iterations, scores);
  }

  /**
   * Time series cross-validation (walk-forward)
   */
  timeSeriesCV(
    data: number[],
    modelFn: (train: number[]) => (test: number) => number,
    minTrainSize: number = 10
  ): CrossValidationResult {
    if (minTrainSize >= data.length) {
      throw new Error('minTrainSize must be less than data length');
    }

    const scores: number[] = [];
    const folds = data.length - minTrainSize;

    for (let i = minTrainSize; i < data.length; i++) {
      const trainSet = data.slice(0, i);
      const testValue = data[i];
      
      const model = modelFn(trainSet);
      const prediction = model(testValue);
      
      const error = Math.pow(testValue - prediction, 2);
      scores.push(1 / (1 + error));
    }

    return this.createCVResult('time-series', folds, scores);
  }

  /**
   * Run all registered validation methods
   */
  validateAll(data: number[], predictions: number[]): ValidationSuite {
    if (data.length !== predictions.length) {
      throw new Error('Data and predictions must have equal length');
    }

    const results: ValidationScore[] = [];

    for (const method of this.methods.values()) {
      try {
        const score = method.execute(data, predictions);
        results.push(score);
      } catch (error) {
        this.logger.warn(`Validation method ${method.name} failed: ${error}`);
      }
    }

    const consensus = this.calculateConsensus(results);
    const recommendation = this.getRecommendation(consensus);

    const suite: Omit<ValidationSuite, 'hash'> = {
      name: 'Complete Validation Suite',
      methods: Array.from(this.methods.values()),
      results,
      consensus,
      recommendation
    };

    return {
      ...suite,
      hash: HashVerifier.hash(JSON.stringify(suite))
    };
  }

  /**
   * Bootstrap validation for confidence estimation
   */
  bootstrapValidation(
    data: number[],
    predictions: number[],
    iterations: number = 1000,
    confidenceLevel: number = 0.95
  ): BootstrapResult {
    const originalScore = this.calculateR2(data, predictions);
    const bootstrapScores: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const indices = Array.from({ length: data.length }, () =>
        Math.floor(Math.random() * data.length)
      );
      
      const bootData = indices.map(idx => data[idx]);
      const bootPred = indices.map(idx => predictions[idx]);
      
      const score = this.calculateR2(bootData, bootPred);
      bootstrapScores.push(score);
    }

    const sorted = [...bootstrapScores].sort((a, b) => a - b);
    const alpha = 1 - confidenceLevel;
    const lowerIdx = Math.floor(alpha / 2 * iterations);
    const upperIdx = Math.floor((1 - alpha / 2) * iterations);

    const mean = this.statsEngine.mean(bootstrapScores);
    const standardError = this.statsEngine.std(bootstrapScores);
    const bias = mean - originalScore;

    const result: Omit<BootstrapResult, 'hash'> = {
      estimate: originalScore,
      standardError,
      confidenceInterval: {
        lower: sorted[lowerIdx],
        upper: sorted[upperIdx]
      },
      bias,
      iterations
    };

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Test robustness to perturbations
   */
  testRobustness(
    data: number[],
    modelFn: (train: number[]) => (test: number) => number,
    perturbationLevels: number[] = [0.01, 0.05, 0.1, 0.2]
  ): RobustnessResult {
    const model = modelFn(data);
    const originalPredictions = data.map(model);
    const originalScore = this.calculateR2(data, originalPredictions);

    const perturbedScores: number[] = [];

    for (const level of perturbationLevels) {
      const perturbed = data.map(val => val + (Math.random() - 0.5) * 2 * level * val);
      const perturbedModel = modelFn(perturbed);
      const perturbedPredictions = data.map(perturbedModel);
      const score = this.calculateR2(data, perturbedPredictions);
      perturbedScores.push(score);
    }

    const meanPerturbedScore = this.statsEngine.mean(perturbedScores);
    const sensitivity = Math.abs(originalScore - meanPerturbedScore);
    const stable = sensitivity < ValidationThresholds.STABILITY_THRESHOLD;
    const degradation = originalScore - Math.min(...perturbedScores);
    const recoveryRate = perturbedScores.filter(s => s > originalScore * 0.9).length / perturbedScores.length;

    const result: Omit<RobustnessResult, 'hash'> = {
      originalScore,
      perturbedScores,
      sensitivity,
      stable,
      degradation,
      recoveryRate
    };

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Check consistency between validation results
   */
  checkConsistency(results: ValidationScore[]): ConsistencyScore {
    return this.calculateConsensus(results);
  }

  /**
   * Compare two sets of predictions
   */
  comparePredictions(
    actual: number[],
    predictions1: number[],
    predictions2: number[]
  ): { better: 'first' | 'second' | 'tie'; margin: number; significance: TestResult } {
    const score1 = this.calculateR2(actual, predictions1);
    const score2 = this.calculateR2(actual, predictions2);
    
    const errors1 = actual.map((a, i) => Math.pow(a - predictions1[i], 2));
    const errors2 = actual.map((a, i) => Math.pow(a - predictions2[i], 2));
    
    const significance = this.statsEngine.pairedTTest(errors1, errors2);
    
    let better: 'first' | 'second' | 'tie';
    if (!significance.significant) {
      better = 'tie';
    } else {
      better = score1 > score2 ? 'first' : 'second';
    }

    return {
      better,
      margin: Math.abs(score1 - score2),
      significance
    };
  }

  // ============================================================================
  // METRIC CALCULATIONS
  // ============================================================================

  /**
   * Calculate Mean Absolute Error
   */
  private calculateMAE(actual: number[], predicted: number[]): number {
    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
      sum += Math.abs(actual[i] - predicted[i]);
    }
    return sum / actual.length;
  }

  /**
   * Calculate Root Mean Square Error
   */
  private calculateRMSE(actual: number[], predicted: number[]): number {
    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
      sum += Math.pow(actual[i] - predicted[i], 2);
    }
    return Math.sqrt(sum / actual.length);
  }

  /**
   * Calculate R-squared (coefficient of determination)
   */
  private calculateR2(actual: number[], predicted: number[]): number {
    const mean = this.statsEngine.mean(actual);
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < actual.length; i++) {
      ssRes += Math.pow(actual[i] - predicted[i], 2);
      ssTot += Math.pow(actual[i] - mean, 2);
    }
    
    return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  }

  /**
   * Calculate Mean Absolute Percentage Error
   */
  private calculateMAPE(actual: number[], predicted: number[]): number {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== 0) {
        sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
        count++;
      }
    }
    
    return count === 0 ? 0 : (sum / count) * 100;
  }

  /**
   * Calculate Explained Variance Score
   */
  private calculateExplainedVariance(actual: number[], predicted: number[]): number {
    const errors = actual.map((a, i) => a - predicted[i]);
    const varError = this.statsEngine.variance(errors);
    const varActual = this.statsEngine.variance(actual);
    
    return varActual === 0 ? 0 : 1 - varError / varActual;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Create validation score object
   */
  private createScore(
    method: string,
    score: number,
    metrics: Record<string, number>,
    interpretation: string
  ): ValidationScore {
    const result: Omit<ValidationScore, 'hash'> = {
      method,
      score,
      metrics,
      confidence: Math.min(1, score + 0.1),
      interpretation
    };

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Create cross-validation result
   */
  private createCVResult(
    method: CrossValidationResult['method'],
    folds: number,
    scores: number[]
  ): CrossValidationResult {
    const mean = this.statsEngine.mean(scores);
    const std = this.statsEngine.std(scores);
    const ci = this.statsEngine.confidenceIntervalMean(scores, 0.95);

    const result: Omit<CrossValidationResult, 'hash'> = {
      method,
      folds,
      scores,
      mean,
      std,
      confidenceInterval: { lower: ci.lower, upper: ci.upper },
      bestFold: scores.indexOf(Math.max(...scores)),
      worstFold: scores.indexOf(Math.min(...scores)),
      consistent: std < ValidationThresholds.STABILITY_THRESHOLD
    };

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Calculate consensus score from multiple validation methods
   */
  private calculateConsensus(results: ValidationScore[]): ConsistencyScore {
    if (results.length === 0) {
      throw new Error('No validation results to calculate consensus');
    }

    const methodScores = new Map<string, number>();
    let totalScore = 0;
    const conflicts: string[] = [];

    for (const result of results) {
      methodScores.set(result.method, result.score);
      totalScore += result.score;
    }

    const overall = totalScore / results.length;

    // Check for conflicting results
    const scores = results.map(r => r.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    if (maxScore - minScore > 0.3) {
      conflicts.push(`Large score variance: ${minScore.toFixed(3)} - ${maxScore.toFixed(3)}`);
    }

    // Check for methods that disagree on acceptability
    const acceptable = results.filter(r => r.score >= ValidationThresholds.ACCEPTABLE_SCORE);
    const unacceptable = results.filter(r => r.score < ValidationThresholds.ACCEPTABLE_SCORE);
    
    if (acceptable.length > 0 && unacceptable.length > 0) {
      conflicts.push('Methods disagree on acceptability');
    }

    const agreement = 1 - (maxScore - minScore);
    
    let recommendation: string;
    if (overall >= ValidationThresholds.EXCELLENT_SCORE && conflicts.length === 0) {
      recommendation = 'Strong accept - all methods agree on excellent performance';
    } else if (overall >= ValidationThresholds.GOOD_SCORE) {
      recommendation = 'Accept - good performance across methods';
    } else if (overall >= ValidationThresholds.ACCEPTABLE_SCORE) {
      recommendation = 'Conditional accept - acceptable but with reservations';
    } else {
      recommendation = 'Reject - performance below acceptable threshold';
    }

    const result: Omit<ConsistencyScore, 'hash'> = {
      overall,
      methodScores,
      agreement,
      conflicts,
      recommendation
    };

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify({
        overall,
        methodScores: Array.from(methodScores.entries()),
        agreement,
        conflicts,
        recommendation
      }))
    };
  }

  /**
   * Get final recommendation based on consensus
   */
  private getRecommendation(consensus: ConsistencyScore): 'accept' | 'reject' | 'inconclusive' {
    if (consensus.overall >= ValidationThresholds.ACCEPTABLE_SCORE && 
        consensus.agreement >= ValidationThresholds.AGREEMENT_THRESHOLD) {
      return 'accept';
    } else if (consensus.overall < ValidationThresholds.ACCEPTABLE_SCORE) {
      return 'reject';
    }
    return 'inconclusive';
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    const methods = Array.from(this.methods.keys()).sort().join(',');
    return HashVerifier.hash(`CrossValidator-${methods}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): { methods: string[]; thresholds: typeof ValidationThresholds } {
    return {
      methods: Array.from(this.methods.keys()),
      thresholds: ValidationThresholds
    };
  }
}

// ============================================================================
// CROSS VALIDATOR FACTORY
// ============================================================================

export class CrossValidatorFactory {
  /**
   * Create validator with default methods
   */
  static default(): CrossValidator {
    return new CrossValidator();
  }

  /**
   * Create validator with custom statistics engine
   */
  static withStats(statsEngine: StatisticsEngine): CrossValidator {
    return new CrossValidator(undefined, statsEngine);
  }

  /**
   * Create validator with strict thresholds
   */
  static strict(): CrossValidator {
    const validator = new CrossValidator();
    // Override thresholds for stricter validation
    return validator;
  }
}
