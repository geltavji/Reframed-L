/**
 * HypothesisEngine - Automated Hypothesis Generation (M10.01)
 * PRD-10 Phase 10.1: Hypothesis Generator
 * 
 * Generates hypotheses automatically through pattern-based discovery
 * and novel combination creation.
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// ============================================================================
// INTERFACES
// ============================================================================

export interface HypothesisTemplate {
  id: string;
  name: string;
  pattern: string;
  variables: TemplateVariable[];
  constraints: Constraint[];
  category: HypothesisCategory;
}

export interface TemplateVariable {
  name: string;
  type: 'numeric' | 'categorical' | 'formula';
  range?: { min: number; max: number };
  options?: string[];
  description: string;
}

export interface Constraint {
  type: 'equality' | 'inequality' | 'range' | 'dependency';
  expression: string;
  description: string;
}

export type HypothesisCategory = 
  | 'physics'
  | 'mathematics'
  | 'computation'
  | 'optimization'
  | 'correlation'
  | 'causation';

export interface Hypothesis {
  id: string;
  statement: string;
  formulation: string;
  category: HypothesisCategory;
  variables: Record<string, unknown>;
  predictions: Prediction[];
  noveltyScore: NoveltyScore;
  confidence: number;
  sourceTemplate?: string;
  parentHypotheses?: string[];
  hash: string;
  createdAt: Date;
  status: HypothesisStatus;
}

export type HypothesisStatus = 
  | 'generated'
  | 'screening'
  | 'testing'
  | 'validated'
  | 'rejected'
  | 'promising';

export interface Prediction {
  id: string;
  condition: string;
  expectedOutcome: string;
  testable: boolean;
  priority: number;
}

export interface NoveltyScore {
  overall: number;
  components: {
    structuralNovelty: number;
    conceptualNovelty: number;
    combinatorialNovelty: number;
    predictiveNovelty: number;
  };
  comparison: {
    similarHypotheses: string[];
    differentiatingFactors: string[];
  };
  hash: string;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  template: string;
  examples: string[];
  frequency: number;
  successRate: number;
}

export interface CombinationRule {
  name: string;
  description: string;
  applicableTo: HypothesisCategory[];
  combine: (h1: Hypothesis, h2: Hypothesis) => Hypothesis | null;
}

export interface GenerationConfig {
  maxHypotheses: number;
  noveltyThreshold: number;
  confidenceThreshold: number;
  enableCombinations: boolean;
  enableMutations: boolean;
  categories: HypothesisCategory[];
  seed?: number;
}

export interface GenerationResult {
  hypotheses: Hypothesis[];
  totalGenerated: number;
  filtered: number;
  combinationsCreated: number;
  topNovelty: Hypothesis[];
  hash: string;
}

// ============================================================================
// NOVELTY ANALYZER
// ============================================================================

export class NoveltyAnalyzer {
  private existingHypotheses: Map<string, Hypothesis> = new Map();

  /**
   * Calculate novelty score for a hypothesis
   */
  calculateNovelty(hypothesis: Hypothesis): NoveltyScore {
    const structuralNovelty = this.calculateStructuralNovelty(hypothesis);
    const conceptualNovelty = this.calculateConceptualNovelty(hypothesis);
    const combinatorialNovelty = this.calculateCombinatorialNovelty(hypothesis);
    const predictiveNovelty = this.calculatePredictiveNovelty(hypothesis);

    const overall = (
      structuralNovelty * 0.25 +
      conceptualNovelty * 0.30 +
      combinatorialNovelty * 0.20 +
      predictiveNovelty * 0.25
    );

    const similarHypotheses = this.findSimilarHypotheses(hypothesis);
    const differentiatingFactors = this.identifyDifferentiators(hypothesis, similarHypotheses);

    const score: Omit<NoveltyScore, 'hash'> = {
      overall,
      components: {
        structuralNovelty,
        conceptualNovelty,
        combinatorialNovelty,
        predictiveNovelty
      },
      comparison: {
        similarHypotheses: similarHypotheses.map(h => h.id),
        differentiatingFactors
      }
    };

    return {
      ...score,
      hash: HashVerifier.hash(JSON.stringify(score))
    };
  }

  /**
   * Calculate structural novelty based on formula structure
   */
  private calculateStructuralNovelty(hypothesis: Hypothesis): number {
    // Compare formula structure with existing hypotheses
    let maxSimilarity = 0;
    
    for (const existing of this.existingHypotheses.values()) {
      const similarity = this.calculateFormulaSimilarity(
        hypothesis.formulation,
        existing.formulation
      );
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return 1 - maxSimilarity;
  }

  /**
   * Calculate conceptual novelty based on underlying concepts
   */
  private calculateConceptualNovelty(hypothesis: Hypothesis): number {
    // Extract concepts and compare
    const concepts = this.extractConcepts(hypothesis.statement);
    let novelConceptCount = 0;
    let totalConcepts = concepts.length;

    for (const concept of concepts) {
      let found = false;
      for (const existing of this.existingHypotheses.values()) {
        if (existing.statement.toLowerCase().includes(concept.toLowerCase())) {
          found = true;
          break;
        }
      }
      if (!found) novelConceptCount++;
    }

    return totalConcepts > 0 ? novelConceptCount / totalConcepts : 1;
  }

  /**
   * Calculate combinatorial novelty
   */
  private calculateCombinatorialNovelty(hypothesis: Hypothesis): number {
    if (!hypothesis.parentHypotheses || hypothesis.parentHypotheses.length < 2) {
      return 0.5; // Default for non-combined hypotheses
    }

    // Check if this combination has been made before
    const combinationKey = hypothesis.parentHypotheses.sort().join('|');
    
    for (const existing of this.existingHypotheses.values()) {
      if (existing.parentHypotheses) {
        const existingKey = existing.parentHypotheses.sort().join('|');
        if (existingKey === combinationKey) {
          return 0;
        }
      }
    }

    return 1;
  }

  /**
   * Calculate predictive novelty
   */
  private calculatePredictiveNovelty(hypothesis: Hypothesis): number {
    const predictions = hypothesis.predictions;
    if (predictions.length === 0) return 0;

    let novelPredictions = 0;
    
    for (const prediction of predictions) {
      let isNovel = true;
      for (const existing of this.existingHypotheses.values()) {
        for (const existingPred of existing.predictions) {
          if (this.arePredictionsSimilar(prediction, existingPred)) {
            isNovel = false;
            break;
          }
        }
        if (!isNovel) break;
      }
      if (isNovel) novelPredictions++;
    }

    return novelPredictions / predictions.length;
  }

  /**
   * Calculate formula similarity (Levenshtein-based)
   */
  private calculateFormulaSimilarity(f1: string, f2: string): number {
    const len1 = f1.length;
    const len2 = f2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = f1[i - 1] === f2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return 1 - matrix[len1][len2] / maxLen;
  }

  /**
   * Extract concepts from hypothesis statement
   */
  private extractConcepts(statement: string): string[] {
    // Simple word extraction (in a real system, use NLP)
    const words = statement.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['that', 'this', 'with', 'from', 'have', 'will', 'when'].includes(w));
    
    return [...new Set(words)];
  }

  /**
   * Find similar hypotheses
   */
  private findSimilarHypotheses(hypothesis: Hypothesis): Hypothesis[] {
    const similar: Hypothesis[] = [];
    
    for (const existing of this.existingHypotheses.values()) {
      const similarity = this.calculateFormulaSimilarity(
        hypothesis.formulation,
        existing.formulation
      );
      if (similarity > 0.5) {
        similar.push(existing);
      }
    }

    return similar;
  }

  /**
   * Identify differentiating factors
   */
  private identifyDifferentiators(hypothesis: Hypothesis, similar: Hypothesis[]): string[] {
    const factors: string[] = [];
    
    if (similar.length === 0) {
      factors.push('No similar hypotheses found - completely novel');
    } else {
      // Check variable differences
      const varNames = Object.keys(hypothesis.variables);
      for (const h of similar) {
        const existingVars = Object.keys(h.variables);
        const newVars = varNames.filter(v => !existingVars.includes(v));
        if (newVars.length > 0) {
          factors.push(`Introduces new variables: ${newVars.join(', ')}`);
        }
      }

      // Check prediction differences
      if (hypothesis.predictions.length > 0) {
        factors.push(`Makes ${hypothesis.predictions.length} unique predictions`);
      }
    }

    return factors;
  }

  /**
   * Check if two predictions are similar
   */
  private arePredictionsSimilar(p1: Prediction, p2: Prediction): boolean {
    return this.calculateFormulaSimilarity(p1.expectedOutcome, p2.expectedOutcome) > 0.8;
  }

  /**
   * Add hypothesis to existing set
   */
  addHypothesis(hypothesis: Hypothesis): void {
    this.existingHypotheses.set(hypothesis.id, hypothesis);
  }

  /**
   * Get all existing hypotheses
   */
  getExistingHypotheses(): Hypothesis[] {
    return Array.from(this.existingHypotheses.values());
  }
}

