/**
 * Qlaws Ham - Result Analyzer Module (M07.05)
 * 
 * Analyzes test results, identifies patterns, and highlights breakthroughs
 * from multi-dimensional formula testing.
 * 
 * @module ResultAnalyzer
 * @version 1.0.0
 * @dependencies MassTester (M07.04), Logger (M01.01)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';
import { 
  MassTester, 
  TestResult, 
  TestBatchResult,
  TestCategory,
  TestResultStatus,
  StatisticalAnalysis
} from '../mass/MassTester';

/**
 * Pattern detection thresholds
 * These constants control the sensitivity of pattern detection algorithms
 */
export const PatternThresholds = {
  /** Minimum data points required for convergence detection */
  MIN_CONVERGENCE_POINTS: 10,
  /** Number of recent values to check for convergence */
  CONVERGENCE_WINDOW: 5,
  /** Minimum data points required for divergence detection */
  MIN_DIVERGENCE_POINTS: 5,
  /** Threshold for divergence magnitude */
  DIVERGENCE_MAGNITUDE: 1e6,
  /** Multiplier for detecting divergence trend (values grow faster than this) */
  DIVERGENCE_GROWTH_FACTOR: 0.9,
  /** Variance threshold for constant detection (relative to mean) */
  CONSTANT_VARIANCE_RELATIVE: 0.01,
  /** Absolute variance threshold for constant detection */
  CONSTANT_VARIANCE_ABSOLUTE: 0.001,
  /** Minimum points for monotonic detection */
  MIN_MONOTONIC_POINTS: 5,
  /** Number of standard deviations for anomaly detection */
  ANOMALY_STD_DEV: 3
};

/**
 * Pattern type
 */
export enum PatternType {
  CONVERGENCE = 'convergence',
  DIVERGENCE = 'divergence',
  PERIODICITY = 'periodicity',
  MONOTONIC = 'monotonic',
  CONSTANT = 'constant',
  CHAOTIC = 'chaotic',
  ANOMALY = 'anomaly',
  BREAKTHROUGH = 'breakthrough'
}

/**
 * Breakthrough severity
 */
export enum BreakthroughSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SIGNIFICANT = 'significant',
  MAJOR = 'major',
  REVOLUTIONARY = 'revolutionary'
}

/**
 * Pattern detection result
 */
export interface Pattern {
  id: string;
  type: PatternType;
  formulaId: string;
  formulaName: string;
  description: string;
  confidence: number;
  dataPoints: number;
  parameters: Map<string, number>;
  startIndex: number;
  endIndex: number;
  metadata: Record<string, any>;
  hash: string;
}

/**
 * Breakthrough identification
 */
