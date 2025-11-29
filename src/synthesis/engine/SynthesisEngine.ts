/**
 * SynthesisEngine - PRD-11 Phase 11.1
 * Combines successful formulas into unified equations
 */

import { Logger } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// Application areas for synthesized formulas
export type ApplicationArea = 
  | 'quantum_computing'
  | 'classical_computing'
  | 'physics_simulation'
  | 'optimization'
  | 'cryptography'
  | 'machine_learning'
  | 'signal_processing'
  | 'materials_science'
  | 'energy'
  | 'communication'
  | 'general';

// Formula component interface
export interface FormulaComponent {
  id: string;
  name: string;
  expression: string;
  variables: string[];
  domain: string;
  sourceModule: string;
  validated: boolean;
  hash: string;
}

// Unified formula interface
export interface UnifiedFormula {
  id: string;
  name: string;
  expression: string;
  components: FormulaComponent[];
  variables: Map<string, VariableDefinition>;
  applicationAreas: ApplicationArea[];
  complexity: ComplexityInfo;
  validationScore: number;
  synthesizedAt: Date;
  hash: string;
}

export interface VariableDefinition {
  name: string;
  type: 'real' | 'complex' | 'integer' | 'boolean' | 'vector' | 'matrix';
  domain: { min?: number; max?: number; constraints?: string[] };
  units?: string;
  description: string;
}

export interface ComplexityInfo {
  timeComplexity: string;
  spaceComplexity: string;
  quantumAdvantage: boolean;
  classicalEquivalent?: string;
}

export interface SynthesisResult {
  success: boolean;
  formula: UnifiedFormula | null;
  errors: string[];
  warnings: string[];
  synthesisTime: number;
  hash: string;
}

export interface SynthesisConfig {
  maxComponents: number;
  minValidationScore: number;
  enableOptimization: boolean;
  targetApplications: ApplicationArea[];
  complexityTarget?: string;
}

const DEFAULT_CONFIG: SynthesisConfig = {
  maxComponents: 10,
  minValidationScore: 0.8,
  enableOptimization: true,
  targetApplications: ['general']
};

/**
 * SynthesisEngine - Combines formulas into unified equations
 */
export class SynthesisEngine {
  private logger: Logger;
  private components: Map<string, FormulaComponent> = new Map();
  private synthesizedFormulas: Map<string, UnifiedFormula> = new Map();
  private config: SynthesisConfig;
  private synthesisCount: number = 0;

  constructor(config: Partial<SynthesisConfig> = {}) {
    this.logger = new Logger();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a formula component for synthesis
   */
  registerComponent(component: Omit<FormulaComponent, 'hash'>): FormulaComponent {
    const hash = HashVerifier.hash(JSON.stringify(component));
    const fullComponent: FormulaComponent = { ...component, hash };
    this.components.set(component.id, fullComponent);
    
    this.logger.info('Component registered', { 
      id: component.id, 
      name: component.name,
      hash 
    });
    
    return fullComponent;
  }

  /**
   * Synthesize a unified formula from components
   */
  synthesize(
    componentIds: string[],
    name: string,
    targetApplications: ApplicationArea[] = this.config.targetApplications
  ): SynthesisResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate component count
    if (componentIds.length > this.config.maxComponents) {
      errors.push(`Too many components: ${componentIds.length} > ${this.config.maxComponents}`);
      return this.createFailedResult(errors, warnings, startTime);
    }

    // Gather components
    const components: FormulaComponent[] = [];
    for (const id of componentIds) {
      const component = this.components.get(id);
      if (!component) {
        errors.push(`Component not found: ${id}`);
        continue;
      }
      if (!component.validated) {
        warnings.push(`Component not validated: ${id}`);
      }
      components.push(component);
    }

    if (errors.length > 0) {
      return this.createFailedResult(errors, warnings, startTime);
    }

    // Combine expressions
    const expression = this.combineExpressions(components);
    
    // Merge variables
    const variables = this.mergeVariables(components);
    
    // Analyze complexity
    const complexity = this.analyzeComplexity(components);
    
    // Calculate validation score
    const validationScore = this.calculateValidationScore(components);
    
    if (validationScore < this.config.minValidationScore) {
      warnings.push(`Validation score ${validationScore.toFixed(2)} below threshold ${this.config.minValidationScore}`);
    }

    // Create unified formula
    const formulaId = `UF-${++this.synthesisCount}-${Date.now()}`;
    const formula: UnifiedFormula = {
      id: formulaId,
      name,
      expression,
      components,
      variables,
      applicationAreas: targetApplications,
      complexity,
      validationScore,
      synthesizedAt: new Date(),
      hash: ''
    };
    formula.hash = HashVerifier.hash(JSON.stringify({ ...formula, hash: '' }));

    // Apply optimization if enabled
    if (this.config.enableOptimization) {
      this.optimizeFormula(formula);
    }

    this.synthesizedFormulas.set(formulaId, formula);
    
    this.logger.proof('Formula synthesized', {
      id: formulaId,
      name,
      components: componentIds,
      validationScore,
      hash: formula.hash
    });

    return {
      success: true,
      formula,
      errors: [],
      warnings,
      synthesisTime: Date.now() - startTime,
      hash: HashVerifier.hash(JSON.stringify({ formulaId, success: true }))
    };
  }

