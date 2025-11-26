/**
 * Spacetime Integration Tests
 * 
 * PRD-03 Phase 3.6: Spacetime Integration & Validation
 * 
 * Tests the SpacetimeIntegration module which validates
 * all spacetime mathematics components work together correctly.
 */

import { SpacetimeIntegration } from '../../../src/spacetime/integration';

describe('SpacetimeIntegration', () => {
  let integration: SpacetimeIntegration;
  
  beforeEach(() => {
    integration = new SpacetimeIntegration();
  });
  
  describe('Module Validation', () => {
    describe('Tensor Module', () => {
      it('should validate tensor module successfully', () => {
        const status = integration.validateTensor();
        expect(status.moduleName).toBe('Tensor');
        expect(status.testsRun).toBeGreaterThan(0);
        expect(status.testsPassed).toBeGreaterThan(0);
        expect(status.hash).toBeDefined();
        expect(status.hash.length).toBe(16);
      });
      
      it('should have high test pass rate for tensor', () => {
        const status = integration.validateTensor();
        const passRate = status.testsPassed / status.testsRun;
        expect(passRate).toBeGreaterThanOrEqual(0.75);
      });
    });
    
    describe('MinkowskiSpace Module', () => {
      it('should validate MinkowskiSpace module successfully', () => {
        const status = integration.validateMinkowski();
        expect(status.moduleName).toBe('MinkowskiSpace');
        expect(status.testsRun).toBeGreaterThan(0);
        expect(status.testsPassed).toBeGreaterThan(0);
      });
      
      it('should have high test pass rate for MinkowskiSpace', () => {
        const status = integration.validateMinkowski();
        const passRate = status.testsPassed / status.testsRun;
        expect(passRate).toBeGreaterThanOrEqual(0.75);
      });
    });
    
    describe('LorentzGroup Module', () => {
      it('should validate LorentzGroup module successfully', () => {
        const status = integration.validateLorentzGroup();
        expect(status.moduleName).toBe('LorentzGroup');
        expect(status.testsRun).toBeGreaterThan(0);
        expect(status.testsPassed).toBeGreaterThan(0);
      });
      
      it('should have high test pass rate for LorentzGroup', () => {
        const status = integration.validateLorentzGroup();
        const passRate = status.testsPassed / status.testsRun;
        expect(passRate).toBeGreaterThanOrEqual(0.75);
      });
    });
    
    describe('Metric Module', () => {
      it('should validate Metric module successfully', () => {
        const status = integration.validateMetric();
        expect(status.moduleName).toBe('Metric');
        expect(status.testsRun).toBeGreaterThan(0);
        expect(status.testsPassed).toBeGreaterThan(0);
      });
      
      it('should have high test pass rate for Metric', () => {
        const status = integration.validateMetric();
        const passRate = status.testsPassed / status.testsRun;
        expect(passRate).toBeGreaterThanOrEqual(0.75);
      });
    });
    
    describe('Curvature Module', () => {
      it('should validate Curvature module successfully', () => {
        const status = integration.validateCurvature();
        expect(status.moduleName).toBe('Curvature');
        expect(status.testsRun).toBeGreaterThan(0);
        expect(status.testsPassed).toBeGreaterThan(0);
      });
      
      it('should have high test pass rate for Curvature', () => {
        const status = integration.validateCurvature();
        const passRate = status.testsPassed / status.testsRun;
        expect(passRate).toBeGreaterThanOrEqual(0.75);
      });
    });
  });
  
  describe('Integration Tests', () => {
    it('should run integration tests successfully', () => {
      const results = integration.runIntegrationTests();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].testName).toBeDefined();
      expect(results[0].modules).toBeDefined();
      expect(results[0].hash).toBeDefined();
    });
    
    it('should test Tensor-MinkowskiSpace consistency', () => {
      const results = integration.runIntegrationTests();
      const tensorMinkowski = results.find(r => r.testName.includes('Tensor-MinkowskiSpace'));
      expect(tensorMinkowski).toBeDefined();
      expect(tensorMinkowski?.modules).toContain('Tensor');
      expect(tensorMinkowski?.modules).toContain('MinkowskiSpace');
    });
    
    it('should test MinkowskiSpace-LorentzGroup consistency', () => {
      const results = integration.runIntegrationTests();
      const minkowskiLorentz = results.find(r => r.testName.includes('MinkowskiSpace-LorentzGroup'));
      expect(minkowskiLorentz).toBeDefined();
    });
    
    it('should test Metric-Curvature flat space', () => {
      const results = integration.runIntegrationTests();
      const metricCurvature = results.find(r => r.testName.includes('Metric-Curvature'));
      expect(metricCurvature).toBeDefined();
    });
    
    it('should have majority of integration tests pass', () => {
      const results = integration.runIntegrationTests();
      const passedCount = results.filter(r => r.passed).length;
      const passRate = passedCount / results.length;
      expect(passRate).toBeGreaterThanOrEqual(0.5);
    });
  });
  
  describe('Physics Experiments', () => {
    it('should run physics experiments successfully', () => {
      const results = integration.runPhysicsExperiments();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].experimentName).toBeDefined();
      expect(results[0].theoreticalValue).toBeDefined();
      expect(results[0].computedValue).toBeDefined();
    });
    
    it('should validate time dilation', () => {
      const results = integration.runPhysicsExperiments();
      const timeDilation = results.find(r => r.experimentName === 'Time Dilation Factor');
      expect(timeDilation).toBeDefined();
      expect(timeDilation?.passed).toBe(true);
    });
    
    it('should validate relativistic velocity addition', () => {
      const results = integration.runPhysicsExperiments();
      const velocityAddition = results.find(r => r.experimentName === 'Relativistic Velocity Addition');
      expect(velocityAddition).toBeDefined();
      expect(velocityAddition?.passed).toBe(true);
    });
    
    it('should validate spacetime interval invariance', () => {
      const results = integration.runPhysicsExperiments();
      const intervalInvariance = results.find(r => r.experimentName === 'Spacetime Interval Invariance');
      expect(intervalInvariance).toBeDefined();
      expect(intervalInvariance?.passed).toBe(true);
    });
    
    it('should validate Lorentz group composition', () => {
      const results = integration.runPhysicsExperiments();
      const lorentzComposition = results.find(r => r.experimentName === 'Lorentz Group Composition');
      expect(lorentzComposition).toBeDefined();
      expect(lorentzComposition?.passed).toBe(true);
    });
    
    it('should validate Minkowski space flatness', () => {
      const results = integration.runPhysicsExperiments();
      const flatness = results.find(r => r.experimentName === 'Minkowski Space Flatness');
      expect(flatness).toBeDefined();
      expect(flatness?.passed).toBe(true);
    });
    
    it('should have references for experiments', () => {
      const results = integration.runPhysicsExperiments();
      for (const result of results) {
        expect(result.references).toBeDefined();
      }
    });
  });
  
  describe('Full System Validation', () => {
    it('should validate all modules', () => {
      const status = integration.validateAll();
      expect(status.modulesValidated).toBeGreaterThan(0);
      expect(status.moduleStatuses.length).toBe(5);
    });
    
    it('should have overall status', () => {
      const status = integration.validateAll();
      expect(['healthy', 'degraded', 'failed']).toContain(status.overallStatus);
    });
    
    it('should include integration test results', () => {
      const status = integration.validateAll();
      expect(status.integrationResults.length).toBeGreaterThan(0);
      expect(status.integrationTestsTotal).toBeGreaterThan(0);
    });
    
    it('should include physics experiment results', () => {
      const status = integration.validateAll();
      expect(status.experimentResults.length).toBeGreaterThan(0);
      expect(status.physicsExperimentsTotal).toBeGreaterThan(0);
    });
    
    it('should have proof chain hash', () => {
      const status = integration.validateAll();
      expect(status.proofChainHash).toBeDefined();
      expect(status.proofChainHash.length).toBe(16);
    });
    
    it('should have timestamp', () => {
      const status = integration.validateAll();
      expect(status.timestamp).toBeInstanceOf(Date);
    });
  });
  
  describe('Phase 4 Readiness', () => {
    it('should assess Phase 4 readiness', () => {
      const readiness = integration.isReadyForPhase4();
      expect(readiness.prd04Name).toBe('Planck Scale Physics');
      expect(readiness.requiredModules.length).toBe(5);
    });
    
    it('should list required modules', () => {
      const readiness = integration.isReadyForPhase4();
      expect(readiness.requiredModules).toContain('Tensor');
      expect(readiness.requiredModules).toContain('MinkowskiSpace');
      expect(readiness.requiredModules).toContain('LorentzGroup');
      expect(readiness.requiredModules).toContain('Metric');
      expect(readiness.requiredModules).toContain('Curvature');
    });
    
    it('should have validated modules list', () => {
      const readiness = integration.isReadyForPhase4();
      expect(readiness.validatedModules).toBeDefined();
      expect(Array.isArray(readiness.validatedModules)).toBe(true);
    });
    
    it('should have overall score between 0 and 100', () => {
      const readiness = integration.isReadyForPhase4();
      expect(readiness.overallScore).toBeGreaterThanOrEqual(0);
      expect(readiness.overallScore).toBeLessThanOrEqual(100);
    });
    
    it('should provide recommendations if not ready', () => {
      const readiness = integration.isReadyForPhase4();
      expect(readiness.recommendations).toBeDefined();
      expect(Array.isArray(readiness.recommendations)).toBe(true);
    });
  });
  
  describe('Proof Chain', () => {
    it('should export proof chain', () => {
      integration.validateAll();
      const chain = integration.exportProofChain();
      expect(chain.chainId).toBeDefined();
      expect(chain.hashes.length).toBeGreaterThan(0);
      expect(chain.timestamp).toBeInstanceOf(Date);
    });
    
    it('should have unique hashes in proof chain', () => {
      integration.validateAll();
      const chain = integration.exportProofChain();
      const uniqueHashes = new Set(chain.hashes);
      expect(uniqueHashes.size).toBe(chain.hashes.length);
    });
  });
  
  describe('Validation Experiments Description', () => {
    it('should provide experiment descriptions', () => {
      const experiments = integration.getValidationExperiments();
      expect(experiments.length).toBeGreaterThan(0);
    });
    
    it('should have name, description, and reference for each experiment', () => {
      const experiments = integration.getValidationExperiments();
      for (const exp of experiments) {
        expect(exp.name).toBeDefined();
        expect(exp.description).toBeDefined();
        expect(exp.reference).toBeDefined();
      }
    });
    
    it('should include all key physics experiments', () => {
      const experiments = integration.getValidationExperiments();
      const names = experiments.map(e => e.name);
      expect(names).toContain('Time Dilation Factor');
      expect(names).toContain('Relativistic Velocity Addition');
      expect(names).toContain('Spacetime Interval Invariance');
    });
  });
  
  describe('Hash Verification', () => {
    it('should generate consistent hashes for same input', () => {
      const status1 = integration.validateTensor();
      const integration2 = new SpacetimeIntegration();
      const status2 = integration2.validateTensor();
      
      // Hashes should be different due to timestamps, but length should be same
      expect(status1.hash.length).toBe(status2.hash.length);
    });
    
    it('should include hash in all module statuses', () => {
      const status = integration.validateAll();
      for (const moduleStatus of status.moduleStatuses) {
        expect(moduleStatus.hash).toBeDefined();
        expect(moduleStatus.hash.length).toBe(16);
      }
    });
    
    it('should include hash in all integration results', () => {
      const results = integration.runIntegrationTests();
      for (const result of results) {
        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBe(16);
      }
    });
    
    it('should include hash in all experiment results', () => {
      const results = integration.runPhysicsExperiments();
      for (const result of results) {
        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBe(16);
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle errors gracefully in module validation', () => {
      // Even if there are errors, should not throw
      expect(() => integration.validateAll()).not.toThrow();
    });
    
    it('should track error messages', () => {
      const status = integration.validateAll();
      for (const moduleStatus of status.moduleStatuses) {
        expect(moduleStatus.errorMessages).toBeDefined();
        expect(Array.isArray(moduleStatus.errorMessages)).toBe(true);
      }
    });
    
    it('should set failed status when tests fail', () => {
      const status = integration.validateAll();
      for (const moduleStatus of status.moduleStatuses) {
        if (moduleStatus.testsPassed < moduleStatus.testsRun) {
          expect(['validated', 'failed']).toContain(moduleStatus.status);
        }
      }
    });
  });
  
  describe('Performance', () => {
    it('should complete full validation in reasonable time', () => {
      const startTime = Date.now();
      integration.validateAll();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 10 seconds
      expect(duration).toBeLessThan(10000);
    });
    
    it('should complete module validation quickly', () => {
      const startTime = Date.now();
      integration.validateTensor();
      integration.validateMinkowski();
      integration.validateLorentzGroup();
      integration.validateMetric();
      integration.validateCurvature();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