export interface Breakthrough {
  id: string;
  formulaId: string;
  formulaName: string;
  severity: BreakthroughSeverity;
  title: string;
  description: string;
  evidence: string[];
  implications: string[];
  relatedPatterns: string[];
  confidence: number;
  discoveredAt: Date;
  hash: string;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable' | 'oscillating';
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

/**
 * Correlation result
 */
export interface CorrelationResult {
  parameter1: string;
  parameter2: string;
  correlation: number;
  pValue: number;
  significance: 'none' | 'weak' | 'moderate' | 'strong' | 'perfect';
}

/**
 * Analysis report
 */
export interface AnalysisReport {
  id: string;
  title: string;
  timestamp: Date;
  summary: string;
  statistics: StatisticalAnalysis;
  patterns: Pattern[];
  breakthroughs: Breakthrough[];
  recommendations: string[];
  hash: string;
}

/**
 * Pattern Detector class
 */
export class PatternDetector {
  private readonly logger: Logger | null;
  private patterns: Pattern[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Detect patterns in test results
   */
  public detect(results: TestResult[]): Pattern[] {
    this.log(LogLevel.INFO, `Detecting patterns in ${results.length} results`);

    const detected: Pattern[] = [];

    // Group by formula
    const byFormula = this.groupByFormula(results);

    for (const [formulaId, formulaResults] of byFormula) {
      // Detect convergence
      const convergence = this.detectConvergence(formulaResults);
      if (convergence) detected.push(convergence);

      // Detect divergence
      const divergence = this.detectDivergence(formulaResults);
      if (divergence) detected.push(divergence);

      // Detect constant behavior
      const constant = this.detectConstant(formulaResults);
      if (constant) detected.push(constant);

      // Detect anomalies
      const anomalies = this.detectAnomalies(formulaResults);
      detected.push(...anomalies);

      // Detect monotonic behavior
      const monotonic = this.detectMonotonic(formulaResults);
      if (monotonic) detected.push(monotonic);
    }

    this.patterns.push(...detected);
    this.log(LogLevel.INFO, `Detected ${detected.length} patterns`);

    return detected;
  }

  /**
   * Group results by formula ID
   */
  private groupByFormula(results: TestResult[]): Map<string, TestResult[]> {
    const groups = new Map<string, TestResult[]>();
    
    for (const result of results) {
      if (!groups.has(result.formulaId)) {
        groups.set(result.formulaId, []);
      }
      groups.get(result.formulaId)!.push(result);
    }

    return groups;
  }

  /**
   * Detect convergence pattern
   */
  private detectConvergence(results: TestResult[]): Pattern | null {
    const values = results
      .filter(r => r.actualOutput !== null)
      .map(r => r.actualOutput as number);

    if (values.length < PatternThresholds.MIN_CONVERGENCE_POINTS) return null;

    // Check if values converge to a limit
    const lastValues = values.slice(-PatternThresholds.CONVERGENCE_WINDOW);
    const variance = this.calculateVariance(lastValues);
    const mean = this.calculateMean(lastValues);

    if (variance < PatternThresholds.CONSTANT_VARIANCE_RELATIVE * Math.abs(mean) + PatternThresholds.CONSTANT_VARIANCE_ABSOLUTE) {
      return this.createPattern(
        PatternType.CONVERGENCE,
        results[0].formulaId,
        results[0].formulaName,
        `Values converge to approximately ${mean.toFixed(4)}`,
        0.8,
        values.length
      );
    }

    return null;
  }

  /**
   * Detect divergence pattern
   */
  private detectDivergence(results: TestResult[]): Pattern | null {
    const values = results
      .filter(r => r.actualOutput !== null)
      .map(r => r.actualOutput as number);

    if (values.length < PatternThresholds.MIN_DIVERGENCE_POINTS) return null;

    // Check if values are growing unbounded
    const absValues = values.map(Math.abs);
    let diverging = true;
    
    for (let i = 1; i < absValues.length; i++) {
      if (absValues[i] < absValues[i - 1] * PatternThresholds.DIVERGENCE_GROWTH_FACTOR) {
        diverging = false;
        break;
      }
    }

    if (diverging && absValues[absValues.length - 1] > PatternThresholds.DIVERGENCE_MAGNITUDE) {
      return this.createPattern(
        PatternType.DIVERGENCE,
        results[0].formulaId,
        results[0].formulaName,
        'Values show divergent behavior',
        0.75,
        values.length
      );
    }

    return null;
  }

  /**
   * Detect constant pattern
   */
  private detectConstant(results: TestResult[]): Pattern | null {
    const values = results
      .filter(r => r.actualOutput !== null)
      .map(r => r.actualOutput as number);

    if (values.length < 3) return null;

    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values);

    if (variance < 1e-10) {
      return this.createPattern(
        PatternType.CONSTANT,
        results[0].formulaId,
        results[0].formulaName,
        `Values are constant at ${mean}`,
        1.0,
        values.length
      );
    }

    return null;
  }

