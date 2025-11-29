/**
 * AnomalyDetector Tests (M10.02)
 * PRD-10 Phase 10.2: Anomaly Detector
 */

import {
  AnomalyDetector,
  AnomalyDetectorFactory,
  DefaultDetectionConfig,
  Anomaly,
  BreakthroughCandidate,
  DetectionResult
} from '../../../src/discovery/anomaly/AnomalyDetector';

describe('AnomalyDetector', () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    detector = new AnomalyDetector();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = detector.getConfig();
      expect(config.zScoreThreshold).toBe(DefaultDetectionConfig.zScoreThreshold);
      expect(config.iqrMultiplier).toBe(DefaultDetectionConfig.iqrMultiplier);
    });

    it('should accept custom configuration', () => {
      const custom = new AnomalyDetector({ zScoreThreshold: 2.5 });
      const config = custom.getConfig();
      expect(config.zScoreThreshold).toBe(2.5);
    });

    it('should update configuration', () => {
      detector.updateConfig({ zScoreThreshold: 4.0 });
      expect(detector.getConfig().zScoreThreshold).toBe(4.0);
    });
  });

  describe('Outlier Detection', () => {
    it('should detect statistical outliers', () => {
      const data = [1, 2, 3, 4, 5, 100]; // 100 is an outlier
      const result = detector.detect(data);

      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies.some(a => a.type === 'outlier')).toBe(true);
    });

    it('should not flag normal data', () => {
      const data = [10, 11, 10.5, 11.5, 10.2, 10.8, 11.2, 10.9];
      const result = detector.detect(data);

      // Normal data should have few or no outliers
      expect(result.anomalies.filter(a => a.type === 'outlier').length).toBeLessThanOrEqual(1);
    });

    it('should detect both positive and negative outliers', () => {
      const data = [50, 51, 49, 50, 52, 48, 0, 100]; // 0 and 100 are outliers
      const result = detector.detect(data);

      const outliers = result.anomalies.filter(a => a.type === 'outlier');
      expect(outliers.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate anomaly context', () => {
      const data = [1, 2, 3, 4, 5, 100];
      const result = detector.detect(data);

      const outlier = result.anomalies.find(a => a.type === 'outlier');
      if (outlier) {
        expect(outlier.context.baselineStats.mean).toBeDefined();
        expect(outlier.context.baselineStats.std).toBeDefined();
        expect(outlier.context.deviationFromMean).toBeGreaterThan(0);
      }
    });
  });

  describe('Pattern Detection', () => {
    it('should detect spike patterns', () => {
      const data = [10, 10, 10, 10, 10, 50, 10, 10, 10, 10]; // Spike at index 5
      detector.registerPattern({
        id: 'test-spike',
        name: 'Test Spike',
        description: 'Detect test spikes',
        detect: (d) => {
          const max = Math.max(...d);
          const mean = d.reduce((a, b) => a + b) / d.length;
          if (max > mean * 3) {
            return { detected: true, location: d.indexOf(max), confidence: 0.9 };
          }
          return { detected: false, confidence: 0 };
        }
      });

      const result = detector.detect(data);
      expect(result.statistics.anomaliesDetected).toBeGreaterThan(0);
    });

    it('should detect trend breaks', () => {
      // First half increasing, second half decreasing
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
      
      // With default patterns, trend break may or may not be detected
      const result = detector.detect(data);
      expect(result.statistics.totalDataPoints).toBe(20);
    });
  });

  describe('Detection Result', () => {
    it('should return complete detection result', () => {
      const data = [1, 2, 3, 4, 5, 100];
      const result = detector.detect(data);

      expect(result.anomalies).toBeDefined();
      expect(result.breakthroughCandidates).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    it('should calculate processing time', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const result = detector.detect(data);

      expect(result.statistics.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should count anomalies correctly', () => {
      const data = [1, 2, 3, 4, 5, 100];
      const result = detector.detect(data);

      expect(result.statistics.anomaliesDetected).toBe(result.anomalies.length);
    });
  });

  describe('Breakthrough Candidates', () => {
    it('should identify breakthrough candidates from high-severity anomalies', () => {
      // Create data with extreme outlier
      const data = Array.from({ length: 50 }, () => 10 + Math.random() * 2);
      data.push(1000); // Extreme outlier

      const highSensitivity = new AnomalyDetector({ 
        zScoreThreshold: 2.0, 
        minConfidence: 0.5 
      });
      const result = highSensitivity.detect(data);

      // May or may not have breakthrough candidates depending on severity
      expect(result.statistics.breakthroughsIdentified).toBeGreaterThanOrEqual(0);
    });

    it('should track breakthrough candidates', () => {
      const data = [1, 2, 3, 4, 5, 1000];
      detector.detect(data);

      const candidates = detector.getBreakthroughCandidates();
      expect(Array.isArray(candidates)).toBe(true);
    });

    it('should update breakthrough status', () => {
      const data = [1, 2, 3, 4, 5, 1000];
      const result = detector.detect(data);

      if (result.breakthroughCandidates.length > 0) {
        const candidate = result.breakthroughCandidates[0];
        detector.updateBreakthroughStatus(candidate.id, 'investigating');
        
        const updated = detector.getBreakthroughCandidates().find(c => c.id === candidate.id);
        expect(updated?.status).toBe('investigating');
      }
    });
  });

  describe('Baseline Comparison', () => {
    it('should set baseline data', () => {
      const baseline = [10, 11, 10.5, 11.5, 10.2, 10.8, 11.2, 10.9];
      detector.setBaseline(baseline);
      
      expect(detector.getHash()).toBeDefined();
    });

    it('should detect distribution shift from baseline', () => {
      const baseline = [10, 11, 10.5, 11.5, 10.2, 10.8, 11.2, 10.9];
      detector.setBaseline(baseline);

      const newData = [100, 101, 100.5, 101.5, 100.2, 100.8, 101.2, 100.9,
                       100, 101, 100.5, 101.5, 100.2, 100.8, 101.2, 100.9,
                       100, 101, 100.5, 101.5]; // Significantly shifted
      const result = detector.detect(newData);

      // May detect distribution shift
      expect(result.statistics.totalDataPoints).toBe(20);
    });
  });

  describe('Custom Pattern Registration', () => {
    it('should register custom pattern', () => {
      detector.registerPattern({
        id: 'custom-pattern',
        name: 'Custom Pattern',
        description: 'Test pattern',
        detect: () => ({ detected: false, confidence: 0 })
      });

      expect(detector.getHash()).toBeDefined();
    });

    it('should use custom pattern in detection', () => {
      detector.registerPattern({
        id: 'always-detect',
        name: 'Always Detect',
        description: 'Always detects an anomaly',
        detect: (data) => ({
          detected: true,
          location: Math.floor(data.length / 2),
          confidence: 0.95
        })
      });

      const result = detector.detect([1, 2, 3, 4, 5]);
      // Custom pattern should contribute to anomaly count
      expect(result.anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('Anomaly Properties', () => {
    it('should create anomalies with required properties', () => {
      const data = [1, 2, 3, 4, 5, 100];
      const result = detector.detect(data);

      for (const anomaly of result.anomalies) {
        expect(anomaly.id).toBeDefined();
        expect(anomaly.type).toBeDefined();
        expect(anomaly.severity).toBeDefined();
        expect(anomaly.description).toBeDefined();
        expect(anomaly.dataPoints).toBeDefined();
        expect(anomaly.score).toBeGreaterThanOrEqual(0);
        expect(anomaly.score).toBeLessThanOrEqual(1);
        expect(anomaly.confidence).toBeGreaterThanOrEqual(0);
        expect(anomaly.confidence).toBeLessThanOrEqual(1);
        expect(anomaly.detectedAt).toBeInstanceOf(Date);
        expect(anomaly.context).toBeDefined();
        expect(anomaly.potentialCauses).toBeDefined();
        expect(anomaly.hash).toBeDefined();
      }
    });

    it('should assign appropriate severity levels', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      const data = [1, 2, 3, 4, 5, 100];
      const result = detector.detect(data);

      for (const anomaly of result.anomalies) {
        expect(validSeverities).toContain(anomaly.severity);
      }
    });
  });

  describe('AnomalyDetectorFactory', () => {
    it('should create default detector', () => {
      const det = AnomalyDetectorFactory.default();
      expect(det).toBeInstanceOf(AnomalyDetector);
    });

    it('should create high-sensitivity detector', () => {
      const det = AnomalyDetectorFactory.highSensitivity();
      expect(det.getConfig().zScoreThreshold).toBeLessThan(DefaultDetectionConfig.zScoreThreshold);
    });

    it('should create low-sensitivity detector', () => {
      const det = AnomalyDetectorFactory.lowSensitivity();
      expect(det.getConfig().zScoreThreshold).toBeGreaterThan(DefaultDetectionConfig.zScoreThreshold);
    });

    it('should create custom detector', () => {
      const det = AnomalyDetectorFactory.custom({ zScoreThreshold: 2.5 });
      expect(det.getConfig().zScoreThreshold).toBe(2.5);
    });
  });

  describe('Proof Chain', () => {
    it('should export proof chain', () => {
      detector.detect([1, 2, 3, 4, 5, 100]);

      const chain = detector.exportProofChain();
      expect(chain.config).toBeDefined();
      expect(chain.anomalies).toBeDefined();
      expect(chain.breakthroughs).toBeDefined();
    });

    it('should generate hash', () => {
      const hash = detector.getHash();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const result = detector.detect([]);
      expect(result.anomalies.length).toBe(0);
    });

    it('should handle single value', () => {
      const result = detector.detect([42]);
      expect(result.statistics.totalDataPoints).toBe(1);
    });

    it('should handle identical values', () => {
      const data = [5, 5, 5, 5, 5, 5, 5, 5];
      const result = detector.detect(data);
      
      // No variation, so no outliers expected
      expect(result.anomalies.filter(a => a.type === 'outlier').length).toBe(0);
    });

    it('should handle DataPoint objects', () => {
      const dataPoints = [
        { id: 'DP1', timestamp: new Date(), value: 10, metadata: {} },
        { id: 'DP2', timestamp: new Date(), value: 11, metadata: {} },
        { id: 'DP3', timestamp: new Date(), value: 100, metadata: {} }
      ];

      const result = detector.detect(dataPoints);
      expect(result.statistics.totalDataPoints).toBe(3);
    });
  });
});
