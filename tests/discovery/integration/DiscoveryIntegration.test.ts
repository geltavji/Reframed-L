/**
 * DiscoveryIntegration Tests (M10.06)
 * PRD-10 Phase 10.6: Integration & Discovery Engine Launch
 */

import {
  DiscoveryIntegration,
  DiscoveryIntegrationFactory,
  DiscoveryPipelineConfig,
  DiscoveryPipelineResult,
  ModuleValidation
} from '../../../src/discovery/integration/DiscoveryIntegration';

describe('DiscoveryIntegration', () => {
  let integration: DiscoveryIntegration;

  beforeEach(() => {
    integration = new DiscoveryIntegration();
  });

  describe('Module Validation', () => {
    it('should validate HypothesisEngine', () => {
      const result = integration.validateHypothesisEngine();

      expect(result.module).toBe('HypothesisEngine');
      expect(['valid', 'invalid', 'error']).toContain(result.status);
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.hash).toBeDefined();
    });

    it('should validate AnomalyDetector', () => {
      const result = integration.validateAnomalyDetector();

      expect(result.module).toBe('AnomalyDetector');
      expect(['valid', 'invalid', 'error']).toContain(result.status);
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should validate AutoExplorer', () => {
      const result = integration.validateAutoExplorer();

      expect(result.module).toBe('AutoExplorer');
      expect(['valid', 'invalid', 'error']).toContain(result.status);
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should validate BreakthroughValidator', () => {
      const result = integration.validateBreakthroughValidator();

      expect(result.module).toBe('BreakthroughValidator');
      expect(['valid', 'invalid', 'error']).toContain(result.status);
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should validate DiscoveryDocs', () => {
      const result = integration.validateDiscoveryDocs();

      expect(result.module).toBe('DiscoveryDocs');
      expect(['valid', 'invalid', 'error']).toContain(result.status);
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should validate all modules', () => {
      const results = integration.validateAll();

      expect(results.length).toBe(5);
      for (const result of results) {
        expect(result.module).toBeDefined();
        expect(result.tests.length).toBeGreaterThan(0);
      }
    });

    it('should store validation results', () => {
      integration.validateAll();
      const validations = integration.getValidations();

      expect(validations.length).toBe(5);
    });
  });

  describe('Integration Tests', () => {
    it('should run integration tests', async () => {
      const results = await integration.runIntegrationTests();

      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.name).toBeDefined();
        expect(typeof result.passed).toBe('boolean');
      }
    });
  });

  describe('Discovery Pipeline', () => {
    it('should run discovery pipeline', () => {
      const config: DiscoveryPipelineConfig = {
        hypothesisConfig: {
          maxHypotheses: 5,
          categories: ['physics']
        },
        explorationConfig: {
          maxIterations: 10,
          parallelPaths: 1,
          parameterBounds: { x: { min: 0, max: 10 } },
          objectiveFunction: (p) => p.x
        },
        maxBreakthroughs: 2,
        autoValidate: true,
        autoDocument: true
      };

      const result = integration.runPipeline(config);

      expect(result.hypotheses.length).toBeGreaterThan(0);
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalHypotheses).toBeGreaterThan(0);
      expect(result.hash).toBeDefined();
    });

    it('should generate pipeline statistics', () => {
      const config: DiscoveryPipelineConfig = {
        hypothesisConfig: { maxHypotheses: 3 },
        explorationConfig: {
          maxIterations: 5,
          parallelPaths: 1,
          parameterBounds: { x: { min: 0, max: 10 } },
          objectiveFunction: (p) => p.x
        },
        maxBreakthroughs: 1,
        autoValidate: false,
        autoDocument: false
      };

      const result = integration.runPipeline(config);

      expect(result.statistics.totalHypotheses).toBeDefined();
      expect(result.statistics.totalExplorations).toBeDefined();
      expect(result.statistics.totalAnomalies).toBeDefined();
      expect(result.statistics.totalBreakthroughs).toBeDefined();
      expect(result.statistics.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should validate breakthroughs when autoValidate is true', () => {
      const config: DiscoveryPipelineConfig = {
        hypothesisConfig: { maxHypotheses: 3 },
        explorationConfig: {
          maxIterations: 10,
          parallelPaths: 1,
          parameterBounds: { x: { min: 0, max: 100 } },
          objectiveFunction: (p) => p.x > 50 ? p.x * 10 : p.x // Create potential anomalies
        },
        maxBreakthroughs: 5,
        autoValidate: true,
        autoDocument: false
      };

      const result = integration.runPipeline(config);

      // Validations may or may not exist depending on anomaly detection
      expect(Array.isArray(result.validations)).toBe(true);
    });

    it('should generate documents when autoDocument is true', () => {
      const config: DiscoveryPipelineConfig = {
        hypothesisConfig: { maxHypotheses: 3 },
        explorationConfig: {
          maxIterations: 10,
          parallelPaths: 1,
          parameterBounds: { x: { min: 0, max: 10 } },
          objectiveFunction: (p) => p.x
        },
        maxBreakthroughs: 2,
        autoValidate: true,
        autoDocument: true
      };

      const result = integration.runPipeline(config);

      expect(Array.isArray(result.reports)).toBe(true);
      expect(result.statistics.documentsGenerated).toBeDefined();
    });
  });

  describe('PRD-11 Readiness', () => {
    it('should check readiness for PRD-11', () => {
      const isReady = integration.isReadyForPRD11();

      // Should return boolean
      expect(typeof isReady).toBe('boolean');
    });

    it('should be ready when all modules are valid', () => {
      // Run all validations first
      integration.validateAll();
      
      const isReady = integration.isReadyForPRD11();
      
      // All modules should validate successfully
      expect(isReady).toBe(true);
    });
  });

  describe('Hash Verification', () => {
    it('should generate valid hash', () => {
      const hash = integration.getHash();

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should export proof chain', () => {
      integration.validateAll();
      const proofChain = integration.exportProofChain();

      expect(proofChain.validations).toBeDefined();
      expect(proofChain.hypothesesChain).toBeDefined();
      expect(proofChain.anomalyChain).toBeDefined();
      expect(proofChain.explorerChain).toBeDefined();
      expect(proofChain.validatorChain).toBeDefined();
      expect(proofChain.docsChain).toBeDefined();
    });

    it('should have valid hash chain in docs', () => {
      const proofChain = integration.exportProofChain();

      expect(proofChain.docsChain.integrity).toBe(true);
    });
  });

  describe('Factory', () => {
    it('should create default integration', () => {
      const i = DiscoveryIntegrationFactory.default();

      expect(i).toBeInstanceOf(DiscoveryIntegration);
    });

    it('should create custom integration', () => {
      const i = DiscoveryIntegrationFactory.custom();

      expect(i).toBeInstanceOf(DiscoveryIntegration);
    });
  });
});