  /**
   * Detect anomalies
   */
  private detectAnomalies(results: TestResult[]): Pattern[] {
    const anomalies: Pattern[] = [];
    const values = results
      .filter(r => r.actualOutput !== null)
      .map(r => r.actualOutput as number);

    if (values.length < PatternThresholds.MIN_MONOTONIC_POINTS) return anomalies;

    const mean = this.calculateMean(values);
    const stdDev = Math.sqrt(this.calculateVariance(values));

    // Find values beyond configured standard deviations
    for (let i = 0; i < values.length; i++) {
      if (Math.abs(values[i] - mean) > PatternThresholds.ANOMALY_STD_DEV * stdDev) {
        anomalies.push(this.createPattern(
          PatternType.ANOMALY,
          results[i].formulaId,
          results[i].formulaName,
          `Anomalous value ${values[i]} at index ${i}`,
          0.9,
          1,
          i,
          i
        ));
      }
    }

    return anomalies;
  }

  /**
   * Detect monotonic behavior
   */
  private detectMonotonic(results: TestResult[]): Pattern | null {
    const values = results
      .filter(r => r.actualOutput !== null)
      .map(r => r.actualOutput as number);

    if (values.length < PatternThresholds.MIN_MONOTONIC_POINTS) return null;

    let increasing = true;
    let decreasing = true;

    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) increasing = false;
      if (values[i] > values[i - 1]) decreasing = false;
    }

    if (increasing || decreasing) {
      return this.createPattern(
        PatternType.MONOTONIC,
        results[0].formulaId,
        results[0].formulaName,
        `Values are monotonically ${increasing ? 'increasing' : 'decreasing'}`,
        0.85,
        values.length
      );
    }

