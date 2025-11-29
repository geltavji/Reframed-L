/**
 * StatisticsEngine - Statistical Analysis System (M09.02)
 * PRD-09 Phase 9.2: Statistical Validation
 * 
 * Implements statistical tests, significance calculations, and result validation
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// ============================================================================
// INTERFACES
// ============================================================================

export interface StatisticalSummary {
  n: number;
  mean: number;
  median: number;
  mode: number[];
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  hash: string;
}

export interface TestResult {
  testName: string;
  statistic: number;
  pValue: number;
  degreesOfFreedom?: number;
  criticalValue?: number;
  significant: boolean;
  effectSize?: number;
  confidenceInterval?: { lower: number; upper: number };
  interpretation: string;
  hash: string;
}

export interface ConfidenceInterval {
  level: number;
  lower: number;
  upper: number;
  marginOfError: number;
  hash: string;
}

export interface CorrelationResult {
  type: 'pearson' | 'spearman' | 'kendall';
  coefficient: number;
  pValue: number;
  significant: boolean;
  interpretation: string;
  hash: string;
}

export interface RegressionResult {
  type: 'linear' | 'polynomial' | 'exponential' | 'logarithmic';
  coefficients: number[];
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  fStatistic: number;
  pValue: number;
  residuals: number[];
  predictions: number[];
  hash: string;
}

export interface ANOVAResult {
  type: 'one-way' | 'two-way';
  fStatistic: number;
  pValue: number;
  degreesOfFreedom: { between: number; within: number };
  sumOfSquares: { between: number; within: number; total: number };
  meanSquares: { between: number; within: number };
  significant: boolean;
  effectSize: number; // eta squared
  hash: string;
}

export interface ChiSquareResult {
  statistic: number;
  pValue: number;
  degreesOfFreedom: number;
  significant: boolean;
  cramersV: number; // effect size
  interpretation: string;
  hash: string;
}

export interface NormalityTestResult {
  testName: string;
  statistic: number;
  pValue: number;
  isNormal: boolean;
  interpretation: string;
  hash: string;
}

// ============================================================================
// STATISTICAL THRESHOLDS
// ============================================================================

export const StatisticalThresholds = {
  ALPHA_STANDARD: 0.05,
  ALPHA_STRICT: 0.01,
  ALPHA_VERY_STRICT: 0.001,
  EFFECT_SIZE_SMALL: 0.2,
  EFFECT_SIZE_MEDIUM: 0.5,
  EFFECT_SIZE_LARGE: 0.8,
  R_SQUARED_WEAK: 0.25,
  R_SQUARED_MODERATE: 0.50,
  R_SQUARED_STRONG: 0.75
};

// ============================================================================
// STATISTICS ENGINE
// ============================================================================

export class StatisticsEngine {
  private logger: Logger;
  private alpha: number;

  constructor(logger?: Logger, alpha: number = StatisticalThresholds.ALPHA_STANDARD) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.alpha = alpha;
  }

  // ============================================================================
  // DESCRIPTIVE STATISTICS
  // ============================================================================

  /**
   * Calculate comprehensive statistical summary
   */
  summarize(data: number[]): StatisticalSummary {
    if (data.length === 0) {
      throw new Error('Cannot summarize empty dataset');
    }

    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    const mean = this.mean(data);
    const variance = this.variance(data);
    const std = Math.sqrt(variance);

    const summary: Omit<StatisticalSummary, 'hash'> = {
      n,
      mean,
      median: this.median(sorted),
      mode: this.mode(data),
      std,
      variance,
      min: sorted[0],
      max: sorted[n - 1],
      range: sorted[n - 1] - sorted[0],
      q1: this.percentile(sorted, 25),
      q3: this.percentile(sorted, 75),
      iqr: this.percentile(sorted, 75) - this.percentile(sorted, 25),
      skewness: this.skewness(data, mean, std),
      kurtosis: this.kurtosis(data, mean, std)
    };

    return {
      ...summary,
      hash: HashVerifier.hash(JSON.stringify(summary))
    };
  }

  /**
   * Calculate mean
   */
  mean(data: number[]): number {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  /**
   * Calculate median
   */
  median(sortedData: number[]): number {
    const mid = Math.floor(sortedData.length / 2);
    return sortedData.length % 2 !== 0
      ? sortedData[mid]
      : (sortedData[mid - 1] + sortedData[mid]) / 2;
  }

  /**
   * Calculate mode(s)
   */
  mode(data: number[]): number[] {
    const counts = new Map<number, number>();
    let maxCount = 0;

    for (const value of data) {
      const count = (counts.get(value) || 0) + 1;
      counts.set(value, count);
      maxCount = Math.max(maxCount, count);
    }

    const modes: number[] = [];
    for (const [value, count] of counts) {
      if (count === maxCount) {
        modes.push(value);
      }
    }

    return modes.sort((a, b) => a - b);
  }

  /**
   * Calculate variance
   */
  variance(data: number[], population: boolean = false): number {
    const mean = this.mean(data);
    const sumSquaredDiff = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    return sumSquaredDiff / (data.length - (population ? 0 : 1));
  }

  /**
   * Calculate standard deviation
   */
  std(data: number[], population: boolean = false): number {
    return Math.sqrt(this.variance(data, population));
  }

  /**
   * Calculate percentile
   */
  percentile(sortedData: number[], p: number): number {
    const index = (p / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (upper >= sortedData.length) return sortedData[sortedData.length - 1];
    if (lower < 0) return sortedData[0];

    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
  }

  /**
   * Calculate skewness
   */
  skewness(data: number[], mean?: number, std?: number): number {
    const m = mean !== undefined ? mean : this.mean(data);
    const s = std !== undefined ? std : this.std(data);
    const n = data.length;

    if (s === 0) return 0;

    const sumCubedDiff = data.reduce((sum, val) => sum + Math.pow((val - m) / s, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sumCubedDiff;
  }

  /**
   * Calculate kurtosis (excess kurtosis)
   */
  kurtosis(data: number[], mean?: number, std?: number): number {
    const m = mean !== undefined ? mean : this.mean(data);
    const s = std !== undefined ? std : this.std(data);
    const n = data.length;

    if (s === 0) return 0;

    const sumFourthDiff = data.reduce((sum, val) => sum + Math.pow((val - m) / s, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sumFourthDiff -
           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  // ============================================================================
  // HYPOTHESIS TESTS
  // ============================================================================

  /**
   * One-sample t-test
   */
  oneSampleTTest(data: number[], hypothesizedMean: number): TestResult {
    const n = data.length;
    const mean = this.mean(data);
    const se = this.std(data) / Math.sqrt(n);
    const t = (mean - hypothesizedMean) / se;
    const df = n - 1;
    const pValue = 2 * (1 - this.tCDF(Math.abs(t), df));
    const criticalValue = this.tInverse(1 - this.alpha / 2, df);

    const result: Omit<TestResult, 'hash'> = {
      testName: 'One-sample t-test',
      statistic: t,
      pValue,
      degreesOfFreedom: df,
      criticalValue,
      significant: pValue < this.alpha,
      effectSize: (mean - hypothesizedMean) / this.std(data), // Cohen's d
      confidenceInterval: {
        lower: mean - criticalValue * se,
        upper: mean + criticalValue * se
      },
      interpretation: pValue < this.alpha
        ? `Reject H0: Mean significantly differs from ${hypothesizedMean}`
        : `Fail to reject H0: No significant difference from ${hypothesizedMean}`
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  /**
   * Two-sample t-test (independent samples)
   */
  twoSampleTTest(data1: number[], data2: number[], equalVariance: boolean = true): TestResult {
    const n1 = data1.length;
    const n2 = data2.length;
    const mean1 = this.mean(data1);
    const mean2 = this.mean(data2);
    const var1 = this.variance(data1);
    const var2 = this.variance(data2);

    let t: number, df: number, se: number;

    if (equalVariance) {
      // Pooled variance
      const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
      se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
      df = n1 + n2 - 2;
    } else {
      // Welch's t-test
      se = Math.sqrt(var1 / n1 + var2 / n2);
      const num = Math.pow(var1 / n1 + var2 / n2, 2);
      const denom = Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1);
      df = num / denom;
    }

    t = (mean1 - mean2) / se;
    const pValue = 2 * (1 - this.tCDF(Math.abs(t), df));
    const pooledStd = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));

    const result: Omit<TestResult, 'hash'> = {
      testName: equalVariance ? 'Two-sample t-test (equal variance)' : 'Welch\'s t-test',
      statistic: t,
      pValue,
      degreesOfFreedom: df,
      significant: pValue < this.alpha,
      effectSize: (mean1 - mean2) / pooledStd, // Cohen's d
      interpretation: pValue < this.alpha
        ? 'Reject H0: Means are significantly different'
        : 'Fail to reject H0: No significant difference between means'
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  /**
   * Paired t-test
   */
  pairedTTest(data1: number[], data2: number[]): TestResult {
    if (data1.length !== data2.length) {
      throw new Error('Paired t-test requires equal-length samples');
    }

    const differences = data1.map((val, i) => val - data2[i]);
    return this.oneSampleTTest(differences, 0);
  }

  /**
   * Z-test (known population standard deviation)
   */
  zTest(data: number[], hypothesizedMean: number, populationStd: number): TestResult {
    const n = data.length;
    const mean = this.mean(data);
    const se = populationStd / Math.sqrt(n);
    const z = (mean - hypothesizedMean) / se;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    const criticalValue = this.normalInverse(1 - this.alpha / 2);

    const result: Omit<TestResult, 'hash'> = {
      testName: 'Z-test',
      statistic: z,
      pValue,
      criticalValue,
      significant: pValue < this.alpha,
      effectSize: (mean - hypothesizedMean) / populationStd,
      confidenceInterval: {
        lower: mean - criticalValue * se,
        upper: mean + criticalValue * se
      },
      interpretation: pValue < this.alpha
        ? `Reject H0: Mean significantly differs from ${hypothesizedMean}`
        : `Fail to reject H0: No significant difference from ${hypothesizedMean}`
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  // ============================================================================
  // CONFIDENCE INTERVALS
  // ============================================================================

  /**
   * Calculate confidence interval for mean
   */
  confidenceIntervalMean(data: number[], level: number = 0.95): ConfidenceInterval {
    const n = data.length;
    const mean = this.mean(data);
    const se = this.std(data) / Math.sqrt(n);
    const df = n - 1;
    const t = this.tInverse(1 - (1 - level) / 2, df);
    const marginOfError = t * se;

    const ci: Omit<ConfidenceInterval, 'hash'> = {
      level,
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      marginOfError
    };

    return { ...ci, hash: HashVerifier.hash(JSON.stringify(ci)) };
  }

  /**
   * Calculate confidence interval for proportion
   */
  confidenceIntervalProportion(successes: number, n: number, level: number = 0.95): ConfidenceInterval {
    const p = successes / n;
    const z = this.normalInverse(1 - (1 - level) / 2);
    const se = Math.sqrt((p * (1 - p)) / n);
    const marginOfError = z * se;

    const ci: Omit<ConfidenceInterval, 'hash'> = {
      level,
      lower: Math.max(0, p - marginOfError),
      upper: Math.min(1, p + marginOfError),
      marginOfError
    };

    return { ...ci, hash: HashVerifier.hash(JSON.stringify(ci)) };
  }

  // ============================================================================
  // CORRELATION ANALYSIS
  // ============================================================================

  /**
   * Calculate Pearson correlation coefficient
   */
  pearsonCorrelation(x: number[], y: number[]): CorrelationResult {
    if (x.length !== y.length) {
      throw new Error('Arrays must have equal length');
    }

    const n = x.length;
    const meanX = this.mean(x);
    const meanY = this.mean(y);
    const stdX = this.std(x);
    const stdY = this.std(y);

    let sumProduct = 0;
    for (let i = 0; i < n; i++) {
      sumProduct += (x[i] - meanX) * (y[i] - meanY);
    }

    const r = sumProduct / ((n - 1) * stdX * stdY);
    
    // Calculate p-value using t-distribution
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const pValue = 2 * (1 - this.tCDF(Math.abs(t), n - 2));

    const result: Omit<CorrelationResult, 'hash'> = {
      type: 'pearson',
      coefficient: r,
      pValue,
      significant: pValue < this.alpha,
      interpretation: this.interpretCorrelation(r)
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  /**
   * Calculate Spearman rank correlation
   */
  spearmanCorrelation(x: number[], y: number[]): CorrelationResult {
    if (x.length !== y.length) {
      throw new Error('Arrays must have equal length');
    }

    const rankX = this.rank(x);
    const rankY = this.rank(y);
    
    return { ...this.pearsonCorrelation(rankX, rankY), type: 'spearman' };
  }

  /**
   * Interpret correlation coefficient
   */
  private interpretCorrelation(r: number): string {
    const absR = Math.abs(r);
    const direction = r > 0 ? 'positive' : 'negative';
    
    if (absR < 0.1) return 'Negligible correlation';
    if (absR < 0.3) return `Weak ${direction} correlation`;
    if (absR < 0.5) return `Moderate ${direction} correlation`;
    if (absR < 0.7) return `Strong ${direction} correlation`;
    return `Very strong ${direction} correlation`;
  }

  /**
   * Calculate ranks for data
   */
  private rank(data: number[]): number[] {
    const sorted = data.map((val, idx) => ({ val, idx })).sort((a, b) => a.val - b.val);
    const ranks = new Array(data.length);
    
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j < sorted.length && sorted[j].val === sorted[i].val) {
        j++;
      }
      const avgRank = (i + j + 1) / 2;
      for (let k = i; k < j; k++) {
        ranks[sorted[k].idx] = avgRank;
      }
      i = j;
    }
    
    return ranks;
  }

  // ============================================================================
  // REGRESSION ANALYSIS
  // ============================================================================

  /**
   * Perform linear regression
   */
  linearRegression(x: number[], y: number[]): RegressionResult {
    if (x.length !== y.length) {
      throw new Error('Arrays must have equal length');
    }

    const n = x.length;
    const meanX = this.mean(x);
    const meanY = this.mean(y);

    let sumXY = 0, sumXX = 0, sumYY = 0;
    for (let i = 0; i < n; i++) {
      sumXY += (x[i] - meanX) * (y[i] - meanY);
      sumXX += Math.pow(x[i] - meanX, 2);
      sumYY += Math.pow(y[i] - meanY, 2);
    }

    const slope = sumXY / sumXX;
    const intercept = meanY - slope * meanX;

    // Calculate predictions and residuals
    const predictions = x.map(xi => intercept + slope * xi);
    const residuals = y.map((yi, i) => yi - predictions[i]);

    // Calculate R-squared
    const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
    const ssTot = sumYY;
    const rSquared = 1 - ssRes / ssTot;
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);

    // Standard error and F-statistic
    const standardError = Math.sqrt(ssRes / (n - 2));
    const fStatistic = (rSquared * (n - 2)) / (1 - rSquared);
    const pValue = 1 - this.fCDF(fStatistic, 1, n - 2);

    const result: Omit<RegressionResult, 'hash'> = {
      type: 'linear',
      coefficients: [intercept, slope],
      rSquared,
      adjustedRSquared,
      standardError,
      fStatistic,
      pValue,
      residuals,
      predictions
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  // ============================================================================
  // ANOVA
  // ============================================================================

  /**
   * One-way ANOVA
   */
  oneWayANOVA(groups: number[][]): ANOVAResult {
    const k = groups.length; // number of groups
    const n = groups.reduce((sum, g) => sum + g.length, 0); // total observations
    const grandMean = this.mean(groups.flat());

    // Sum of squares between groups
    let ssBetween = 0;
    for (const group of groups) {
      const groupMean = this.mean(group);
      ssBetween += group.length * Math.pow(groupMean - grandMean, 2);
    }

    // Sum of squares within groups
    let ssWithin = 0;
    for (const group of groups) {
      const groupMean = this.mean(group);
      for (const val of group) {
        ssWithin += Math.pow(val - groupMean, 2);
      }
    }

    const ssTotal = ssBetween + ssWithin;
    const dfBetween = k - 1;
    const dfWithin = n - k;

    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;

    // Handle edge case where all values are identical (ssWithin = 0)
    const fStatistic = msWithin === 0 ? (msBetween === 0 ? 0 : Infinity) : msBetween / msWithin;
    const pValue = isFinite(fStatistic) ? 1 - this.fCDF(fStatistic, dfBetween, dfWithin) : 0;
    const etaSquared = ssTotal === 0 ? 0 : ssBetween / ssTotal;

    const result: Omit<ANOVAResult, 'hash'> = {
      type: 'one-way',
      fStatistic: isFinite(fStatistic) ? fStatistic : 0,
      pValue,
      degreesOfFreedom: { between: dfBetween, within: dfWithin },
      sumOfSquares: { between: ssBetween, within: ssWithin, total: ssTotal },
      meanSquares: { between: msBetween, within: msWithin },
      significant: pValue < this.alpha,
      effectSize: etaSquared
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  // ============================================================================
  // CHI-SQUARE TESTS
  // ============================================================================

  /**
   * Chi-square test for independence
   */
  chiSquareTest(observed: number[][], expected?: number[][]): ChiSquareResult {
    const rows = observed.length;
    const cols = observed[0].length;

    // Calculate expected values if not provided
    if (!expected) {
      const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0));
      const colTotals = observed[0].map((_, j) => observed.reduce((sum, row) => sum + row[j], 0));
      const total = rowTotals.reduce((a, b) => a + b, 0);

      expected = observed.map((row, i) =>
        row.map((_, j) => (rowTotals[i] * colTotals[j]) / total)
      );
    }

    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        chiSquare += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j];
      }
    }

    const df = (rows - 1) * (cols - 1);
    const pValue = 1 - this.chiSquareCDF(chiSquare, df);
    const total = observed.flat().reduce((a, b) => a + b, 0);
    const cramersV = Math.sqrt(chiSquare / (total * Math.min(rows - 1, cols - 1)));

    const result: Omit<ChiSquareResult, 'hash'> = {
      statistic: chiSquare,
      pValue,
      degreesOfFreedom: df,
      significant: pValue < this.alpha,
      cramersV,
      interpretation: pValue < this.alpha
        ? 'Variables are significantly associated'
        : 'No significant association between variables'
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  /**
   * Chi-square goodness of fit test
   */
  chiSquareGoodnessOfFit(observed: number[], expected: number[]): ChiSquareResult {
    if (observed.length !== expected.length) {
      throw new Error('Observed and expected arrays must have equal length');
    }

    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }

    const df = observed.length - 1;
    const pValue = 1 - this.chiSquareCDF(chiSquare, df);

    const result: Omit<ChiSquareResult, 'hash'> = {
      statistic: chiSquare,
      pValue,
      degreesOfFreedom: df,
      significant: pValue < this.alpha,
      cramersV: 0, // Not applicable for goodness of fit
      interpretation: pValue < this.alpha
        ? 'Distribution significantly differs from expected'
        : 'Distribution consistent with expected'
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  // ============================================================================
  // NORMALITY TESTS
  // ============================================================================

  /**
   * Shapiro-Wilk test approximation
   */
  shapiroWilkTest(data: number[]): NormalityTestResult {
    const n = data.length;
    if (n < 3 || n > 5000) {
      throw new Error('Shapiro-Wilk test requires 3 to 5000 samples');
    }

    const sorted = [...data].sort((a, b) => a - b);
    const mean = this.mean(data);
    
    // Simplified Shapiro-Wilk approximation
    let numerator = 0;
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const a = this.shapiroWilkCoefficient(i, n);
      numerator += a * (sorted[n - 1 - i] - sorted[i]);
    }
    
    const denominator = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
    const w = Math.pow(numerator, 2) / denominator;

    // Approximate p-value (simplified)
    const pValue = this.approximateShapiroWilkPValue(w, n);

    const result: Omit<NormalityTestResult, 'hash'> = {
      testName: 'Shapiro-Wilk',
      statistic: w,
      pValue,
      isNormal: pValue >= this.alpha,
      interpretation: pValue >= this.alpha
        ? 'Data appears to be normally distributed'
        : 'Data significantly deviates from normal distribution'
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  /**
   * Jarque-Bera test
   */
  jarqueBeraTest(data: number[]): NormalityTestResult {
    const n = data.length;
    const s = this.skewness(data);
    const k = this.kurtosis(data);

    const jb = (n / 6) * (Math.pow(s, 2) + Math.pow(k, 2) / 4);
    const pValue = 1 - this.chiSquareCDF(jb, 2);

    const result: Omit<NormalityTestResult, 'hash'> = {
      testName: 'Jarque-Bera',
      statistic: jb,
      pValue,
      isNormal: pValue >= this.alpha,
      interpretation: pValue >= this.alpha
        ? 'Data appears to be normally distributed'
        : 'Data significantly deviates from normal distribution'
    };

    return { ...result, hash: HashVerifier.hash(JSON.stringify(result)) };
  }

  // ============================================================================
  // DISTRIBUTION FUNCTIONS
  // ============================================================================

  /**
   * Normal CDF (standard normal)
   */
  normalCDF(z: number): number {
    // Approximation using error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Normal inverse (standard normal)
   */
  normalInverse(p: number): number {
    // Approximation using rational function
    if (p <= 0 || p >= 1) {
      throw new Error('p must be between 0 and 1');
    }

    const a = [
      -3.969683028665376e+01, 2.209460984245205e+02,
      -2.759285104469687e+02, 1.383577518672690e+02,
      -3.066479806614716e+01, 2.506628277459239e+00
    ];
    const b = [
      -5.447609879822406e+01, 1.615858368580409e+02,
      -1.556989798598866e+02, 6.680131188771972e+01,
      -1.328068155288572e+01
    ];
    const c = [
      -7.784894002430293e-03, -3.223964580411365e-01,
      -2.400758277161838e+00, -2.549732539343734e+00,
      4.374664141464968e+00, 2.938163982698783e+00
    ];
    const d = [
      7.784695709041462e-03, 3.224671290700398e-01,
      2.445134137142996e+00, 3.754408661907416e+00
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
             (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
              ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
  }

  /**
   * t-distribution CDF
   */
  tCDF(t: number, df: number): number {
    // Approximation using normal distribution for large df
    if (df > 100) {
      return this.normalCDF(t);
    }

    const x = df / (df + t * t);
    return 1 - 0.5 * this.incompleteBeta(df / 2, 0.5, x);
  }

  /**
   * t-distribution inverse
   */
  tInverse(p: number, df: number): number {
    // Newton-Raphson iteration
    let t = this.normalInverse(p);
    
    for (let i = 0; i < 10; i++) {
      const cdf = this.tCDF(t, df);
      const pdf = Math.pow(1 + t * t / df, -(df + 1) / 2) / 
                  (Math.sqrt(df) * this.beta(df / 2, 0.5));
      t = t - (cdf - p) / pdf;
    }
    
    return t;
  }

  /**
   * F-distribution CDF
   */
  fCDF(f: number, df1: number, df2: number): number {
    if (f <= 0) return 0;
    const x = df1 * f / (df1 * f + df2);
    return this.incompleteBeta(df1 / 2, df2 / 2, x);
  }

  /**
   * Chi-square CDF
   */
  chiSquareCDF(x: number, df: number): number {
    if (x <= 0) return 0;
    return this.lowerIncompleteGamma(df / 2, x / 2) / this.gamma(df / 2);
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Beta function
   */
  private beta(a: number, b: number): number {
    return this.gamma(a) * this.gamma(b) / this.gamma(a + b);
  }

  /**
   * Gamma function (Lanczos approximation)
   */
  private gamma(z: number): number {
    const g = 7;
    const c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];

    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
    }

    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
      x += c[i] / (z + i);
    }

    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  /**
   * Incomplete beta function
   */
  private incompleteBeta(a: number, b: number, x: number): number {
    if (x === 0) return 0;
    if (x === 1) return 1;

    const bt = Math.exp(
      this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
      a * Math.log(x) + b * Math.log(1 - x)
    );

    if (x < (a + 1) / (a + b + 2)) {
      return bt * this.betaCF(a, b, x) / a;
    }
    return 1 - bt * this.betaCF(b, a, 1 - x) / b;
  }

  /**
   * Continued fraction for incomplete beta
   */
  private betaCF(a: number, b: number, x: number): number {
    const maxIter = 200;
    const eps = 3e-7;
    const fpmin = 1e-30;

    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;

    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIter; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1 + aa / c;
      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1 / d;
      h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < fpmin) d = fpmin;
      c = 1 + aa / c;
      if (Math.abs(c) < fpmin) c = fpmin;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < eps) break;
    }

    return h;
  }

  /**
   * Log gamma function
   */
  private logGamma(z: number): number {
    const c = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.001208650973866179, -5.395239384953e-6
    ];

    let x = z;
    let y = z;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) {
      ser += c[j] / ++y;
    }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }

  /**
   * Lower incomplete gamma function
   */
  private lowerIncompleteGamma(a: number, x: number): number {
    if (x < 0 || a <= 0) return 0;
    if (x === 0) return 0;

    if (x < a + 1) {
      // Series representation
      let sum = 1 / a;
      let term = sum;
      for (let n = 1; n < 100; n++) {
        term *= x / (a + n);
        sum += term;
        if (Math.abs(term) < Math.abs(sum) * 3e-7) break;
      }
      return sum * Math.exp(-x + a * Math.log(x) - this.logGamma(a));
    } else {
      // Continued fraction
      return this.gamma(a) - this.upperIncompleteGamma(a, x);
    }
  }

  /**
   * Upper incomplete gamma function
   */
  private upperIncompleteGamma(a: number, x: number): number {
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;

    for (let i = 1; i <= 100; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-7) break;
    }

    return Math.exp(-x + a * Math.log(x) - this.logGamma(a)) * h;
  }

  /**
   * Shapiro-Wilk coefficient approximation
   */
  private shapiroWilkCoefficient(i: number, n: number): number {
    const m = this.normalInverse((i + 1 - 0.375) / (n + 0.25));
    return m / Math.sqrt(n);
  }

  /**
   * Approximate Shapiro-Wilk p-value
   */
  private approximateShapiroWilkPValue(w: number, n: number): number {
    // Simplified approximation
    const logN = Math.log(n);
    const mean = 0.0038915 * logN * logN * logN - 0.083751 * logN * logN - 0.31082 * logN - 1.5861;
    const std = Math.exp(0.0030302 * logN * logN - 0.082676 * logN - 0.4803);
    const z = (Math.log(1 - w) - mean) / std;
    return 1 - this.normalCDF(z);
  }

  /**
   * Set significance level
   */
  setAlpha(alpha: number): void {
    if (alpha <= 0 || alpha >= 1) {
      throw new Error('Alpha must be between 0 and 1');
    }
    this.alpha = alpha;
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`StatisticsEngine-alpha-${this.alpha}`);
  }
}

// ============================================================================
// STATISTICS FACTORY
// ============================================================================

export class StatisticsFactory {
  /**
   * Create engine with standard settings
   */
  static standard(): StatisticsEngine {
    return new StatisticsEngine(undefined, StatisticalThresholds.ALPHA_STANDARD);
  }

  /**
   * Create engine with strict settings
   */
  static strict(): StatisticsEngine {
    return new StatisticsEngine(undefined, StatisticalThresholds.ALPHA_STRICT);
  }

  /**
   * Create engine with very strict settings
   */
  static veryStrict(): StatisticsEngine {
    return new StatisticsEngine(undefined, StatisticalThresholds.ALPHA_VERY_STRICT);
  }
}
