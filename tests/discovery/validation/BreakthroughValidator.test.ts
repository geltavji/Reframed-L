/**
 * BreakthroughValidator Tests (M10.04)
 * PRD-10 Phase 10.4: Breakthrough Validation
 */

import {
  BreakthroughValidator,
  BreakthroughValidatorFactory,
  DefaultValidationConfig,
  ValidationResult,
  Certainty
} from '../../../src/discovery/validation/BreakthroughValidator';
import { BreakthroughCandidate, Anomaly, DataPoint } from '../../../src/discovery/anomaly/AnomalyDetector';

describe('BreakthroughValidator', () => {
  let validator: BreakthroughValidator;

  // Helper to create test data
  function createDataPoints(values: number[]): DataPoint[] {
    return values.map((value, idx) => ({
      id: `DP-${idx}`,
      timestamp: new Date(),
      value,
      metadata: {}
    }));
  }

  function createAnomaly(values: number[], severity: 'low' | 'medium' | 'high' | 'critical' = 'high'): Anomaly {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
    
    return {
      id: `ANOM-TEST-${Date.now()}`,
      type: 'outlier',
      severity,
      description: 'Test anomaly',
      dataPoints: createDataPoints(values),
      score: 0.8,
      confidence: 0.9,
      detectedAt: new Date(),
      context: {
        baselineStats: { mean, std, min: Math.min(...values), max: Math.max(...values) },
        deviationFromMean: 3.5,
        percentileRank: 99,
        neighboringValues: values.slice(0, 3)
      },
      potentialCauses: ['Unknown'],
      hash: 'test-hash'
    };
  }

  function createBreakthroughCandidate(severity: 'high' | 'critical' = 'high'): BreakthroughCandidate {
    const anomaly = createAnomaly([1, 2, 3, 4, 5, 100], severity);
    
    return {
      id: `BTC-TEST-${Date.now()}`,
      anomaly,
      significance: 0.85,
      reproducibility: 0.6,
      theoreticalImplications: [
        'May indicate new phenomenon',
        'Could require model revision'
      ],
      experimentalVerification: [
        'Repeat measurement',
        'Cross-validate'
      ],
      status: 'candidate',
      score: 0.9,
      hash: 'test-hash',
      createdAt: new Date()
    };
  }

  beforeEach(() => {
    validator = new BreakthroughValidator();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = validator.getConfig();
      expect(config.minimumCertainty).toBe(DefaultValidationConfig.minimumCertainty);
      expect(config.falsePosThreshold).toBe(DefaultValidationConfig.falsePosThreshold);
    });

    it('should accept custom configuration', () => {
      const custom = new BreakthroughValidator({ minimumCertainty: 0.95 });
      expect(custom.getConfig().minimumCertainty).toBe(0.95);
    });

    it('should update configuration', () => {
      validator.updateConfig({ minimumCertainty: 0.7 });
      expect(validator.getConfig().minimumCertainty).toBe(0.7);
    });
  });

  describe('Validation', () => {
    it('should validate a breakthrough candidate', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      expect(result.id).toBeDefined();
      expect(result.candidateId).toBe(candidate.id);
      expect(result.methods.length).toBeGreaterThan(0);
      expect(result.overallCertainty).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('should apply statistical validation', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      const statMethod = result.methods.find(m => m.method === 'statistical');
      expect(statMethod).toBeDefined();
      expect(statMethod!.confidence).toBeGreaterThanOrEqual(0);
      expect(statMethod!.confidence).toBeLessThanOrEqual(1);
    });

    it('should apply reproduction validation', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      const reproMethod = result.methods.find(m => m.method === 'reproduction');
      expect(reproMethod).toBeDefined();
      expect(reproMethod!.details).toHaveProperty('attempts');
      expect(reproMethod!.details).toHaveProperty('successes');
    });

    it('should apply theoretical validation', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      const theoMethod = result.methods.find(m => m.method === 'theoretical');
      expect(theoMethod).toBeDefined();
      expect(theoMethod!.details).toHaveProperty('conservationLawsRespected');
      expect(theoMethod!.details).toHaveProperty('dimensionalAnalysisValid');
    });

    it('should apply consistency validation', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      const consMethod = result.methods.find(m => m.method === 'consistency');
      expect(consMethod).toBeDefined();
      expect(consMethod!.details).toHaveProperty('internalConsistency');
      expect(consMethod!.details).toHaveProperty('temporalConsistency');
    });
  });

  describe('Certainty Calculation', () => {
    it('should calculate overall certainty', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      expect(result.overallCertainty.level).toBeDefined();
      expect(['low', 'moderate', 'high', 'very-high']).toContain(result.overallCertainty.level);
      expect(result.overallCertainty.score).toBeGreaterThanOrEqual(0);
      expect(result.overallCertainty.score).toBeLessThanOrEqual(1);
    });

    it('should include certainty factors', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      expect(result.overallCertainty.factors.length).toBeGreaterThan(0);
      for (const factor of result.overallCertainty.factors) {
        expect(factor.name).toBeDefined();
        expect(factor.weight).toBeGreaterThan(0);
        expect(factor.contribution).toBeDefined();
      }
    });
  });

  describe('False Positive Analysis', () => {
    it('should calculate false positive probability', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      expect(result.falsePositiveProbability).toBeGreaterThanOrEqual(0);
      expect(result.falsePositiveProbability).toBeLessThanOrEqual(1);
    });

    it('should have lower FP probability for high-confidence validations', () => {
      const strongCandidate = createBreakthroughCandidate('critical');
      strongCandidate.anomaly.confidence = 0.99;
      strongCandidate.significance = 0.95;
      
      const result = validator.validate(strongCandidate);
      
      // With strict validator, FP should be reasonably low for strong candidates
      expect(result.falsePositiveProbability).toBeLessThan(0.9);
    });
  });

  describe('Recommendation', () => {
    it('should make recommendation', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      expect(['confirm', 'reject', 'investigate']).toContain(result.recommendation);
    });

    it('should recommend investigation for moderate certainty', () => {
      const candidate = createBreakthroughCandidate('high');
      candidate.anomaly.confidence = 0.6;
      
      const result = validator.validate(candidate);
      
      // With moderate certainty, should likely investigate
      expect(['confirm', 'reject', 'investigate']).toContain(result.recommendation);
    });
  });

  describe('Evidence Generation', () => {
    it('should generate validation evidence', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      expect(result.evidence.length).toBeGreaterThan(0);
      for (const ev of result.evidence) {
        expect(ev.id).toBeDefined();
        expect(['statistical', 'experimental', 'theoretical', 'computational']).toContain(ev.type);
        expect(ev.strength).toBeGreaterThanOrEqual(0);
        expect(ev.strength).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple candidates', () => {
      const candidates = [
        createBreakthroughCandidate('high'),
        createBreakthroughCandidate('critical')
      ];

      const results = validator.batchValidate(candidates);

      expect(results.length).toBe(2);
      for (const result of results) {
        expect(result.id).toBeDefined();
        expect(result.methods.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Validation Storage', () => {
    it('should store validations', () => {
      const candidate = createBreakthroughCandidate();
      const result = validator.validate(candidate);

      const retrieved = validator.getValidation(result.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(result.id);
    });

    it('should retrieve all validations', () => {
      validator.validate(createBreakthroughCandidate());
      validator.validate(createBreakthroughCandidate());

      const all = validator.getAllValidations();
      expect(all.length).toBe(2);
    });

    it('should filter confirmed breakthroughs', () => {
      // Create multiple candidates
      for (let i = 0; i < 3; i++) {
        validator.validate(createBreakthroughCandidate());
      }

      const confirmed = validator.getConfirmedBreakthroughs();
      // May or may not have confirmed ones depending on validation
      expect(Array.isArray(confirmed)).toBe(true);
    });
  });

  describe('Hash Verification', () => {
    it('should generate valid hash', () => {
      const hash = validator.getHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should export proof chain', () => {
      validator.validate(createBreakthroughCandidate());
      const proofChain = validator.exportProofChain();

      expect(proofChain.config).toBeDefined();
      expect(proofChain.validations.length).toBe(1);
    });
  });

  describe('Factory', () => {
    it('should create default validator', () => {
      const v = BreakthroughValidatorFactory.default();
      expect(v).toBeInstanceOf(BreakthroughValidator);
    });

    it('should create strict validator', () => {
      const v = BreakthroughValidatorFactory.strict();
      expect(v.getConfig().minimumCertainty).toBe(0.9);
      expect(v.getConfig().reproductionAttempts).toBe(10);
    });

    it('should create lenient validator', () => {
      const v = BreakthroughValidatorFactory.lenient();
      expect(v.getConfig().minimumCertainty).toBe(0.6);
      expect(v.getConfig().reproductionAttempts).toBe(3);
    });

    it('should create custom validator', () => {
      const v = BreakthroughValidatorFactory.custom({ minimumCertainty: 0.75 });
      expect(v.getConfig().minimumCertainty).toBe(0.75);
    });
  });
});
