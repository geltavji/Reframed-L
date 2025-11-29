/**
 * Tests for ProofSystem Module (M07.03)
 */

import {
  ProofSystem,
  ProofSystemFactory,
  ProofGenerator,
  ProofVerifier,
  ProofChainManager,
  ProofStatus,
  ProofType,
  StepType,
  ProofStep,
  Proof
} from '../../../src/testing/proof/ProofSystem';
import { FormulaEngine, ParameterType, ValidationStatus } from '../../../src/testing/formula/FormulaEngine';

describe('ProofSystem Module (M07.03)', () => {
  describe('ProofGenerator Class', () => {
    let generator: ProofGenerator;

    beforeEach(() => {
      generator = new ProofGenerator();
    });

    it('should generate a proof with steps', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A is true', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.DERIVATION, statement: 'B follows from A', justification: 'Logic', references: [], isValid: true },
        { stepNumber: 3, type: StepType.CONCLUSION, statement: 'Therefore B', justification: 'Conclusion', references: [], isValid: true }
      ];

      const proof = generator.generate(
        'Test Proof',
        ProofType.MATHEMATICAL,
        'B is true',
        ['A is true'],
        steps
      );

      expect(proof.name).toBe('Test Proof');
      expect(proof.type).toBe(ProofType.MATHEMATICAL);
      expect(proof.steps.length).toBe(3);
    });

    it('should assign IDs and hashes to steps', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);

      expect(proof.steps[0].id).toBeDefined();
      expect(proof.steps[0].hash).toBeDefined();
      expect(proof.steps[0].hash.length).toBe(16);
    });

    it('should mark complete proof as COMPLETE', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.CONCLUSION, statement: 'A', justification: 'Direct', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      expect(proof.status).toBe(ProofStatus.COMPLETE);
    });

    it('should generate proof from formula evaluations', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x + y', (p) => (p.get('x') || 0) + (p.get('y') || 0));
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 3 });
      formula.addParameter({ name: 'y', type: ParameterType.SCALAR, value: 7 });

      const evalResult = formula.evaluate();
      const proof = generator.generateFromFormula(formula, [evalResult]);

      expect(proof.type).toBe(ProofType.NUMERICAL);
      expect(proof.steps.length).toBeGreaterThan(0);
    });

    it('should get proof by ID', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const retrieved = generator.getProof(proof.id);

      expect(retrieved).toBe(proof);
    });

    it('should get all proofs', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      generator.generate('Test1', ProofType.MATHEMATICAL, 'A', [], steps);
      generator.generate('Test2', ProofType.MATHEMATICAL, 'B', [], steps);

      expect(generator.getAllProofs().length).toBe(2);
    });

    it('should clear proofs', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      generator.clear();

      expect(generator.getAllProofs().length).toBe(0);
    });

    it('should generate hash for proof', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      expect(proof.hash).toBeDefined();
      expect(proof.hash.length).toBe(16);
    });
  });

  describe('ProofVerifier Class', () => {
    let verifier: ProofVerifier;
    let generator: ProofGenerator;

    beforeEach(() => {
      verifier = new ProofVerifier();
      generator = new ProofGenerator();
    });

    it('should verify valid proof', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.CONCLUSION, statement: 'A', justification: 'Direct', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const result = verifier.verify(proof);

      expect(result.isValid).toBe(true);
      expect(result.invalidSteps.length).toBe(0);
    });

    it('should track verification time', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const result = verifier.verify(proof);

      expect(result.verificationTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate confidence', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.CONCLUSION, statement: 'A', justification: 'Direct', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const result = verifier.verify(proof);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should get all verifications', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      verifier.verify(proof);

      expect(verifier.getVerifications().length).toBe(1);
    });

    it('should clear verifications', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      verifier.verify(proof);
      verifier.clear();

      expect(verifier.getVerifications().length).toBe(0);
    });

    it('should generate hash for verification', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const result = verifier.verify(proof);

      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(16);
    });
  });

  describe('ProofChainManager Class', () => {
    let manager: ProofChainManager;
    let generator: ProofGenerator;

    beforeEach(() => {
      manager = new ProofChainManager();
      generator = new ProofGenerator();
    });

    it('should create proof chain', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Root', ProofType.MATHEMATICAL, 'A', [], steps);
      const chain = manager.createChain('Test Chain', proof);

      expect(chain.name).toBe('Test Chain');
      expect(chain.rootProofId).toBe(proof.id);
      expect(chain.proofs.length).toBe(1);
    });

    it('should add proof to chain', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof1 = generator.generate('Root', ProofType.MATHEMATICAL, 'A', [], steps);
      const proof2 = generator.generate('Next', ProofType.MATHEMATICAL, 'B', [], steps);

      const chain = manager.createChain('Test Chain', proof1);
      const added = manager.addToChain(chain.id, proof2);

      expect(added).toBe(true);
      expect(manager.getChain(chain.id)?.proofs.length).toBe(2);
    });

    it('should return false when adding to non-existent chain', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const added = manager.addToChain('non-existent', proof);

      expect(added).toBe(false);
    });

    it('should track chain completeness', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.CONCLUSION, statement: 'A', justification: 'Direct', references: [], isValid: true }
      ];

      const proof = generator.generate('Complete', ProofType.MATHEMATICAL, 'A', [], steps);
      const chain = manager.createChain('Test Chain', proof);

      expect(chain.isComplete).toBe(true);
    });

    it('should get chain by ID', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Root', ProofType.MATHEMATICAL, 'A', [], steps);
      const chain = manager.createChain('Test Chain', proof);

      expect(manager.getChain(chain.id)).toBe(chain);
    });

    it('should get all chains', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof1 = generator.generate('Root1', ProofType.MATHEMATICAL, 'A', [], steps);
      const proof2 = generator.generate('Root2', ProofType.MATHEMATICAL, 'B', [], steps);

      manager.createChain('Chain1', proof1);
      manager.createChain('Chain2', proof2);

      expect(manager.getAllChains().length).toBe(2);
    });

    it('should clear chains', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Root', ProofType.MATHEMATICAL, 'A', [], steps);
      manager.createChain('Test Chain', proof);
      manager.clear();

      expect(manager.getAllChains().length).toBe(0);
    });

    it('should generate chain hash', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = generator.generate('Root', ProofType.MATHEMATICAL, 'A', [], steps);
      const chain = manager.createChain('Test Chain', proof);

      expect(chain.chainHash).toBeDefined();
      expect(chain.chainHash.length).toBe(16);
    });
  });

  describe('ProofSystem Class', () => {
    let system: ProofSystem;

    beforeEach(() => {
      system = new ProofSystem();
    });

    it('should generate proof', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      expect(proof.name).toBe('Test');
    });

    it('should generate proof from formula', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const evalResult = formula.evaluate();
      const proof = system.generateFromFormula(formula, [evalResult]);

      expect(proof.type).toBe(ProofType.NUMERICAL);
    });

    it('should verify proof', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const result = system.verify(proof);

      expect(result.isValid).toBe(true);
      expect(proof.status).toBe(ProofStatus.VERIFIED);
    });

    it('should create proof chain', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Root', ProofType.MATHEMATICAL, 'A', [], steps);
      const chain = system.createChain('Test Chain', proof);

      expect(chain.rootProofId).toBe(proof.id);
    });

    it('should add to chain', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof1 = system.generate('Root', ProofType.MATHEMATICAL, 'A', [], steps);
      const proof2 = system.generate('Next', ProofType.MATHEMATICAL, 'B', [], steps);

      const chain = system.createChain('Test Chain', proof1);
      const added = system.addToChain(chain.id, proof2);

      expect(added).toBe(true);
    });

    it('should generate documentation', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A is true', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.CONCLUSION, statement: 'Therefore A', justification: 'Direct', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const doc = system.document(proof);

      expect(doc.summary).toContain('Proof of');
      expect(doc.formalNotation).toContain('AXIOM');
      expect(doc.naturalLanguage).toContain('By axiom');
    });

    it('should get generator', () => {
      expect(system.getGenerator()).toBeInstanceOf(ProofGenerator);
    });

    it('should get verifier', () => {
      expect(system.getVerifier()).toBeInstanceOf(ProofVerifier);
    });

    it('should get chain manager', () => {
      expect(system.getChainManager()).toBeInstanceOf(ProofChainManager);
    });

    it('should get documentation', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      system.document(proof);

      expect(system.getDocumentation().length).toBe(1);
    });

    it('should get statistics', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      system.verify(proof);
      system.createChain('Chain', proof);
      system.document(proof);

      const stats = system.getStatistics();
      expect(stats.proofCount).toBe(1);
      expect(stats.verifiedCount).toBe(1);
      expect(stats.chainCount).toBe(1);
      expect(stats.documentationCount).toBe(1);
    });

    it('should clear all data', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      system.verify(proof);
      system.clear();

      const stats = system.getStatistics();
      expect(stats.proofCount).toBe(0);
    });

    it('should export to JSON', () => {
      const json = system.toJSON();
      expect(json).toHaveProperty('proofs');
      expect(json).toHaveProperty('verifications');
      expect(json).toHaveProperty('chains');
      expect(json).toHaveProperty('documentation');
    });

    it('should generate proof chain hash', () => {
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      const hash = system.generateProofChainHash();

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });

  describe('ProofSystemFactory', () => {
    it('should create system without logger', () => {
      const system = ProofSystemFactory.create();
      expect(system).toBeInstanceOf(ProofSystem);
    });
  });

  describe('Proof Types', () => {
    it('should support mathematical proofs', () => {
      const system = new ProofSystem();
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'A', [], steps);
      expect(proof.type).toBe(ProofType.MATHEMATICAL);
    });

    it('should support physical proofs', () => {
      const system = new ProofSystem();
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.ASSUMPTION, statement: 'F=ma', justification: 'Newton', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.PHYSICAL, 'Force equals mass times acceleration', [], steps);
      expect(proof.type).toBe(ProofType.PHYSICAL);
    });

    it('should support empirical proofs', () => {
      const system = new ProofSystem();
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.DERIVATION, statement: 'Data shows correlation', justification: 'Experiment', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.EMPIRICAL, 'Correlation exists', [], steps);
      expect(proof.type).toBe(ProofType.EMPIRICAL);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty proof steps', () => {
      const system = new ProofSystem();
      const proof = system.generate('Empty', ProofType.MATHEMATICAL, 'Nothing', [], []);
      expect(proof.steps.length).toBe(0);
    });

    it('should handle proof with only conclusion', () => {
      const system = new ProofSystem();
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.CONCLUSION, statement: 'A', justification: 'Obvious', references: [], isValid: true }
      ];

      const proof = system.generate('Simple', ProofType.MATHEMATICAL, 'A', [], steps);
      expect(proof.conclusion).toBe('A');
    });

    it('should handle multiple hypothesis', () => {
      const system = new ProofSystem();
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.ASSUMPTION, statement: 'A', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.ASSUMPTION, statement: 'B', justification: 'Given', references: [], isValid: true }
      ];

      const proof = system.generate('Multi', ProofType.MATHEMATICAL, 'A and B', ['A', 'B'], steps);
      expect(proof.hypothesis.length).toBe(2);
    });
  });

  describe('Hash Verification', () => {
    it('should generate different hashes for different proofs', () => {
      const system = new ProofSystem();
      const steps1: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true }
      ];
      const steps2: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'B', justification: 'Given', references: [], isValid: true }
      ];

      const proof1 = system.generate('Test1', ProofType.MATHEMATICAL, 'A', [], steps1);
      const proof2 = system.generate('Test2', ProofType.MATHEMATICAL, 'B', [], steps2);

      expect(proof1.hash).not.toBe(proof2.hash);
    });

    it('should generate different step hashes', () => {
      const system = new ProofSystem();
      const steps: Omit<ProofStep, 'id' | 'hash'>[] = [
        { stepNumber: 1, type: StepType.AXIOM, statement: 'A', justification: 'Given', references: [], isValid: true },
        { stepNumber: 2, type: StepType.CONCLUSION, statement: 'B', justification: 'Result', references: [], isValid: true }
      ];

      const proof = system.generate('Test', ProofType.MATHEMATICAL, 'B', [], steps);
      expect(proof.steps[0].hash).not.toBe(proof.steps[1].hash);
    });
  });
});