    return null;
  }

  /**
   * Create a pattern object
   */
  private createPattern(
    type: PatternType,
    formulaId: string,
    formulaName: string,
    description: string,
    confidence: number,
    dataPoints: number,
    startIndex: number = 0,
    endIndex: number = dataPoints - 1
  ): Pattern {
    const pattern: Pattern = {
      id: crypto.randomUUID(),
      type,
      formulaId,
      formulaName,
      description,
      confidence,
      dataPoints,
      parameters: new Map(),
      startIndex,
      endIndex,
      metadata: {},
      hash: ''
    };
    pattern.hash = this.hashPattern(pattern);
    return pattern;
  }

  /**
   * Calculate mean
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  }

  /**
   * Get all patterns
   */
  public getPatterns(): Pattern[] {
    return [...this.patterns];
  }

  /**
   * Clear patterns
   */
  public clear(): void {
    this.patterns = [];
  }

  private hashPattern(pattern: Pattern): string {
    const data = JSON.stringify({
      type: pattern.type,
      formulaId: pattern.formulaId,
      description: pattern.description
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[PatternDetector] ${message}`, context);
    }
  }
}

/**
 * Breakthrough Identifier class
 */
export class BreakthroughIdentifier {
  private readonly logger: Logger | null;
  private breakthroughs: Breakthrough[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Identify breakthroughs from patterns and results
   */
  public identify(
    patterns: Pattern[],
    batchResults: TestBatchResult[]
  ): Breakthrough[] {
    this.log(LogLevel.INFO, 'Identifying breakthroughs');

    const identified: Breakthrough[] = [];

    // Check for high-performing formulas
    for (const batch of batchResults) {
      if (batch.passRate >= 0.99) {
        identified.push(this.createBreakthrough(
          batch.formulaId,
          'Formula ' + batch.formulaId.substring(0, 8),
          BreakthroughSeverity.MODERATE,
          'Near-perfect test pass rate',
          `Formula achieves ${(batch.passRate * 100).toFixed(1)}% pass rate across ${batch.totalTests} tests`,
          ['Consistent behavior', 'High reliability'],
          ['Suitable for production use', 'May represent optimal solution']
        ));
      }
    }

    // Check for convergence breakthroughs
    const convergencePatterns = patterns.filter(p => p.type === PatternType.CONVERGENCE);
    for (const pattern of convergencePatterns) {
      if (pattern.confidence >= 0.9) {
        identified.push(this.createBreakthrough(
          pattern.formulaId,
          pattern.formulaName,
          BreakthroughSeverity.SIGNIFICANT,
          'Stable convergent behavior discovered',
          pattern.description,
          [`Pattern detected with ${pattern.confidence * 100}% confidence`],
          ['May indicate fundamental mathematical property', 'Warrants further investigation']
        ));
      }
    }

    // Check for unexpected constant behavior
    const constantPatterns = patterns.filter(p => p.type === PatternType.CONSTANT);
    for (const pattern of constantPatterns) {
      identified.push(this.createBreakthrough(
        pattern.formulaId,
        pattern.formulaName,
        BreakthroughSeverity.MINOR,
        'Constant output detected',
        pattern.description,
        ['Output invariant under parameter changes'],
        ['May indicate trivial solution or bug']
      ));
    }

    this.breakthroughs.push(...identified);
    this.log(LogLevel.INFO, `Identified ${identified.length} breakthroughs`);

    return identified;
  }

  /**
   * Create a breakthrough
   */
  private createBreakthrough(
    formulaId: string,
    formulaName: string,
    severity: BreakthroughSeverity,
    title: string,
    description: string,
    evidence: string[],
    implications: string[]
  ): Breakthrough {
    const breakthrough: Breakthrough = {
      id: crypto.randomUUID(),
      formulaId,
      formulaName,
      severity,
      title,
      description,
      evidence,
      implications,
      relatedPatterns: [],
      confidence: this.calculateConfidence(severity),
      discoveredAt: new Date(),
      hash: ''
    };
    breakthrough.hash = this.hashBreakthrough(breakthrough);
    return breakthrough;
  }

  /**
   * Calculate confidence based on severity
   */
  private calculateConfidence(severity: BreakthroughSeverity): number {
    switch (severity) {
      case BreakthroughSeverity.REVOLUTIONARY: return 0.99;
      case BreakthroughSeverity.MAJOR: return 0.95;
      case BreakthroughSeverity.SIGNIFICANT: return 0.85;
      case BreakthroughSeverity.MODERATE: return 0.75;
      case BreakthroughSeverity.MINOR: return 0.6;
      default: return 0.5;
    }
  }

  /**
   * Get all breakthroughs
   */
  public getBreakthroughs(): Breakthrough[] {
    return [...this.breakthroughs];
  }

  /**
   * Get breakthroughs by severity
   */
  public getBySeverity(severity: BreakthroughSeverity): Breakthrough[] {
    return this.breakthroughs.filter(b => b.severity === severity);
  }

  /**
   * Clear breakthroughs
   */
  public clear(): void {
    this.breakthroughs = [];
  }

  private hashBreakthrough(bt: Breakthrough): string {
    const data = JSON.stringify({
      formulaId: bt.formulaId,
      severity: bt.severity,
      title: bt.title
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[BreakthroughIdentifier] ${message}`, context);
    }
  }
}

/**
 * Main ResultAnalyzer class
 */
export class ResultAnalyzer {
  private readonly logger: Logger | null;
  private readonly massTester: MassTester;
  private readonly patternDetector: PatternDetector;
  private readonly breakthroughIdentifier: BreakthroughIdentifier;
  private reports: AnalysisReport[] = [];

  constructor(massTester: MassTester, logger: Logger | null = null) {
    this.logger = logger;
    this.massTester = massTester;
    this.patternDetector = new PatternDetector(logger);
    this.breakthroughIdentifier = new BreakthroughIdentifier(logger);
    this.log(LogLevel.INFO, 'ResultAnalyzer initialized');
  }

