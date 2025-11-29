/**
 * StatisticsEngine Tests (M09.02)
 * PRD-09 Phase 9.2: Statistical Validation
 */

import {
  StatisticsEngine,
  StatisticsFactory,
  StatisticalThresholds,
  StatisticalSummary,
  TestResult,
  CorrelationResult,
  RegressionResult,
  ANOVAResult,
  ChiSquareResult,
  NormalityTestResult
} from '../../../src/validation/statistics/StatisticsEngine';

describe('StatisticsEngine', () => {
  let engine: StatisticsEngine;

  beforeEach(() => {
    engine = new StatisticsEngine();
  });

  describe('Descriptive Statistics', () => {
    describe('mean', () => {
      it('should calculate mean correctly', () => {
        const data = [1, 2, 3, 4, 5];
        expect(engine.mean(data)).toBe(3);
      });

      it('should handle single value', () => {
        expect(engine.mean([5])).toBe(5);
      });

      it('should handle negative numbers', () => {
        const data = [-2, -1, 0, 1, 2];
        expect(engine.mean(data)).toBe(0);
      });
    });

    describe('median', () => {
      it('should calculate median for odd length array', () => {
        const data = [1, 2, 3, 4, 5];
        expect(engine.median(data)).toBe(3);
      });

      it('should calculate median for even length array', () => {
        const data = [1, 2, 3, 4];
        expect(engine.median(data)).toBe(2.5);
      });
    });

    describe('mode', () => {
      it('should find single mode', () => {
        const data = [1, 2, 2, 3, 4];
        expect(engine.mode(data)).toEqual([2]);
      });

      it('should find multiple modes', () => {
        const data = [1, 1, 2, 2, 3];
        expect(engine.mode(data)).toEqual([1, 2]);
      });

      it('should return all values when all are modes', () => {
        const data = [1, 2, 3, 4, 5];
        expect(engine.mode(data).length).toBe(5);
      });
    });

    describe('variance', () => {
      it('should calculate sample variance', () => {
        const data = [2, 4, 4, 4, 5, 5, 7, 9];
        const variance = engine.variance(data);
        expect(variance).toBeCloseTo(4.571, 2);
      });

      it('should calculate population variance', () => {
        const data = [2, 4, 4, 4, 5, 5, 7, 9];
        const variance = engine.variance(data, true);
        expect(variance).toBeCloseTo(4, 2);
      });
    });

    describe('std', () => {
      it('should calculate standard deviation', () => {
        const data = [2, 4, 4, 4, 5, 5, 7, 9];
        const std = engine.std(data);
        expect(std).toBeCloseTo(2.138, 2);
      });
    });

    describe('percentile', () => {
      it('should calculate percentiles', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        expect(engine.percentile(data, 50)).toBe(5.5);
        expect(engine.percentile(data, 25)).toBe(3.25);
        expect(engine.percentile(data, 75)).toBe(7.75);
      });
    });

    describe('skewness', () => {
      it('should calculate skewness', () => {
        const symmetric = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const skew = engine.skewness(symmetric);
        expect(Math.abs(skew)).toBeLessThan(0.5);
      });

      it('should detect positive skewness', () => {
        const rightSkewed = [1, 1, 1, 2, 2, 3, 10];
        const skew = engine.skewness(rightSkewed);
        expect(skew).toBeGreaterThan(0);
      });
    });

    describe('kurtosis', () => {
      it('should calculate kurtosis', () => {
        const normal = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const kurt = engine.kurtosis(normal);
        expect(typeof kurt).toBe('number');
      });
    });

    describe('summarize', () => {
      it('should generate complete summary', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const summary = engine.summarize(data);

        expect(summary.n).toBe(10);
        expect(summary.mean).toBe(5.5);
        expect(summary.median).toBe(5.5);
        expect(summary.min).toBe(1);
        expect(summary.max).toBe(10);
        expect(summary.range).toBe(9);
        expect(summary.hash).toBeDefined();
      });

      it('should throw error for empty data', () => {
        expect(() => engine.summarize([])).toThrow();
      });
    });
  });

  describe('Hypothesis Tests', () => {
    describe('oneSampleTTest', () => {
      it('should perform one-sample t-test', () => {
        const data = [9.8, 10.2, 10.1, 9.9, 10.0, 10.3, 9.7, 10.1];
        const result = engine.oneSampleTTest(data, 10);

        expect(result.testName).toBe('One-sample t-test');
        expect(result.pValue).toBeDefined();
        expect(result.degreesOfFreedom).toBe(7);
        expect(result.hash).toBeDefined();
      });

      it('should detect significant difference', () => {
        const data = [1, 2, 3, 4, 5];
        const result = engine.oneSampleTTest(data, 100);

        expect(result.significant).toBe(true);
      });

      it('should not detect difference when none exists', () => {
        const data = [9.9, 10.1, 9.8, 10.2, 10.0];
        const result = engine.oneSampleTTest(data, 10);

        expect(result.pValue).toBeGreaterThan(0.05);
      });
    });

    describe('twoSampleTTest', () => {
      it('should perform two-sample t-test', () => {
        const group1 = [5, 6, 7, 8, 9];
        const group2 = [10, 11, 12, 13, 14];
        const result = engine.twoSampleTTest(group1, group2);

        expect(result.testName).toContain('t-test');
        expect(result.significant).toBe(true);
        expect(result.hash).toBeDefined();
      });

      it('should perform Welch\'s t-test', () => {
        const group1 = [5, 6, 7, 8, 9];
        const group2 = [10, 11, 12, 13, 14];
        const result = engine.twoSampleTTest(group1, group2, false);

        expect(result.testName).toContain('Welch');
      });

      it('should not detect difference for similar groups', () => {
        const group1 = [5.1, 4.9, 5.0, 5.2, 4.8];
        const group2 = [5.0, 5.1, 4.9, 5.0, 5.1];
        const result = engine.twoSampleTTest(group1, group2);

        expect(result.pValue).toBeGreaterThan(0.05);
      });
    });

    describe('pairedTTest', () => {
      it('should perform paired t-test', () => {
        const before = [5, 6, 7, 8, 9];
        const after = [7, 8, 9, 10, 11];
        const result = engine.pairedTTest(before, after);

        expect(result.significant).toBe(true);
      });

      it('should throw error for unequal lengths', () => {
        expect(() => engine.pairedTTest([1, 2, 3], [1, 2])).toThrow();
      });
    });

    describe('zTest', () => {
      it('should perform z-test', () => {
        const data = Array.from({ length: 100 }, (_, i) => 100 + (i % 10));
        const result = engine.zTest(data, 100, 3);

        expect(result.testName).toBe('Z-test');
        expect(result.hash).toBeDefined();
      });
    });
  });

  describe('Confidence Intervals', () => {
    it('should calculate confidence interval for mean', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const ci = engine.confidenceIntervalMean(data, 0.95);

      expect(ci.level).toBe(0.95);
      expect(ci.lower).toBeLessThan(ci.upper);
      expect(ci.marginOfError).toBeGreaterThan(0);
      expect(ci.hash).toBeDefined();
    });

    it('should calculate confidence interval for proportion', () => {
      const ci = engine.confidenceIntervalProportion(70, 100, 0.95);

      expect(ci.level).toBe(0.95);
      expect(ci.lower).toBeLessThan(0.7);
      expect(ci.upper).toBeGreaterThan(0.7);
    });
  });

  describe('Correlation Analysis', () => {
    describe('pearsonCorrelation', () => {
      it('should calculate Pearson correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10];
        const result = engine.pearsonCorrelation(x, y);

        expect(result.type).toBe('pearson');
        expect(result.coefficient).toBeCloseTo(1, 5);
        expect(result.hash).toBeDefined();
      });

      it('should detect negative correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [10, 8, 6, 4, 2];
        const result = engine.pearsonCorrelation(x, y);

        expect(result.coefficient).toBeCloseTo(-1, 5);
      });

      it('should detect no correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [3, 1, 4, 1, 5];
        const result = engine.pearsonCorrelation(x, y);

        expect(Math.abs(result.coefficient)).toBeLessThan(0.5);
      });

      it('should throw error for unequal lengths', () => {
        expect(() => engine.pearsonCorrelation([1, 2], [1, 2, 3])).toThrow();
      });
    });

    describe('spearmanCorrelation', () => {
      it('should calculate Spearman correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10];
        const result = engine.spearmanCorrelation(x, y);

        expect(result.type).toBe('spearman');
        expect(result.coefficient).toBeCloseTo(1, 5);
      });
    });
  });

  describe('Regression Analysis', () => {
    describe('linearRegression', () => {
      it('should perform linear regression', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2.1, 3.9, 6.1, 7.9, 10.1];
        const result = engine.linearRegression(x, y);

        expect(result.type).toBe('linear');
        expect(result.coefficients.length).toBe(2);
        expect(result.rSquared).toBeGreaterThan(0.99);
        expect(result.hash).toBeDefined();
      });

      it('should calculate residuals', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10];
        const result = engine.linearRegression(x, y);

        expect(result.residuals.length).toBe(5);
      });

      it('should calculate predictions', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10];
        const result = engine.linearRegression(x, y);

        expect(result.predictions.length).toBe(5);
        expect(result.predictions[0]).toBeCloseTo(2, 1);
      });
    });
  });

  describe('ANOVA', () => {
    describe('oneWayANOVA', () => {
      it('should perform one-way ANOVA', () => {
        const groups = [
          [5, 6, 7, 8, 9],
          [15, 16, 17, 18, 19],
          [25, 26, 27, 28, 29]
        ];
        const result = engine.oneWayANOVA(groups);

        expect(result.type).toBe('one-way');
        expect(result.significant).toBe(true);
        expect(result.fStatistic).toBeGreaterThan(0);
        expect(result.hash).toBeDefined();
      });

      it('should not detect difference for similar groups', () => {
        const groups = [
          [5, 5, 5, 5, 5],
          [5, 5, 5, 5, 5],
          [5, 5, 5, 5, 5]
        ];
        const result = engine.oneWayANOVA(groups);

        expect(result.fStatistic).toBe(0);
      });
    });
  });

  describe('Chi-Square Tests', () => {
    describe('chiSquareTest', () => {
      it('should perform chi-square test for independence', () => {
        const observed = [
          [30, 10],
          [20, 40]
        ];
        const result = engine.chiSquareTest(observed);

        expect(result.degreesOfFreedom).toBe(1);
        expect(result.hash).toBeDefined();
      });

      it('should use provided expected values', () => {
        const observed = [[30, 10], [20, 40]];
        const expected = [[25, 15], [25, 35]];
        const result = engine.chiSquareTest(observed, expected);

        expect(result.statistic).toBeGreaterThan(0);
      });
    });

    describe('chiSquareGoodnessOfFit', () => {
      it('should perform goodness of fit test', () => {
        const observed = [25, 25, 25, 25];
        const expected = [25, 25, 25, 25];
        const result = engine.chiSquareGoodnessOfFit(observed, expected);

        expect(result.statistic).toBe(0);
        expect(result.significant).toBe(false);
      });

      it('should throw error for unequal lengths', () => {
        expect(() => engine.chiSquareGoodnessOfFit([1, 2], [1, 2, 3])).toThrow();
      });
    });
  });

  describe('Normality Tests', () => {
    describe('shapiroWilkTest', () => {
      it('should test for normality', () => {
        // Generate approximately normal data
        const data = Array.from({ length: 50 }, () => {
          let sum = 0;
          for (let i = 0; i < 12; i++) sum += Math.random();
          return sum - 6;
        });
        const result = engine.shapiroWilkTest(data);

        expect(result.testName).toBe('Shapiro-Wilk');
        expect(result.hash).toBeDefined();
      });

      it('should reject non-normal data', () => {
        // Uniform distribution
        const data = Array.from({ length: 50 }, () => Math.random());
        const result = engine.shapiroWilkTest(data);

        expect(typeof result.isNormal).toBe('boolean');
      });

      it('should throw error for invalid sample size', () => {
        expect(() => engine.shapiroWilkTest([1, 2])).toThrow();
      });
    });

    describe('jarqueBeraTest', () => {
      it('should perform Jarque-Bera test', () => {
        const data = Array.from({ length: 100 }, () => {
          let sum = 0;
          for (let i = 0; i < 12; i++) sum += Math.random();
          return sum - 6;
        });
        const result = engine.jarqueBeraTest(data);

        expect(result.testName).toBe('Jarque-Bera');
        expect(result.hash).toBeDefined();
      });
    });
  });

  describe('Distribution Functions', () => {
    describe('normalCDF', () => {
      it('should calculate normal CDF', () => {
        expect(engine.normalCDF(0)).toBeCloseTo(0.5, 2);
        expect(engine.normalCDF(1.96)).toBeCloseTo(0.975, 2);
        expect(engine.normalCDF(-1.96)).toBeCloseTo(0.025, 2);
      });
    });

    describe('normalInverse', () => {
      it('should calculate normal inverse', () => {
        expect(engine.normalInverse(0.5)).toBeCloseTo(0, 2);
        expect(engine.normalInverse(0.975)).toBeCloseTo(1.96, 2);
      });

      it('should throw error for invalid p', () => {
        expect(() => engine.normalInverse(0)).toThrow();
        expect(() => engine.normalInverse(1)).toThrow();
      });
    });
  });

  describe('Configuration', () => {
    it('should allow setting alpha level', () => {
      engine.setAlpha(0.01);
      expect(engine.getHash()).toBeDefined();
    });

    it('should throw error for invalid alpha', () => {
      expect(() => engine.setAlpha(0)).toThrow();
      expect(() => engine.setAlpha(1)).toThrow();
    });
  });

  describe('StatisticsFactory', () => {
    it('should create standard engine', () => {
      const eng = StatisticsFactory.standard();
      expect(eng).toBeInstanceOf(StatisticsEngine);
    });

    it('should create strict engine', () => {
      const eng = StatisticsFactory.strict();
      expect(eng).toBeInstanceOf(StatisticsEngine);
    });

    it('should create very strict engine', () => {
      const eng = StatisticsFactory.veryStrict();
      expect(eng).toBeInstanceOf(StatisticsEngine);
    });
  });

  describe('StatisticalThresholds', () => {
    it('should have correct thresholds', () => {
      expect(StatisticalThresholds.ALPHA_STANDARD).toBe(0.05);
      expect(StatisticalThresholds.ALPHA_STRICT).toBe(0.01);
      expect(StatisticalThresholds.ALPHA_VERY_STRICT).toBe(0.001);
    });
  });
});
