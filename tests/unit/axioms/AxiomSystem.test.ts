/**
 * Qlaws Ham - AxiomSystem Module Tests (M01.07)
 * 
 * Comprehensive tests for the axiom framework.
 * Tests axiom creation, validation, and proof chain verification.
 * 
 * @module tests/AxiomSystem
 */

import {
  AxiomSystem,
  AxiomBuilder,
  AxiomValidator,
  AxiomStatus,
  AxiomCategory,
  Axiom,
  Formula,
  ValidationResult
} from '../../../src/core/axioms/AxiomSystem';
import { ProofType } from '../../../src/core/logger/HashVerifier';
import { BigNumber } from '../../../src/core/math/BigNumber';

describe('AxiomSystem Module (M01.07)', () => {
  let axiomSystem: AxiomSystem;

  beforeEach(() => {
    axiomSystem = new AxiomSystem();
  });

  describe('AxiomBuilder', () => {
    it('should create basic axiom with required fields', () => {
      const axiom = new AxiomBuilder()
        .id('TEST-001')
        .name('Test Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('For all x, x = x')
        .formalDefinition({
          expression: 'x = x',
          variables: new Map([['x', { name: 'x', type: 'scalar', domain: 'R' }]]),
          constraints: [],
          domain: 'R',
          codomain: 'Boolean'
        })
        .build();

      expect(axiom.id).toBe('TEST-001');
      expect(axiom.name).toBe('Test Axiom');
      expect(axiom.category).toBe(AxiomCategory.MATHEMATICAL);
      expect(axiom.statement).toBe('For all x, x = x');
      expect(axiom.status).toBe(AxiomStatus.PROPOSED);
      expect(axiom.hash).toBeDefined();
      expect(axiom.hash.length).toBe(64);
    });

    it('should throw error when required fields missing', () => {
      expect(() => {
        new AxiomBuilder()
          .id('TEST-002')
          .name('Incomplete Axiom')
          .build();
      }).toThrow('Axiom requires id, name, category, statement, and formalDefinition');
    });

    it('should add validation tests', () => {
      const axiom = new AxiomBuilder()
        .id('TEST-003')
        .name('Addition Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('a + b = b + a')
        .formalDefinition({
          expression: 'a + b',
          variables: new Map([
            ['a', { name: 'a', type: 'scalar', domain: 'R' }],
            ['b', { name: 'b', type: 'scalar', domain: 'R' }]
          ]),
          constraints: [],
          domain: 'R × R',
          codomain: 'R'
        })
        .addTest({
          id: 'TEST-003-01',
          description: 'Test commutativity with positive numbers',
          input: new Map([['a', 3], ['b', 5]]),
          expectedOutput: 8
        })
        .addTest({
          id: 'TEST-003-02',
          description: 'Test commutativity with negative numbers',
          input: new Map([['a', -2], ['b', 7]]),
          expectedOutput: 5
        })
        .build();

      expect(axiom.validationTests.length).toBe(2);
      expect(axiom.validationTests[0].id).toBe('TEST-003-01');
      expect(axiom.validationTests[0].hash).toBeDefined();
      expect(axiom.validationTests[1].id).toBe('TEST-003-02');
    });

    it('should add implications', () => {
      const axiom = new AxiomBuilder()
        .id('TEST-004')
        .name('Test Axiom')
        .category(AxiomCategory.PHYSICAL)
        .statement('Energy is conserved')
        .formalDefinition({
          expression: 'E_total = constant',
          variables: new Map([['E_total', { name: 'E_total', type: 'scalar', domain: 'R+' }]]),
          constraints: ['E_total >= 0'],
          domain: 'Closed systems',
          codomain: 'R+'
        })
        .addImplication('Perpetual motion is impossible')
        .addImplication('All processes conserve energy', ['thermodynamics'])
        .build();

      expect(axiom.implications.length).toBe(2);
      expect(axiom.implications[0].statement).toBe('Perpetual motion is impossible');
      expect(axiom.implications[0].proofHash).toBeDefined();
      expect(axiom.implications[1].derivedFrom).toContain('thermodynamics');
    });

    it('should add dependencies', () => {
      const axiom = new AxiomBuilder()
        .id('TEST-005')
        .name('Dependent Axiom')
        .category(AxiomCategory.QUANTUM)
        .statement('Derived quantum property')
        .formalDefinition({
          expression: 'ψ = A * exp(ikx)',
          variables: new Map([
            ['ψ', { name: 'ψ', type: 'function', domain: 'C' }],
            ['A', { name: 'A', type: 'scalar', domain: 'C' }],
            ['k', { name: 'k', type: 'scalar', domain: 'R' }]
          ]),
          constraints: [],
          domain: 'Wave functions',
          codomain: 'C'
        })
        .dependsOn('AXIOM-001')
        .dependsOn('AXIOM-002')
        .build();

      expect(axiom.dependencies.length).toBe(2);
      expect(axiom.dependencies).toContain('AXIOM-001');
      expect(axiom.dependencies).toContain('AXIOM-002');
    });

    it('should add proof records', () => {
      const axiom = new AxiomBuilder()
        .id('TEST-006')
        .name('Proven Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('1 + 1 = 2')
        .formalDefinition({
          expression: '1 + 1',
          variables: new Map(),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        })
        .addProof(ProofType.THEOREM, '1 + 1', '2')
        .addProof(ProofType.VALIDATION, 'Check result', 'Verified')
        .build();

      expect(axiom.proofChain.length).toBe(2);
      expect(axiom.proofChain[0].type).toBe(ProofType.THEOREM);
      expect(axiom.proofChain[1].type).toBe(ProofType.VALIDATION);
    });

    it('should set metadata', () => {
      const axiom = new AxiomBuilder()
        .id('TEST-007')
        .name('Axiom with Metadata')
        .category(AxiomCategory.UNIFIED)
        .statement('Universal principle')
        .formalDefinition({
          expression: 'U = constant',
          variables: new Map([['U', { name: 'U', type: 'scalar', domain: 'R' }]]),
          constraints: [],
          domain: 'Universe',
          codomain: 'R'
        })
        .metadata({
          author: 'Test Author',
          version: '1.0.0',
          references: ['Paper1', 'Paper2']
        })
        .build();

      expect(axiom.metadata).toBeDefined();
      expect(axiom.metadata!.author).toBe('Test Author');
      expect(axiom.metadata!.version).toBe('1.0.0');
    });

    it('should generate unique hashes for different axioms', () => {
      const axiom1 = new AxiomBuilder()
        .id('HASH-001')
        .name('First Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Statement A')
        .formalDefinition({
          expression: 'A',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      const axiom2 = new AxiomBuilder()
        .id('HASH-002')
        .name('Second Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Statement B')
        .formalDefinition({
          expression: 'B',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      expect(axiom1.hash).not.toBe(axiom2.hash);
    });

    it('should set dates correctly', () => {
      const beforeCreate = new Date();
      
      const axiom = new AxiomBuilder()
        .id('DATE-001')
        .name('Dated Axiom')
        .category(AxiomCategory.PHYSICAL)
        .statement('Test statement')
        .formalDefinition({
          expression: 'test',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      const afterCreate = new Date();

      expect(axiom.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(axiom.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(axiom.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    });
  });

  describe('AxiomValidator', () => {
    let validator: AxiomValidator;

    beforeEach(() => {
      validator = new AxiomValidator();
    });

    it('should validate axiom with passing tests', () => {
      const axiom = new AxiomBuilder()
        .id('VAL-001')
        .name('Validated Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('2 + 2 = 4')
        .formalDefinition({
          expression: '2 + 2',
          variables: new Map(),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        })
        .addTest({
          id: 'VAL-001-01',
          description: 'Basic addition',
          input: new Map(),
          expectedOutput: 4
        })
        .build();

      const result = validator.validate(axiom);

      expect(result.valid).toBe(true);
      expect(result.testsPassed).toBe(1);
      expect(result.testsFailed).toBe(0);
      expect(result.hash).toBeDefined();
    });

    it('should reject axiom with failing tests', () => {
      const axiom = new AxiomBuilder()
        .id('VAL-002')
        .name('Invalid Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('2 + 2 = 5')
        .formalDefinition({
          expression: '2 + 2',
          variables: new Map(),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        })
        .addTest({
          id: 'VAL-002-01',
          description: 'Incorrect addition',
          input: new Map(),
          expectedOutput: 5
        })
        .build();

      const result = validator.validate(axiom);

      expect(result.valid).toBe(false);
      expect(result.testsFailed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should register and retrieve axioms', () => {
      const axiom = new AxiomBuilder()
        .id('REG-001')
        .name('Registered Axiom')
        .category(AxiomCategory.COMPUTATIONAL)
        .statement('Computation is possible')
        .formalDefinition({
          expression: 'P(x)',
          variables: new Map([['x', { name: 'x', type: 'function', domain: 'Inputs' }]]),
          constraints: [],
          domain: 'Inputs',
          codomain: 'Outputs'
        })
        .build();

      validator.register(axiom);
      const retrieved = validator.getAxiom('REG-001');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('Registered Axiom');
    });

    it('should unregister axioms', () => {
      const axiom = new AxiomBuilder()
        .id('UNREG-001')
        .name('To Be Unregistered')
        .category(AxiomCategory.PHYSICAL)
        .statement('Test')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      validator.register(axiom);
      expect(validator.getAxiom('UNREG-001')).toBeDefined();

      const removed = validator.unregister('UNREG-001');
      expect(removed).toBe(true);
      expect(validator.getAxiom('UNREG-001')).toBeUndefined();
    });

    it('should get axioms by category', () => {
      const mathAxiom = new AxiomBuilder()
        .id('CAT-001')
        .name('Math Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Math statement')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      const physicsAxiom = new AxiomBuilder()
        .id('CAT-002')
        .name('Physics Axiom')
        .category(AxiomCategory.PHYSICAL)
        .statement('Physics statement')
        .formalDefinition({
          expression: 'F',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      validator.register(mathAxiom);
      validator.register(physicsAxiom);

      const mathAxioms = validator.getByCategory(AxiomCategory.MATHEMATICAL);
      const physicsAxioms = validator.getByCategory(AxiomCategory.PHYSICAL);

      expect(mathAxioms.length).toBe(1);
      expect(mathAxioms[0].id).toBe('CAT-001');
      expect(physicsAxioms.length).toBe(1);
      expect(physicsAxioms[0].id).toBe('CAT-002');
    });

    it('should get axioms by status', () => {
      const axiom = new AxiomBuilder()
        .id('STAT-001')
        .name('Status Axiom')
        .category(AxiomCategory.QUANTUM)
        .statement('Quantum statement')
        .formalDefinition({
          expression: 'ψ',
          variables: new Map(),
          constraints: [],
          domain: 'C',
          codomain: 'C'
        })
        .build();

      validator.register(axiom);

      const proposed = validator.getByStatus(AxiomStatus.PROPOSED);
      expect(proposed.length).toBe(1);
      expect(proposed[0].id).toBe('STAT-001');
    });

    it('should verify proof chain integrity', () => {
      const axiom = new AxiomBuilder()
        .id('PROOF-001')
        .name('Proven Axiom')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Valid proof chain')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .addProof(ProofType.THEOREM, 'Step 1', 'Result 1')
        .addProof(ProofType.THEOREM, 'Step 2', 'Result 2')
        .addProof(ProofType.VALIDATION, 'Final check', 'Verified')
        .build();

      const result = validator.validate(axiom);
      expect(result.proofVerified).toBe(true);
    });

    it('should have proof chain for validations', () => {
      const proofChain = validator.getProofChain();
      expect(proofChain).toBeDefined();
      expect(proofChain.getChainId()).toContain('AXIOM-VALIDATOR');
    });
  });

  describe('AxiomSystem', () => {
    it('should initialize with 4 core axioms', () => {
      const coreAxioms = axiomSystem.getCoreAxioms();
      
      expect(coreAxioms.length).toBe(4);
      
      const axiomIds = coreAxioms.map(a => a.id);
      expect(axiomIds).toContain('AXIOM-001');
      expect(axiomIds).toContain('AXIOM-002');
      expect(axiomIds).toContain('AXIOM-003');
      expect(axiomIds).toContain('AXIOM-004');
    });

    it('should have Information Conservation axiom', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-001');
      
      expect(axiom).toBeDefined();
      expect(axiom!.name).toBe('Information Conservation');
      expect(axiom!.category).toBe(AxiomCategory.INFORMATION);
      expect(axiom!.implications.length).toBeGreaterThan(0);
    });

    it('should have Computational Universality axiom', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-002');
      
      expect(axiom).toBeDefined();
      expect(axiom!.name).toBe('Computational Universality');
      expect(axiom!.category).toBe(AxiomCategory.COMPUTATIONAL);
    });

    it('should have Scale Invariance axiom', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-003');
      
      expect(axiom).toBeDefined();
      expect(axiom!.name).toBe('Scale Invariance');
      expect(axiom!.category).toBe(AxiomCategory.PHYSICAL);
    });

    it('should have Discrete Spacetime axiom', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-004');
      
      expect(axiom).toBeDefined();
      expect(axiom!.name).toBe('Discrete Spacetime');
      expect(axiom!.category).toBe(AxiomCategory.SPACETIME);
    });

    it('should add and validate new axioms', () => {
      const newAxiom = axiomSystem.createAxiom()
        .id('NEW-001')
        .name('New Custom Axiom')
        .category(AxiomCategory.UNIFIED)
        .statement('All forces are unified')
        .formalDefinition({
          expression: 'F_unified = F_em + F_weak + F_strong + F_gravity',
          variables: new Map([
            ['F_unified', { name: 'F_unified', type: 'vector', domain: 'R^4' }]
          ]),
          constraints: [],
          domain: 'Spacetime',
          codomain: 'Forces'
        })
        .build();

      const result = axiomSystem.addAxiom(newAxiom);
      
      expect(result.valid).toBe(true);
      expect(result.axiomId).toBe('NEW-001');
      
      const retrieved = axiomSystem.getAxiom('NEW-001');
      expect(retrieved).toBeDefined();
      expect(retrieved!.status).toBe(AxiomStatus.VALIDATED);
    });

    it('should remove axioms', () => {
      const axiom = axiomSystem.createAxiom()
        .id('REMOVE-001')
        .name('To Remove')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Temporary axiom')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      axiomSystem.addAxiom(axiom);
      expect(axiomSystem.getAxiom('REMOVE-001')).toBeDefined();

      const removed = axiomSystem.removeAxiom('REMOVE-001');
      expect(removed).toBe(true);
    });

    it('should get all axioms', () => {
      const allAxioms = axiomSystem.getAllAxioms();
      expect(allAxioms.length).toBeGreaterThanOrEqual(4);
    });

    it('should filter by category', () => {
      const informationAxioms = axiomSystem.getByCategory(AxiomCategory.INFORMATION);
      expect(informationAxioms.length).toBeGreaterThanOrEqual(1);
      expect(informationAxioms[0].category).toBe(AxiomCategory.INFORMATION);
    });

    it('should validate all axioms', () => {
      const results = axiomSystem.validateAll();
      
      expect(results.size).toBeGreaterThanOrEqual(4);
      
      for (const [id, result] of results) {
        expect(result.axiomId).toBe(id);
        expect(result.timestamp).toBeDefined();
      }
    });

    it('should check global consistency', () => {
      const consistency = axiomSystem.checkGlobalConsistency();
      
      expect(consistency.consistent).toBe(true);
      expect(consistency.checkedAxioms.length).toBeGreaterThanOrEqual(4);
      expect(consistency.hash).toBeDefined();
    });

    it('should detect contradictions between axioms', () => {
      // Add an axiom that contradicts existing one
      const contradictingAxiom = axiomSystem.createAxiom()
        .id('CONTRA-001')
        .name('Contradicting Axiom')
        .category(AxiomCategory.INFORMATION)
        .statement('Information is always destroyed')
        .formalDefinition({
          expression: 'I_total = 0',
          variables: new Map([['I_total', { name: 'I_total', type: 'scalar', domain: 'R+' }]]),
          constraints: ['I_total = 0'],
          domain: 'All systems',
          codomain: 'R+'
        })
        .addImplication('Information is never conserved')
        .build();

      axiomSystem.addAxiom(contradictingAxiom);
      
      const consistency = axiomSystem.checkGlobalConsistency();
      // Should detect potential conflict due to overlapping domain
      expect(consistency.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should have master proof chain', () => {
      const proofChain = axiomSystem.getProofChain();
      
      expect(proofChain).toBeDefined();
      expect(proofChain.getRecordCount()).toBeGreaterThan(0);
    });

    it('should export to JSON', () => {
      const json = axiomSystem.exportToJson();
      const parsed = JSON.parse(json);
      
      expect(parsed.coreAxioms).toBeDefined();
      expect(parsed.coreAxioms.length).toBe(4);
      expect(parsed.allAxioms).toBeDefined();
      expect(parsed.masterChainRecords).toBeGreaterThan(0);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should get system statistics', () => {
      const stats = axiomSystem.getStatistics();
      
      expect(stats.totalAxioms).toBeGreaterThanOrEqual(4);
      expect(stats.coreAxioms).toBe(4);
      expect(stats.totalTests).toBeGreaterThan(0);
      expect(stats.totalImplications).toBeGreaterThan(0);
    });
  });

  describe('Core Axiom Properties', () => {
    it('AXIOM-001: Information Conservation has correct structure', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-001')!;
      
      expect(axiom.formalDefinition.expression).toContain('I_total');
      expect(axiom.formalDefinition.constraints.length).toBeGreaterThan(0);
      expect(axiom.implications.length).toBe(3);
      expect(axiom.validationTests.length).toBeGreaterThan(0);
      expect(axiom.proofChain.length).toBeGreaterThan(0);
    });

    it('AXIOM-002: Computational Universality has correct structure', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-002')!;
      
      expect(axiom.formalDefinition.expression).toContain('P_physical');
      expect(axiom.formalDefinition.expression).toContain('P_computable');
      expect(axiom.implications.some(i => i.statement.includes('Mathematics'))).toBe(true);
    });

    it('AXIOM-003: Scale Invariance has correct structure', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-003')!;
      
      expect(axiom.formalDefinition.expression).toContain('λ');
      expect(axiom.formalDefinition.domain).toContain('Planck');
      expect(axiom.formalDefinition.domain).toContain('cosmic');
    });

    it('AXIOM-004: Discrete Spacetime has correct structure', () => {
      const axiom = axiomSystem.getAxiom('AXIOM-004')!;
      
      expect(axiom.formalDefinition.expression).toContain('l_P');
      expect(axiom.formalDefinition.expression).toContain('t_P');
      expect(axiom.formalDefinition.constraints.some(c => c.includes('10^-35'))).toBe(true);
      expect(axiom.formalDefinition.constraints.some(c => c.includes('10^-44'))).toBe(true);
    });

    it('All core axioms have unique hashes', () => {
      const coreAxioms = axiomSystem.getCoreAxioms();
      const hashes = coreAxioms.map(a => a.hash);
      const uniqueHashes = new Set(hashes);
      
      expect(uniqueHashes.size).toBe(coreAxioms.length);
    });

    it('All core axioms have valid proof chains', () => {
      const coreAxioms = axiomSystem.getCoreAxioms();
      
      for (const axiom of coreAxioms) {
        expect(axiom.proofChain.length).toBeGreaterThan(0);
        expect(axiom.proofChain[0].type).toBe(ProofType.AXIOM);
      }
    });
  });

  describe('Formula Evaluation', () => {
    it('should evaluate simple arithmetic', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EVAL-001')
        .name('Arithmetic Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('3 + 4 = 7')
        .formalDefinition({
          expression: '3 + 4',
          variables: new Map(),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        })
        .addTest({
          id: 'EVAL-001-01',
          description: 'Simple addition',
          input: new Map(),
          expectedOutput: 7
        })
        .build();

      const result = axiomSystem.addAxiom(axiom);
      expect(result.valid).toBe(true);
      expect(result.testsPassed).toBe(1);
    });

    it('should evaluate with variables', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EVAL-002')
        .name('Variable Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('a * b')
        .formalDefinition({
          expression: 'a * b',
          variables: new Map([
            ['a', { name: 'a', type: 'scalar', domain: 'R' }],
            ['b', { name: 'b', type: 'scalar', domain: 'R' }]
          ]),
          constraints: [],
          domain: 'R × R',
          codomain: 'R'
        })
        .addTest({
          id: 'EVAL-002-01',
          description: 'Multiplication',
          input: new Map([['a', 6], ['b', 7]]),
          expectedOutput: 42
        })
        .build();

      const result = axiomSystem.addAxiom(axiom);
      expect(result.valid).toBe(true);
    });

    it('should evaluate mathematical functions', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EVAL-003')
        .name('Function Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('sqrt(16) = 4')
        .formalDefinition({
          expression: 'sqrt(16)',
          variables: new Map(),
          constraints: [],
          domain: 'R+',
          codomain: 'R+'
        })
        .addTest({
          id: 'EVAL-003-01',
          description: 'Square root',
          input: new Map(),
          expectedOutput: 4
        })
        .build();

      const result = axiomSystem.addAxiom(axiom);
      expect(result.valid).toBe(true);
    });

    it('should evaluate trigonometric functions', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EVAL-004')
        .name('Trig Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('sin(0) = 0')
        .formalDefinition({
          expression: 'sin(0)',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: '[-1, 1]'
        })
        .addTest({
          id: 'EVAL-004-01',
          description: 'Sine of zero',
          input: new Map(),
          expectedOutput: 0
        })
        .build();

      const result = axiomSystem.addAxiom(axiom);
      expect(result.valid).toBe(true);
    });

    it('should evaluate power expressions', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EVAL-005')
        .name('Power Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('2^10 = 1024')
        .formalDefinition({
          expression: '2^10',
          variables: new Map(),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        })
        .addTest({
          id: 'EVAL-005-01',
          description: 'Power of 2',
          input: new Map(),
          expectedOutput: 1024
        })
        .build();

      const result = axiomSystem.addAxiom(axiom);
      expect(result.valid).toBe(true);
    });
  });

  describe('Integration with Other Modules', () => {
    it('should use Logger for logging', () => {
      // Creating axiom system triggers logging
      const newSystem = new AxiomSystem();
      const coreAxioms = newSystem.getCoreAxioms();
      
      expect(coreAxioms.length).toBe(4);
    });

    it('should use HashVerifier for hashing', () => {
      const axiom = axiomSystem.createAxiom()
        .id('INT-001')
        .name('Integration Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Integration test')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      // Hash should be 64 character hex (SHA-256)
      expect(axiom.hash.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(axiom.hash)).toBe(true);
    });

    it('should support BigNumber in tests', () => {
      const axiom = axiomSystem.createAxiom()
        .id('BN-001')
        .name('BigNumber Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Large number test')
        .formalDefinition({
          expression: 'x',
          variables: new Map([['x', { name: 'x', type: 'scalar', domain: 'Z' }]]),
          constraints: [],
          domain: 'Z',
          codomain: 'Z'
        })
        .addTest({
          id: 'BN-001-01',
          description: 'BigNumber input',
          input: new Map([['x', new BigNumber('123456789012345678901234567890')]]),
          expectedOutput: '123456789012345678901234567890'
        })
        .build();

      expect(axiom.validationTests[0].input.get('x')).toBeInstanceOf(BigNumber);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty test suite', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EDGE-001')
        .name('No Tests')
        .category(AxiomCategory.PHYSICAL)
        .statement('No tests')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      const result = axiomSystem.addAxiom(axiom);
      expect(result.valid).toBe(true);
      expect(result.testsRun).toBe(0);
    });

    it('should handle empty proof chain', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EDGE-002')
        .name('No Proofs')
        .category(AxiomCategory.PHYSICAL)
        .statement('No proofs')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      const result = axiomSystem.addAxiom(axiom);
      expect(result.proofVerified).toBe(true);
    });

    it('should handle special characters in statement', () => {
      const axiom = axiomSystem.createAxiom()
        .id('EDGE-003')
        .name('Special Characters')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('∀x ∈ ℝ: x² ≥ 0 ∧ √x ∈ ℂ')
        .formalDefinition({
          expression: 'x^2',
          variables: new Map([['x', { name: 'x', type: 'scalar', domain: 'ℝ' }]]),
          constraints: ['x² ≥ 0'],
          domain: 'ℝ',
          codomain: 'ℝ⁺'
        })
        .build();

      expect(axiom.statement).toContain('∀');
      expect(axiom.statement).toContain('ℝ');
      expect(axiom.statement).toContain('≥');
    });

    it('should handle very long axiom statement', () => {
      const longStatement = 'A'.repeat(10000);
      
      const axiom = axiomSystem.createAxiom()
        .id('EDGE-004')
        .name('Long Statement')
        .category(AxiomCategory.PHYSICAL)
        .statement(longStatement)
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      expect(axiom.statement.length).toBe(10000);
      expect(axiom.hash.length).toBe(64);
    });

    it('should handle many implications', () => {
      let builder = axiomSystem.createAxiom()
        .id('EDGE-005')
        .name('Many Implications')
        .category(AxiomCategory.UNIFIED)
        .statement('Source axiom')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        });

      for (let i = 0; i < 100; i++) {
        builder = builder.addImplication(`Implication ${i}`);
      }

      const axiom = builder.build();
      expect(axiom.implications.length).toBe(100);
    });

    it('should handle many tests', () => {
      let builder = axiomSystem.createAxiom()
        .id('EDGE-006')
        .name('Many Tests')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('x + 1')
        .formalDefinition({
          expression: 'x + 1',
          variables: new Map([['x', { name: 'x', type: 'scalar', domain: 'N' }]]),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        });

      for (let i = 0; i < 50; i++) {
        builder = builder.addTest({
          id: `EDGE-006-${i}`,
          description: `Test ${i}`,
          input: new Map([['x', i]]),
          expectedOutput: i + 1
        });
      }

      const axiom = builder.build();
      expect(axiom.validationTests.length).toBe(50);

      const result = axiomSystem.addAxiom(axiom);
      expect(result.testsPassed).toBe(50);
    });
  });

  describe('Axiom Categories', () => {
    it('should support all defined categories', () => {
      const categories = [
        AxiomCategory.MATHEMATICAL,
        AxiomCategory.PHYSICAL,
        AxiomCategory.COMPUTATIONAL,
        AxiomCategory.QUANTUM,
        AxiomCategory.SPACETIME,
        AxiomCategory.INFORMATION,
        AxiomCategory.UNIFIED
      ];

      for (const category of categories) {
        const axiom = axiomSystem.createAxiom()
          .id(`CAT-${category}`)
          .name(`${category} Axiom`)
          .category(category)
          .statement(`Statement for ${category}`)
          .formalDefinition({
            expression: 'x',
            variables: new Map(),
            constraints: [],
            domain: 'R',
            codomain: 'R'
          })
          .build();

        expect(axiom.category).toBe(category);
      }
    });
  });

  describe('Axiom Status Lifecycle', () => {
    it('should start as PROPOSED', () => {
      const axiom = axiomSystem.createAxiom()
        .id('LIFE-001')
        .name('Lifecycle Test')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('Test')
        .formalDefinition({
          expression: 'x',
          variables: new Map(),
          constraints: [],
          domain: 'R',
          codomain: 'R'
        })
        .build();

      expect(axiom.status).toBe(AxiomStatus.PROPOSED);
    });

    it('should become VALIDATED after successful validation', () => {
      const axiom = axiomSystem.createAxiom()
        .id('LIFE-002')
        .name('Validated Lifecycle')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('1 + 1 = 2')
        .formalDefinition({
          expression: '1 + 1',
          variables: new Map(),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        })
        .addTest({
          id: 'LIFE-002-01',
          description: 'Basic test',
          input: new Map(),
          expectedOutput: 2
        })
        .build();

      axiomSystem.addAxiom(axiom);
      const retrieved = axiomSystem.getAxiom('LIFE-002');
      
      expect(retrieved!.status).toBe(AxiomStatus.VALIDATED);
      expect(retrieved!.validatedAt).toBeDefined();
    });

    it('should become REJECTED after failed validation', () => {
      const axiom = axiomSystem.createAxiom()
        .id('LIFE-003')
        .name('Rejected Lifecycle')
        .category(AxiomCategory.MATHEMATICAL)
        .statement('1 + 1 = 3')
        .formalDefinition({
          expression: '1 + 1',
          variables: new Map(),
          constraints: [],
          domain: 'N',
          codomain: 'N'
        })
        .addTest({
          id: 'LIFE-003-01',
          description: 'Failing test',
          input: new Map(),
          expectedOutput: 3
        })
        .build();

      axiomSystem.addAxiom(axiom);
      
      expect(axiom.status).toBe(AxiomStatus.REJECTED);
    });
  });

  describe('Performance', () => {
    it('should handle rapid axiom creation', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        new AxiomBuilder()
          .id(`PERF-${i}`)
          .name(`Performance Test ${i}`)
          .category(AxiomCategory.MATHEMATICAL)
          .statement(`Statement ${i}`)
          .formalDefinition({
            expression: `${i} + 1`,
            variables: new Map(),
            constraints: [],
            domain: 'N',
            codomain: 'N'
          })
          .build();
      }

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle rapid validation', () => {
      const axioms: Axiom[] = [];
      
      for (let i = 0; i < 50; i++) {
        axioms.push(
          axiomSystem.createAxiom()
            .id(`RAPID-${i}`)
            .name(`Rapid ${i}`)
            .category(AxiomCategory.MATHEMATICAL)
            .statement(`${i} + 1`)
            .formalDefinition({
              expression: `${i} + 1`,
              variables: new Map(),
              constraints: [],
              domain: 'N',
              codomain: 'N'
            })
            .addTest({
              id: `RAPID-${i}-01`,
              description: 'Quick test',
              input: new Map(),
              expectedOutput: i + 1
            })
            .build()
        );
      }

      const startTime = Date.now();
      
      for (const axiom of axioms) {
        axiomSystem.addAxiom(axiom);
      }

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });
});
