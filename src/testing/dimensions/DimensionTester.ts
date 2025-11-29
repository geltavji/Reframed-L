/**
 * Qlaws Ham - Dimension Tester Module (M07.02)
 * 
 * Tests formulas across all dimension combinations, tracks dimensional
 * consistency, and validates results.
 * 
 * @module DimensionTester
 * @version 1.0.0
 * @dependencies UnitSystem (M01.08), FormulaEngine (M07.01), Logger (M01.01)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';
import { UnitSystem, Quantity, Unit } from '../../core/units/UnitSystem';
import { 
  FormulaEngine, 
  Formula, 
  EvaluationResult, 
  ValidationStatus,
  ParameterType
} from '../formula/FormulaEngine';

/**
 * Physical dimensions (length, mass, time, etc.)
 */
export enum PhysicalDimension {
  LENGTH = 'L',
  MASS = 'M',
  TIME = 'T',
  ELECTRIC_CURRENT = 'I',
  TEMPERATURE = 'Θ',
  AMOUNT_OF_SUBSTANCE = 'N',
  LUMINOUS_INTENSITY = 'J',
  DIMENSIONLESS = '1'
}

/**
 * Dimensional consistency check result
 */
export enum ConsistencyResult {
  CONSISTENT = 'consistent',
  INCONSISTENT = 'inconsistent',
  UNKNOWN = 'unknown',
  PARTIAL = 'partial'
}

/**
 * Dimensional exponents representation
 */
export interface DimensionalExponents {
  L: number;  // Length
  M: number;  // Mass
  T: number;  // Time
  I: number;  // Electric current
  Θ: number;  // Temperature
  N: number;  // Amount of substance
  J: number;  // Luminous intensity
}

/**
 * Dimensional analysis result
 */
export interface DimensionalAnalysis {
  formulaId: string;
  formulaName: string;
  inputDimensions: Map<string, DimensionalExponents>;
  outputDimensions: DimensionalExponents;
  isConsistent: boolean;
  consistencyResult: ConsistencyResult;
  violations: DimensionalViolation[];
  hash: string;
}

/**
 * Dimensional violation
 */
export interface DimensionalViolation {
  type: 'addition' | 'comparison' | 'function' | 'assignment';
  location: string;
  expected: DimensionalExponents;
  actual: DimensionalExponents;
  description: string;
}

/**
 * Consistency check result
 */
export interface ConsistencyCheck {
  formulaId: string;
  dimensionRange: number[];
  results: Map<number, boolean>;
  overallConsistency: ConsistencyResult;
  consistentDimensions: number[];
  inconsistentDimensions: number[];
  hash: string;
}

/**
 * Multi-dimensional test result
 */
export interface MultiDimensionalResult {
  formulaId: string;
  dimensions: number;
  parameters: Map<string, DimensionalExponents>;
  result: number | null;
  expectedDimension: DimensionalExponents;
  actualDimension: DimensionalExponents | null;
  isValid: boolean;
  executionTime: number;
  hash: string;
}

/**
 * Sweep result across dimensions
 */
export interface DimensionSweepResult {
  formulaId: string;
  dimensionRange: { min: number; max: number };
  results: MultiDimensionalResult[];
  successRate: number;
  validDimensions: number[];
  invalidDimensions: number[];
  statistics: {
    totalTests: number;
    passed: number;
    failed: number;
    avgExecutionTime: number;
  };
  hash: string;
}

/**
 * Zero dimensional exponents (dimensionless)
 */
export const DIMENSIONLESS: DimensionalExponents = {
  L: 0, M: 0, T: 0, I: 0, Θ: 0, N: 0, J: 0
};

/**
 * Common dimensional quantities
 */
