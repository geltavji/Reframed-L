/**
 * Tests for FormulaEngine Module (M07.01)
 */

import {
  FormulaEngine,
  FormulaEngineFactory,
  Formula,
  ParameterSpaceExplorer,
  ValidationPipeline,
  ParameterType,
  OperationType,
  ValidationStatus,
  Parameter,
  ParameterDefinition,
  SpaceConstraint,
  FormulaTemplate,
  EvaluationResult,
  ParameterSpace
} from '../../../src/testing/formula/FormulaEngine';

describe('FormulaEngine Module (M07.01)', () => {
  describe('Formula Class', () => {
    it('should create a formula with evaluator', () => {
      const formula = new Formula(
        'test-formula',
        'a + b',
        (params) => (params.get('a') || 0) + (params.get('b') || 0)
      );

      expect(formula.getName()).toBe('test-formula');
      expect(formula.getExpression()).toBe('a + b');
      expect(formula.getId()).toBeDefined();
    });

    it('should add parameters', () => {
      const formula = new Formula('test', 'x * 2', (p) => (p.get('x') || 0) * 2);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const params = formula.getParameters();
      expect(params.has('x')).toBe(true);
      expect(params.get('x')?.value).toBe(5);
    });

    it('should set parameter values', () => {
      const formula = new Formula('test', 'x * 2', (p) => (p.get('x') || 0) * 2);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      expect(formula.setParameter('x', 10)).toBe(true);
      expect(formula.getParameters().get('x')?.value).toBe(10);
    });

    it('should return false for non-existent parameter', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      expect(formula.setParameter('y', 10)).toBe(false);
    });

    it('should enforce parameter constraints - minimum', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({
        name: 'x',
        type: ParameterType.SCALAR,
        value: 5,
        constraints: { min: 0 }
      });

      expect(formula.setParameter('x', -1)).toBe(false);
      expect(formula.setParameter('x', 0)).toBe(true);
    });

    it('should enforce parameter constraints - maximum', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({
        name: 'x',
        type: ParameterType.SCALAR,
        value: 5,
        constraints: { max: 100 }
      });

      expect(formula.setParameter('x', 101)).toBe(false);
      expect(formula.setParameter('x', 100)).toBe(true);
    });

    it('should enforce parameter constraints - nonZero', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({
        name: 'x',
        type: ParameterType.SCALAR,
        value: 5,
        constraints: { nonZero: true }
      });

      expect(formula.setParameter('x', 0)).toBe(false);
      expect(formula.setParameter('x', 1)).toBe(true);
    });

    it('should enforce parameter constraints - positive', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({
        name: 'x',
        type: ParameterType.SCALAR,
        value: 5,
        constraints: { positive: true }
      });

      expect(formula.setParameter('x', 0)).toBe(false);
      expect(formula.setParameter('x', -1)).toBe(false);
      expect(formula.setParameter('x', 1)).toBe(true);
    });

    it('should enforce parameter constraints - integer', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({
        name: 'x',
        type: ParameterType.SCALAR,
        value: 5,
        constraints: { integer: true }
      });

      expect(formula.setParameter('x', 5.5)).toBe(false);
      expect(formula.setParameter('x', 5)).toBe(true);
    });

    it('should evaluate formula correctly', () => {
      const formula = new Formula(
        'add',
        'a + b',
        (p) => (p.get('a') || 0) + (p.get('b') || 0)
      );
      formula.addParameter({ name: 'a', type: ParameterType.SCALAR, value: 3 });
      formula.addParameter({ name: 'b', type: ParameterType.SCALAR, value: 7 });

      const result = formula.evaluate();
      expect(result.result).toBe(10);
      expect(result.status).toBe(ValidationStatus.VALID);
    });

    it('should detect numerical errors', () => {
      const formula = new Formula(
        'divide',
        'a / b',
        (p) => (p.get('a') || 0) / (p.get('b') || 0)
      );
      formula.addParameter({ name: 'a', type: ParameterType.SCALAR, value: 1 });
      formula.addParameter({ name: 'b', type: ParameterType.SCALAR, value: 0 });

      const result = formula.evaluate();
      expect(result.status).toBe(ValidationStatus.NUMERICAL_ERROR);
    });

    it('should create template from formula', () => {
      const formula = new Formula(
        'multiply',
        'a * b + sqrt(c)',
        (p) => (p.get('a') || 0) * (p.get('b') || 0) + Math.sqrt(p.get('c') || 0)
      );
      formula.addParameter({ name: 'a', type: ParameterType.SCALAR, value: 2 });
      formula.addParameter({ name: 'b', type: ParameterType.SCALAR, value: 3 });
      formula.addParameter({ name: 'c', type: ParameterType.SCALAR, value: 4 });

      const template = formula.toTemplate();
      expect(template.name).toBe('multiply');
      expect(template.parameters).toContain('a');
      expect(template.parameters).toContain('b');
      expect(template.parameters).toContain('c');
      expect(template.operations).toContain(OperationType.MULTIPLY);
      expect(template.operations).toContain(OperationType.ADD);
      expect(template.operations).toContain(OperationType.SQRT);
    });

    it('should track execution time', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const result = formula.evaluate();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate unique hash for result', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const result = formula.evaluate();
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(16);
    });
  });

  describe('ParameterSpaceExplorer Class', () => {
    it('should create parameter space', () => {
      const explorer = new ParameterSpaceExplorer();
      const space = explorer.createSpace('test-space', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 10, step: 1 } }
      ]);

      expect(space.name).toBe('test-space');
      expect(space.dimensions).toBe(1);
      expect(space.totalPoints).toBe(11);
    });

    it('should calculate total points correctly for multi-dimensional space', () => {
      const explorer = new ParameterSpaceExplorer();
      const space = explorer.createSpace('2d-space', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 2, step: 1 } },
        { name: 'y', type: ParameterType.SCALAR, range: { min: 0, max: 2, step: 1 } }
      ]);

      expect(space.dimensions).toBe(2);
      expect(space.totalPoints).toBe(9); // 3 * 3
    });

    it('should explore parameter space', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula(
        'linear',
        'x * 2',
        (p) => (p.get('x') || 0) * 2
      );
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = explorer.createSpace('linear-space', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 5, step: 1 } }
      ]);

      const result = explorer.explore(formula, space, 100);
      expect(result.evaluations.length).toBeGreaterThan(0);
      expect(result.validCount).toBeGreaterThan(0);
    });

    it('should calculate statistics from exploration', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('identity', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = explorer.createSpace('test', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 1, max: 5, step: 1 } }
      ]);

      const result = explorer.explore(formula, space, 100);
      expect(result.statistics.mean).toBeCloseTo(3, 0); // (1+2+3+4+5)/5 = 3
      expect(result.statistics.min).toBe(1);
      expect(result.statistics.max).toBe(5);
    });

    it('should find best and worst results', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('square', 'x^2', (p) => Math.pow(p.get('x') || 0, 2));
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = explorer.createSpace('test', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 1, max: 3, step: 1 } }
      ]);

      const result = explorer.explore(formula, space, 100);
      expect(result.bestResult?.result).toBe(1);  // 1^2 = 1
      expect(result.worstResult?.result).toBe(9); // 3^2 = 9
    });

    it('should support logarithmic distribution', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('log', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const space = explorer.createSpace('log-space', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 1, max: 1000, step: 100 }, distribution: 'logarithmic' }
      ]);

      const result = explorer.explore(formula, space, 50);
      expect(result.evaluations.length).toBeGreaterThan(0);
    });

    it('should support gaussian distribution', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('gauss', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = explorer.createSpace('gauss-space', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: -10, max: 10, step: 1 }, distribution: 'gaussian' }
      ]);

      const result = explorer.explore(formula, space, 50);
      // Most values should be near the center due to gaussian distribution
      expect(result.evaluations.length).toBeGreaterThan(0);
    });

    it('should respect constraints during exploration', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('constrained', 'x + y', (p) => (p.get('x') || 0) + (p.get('y') || 0));
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });
      formula.addParameter({ name: 'y', type: ParameterType.SCALAR, value: 0 });

      const constraint: SpaceConstraint = {
        type: 'inequality',
        expression: 'x + y < 10',
        validate: (params) => (params.get('x') || 0) + (params.get('y') || 0) < 10
      };

      const space = explorer.createSpace('constrained-space', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 5, step: 1 } },
        { name: 'y', type: ParameterType.SCALAR, range: { min: 0, max: 5, step: 1 } }
      ], [constraint]);

      const result = explorer.explore(formula, space, 100);
      // All valid results should have sum < 10
      for (const eval_ of result.evaluations) {
        if (eval_.status === ValidationStatus.VALID) {
          expect(eval_.result as number).toBeLessThan(10);
        }
      }
    });

    it('should get all explorations', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = explorer.createSpace('test', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 2, step: 1 } }
      ]);

      explorer.explore(formula, space, 10);
      explorer.explore(formula, space, 10);

      expect(explorer.getExplorations().length).toBe(2);
    });

    it('should clear explorations', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = explorer.createSpace('test', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 2, step: 1 } }
      ]);

      explorer.explore(formula, space, 10);
      explorer.clear();

      expect(explorer.getExplorations().length).toBe(0);
    });

    it('should generate hash for exploration', () => {
      const explorer = new ParameterSpaceExplorer();
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = explorer.createSpace('test', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 2, step: 1 } }
      ]);

      const result = explorer.explore(formula, space, 10);
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(16);
    });
  });

  describe('ValidationPipeline Class', () => {
    it('should validate valid results', () => {
      const pipeline = new ValidationPipeline();
      const result: EvaluationResult = {
        formulaId: 'test',
        parameters: new Map(),
        result: 10,
        status: ValidationStatus.VALID,
        executionTime: 1,
        hash: 'abc123'
      };

      const status = pipeline.validate(result);
      expect(status).toBe(ValidationStatus.VALID);
    });

    it('should pass through invalid status', () => {
      const pipeline = new ValidationPipeline();
      const result: EvaluationResult = {
        formulaId: 'test',
        parameters: new Map(),
        result: null,
        status: ValidationStatus.NUMERICAL_ERROR,
        executionTime: 1,
        hash: 'abc123'
      };

      const status = pipeline.validate(result);
      expect(status).toBe(ValidationStatus.NUMERICAL_ERROR);
    });

    it('should validate against expected range', () => {
      const pipeline = new ValidationPipeline();
      const result: EvaluationResult = {
        formulaId: 'test',
        parameters: new Map(),
        result: 50,
        status: ValidationStatus.VALID,
        executionTime: 1,
        hash: 'abc123'
      };

      expect(pipeline.validate(result, { min: 0, max: 100 })).toBe(ValidationStatus.VALID);
      expect(pipeline.validate(result, { min: 0, max: 40 })).toBe(ValidationStatus.INVALID);
    });

    it('should batch validate results', () => {
      const pipeline = new ValidationPipeline();
      const results: EvaluationResult[] = [
        { formulaId: 'test1', parameters: new Map(), result: 10, status: ValidationStatus.VALID, executionTime: 1, hash: 'hash1' },
        { formulaId: 'test2', parameters: new Map(), result: 20, status: ValidationStatus.VALID, executionTime: 1, hash: 'hash2' },
        { formulaId: 'test3', parameters: new Map(), result: null, status: ValidationStatus.INVALID, executionTime: 1, hash: 'hash3' }
      ];

      const validations = pipeline.batchValidate(results);
      expect(validations.get('hash1')).toBe(ValidationStatus.VALID);
      expect(validations.get('hash2')).toBe(ValidationStatus.VALID);
      expect(validations.get('hash3')).toBe(ValidationStatus.INVALID);
    });

    it('should track validation history', () => {
      const pipeline = new ValidationPipeline();
      const result: EvaluationResult = {
        formulaId: 'test',
        parameters: new Map(),
        result: 10,
        status: ValidationStatus.VALID,
        executionTime: 1,
        hash: 'abc123'
      };

      pipeline.validate(result);
      pipeline.validate(result);

      const history = pipeline.getValidationHistory('test');
      expect(history.length).toBe(2);
      expect(history[0]).toBe(ValidationStatus.VALID);
    });

    it('should get validation statistics', () => {
      const pipeline = new ValidationPipeline();
      const validResult: EvaluationResult = {
        formulaId: 'test',
        parameters: new Map(),
        result: 10,
        status: ValidationStatus.VALID,
        executionTime: 1,
        hash: 'abc123'
      };
      const invalidResult: EvaluationResult = {
        formulaId: 'test2',
        parameters: new Map(),
        result: null,
        status: ValidationStatus.INVALID,
        executionTime: 1,
        hash: 'def456'
      };

      pipeline.validate(validResult);
      pipeline.validate(validResult);
      pipeline.validate(invalidResult);

      const stats = pipeline.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(2);
      expect(stats.invalid).toBe(1);
      expect(stats.errorRate).toBeCloseTo(1/3, 5);
    });

    it('should clear validation history', () => {
      const pipeline = new ValidationPipeline();
      const result: EvaluationResult = {
        formulaId: 'test',
        parameters: new Map(),
        result: 10,
        status: ValidationStatus.VALID,
        executionTime: 1,
        hash: 'abc123'
      };

      pipeline.validate(result);
      pipeline.clear();

      expect(pipeline.getValidationHistory('test').length).toBe(0);
    });
  });

  describe('FormulaEngine Class', () => {
    let engine: FormulaEngine;

    beforeEach(() => {
      engine = new FormulaEngine();
    });

    it('should create formulas', () => {
      const formula = engine.createFormula(
        'test',
        'x + y',
        (p) => (p.get('x') || 0) + (p.get('y') || 0)
      );

      expect(formula).toBeDefined();
      expect(formula.getName()).toBe('test');
    });

    it('should register pre-built formulas', () => {
      const formula = new Formula('external', 'a * b', (p) => (p.get('a') || 0) * (p.get('b') || 0));
      engine.registerFormula(formula);

      expect(engine.getFormula(formula.getId())).toBe(formula);
    });

    it('should get formula by ID', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      expect(engine.getFormula(formula.getId())).toBe(formula);
    });

    it('should get all formulas', () => {
      engine.createFormula('test1', 'x', (p) => p.get('x') || 0);
      engine.createFormula('test2', 'y', (p) => p.get('y') || 0);

      expect(engine.getAllFormulas().length).toBe(2);
    });

    it('should create parameter space', () => {
      const space = engine.createParameterSpace('test-space', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 10, step: 1 } }
      ]);

      expect(space.name).toBe('test-space');
      expect(space.dimensions).toBe(1);
    });

    it('should explore parameter space', () => {
      const formula = engine.createFormula('linear', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const space = engine.createParameterSpace('test', [
        { name: 'x', type: ParameterType.SCALAR, range: { min: 0, max: 5, step: 1 } }
      ]);

      const result = engine.exploreSpace(formula, space, 100);
      expect(result.evaluations.length).toBeGreaterThan(0);
    });

    it('should evaluate formula', () => {
      const formula = engine.createFormula('add', 'a + b', (p) => (p.get('a') || 0) + (p.get('b') || 0));
      formula.addParameter({ name: 'a', type: ParameterType.SCALAR, value: 3 });
      formula.addParameter({ name: 'b', type: ParameterType.SCALAR, value: 7 });

      const result = engine.evaluate(formula);
      expect(result.result).toBe(10);
    });

    it('should validate results', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 50 });

      const result = engine.evaluate(formula);
      expect(engine.validate(result, { min: 0, max: 100 })).toBe(ValidationStatus.VALID);
    });

    it('should get templates', () => {
      engine.createFormula('test', 'x + y', (p) => (p.get('x') || 0) + (p.get('y') || 0));
      expect(engine.getAllTemplates().length).toBe(1);
    });

    it('should get explorer', () => {
      expect(engine.getExplorer()).toBeInstanceOf(ParameterSpaceExplorer);
    });

    it('should get validator', () => {
      expect(engine.getValidator()).toBeInstanceOf(ValidationPipeline);
    });

    it('should get evaluation history', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      engine.evaluate(formula);
      engine.evaluate(formula);

      expect(engine.getEvaluationHistory().length).toBe(2);
    });

    it('should get statistics', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      engine.evaluate(formula);

      const stats = engine.getStatistics();
      expect(stats.formulaCount).toBe(1);
      expect(stats.evaluationCount).toBe(1);
    });

    it('should clear all data', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });
      engine.evaluate(formula);

      engine.clear();

      expect(engine.getAllFormulas().length).toBe(0);
      expect(engine.getEvaluationHistory().length).toBe(0);
    });

    it('should export to JSON', () => {
      engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      const json = engine.toJSON();

      expect(json).toHaveProperty('formulas');
      expect(json).toHaveProperty('templates');
      expect(json).toHaveProperty('statistics');
    });

    it('should generate proof chain hash', () => {
      engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      const hash = engine.generateProofChainHash();

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });
  });

  describe('FormulaEngineFactory', () => {
    it('should create engine without logger', () => {
      const engine = FormulaEngineFactory.create();
      expect(engine).toBeInstanceOf(FormulaEngine);
    });

    it('should create engine with physics formulas', () => {
      const engine = FormulaEngineFactory.createWithPhysicsFormulas();
      const formulas = engine.getAllFormulas();

      expect(formulas.length).toBe(3);
      expect(formulas.some(f => f.getName() === 'mass-energy')).toBe(true);
      expect(formulas.some(f => f.getName() === 'newton-second')).toBe(true);
      expect(formulas.some(f => f.getName() === 'gravitational-force')).toBe(true);
    });

    it('should correctly evaluate E=mc²', () => {
      const engine = FormulaEngineFactory.createWithPhysicsFormulas();
      const formulas = engine.getAllFormulas();
      const emc2 = formulas.find(f => f.getName() === 'mass-energy');

      emc2!.setParameter('m', 1);
      const result = emc2!.evaluate();

      const c = 299792458;
      expect(result.result).toBeCloseTo(c * c, -10);
    });

    it('should correctly evaluate F=ma', () => {
      const engine = FormulaEngineFactory.createWithPhysicsFormulas();
      const formulas = engine.getAllFormulas();
      const fma = formulas.find(f => f.getName() === 'newton-second');

      fma!.setParameter('m', 10);
      fma!.setParameter('a', 5);
      const result = fma!.evaluate();

      expect(result.result).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty parameter map', () => {
      const formula = new Formula('empty', '0', () => 0);
      const result = formula.evaluate();
      expect(result.result).toBe(0);
    });

    it('should handle array parameters', () => {
      const formula = new Formula('array', 'sum', (p) => {
        return p.get('values') || 0;
      });
      formula.addParameter({ name: 'values', type: ParameterType.VECTOR, value: [1, 2, 3] });

      const result = formula.evaluate();
      expect(result.result).toBe(1); // Uses first element
    });

    it('should handle exception in evaluator', () => {
      const formula = new Formula('throw', 'error', () => {
        throw new Error('Test error');
      });

      const result = formula.evaluate();
      expect(result.status).toBe(ValidationStatus.INVALID);
      expect(result.result).toBeNull();
    });

    it('should handle NaN results', () => {
      const formula = new Formula('nan', 'NaN', () => NaN);
      const result = formula.evaluate();
      expect(result.status).toBe(ValidationStatus.UNDEFINED);
    });

    it('should handle empty exploration', () => {
      const explorer = new ParameterSpaceExplorer();
      expect(explorer.getExplorations().length).toBe(0);
    });

    it('should handle validation of null result', () => {
      const pipeline = new ValidationPipeline();
      const result: EvaluationResult = {
        formulaId: 'test',
        parameters: new Map(),
        result: null,
        status: ValidationStatus.VALID, // But result is null
        executionTime: 1,
        hash: 'abc123'
      };

      const status = pipeline.validate(result);
      expect(status).toBe(ValidationStatus.INVALID);
    });
  });

  describe('Hash Verification', () => {
    it('should generate different hashes for different evaluations', () => {
      const formula = new Formula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const result1 = formula.evaluate();
      formula.setParameter('x', 10);
      const result2 = formula.evaluate();

      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should generate consistent hash for same template', () => {
      const formula = new Formula('test', 'x + y', (p) => (p.get('x') || 0) + (p.get('y') || 0));
      const template1 = formula.toTemplate();
      const template2 = formula.toTemplate();

      expect(template1.hash).toBe(template2.hash);
    });
  });
});
