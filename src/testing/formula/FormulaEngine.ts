/**
 * Qlaws Ham - Formula Engine Module (M07.01)
 * 
 * Creates automated formula generation system with parameter space exploration
 * and validation pipeline for multi-dimensional formula testing.
 * 
 * @module FormulaEngine
 * @version 1.0.0
 * @dependencies BigNumber (M01.03), Matrix (M01.05), Logger (M01.01)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';
import { BigNumber } from '../../core/math/BigNumber';
import { Matrix } from '../../core/math/Matrix';

/**
 * Formula operation types
 */
export enum OperationType {
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  POWER = 'power',
  SQRT = 'sqrt',
  EXP = 'exp',
  LOG = 'log',
  SIN = 'sin',
  COS = 'cos',
  CUSTOM = 'custom'
}

/**
 * Parameter type definition
 */
export enum ParameterType {
  SCALAR = 'scalar',
  VECTOR = 'vector',
  MATRIX = 'matrix',
  COMPLEX = 'complex',
  TENSOR = 'tensor'
}

/**
 * Formula validation status
 */
export enum ValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  DIMENSIONAL_ERROR = 'dimensional_error',
  NUMERICAL_ERROR = 'numerical_error',
  UNDEFINED = 'undefined'
}

/**
 * Parameter definition
 */
export interface Parameter {
  name: string;
  type: ParameterType;
  value: number | number[] | number[][];
  unit?: string;
  dimension?: number[];
  constraints?: {
    min?: number;
    max?: number;
    nonZero?: boolean;
    positive?: boolean;
    integer?: boolean;
  };
}

/**
 * Parameter space for exploration
 */
export interface ParameterSpace {
  name: string;
  parameters: ParameterDefinition[];
  constraints: SpaceConstraint[];
  dimensions: number;
  totalPoints: number;
}

/**
 * Parameter definition for space
 */
export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  range: {
    min: number;
    max: number;
    step: number;
  };
  distribution?: 'uniform' | 'logarithmic' | 'gaussian';
}

/**
 * Space constraint
 */
export interface SpaceConstraint {
  type: 'inequality' | 'equality' | 'function';
  expression: string;
  validate: (params: Map<string, number>) => boolean;
}

/**
 * Formula template
 */
export interface FormulaTemplate {
  id: string;
  name: string;
  expression: string;
  parameters: string[];
  operations: OperationType[];
  physicalMeaning?: string;
  expectedDimension?: string;
  hash: string;
}

/**
 * Evaluation result
 */
export interface EvaluationResult {
  formulaId: string;
  parameters: Map<string, Parameter>;
  result: number | number[] | null;
  status: ValidationStatus;
  executionTime: number;
  numericalError?: number;
  hash: string;
}

/**
 * Formula exploration result
 */
export interface ExplorationResult {
  space: ParameterSpace;
  evaluations: EvaluationResult[];
  validCount: number;
  invalidCount: number;
  bestResult?: EvaluationResult;
  worstResult?: EvaluationResult;
  statistics: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
  };
  hash: string;
}

/**
 * Formula class representing a mathematical formula
 */
export class Formula {
  private readonly id: string;
  private readonly name: string;
  private readonly expression: string;
  private readonly parameters: Map<string, Parameter>;
  private readonly evaluator: (params: Map<string, number>) => number;
  private readonly logger: Logger | null;

