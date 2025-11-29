/**
 * Tests for DimensionTester Module (M07.02)
 */

import {
  DimensionTester,
  DimensionTesterFactory,
  DimensionalAnalyzer,
  ConsistencyChecker,
  PhysicalDimension,
  ConsistencyResult,
  DimensionalExponents,
  CommonDimensions,
  DIMENSIONLESS
} from '../../../src/testing/dimensions/DimensionTester';
import { FormulaEngine, ParameterType, Formula } from '../../../src/testing/formula/FormulaEngine';

describe('DimensionTester Module (M07.02)', () => {
  describe('DimensionalAnalyzer Class', () => {
    let analyzer: DimensionalAnalyzer;

    beforeEach(() => {
      analyzer = new DimensionalAnalyzer();
    });

    it('should analyze dimensionally consistent formula', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula(
        'force',
        'F = m * a',
        (p) => (p.get('m') || 0) * (p.get('a') || 0)
      );
      formula.addParameter({ name: 'm', type: ParameterType.SCALAR, value: 1 });
      formula.addParameter({ name: 'a', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('m', CommonDimensions.MASS);
      paramDims.set('a', CommonDimensions.ACCELERATION);

      const result = analyzer.analyze(formula, paramDims, CommonDimensions.FORCE);
      expect(result.isConsistent).toBe(true);
      expect(result.consistencyResult).toBe(ConsistencyResult.CONSISTENT);
    });

    it('should detect dimensionally inconsistent formula', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula(
        'wrong',
        'E = m',  // Wrong: should be m*c²
        (p) => p.get('m') || 0
      );
      formula.addParameter({ name: 'm', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('m', CommonDimensions.MASS);

      const result = analyzer.analyze(formula, paramDims, CommonDimensions.ENERGY);
      expect(result.isConsistent).toBe(false);
      expect(result.consistencyResult).toBe(ConsistencyResult.INCONSISTENT);
    });

    it('should multiply dimensions correctly', () => {
      const result = analyzer.multiplyDimensions(
        CommonDimensions.MASS,
        CommonDimensions.VELOCITY
      );
      expect(result).toEqual(CommonDimensions.MOMENTUM);
    });

    it('should divide dimensions correctly', () => {
      const result = analyzer.divideDimensions(
        CommonDimensions.MOMENTUM,
        CommonDimensions.MASS
      );
      expect(result).toEqual(CommonDimensions.VELOCITY);
    });

    it('should calculate power of dimensions', () => {
      const result = analyzer.powerDimension(CommonDimensions.LENGTH, 2);
      expect(result.L).toBe(2);
      expect(result.M).toBe(0);
      expect(result.T).toBe(0);
    });

    it('should convert dimensions to string', () => {
      const str = analyzer.dimensionToString(CommonDimensions.FORCE);
      expect(str).toContain('L^1');
      expect(str).toContain('M^1');
      expect(str).toContain('T^-2');
    });

    it('should convert dimensionless to string "1"', () => {
      const str = analyzer.dimensionToString(DIMENSIONLESS);
      expect(str).toBe('1');
    });

    it('should parse dimension string', () => {
      const dim = analyzer.parseDimension('L^2 M^1 T^-2');
      expect(dim.L).toBe(2);
      expect(dim.M).toBe(1);
      expect(dim.T).toBe(-2);
    });

    it('should check dimensions equality', () => {
      expect(analyzer.dimensionsEqual(
        CommonDimensions.ENERGY,
        CommonDimensions.ENERGY
      )).toBe(true);
      
      expect(analyzer.dimensionsEqual(
        CommonDimensions.ENERGY,
        CommonDimensions.POWER
      )).toBe(false);
    });

    it('should track analyses', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      analyzer.analyze(formula, paramDims, DIMENSIONLESS);
      expect(analyzer.getAnalyses().length).toBe(1);
    });

    it('should clear analyses', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      analyzer.analyze(formula, paramDims, DIMENSIONLESS);
      analyzer.clear();
      expect(analyzer.getAnalyses().length).toBe(0);
    });

    it('should generate hash for analysis', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = analyzer.analyze(formula, paramDims, DIMENSIONLESS);
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(16);
    });
  });

  describe('ConsistencyChecker Class', () => {
    let checker: ConsistencyChecker;

    beforeEach(() => {
      checker = new ConsistencyChecker();
    });

    it('should check consistency across dimension range', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = checker.check(
        formula,
        [3, 4, 5],
        paramDims,
        DIMENSIONLESS
      );

      expect(result.dimensionRange).toEqual([3, 4, 5]);
      expect(result.overallConsistency).toBeDefined();
    });

    it('should identify consistent dimensions', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = checker.check(
        formula,
        [3, 4, 5],
        paramDims,
        DIMENSIONLESS
      );

      expect(result.consistentDimensions.length).toBeGreaterThan(0);
    });

    it('should get analyzer', () => {
      expect(checker.getAnalyzer()).toBeInstanceOf(DimensionalAnalyzer);
    });

    it('should track checks', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      checker.check(formula, [3, 4], paramDims, DIMENSIONLESS);
      expect(checker.getChecks().length).toBe(1);
    });

    it('should clear checks', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      checker.check(formula, [3, 4], paramDims, DIMENSIONLESS);
      checker.clear();
      expect(checker.getChecks().length).toBe(0);
    });

    it('should generate hash for check', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = checker.check(formula, [3, 4], paramDims, DIMENSIONLESS);
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(16);
    });
  });

  describe('DimensionTester Class', () => {
    let tester: DimensionTester;
    let engine: FormulaEngine;

    beforeEach(() => {
      engine = new FormulaEngine();
      tester = new DimensionTester(engine);
    });

    it('should test formula at specific dimension', () => {
      const formula = engine.createFormula('test', 'x * 2', (p) => (p.get('x') || 0) * 2);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.test(formula, 3, paramDims, DIMENSIONLESS);
      expect(result.dimensions).toBe(3);
      expect(result.result).toBe(10);
    });

    it('should mark valid results correctly', () => {
      const formula = engine.createFormula('valid', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.test(formula, 3, paramDims, DIMENSIONLESS);
      expect(result.isValid).toBe(true);
    });

    it('should sweep across dimension range', () => {
      const formula = engine.createFormula('sweep', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.sweep(formula, 3, 7, paramDims, DIMENSIONLESS);
      expect(result.results.length).toBe(5); // 3, 4, 5, 6, 7
      expect(result.dimensionRange.min).toBe(3);
      expect(result.dimensionRange.max).toBe(7);
    });

    it('should calculate success rate in sweep', () => {
      const formula = engine.createFormula('sweep', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.sweep(formula, 3, 5, paramDims, DIMENSIONLESS);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
    });

    it('should track valid and invalid dimensions in sweep', () => {
      const formula = engine.createFormula('sweep', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.sweep(formula, 3, 5, paramDims, DIMENSIONLESS);
      expect(result.validDimensions.length + result.invalidDimensions.length).toBe(3);
    });

    it('should calculate statistics in sweep', () => {
      const formula = engine.createFormula('sweep', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.sweep(formula, 3, 5, paramDims, DIMENSIONLESS);
      expect(result.statistics.totalTests).toBe(3);
      expect(result.statistics.avgExecutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should analyze formula dimensions', () => {
      const formula = engine.createFormula('analyze', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', CommonDimensions.LENGTH);

      const result = tester.analyze(formula, paramDims, CommonDimensions.LENGTH);
      expect(result.formulaName).toBe('analyze');
    });

    it('should check consistency across dimensions', () => {
      const formula = engine.createFormula('check', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.checkConsistency(
        formula,
        [3, 4, 5],
        paramDims,
        DIMENSIONLESS
      );
      expect(result.dimensionRange).toEqual([3, 4, 5]);
    });

    it('should get formula engine', () => {
      expect(tester.getEngine()).toBe(engine);
    });

    it('should get dimensional analyzer', () => {
      expect(tester.getAnalyzer()).toBeInstanceOf(DimensionalAnalyzer);
    });

    it('should get consistency checker', () => {
      expect(tester.getChecker()).toBeInstanceOf(ConsistencyChecker);
    });

    it('should get test results', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      tester.test(formula, 3, paramDims, DIMENSIONLESS);
      expect(tester.getTestResults().length).toBe(1);
    });

    it('should get sweep results', () => {
      const formula = engine.createFormula('sweep', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      tester.sweep(formula, 3, 5, paramDims, DIMENSIONLESS);
      expect(tester.getSweepResults().length).toBe(1);
    });

    it('should get statistics', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      tester.test(formula, 3, paramDims, DIMENSIONLESS);
      tester.sweep(formula, 3, 5, paramDims, DIMENSIONLESS);

      const stats = tester.getStatistics();
      expect(stats.totalTests).toBe(4); // 1 + 3 from sweep
      expect(stats.sweepCount).toBe(1);
    });

    it('should clear all data', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      tester.test(formula, 3, paramDims, DIMENSIONLESS);
      tester.sweep(formula, 3, 5, paramDims, DIMENSIONLESS);
      tester.clear();

      expect(tester.getTestResults().length).toBe(0);
      expect(tester.getSweepResults().length).toBe(0);
    });

    it('should export to JSON', () => {
      const json = tester.toJSON();
      expect(json).toHaveProperty('testResults');
      expect(json).toHaveProperty('sweepResults');
      expect(json).toHaveProperty('statistics');
    });

    it('should generate proof chain hash', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      tester.test(formula, 3, paramDims, DIMENSIONLESS);
      const hash = tester.generateProofChainHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('should track execution time', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.test(formula, 3, paramDims, DIMENSIONLESS);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate hash for test result', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.test(formula, 3, paramDims, DIMENSIONLESS);
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBe(16);
    });
  });

  describe('DimensionTesterFactory', () => {
    it('should create tester without engine', () => {
      const tester = DimensionTesterFactory.create();
      expect(tester).toBeInstanceOf(DimensionTester);
    });

    it('should create tester with engine', () => {
      const engine = new FormulaEngine();
      const tester = DimensionTesterFactory.create(engine);
      expect(tester.getEngine()).toBe(engine);
    });

    it('should create tester with physics formulas', () => {
      const tester = DimensionTesterFactory.createWithPhysics();
      const formulas = tester.getEngine().getAllFormulas();
      expect(formulas.length).toBe(2);
    });
  });

  describe('CommonDimensions Constants', () => {
    it('should have correct length dimension', () => {
      expect(CommonDimensions.LENGTH.L).toBe(1);
      expect(CommonDimensions.LENGTH.M).toBe(0);
      expect(CommonDimensions.LENGTH.T).toBe(0);
    });

    it('should have correct velocity dimension', () => {
      expect(CommonDimensions.VELOCITY.L).toBe(1);
      expect(CommonDimensions.VELOCITY.T).toBe(-1);
    });

    it('should have correct force dimension', () => {
      expect(CommonDimensions.FORCE.L).toBe(1);
      expect(CommonDimensions.FORCE.M).toBe(1);
      expect(CommonDimensions.FORCE.T).toBe(-2);
    });

    it('should have correct energy dimension', () => {
      expect(CommonDimensions.ENERGY.L).toBe(2);
      expect(CommonDimensions.ENERGY.M).toBe(1);
      expect(CommonDimensions.ENERGY.T).toBe(-2);
    });

    it('should have correct power dimension', () => {
      expect(CommonDimensions.POWER.L).toBe(2);
      expect(CommonDimensions.POWER.M).toBe(1);
      expect(CommonDimensions.POWER.T).toBe(-3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty parameter dimensions', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('const', '5', () => 5);

      const tester = new DimensionTester(engine);
      const result = tester.test(formula, 3, new Map(), DIMENSIONLESS);
      
      expect(result.result).toBe(5);
    });

    it('should handle single dimension sweep', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const tester = new DimensionTester(engine);
      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result = tester.sweep(formula, 4, 4, paramDims, DIMENSIONLESS);
      expect(result.results.length).toBe(1);
    });

    it('should handle complex dimensional expressions', () => {
      const analyzer = new DimensionalAnalyzer();
      
      // E = mv²/2 → Energy dimension
      const kineticEnergy = analyzer.multiplyDimensions(
        CommonDimensions.MASS,
        analyzer.powerDimension(CommonDimensions.VELOCITY, 2)
      );
      
      expect(analyzer.dimensionsEqual(kineticEnergy, CommonDimensions.ENERGY)).toBe(true);
    });

    it('should handle formula with NaN result', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('nan', 'x', () => NaN);

      const tester = new DimensionTester(engine);
      const result = tester.test(formula, 3, new Map(), DIMENSIONLESS);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('Hash Verification', () => {
    it('should generate different hashes for different test results', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const tester = new DimensionTester(engine);
      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const result1 = tester.test(formula, 3, paramDims, DIMENSIONLESS);
      formula.setParameter('x', 2);
      const result2 = tester.test(formula, 4, paramDims, DIMENSIONLESS);

      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should generate unique sweep hashes', () => {
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const tester = new DimensionTester(engine);
      const paramDims = new Map<string, DimensionalExponents>();
      paramDims.set('x', DIMENSIONLESS);

      const sweep1 = tester.sweep(formula, 3, 5, paramDims, DIMENSIONLESS);
      formula.setParameter('x', 10);
      const sweep2 = tester.sweep(formula, 6, 8, paramDims, DIMENSIONLESS);

      expect(sweep1.hash).not.toBe(sweep2.hash);
    });
  });
});