  /**
   * Perform full analysis
   */
  public analyze(): AnalysisReport {
    this.log(LogLevel.INFO, 'Starting full analysis');

    const results = this.massTester.getTestResults();
    const batchResults = this.massTester.getBatchResults();
    const statistics = this.massTester.analyzeResults();

    // Detect patterns
    const patterns = this.patternDetector.detect(results);

    // Identify breakthroughs
    const breakthroughs = this.breakthroughIdentifier.identify(patterns, batchResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns, breakthroughs, statistics);

    // Create report
    const report: AnalysisReport = {
      id: crypto.randomUUID(),
      title: `Analysis Report - ${new Date().toISOString()}`,
      timestamp: new Date(),
      summary: this.generateSummary(patterns, breakthroughs, statistics),
      statistics,
      patterns,
      breakthroughs,
      recommendations,
      hash: ''
    };
    report.hash = this.hashReport(report);

    this.reports.push(report);
    this.log(LogLevel.INFO, 'Analysis complete');

    return report;
  }

  /**
   * Generate summary
   */
  private generateSummary(
    patterns: Pattern[],
    breakthroughs: Breakthrough[],
    statistics: StatisticalAnalysis
  ): string {
    const parts: string[] = [];

    parts.push(`Analyzed ${statistics.sampleSize} test results.`);
    parts.push(`Detected ${patterns.length} patterns.`);
    parts.push(`Identified ${breakthroughs.length} potential breakthroughs.`);

    if (statistics.mean !== 0) {
      parts.push(`Mean output: ${statistics.mean.toFixed(4)}, Std Dev: ${statistics.stdDev.toFixed(4)}.`);
    }

    if (breakthroughs.length > 0) {
      const significant = breakthroughs.filter(
        b => b.severity === BreakthroughSeverity.SIGNIFICANT || 
             b.severity === BreakthroughSeverity.MAJOR ||
             b.severity === BreakthroughSeverity.REVOLUTIONARY
      );
      if (significant.length > 0) {
        parts.push(`${significant.length} significant or higher breakthroughs found!`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    patterns: Pattern[],
    breakthroughs: Breakthrough[],
    statistics: StatisticalAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Based on patterns
    const anomalies = patterns.filter(p => p.type === PatternType.ANOMALY);
    if (anomalies.length > 0) {
      recommendations.push(`Investigate ${anomalies.length} anomalies detected in the data.`);
    }

    const convergent = patterns.filter(p => p.type === PatternType.CONVERGENCE);
    if (convergent.length > 0) {
      recommendations.push('Study convergent patterns for potential mathematical insights.');
    }

    // Based on breakthroughs
    const significant = breakthroughs.filter(b => 
      b.severity === BreakthroughSeverity.SIGNIFICANT ||
      b.severity === BreakthroughSeverity.MAJOR
    );
    if (significant.length > 0) {
      recommendations.push('Priority: Further investigate significant breakthroughs.');
    }

    // Based on statistics
    if (statistics.outliers.length > 0) {
      recommendations.push(`Review ${statistics.outliers.length} statistical outliers.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue standard testing and monitoring.');
    }

    return recommendations;
  }

  /**
   * Calculate trend
   */
  public calculateTrend(values: number[]): TrendAnalysis {
    if (values.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        intercept: values[0] || 0,
        rSquared: 0,
        predictions: []
      };
    }

    // Linear regression
    const n = values.length;
    const xs = Array.from({ length: n }, (_, i) => i);
    
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = xs.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const meanY = sumY / n;
    const ssTotal = values.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
    const ssResidual = values.reduce((sum, y, i) => sum + (y - (slope * i + intercept)) ** 2, 0);
    const rSquared = 1 - ssResidual / ssTotal;

    // Direction
    let direction: TrendAnalysis['direction'] = 'stable';
    if (Math.abs(slope) > 0.01) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Predictions
    const predictions = [n, n + 1, n + 2].map(x => slope * x + intercept);

    return { direction, slope, intercept, rSquared, predictions };
  }

  /**
   * Calculate correlation between parameters
   */
  public calculateCorrelation(
    param1Values: number[],
    param2Values: number[]
  ): CorrelationResult {
    if (param1Values.length !== param2Values.length || param1Values.length < 3) {
      return {
        parameter1: 'param1',
        parameter2: 'param2',
        correlation: 0,
        pValue: 1,
        significance: 'none'
      };
    }

    const n = param1Values.length;
    const mean1 = param1Values.reduce((a, b) => a + b, 0) / n;
    const mean2 = param2Values.reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let var1 = 0;
    let var2 = 0;

    for (let i = 0; i < n; i++) {
      const d1 = param1Values[i] - mean1;
      const d2 = param2Values[i] - mean2;
      covariance += d1 * d2;
      var1 += d1 * d1;
      var2 += d2 * d2;
    }

    const correlation = covariance / (Math.sqrt(var1) * Math.sqrt(var2));

    // Approximate p-value (simplified)
    const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    const pValue = Math.min(1, 2 * Math.exp(-0.5 * tStat * tStat));

    // Significance
    let significance: CorrelationResult['significance'] = 'none';
    const absCorr = Math.abs(correlation);
    if (absCorr >= 0.99) significance = 'perfect';
    else if (absCorr >= 0.7) significance = 'strong';
    else if (absCorr >= 0.4) significance = 'moderate';
    else if (absCorr >= 0.2) significance = 'weak';

    return {
      parameter1: 'param1',
      parameter2: 'param2',
      correlation,
      pValue,
      significance
    };
  }

  /**
   * Get mass tester
   */
  public getMassTester(): MassTester {
    return this.massTester;
  }

  /**
   * Get pattern detector
   */
  public getPatternDetector(): PatternDetector {
    return this.patternDetector;
  }

  /**
   * Get breakthrough identifier
   */
  public getBreakthroughIdentifier(): BreakthroughIdentifier {
    return this.breakthroughIdentifier;
  }

  /**
   * Get all reports
   */
  public getReports(): AnalysisReport[] {
    return [...this.reports];
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    reportCount: number;
    patternCount: number;
    breakthroughCount: number;
    significantBreakthroughs: number;
  } {
    const patterns = this.patternDetector.getPatterns();
    const breakthroughs = this.breakthroughIdentifier.getBreakthroughs();
    const significant = breakthroughs.filter(b =>
      b.severity === BreakthroughSeverity.SIGNIFICANT ||
      b.severity === BreakthroughSeverity.MAJOR ||
      b.severity === BreakthroughSeverity.REVOLUTIONARY
    );

    return {
      reportCount: this.reports.length,
      patternCount: patterns.length,
      breakthroughCount: breakthroughs.length,
      significantBreakthroughs: significant.length
    };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.reports = [];
    this.patternDetector.clear();
    this.breakthroughIdentifier.clear();
    this.log(LogLevel.INFO, 'ResultAnalyzer cleared');
  }

  /**
   * Export to JSON
   */
  public toJSON(): object {
    return {
      reports: this.reports,
      patterns: this.patternDetector.getPatterns(),
      breakthroughs: this.breakthroughIdentifier.getBreakthroughs(),
      statistics: this.getStatistics()
    };
  }

  /**
   * Generate proof chain hash
   */
  public generateProofChainHash(): string {
    const data = JSON.stringify({
      reportCount: this.reports.length,
      reportHashes: this.reports.map(r => r.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashReport(report: AnalysisReport): string {
    const data = JSON.stringify({
      title: report.title,
      patternCount: report.patterns.length,
      breakthroughCount: report.breakthroughs.length
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ResultAnalyzer] ${message}`, context);
    }
  }
}

/**
 * Factory for creating ResultAnalyzer instances
 */
export class ResultAnalyzerFactory {
  /**
   * Create ResultAnalyzer
   */
  public static create(massTester: MassTester, logger?: Logger): ResultAnalyzer {
    return new ResultAnalyzer(massTester, logger || null);
  }
}
