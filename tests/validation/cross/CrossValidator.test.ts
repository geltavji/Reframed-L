/**
 * CrossValidator Tests (M09.03)
 * PRD-09 Phase 9.3: Cross-Validation System
 */

import {
  CrossValidator,
  CrossValidatorFactory,
  ValidationThresholds,
  ValidationScore,
  CrossValidationResult,
  ConsistencyScore,
  RobustnessResult,
  BootstrapResult,
  ValidationSuite
} from '../../../src/validation/cross/CrossValidator';
import { StatisticsEngine } from '../../../src/validation/statistics/StatisticsEngine';

describe('CrossValidator', () => {
  let validator: CrossValidator;

  beforeEach(() => {
    validator = new CrossValidator();
  });

  describe('Validation Methods', () => {
    it('should register default methods', () => {
      const data = [1, 2, 3, 4, 5];
      const predictions = [1.1, 2.0, 3.1, 3.9, 5.0];
      const suite = validator.validateAll(data, predictions);

      expect(suite.results.length).toBeGreaterThan(0);
    });

    it('should register custom method', () => {
      validator.registerMethod({
        name: 'CustomMethod',
        description: 'Custom validation method',
        execute: (data, pred) => ({
          method: 'CustomMethod',
          score: 0.9,
          metrics: { custom: 0.9 },
          confidence: 0.95,
          interpretation: 'Good',
          hash: 'test'
        })
      });

      const data = [1, 2, 3, 4, 5];
      const predictions = [1.1, 2.0, 3.1, 3.9, 5.0];
      const suite = validator.validateAll(data, predictions);

      const customResult = suite.results.find(r => r.method === 'CustomMethod');
      expect(customResult).toBeDefined();
    });
  });

  describe('validateAll', () => {
    it('should validate predictions against actual data', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const predictions = [1.1, 2.0, 2.9, 4.1, 5.0, 5.9, 7.1, 8.0, 8.9, 10.1];
      const suite = validator.validateAll(data, predictions);

      expect(suite.results.length).toBeGreaterThan(0);
      expect(suite.consensus).toBeDefined();
      expect(suite.recommendation).toBeDefined();
      expect(suite.hash).toBeDefined();
    });

    it('should throw error for mismatched lengths', () => {
      expect(() => validator.validateAll([1, 2, 3], [1, 2])).toThrow();
    });

    it('should return high scores for perfect predictions', () => {
      const data = [1, 2, 3, 4, 5];
      const predictions = [1, 2, 3, 4, 5];
      const suite = validator.validateAll(data, predictions);

      const r2Score = suite.results.find(r => r.method === 'R2');
      expect(r2Score?.score).toBeCloseTo(1, 5);
    });

    it('should return low scores for poor predictions', () => {
      const data = [1, 2, 3, 4, 5];
      const predictions = [10, 20, 30, 40, 50];
      const suite = validator.validateAll(data, predictions);

      const r2Score = suite.results.find(r => r.method === 'R2');
      expect(r2Score?.score).toBeLessThan(0.5);
    });
  });

  describe('Cross-Validation', () => {
    const simpleModel = (train: number[]) => (test: number) => {
      const mean = train.reduce((a, b) => a + b, 0) / train.length;
      return mean; // Simple mean predictor
    };

    const linearModel = (train: number[]) => (test: number) => {
      return test; // Identity model (perfect for sorted data)
    };

    describe('kFoldCrossValidation', () => {
      it('should perform k-fold cross-validation', () => {
        const data = Array.from({ length: 100 }, (_, i) => i);
        const result = validator.kFoldCrossValidation(data, linearModel, 5);

        expect(result.method).toBe('k-fold');
        expect(result.folds).toBe(5);
        expect(result.scores.length).toBe(5);
        expect(result.hash).toBeDefined();
      });

      it('should calculate mean and std of scores', () => {
        const data = Array.from({ length: 50 }, (_, i) => i);
        const result = validator.kFoldCrossValidation(data, linearModel, 5);

        expect(result.mean).toBeDefined();
        expect(result.std).toBeDefined();
        expect(result.mean).toBeGreaterThanOrEqual(0);
        expect(result.mean).toBeLessThanOrEqual(1);
      });

      it('should identify best and worst folds', () => {
        const data = Array.from({ length: 50 }, (_, i) => i);
        const result = validator.kFoldCrossValidation(data, linearModel, 5);

        expect(result.bestFold).toBeDefined();
        expect(result.worstFold).toBeDefined();
        expect(result.scores[result.bestFold]).toBeGreaterThanOrEqual(
          result.scores[result.worstFold]
        );
      });

      it('should throw error for invalid k', () => {
        const data = [1, 2, 3, 4, 5];
        expect(() => validator.kFoldCrossValidation(data, simpleModel, 1)).toThrow();
        expect(() => validator.kFoldCrossValidation(data, simpleModel, 10)).toThrow();
      });
    });

    describe('leaveOneOutCV', () => {
      it('should perform leave-one-out cross-validation', () => {
        const data = [1, 2, 3, 4, 5];
        const result = validator.leaveOneOutCV(data, linearModel);

        expect(result.method).toBe('leave-one-out');
        expect(result.folds).toBe(5);
        expect(result.scores.length).toBe(5);
      });
    });

    describe('monteCarloCV', () => {
      it('should perform Monte Carlo cross-validation', () => {
        const data = Array.from({ length: 50 }, (_, i) => i);
        const result = validator.monteCarloCV(data, linearModel, 20, 0.2);

        expect(result.method).toBe('monte-carlo');
        expect(result.folds).toBe(20);
        expect(result.scores.length).toBe(20);
      });
    });

    describe('timeSeriesCV', () => {
      it('should perform time series cross-validation', () => {
        const data = Array.from({ length: 50 }, (_, i) => i);
        const result = validator.timeSeriesCV(data, linearModel, 10);

        expect(result.method).toBe('time-series');
        expect(result.folds).toBe(40);
      });

      it('should throw error for invalid minTrainSize', () => {
        const data = [1, 2, 3, 4, 5];
        expect(() => validator.timeSeriesCV(data, simpleModel, 10)).toThrow();
      });
    });
  });

  describe('Bootstrap Validation', () => {
    it('should perform bootstrap validation', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const predictions = [1.1, 2.0, 2.9, 4.1, 5.0, 5.9, 7.1, 8.0, 8.9, 10.1];
      const result = validator.bootstrapValidation(data, predictions, 100, 0.95);

      expect(result.iterations).toBe(100);
      expect(result.estimate).toBeDefined();
      expect(result.standardError).toBeDefined();
      expect(result.confidenceInterval.lower).toBeLessThan(result.confidenceInterval.upper);
      expect(result.hash).toBeDefined();
    });

    it('should calculate bias', () => {
      const data = [1, 2, 3, 4, 5];
      const predictions = [1, 2, 3, 4, 5];
      const result = validator.bootstrapValidation(data, predictions, 100);

      expect(typeof result.bias).toBe('number');
    });
  });

  describe('Robustness Testing', () => {
    const linearModel = (train: number[]) => (test: number) => test;

    it('should test robustness to perturbations', () => {
      const data = Array.from({ length: 20 }, (_, i) => i);
      const result = validator.testRobustness(data, linearModel, [0.01, 0.05, 0.1]);

      expect(result.originalScore).toBeDefined();
      expect(result.perturbedScores.length).toBe(3);
      expect(result.sensitivity).toBeDefined();
      expect(result.stable).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('should calculate degradation', () => {
      const data = Array.from({ length: 20 }, (_, i) => i);
      const result = validator.testRobustness(data, linearModel);

      expect(result.degradation).toBeDefined();
      expect(result.recoveryRate).toBeDefined();
    });
  });

  describe('Consistency Checking', () => {
    it('should check consistency between validation results', () => {
      const results: ValidationScore[] = [
        { method: 'A', score: 0.9, metrics: {}, confidence: 0.9, interpretation: 'Good', hash: '1' },
        { method: 'B', score: 0.85, metrics: {}, confidence: 0.85, interpretation: 'Good', hash: '2' },
        { method: 'C', score: 0.88, metrics: {}, confidence: 0.88, interpretation: 'Good', hash: '3' }
      ];

      const consistency = validator.checkConsistency(results);

      expect(consistency.overall).toBeCloseTo(0.877, 2);
      expect(consistency.agreement).toBeDefined();
      expect(consistency.recommendation).toBeDefined();
      expect(consistency.hash).toBeDefined();
    });

    it('should identify conflicts', () => {
      const results: ValidationScore[] = [
        { method: 'A', score: 0.95, metrics: {}, confidence: 0.95, interpretation: 'Excellent', hash: '1' },
        { method: 'B', score: 0.3, metrics: {}, confidence: 0.3, interpretation: 'Poor', hash: '2' }
      ];

      const consistency = validator.checkConsistency(results);

      expect(consistency.conflicts.length).toBeGreaterThan(0);
    });

    it('should throw error for empty results', () => {
      expect(() => validator.checkConsistency([])).toThrow();
    });
  });

  describe('Prediction Comparison', () => {
    it('should compare two sets of predictions', () => {
      const actual = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const pred1 = [1.1, 2.0, 2.9, 4.1, 5.0, 5.9, 7.1, 8.0, 8.9, 10.1];
      const pred2 = [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5];

      const comparison = validator.comparePredictions(actual, pred1, pred2);

      expect(comparison.better).toBeDefined();
      expect(['first', 'second', 'tie']).toContain(comparison.better);
      expect(comparison.margin).toBeGreaterThanOrEqual(0);
      expect(comparison.significance).toBeDefined();
    });
  });

  describe('Validation Suite', () => {
    it('should generate recommendation', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const goodPredictions = [1.1, 2.0, 2.9, 4.1, 5.0, 5.9, 7.1, 8.0, 8.9, 10.1];
      const suite = validator.validateAll(data, goodPredictions);

      expect(['accept', 'reject', 'inconclusive']).toContain(suite.recommendation);
    });
  });

  describe('CrossValidatorFactory', () => {
    it('should create default validator', () => {
      const v = CrossValidatorFactory.default();
      expect(v).toBeInstanceOf(CrossValidator);
    });

    it('should create validator with custom stats engine', () => {
      const stats = new StatisticsEngine();
      const v = CrossValidatorFactory.withStats(stats);
      expect(v).toBeInstanceOf(CrossValidator);
    });

    it('should create strict validator', () => {
      const v = CrossValidatorFactory.strict();
      expect(v).toBeInstanceOf(CrossValidator);
    });
  });

  describe('ValidationThresholds', () => {
    it('should have correct thresholds', () => {
      expect(ValidationThresholds.ACCEPTABLE_SCORE).toBe(0.7);
      expect(ValidationThresholds.GOOD_SCORE).toBe(0.8);
      expect(ValidationThresholds.EXCELLENT_SCORE).toBe(0.9);
    });
  });

  describe('Proof Chain', () => {
    it('should export proof chain', () => {
      const chain = validator.exportProofChain();
      expect(chain.methods).toBeDefined();
      expect(chain.thresholds).toBeDefined();
    });

    it('should generate hash', () => {
      const hash = validator.getHash();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });
});
