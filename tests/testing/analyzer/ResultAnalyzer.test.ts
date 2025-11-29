/**
 * Tests for ResultAnalyzer Module (M07.05)
 */

import {
  ResultAnalyzer,
  ResultAnalyzerFactory,
  PatternDetector,
  BreakthroughIdentifier,
  PatternType,
  BreakthroughSeverity
} from '../../../src/testing/analyzer/ResultAnalyzer';
import { 
  MassTester, 
  MassTesterFactory,
  TestCategory,
  TestResultStatus,
  DEFAULT_CONFIG
} from '../../../src/testing/mass/MassTester';
import { FormulaEngine, ParameterType } from '../../../src/testing/formula/FormulaEngine';

describe('ResultAnalyzer Module (M07.05)', () => {
  describe('PatternDetector Class', () => {
    let detector: PatternDetector;

    beforeEach(() => {
      detector = new PatternDetector();
    });

    it('should detect convergence pattern', () => {
      const results = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        formulaId: 'test',
        formulaName: 'test',
        category: TestCategory.NUMERICAL,
        status: TestResultStatus.PASSED,
        inputParameters: new Map([['x', i]]),
        actualOutput: 1 + 0.1 / (i + 1), // Converges to 1
        executionTime: 1,
        hash: `hash${i}`
      }));

      const patterns = detector.detect(results);
      const convergence = patterns.find(p => p.type === PatternType.CONVERGENCE);
      expect(convergence).toBeDefined();
    });

    it('should detect constant pattern', () => {
      const results = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        formulaId: 'const',
        formulaName: 'const',
        category: TestCategory.NUMERICAL,
        status: TestResultStatus.PASSED,
        inputParameters: new Map([['x', i]]),
        actualOutput: 5, // Constant
        executionTime: 1,
        hash: `hash${i}`
      }));

      const patterns = detector.detect(results);
      const constant = patterns.find(p => p.type === PatternType.CONSTANT);
      expect(constant).toBeDefined();
    });

    it('should detect monotonic pattern', () => {
      const results = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        formulaId: 'mono',
        formulaName: 'mono',
        category: TestCategory.NUMERICAL,
        status: TestResultStatus.PASSED,
        inputParameters: new Map([['x', i]]),
        actualOutput: i * 2, // Increasing
        executionTime: 1,
        hash: `hash${i}`
      }));

      const patterns = detector.detect(results);
      const monotonic = patterns.find(p => p.type === PatternType.MONOTONIC);
      expect(monotonic).toBeDefined();
    });

    it('should detect anomalies', () => {
      const results = Array(20).fill(null).map((_, i) => ({
        id: `${i}`,
        formulaId: 'anomaly',
        formulaName: 'anomaly',
        category: TestCategory.NUMERICAL,
        status: TestResultStatus.PASSED,
        inputParameters: new Map([['x', i]]),
        actualOutput: i === 10 ? 1000 : 1, // Anomaly at index 10
        executionTime: 1,
        hash: `hash${i}`
      }));

      const patterns = detector.detect(results);
      const anomaly = patterns.find(p => p.type === PatternType.ANOMALY);
      expect(anomaly).toBeDefined();
    });

    it('should get all patterns', () => {
      const results = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        formulaId: 'test',
        formulaName: 'test',
        category: TestCategory.NUMERICAL,
        status: TestResultStatus.PASSED,
        inputParameters: new Map([['x', i]]),
        actualOutput: 5,
        executionTime: 1,
        hash: `hash${i}`
      }));

      detector.detect(results);
      expect(detector.getPatterns().length).toBeGreaterThan(0);
    });

    it('should clear patterns', () => {
      const results = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        formulaId: 'test',
        formulaName: 'test',
        category: TestCategory.NUMERICAL,
        status: TestResultStatus.PASSED,
        inputParameters: new Map([['x', i]]),
        actualOutput: 5,
        executionTime: 1,
        hash: `hash${i}`
      }));

      detector.detect(results);
      detector.clear();
      expect(detector.getPatterns().length).toBe(0);
    });

    it('should generate hash for patterns', () => {
      const results = Array(10).fill(null).map((_, i) => ({
        id: `${i}`,
        formulaId: 'test',
        formulaName: 'test',
        category: TestCategory.NUMERICAL,
        status: TestResultStatus.PASSED,
        inputParameters: new Map([['x', i]]),
        actualOutput: 5,
        executionTime: 1,
        hash: `hash${i}`
      }));

      const patterns = detector.detect(results);
      if (patterns.length > 0) {
        expect(patterns[0].hash).toBeDefined();
        expect(patterns[0].hash.length).toBe(16);
      }
    });
  });

  describe('BreakthroughIdentifier Class', () => {
    let identifier: BreakthroughIdentifier;

    beforeEach(() => {
      identifier = new BreakthroughIdentifier();
    });

    it('should identify breakthrough from high pass rate', () => {
      const patterns: any[] = [];
      const batchResults = [{
        id: 'batch1',
        formulaId: 'f1',
        totalTests: 100,
        passed: 99,
        failed: 1,
        errors: 0,
        passRate: 0.99,
        avgExecutionTime: 1,
        results: [],
        startTime: new Date(),
        endTime: new Date(),
        hash: 'hash1'
      }];

      const breakthroughs = identifier.identify(patterns, batchResults);
      expect(breakthroughs.length).toBeGreaterThan(0);
    });

    it('should identify breakthrough from convergence pattern', () => {
      const patterns = [{
        id: 'p1',
        type: PatternType.CONVERGENCE,
        formulaId: 'f1',
        formulaName: 'test',
        description: 'Converges to 1',
        confidence: 0.95,
        dataPoints: 100,
        parameters: new Map(),
        startIndex: 0,
        endIndex: 99,
        metadata: {},
        hash: 'hash1'
      }];
      const batchResults: any[] = [];

      const breakthroughs = identifier.identify(patterns, batchResults);
      expect(breakthroughs.some(b => b.severity === BreakthroughSeverity.SIGNIFICANT)).toBe(true);
    });

    it('should get breakthroughs by severity', () => {
      const batchResults = [{
        id: 'batch1',
        formulaId: 'f1',
        totalTests: 100,
        passed: 99,
        failed: 1,
        errors: 0,
        passRate: 0.99,
        avgExecutionTime: 1,
        results: [],
        startTime: new Date(),
        endTime: new Date(),
        hash: 'hash1'
      }];

      identifier.identify([], batchResults);
      const moderate = identifier.getBySeverity(BreakthroughSeverity.MODERATE);
      expect(moderate.length).toBeGreaterThan(0);
    });

    it('should get all breakthroughs', () => {
      const batchResults = [{
        id: 'batch1',
        formulaId: 'f1',
        totalTests: 100,
        passed: 99,
        failed: 1,
        errors: 0,
        passRate: 0.99,
        avgExecutionTime: 1,
        results: [],
        startTime: new Date(),
        endTime: new Date(),
        hash: 'hash1'
      }];

      identifier.identify([], batchResults);
      expect(identifier.getBreakthroughs().length).toBeGreaterThan(0);
    });

    it('should clear breakthroughs', () => {
      const batchResults = [{
        id: 'batch1',
        formulaId: 'f1',
        totalTests: 100,
        passed: 99,
        failed: 1,
        errors: 0,
        passRate: 0.99,
        avgExecutionTime: 1,
        results: [],
        startTime: new Date(),
        endTime: new Date(),
        hash: 'hash1'
      }];

      identifier.identify([], batchResults);
      identifier.clear();
      expect(identifier.getBreakthroughs().length).toBe(0);
    });

    it('should generate hash for breakthroughs', () => {
      const batchResults = [{
        id: 'batch1',
        formulaId: 'f1',
        totalTests: 100,
        passed: 99,
        failed: 1,
        errors: 0,
        passRate: 0.99,
        avgExecutionTime: 1,
        results: [],
        startTime: new Date(),
        endTime: new Date(),
        hash: 'hash1'
      }];

      const breakthroughs = identifier.identify([], batchResults);
      if (breakthroughs.length > 0) {
        expect(breakthroughs[0].hash).toBeDefined();
        expect(breakthroughs[0].hash.length).toBe(16);
      }
    });
  });

  describe('ResultAnalyzer Class', () => {
    let engine: FormulaEngine;
    let massTester: MassTester;
    let analyzer: ResultAnalyzer;

    beforeEach(() => {
      engine = new FormulaEngine();
      massTester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 20,
        parameterVariations: 10
      });
      analyzer = new ResultAnalyzer(massTester);
    });

    it('should perform full analysis', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      const report = analyzer.analyze();

      expect(report.id).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.patterns).toBeDefined();
    });

    it('should generate summary', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      const report = analyzer.analyze();

      expect(report.summary.length).toBeGreaterThan(0);
      expect(report.summary).toContain('test results');
    });

    it('should generate recommendations', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      const report = analyzer.analyze();

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate trend', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const trend = analyzer.calculateTrend(values);

      expect(trend.direction).toBe('increasing');
      expect(trend.slope).toBeCloseTo(1, 2);
      expect(trend.rSquared).toBeCloseTo(1, 2);
    });

    it('should calculate decreasing trend', () => {
      const values = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      const trend = analyzer.calculateTrend(values);

      expect(trend.direction).toBe('decreasing');
      expect(trend.slope).toBeCloseTo(-1, 2);
    });

    it('should calculate stable trend', () => {
      const values = [5, 5, 5, 5, 5];
      const trend = analyzer.calculateTrend(values);

      expect(trend.direction).toBe('stable');
    });

    it('should calculate correlation', () => {
      const param1 = [1, 2, 3, 4, 5];
      const param2 = [2, 4, 6, 8, 10];
      const result = analyzer.calculateCorrelation(param1, param2);

      expect(result.correlation).toBeCloseTo(1, 5);
      expect(result.significance).toBe('perfect');
    });

    it('should calculate negative correlation', () => {
      const param1 = [1, 2, 3, 4, 5];
      const param2 = [10, 8, 6, 4, 2];
      const result = analyzer.calculateCorrelation(param1, param2);

      expect(result.correlation).toBeCloseTo(-1, 5);
    });

    it('should get mass tester', () => {
      expect(analyzer.getMassTester()).toBe(massTester);
    });

    it('should get pattern detector', () => {
      expect(analyzer.getPatternDetector()).toBeInstanceOf(PatternDetector);
    });

    it('should get breakthrough identifier', () => {
      expect(analyzer.getBreakthroughIdentifier()).toBeInstanceOf(BreakthroughIdentifier);
    });

    it('should get reports', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      analyzer.analyze();

      expect(analyzer.getReports().length).toBe(1);
    });

    it('should get statistics', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      analyzer.analyze();

      const stats = analyzer.getStatistics();
      expect(stats.reportCount).toBe(1);
    });

    it('should clear all data', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      analyzer.analyze();
      analyzer.clear();

      expect(analyzer.getReports().length).toBe(0);
    });

    it('should export to JSON', () => {
      const json = analyzer.toJSON();
      expect(json).toHaveProperty('reports');
      expect(json).toHaveProperty('patterns');
      expect(json).toHaveProperty('breakthroughs');
    });

    it('should generate proof chain hash', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      analyzer.analyze();

      const hash = analyzer.generateProofChainHash();
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('should generate hash for report', () => {
      const formula = engine.createFormula('test', 'x', (p) => p.get('x') || 0);
      formula.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 5 });

      massTester.runTests(formula);
      const report = analyzer.analyze();

      expect(report.hash).toBeDefined();
      expect(report.hash.length).toBe(16);
    });
  });

  describe('ResultAnalyzerFactory', () => {
    it('should create analyzer', () => {
      const engine = new FormulaEngine();
      const massTester = new MassTester(engine);
      const analyzer = ResultAnalyzerFactory.create(massTester);

      expect(analyzer).toBeInstanceOf(ResultAnalyzer);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', () => {
      const engine = new FormulaEngine();
      const massTester = new MassTester(engine);
      const analyzer = new ResultAnalyzer(massTester);

      const report = analyzer.analyze();
      expect(report.patterns.length).toBe(0);
    });

    it('should handle trend with single value', () => {
      const engine = new FormulaEngine();
      const massTester = new MassTester(engine);
      const analyzer = new ResultAnalyzer(massTester);

      const trend = analyzer.calculateTrend([5]);
      expect(trend.direction).toBe('stable');
    });

    it('should handle correlation with mismatched arrays', () => {
      const engine = new FormulaEngine();
      const massTester = new MassTester(engine);
      const analyzer = new ResultAnalyzer(massTester);

      const result = analyzer.calculateCorrelation([1, 2], [1, 2, 3]);
      expect(result.correlation).toBe(0);
    });

    it('should handle too few values for patterns', () => {
      const detector = new PatternDetector();
      const results = [
        {
          id: '1',
          formulaId: 'test',
          formulaName: 'test',
          category: TestCategory.NUMERICAL,
          status: TestResultStatus.PASSED,
          inputParameters: new Map([['x', 1]]),
          actualOutput: 5,
          executionTime: 1,
          hash: 'hash1'
        }
      ];

      const patterns = detector.detect(results);
      // Should not crash, may have no patterns
      expect(patterns).toBeDefined();
    });
  });

  describe('Hash Verification', () => {
    it('should generate different report hashes', () => {
      const engine = new FormulaEngine();
      const massTester = new MassTester(engine, null, {
        ...DEFAULT_CONFIG,
        testsPerFormula: 10,
        parameterVariations: 5
      });
      const analyzer = new ResultAnalyzer(massTester);

      const f1 = engine.createFormula('f1', 'x', (p) => p.get('x') || 0);
      f1.addParameter({ name: 'x', type: ParameterType.SCALAR, value: 1 });

      massTester.runTests(f1);
      const report1 = analyzer.analyze();

      const f2 = engine.createFormula('f2', 'y', (p) => (p.get('y') || 0) * 2);
      f2.addParameter({ name: 'y', type: ParameterType.SCALAR, value: 2 });

      massTester.runTests(f2);
      const report2 = analyzer.analyze();

      expect(report1.hash).not.toBe(report2.hash);
    });
  });
});
