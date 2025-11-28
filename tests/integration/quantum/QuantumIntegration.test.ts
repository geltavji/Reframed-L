/**
 * QuantumIntegration.test.ts - PRD-02 Phase 2.6 Integration Tests
 * 
 * Comprehensive integration tests for all Quantum Mechanics modules.
 * These tests validate that all Phase 2 modules work correctly together.
 */

import { QuantumIntegration, QuantumSystemStatus, ValidationExperiment } from '../../../src/quantum/integration/QuantumIntegration';

describe('QuantumIntegration (M02.09) - Phase 2.6', () => {
  let integration: QuantumIntegration;

  beforeEach(() => {
    integration = new QuantumIntegration();
  });

  describe('Module Initialization', () => {
    it('should initialize all quantum modules', () => {
      expect(integration).toBeDefined();
      expect(integration.getLogger()).toBeDefined();
      expect(integration.getHashChain()).toBeDefined();
    });
  });

  describe('Individual Module Validation', () => {
    it('should validate WaveFunction module', () => {
      const status = integration.validateWaveFunction();
      expect(status.module).toBe('WaveFunction');
      expect(status.moduleId).toBe('M02.01');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
      expect(status.hash).toHaveLength(64);
    });

    it('should validate QuantumState module', () => {
      const status = integration.validateQuantumState();
      expect(status.module).toBe('QuantumState');
      expect(status.moduleId).toBe('M02.02');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
    });

    it('should validate Operator module', () => {
      const status = integration.validateOperator();
      expect(status.module).toBe('Operator');
      expect(status.moduleId).toBe('M02.03');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
    });

    it('should validate Commutator module', () => {
      const status = integration.validateCommutator();
      expect(status.module).toBe('Commutator');
      expect(status.moduleId).toBe('M02.04');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
    });

    it('should validate EigenSolver module', () => {
      const status = integration.validateEigenSolver();
      expect(status.module).toBe('EigenSolver');
      expect(status.moduleId).toBe('M02.05');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
    });

    it('should validate TimeEvolution module', () => {
      const status = integration.validateTimeEvolution();
      expect(status.module).toBe('TimeEvolution');
      expect(status.moduleId).toBe('M02.06');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
    });

    it('should validate Measurement module', () => {
      const status = integration.validateMeasurement();
      expect(status.module).toBe('Measurement');
      expect(status.moduleId).toBe('M02.07');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
    });

    it('should validate Entanglement module', () => {
      const status = integration.validateEntanglement();
      expect(status.module).toBe('Entanglement');
      expect(status.moduleId).toBe('M02.08');
      expect(status.status).toBe('validated');
      expect(status.testsPassed).toBeGreaterThan(0);
      expect(status.testsFailed).toBe(0);
    });
  });

  describe('Cross-Module Integration Tests', () => {
    it('should pass WaveFunction + Operators integration', () => {
      const result = integration.testWaveFunctionOperatorIntegration();
      expect(result.passed).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass Schrödinger + Measurement integration', () => {
      const result = integration.testSchrodingerMeasurementIntegration();
      expect(result.passed).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass Entanglement + Bell states integration', () => {
      const result = integration.testEntanglementBellIntegration();
      expect(result.passed).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Validation Experiments', () => {
    it('should validate Hydrogen atom energy levels', () => {
      const experiment = integration.validateHydrogenEnergyLevels();
      expect(experiment.name).toContain('Hydrogen');
      expect(experiment.passed).toBe(true);
      expect(Math.abs(experiment.actualValue + 13.6)).toBeLessThan(0.1);
      expect(experiment.hash).toHaveLength(64);
    });

    it('should validate Harmonic oscillator eigenvalues', () => {
      const experiment = integration.validateHarmonicOscillator();
      expect(experiment.name).toContain('Harmonic');
      expect(experiment.passed).toBe(true);
      expect(experiment.actualValue).toBeLessThan(experiment.tolerance);
      expect(experiment.hash).toHaveLength(64);
    });

    it('should validate Bell inequality violation', () => {
      const experiment = integration.validateBellInequalityViolation();
      expect(experiment.name).toContain('Bell');
      expect(experiment.passed).toBe(true);
      expect(experiment.actualValue).toBeGreaterThan(2); // Classical bound
      expect(Math.abs(experiment.actualValue - 2 * Math.sqrt(2))).toBeLessThan(0.1);
      expect(experiment.hash).toHaveLength(64);
    });

    it('should validate Uncertainty principle', () => {
      const experiment = integration.validateUncertaintyPrinciple();
      expect(experiment.name).toContain('Uncertainty');
      expect(experiment.passed).toBe(true);
      expect(experiment.hash).toHaveLength(64);
    });
  });

  describe('Full System Validation', () => {
    it('should validate entire quantum system successfully', () => {
      const status = integration.validateAll();
      
      expect(status.overallStatus).toBe('healthy');
      expect(status.modulesValidated).toBe(8);
      expect(status.totalModules).toBe(8);
      expect(status.integrationHash).toHaveLength(64);
      expect(status.proofChainLength).toBeGreaterThan(0);
      expect(status.modules).toHaveLength(8);
      expect(status.validationExperiments).toHaveLength(4);
    });

    it('should be ready for Phase 3 after full validation', () => {
      integration.validateAll();
      const readiness = integration.isReadyForPhase3();
      
      expect(readiness.ready).toBe(true);
      expect(readiness.blockers).toHaveLength(0);
    });

    it('should export proof chain after validation', () => {
      integration.validateAll();
      const proofChainJson = integration.exportProofChain();
      
      expect(proofChainJson).toBeTruthy();
      const parsed = JSON.parse(proofChainJson);
      expect(parsed.chainId).toBe('quantum-integration');
      expect(parsed.records).toBeDefined();
    });
  });

  describe('Hash Verification', () => {
    it('should generate unique hashes for each module validation', () => {
      const status = integration.validateAll();
      const hashes = status.modules.map(m => m.hash);
      const uniqueHashes = new Set(hashes);
      
      // Each module should have a unique hash
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it('should generate hash for integration result', () => {
      const status = integration.validateAll();
      expect(status.integrationHash).toHaveLength(64);
    });

    it('should generate hashes for validation experiments', () => {
      integration.validateAll();
      const experiments = integration.getValidationExperiments();
      
      for (const exp of experiments) {
        expect(exp.hash).toHaveLength(64);
      }
    });
  });

  describe('PRD-02 Phase 2.6 Completion Checklist', () => {
    let systemStatus: QuantumSystemStatus;

    beforeAll(() => {
      const testIntegration = new QuantumIntegration();
      systemStatus = testIntegration.validateAll();
    });

    it('✅ Wave function + Operators integration verified', () => {
      const wfModule = systemStatus.modules.find(m => m.moduleId === 'M02.01');
      const opModule = systemStatus.modules.find(m => m.moduleId === 'M02.03');
      expect(wfModule?.status).toBe('validated');
      expect(opModule?.status).toBe('validated');
    });

    it('✅ Schrödinger solver + Measurement integration verified', () => {
      const eigenModule = systemStatus.modules.find(m => m.moduleId === 'M02.05');
      const timeModule = systemStatus.modules.find(m => m.moduleId === 'M02.06');
      const measureModule = systemStatus.modules.find(m => m.moduleId === 'M02.07');
      expect(eigenModule?.status).toBe('validated');
      expect(timeModule?.status).toBe('validated');
      expect(measureModule?.status).toBe('validated');
    });

    it('✅ Entanglement + Bell states integration verified', () => {
      const entModule = systemStatus.modules.find(m => m.moduleId === 'M02.08');
      expect(entModule?.status).toBe('validated');
    });

    it('✅ All modules with hash verification', () => {
      for (const module of systemStatus.modules) {
        expect(module.hash).toHaveLength(64);
      }
    });

    it('✅ Hydrogen atom energy levels validated', () => {
      const experiment = systemStatus.validationExperiments.find(e => e.name.includes('Hydrogen'));
      expect(experiment?.passed).toBe(true);
    });

    it('✅ Harmonic oscillator eigenvalues validated', () => {
      const experiment = systemStatus.validationExperiments.find(e => e.name.includes('Harmonic'));
      expect(experiment?.passed).toBe(true);
    });

    it('✅ Bell inequality violation validated', () => {
      const experiment = systemStatus.validationExperiments.find(e => e.name.includes('Bell'));
      expect(experiment?.passed).toBe(true);
    });

    it('✅ Uncertainty principle validated', () => {
      const experiment = systemStatus.validationExperiments.find(e => e.name.includes('Uncertainty'));
      expect(experiment?.passed).toBe(true);
    });

    it('✅ Ready for Phase 3 (Spacetime Mathematics)', () => {
      expect(systemStatus.overallStatus).toBe('healthy');
    });
  });
});
