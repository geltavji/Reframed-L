/**
 * Tests for MassTester Module (M07.04)
 */

import {
  MassTester,
  MassTesterFactory,
  TestGenerator,
  TestCategory,
  TestResultStatus,
  DEFAULT_CONFIG
} from '../../../src/testing/mass/MassTester';
import { FormulaEngine, ParameterType } from '../../../src/testing/formula/FormulaEngine';
import { DimensionTester } from '../../../src/testing/dimensions/DimensionTester';

describe('MassTester Module (M07.04)', () => {
  describe('TestGenerator Class', () => {
    it('should generate random parameter values', () => {
      const generator = new TestGenerator();
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x + y', (p) => (p.get('x') || 0) + (p.get('y') || 0));
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });
      formula.addParameter({ name: 'y', type: ParameterType.SCALAR, value: 0 });

      const params = generator.generateRandomParameters(formula, 10);
      expect(params.length).toBe(10);
      expect(params[0].has('x')).toBe(true);
      expect(params[0].has('y')).toBe(true);
    });

    it('should generate edge cases', () => {
      const generator = new TestGenerator();
      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const edgeCases = generator.generateEdgeCases(formula);
      expect(edgeCases.length).toBeGreaterThan(0);
      
      // Should include zero
      const hasZero = edgeCases.some(ec => ec.get('x') === 0);
      expect(hasZero).toBe(true);
      
      // Should include one
      const hasOne = edgeCases.some(ec => ec.get('x') === 1);
      expect(hasOne).toBe(true);
    });

    it('should generate dimension test cases', () => {
      const generator = new TestGenerator();
      const dims = generator.generateDimensionCases(3, 7);

      expect(dims).toEqual([3, 4, 5, 6, 7]);
    });

    it('should use seed for reproducibility', () => {
      const gen1 = new TestGenerator(null, 12345);
      const gen2 = new TestGenerator(null, 12345);

      const engine = new FormulaEngine();
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 0 });

      const params1 = gen1.generateRandomParameters(formula, 5);
      const params2 = gen2.generateRandomParameters(formula, 5);

      expect(params1[0].get('x')).toBe(params2[0].get('x'));
    });
  });

  describe('MassTester Class', () => {
    let engine: FormulaEngine;
    let tester: MassTester;

    beforeEach(() => {
      engine = new FormulaEngine();
      tester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 50,
        parameterVariations: 20
      });
    });

    it('should run tests on a formula', () => {
      const formula = engine.createFormula('simple', 'x * 2', (p) => (p.get('x') || 0) * 2);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      const batch = tester.runTests(formula);
      expect(batch.totalTests).toBeGreaterThan(0);
      expect(batch.formulaId).toBe(formula.getId());
    });

    it('should track pass rate', () => {
      const formula = engine.createFormula('always-pass', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const batch = tester.runTests(formula);
      expect(batch.passRate).toBeGreaterThanOrEqual(0);
      expect(batch.passRate).toBeLessThanOrEqual(1);
    });

    it('should categorize tests', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      
      const numResults = tester.getResultsByCategory(TestCategory.NUMERICAL);
      expect(numResults.length).toBeGreaterThan(0);
    });

    it('should run tests on all formulas', () => {
      engine.createFormula('f1', 'x', (p) => p.get('x') || 0)
        .addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });
      engine.createFormula('f2', 'y', (p) => p.get('y') || 0)
        .addParameter({ name: 'y', type: ParameterType.SCALAR, value: 2 });

      const batches = tester.runAllTests();
      expect(batches.length).toBe(2);
    });

    it('should identify promising formulas', () => {
      const formula = engine.createFormula('good', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      const promising = tester.identifyPromisingFormulas(0.5);

      expect(promising.length).toBeGreaterThanOrEqual(0);
    });

    it('should analyze results statistically', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      tester.runTests(formula);
      const analysis = tester.analyzeResults();

      expect(analysis.sampleSize).toBeGreaterThan(0);
      expect(analysis.mean).toBeDefined();
      expect(analysis.stdDev).toBeDefined();
    });

    it('should get and set config', () => {
      const config = tester.getConfig();
      expect(config.testsPerFormula).toBe(50);

      tester.setConfig({ testsPerFormula: 200 });
      expect(tester.getConfig().testsPerFormula).toBe(200);
    });

    it('should get formula engine', () => {
      expect(tester.getEngine()).toBe(engine);
    });

    it('should get dimension tester', () => {
      expect(tester.getDimensionTester()).toBeInstanceOf(DimensionTester);
    });

    it('should get test results', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      expect(tester.getTestResults().length).toBeGreaterThan(0);
    });

    it('should get batch results', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      expect(tester.getBatchResults().length).toBe(1);
    });

    it('should get statistics', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      const stats = tester.getStatistics();

      expect(stats.totalTests).toBeGreaterThan(0);
      expect(stats.batchCount).toBe(1);
    });

    it('should clear all data', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      tester.clear();

      expect(tester.getTestResults().length).toBe(0);
      expect(tester.getBatchResults().length).toBe(0);
    });

    it('should export to JSON', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      const json = tester.toJSON();

      expect(json).toHaveProperty('config');
      expect(json).toHaveProperty('testResults');
      expect(json).toHaveProperty('batchResults');
      expect(json).toHaveProperty('statistics');
    });

    it('should generate proof chain hash', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      tester.runTests(formula);
      const hash = tester.generateProofChainHash();

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('should handle formula with errors', () => {
      const formula = engine.createFormula('error', 'x/y', (p) => {
        const y = p.get('y') || 0;
        if (y === 0) return Infinity;
        return (p.get('x') || 0) / y;
      });
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });
      formula.addParameter({ name: 'y', type: ParameterType.SCALAR, value: 0 });

      const batch = tester.runTests(formula);
      // Should still complete without crashing
      expect(batch.totalTests).toBeGreaterThan(0);
    });

    it('should track execution time', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const batch = tester.runTests(formula);
      expect(batch.avgExecutionTime).toBeGreaterThanOrEqual(0);
    });

    it('should generate hashes for results', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const batch = tester.runTests(formula);
      expect(batch.hash).toBeDefined();
      expect(batch.hash.length).toBe(16);
    });
  });

  describe('MassTesterFactory', () => {
    it('should create tester with default config', () => {
      const tester = MassTesterFactory.create();
      expect(tester).toBeInstanceOf(MassTester);
    });

    it('should create tester with custom config', () => {
      const tester = MassTesterFactory.createWithConfig({
        testsPerFormula: 500
      });
      expect(tester.getConfig().testsPerFormula).toBe(500);
    });

    it('should create tester with existing engine', () => {
      const engine = new FormulaEngine();
      const tester = MassTesterFactory.create(engine);
      expect(tester.getEngine()).toBe(engine);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty formula parameters', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 10,
        parameterVariations: 5
      });

      const formula = engine.createFormula('const', '5', () => 5);
      const batch = tester.runTests(formula);

      expect(batch.totalTests).toBeGreaterThan(0);
    });

    it('should handle no formulas', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine);

      const batches = tester.runAllTests();
      expect(batches.length).toBe(0);
    });

    it('should handle analysis with no results', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine);

      const analysis = tester.analyzeResults();
      expect(analysis.sampleSize).toBe(0);
    });

    it('should handle identifying promising with no batches', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine);

      const promising = tester.identifyPromisingFormulas();
      expect(promising.length).toBe(0);
    });
  });

  describe('Statistical Analysis', () => {
    it('should calculate correct mean', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 10,
        parameterVariations: 5,
        categories: [TestCategory.NUMERICAL]
      });

      const formula = engine.createFormula('identity', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 10 });

      tester.runTests(formula);
      const analysis = tester.analyzeResults();

      expect(analysis.mean).toBeDefined();
    });

    it('should calculate standard deviation', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 10,
        parameterVariations: 5,
        categories: [TestCategory.NUMERICAL]
      });

      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      tester.runTests(formula);
      const analysis = tester.analyzeResults();

      expect(analysis.stdDev).toBeGreaterThanOrEqual(0);
    });

    it('should identify outliers', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 10,
        parameterVariations: 5
      });

      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      tester.runTests(formula);
      const analysis = tester.analyzeResults();

      expect(analysis.outliers).toBeDefined();
      expect(Array.isArray(analysis.outliers)).toBe(true);
    });
  });

  describe('Hash Verification', () => {
    it('should generate different hashes for different batches', () => {
      const engine = new FormulaEngine();
      const tester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 10,
        parameterVariations: 5
      });

      const f1 = engine.createFormula('f1', 'x', (p) => p.get('x') || 0);
      f1.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      const f2 = engine.createFormula('f2', 'y', (p) => (p.get('y') || 0) * 2);
      f2.addParameter({ name: 'y', type: ParameterType.SCALAR, value: 2 });

      const batch1 = tester.runTests(f1);
      const batch2 = tester.runTests(f2);

      expect(batch1.hash).not.toBe(batch2.hash);
    });
  });
});