  constructor(
    name: string,
    expression: string,
    evaluator: (params: Map<string, number>) => number,
    logger: Logger | null = null
  ) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.expression = expression;
    this.parameters = new Map();
    this.evaluator = evaluator;
    this.logger = logger;
  }

  /**
   * Add parameter to formula
   */
  public addParameter(param: Parameter): void {
    this.parameters.set(param.name, param);
    this.log(LogLevel.DEBUG, `Added parameter: ${param.name}`);
  }

  /**
   * Set parameter value
   */
  public setParameter(name: string, value: number | number[] | number[][]): boolean {
    const param = this.parameters.get(name);
    if (!param) {
      this.log(LogLevel.WARN, `Parameter ${name} not found`);
      return false;
    }

    // Validate constraints
    if (typeof value === 'number' && param.constraints) {
      if (param.constraints.min !== undefined && value < param.constraints.min) {
        this.log(LogLevel.WARN, `Value below minimum for ${name}`);
        return false;
      }
      if (param.constraints.max !== undefined && value > param.constraints.max) {
        this.log(LogLevel.WARN, `Value above maximum for ${name}`);
        return false;
      }
      if (param.constraints.nonZero && value === 0) {
        this.log(LogLevel.WARN, `Zero value not allowed for ${name}`);
        return false;
      }
      if (param.constraints.positive && value <= 0) {
        this.log(LogLevel.WARN, `Non-positive value not allowed for ${name}`);
        return false;
      }
      if (param.constraints.integer && !Number.isInteger(value)) {
        this.log(LogLevel.WARN, `Non-integer value not allowed for ${name}`);
        return false;
      }
    }

    param.value = value;
    return true;
  }

  /**
   * Evaluate the formula with current parameters
   */
  public evaluate(): EvaluationResult {
    const startTime = performance.now();

    try {
      // Convert parameters to number map
      const paramValues = new Map<string, number>();
      for (const [name, param] of this.parameters) {
        if (typeof param.value === 'number') {
          paramValues.set(name, param.value);
        } else if (Array.isArray(param.value) && typeof param.value[0] === 'number') {
          // For arrays, use first element or sum
          paramValues.set(name, param.value[0] as number);
        }
      }

      const result = this.evaluator(paramValues);
      const executionTime = performance.now() - startTime;

      // Check for numerical issues
      let status = ValidationStatus.VALID;
      let numericalError: number | undefined;

      // Check NaN first since isFinite(NaN) is false
      if (isNaN(result)) {
        status = ValidationStatus.UNDEFINED;
      } else if (!isFinite(result)) {
        status = ValidationStatus.NUMERICAL_ERROR;
      }

      const evalResult: EvaluationResult = {
        formulaId: this.id,
        parameters: new Map(this.parameters),
        result,
        status,
        executionTime,
        numericalError,
        hash: ''
      };
      evalResult.hash = this.hashResult(evalResult);

      this.log(LogLevel.DEBUG, `Evaluated formula ${this.name}`, { result, status });

      return evalResult;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const evalResult: EvaluationResult = {
        formulaId: this.id,
        parameters: new Map(this.parameters),
        result: null,
        status: ValidationStatus.INVALID,
        executionTime,
        hash: ''
      };
      evalResult.hash = this.hashResult(evalResult);
      return evalResult;
    }
  }

  /**
   * Get formula ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get formula name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get expression
   */
  public getExpression(): string {
    return this.expression;
  }

  /**
   * Get parameters
   */
  public getParameters(): Map<string, Parameter> {
    return new Map(this.parameters);
  }

  /**
   * Create template from formula
   */
  public toTemplate(): FormulaTemplate {
    const template: FormulaTemplate = {
      id: this.id,
      name: this.name,
      expression: this.expression,
      parameters: Array.from(this.parameters.keys()),
      operations: this.extractOperations(),
      hash: ''
    };
    template.hash = this.hashTemplate(template);
    return template;
  }

  private extractOperations(): OperationType[] {
    const ops: OperationType[] = [];
    if (this.expression.includes('+')) ops.push(OperationType.ADD);
    if (this.expression.includes('-')) ops.push(OperationType.SUBTRACT);
    if (this.expression.includes('*')) ops.push(OperationType.MULTIPLY);
    if (this.expression.includes('/')) ops.push(OperationType.DIVIDE);
    if (this.expression.includes('^') || this.expression.includes('**')) ops.push(OperationType.POWER);
    if (this.expression.includes('sqrt')) ops.push(OperationType.SQRT);
    if (this.expression.includes('exp')) ops.push(OperationType.EXP);
    if (this.expression.includes('log')) ops.push(OperationType.LOG);
    if (this.expression.includes('sin')) ops.push(OperationType.SIN);
    if (this.expression.includes('cos')) ops.push(OperationType.COS);
    return ops;
  }

  private hashResult(result: EvaluationResult): string {
    const data = JSON.stringify({
      formulaId: result.formulaId,
      result: result.result,
      status: result.status
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private hashTemplate(template: FormulaTemplate): string {
    const data = JSON.stringify({
      name: template.name,
      expression: template.expression,
      parameters: template.parameters
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[Formula:${this.name}] ${message}`, context);
    }
  }
}

/**
 * Parameter space explorer
 */
export class ParameterSpaceExplorer {
  private readonly logger: Logger | null;
  private explorations: ExplorationResult[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Create parameter space
   */
  public createSpace(
    name: string,
    definitions: ParameterDefinition[],
    constraints: SpaceConstraint[] = []
  ): ParameterSpace {
    let totalPoints = 1;
    for (const def of definitions) {
      const steps = Math.floor((def.range.max - def.range.min) / def.range.step) + 1;
      totalPoints *= steps;
    }

    return {
      name,
      parameters: definitions,
      constraints,
      dimensions: definitions.length,
      totalPoints
    };
  }

  /**
   * Explore parameter space for a formula
   */
  public explore(
    formula: Formula,
    space: ParameterSpace,
    maxSamples: number = 1000
  ): ExplorationResult {
    this.log(LogLevel.INFO, `Exploring parameter space: ${space.name}`);

    const evaluations: EvaluationResult[] = [];
    const samplePoints = this.generateSamplePoints(space, maxSamples);

    for (const point of samplePoints) {
      // Set parameters
      for (const [name, value] of point) {
        formula.setParameter(name, value);
      }

      // Evaluate
      const result = formula.evaluate();
      evaluations.push(result);
    }

    // Calculate statistics
    const validResults = evaluations.filter(e => 
      e.status === ValidationStatus.VALID && typeof e.result === 'number'
    );
    const invalidResults = evaluations.filter(e => e.status !== ValidationStatus.VALID);

    const values = validResults.map(e => e.result as number);
    const statistics = this.calculateStatistics(values);

    // Find best/worst
    const sortedValid = [...validResults].sort((a, b) => 
      (a.result as number) - (b.result as number)
    );

    const exploration: ExplorationResult = {
      space,
      evaluations,
      validCount: validResults.length,
      invalidCount: invalidResults.length,
      bestResult: sortedValid[0],
      worstResult: sortedValid[sortedValid.length - 1],
      statistics,
      hash: ''
    };
    exploration.hash = this.hashExploration(exploration);

    this.explorations.push(exploration);
    this.log(LogLevel.INFO, `Exploration complete`, { 
      validCount: exploration.validCount,
      invalidCount: exploration.invalidCount 
    });

    return exploration;
  }

  /**
   * Generate sample points in parameter space
   */
  private generateSamplePoints(
    space: ParameterSpace,
    maxSamples: number
  ): Map<string, number>[] {
    const points: Map<string, number>[] = [];

    // If space is small enough, use grid sampling
    if (space.totalPoints <= maxSamples) {
      return this.gridSample(space);
    }

    // Otherwise, use random sampling
    for (let i = 0; i < maxSamples; i++) {
      const point = new Map<string, number>();
      let valid = true;

      for (const param of space.parameters) {
        const value = this.sampleValue(param);
        point.set(param.name, value);
      }

      // Check constraints
      for (const constraint of space.constraints) {
        if (!constraint.validate(point)) {
          valid = false;
          break;
        }
      }

      if (valid) {
        points.push(point);
      }
    }

    return points;
  }

  /**
   * Grid sample the parameter space
   */
  private gridSample(space: ParameterSpace): Map<string, number>[] {
    const points: Map<string, number>[] = [];
    const paramRanges: { name: string; values: number[] }[] = [];

    for (const param of space.parameters) {
      const values: number[] = [];
      for (let v = param.range.min; v <= param.range.max; v += param.range.step) {
        values.push(v);
      }
      paramRanges.push({ name: param.name, values });
    }

    // Generate all combinations
    const combinations = this.cartesianProduct(paramRanges.map(p => p.values));
    
    for (const combo of combinations) {
      const point = new Map<string, number>();
      for (let i = 0; i < paramRanges.length; i++) {
        point.set(paramRanges[i].name, combo[i]);
      }
      
      // Check constraints
      let valid = true;
      for (const constraint of space.constraints) {
        if (!constraint.validate(point)) {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        points.push(point);
      }
    }

    return points;
  }

  /**
   * Cartesian product of arrays
   */
  private cartesianProduct(arrays: number[][]): number[][] {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map(v => [v]);

    const result: number[][] = [];
    const rest = this.cartesianProduct(arrays.slice(1));
    
    for (const first of arrays[0]) {
      for (const restCombo of rest) {
        result.push([first, ...restCombo]);
      }
    }

    return result;
  }

  /**
   * Sample a single value from parameter definition
   */
  private sampleValue(param: ParameterDefinition): number {
    const { min, max } = param.range;
    
    switch (param.distribution) {
      case 'logarithmic':
        if (min <= 0) return min + Math.random() * (max - min);
        const logMin = Math.log(min);
        const logMax = Math.log(max);
        return Math.exp(logMin + Math.random() * (logMax - logMin));
      
      case 'gaussian':
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6; // 99.7% within range
        let value: number;
        do {
          const u1 = Math.random();
          const u2 = Math.random();
          const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          value = mean + stdDev * normal;
        } while (value < min || value > max);
        return value;
      
      case 'uniform':
      default:
        return min + Math.random() * (max - min);
    }
  }

  /**
   * Calculate statistics for values
   */
  private calculateStatistics(values: number[]): { mean: number; stdDev: number; min: number; max: number } {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { mean, stdDev, min, max };
  }

  /**
   * Get all explorations
   */
  public getExplorations(): ExplorationResult[] {
    return [...this.explorations];
  }

  /**
   * Clear explorations
   */
  public clear(): void {
    this.explorations = [];
  }

  private hashExploration(exploration: ExplorationResult): string {
    const data = JSON.stringify({
      spaceName: exploration.space.name,
      validCount: exploration.validCount,
      invalidCount: exploration.invalidCount,
      mean: exploration.statistics.mean
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ParameterSpaceExplorer] ${message}`, context);
    }
  }
}

/**
 * Formula validation pipeline
 */
export class ValidationPipeline {
  private readonly logger: Logger | null;
  private validations: Map<string, ValidationStatus[]> = new Map();

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Validate formula result
   */
  public validate(result: EvaluationResult, expectedRange?: { min: number; max: number }): ValidationStatus {
    // Check if result is valid
    if (result.status !== ValidationStatus.VALID) {
      this.recordValidation(result.formulaId, result.status);
      return result.status;
    }

    // Check numerical value
    if (typeof result.result !== 'number') {
      this.recordValidation(result.formulaId, ValidationStatus.INVALID);
      return ValidationStatus.INVALID;
    }

    // Check range
    if (expectedRange) {
      if (result.result < expectedRange.min || result.result > expectedRange.max) {
        this.recordValidation(result.formulaId, ValidationStatus.INVALID);
        return ValidationStatus.INVALID;
      }
    }

    this.recordValidation(result.formulaId, ValidationStatus.VALID);
    return ValidationStatus.VALID;
  }

  /**
   * Batch validate results
   */
  public batchValidate(
    results: EvaluationResult[],
    expectedRange?: { min: number; max: number }
  ): Map<string, ValidationStatus> {
    const validations = new Map<string, ValidationStatus>();
    
    for (const result of results) {
      const status = this.validate(result, expectedRange);
      validations.set(result.hash, status);
    }

    return validations;
  }

  /**
   * Get validation history for formula
   */
  public getValidationHistory(formulaId: string): ValidationStatus[] {
    return this.validations.get(formulaId) || [];
  }

  /**
   * Get validation statistics
   */
  public getStatistics(): { total: number; valid: number; invalid: number; errorRate: number } {
    let total = 0;
    let valid = 0;

    for (const history of this.validations.values()) {
      for (const status of history) {
        total++;
        if (status === ValidationStatus.VALID) valid++;
      }
    }

    return {
      total,
      valid,
      invalid: total - valid,
      errorRate: total > 0 ? (total - valid) / total : 0
    };
  }

  /**
   * Clear validation history
   */
  public clear(): void {
    this.validations.clear();
  }

  private recordValidation(formulaId: string, status: ValidationStatus): void {
    if (!this.validations.has(formulaId)) {
      this.validations.set(formulaId, []);
    }
    this.validations.get(formulaId)!.push(status);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ValidationPipeline] ${message}`, context);
    }
  }
}

/**
 * Main Formula Engine class
 */
export class FormulaEngine {
  private readonly logger: Logger | null;
  private formulas: Map<string, Formula> = new Map();
  private templates: Map<string, FormulaTemplate> = new Map();
  private readonly explorer: ParameterSpaceExplorer;
  private readonly validator: ValidationPipeline;
  private evaluationHistory: EvaluationResult[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
    this.explorer = new ParameterSpaceExplorer(logger);
    this.validator = new ValidationPipeline(logger);
    this.log(LogLevel.INFO, 'FormulaEngine initialized');
  }

  /**
   * Create a new formula
   */
  public createFormula(
    name: string,
    expression: string,
    evaluator: (params: Map<string, number>) => number
  ): Formula {
    const formula = new Formula(name, expression, evaluator, this.logger);
    this.formulas.set(formula.getId(), formula);
    
    const template = formula.toTemplate();
    this.templates.set(template.id, template);

    this.log(LogLevel.INFO, `Created formula: ${name}`);
    return formula;
  }

  /**
   * Register pre-built formula
   */
  public registerFormula(formula: Formula): void {
    this.formulas.set(formula.getId(), formula);
    const template = formula.toTemplate();
    this.templates.set(template.id, template);
    this.log(LogLevel.INFO, `Registered formula: ${formula.getName()}`);
  }

  /**
   * Create parameter space
   */
  public createParameterSpace(
    name: string,
    definitions: ParameterDefinition[],
    constraints: SpaceConstraint[] = []
  ): ParameterSpace {
    return this.explorer.createSpace(name, definitions, constraints);
  }

  /**
   * Explore parameter space for formula
   */
  public exploreSpace(
    formula: Formula,
    space: ParameterSpace,
    maxSamples: number = 1000
  ): ExplorationResult {
    return this.explorer.explore(formula, space, maxSamples);
  }

  /**
   * Evaluate formula
   */
  public evaluate(formula: Formula): EvaluationResult {
    const result = formula.evaluate();
    this.evaluationHistory.push(result);
    return result;
  }

  /**
   * Validate result
   */
  public validate(
    result: EvaluationResult,
    expectedRange?: { min: number; max: number }
  ): ValidationStatus {
    return this.validator.validate(result, expectedRange);
  }

  /**
   * Get formula by ID
   */
  public getFormula(id: string): Formula | undefined {
    return this.formulas.get(id);
  }

  /**
   * Get all formulas
   */
  public getAllFormulas(): Formula[] {
    return Array.from(this.formulas.values());
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): FormulaTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates
   */
  public getAllTemplates(): FormulaTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get explorer
   */
  public getExplorer(): ParameterSpaceExplorer {
    return this.explorer;
  }

  /**
   * Get validator
   */
  public getValidator(): ValidationPipeline {
    return this.validator;
  }

  /**
   * Get evaluation history
   */
  public getEvaluationHistory(): EvaluationResult[] {
    return [...this.evaluationHistory];
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    formulaCount: number;
    templateCount: number;
    evaluationCount: number;
    validationStats: { total: number; valid: number; invalid: number; errorRate: number };
    explorationCount: number;
  } {
    return {
      formulaCount: this.formulas.size,
      templateCount: this.templates.size,
      evaluationCount: this.evaluationHistory.length,
      validationStats: this.validator.getStatistics(),
      explorationCount: this.explorer.getExplorations().length
    };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.formulas.clear();
    this.templates.clear();
    this.evaluationHistory = [];
    this.explorer.clear();
    this.validator.clear();
    this.log(LogLevel.INFO, 'FormulaEngine cleared');
  }

  /**
   * Export to JSON
   */
  public toJSON(): object {
    return {
      formulas: Array.from(this.formulas.keys()),
      templates: Array.from(this.templates.values()),
      statistics: this.getStatistics()
    };
  }

  /**
   * Generate proof chain hash
   */
  public generateProofChainHash(): string {
    const data = JSON.stringify({
      formulaCount: this.formulas.size,
      templateHashes: Array.from(this.templates.values()).map(t => t.hash),
      evaluationCount: this.evaluationHistory.length
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[FormulaEngine] ${message}`, context);
    }
  }
}

