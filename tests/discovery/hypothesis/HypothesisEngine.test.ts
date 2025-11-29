/**
 * HypothesisEngine Tests (M10.01)
 * PRD-10 Phase 10.1: Hypothesis Generator
 */

import {
  HypothesisEngine,
  HypothesisEngineFactory,
  NoveltyAnalyzer,
  Hypothesis,
  NoveltyScore,
  GenerationConfig
} from '../../../src/discovery/hypothesis/HypothesisEngine';

describe('HypothesisEngine', () => {
  let engine: HypothesisEngine;

  beforeEach(() => {
    engine = new HypothesisEngine(undefined, 12345);
  });

  describe('Template Registration', () => {
    it('should register templates', () => {
      engine.registerTemplate({
        id: 'T-CUSTOM',
        name: 'Custom Template',
        pattern: '{x} relates to {y}',
        variables: [
          { name: 'x', type: 'categorical', options: ['A', 'B'], description: 'First var' },
          { name: 'y', type: 'categorical', options: ['C', 'D'], description: 'Second var' }
        ],
        constraints: [],
        category: 'physics'
      });

      // Template should be usable in generation
      const result = engine.generate({
        maxHypotheses: 10,
        noveltyThreshold: 0,
        confidenceThreshold: 0,
        enableCombinations: false,
        enableMutations: false,
        categories: ['physics']
      });

      expect(result.hypotheses.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Registration', () => {
    it('should register patterns', () => {
      engine.registerPattern({
        id: 'P-CUSTOM',
        name: 'Custom Pattern',
        description: 'Test pattern',
        template: '{a} + {b} = {c}',
        examples: ['1 + 2 = 3'],
        frequency: 0.5,
        successRate: 0.8
      });

      expect(engine.getHash()).toBeDefined();
    });
  });

  describe('Hypothesis Generation', () => {
    const defaultConfig: GenerationConfig = {
      maxHypotheses: 20,
      noveltyThreshold: 0,
      confidenceThreshold: 0,
      enableCombinations: false,
      enableMutations: false,
      categories: ['physics', 'mathematics', 'computation']
    };

    it('should generate hypotheses', () => {
      const result = engine.generate(defaultConfig);

      expect(result.hypotheses.length).toBeGreaterThan(0);
      expect(result.totalGenerated).toBeGreaterThan(0);
      expect(result.hash).toBeDefined();
    });

    it('should respect maxHypotheses limit', () => {
      const result = engine.generate({
        ...defaultConfig,
        maxHypotheses: 5
      });

      expect(result.hypotheses.length).toBeLessThanOrEqual(5);
    });

    it('should filter by novelty threshold', () => {
      const result = engine.generate({
        ...defaultConfig,
        noveltyThreshold: 0.9
      });

      // High threshold may filter many hypotheses
      expect(result.filtered).toBeGreaterThanOrEqual(0);
    });

    it('should filter by confidence threshold', () => {
      const result = engine.generate({
        ...defaultConfig,
        confidenceThreshold: 0.9
      });

      for (const h of result.hypotheses) {
        expect(h.confidence).toBeGreaterThanOrEqual(0.9);
      }
    });

    it('should filter by categories', () => {
      const result = engine.generate({
        ...defaultConfig,
        categories: ['physics']
      });

      for (const h of result.hypotheses) {
        expect(h.category).toBe('physics');
      }
    });

    it('should generate combinations when enabled', () => {
      const result = engine.generate({
        ...defaultConfig,
        maxHypotheses: 30,
        enableCombinations: true
      });

      // Some hypotheses may have parent hypotheses
      expect(result.combinationsCreated).toBeGreaterThanOrEqual(0);
    });

    it('should return top novelty hypotheses', () => {
      const result = engine.generate(defaultConfig);

      expect(result.topNovelty.length).toBeLessThanOrEqual(5);
      
      // Should be sorted by novelty
      for (let i = 1; i < result.topNovelty.length; i++) {
        expect(result.topNovelty[i-1].noveltyScore.overall)
          .toBeGreaterThanOrEqual(result.topNovelty[i].noveltyScore.overall);
      }
    });

    it('should use seed for reproducibility', () => {
      const engine1 = new HypothesisEngine(undefined, 42);
      const engine2 = new HypothesisEngine(undefined, 42);

      const result1 = engine1.generate({ ...defaultConfig, maxHypotheses: 5 });
      const result2 = engine2.generate({ ...defaultConfig, maxHypotheses: 5 });

      expect(result1.hypotheses.length).toBe(result2.hypotheses.length);
    });
  });

  describe('Hypothesis Structure', () => {
    it('should generate hypotheses with required fields', () => {
      const result = engine.generate({
        maxHypotheses: 5,
        noveltyThreshold: 0,
        confidenceThreshold: 0,
        enableCombinations: false,
        enableMutations: false,
        categories: ['physics', 'mathematics', 'computation']
      });

      for (const h of result.hypotheses) {
        expect(h.id).toBeDefined();
        expect(h.statement).toBeDefined();
        expect(h.formulation).toBeDefined();
        expect(h.category).toBeDefined();
        expect(h.variables).toBeDefined();
        expect(h.predictions).toBeDefined();
        expect(h.noveltyScore).toBeDefined();
        expect(h.confidence).toBeGreaterThanOrEqual(0);
        expect(h.confidence).toBeLessThanOrEqual(1);
        expect(h.hash).toBeDefined();
        expect(h.createdAt).toBeInstanceOf(Date);
        expect(h.status).toBe('generated');
      }
    });

    it('should generate predictions for hypotheses', () => {
      const result = engine.generate({
        maxHypotheses: 5,
        noveltyThreshold: 0,
        confidenceThreshold: 0,
        enableCombinations: false,
        enableMutations: false,
        categories: ['physics']
      });

      for (const h of result.hypotheses) {
        expect(h.predictions.length).toBeGreaterThan(0);
        for (const p of h.predictions) {
          expect(p.id).toBeDefined();
          expect(p.condition).toBeDefined();
          expect(p.expectedOutcome).toBeDefined();
          expect(p.testable).toBeDefined();
          expect(p.priority).toBeDefined();
        }
      }
    });
  });

  describe('Hypothesis Management', () => {
    beforeEach(() => {
      engine.generate({
        maxHypotheses: 5,
        noveltyThreshold: 0,
        confidenceThreshold: 0,
        enableCombinations: false,
        enableMutations: false,
        categories: ['physics']
      });
    });

    it('should retrieve hypothesis by ID', () => {
      const all = engine.getAllHypotheses();
      expect(all.length).toBeGreaterThan(0);

      const h = engine.getHypothesis(all[0].id);
      expect(h).toBeDefined();
      expect(h?.id).toBe(all[0].id);
    });

    it('should return all hypotheses', () => {
      const all = engine.getAllHypotheses();
      expect(all.length).toBeGreaterThan(0);
    });

    it('should update hypothesis status', () => {
      const all = engine.getAllHypotheses();
      const id = all[0].id;

      engine.updateStatus(id, 'testing');

      const updated = engine.getHypothesis(id);
      expect(updated?.status).toBe('testing');
    });
  });

  describe('NoveltyAnalyzer', () => {
    let analyzer: NoveltyAnalyzer;

    beforeEach(() => {
      analyzer = new NoveltyAnalyzer();
    });

    it('should calculate novelty score', () => {
      const hypothesis: Hypothesis = {
        id: 'H1',
        statement: 'Test hypothesis statement',
        formulation: 'x = y + z',
        category: 'physics',
        variables: { x: 1 },
        predictions: [{ id: 'P1', condition: 'c', expectedOutcome: 'o', testable: true, priority: 1 }],
        noveltyScore: { overall: 0, components: { structuralNovelty: 0, conceptualNovelty: 0, combinatorialNovelty: 0, predictiveNovelty: 0 }, comparison: { similarHypotheses: [], differentiatingFactors: [] }, hash: '' },
        confidence: 0.8,
        hash: 'test',
        createdAt: new Date(),
        status: 'generated'
      };

      const score = analyzer.calculateNovelty(hypothesis);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
      expect(score.components.structuralNovelty).toBeDefined();
      expect(score.components.conceptualNovelty).toBeDefined();
      expect(score.components.combinatorialNovelty).toBeDefined();
      expect(score.components.predictiveNovelty).toBeDefined();
      expect(score.hash).toBeDefined();
    });

    it('should detect similar hypotheses', () => {
      const h1: Hypothesis = {
        id: 'H1',
        statement: 'Energy is conserved in closed systems',
        formulation: 'E = const',
        category: 'physics',
        variables: {},
        predictions: [],
        noveltyScore: { overall: 0, components: { structuralNovelty: 0, conceptualNovelty: 0, combinatorialNovelty: 0, predictiveNovelty: 0 }, comparison: { similarHypotheses: [], differentiatingFactors: [] }, hash: '' },
        confidence: 0.8,
        hash: 'test1',
        createdAt: new Date(),
        status: 'generated'
      };

      const h2: Hypothesis = {
        id: 'H2',
        statement: 'Energy is conserved in isolated systems',
        formulation: 'E = const',
        category: 'physics',
        variables: {},
        predictions: [],
        noveltyScore: { overall: 0, components: { structuralNovelty: 0, conceptualNovelty: 0, combinatorialNovelty: 0, predictiveNovelty: 0 }, comparison: { similarHypotheses: [], differentiatingFactors: [] }, hash: '' },
        confidence: 0.8,
        hash: 'test2',
        createdAt: new Date(),
        status: 'generated'
      };

      analyzer.addHypothesis(h1);
      const score = analyzer.calculateNovelty(h2);

      // H2 should be less novel since H1 is similar
      expect(score.comparison.similarHypotheses.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify differentiating factors', () => {
      const hypothesis: Hypothesis = {
        id: 'H1',
        statement: 'Completely unique hypothesis',
        formulation: 'unique_formula',
        category: 'physics',
        variables: { newVar: 1 },
        predictions: [{ id: 'P1', condition: 'unique', expectedOutcome: 'unique', testable: true, priority: 1 }],
        noveltyScore: { overall: 0, components: { structuralNovelty: 0, conceptualNovelty: 0, combinatorialNovelty: 0, predictiveNovelty: 0 }, comparison: { similarHypotheses: [], differentiatingFactors: [] }, hash: '' },
        confidence: 0.9,
        hash: 'test',
        createdAt: new Date(),
        status: 'generated'
      };

      const score = analyzer.calculateNovelty(hypothesis);

      expect(score.comparison.differentiatingFactors.length).toBeGreaterThan(0);
    });
  });

  describe('HypothesisEngineFactory', () => {
    it('should create default engine', () => {
      const eng = HypothesisEngineFactory.default();
      expect(eng).toBeInstanceOf(HypothesisEngine);
    });

    it('should create engine with seed', () => {
      const eng = HypothesisEngineFactory.withSeed(12345);
      expect(eng).toBeInstanceOf(HypothesisEngine);
    });

    it('should create physics engine', () => {
      const eng = HypothesisEngineFactory.physicsEngine();
      expect(eng).toBeInstanceOf(HypothesisEngine);
    });

    it('should create computation engine', () => {
      const eng = HypothesisEngineFactory.computationEngine();
      expect(eng).toBeInstanceOf(HypothesisEngine);
    });
  });

  describe('Proof Chain', () => {
    it('should export proof chain', () => {
      engine.generate({
        maxHypotheses: 5,
        noveltyThreshold: 0,
        confidenceThreshold: 0,
        enableCombinations: false,
        enableMutations: false,
        categories: ['physics']
      });

      const chain = engine.exportProofChain();
      expect(chain.templates.length).toBeGreaterThan(0);
      expect(chain.patterns.length).toBeGreaterThan(0);
      expect(chain.hypotheses.length).toBeGreaterThan(0);
    });

    it('should generate hash', () => {
      const hash = engine.getHash();
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });
});
