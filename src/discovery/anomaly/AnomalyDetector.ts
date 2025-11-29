/**
 * AnomalyDetector - Anomaly Detection System (M10.02)
 * PRD-10 Phase 10.2: Anomaly Detection
 * 
 * Detects unexpected results, identifies breakthrough candidates,
 * and tracks anomalies for scientific discovery.
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { StatisticsEngine } from '../../validation/statistics/StatisticsEngine';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DataPoint {
  id: string;
  timestamp: Date;
  value: number;
  metadata: Record<string, unknown>;
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  dataPoints: DataPoint[];
  score: number;
  confidence: number;
  detectedAt: Date;
  context: AnomalyContext;
  potentialCauses: string[];
  hash: string;
}

export type AnomalyType = 
  | 'outlier'
  | 'spike'
  | 'trend-break'
  | 'pattern-deviation'
  | 'value-impossible'
  | 'correlation-break'
  | 'distribution-shift';

export interface AnomalyContext {
  baselineStats: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  deviationFromMean: number;
  percentileRank: number;
  neighboringValues: number[];
}

export interface BreakthroughCandidate {
  id: string;
  anomaly: Anomaly;
  significance: number;
  reproducibility: number;
  theoreticalImplications: string[];
  experimentalVerification: string[];
  status: 'candidate' | 'investigating' | 'confirmed' | 'rejected';
  score: number;
  hash: string;
  createdAt: Date;
}

export interface DetectionConfig {
  zScoreThreshold: number;
  iqrMultiplier: number;
  minConfidence: number;
  slidingWindowSize: number;
  enablePatternDetection: boolean;
  enableCorrelationAnalysis: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
}

export interface DetectionResult {
  anomalies: Anomaly[];
  breakthroughCandidates: BreakthroughCandidate[];
  statistics: {
    totalDataPoints: number;
    anomaliesDetected: number;
    breakthroughsIdentified: number;
    processingTime: number;
  };
  hash: string;
}

export interface PatternSpec {
  id: string;
  name: string;
  description: string;
  detect: (data: number[]) => { detected: boolean; location?: number; confidence: number };
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DefaultDetectionConfig: DetectionConfig = {
  zScoreThreshold: 3.0,
  iqrMultiplier: 1.5,
  minConfidence: 0.8,
  slidingWindowSize: 20,
  enablePatternDetection: true,
  enableCorrelationAnalysis: true,
  sensitivityLevel: 'medium'
};

// ============================================================================
// ANOMALY DETECTOR
// ============================================================================

export class AnomalyDetector {
  private logger: Logger;
  private statsEngine: StatisticsEngine;
  private config: DetectionConfig;
  private anomalies: Map<string, Anomaly> = new Map();
  private breakthroughs: Map<string, BreakthroughCandidate> = new Map();
  private patterns: Map<string, PatternSpec> = new Map();
  private baselineData: number[] = [];

  constructor(
    config: Partial<DetectionConfig> = {},
    statsEngine?: StatisticsEngine,
    logger?: Logger
  ) {
    this.config = { ...DefaultDetectionConfig, ...config };
    this.statsEngine = statsEngine || new StatisticsEngine();
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.initializePatterns();
  }

  /**
   * Initialize default pattern detectors
   */
  private initializePatterns(): void {
    // Spike pattern
    this.registerPattern({
      id: 'spike',
      name: 'Spike Detection',
      description: 'Detects sudden spikes in data',
      detect: (data) => this.detectSpike(data)
    });

    // Trend break pattern
    this.registerPattern({
      id: 'trend-break',
      name: 'Trend Break Detection',
      description: 'Detects changes in trend direction',
      detect: (data) => this.detectTrendBreak(data)
    });

    // Distribution shift
    this.registerPattern({
      id: 'distribution-shift',
      name: 'Distribution Shift Detection',
      description: 'Detects shifts in data distribution',
      detect: (data) => this.detectDistributionShift(data)
    });
  }

  /**
   * Register a custom pattern detector
   */
  registerPattern(pattern: PatternSpec): void {
    this.patterns.set(pattern.id, pattern);
    this.logger.info(`Registered pattern: ${pattern.name}`);
  }

  /**
   * Set baseline data for comparison
   */
  setBaseline(data: number[]): void {
    this.baselineData = [...data];
    this.logger.info(`Baseline set with ${data.length} data points`);
  }

  /**
   * Detect anomalies in data
   */
  detect(data: number[] | DataPoint[]): DetectionResult {
    const startTime = Date.now();
    
    // Convert to DataPoints if necessary
    const dataPoints: DataPoint[] = Array.isArray(data) && typeof data[0] === 'number'
      ? (data as number[]).map((value, idx) => ({
          id: `DP-${idx}`,
          timestamp: new Date(),
          value,
          metadata: {}
        }))
      : data as DataPoint[];

    const values = dataPoints.map(dp => dp.value);
    const anomalies: Anomaly[] = [];

    // Statistical outlier detection
    const outliers = this.detectOutliers(values, dataPoints);
    anomalies.push(...outliers);

    // Pattern-based detection
    if (this.config.enablePatternDetection) {
      for (const pattern of this.patterns.values()) {
        const result = pattern.detect(values);
        if (result.detected && result.confidence >= this.config.minConfidence) {
          const anomaly = this.createAnomalyFromPattern(
            pattern.id as AnomalyType,
            dataPoints,
            result.location,
            result.confidence
          );
          if (anomaly) anomalies.push(anomaly);
        }
      }
    }

    // Store anomalies
    for (const anomaly of anomalies) {
      this.anomalies.set(anomaly.id, anomaly);
    }

    // Identify breakthrough candidates
    const breakthroughCandidates = this.identifyBreakthroughs(anomalies);

    const processingTime = Date.now() - startTime;

    const result: Omit<DetectionResult, 'hash'> = {
      anomalies,
      breakthroughCandidates,
      statistics: {
        totalDataPoints: dataPoints.length,
        anomaliesDetected: anomalies.length,
        breakthroughsIdentified: breakthroughCandidates.length,
        processingTime
      }
    };

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Detect statistical outliers
   */
  private detectOutliers(values: number[], dataPoints: DataPoint[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    if (values.length < 3) return anomalies;

    const mean = this.statsEngine.mean(values);
    const std = this.statsEngine.std(values);
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = this.statsEngine.percentile(sorted, 25);
    const q3 = this.statsEngine.percentile(sorted, 75);
    const iqr = q3 - q1;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const zScore = std > 0 ? Math.abs((value - mean) / std) : 0;
      const isZScoreOutlier = zScore > this.config.zScoreThreshold;
      const isIQROutlier = value < q1 - this.config.iqrMultiplier * iqr ||
                          value > q3 + this.config.iqrMultiplier * iqr;

      if (isZScoreOutlier || isIQROutlier) {
        const confidence = this.calculateOutlierConfidence(zScore, value, q1, q3, iqr);
        
        if (confidence >= this.config.minConfidence) {
          anomalies.push(this.createAnomaly(
            'outlier',
            [dataPoints[i]],
            `Value ${value.toFixed(4)} is a statistical outlier (z-score: ${zScore.toFixed(2)})`,
            this.determineSeverity(zScore),
            confidence,
            {
              baselineStats: { mean, std, min: sorted[0], max: sorted[sorted.length - 1] },
              deviationFromMean: zScore,
              percentileRank: this.calculatePercentileRank(value, sorted),
              neighboringValues: this.getNeighboringValues(i, values)
            }
          ));
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect spike pattern
   */
  private detectSpike(data: number[]): { detected: boolean; location?: number; confidence: number } {
    if (data.length < 5) return { detected: false, confidence: 0 };

    const windowSize = Math.min(this.config.slidingWindowSize, data.length - 1);
    let maxSpikeScore = 0;
    let spikeLocation: number | undefined;

    for (let i = windowSize; i < data.length - 1; i++) {
      const before = data.slice(Math.max(0, i - windowSize), i);
      const after = data.slice(i + 1, Math.min(data.length, i + windowSize + 1));
      
      const beforeMean = this.statsEngine.mean(before);
      const afterMean = after.length > 0 ? this.statsEngine.mean(after) : beforeMean;
      const combinedMean = (beforeMean + afterMean) / 2;
      const combinedStd = this.statsEngine.std([...before, ...after]);

      if (combinedStd > 0) {
        const spikeScore = Math.abs(data[i] - combinedMean) / combinedStd;
        if (spikeScore > maxSpikeScore && spikeScore > this.config.zScoreThreshold) {
          maxSpikeScore = spikeScore;
          spikeLocation = i;
        }
      }
    }

    return {
      detected: maxSpikeScore > this.config.zScoreThreshold,
      location: spikeLocation,
      confidence: Math.min(1, maxSpikeScore / (this.config.zScoreThreshold * 2))
    };
  }

  /**
   * Detect trend break pattern
   */
  private detectTrendBreak(data: number[]): { detected: boolean; location?: number; confidence: number } {
    if (data.length < 10) return { detected: false, confidence: 0 };

    const halfLength = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, halfLength);
    const secondHalf = data.slice(halfLength);

    // Calculate trends using simple linear regression slopes
    const firstSlope = this.calculateSlope(firstHalf);
    const secondSlope = this.calculateSlope(secondHalf);

    // Check for direction change
    const directionChange = (firstSlope > 0 && secondSlope < 0) || (firstSlope < 0 && secondSlope > 0);
    const slopeDiff = Math.abs(firstSlope - secondSlope);
    
    const avgAbsSlope = (Math.abs(firstSlope) + Math.abs(secondSlope)) / 2;
    const confidence = avgAbsSlope > 0 ? Math.min(1, slopeDiff / avgAbsSlope) : 0;

    return {
      detected: directionChange && confidence > 0.5,
      location: halfLength,
      confidence
    };
  }

  /**
   * Detect distribution shift
   */
  private detectDistributionShift(data: number[]): { detected: boolean; location?: number; confidence: number } {
    if (data.length < 20 || this.baselineData.length < 10) {
      return { detected: false, confidence: 0 };
    }

    const baselineMean = this.statsEngine.mean(this.baselineData);
    const baselineStd = this.statsEngine.std(this.baselineData);
    const dataMean = this.statsEngine.mean(data);
    const dataStd = this.statsEngine.std(data);

    // Calculate effect size (Cohen's d)
    const pooledStd = Math.sqrt((baselineStd * baselineStd + dataStd * dataStd) / 2);
    const effectSize = pooledStd > 0 ? Math.abs(dataMean - baselineMean) / pooledStd : 0;

    return {
      detected: effectSize > 0.8, // Large effect size
      confidence: Math.min(1, effectSize / 2)
    };
  }

  /**
   * Create anomaly from pattern detection
   */
  private createAnomalyFromPattern(
    type: AnomalyType,
    dataPoints: DataPoint[],
    location: number | undefined,
    confidence: number
  ): Anomaly | null {
    if (location === undefined) return null;

    const values = dataPoints.map(dp => dp.value);
    const mean = this.statsEngine.mean(values);
    const std = this.statsEngine.std(values);
    const sorted = [...values].sort((a, b) => a - b);

    const affectedPoints = [dataPoints[location]];
    if (location > 0) affectedPoints.unshift(dataPoints[location - 1]);
    if (location < dataPoints.length - 1) affectedPoints.push(dataPoints[location + 1]);

    return this.createAnomaly(
      type,
      affectedPoints,
      `${type.replace('-', ' ')} detected at index ${location}`,
      this.determineSeverityFromConfidence(confidence),
      confidence,
      {
        baselineStats: { mean, std, min: sorted[0], max: sorted[sorted.length - 1] },
        deviationFromMean: std > 0 ? Math.abs(values[location] - mean) / std : 0,
        percentileRank: this.calculatePercentileRank(values[location], sorted),
        neighboringValues: this.getNeighboringValues(location, values)
      }
    );
  }

  /**
   * Create an anomaly object
   */
  private createAnomaly(
    type: AnomalyType,
    dataPoints: DataPoint[],
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    confidence: number,
    context: AnomalyContext
  ): Anomaly {
    const id = `ANOM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const anomaly: Omit<Anomaly, 'hash'> = {
      id,
      type,
      severity,
      description,
      dataPoints,
      score: this.calculateAnomalyScore(severity, confidence, context),
      confidence,
      detectedAt: new Date(),
      context,
      potentialCauses: this.generatePotentialCauses(type, context)
    };

    return {
      ...anomaly,
      hash: HashVerifier.hash(JSON.stringify(anomaly))
    };
  }

  /**
   * Identify breakthrough candidates from anomalies
   */
  private identifyBreakthroughs(anomalies: Anomaly[]): BreakthroughCandidate[] {
    const candidates: BreakthroughCandidate[] = [];

    for (const anomaly of anomalies) {
      // High-severity, high-confidence anomalies are breakthrough candidates
      if (anomaly.severity === 'critical' || 
          (anomaly.severity === 'high' && anomaly.confidence > 0.9)) {
        
        const candidate = this.createBreakthroughCandidate(anomaly);
        candidates.push(candidate);
        this.breakthroughs.set(candidate.id, candidate);
      }
    }

    return candidates;
  }

  /**
   * Create a breakthrough candidate
   */
  private createBreakthroughCandidate(anomaly: Anomaly): BreakthroughCandidate {
    const id = `BTC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const candidate: Omit<BreakthroughCandidate, 'hash'> = {
      id,
      anomaly,
      significance: this.calculateSignificance(anomaly),
      reproducibility: 0.5, // Initial estimate, needs verification
      theoreticalImplications: this.generateTheoreticalImplications(anomaly),
      experimentalVerification: this.generateVerificationSteps(anomaly),
      status: 'candidate',
      score: anomaly.score * 1.2,
      createdAt: new Date()
    };

    return {
      ...candidate,
      hash: HashVerifier.hash(JSON.stringify(candidate))
    };
  }

  /**
   * Calculate outlier confidence
   */
  private calculateOutlierConfidence(
    zScore: number,
    value: number,
    q1: number,
    q3: number,
    iqr: number
  ): number {
    const zScoreConfidence = Math.min(1, zScore / (this.config.zScoreThreshold * 2));
    
    let iqrConfidence = 0;
    if (value < q1 - this.config.iqrMultiplier * iqr) {
      iqrConfidence = Math.min(1, (q1 - this.config.iqrMultiplier * iqr - value) / iqr);
    } else if (value > q3 + this.config.iqrMultiplier * iqr) {
      iqrConfidence = Math.min(1, (value - q3 - this.config.iqrMultiplier * iqr) / iqr);
    }

    return Math.max(zScoreConfidence, iqrConfidence);
  }

  /**
   * Determine severity based on z-score
   */
  private determineSeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3.5) return 'medium';
    return 'low';
  }

  /**
   * Determine severity from confidence
   */
  private determineSeverityFromConfidence(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence > 0.95) return 'critical';
    if (confidence > 0.9) return 'high';
    if (confidence > 0.85) return 'medium';
    return 'low';
  }

  /**
   * Calculate percentile rank
   */
  private calculatePercentileRank(value: number, sorted: number[]): number {
    let count = 0;
    for (const v of sorted) {
      if (v < value) count++;
    }
    return (count / sorted.length) * 100;
  }

  /**
   * Get neighboring values
   */
  private getNeighboringValues(index: number, values: number[]): number[] {
    const neighbors: number[] = [];
    for (let i = Math.max(0, index - 2); i <= Math.min(values.length - 1, index + 2); i++) {
      if (i !== index) neighbors.push(values[i]);
    }
    return neighbors;
  }

  /**
   * Calculate slope using least squares
   */
  private calculateSlope(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumXX += i * i;
    }

    const denominator = n * sumXX - sumX * sumX;
    return denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  }

  /**
   * Calculate anomaly score
   */
  private calculateAnomalyScore(
    severity: string,
    confidence: number,
    context: AnomalyContext
  ): number {
    const severityScore = {
      'low': 0.25,
      'medium': 0.5,
      'high': 0.75,
      'critical': 1.0
    }[severity] || 0.5;

    const deviationScore = Math.min(1, context.deviationFromMean / 5);
    
    return (severityScore * 0.4 + confidence * 0.4 + deviationScore * 0.2);
  }

  /**
   * Generate potential causes for anomaly
   */
  private generatePotentialCauses(type: AnomalyType, context: AnomalyContext): string[] {
    const causes: string[] = [];

    switch (type) {
      case 'outlier':
        causes.push('Measurement error');
        causes.push('System perturbation');
        causes.push('Novel phenomenon');
        break;
      case 'spike':
        causes.push('Sudden system change');
        causes.push('External stimulus');
        causes.push('Phase transition');
        break;
      case 'trend-break':
        causes.push('Regime change');
        causes.push('Parameter shift');
        causes.push('System bifurcation');
        break;
      case 'pattern-deviation':
        causes.push('Pattern disruption');
        causes.push('New behavior emergence');
        break;
      case 'distribution-shift':
        causes.push('Population change');
        causes.push('Environmental factor');
        causes.push('Systematic drift');
        break;
      default:
        causes.push('Unknown cause - requires investigation');
    }

    return causes;
  }

  /**
   * Calculate significance score
   */
  private calculateSignificance(anomaly: Anomaly): number {
    return anomaly.score * anomaly.confidence * (anomaly.severity === 'critical' ? 1.5 : 1);
  }

  /**
   * Generate theoretical implications
   */
  private generateTheoreticalImplications(anomaly: Anomaly): string[] {
    return [
      'May indicate previously unknown physical phenomenon',
      'Could require revision of existing models',
      'Potentially represents measurement breakthrough'
    ];
  }

  /**
   * Generate verification steps
   */
  private generateVerificationSteps(anomaly: Anomaly): string[] {
    return [
      'Repeat measurement under controlled conditions',
      'Cross-validate with independent measurement system',
      'Perform statistical analysis on larger sample',
      'Document all environmental conditions'
    ];
  }

  /**
   * Get all anomalies
   */
  getAllAnomalies(): Anomaly[] {
    return Array.from(this.anomalies.values());
  }

  /**
   * Get breakthrough candidates
   */
  getBreakthroughCandidates(): BreakthroughCandidate[] {
    return Array.from(this.breakthroughs.values());
  }

  /**
   * Update breakthrough status
   */
  updateBreakthroughStatus(
    id: string,
    status: BreakthroughCandidate['status']
  ): void {
    const breakthrough = this.breakthroughs.get(id);
    if (breakthrough) {
      breakthrough.status = status;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`AnomalyDetector-${this.anomalies.size}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): {
    config: DetectionConfig;
    anomalies: Anomaly[];
    breakthroughs: BreakthroughCandidate[];
  } {
    return {
      config: this.config,
      anomalies: Array.from(this.anomalies.values()),
      breakthroughs: Array.from(this.breakthroughs.values())
    };
  }
}

// ============================================================================
// ANOMALY DETECTOR FACTORY
// ============================================================================

export class AnomalyDetectorFactory {
  /**
   * Create detector with default config
   */
  static default(): AnomalyDetector {
    return new AnomalyDetector();
  }

  /**
   * Create high-sensitivity detector
   */
  static highSensitivity(): AnomalyDetector {
    return new AnomalyDetector({
      zScoreThreshold: 2.0,
      iqrMultiplier: 1.0,
      minConfidence: 0.7,
      sensitivityLevel: 'high'
    });
  }

  /**
   * Create low-sensitivity detector
   */
  static lowSensitivity(): AnomalyDetector {
    return new AnomalyDetector({
      zScoreThreshold: 4.0,
      iqrMultiplier: 2.0,
      minConfidence: 0.9,
      sensitivityLevel: 'low'
    });
  }

  /**
   * Create custom detector
   */
  static custom(config: Partial<DetectionConfig>): AnomalyDetector {
    return new AnomalyDetector(config);
  }
}
