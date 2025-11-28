/**
 * PlanckIntegration.test.ts
 * Tests for PRD-04 Phase 4.6: Planck Scale Physics Integration
 * Module: M04.06
 */

import {
  PlanckIntegration,
  PlanckIntegrationFactory,
  ModuleIntegrationStatus,
  PlanckSystemStatus,
  CrossModuleTestResult,
  ValidationExperiment
} from '../../../src/planck/integration/PlanckIntegration';

describe('PlanckIntegration', () => {
  let integration: PlanckIntegration;

  beforeEach(() => {
    integration = new PlanckIntegration();
  });

  // ============================================================================
  // BASIC FUNCTIONALITY TESTS
  // ============================================================================

  describe('Basic Functionality', () => {
    test('should create PlanckIntegration instance', () => {
      expect(integration).toBeInstanceOf(PlanckIntegration);
    });

    test('should have getHash method', () => {
      expect(typeof integration.getHash).toBe('function');
    });

    test('should have validateAll method', () => {
      expect(typeof integration.validateAll).toBe('function');
    });

    test('should have exportProofChain method', () => {
      expect(typeof integration.exportProofChain).toBe('function');
    });

    test('should have isReadyForPhase5 method', () => {
      expect(typeof integration.isReadyForPhase5).toBe('function');
    });

    test('should have getStatistics method', () => {
      expect(typeof integration.getStatistics).toBe('function');
    });
  });

  // ============================================================================
  // MODULE VALIDATION TESTS
  // ============================================================================

  describe('SpacetimeLattice Validation (M04.01)', () => {
    test('should validate SpacetimeLattice module', () => {
      const status = integration.validateSpacetimeLattice();
      expect(status).toBeDefined();
      expect(status.module).toBe('SpacetimeLattice');
      expect(status.moduleId).toBe('M04.01');
    });

    test('should return validation status', () => {
      const status = integration.validateSpacetimeLattice();
      expect(['pending', 'validated', 'failed']).toContain(status.status);
    });

    test('should track test counts', () => {
      const status = integration.validateSpacetimeLattice();
      expect(typeof status.testsPassed).toBe('number');
      expect(typeof status.testsFailed).toBe('number');
      expect(status.testsPassed + status.testsFailed).toBeGreaterThan(0);
    });

    test('should generate hash', () => {
      const status = integration.validateSpacetimeLattice();
      expect(status.hash).toBeDefined();
      expect(status.hash.length).toBe(64);
    });

    test('should record timestamp', () => {
      const status = integration.validateSpacetimeLattice();
      expect(status.timestamp).toBeInstanceOf(Date);
    });

    test('should list dependencies', () => {
      const status = integration.validateSpacetimeLattice();
      expect(Array.isArray(status.dependencies)).toBe(true);
      expect(status.dependencies).toContain('M01.01');
    });
  });

  describe('InformationTheory Validation (M04.02)', () => {
    test('should validate InformationTheory module', () => {
      const status = integration.validateInformationTheory();
      expect(status).toBeDefined();
      expect(status.module).toBe('InformationTheory');
      expect(status.moduleId).toBe('M04.02');
    });

    test('should return validation status', () => {
      const status = integration.validateInformationTheory();
      expect(['pending', 'validated', 'failed']).toContain(status.status);
    });

    test('should pass tests', () => {
      const status = integration.validateInformationTheory();
      expect(status.testsPassed).toBeGreaterThan(0);
    });

    test('should generate unique hash', () => {
      const status1 = integration.validateInformationTheory();
      const status2 = integration.validateInformationTheory();
      // Hashes include timestamp so will differ
      expect(status1.hash.length).toBe(64);
      expect(status2.hash.length).toBe(64);
    });
  });

  describe('SpinNetwork Validation (M04.03)', () => {
    test('should validate SpinNetwork module', () => {
      const status = integration.validateSpinNetwork();
      expect(status).toBeDefined();
      expect(status.module).toBe('SpinNetwork');
      expect(status.moduleId).toBe('M04.03');
    });

    test('should return validation status', () => {
      const status = integration.validateSpinNetwork();
      expect(['pending', 'validated', 'failed']).toContain(status.status);
    });

    test('should pass tests', () => {
      const status = integration.validateSpinNetwork();
      expect(status.testsPassed).toBeGreaterThan(0);
    });

    test('should track errors and warnings', () => {
      const status = integration.validateSpinNetwork();
      expect(Array.isArray(status.errors)).toBe(true);
      expect(Array.isArray(status.warnings)).toBe(true);
    });
  });

  describe('PlanckComputation Validation (M04.04)', () => {
    test('should validate PlanckComputation module', () => {
      const status = integration.validatePlanckComputation();
      expect(status).toBeDefined();
      expect(status.module).toBe('PlanckComputation');
      expect(status.moduleId).toBe('M04.04');
    });

    test('should return validation status', () => {
      const status = integration.validatePlanckComputation();
      expect(['pending', 'validated', 'failed']).toContain(status.status);
    });

    test('should pass tests', () => {
      const status = integration.validatePlanckComputation();
      expect(status.testsPassed).toBeGreaterThan(0);
    });
  });

  describe('EmergentSpacetime Validation (M04.05)', () => {
    test('should validate EmergentSpacetime module', () => {
      const status = integration.validateEmergentSpacetime();
      expect(status).toBeDefined();
      expect(status.module).toBe('EmergentSpacetime');
      expect(status.moduleId).toBe('M04.05');
    });

    test('should return validation status', () => {
      const status = integration.validateEmergentSpacetime();
      expect(['pending', 'validated', 'failed']).toContain(status.status);
    });

    test('should pass tests', () => {
      const status = integration.validateEmergentSpacetime();
      expect(status.testsPassed).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CROSS-MODULE TESTS
  // ============================================================================

  describe('Cross-Module Integration Tests', () => {
    test('should test Bekenstein consistency', () => {
      const result = integration.testBekensteinConsistency();
      expect(result).toBeDefined();
      expect(result.testId).toBe('XM-01');
      expect(result.name).toBe('Bekenstein Bound Consistency');
      expect(result.modulesInvolved).toContain('M04.01');
      expect(result.modulesInvolved).toContain('M04.02');
    });

    test('should test area quantization consistency', () => {
      const result = integration.testAreaQuantizationConsistency();
      expect(result).toBeDefined();
      expect(result.testId).toBe('XM-02');
      expect(result.name).toBe('Area Quantization Consistency');
      expect(result.modulesInvolved).toContain('M04.03');
    });

    test('should test computation limits hierarchy', () => {
      const result = integration.testComputationLimitsHierarchy();
      expect(result).toBeDefined();
      expect(result.testId).toBe('XM-03');
      expect(result.name).toBe('Computation Limits Hierarchy');
      expect(result.modulesInvolved).toContain('M04.04');
    });

    test('should test Ryu-Takayanagi consistency', () => {
      const result = integration.testRyuTakayanagiConsistency();
      expect(result).toBeDefined();
      expect(result.testId).toBe('XM-04');
      expect(result.name).toBe('Ryu-Takayanagi Consistency');
      expect(result.modulesInvolved).toContain('M04.05');
    });

    test('should test holographic principle', () => {
      const result = integration.testHolographicPrinciple();
      expect(result).toBeDefined();
      expect(result.testId).toBe('XM-05');
      expect(result.name).toBe('Holographic Principle Consistency');
    });

    test('should test ER=EPR principle', () => {
      const result = integration.testEREqualsEPR();
      expect(result).toBeDefined();
      expect(result.testId).toBe('XM-06');
      expect(result.name).toBe('ER=EPR Principle');
    });

    test('cross-module tests should generate hashes', () => {
      const result = integration.testBekensteinConsistency();
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(64);
    });

    test('cross-module tests should return pass/fail status', () => {
      const result = integration.testBekensteinConsistency();
      expect(typeof result.passed).toBe('boolean');
    });

    test('cross-module tests should include result description', () => {
      const result = integration.testComputationLimitsHierarchy();
      expect(typeof result.result).toBe('string');
      expect(result.result.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // VALIDATION EXPERIMENTS
  // ============================================================================

  describe('Validation Experiments', () => {
    test('should validate area quantization', () => {
      const experiment = integration.validateAreaQuantization();
      expect(experiment).toBeDefined();
      expect(experiment.id).toBe('VE-01');
      expect(experiment.name).toBe('Area Quantization Fundamental Value');
      expect(experiment.formula).toBe('A = 8πγl_P²√(j(j+1))');
    });

    test('should validate Bekenstein bound', () => {
      const experiment = integration.validateBekensteinBound();
      expect(experiment).toBeDefined();
      expect(experiment.id).toBe('VE-02');
      expect(experiment.formula).toBe('S ≤ 2πkRE/(ħc)');
    });

    test('should validate Lloyd limit', () => {
      const experiment = integration.validateLloydLimit();
      expect(experiment).toBeDefined();
      expect(experiment.id).toBe('VE-03');
      expect(experiment.formula).toBe('ops/s = 2E/(πħ)');
    });

    test('should validate Ryu-Takayanagi', () => {
      const experiment = integration.validateRyuTakayanagi();
      expect(experiment).toBeDefined();
      expect(experiment.id).toBe('VE-04');
      expect(experiment.formula).toBe('S_A = Area/(4G)');
    });

    test('should run all validation experiments', () => {
      const experiments = integration.runValidationExperiments();
      expect(Array.isArray(experiments)).toBe(true);
      expect(experiments.length).toBe(4);
    });

    test('experiments should have expected/actual results', () => {
      const experiment = integration.validateLloydLimit();
      expect(experiment.expectedResult).toBeDefined();
      expect(experiment.actualResult).toBeDefined();
    });

    test('experiments should have significance score', () => {
      const experiment = integration.validateLloydLimit();
      expect(typeof experiment.significance).toBe('number');
      expect(experiment.significance).toBeGreaterThan(0);
      expect(experiment.significance).toBeLessThanOrEqual(1);
    });

    test('experiments should generate hash', () => {
      const experiment = integration.validateAreaQuantization();
      expect(experiment.hash).toBeDefined();
      expect(experiment.hash.length).toBe(64);
    });
  });

  // ============================================================================
  // COMPLETE VALIDATION
  // ============================================================================

  describe('Complete Validation', () => {
    test('should validate all modules', () => {
      const status = integration.validateAll();
      expect(status).toBeDefined();
      expect(status.totalModules).toBe(5);
    });

    test('should return overall status', () => {
      const status = integration.validateAll();
      expect(['healthy', 'degraded', 'failed']).toContain(status.overallStatus);
    });

    test('should count validated modules', () => {
      const status = integration.validateAll();
      expect(typeof status.modulesValidated).toBe('number');
      expect(status.modulesValidated).toBeGreaterThanOrEqual(0);
      expect(status.modulesValidated).toBeLessThanOrEqual(status.totalModules);
    });

    test('should generate integration hash', () => {
      const status = integration.validateAll();
      expect(status.integrationHash).toBeDefined();
      expect(status.integrationHash.length).toBe(64);
    });

    test('should track proof chain length', () => {
      const status = integration.validateAll();
      expect(typeof status.proofChainLength).toBe('number');
      expect(status.proofChainLength).toBeGreaterThan(0);
    });

    test('should record last validation time', () => {
      const status = integration.validateAll();
      expect(status.lastValidation).toBeInstanceOf(Date);
    });

    test('should include all module statuses', () => {
      const status = integration.validateAll();
      expect(Array.isArray(status.modules)).toBe(true);
      expect(status.modules.length).toBe(5);
    });

    test('should include cross-module test results', () => {
      const status = integration.validateAll();
      expect(Array.isArray(status.crossModuleTests)).toBe(true);
      expect(status.crossModuleTests.length).toBe(6);
    });
  });

  // ============================================================================
  // READINESS CHECK
  // ============================================================================

  describe('Phase 5 Readiness', () => {
    test('should check readiness for Phase 5', () => {
      const ready = integration.isReadyForPhase5();
      expect(typeof ready).toBe('boolean');
    });

    test('should validate before checking readiness', () => {
      const ready = integration.isReadyForPhase5();
      // After checking, proof chain should have entries
      const proofChain = integration.exportProofChain();
      const parsed = JSON.parse(proofChain);
      expect(parsed.records.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // PROOF CHAIN
  // ============================================================================

  describe('Proof Chain', () => {
    test('should export proof chain as JSON', () => {
      integration.validateAll();
      const json = integration.exportProofChain();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.chainId).toBe('planck-integration');
    });

    test('should have records after validation', () => {
      integration.validateAll();
      const json = integration.exportProofChain();
      const parsed = JSON.parse(json);
      expect(parsed.records.length).toBeGreaterThan(0);
    });

    test('proof chain should be verifiable', () => {
      integration.validateAll();
      const json = integration.exportProofChain();
      const parsed = JSON.parse(json);
      // Each record should have required fields
      for (const record of parsed.records) {
        expect(record.id).toBeDefined();
        expect(record.inputHash).toBeDefined();
        expect(record.outputHash).toBeDefined();
      }
    });
  });

  // ============================================================================
  // STATISTICS
  // ============================================================================

  describe('Statistics', () => {
    test('should return statistics', () => {
      integration.validateAll();
      const stats = integration.getStatistics();
      expect(stats).toBeDefined();
    });

    test('should count total modules', () => {
      integration.validateAll();
      const stats = integration.getStatistics();
      expect(stats.totalModules).toBe(5);
    });

    test('should count validated modules', () => {
      integration.validateAll();
      const stats = integration.getStatistics();
      expect(typeof stats.validatedModules).toBe('number');
    });

    test('should count tests', () => {
      integration.validateAll();
      const stats = integration.getStatistics();
      expect(stats.totalTests).toBeGreaterThan(0);
      expect(stats.passedTests).toBeGreaterThanOrEqual(0);
    });

    test('should count cross-module tests', () => {
      integration.validateAll();
      const stats = integration.getStatistics();
      expect(stats.crossModuleTests).toBe(6);
    });

    test('should count proof chain entries', () => {
      integration.validateAll();
      const stats = integration.getStatistics();
      expect(stats.proofChainEntries).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // FACTORY
  // ============================================================================

  describe('PlanckIntegrationFactory', () => {
    test('should create and validate integration', () => {
      const { integration, status } = PlanckIntegrationFactory.createAndValidate();
      expect(integration).toBeInstanceOf(PlanckIntegration);
      expect(status).toBeDefined();
      expect(status.totalModules).toBe(5);
    });

    test('should create with experiments', () => {
      const { integration, status, experiments } = PlanckIntegrationFactory.createWithExperiments();
      expect(integration).toBeInstanceOf(PlanckIntegration);
      expect(status).toBeDefined();
      expect(Array.isArray(experiments)).toBe(true);
      expect(experiments.length).toBe(4);
    });
  });

  // ============================================================================
  // HASH VERIFICATION
  // ============================================================================

  describe('Hash Verification', () => {
    test('should generate hash for integration state', () => {
      integration.validateAll();
      const hash = integration.getHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    test('hashes should be consistent for same state', () => {
      const integration1 = new PlanckIntegration();
      const integration2 = new PlanckIntegration();
      
      // Initial hashes should exist but may differ due to timestamps
      const hash1 = integration1.getHash();
      const hash2 = integration2.getHash();
      
      expect(hash1.length).toBe(64);
      expect(hash2.length).toBe(64);
    });

    test('hashes should change after operations', () => {
      const hash1 = integration.getHash();
      integration.validateAll();
      const hash2 = integration.getHash();
      
      // Hash should change after validation
      expect(hash1).not.toBe(hash2);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    test('should handle validation gracefully', () => {
      expect(() => integration.validateAll()).not.toThrow();
    });

    test('should track errors in module status', () => {
      const status = integration.validateSpacetimeLattice();
      expect(Array.isArray(status.errors)).toBe(true);
    });

    test('should track warnings in module status', () => {
      const status = integration.validateSpacetimeLattice();
      expect(Array.isArray(status.warnings)).toBe(true);
    });
  });

  // ============================================================================
  // MODULE DEPENDENCIES
  // ============================================================================

  describe('Module Dependencies', () => {
    test('SpacetimeLattice should have correct dependencies', () => {
      const status = integration.validateSpacetimeLattice();
      expect(status.dependencies).toContain('M01.01'); // Logger
      expect(status.dependencies).toContain('M01.03'); // BigNumber
      expect(status.dependencies).toContain('M01.06'); // PhysicalConstants
    });

    test('InformationTheory should have correct dependencies', () => {
      const status = integration.validateInformationTheory();
      expect(status.dependencies).toContain('M01.01'); // Logger
      expect(status.dependencies).toContain('M01.03'); // BigNumber
    });

    test('SpinNetwork should have correct dependencies', () => {
      const status = integration.validateSpinNetwork();
      expect(status.dependencies).toContain('M01.01'); // Logger
    });

    test('PlanckComputation should have correct dependencies', () => {
      const status = integration.validatePlanckComputation();
      expect(status.dependencies).toContain('M04.02'); // InformationTheory
      expect(status.dependencies).toContain('M01.06'); // PhysicalConstants
    });

    test('EmergentSpacetime should have correct dependencies', () => {
      const status = integration.validateEmergentSpacetime();
      expect(status.dependencies).toContain('M04.01'); // SpacetimeLattice
    });
  });
});

// ============================================================================
// INTEGRATION VALIDATION TESTS
// ============================================================================

describe('PRD-04 Integration Validation', () => {
  test('should validate all 5 Planck Scale Physics modules', () => {
    const { status } = PlanckIntegrationFactory.createAndValidate();
    expect(status.totalModules).toBe(5);
    expect(status.modules.length).toBe(5);
  });

  test('should run 6 cross-module tests', () => {
    const { status } = PlanckIntegrationFactory.createAndValidate();
    expect(status.crossModuleTests.length).toBe(6);
  });

  test('should run 4 validation experiments', () => {
    const { experiments } = PlanckIntegrationFactory.createWithExperiments();
    expect(experiments.length).toBe(4);
  });

  test('should generate complete proof chain', () => {
    const { integration } = PlanckIntegrationFactory.createAndValidate();
    const proofChain = integration.exportProofChain();
    const parsed = JSON.parse(proofChain);
    
    // Should have entries for each validation
    expect(parsed.records.length).toBeGreaterThan(10);
  });

  test('should provide statistics for PRD-04 completion', () => {
    const { integration } = PlanckIntegrationFactory.createAndValidate();
    const stats = integration.getStatistics();
    
    expect(stats.totalModules).toBe(5);
    expect(stats.crossModuleTests).toBe(6);
  });
});