export const CommonDimensions = {
  LENGTH: { L: 1, M: 0, T: 0, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  MASS: { L: 0, M: 1, T: 0, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  TIME: { L: 0, M: 0, T: 1, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  VELOCITY: { L: 1, M: 0, T: -1, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  ACCELERATION: { L: 1, M: 0, T: -2, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  FORCE: { L: 1, M: 1, T: -2, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  ENERGY: { L: 2, M: 1, T: -2, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  POWER: { L: 2, M: 1, T: -3, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  PRESSURE: { L: -1, M: 1, T: -2, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  MOMENTUM: { L: 1, M: 1, T: -1, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  ANGULAR_MOMENTUM: { L: 2, M: 1, T: -1, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents,
  FREQUENCY: { L: 0, M: 0, T: -1, I: 0, Θ: 0, N: 0, J: 0 } as DimensionalExponents
};

/**
 * Dimensional Analyzer class
 */
export class DimensionalAnalyzer {
  private readonly logger: Logger | null;
  private analyses: DimensionalAnalysis[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Analyze dimensional consistency of a formula
   */
  public analyze(
    formula: Formula,
    parameterDimensions: Map<string, DimensionalExponents>,
    expectedOutput: DimensionalExponents
  ): DimensionalAnalysis {
    this.log(LogLevel.DEBUG, `Analyzing formula: ${formula.getName()}`);

    const violations: DimensionalViolation[] = [];
    
    // Calculate output dimension based on formula structure
    const calculatedOutput = this.calculateOutputDimension(
      formula.getExpression(),
      parameterDimensions
    );

    // Check consistency
    const isConsistent = this.dimensionsEqual(calculatedOutput, expectedOutput);
    
    if (!isConsistent) {
      violations.push({
        type: 'assignment',
        location: 'output',
        expected: expectedOutput,
        actual: calculatedOutput,
        description: `Output dimension mismatch: expected ${this.dimensionToString(expectedOutput)}, got ${this.dimensionToString(calculatedOutput)}`
      });
    }

    const consistencyResult = violations.length === 0 
      ? ConsistencyResult.CONSISTENT 
      : ConsistencyResult.INCONSISTENT;

    const analysis: DimensionalAnalysis = {
      formulaId: formula.getId(),
      formulaName: formula.getName(),
      inputDimensions: parameterDimensions,
      outputDimensions: calculatedOutput,
      isConsistent,
      consistencyResult,
      violations,
      hash: ''
    };
    analysis.hash = this.hashAnalysis(analysis);

    this.analyses.push(analysis);
    this.log(LogLevel.INFO, `Analysis complete: ${consistencyResult}`);

    return analysis;
  }

  /**
   * Calculate output dimension from expression and parameter dimensions
   */
  private calculateOutputDimension(
    expression: string,
    paramDims: Map<string, DimensionalExponents>
  ): DimensionalExponents {
    // Simplified dimensional calculation
    // In a full implementation, this would parse the expression tree
    
    // For multiplication: add exponents
    // For division: subtract exponents
    // For addition/subtraction: dimensions must match
    // For power: multiply exponents by power

    // Simple heuristic: combine all dimensions
    const result = { ...DIMENSIONLESS };
    
    for (const dims of paramDims.values()) {
      result.L += dims.L;
      result.M += dims.M;
      result.T += dims.T;
      result.I += dims.I;
      result.Θ += dims.Θ;
      result.N += dims.N;
      result.J += dims.J;
    }

    return result;
  }

  /**
   * Check if two dimensional exponent sets are equal
   */
  public dimensionsEqual(a: DimensionalExponents, b: DimensionalExponents): boolean {
    return a.L === b.L && a.M === b.M && a.T === b.T &&
           a.I === b.I && a.Θ === b.Θ && a.N === b.N && a.J === b.J;
  }

  /**
   * Multiply dimensions (add exponents)
   */
  public multiplyDimensions(a: DimensionalExponents, b: DimensionalExponents): DimensionalExponents {
    return {
      L: a.L + b.L,
      M: a.M + b.M,
      T: a.T + b.T,
      I: a.I + b.I,
      Θ: a.Θ + b.Θ,
      N: a.N + b.N,
      J: a.J + b.J
    };
  }

  /**
   * Divide dimensions (subtract exponents)
   */
  public divideDimensions(a: DimensionalExponents, b: DimensionalExponents): DimensionalExponents {
    return {
      L: a.L - b.L,
      M: a.M - b.M,
      T: a.T - b.T,
      I: a.I - b.I,
      Θ: a.Θ - b.Θ,
      N: a.N - b.N,
      J: a.J - b.J
    };
  }

  /**
   * Power of dimensions (multiply exponents)
   */
  public powerDimension(dim: DimensionalExponents, power: number): DimensionalExponents {
    return {
      L: dim.L * power,
      M: dim.M * power,
      T: dim.T * power,
      I: dim.I * power,
      Θ: dim.Θ * power,
      N: dim.N * power,
      J: dim.J * power
    };
  }

  /**
   * Convert dimensions to string representation
   */
  public dimensionToString(dim: DimensionalExponents): string {
    const parts: string[] = [];
    if (dim.L !== 0) parts.push(`L^${dim.L}`);
    if (dim.M !== 0) parts.push(`M^${dim.M}`);
    if (dim.T !== 0) parts.push(`T^${dim.T}`);
    if (dim.I !== 0) parts.push(`I^${dim.I}`);
    if (dim.Θ !== 0) parts.push(`Θ^${dim.Θ}`);
    if (dim.N !== 0) parts.push(`N^${dim.N}`);
    if (dim.J !== 0) parts.push(`J^${dim.J}`);
    return parts.length > 0 ? parts.join(' ') : '1';
  }

  /**
   * Parse dimension string to exponents
   */
  public parseDimension(str: string): DimensionalExponents {
    const result = { ...DIMENSIONLESS };
    const regex = /([LMTIJNΘ])\^(-?\d+)/g;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      const dim = match[1];
      const exp = parseInt(match[2], 10);
      switch (dim) {
        case 'L': result.L = exp; break;
        case 'M': result.M = exp; break;
        case 'T': result.T = exp; break;
        case 'I': result.I = exp; break;
        case 'N': result.N = exp; break;
        case 'J': result.J = exp; break;
        case 'Θ': result.Θ = exp; break;
      }
    }
    
    return result;
  }

  /**
   * Get all analyses
   */
  public getAnalyses(): DimensionalAnalysis[] {
    return [...this.analyses];
  }

  /**
   * Clear analyses
   */
  public clear(): void {
    this.analyses = [];
  }

  private hashAnalysis(analysis: DimensionalAnalysis): string {
    const data = JSON.stringify({
      formulaId: analysis.formulaId,
      isConsistent: analysis.isConsistent,
      violationCount: analysis.violations.length
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[DimensionalAnalyzer] ${message}`, context);
    }
  }
}

/**
 * Consistency Checker class
 */
export class ConsistencyChecker {
  private readonly logger: Logger | null;
  private readonly analyzer: DimensionalAnalyzer;
  private checks: ConsistencyCheck[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
    this.analyzer = new DimensionalAnalyzer(logger);
  }

  /**
   * Check dimensional consistency across a range of dimensions
   */
  public check(
    formula: Formula,
    dimensionRange: number[],
    parameterDimensions: Map<string, DimensionalExponents>,
    expectedOutput: DimensionalExponents
  ): ConsistencyCheck {
    this.log(LogLevel.INFO, `Checking consistency for ${formula.getName()}`);

    const results = new Map<number, boolean>();
    const consistentDims: number[] = [];
    const inconsistentDims: number[] = [];

    for (const dim of dimensionRange) {
      // Scale dimensions for each D
      const scaledParams = new Map<string, DimensionalExponents>();
      for (const [name, dims] of parameterDimensions) {
        scaledParams.set(name, this.scaleDimension(dims, dim));
      }

      const analysis = this.analyzer.analyze(formula, scaledParams, expectedOutput);
      results.set(dim, analysis.isConsistent);

      if (analysis.isConsistent) {
        consistentDims.push(dim);
      } else {
        inconsistentDims.push(dim);
      }
    }

    let overallConsistency: ConsistencyResult;
    if (consistentDims.length === dimensionRange.length) {
      overallConsistency = ConsistencyResult.CONSISTENT;
    } else if (inconsistentDims.length === dimensionRange.length) {
      overallConsistency = ConsistencyResult.INCONSISTENT;
    } else {
      overallConsistency = ConsistencyResult.PARTIAL;
    }

    const check: ConsistencyCheck = {
      formulaId: formula.getId(),
      dimensionRange,
      results,
      overallConsistency,
      consistentDimensions: consistentDims,
      inconsistentDimensions: inconsistentDims,
      hash: ''
    };
    check.hash = this.hashCheck(check);

    this.checks.push(check);
    this.log(LogLevel.INFO, `Consistency check complete: ${overallConsistency}`);

    return check;
  }

  /**
   * Scale dimension for higher-dimensional spaces
   */
  private scaleDimension(dim: DimensionalExponents, factor: number): DimensionalExponents {
    // In higher dimensions, spatial dimensions scale
    return {
      L: dim.L * factor,
      M: dim.M,
      T: dim.T,
      I: dim.I,
      Θ: dim.Θ,
      N: dim.N,
      J: dim.J
    };
  }

  /**
   * Get analyzer
   */
  public getAnalyzer(): DimensionalAnalyzer {
    return this.analyzer;
  }

  /**
   * Get all checks
   */
  public getChecks(): ConsistencyCheck[] {
    return [...this.checks];
  }

  /**
   * Clear checks
   */
  public clear(): void {
    this.checks = [];
    this.analyzer.clear();
  }

  private hashCheck(check: ConsistencyCheck): string {
    const data = JSON.stringify({
      formulaId: check.formulaId,
      overallConsistency: check.overallConsistency,
      consistentCount: check.consistentDimensions.length
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ConsistencyChecker] ${message}`, context);
    }
  }
}

/**
 * Main DimensionTester class
 */
export class DimensionTester {
  private readonly logger: Logger | null;
  private readonly engine: FormulaEngine;
  private readonly analyzer: DimensionalAnalyzer;
  private readonly checker: ConsistencyChecker;
  private testResults: MultiDimensionalResult[] = [];
  private sweepResults: DimensionSweepResult[] = [];

  constructor(engine: FormulaEngine, logger: Logger | null = null) {
    this.logger = logger;
    this.engine = engine;
    this.analyzer = new DimensionalAnalyzer(logger);
    this.checker = new ConsistencyChecker(logger);
    this.log(LogLevel.INFO, 'DimensionTester initialized');
  }

  /**
   * Test formula at specific dimension
   */
  public test(
    formula: Formula,
    dimensions: number,
    parameterDimensions: Map<string, DimensionalExponents>,
    expectedOutput: DimensionalExponents
  ): MultiDimensionalResult {
    const startTime = performance.now();

    // Analyze dimensional consistency
    const analysis = this.analyzer.analyze(formula, parameterDimensions, expectedOutput);

    // Evaluate formula
    const evalResult = formula.evaluate();
    const executionTime = performance.now() - startTime;

    const result: MultiDimensionalResult = {
      formulaId: formula.getId(),
      dimensions,
      parameters: parameterDimensions,
      result: typeof evalResult.result === 'number' ? evalResult.result : null,
      expectedDimension: expectedOutput,
      actualDimension: analysis.outputDimensions,
      isValid: analysis.isConsistent && evalResult.status === ValidationStatus.VALID,
      executionTime,
      hash: ''
    };
    result.hash = this.hashResult(result);

    this.testResults.push(result);
    this.log(LogLevel.DEBUG, `Test at D=${dimensions}`, { isValid: result.isValid });

    return result;
  }

  /**
   * Sweep across dimension range
   */
  public sweep(
    formula: Formula,
    minDimension: number,
    maxDimension: number,
    parameterDimensions: Map<string, DimensionalExponents>,
    expectedOutput: DimensionalExponents
  ): DimensionSweepResult {
    this.log(LogLevel.INFO, `Sweeping dimensions ${minDimension} to ${maxDimension}`);

    const results: MultiDimensionalResult[] = [];
    const validDimensions: number[] = [];
    const invalidDimensions: number[] = [];
    let totalTime = 0;

    for (let d = minDimension; d <= maxDimension; d++) {
      // Scale parameter dimensions for this D
      const scaledParams = new Map<string, DimensionalExponents>();
      for (const [name, dims] of parameterDimensions) {
        scaledParams.set(name, {
          L: dims.L, // Keep dimensions same for sweep
          M: dims.M,
          T: dims.T,
          I: dims.I,
          Θ: dims.Θ,
          N: dims.N,
          J: dims.J
        });
      }

      const result = this.test(formula, d, scaledParams, expectedOutput);
      results.push(result);
      totalTime += result.executionTime;

      if (result.isValid) {
        validDimensions.push(d);
      } else {
        invalidDimensions.push(d);
      }
    }

    const totalTests = results.length;
    const passed = validDimensions.length;

    const sweepResult: DimensionSweepResult = {
      formulaId: formula.getId(),
      dimensionRange: { min: minDimension, max: maxDimension },
      results,
      successRate: totalTests > 0 ? passed / totalTests : 0,
      validDimensions,
      invalidDimensions,
      statistics: {
        totalTests,
        passed,
        failed: totalTests - passed,
        avgExecutionTime: totalTests > 0 ? totalTime / totalTests : 0
      },
      hash: ''
    };
    sweepResult.hash = this.hashSweep(sweepResult);

    this.sweepResults.push(sweepResult);
    this.log(LogLevel.INFO, `Sweep complete`, { successRate: sweepResult.successRate });

    return sweepResult;
  }

  /**
   * Analyze formula dimensions
   */
  public analyze(
    formula: Formula,
    parameterDimensions: Map<string, DimensionalExponents>,
    expectedOutput: DimensionalExponents
  ): DimensionalAnalysis {
    return this.analyzer.analyze(formula, parameterDimensions, expectedOutput);
  }

  /**
   * Check consistency across dimensions
   */
  public checkConsistency(
    formula: Formula,
    dimensionRange: number[],
    parameterDimensions: Map<string, DimensionalExponents>,
    expectedOutput: DimensionalExponents
  ): ConsistencyCheck {
    return this.checker.check(formula, dimensionRange, parameterDimensions, expectedOutput);
  }

  /**
   * Get the formula engine
   */
  public getEngine(): FormulaEngine {
    return this.engine;
  }

  /**
   * Get the dimensional analyzer
   */
  public getAnalyzer(): DimensionalAnalyzer {
    return this.analyzer;
  }

  /**
   * Get the consistency checker
   */
  public getChecker(): ConsistencyChecker {
    return this.checker;
  }

  /**
   * Get all test results
   */
  public getTestResults(): MultiDimensionalResult[] {
    return [...this.testResults];
  }

  /**
   * Get all sweep results
   */
  public getSweepResults(): DimensionSweepResult[] {
    return [...this.sweepResults];
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    totalTests: number;
    validTests: number;
    invalidTests: number;
    sweepCount: number;
    avgSuccessRate: number;
  } {
    const validTests = this.testResults.filter(r => r.isValid).length;
    const avgSuccessRate = this.sweepResults.length > 0
      ? this.sweepResults.reduce((sum, s) => sum + s.successRate, 0) / this.sweepResults.length
      : 0;

    return {
      totalTests: this.testResults.length,
      validTests,
      invalidTests: this.testResults.length - validTests,
      sweepCount: this.sweepResults.length,
      avgSuccessRate
    };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.testResults = [];
    this.sweepResults = [];
    this.analyzer.clear();
    this.checker.clear();
    this.log(LogLevel.INFO, 'DimensionTester cleared');
  }

  /**
   * Export to JSON
   */
  public toJSON(): object {
    return {
      testResults: this.testResults,
      sweepResults: this.sweepResults,
      statistics: this.getStatistics()
    };
  }

  /**
   * Generate proof chain hash
   */
  public generateProofChainHash(): string {
    const data = JSON.stringify({
      testCount: this.testResults.length,
      sweepCount: this.sweepResults.length,
      resultHashes: this.testResults.map(r => r.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashResult(result: MultiDimensionalResult): string {
    const data = JSON.stringify({
      formulaId: result.formulaId,
      dimensions: result.dimensions,
      isValid: result.isValid,
      result: result.result
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private hashSweep(sweep: DimensionSweepResult): string {
    const data = JSON.stringify({
      formulaId: sweep.formulaId,
      successRate: sweep.successRate,
      totalTests: sweep.statistics.totalTests,
      dimensionMin: sweep.dimensionRange.min,
      dimensionMax: sweep.dimensionRange.max
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[DimensionTester] ${message}`, context);
    }
  }
}

/**
 * Factory for creating DimensionTester instances
 */
export class DimensionTesterFactory {
  /**
   * Create DimensionTester with optional engine and logger
   */
  public static create(engine?: FormulaEngine, logger?: Logger): DimensionTester {
    const eng = engine || new FormulaEngine(logger || null);
    return new DimensionTester(eng, logger || null);
  }

  /**
   * Create DimensionTester with physics formulas pre-loaded
   */
  public static createWithPhysics(logger?: Logger): DimensionTester {
    const engine = new FormulaEngine(logger || null);
    
    // E = mc² (Energy = Mass × Speed²)
    const emc2 = engine.createFormula(
      'energy-mass',
      'E = m * c^2',
      (p) => {
        const m = p.get('m') || 0;
        const c = 299792458;
        return m * c * c;
      }
    );
    emc2.addParameter({ name: 'm', type: ParameterType.SCALAR, value: 1, unit: 'kg' });

    // F = ma (Force = Mass × Acceleration)
    const fma = engine.createFormula(
      'force-acceleration',
      'F = m * a',
      (p) => {
        const m = p.get('m') || 0;
        const a = p.get('a') || 0;
        return m * a;
      }
    );
    fma.addParameter({ name: 'm', type: ParameterType.SCALAR, value: 1, unit: 'kg' });
    fma.addParameter({ name: 'a', type: ParameterType.SCALAR, value: 1, unit: 'm/s²' });

    return new DimensionTester(engine, logger || null);
  }
}