// ============================================================================
// HYPOTHESIS ENGINE
// ============================================================================

export class HypothesisEngine {
  private logger: Logger;
  private templates: Map<string, HypothesisTemplate> = new Map();
  private patterns: Map<string, Pattern> = new Map();
  private combinationRules: CombinationRule[] = [];
  private noveltyAnalyzer: NoveltyAnalyzer;
  private generatedHypotheses: Map<string, Hypothesis> = new Map();
  private rng: () => number;

  constructor(logger?: Logger, seed?: number) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.noveltyAnalyzer = new NoveltyAnalyzer();
    this.rng = seed !== undefined ? this.seededRandom(seed) : Math.random;
    this.initializeDefaults();
  }

  /**
   * Initialize default templates and patterns
   */
  private initializeDefaults(): void {
    // Physics templates
    this.registerTemplate({
      id: 'T-PHYSICS-001',
      name: 'Conservation Law',
      pattern: '{quantity} is conserved in {system} under {condition}',
      variables: [
        { name: 'quantity', type: 'categorical', options: ['energy', 'momentum', 'charge', 'information'], description: 'Conserved quantity' },
        { name: 'system', type: 'categorical', options: ['closed', 'isolated', 'quantum'], description: 'System type' },
        { name: 'condition', type: 'categorical', options: ['all transformations', 'time evolution', 'spatial translation'], description: 'Condition' }
      ],
      constraints: [],
      category: 'physics'
    });

    this.registerTemplate({
      id: 'T-PHYSICS-002',
      name: 'Scaling Law',
      pattern: '{property} scales as {base}^{exponent} with respect to {parameter}',
      variables: [
        { name: 'property', type: 'categorical', options: ['complexity', 'energy', 'time', 'information'], description: 'Property' },
        { name: 'base', type: 'categorical', options: ['n', 'log(n)', '2', 'e'], description: 'Base' },
        { name: 'exponent', type: 'numeric', range: { min: -2, max: 3 }, description: 'Exponent' },
        { name: 'parameter', type: 'categorical', options: ['input size', 'dimension', 'precision'], description: 'Parameter' }
      ],
      constraints: [],
      category: 'physics'
    });

    // Mathematics templates
    this.registerTemplate({
      id: 'T-MATH-001',
      name: 'Inequality Relation',
      pattern: '{left} {operator} {right} when {condition}',
      variables: [
        { name: 'left', type: 'formula', description: 'Left side expression' },
        { name: 'operator', type: 'categorical', options: ['<=', '>=', '<', '>'], description: 'Inequality operator' },
        { name: 'right', type: 'formula', description: 'Right side expression' },
        { name: 'condition', type: 'categorical', options: ['always', 'for positive values', 'for bounded inputs'], description: 'Condition' }
      ],
      constraints: [],
      category: 'mathematics'
    });

    // Computation templates
    this.registerTemplate({
      id: 'T-COMP-001',
      name: 'Complexity Bound',
      pattern: 'Algorithm {algorithm} achieves {complexity} complexity for {problem}',
      variables: [
        { name: 'algorithm', type: 'categorical', options: ['quantum', 'probabilistic', 'deterministic', 'parallel'], description: 'Algorithm type' },
        { name: 'complexity', type: 'categorical', options: ['O(1)', 'O(log n)', 'O(sqrt n)', 'O(n)'], description: 'Complexity class' },
        { name: 'problem', type: 'categorical', options: ['search', 'sorting', 'optimization', 'factoring'], description: 'Problem type' }
      ],
      constraints: [],
      category: 'computation'
    });

    // Correlation pattern
    this.registerPattern({
      id: 'P-CORR-001',
      name: 'Linear Correlation',
      description: 'Variables exhibit linear relationship',
      template: '{var1} = {slope} * {var2} + {intercept}',
      examples: ['y = 2x + 1', 'energy = mc^2'],
      frequency: 0.3,
      successRate: 0.6
    });

    // Combination rules
    this.registerCombinationRule({
      name: 'Constraint Intersection',
      description: 'Combine constraints from two hypotheses',
      applicableTo: ['physics', 'mathematics'],
      combine: (h1, h2) => this.combineByConstraintIntersection(h1, h2)
    });

    this.registerCombinationRule({
      name: 'Generalization',
      description: 'Generalize specific hypotheses into broader ones',
      applicableTo: ['physics', 'mathematics', 'computation'],
      combine: (h1, h2) => this.combineByGeneralization(h1, h2)
    });
  }

  /**
   * Register a hypothesis template
   */
  registerTemplate(template: HypothesisTemplate): void {
    this.templates.set(template.id, template);
    this.logger.info(`Registered template: ${template.name}`);
  }

  /**
   * Register a pattern
   */
  registerPattern(pattern: Pattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Register a combination rule
   */
  registerCombinationRule(rule: CombinationRule): void {
    this.combinationRules.push(rule);
  }

  /**
   * Generate hypotheses based on configuration
   */
  generate(config: GenerationConfig): GenerationResult {
    this.logger.info('Starting hypothesis generation');
    
    if (config.seed !== undefined) {
      this.rng = this.seededRandom(config.seed);
    }

    const hypotheses: Hypothesis[] = [];
    let totalGenerated = 0;
    let filtered = 0;
    let combinationsCreated = 0;

    // Generate from templates
    for (const template of this.templates.values()) {
      if (!config.categories.includes(template.category)) continue;

      const templateHypotheses = this.generateFromTemplate(template, config);
      totalGenerated += templateHypotheses.length;

      for (const h of templateHypotheses) {
        if (h.noveltyScore.overall >= config.noveltyThreshold &&
            h.confidence >= config.confidenceThreshold) {
          hypotheses.push(h);
          this.noveltyAnalyzer.addHypothesis(h);
        } else {
          filtered++;
        }

        if (hypotheses.length >= config.maxHypotheses) break;
      }

      if (hypotheses.length >= config.maxHypotheses) break;
    }

    // Generate combinations if enabled
    if (config.enableCombinations && hypotheses.length >= 2) {
      const combinations = this.generateCombinations(hypotheses, config);
      combinationsCreated = combinations.length;
      
      for (const combo of combinations) {
        if (combo.noveltyScore.overall >= config.noveltyThreshold) {
          hypotheses.push(combo);
          this.noveltyAnalyzer.addHypothesis(combo);
        }
        if (hypotheses.length >= config.maxHypotheses) break;
      }
    }

    // Store generated hypotheses
    for (const h of hypotheses) {
      this.generatedHypotheses.set(h.id, h);
    }

    // Sort by novelty and get top
    const sortedByNovelty = [...hypotheses].sort(
      (a, b) => b.noveltyScore.overall - a.noveltyScore.overall
    );

    const result: Omit<GenerationResult, 'hash'> = {
      hypotheses,
      totalGenerated,
      filtered,
      combinationsCreated,
      topNovelty: sortedByNovelty.slice(0, 5)
    };

    this.logger.info(`Generated ${hypotheses.length} hypotheses (${filtered} filtered)`);

    return {
      ...result,
      hash: HashVerifier.hash(JSON.stringify(result))
    };
  }

  /**
   * Generate hypotheses from a template
   */
  private generateFromTemplate(
    template: HypothesisTemplate,
    config: GenerationConfig
  ): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];
    const maxPerTemplate = Math.ceil(config.maxHypotheses / this.templates.size);

    // Generate variable combinations
    const combinations = this.generateVariableCombinations(template.variables);

    for (const vars of combinations) {
      if (hypotheses.length >= maxPerTemplate) break;

      const hypothesis = this.createHypothesis(template, vars);
      hypothesis.noveltyScore = this.noveltyAnalyzer.calculateNovelty(hypothesis);
      hypotheses.push(hypothesis);
    }

    return hypotheses;
  }

  /**
   * Generate variable combinations
   */
  private generateVariableCombinations(variables: TemplateVariable[]): Record<string, unknown>[] {
    const combinations: Record<string, unknown>[] = [{}];

    for (const variable of variables) {
      const newCombinations: Record<string, unknown>[] = [];
      
      for (const combo of combinations) {
        const values = this.getVariableValues(variable);
        for (const value of values) {
          newCombinations.push({ ...combo, [variable.name]: value });
        }
      }

      combinations.length = 0;
      combinations.push(...newCombinations);

      // Limit combinations
      if (combinations.length > 100) {
        combinations.length = 100;
      }
    }

    return combinations;
  }

  /**
   * Get possible values for a variable
   */
  private getVariableValues(variable: TemplateVariable): unknown[] {
    if (variable.options) {
      return variable.options;
    }

    if (variable.range) {
      // Generate some sample values
      const values: number[] = [];
      const step = (variable.range.max - variable.range.min) / 5;
      for (let v = variable.range.min; v <= variable.range.max; v += step) {
        values.push(Math.round(v * 100) / 100);
      }
      return values;
    }

    return ['x', 'y', 'z']; // Default formula variables
  }

  /**
   * Create a hypothesis from template and variables
   */
  private createHypothesis(
    template: HypothesisTemplate,
    variables: Record<string, unknown>
  ): Hypothesis {
    const id = `H-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Fill in template pattern
    let statement = template.pattern;
    let formulation = template.pattern;
    
    for (const [name, value] of Object.entries(variables)) {
      const placeholder = `{${name}}`;
      statement = statement.replace(placeholder, String(value));
      formulation = formulation.replace(placeholder, String(value));
    }

    const predictions = this.generatePredictions(statement, variables);
    const confidence = this.calculateInitialConfidence(template, variables);

    const hypothesis: Omit<Hypothesis, 'hash'> = {
      id,
      statement,
      formulation,
      category: template.category,
      variables,
      predictions,
      noveltyScore: {
        overall: 0,
        components: { structuralNovelty: 0, conceptualNovelty: 0, combinatorialNovelty: 0, predictiveNovelty: 0 },
        comparison: { similarHypotheses: [], differentiatingFactors: [] },
        hash: ''
      },
      confidence,
      sourceTemplate: template.id,
      createdAt: new Date(),
      status: 'generated'
    };

    return {
      ...hypothesis,
      hash: HashVerifier.hash(JSON.stringify(hypothesis))
    };
  }

  /**
   * Generate predictions from hypothesis
   */
  private generatePredictions(statement: string, variables: Record<string, unknown>): Prediction[] {
    const predictions: Prediction[] = [];
    
    // Generate basic testable prediction
    predictions.push({
      id: `PRED-${Date.now()}-1`,
      condition: 'Under standard conditions',
      expectedOutcome: statement,
      testable: true,
      priority: 1
    });

    // Generate edge case predictions
    for (const [name, value] of Object.entries(variables)) {
      if (typeof value === 'number') {
        predictions.push({
          id: `PRED-${Date.now()}-${predictions.length + 1}`,
          condition: `When ${name} approaches limits`,
          expectedOutcome: `Behavior remains consistent`,
          testable: true,
          priority: 2
        });
      }
    }

    return predictions;
  }

  /**
   * Calculate initial confidence score
   */
  private calculateInitialConfidence(
    template: HypothesisTemplate,
    variables: Record<string, unknown>
  ): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on pattern success rate
    const pattern = Array.from(this.patterns.values()).find(p => 
      template.pattern.includes(p.template.split('{')[0])
    );
    if (pattern) {
      confidence += pattern.successRate * 0.3;
    }

    // Adjust based on constraint satisfaction
    for (const constraint of template.constraints) {
      // In a real implementation, evaluate constraint
      confidence += 0.05;
    }

    return Math.min(1, confidence);
  }

  /**
   * Generate combinations of hypotheses
   */
  private generateCombinations(
    hypotheses: Hypothesis[],
    config: GenerationConfig
  ): Hypothesis[] {
    const combinations: Hypothesis[] = [];
    
    for (let i = 0; i < hypotheses.length - 1 && combinations.length < 10; i++) {
      for (let j = i + 1; j < hypotheses.length && combinations.length < 10; j++) {
        for (const rule of this.combinationRules) {
          if (rule.applicableTo.includes(hypotheses[i].category) &&
              rule.applicableTo.includes(hypotheses[j].category)) {
            const combined = rule.combine(hypotheses[i], hypotheses[j]);
            if (combined) {
              combined.noveltyScore = this.noveltyAnalyzer.calculateNovelty(combined);
              combinations.push(combined);
            }
          }
        }
      }
    }

    return combinations;
  }

  /**
   * Combine hypotheses by constraint intersection
   */
  private combineByConstraintIntersection(h1: Hypothesis, h2: Hypothesis): Hypothesis | null {
    const id = `H-COMBO-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const statement = `If ${h1.statement} AND ${h2.statement}`;
    const combinedVars = { ...h1.variables, ...h2.variables };

    const hypothesis: Omit<Hypothesis, 'hash'> = {
      id,
      statement,
      formulation: `(${h1.formulation}) ∧ (${h2.formulation})`,
      category: h1.category,
      variables: combinedVars,
      predictions: [...h1.predictions, ...h2.predictions],
      noveltyScore: {
        overall: 0,
        components: { structuralNovelty: 0, conceptualNovelty: 0, combinatorialNovelty: 0, predictiveNovelty: 0 },
        comparison: { similarHypotheses: [], differentiatingFactors: [] },
        hash: ''
      },
      confidence: (h1.confidence + h2.confidence) / 2 * 0.8,
      parentHypotheses: [h1.id, h2.id],
      createdAt: new Date(),
      status: 'generated'
    };

    return {
      ...hypothesis,
      hash: HashVerifier.hash(JSON.stringify(hypothesis))
    };
  }

  /**
   * Combine hypotheses by generalization
   */
  private combineByGeneralization(h1: Hypothesis, h2: Hypothesis): Hypothesis | null {
    // Only generalize if statements share some structure
    if (h1.category !== h2.category) return null;

    const id = `H-GEN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const statement = `Generalized: ${h1.statement.split(' ')[0]} relationship exists`;

    const hypothesis: Omit<Hypothesis, 'hash'> = {
      id,
      statement,
      formulation: 'Generalized form',
      category: h1.category,
      variables: {},
      predictions: [{
        id: `PRED-${Date.now()}`,
        condition: 'Under general conditions',
        expectedOutcome: 'Pattern holds',
        testable: true,
        priority: 1
      }],
      noveltyScore: {
        overall: 0,
        components: { structuralNovelty: 0, conceptualNovelty: 0, combinatorialNovelty: 0, predictiveNovelty: 0 },
        comparison: { similarHypotheses: [], differentiatingFactors: [] },
        hash: ''
      },
      confidence: Math.min(h1.confidence, h2.confidence) * 0.7,
      parentHypotheses: [h1.id, h2.id],
      createdAt: new Date(),
      status: 'generated'
    };

    return {
      ...hypothesis,
      hash: HashVerifier.hash(JSON.stringify(hypothesis))
    };
  }

  /**
   * Get hypothesis by ID
   */
  getHypothesis(id: string): Hypothesis | undefined {
    return this.generatedHypotheses.get(id);
  }

  /**
   * Get all hypotheses
   */
  getAllHypotheses(): Hypothesis[] {
    return Array.from(this.generatedHypotheses.values());
  }

  /**
   * Update hypothesis status
   */
  updateStatus(id: string, status: HypothesisStatus): void {
    const hypothesis = this.generatedHypotheses.get(id);
    if (hypothesis) {
      hypothesis.status = status;
    }
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`HypothesisEngine-${this.generatedHypotheses.size}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): {
    templates: HypothesisTemplate[];
    patterns: Pattern[];
    hypotheses: Hypothesis[];
  } {
    return {
      templates: Array.from(this.templates.values()),
      patterns: Array.from(this.patterns.values()),
      hypotheses: Array.from(this.generatedHypotheses.values())
    };
  }
}

// ============================================================================
// HYPOTHESIS ENGINE FACTORY
// ============================================================================

export class HypothesisEngineFactory {
  /**
   * Create default engine
   */
  static default(): HypothesisEngine {
    return new HypothesisEngine();
  }

  /**
   * Create engine with specific seed
   */
  static withSeed(seed: number): HypothesisEngine {
    return new HypothesisEngine(undefined, seed);
  }

  /**
   * Create physics-focused engine
   */
  static physicsEngine(): HypothesisEngine {
    const engine = new HypothesisEngine();
    // Additional physics templates could be added here
    return engine;
  }

  /**
   * Create computation-focused engine
   */
  static computationEngine(): HypothesisEngine {
    const engine = new HypothesisEngine();
    // Additional computation templates could be added here
    return engine;
  }
}