  /**
   * Combine multiple formula expressions
   */
  private combineExpressions(components: FormulaComponent[]): string {
    if (components.length === 0) return '';
    if (components.length === 1) return components[0].expression;

    // Create combined expression
    const expressions = components.map((c, i) => `(${c.expression})`);
    return expressions.join(' ⊕ ');
  }

  /**
   * Merge variables from all components
   */
  private mergeVariables(components: FormulaComponent[]): Map<string, VariableDefinition> {
    const variables = new Map<string, VariableDefinition>();
    
    for (const component of components) {
      for (const varName of component.variables) {
        if (!variables.has(varName)) {
          variables.set(varName, {
            name: varName,
            type: 'real',
            domain: {},
            description: `Variable from ${component.name}`
          });
        }
      }
    }
    
    return variables;
  }

  /**
   * Analyze combined complexity
   */
  private analyzeComplexity(components: FormulaComponent[]): ComplexityInfo {
    // Find highest complexity among components
    const complexities = components.map(c => this.extractComplexity(c));
    
    let maxTimeComplexity = 'O(1)';
    let maxSpaceComplexity = 'O(1)';
    let hasQuantumAdvantage = false;

    for (const comp of complexities) {
      if (this.compareComplexity(comp.time, maxTimeComplexity) > 0) {
        maxTimeComplexity = comp.time;
      }
      if (this.compareComplexity(comp.space, maxSpaceComplexity) > 0) {
        maxSpaceComplexity = comp.space;
      }
      if (comp.quantum) hasQuantumAdvantage = true;
    }

    return {
      timeComplexity: maxTimeComplexity,
      spaceComplexity: maxSpaceComplexity,
      quantumAdvantage: hasQuantumAdvantage,
      classicalEquivalent: hasQuantumAdvantage ? this.getClassicalEquivalent(maxTimeComplexity) : undefined
    };
  }

  private extractComplexity(component: FormulaComponent): { time: string; space: string; quantum: boolean } {
    // Default complexity extraction
    const expression = component.expression.toLowerCase();
    const isQuantum = expression.includes('quantum') || expression.includes('grover') || expression.includes('shor');
    
    return {
      time: isQuantum ? 'O(√n)' : 'O(n)',
      space: 'O(n)',
      quantum: isQuantum
    };
  }

  private compareComplexity(a: string, b: string): number {
    const order = ['O(1)', 'O(log n)', 'O(√n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2^n)'];
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return indexA - indexB;
  }

  private getClassicalEquivalent(quantumComplexity: string): string {
    const mapping: Record<string, string> = {
      'O(1)': 'O(n)',
      'O(log n)': 'O(n)',
      'O(√n)': 'O(n)',
      'O(n)': 'O(n²)'
    };
    return mapping[quantumComplexity] || 'O(n²)';
  }