/**
 * Factory for creating FormulaEngine instances
 */
export class FormulaEngineFactory {
  /**
   * Create FormulaEngine with optional logger
   */
  public static create(logger?: Logger): FormulaEngine {
    return new FormulaEngine(logger || null);
  }

  /**
   * Create FormulaEngine with common physics formulas
   */
  public static createWithPhysicsFormulas(logger?: Logger): FormulaEngine {
    const engine = new FormulaEngine(logger || null);

    // E = mc²
    const emc2 = engine.createFormula(
      'mass-energy',
      'E = m * c^2',
      (params) => {
        const m = params.get('m') || 0;
        const c = 299792458; // Speed of light
        return m * c * c;
      }
    );
    emc2.addParameter({ name: 'm', type: ParameterType.SCALAR, value: 1, unit: 'kg' });

    // F = ma
    const fma = engine.createFormula(
      'newton-second',
      'F = m * a',
      (params) => {
        const m = params.get('m') || 0;
        const a = params.get('a') || 0;
        return m * a;
      }
    );
    fma.addParameter({ name: 'm', type: ParameterType.SCALAR, value: 1, unit: 'kg' });
    fma.addParameter({ name: 'a', type: ParameterType.SCALAR, value: 9.8, unit: 'm/s²' });

    // Gravitational force
    const gravity = engine.createFormula(
      'gravitational-force',
      'F = G * m1 * m2 / r^2',
      (params) => {
        const G = 6.67430e-11;
        const m1 = params.get('m1') || 0;
        const m2 = params.get('m2') || 0;
        const r = params.get('r') || 1;
        return G * m1 * m2 / (r * r);
      }
    );
    gravity.addParameter({ name: 'm1', type: ParameterType.SCALAR, value: 1, unit: 'kg' });
    gravity.addParameter({ name: 'm2', type: ParameterType.SCALAR, value: 1, unit: 'kg' });
    gravity.addParameter({ name: 'r', type: ParameterType.SCALAR, value: 1, unit: 'm', constraints: { nonZero: true, positive: true } });

    return engine;
  }
}