  /**
   * Calculate validation score for combined formula
   */
  private calculateValidationScore(components: FormulaComponent[]): number {
    if (components.length === 0) return 0;
    
    const validatedCount = components.filter(c => c.validated).length;
    const baseScore = validatedCount / components.length;
    
    // Bonus for well-documented components
    const documentationBonus = components.every(c => c.domain.length > 0) ? 0.1 : 0;
    
    return Math.min(1, baseScore + documentationBonus);
  }

  /**
   * Optimize synthesized formula
   */
  private optimizeFormula(formula: UnifiedFormula): void {
    // Simplification pass
    formula.expression = this.simplifyExpression(formula.expression);
    
    // Update hash after optimization
    formula.hash = HashVerifier.hash(JSON.stringify({ ...formula, hash: '' }));
  }

  private simplifyExpression(expression: string): string {
    // Remove redundant parentheses
    let simplified = expression.replace(/\(\(([^()]+)\)\)/g, '($1)');
    
    // Combine like terms symbolically
    simplified = simplified.replace(/\+ 0\b/g, '').replace(/\b0 \+/g, '');
    
    return simplified;
  }

  private createFailedResult(
    errors: string[],
    warnings: string[],
    startTime: number
  ): SynthesisResult {
    return {
      success: false,
      formula: null,
      errors,
      warnings,
      synthesisTime: Date.now() - startTime,
      hash: HashVerifier.hash(JSON.stringify({ success: false, errors }))
    };
  }

  /**
   * Get a synthesized formula by ID
   */
  getFormula(id: string): UnifiedFormula | undefined {
    return this.synthesizedFormulas.get(id);
  }

  /**
   * Get all synthesized formulas
   */
  getAllFormulas(): UnifiedFormula[] {
    return Array.from(this.synthesizedFormulas.values());
  }

  /**
   * Get formulas by application area
   */
  getFormulasByApplication(area: ApplicationArea): UnifiedFormula[] {
    return this.getAllFormulas().filter(f => f.applicationAreas.includes(area));
  }

  /**
   * Get all registered components
   */
  getComponents(): FormulaComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Verify formula integrity
   */
  verifyFormula(id: string): boolean {
    const formula = this.synthesizedFormulas.get(id);
    if (!formula) return false;

    const expectedHash = HashVerifier.hash(JSON.stringify({ ...formula, hash: '' }));
    return expectedHash === formula.hash;
  }

  /**
   * Export synthesis report
   */
  exportReport(): object {
    return {
      timestamp: new Date().toISOString(),
      totalComponents: this.components.size,
      totalFormulas: this.synthesizedFormulas.size,
      formulas: this.getAllFormulas().map(f => ({
        id: f.id,
        name: f.name,
        componentCount: f.components.length,
        validationScore: f.validationScore,
        complexity: f.complexity,
        applications: f.applicationAreas,
        hash: f.hash
      })),
      hash: HashVerifier.hash(JSON.stringify({
        components: this.components.size,
        formulas: this.synthesizedFormulas.size
      }))
    };
  }

  /**
   * Get hash for synthesis engine state
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      componentCount: this.components.size,
      formulaCount: this.synthesizedFormulas.size,
      config: this.config
    }));
  }
}

/**
 * Factory for creating synthesis engines
 */
export class SynthesisEngineFactory {
  static createDefault(): SynthesisEngine {
    return new SynthesisEngine();
  }

  static createForQuantumComputing(): SynthesisEngine {
    return new SynthesisEngine({
      targetApplications: ['quantum_computing'],
      complexityTarget: 'O(√n)'
    });
  }

  static createForOptimization(): SynthesisEngine {
    return new SynthesisEngine({
      targetApplications: ['optimization'],
      enableOptimization: true,
      minValidationScore: 0.9
    });
  }

  static createForPhysics(): SynthesisEngine {
    return new SynthesisEngine({
      targetApplications: ['physics_simulation'],
      maxComponents: 20
    });
  }
}
