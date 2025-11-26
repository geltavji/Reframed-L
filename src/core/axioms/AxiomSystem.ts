/**
 * Qlaws Ham - AxiomSystem Module (M01.07)
 * 
 * Framework for creating, validating, and managing mathematical/physical axioms.
 * Creates axiom validation system with hash-verified proof chains.
 * Establishes proof requirements for new axioms.
 * 
 * @module AxiomSystem
 * @version 1.0.0
 * @dependencies Logger (M01.01), HashVerifier (M01.02), BigNumber (M01.03)
 */

import { Logger, LogLevel } from '../logger/Logger';
import { HashVerifier, HashChain, ProofType, ProofRecord } from '../logger/HashVerifier';
import { BigNumber } from '../math/BigNumber';

/**
 * Axiom status in the validation lifecycle
 */
export enum AxiomStatus {
  PROPOSED = 'proposed',
  TESTING = 'testing',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  DEPRECATED = 'deprecated'
}

/**
 * Axiom category for classification
 */
export enum AxiomCategory {
  MATHEMATICAL = 'mathematical',
  PHYSICAL = 'physical',
  COMPUTATIONAL = 'computational',
  QUANTUM = 'quantum',
  SPACETIME = 'spacetime',
  INFORMATION = 'information',
  UNIFIED = 'unified'
}

/**
 * Formula representation for formal axiom definitions
 */
export interface Formula {
  expression: string;
  variables: Map<string, FormulaVariable>;
  constraints: string[];
  domain: string;
  codomain: string;
}

/**
 * Variable in a formula
 */
export interface FormulaVariable {
  name: string;
  type: 'scalar' | 'vector' | 'matrix' | 'tensor' | 'operator' | 'function';
  domain: string;
  constraints?: string[];
}

/**
 * Implication derived from an axiom
 */
export interface Implication {
  id: string;
  statement: string;
  derivedFrom: string[];
  proofHash: string;
  verified: boolean;
}

/**
 * Test case for axiom validation
 */
export interface AxiomTest {
  id: string;
  description: string;
  input: Map<string, BigNumber | number | string>;
  expectedOutput: BigNumber | number | string | boolean;
  actualOutput?: BigNumber | number | string | boolean;
  passed?: boolean;
  executionTime?: number;
  hash: string;
}

/**
 * Core Axiom interface
 */
export interface Axiom {
  id: string;
  name: string;
  category: AxiomCategory;
  statement: string;
  formalDefinition: Formula;
  proofChain: ProofRecord[];
  hash: string;
  status: AxiomStatus;
  validationTests: AxiomTest[];
  implications: Implication[];
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Validation result for an axiom
 */
export interface ValidationResult {
  axiomId: string;
  valid: boolean;
  testsRun: number;
  testsPassed: number;
  testsFailed: number;
  consistencyCheck: boolean;
  contradictionCheck: boolean;
  proofVerified: boolean;
  hash: string;
  timestamp: Date;
  errors: string[];
  warnings: string[];
}

/**
 * Consistency check result
 */
export interface ConsistencyResult {
  consistent: boolean;
  checkedAxioms: string[];
  contradictions: string[];
  warnings: string[];
  hash: string;
}

/**
 * AxiomValidator - Validates axioms through testing and proof verification
 */
export class AxiomValidator {
  private logger: Logger;
  private hashChain: HashChain;
  private axiomRegistry: Map<string, Axiom>;

  constructor() {
    this.logger = Logger.getInstance();
    this.hashChain = new HashChain('AXIOM-VALIDATOR');
    this.axiomRegistry = new Map();
  }

  /**
   * Validate a single axiom
   */
  public validate(axiom: Axiom): ValidationResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    this.logger.info(`Validating axiom: ${axiom.name} (${axiom.id})`);

    // Run all validation tests
    let testsPassed = 0;
    let testsFailed = 0;

    for (const test of axiom.validationTests) {
      try {
        const result = this.runTest(axiom, test);
        if (result) {
          testsPassed++;
          test.passed = true;
        } else {
          testsFailed++;
          test.passed = false;
          errors.push(`Test ${test.id} failed: ${test.description}`);
        }
      } catch (error) {
        testsFailed++;
        test.passed = false;
        errors.push(`Test ${test.id} threw error: ${error}`);
      }
    }

    // Check consistency with other axioms
    const consistencyCheck = this.checkConsistency(axiom);
    if (!consistencyCheck.consistent) {
      errors.push(...consistencyCheck.contradictions);
    }
    warnings.push(...consistencyCheck.warnings);

    // Check for contradictions
    const contradictionCheck = this.checkContradictions(axiom);

    // Verify proof chain
    const proofVerified = this.verifyProofChain(axiom);
    if (!proofVerified) {
      errors.push('Proof chain verification failed');
    }

    const valid = testsFailed === 0 && 
                  consistencyCheck.consistent && 
                  contradictionCheck && 
                  proofVerified;

    const resultHash = HashVerifier.hash(JSON.stringify({
      axiomId: axiom.id,
      valid,
      testsRun: axiom.validationTests.length,
      testsPassed,
      testsFailed,
      consistencyCheck: consistencyCheck.consistent,
      contradictionCheck,
      proofVerified,
      timestamp: new Date().toISOString()
    }));

    // Record validation in proof chain
    this.hashChain.addRecord(
      ProofType.VALIDATION,
      JSON.stringify({ axiomId: axiom.id, axiomHash: axiom.hash }),
      JSON.stringify({ valid, resultHash }),
      { duration: Date.now() - startTime }
    );

    if (valid) {
      this.logger.proof(`Axiom ${axiom.name} validated successfully`, {
        testsRun: axiom.validationTests.length,
        testsPassed
      });
    } else {
      this.logger.error(`Axiom ${axiom.name} validation failed`, { errors });
    }

    return {
      axiomId: axiom.id,
      valid,
      testsRun: axiom.validationTests.length,
      testsPassed,
      testsFailed,
      consistencyCheck: consistencyCheck.consistent,
      contradictionCheck,
      proofVerified,
      hash: resultHash,
      timestamp: new Date(),
      errors,
      warnings
    };
  }

  /**
   * Run a single test case
   */
  private runTest(axiom: Axiom, test: AxiomTest): boolean {
    const startTime = Date.now();
    
    try {
      // Execute test based on axiom type
      const actualOutput = this.executeAxiomFormula(axiom.formalDefinition, test.input);
      test.actualOutput = actualOutput;
      test.executionTime = Date.now() - startTime;
      
      // Compare outputs
      return this.compareOutputs(test.expectedOutput, actualOutput);
    } catch (error) {
      test.executionTime = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Execute axiom formula with given inputs
   */
  private executeAxiomFormula(
    formula: Formula, 
    inputs: Map<string, BigNumber | number | string>
  ): BigNumber | number | string | boolean {
    // Basic formula evaluation
    // This is a simplified evaluator - real implementation would be more comprehensive
    let expression = formula.expression;
    
    for (const [varName, value] of inputs) {
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      if (value instanceof BigNumber) {
        expression = expression.replace(regex, value.toString());
      } else {
        expression = expression.replace(regex, String(value));
      }
    }

    // Evaluate simple mathematical expressions
    try {
      // Safe evaluation for mathematical expressions
      return this.evaluateMathExpression(expression);
    } catch {
      return expression;
    }
  }

  /**
   * Safely evaluate mathematical expression
   */
  private evaluateMathExpression(expr: string): number | boolean {
    // Replace common mathematical functions
    const safeExpr = expr
      .replace(/π/g, String(Math.PI))
      .replace(/e\b/g, String(Math.E))
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log(')
      .replace(/exp\(/g, 'Math.exp(')
      .replace(/pow\(/g, 'Math.pow(')
      .replace(/\^/g, '**');

    // Validate expression contains only safe characters
    if (!/^[\d\s+\-*/.()Math.sqrtabsincotnlegxp,<>=!&|?:]+$/.test(safeExpr)) {
      throw new Error('Invalid expression');
    }

    // Use Function constructor for safe evaluation
    const result = new Function(`return ${safeExpr}`)();
    return result;
  }

  /**
   * Compare expected and actual outputs
   */
  private compareOutputs(
    expected: BigNumber | number | string | boolean,
    actual: BigNumber | number | string | boolean
  ): boolean {
    if (expected instanceof BigNumber && actual instanceof BigNumber) {
      return expected.equals(actual);
    }
    if (typeof expected === 'number' && typeof actual === 'number') {
      // Allow for floating point tolerance
      return Math.abs(expected - actual) < 1e-10;
    }
    return expected === actual;
  }

  /**
   * Check consistency with other axioms in the registry
   */
  private checkConsistency(axiom: Axiom): ConsistencyResult {
    const contradictions: string[] = [];
    const warnings: string[] = [];
    const checkedAxioms: string[] = [];

    for (const [id, existingAxiom] of this.axiomRegistry) {
      if (id === axiom.id) continue;
      
      checkedAxioms.push(id);

      // Check for direct contradictions
      if (this.hasContradiction(axiom, existingAxiom)) {
        contradictions.push(`Contradiction with axiom ${existingAxiom.name} (${id})`);
      }

      // Check for potential conflicts
      if (this.hasPotentialConflict(axiom, existingAxiom)) {
        warnings.push(`Potential conflict with axiom ${existingAxiom.name} (${id})`);
      }
    }

    return {
      consistent: contradictions.length === 0,
      checkedAxioms,
      contradictions,
      warnings,
      hash: HashVerifier.hash(JSON.stringify({ 
        axiomId: axiom.id, 
        contradictions, 
        warnings 
      }))
    };
  }

  /**
   * Check if two axioms contradict each other
   */
  private hasContradiction(axiom1: Axiom, axiom2: Axiom): boolean {
    // Check if axioms have overlapping domains with conflicting statements
    const shared = this.getSharedVariables(axiom1, axiom2);
    
    if (shared.length > 0) {
      // Check for negation patterns
      const stmt1 = axiom1.statement.toLowerCase();
      const stmt2 = axiom2.statement.toLowerCase();
      
      // Simple contradiction detection
      if ((stmt1.includes('always') && stmt2.includes('never')) ||
          (stmt1.includes('never') && stmt2.includes('always'))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for potential conflicts between axioms
   */
  private hasPotentialConflict(axiom1: Axiom, axiom2: Axiom): boolean {
    // Check for overlapping domains that might cause issues
    const shared = this.getSharedVariables(axiom1, axiom2);
    return shared.length > 0 && axiom1.category === axiom2.category;
  }

  /**
   * Get variables shared between two axioms
   */
  private getSharedVariables(axiom1: Axiom, axiom2: Axiom): string[] {
    const vars1 = Array.from(axiom1.formalDefinition.variables.keys());
    const vars2 = Array.from(axiom2.formalDefinition.variables.keys());
    return vars1.filter(v => vars2.includes(v));
  }

  /**
   * Check for internal contradictions in an axiom
   */
  private checkContradictions(axiom: Axiom): boolean {
    // Check if implications contradict each other or the axiom itself
    for (let i = 0; i < axiom.implications.length; i++) {
      for (let j = i + 1; j < axiom.implications.length; j++) {
        if (this.implicationsContradict(axiom.implications[i], axiom.implications[j])) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if two implications contradict each other
   */
  private implicationsContradict(imp1: Implication, imp2: Implication): boolean {
    const stmt1 = imp1.statement.toLowerCase();
    const stmt2 = imp2.statement.toLowerCase();
    
    // Check for explicit negations
    if (stmt1.startsWith('not ') || stmt2.startsWith('not ')) {
      const base1 = stmt1.replace(/^not /, '');
      const base2 = stmt2.replace(/^not /, '');
      if (base1 === stmt2 || base2 === stmt1) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Verify the proof chain of an axiom
   */
  private verifyProofChain(axiom: Axiom): boolean {
    if (axiom.proofChain.length === 0) {
      // New axiom without proof chain is valid
      return true;
    }

    // Verify each link in the chain
    let previousHash = '0'.repeat(64);
    for (const record of axiom.proofChain) {
      // Verify the input and output hashes
      const expectedInputHash = HashVerifier.hash(record.input);
      const expectedOutputHash = HashVerifier.hash(record.output);
      
      if (record.inputHash !== expectedInputHash || 
          record.outputHash !== expectedOutputHash) {
        return false;
      }
      
      // Verify chain linking
      if (record.previousHash !== previousHash) {
        return false;
      }
      
      previousHash = record.chainHash;
    }
    
    return true;
  }

  /**
   * Register an axiom for consistency checking
   */
  public register(axiom: Axiom): void {
    this.axiomRegistry.set(axiom.id, axiom);
    this.logger.info(`Registered axiom: ${axiom.name}`, { id: axiom.id });
  }

  /**
   * Unregister an axiom
   */
  public unregister(axiomId: string): boolean {
    const result = this.axiomRegistry.delete(axiomId);
    if (result) {
      this.logger.info(`Unregistered axiom: ${axiomId}`);
    }
    return result;
  }

  /**
   * Get registered axiom by ID
   */
  public getAxiom(axiomId: string): Axiom | undefined {
    return this.axiomRegistry.get(axiomId);
  }

  /**
   * Get all registered axioms
   */
  public getAllAxioms(): Axiom[] {
    return Array.from(this.axiomRegistry.values());
  }

  /**
   * Get axioms by category
   */
  public getByCategory(category: AxiomCategory): Axiom[] {
    return this.getAllAxioms().filter(a => a.category === category);
  }

  /**
   * Get axioms by status
   */
  public getByStatus(status: AxiomStatus): Axiom[] {
    return this.getAllAxioms().filter(a => a.status === status);
  }

  /**
   * Get validation proof chain
   */
  public getProofChain(): HashChain {
    return this.hashChain;
  }
}

/**
 * AxiomBuilder - Fluent builder for creating axioms
 */
export class AxiomBuilder {
  private axiom: Partial<Axiom>;
  private hashChain: HashChain;

  constructor() {
    this.axiom = {
      validationTests: [],
      implications: [],
      dependencies: [],
      proofChain: [],
      status: AxiomStatus.PROPOSED,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.hashChain = new HashChain();
  }

  /**
   * Set axiom ID
   */
  public id(id: string): AxiomBuilder {
    this.axiom.id = id;
    return this;
  }

  /**
   * Set axiom name
   */
  public name(name: string): AxiomBuilder {
    this.axiom.name = name;
    return this;
  }

  /**
   * Set axiom category
   */
  public category(category: AxiomCategory): AxiomBuilder {
    this.axiom.category = category;
    return this;
  }

  /**
   * Set axiom statement
   */
  public statement(statement: string): AxiomBuilder {
    this.axiom.statement = statement;
    return this;
  }

  /**
   * Set formal definition
   */
  public formalDefinition(formula: Formula): AxiomBuilder {
    this.axiom.formalDefinition = formula;
    return this;
  }

  /**
   * Add dependency
   */
  public dependsOn(axiomId: string): AxiomBuilder {
    this.axiom.dependencies!.push(axiomId);
    return this;
  }

  /**
   * Add validation test
   */
  public addTest(test: Omit<AxiomTest, 'hash'>): AxiomBuilder {
    const testWithHash: AxiomTest = {
      ...test,
      hash: HashVerifier.hash(JSON.stringify({
        id: test.id,
        description: test.description,
        input: Object.fromEntries(test.input),
        expectedOutput: test.expectedOutput
      }))
    };
    this.axiom.validationTests!.push(testWithHash);
    return this;
  }

  /**
   * Add implication
   */
  public addImplication(statement: string, derivedFrom: string[] = []): AxiomBuilder {
    const implication: Implication = {
      id: `IMP-${this.axiom.implications!.length + 1}`,
      statement,
      derivedFrom,
      proofHash: HashVerifier.hash(statement + derivedFrom.join(',')),
      verified: false
    };
    this.axiom.implications!.push(implication);
    return this;
  }

  /**
   * Add proof record
   */
  public addProof(type: ProofType, input: string, output: string): AxiomBuilder {
    const record = this.hashChain.addRecord(type, input, output);
    this.axiom.proofChain!.push(record);
    return this;
  }

  /**
   * Set metadata
   */
  public metadata(data: Record<string, unknown>): AxiomBuilder {
    this.axiom.metadata = data;
    return this;
  }

  /**
   * Build the axiom
   */
  public build(): Axiom {
    if (!this.axiom.id || !this.axiom.name || !this.axiom.category || 
        !this.axiom.statement || !this.axiom.formalDefinition) {
      throw new Error('Axiom requires id, name, category, statement, and formalDefinition');
    }

    const axiom = this.axiom as Axiom;
    axiom.hash = HashVerifier.hash(JSON.stringify({
      id: axiom.id,
      name: axiom.name,
      category: axiom.category,
      statement: axiom.statement,
      formalDefinition: axiom.formalDefinition
    }));

    return axiom;
  }
}

/**
 * AxiomSystem - Main system for managing axioms
 */
export class AxiomSystem {
  private validator: AxiomValidator;
  private logger: Logger;
  private masterChain: HashChain;
  private coreAxioms: Map<string, Axiom>;

  constructor() {
    this.validator = new AxiomValidator();
    this.logger = Logger.getInstance();
    this.masterChain = new HashChain('AXIOM-SYSTEM-MASTER');
    this.coreAxioms = new Map();
    
    this.initializeCoreAxioms();
  }

  /**
   * Initialize the four core axioms from PRD
   */
  private initializeCoreAxioms(): void {
    // Axiom 1: Information Conservation
    const infoConservation = new AxiomBuilder()
      .id('AXIOM-001')
      .name('Information Conservation')
      .category(AxiomCategory.INFORMATION)
      .statement('Information cannot be created or destroyed, only transformed')
      .formalDefinition({
        expression: 'I_total = constant',
        variables: new Map([
          ['I_total', { name: 'I_total', type: 'scalar', domain: 'R+' }]
        ]),
        constraints: ['I_total >= 0', 'dI_total/dt = 0'],
        domain: 'All physical systems',
        codomain: 'R+'
      })
      .addImplication('All physical processes are reversible in principle')
      .addImplication('Black hole information paradox must have resolution')
      .addImplication('Quantum decoherence preserves information')
      .addTest({
        id: 'TEST-001-01',
        description: 'Information is preserved in isolated system',
        input: new Map([['I_total', 100]]),
        expectedOutput: 100
      })
      .addProof(ProofType.AXIOM, 'Information Conservation Axiom', 'I_total = constant')
      .build();

    // Axiom 2: Computational Universality
    const compUniversality = new AxiomBuilder()
      .id('AXIOM-002')
      .name('Computational Universality')
      .category(AxiomCategory.COMPUTATIONAL)
      .statement('Any physical process can be simulated computationally')
      .formalDefinition({
        expression: 'P_physical ⊆ P_computable',
        variables: new Map([
          ['P_physical', { name: 'P_physical', type: 'function', domain: 'Physical processes' }],
          ['P_computable', { name: 'P_computable', type: 'function', domain: 'Computable functions' }]
        ]),
        constraints: ['Church-Turing thesis holds'],
        domain: 'Physical processes',
        codomain: 'Computable functions'
      })
      .addImplication('Mathematics IS the universe operating system')
      .addImplication('Digital physics may be fundamental')
      .addImplication('Universe can be simulated with sufficient resources')
      .addTest({
        id: 'TEST-002-01',
        description: 'Physical process has computational equivalent',
        input: new Map([['process', 'gravity']]),
        expectedOutput: true
      })
      .addProof(ProofType.AXIOM, 'Computational Universality Axiom', 'P_physical ⊆ P_computable')
      .build();

    // Axiom 3: Scale Invariance
    const scaleInvariance = new AxiomBuilder()
      .id('AXIOM-003')
      .name('Scale Invariance')
      .category(AxiomCategory.PHYSICAL)
      .statement('Fundamental laws maintain form across all scales')
      .formalDefinition({
        expression: 'L(λx) = λ^d * L(x)',
        variables: new Map([
          ['L', { name: 'L', type: 'function', domain: 'Physical laws' }],
          ['x', { name: 'x', type: 'vector', domain: 'R^n' }],
          ['λ', { name: 'λ', type: 'scalar', domain: 'R+' }],
          ['d', { name: 'd', type: 'scalar', domain: 'Z', constraints: ['scaling dimension'] }]
        ]),
        constraints: ['λ > 0'],
        domain: 'Planck scale to cosmic scale',
        codomain: 'Physical observables'
      })
      .addImplication('Renormalization group flows describe physics at all scales')
      .addImplication('Fractal structures are universal')
      .addImplication('Self-similarity exists in nature')
      .addTest({
        id: 'TEST-003-01',
        description: 'Law form preserved under scaling',
        input: new Map([['λ', 2], ['d', 1], ['L_x', 5]]),
        expectedOutput: 10
      })
      .addProof(ProofType.AXIOM, 'Scale Invariance Axiom', 'L(λx) = λ^d * L(x)')
      .build();

    // Axiom 4: Discrete Spacetime
    const discreteSpacetime = new AxiomBuilder()
      .id('AXIOM-004')
      .name('Discrete Spacetime')
      .category(AxiomCategory.SPACETIME)
      .statement('Spacetime is fundamentally discrete at Planck scale')
      .formalDefinition({
        expression: 'Δx_min = l_P, Δt_min = t_P',
        variables: new Map([
          ['Δx_min', { name: 'Δx_min', type: 'scalar', domain: 'R+' }],
          ['Δt_min', { name: 'Δt_min', type: 'scalar', domain: 'R+' }],
          ['l_P', { name: 'l_P', type: 'scalar', domain: 'R+', constraints: ['Planck length'] }],
          ['t_P', { name: 't_P', type: 'scalar', domain: 'R+', constraints: ['Planck time'] }]
        ]),
        constraints: [
          'l_P ≈ 1.616255 × 10^-35 m',
          't_P ≈ 5.391247 × 10^-44 s'
        ],
        domain: 'Spacetime',
        codomain: 'Discrete lattice'
      })
      .addImplication('Continuous spacetime is emergent phenomenon')
      .addImplication('Quantum gravity must be discrete')
      .addImplication('Loop quantum gravity compatible')
      .addImplication('Causal sets may describe fundamental structure')
      .addTest({
        id: 'TEST-004-01',
        description: 'Minimum length equals Planck length',
        input: new Map([['l_P', 1.616255e-35]]),
        expectedOutput: 1.616255e-35
      })
      .addProof(ProofType.AXIOM, 'Discrete Spacetime Axiom', 'Δx_min = l_P, Δt_min = t_P')
      .build();

    // Register core axioms
    this.coreAxioms.set(infoConservation.id, infoConservation);
    this.coreAxioms.set(compUniversality.id, compUniversality);
    this.coreAxioms.set(scaleInvariance.id, scaleInvariance);
    this.coreAxioms.set(discreteSpacetime.id, discreteSpacetime);

    // Register with validator
    for (const axiom of this.coreAxioms.values()) {
      this.validator.register(axiom);
    }

    // Record initialization in master chain
    this.masterChain.addRecord(
      ProofType.INTEGRATION,
      'Core axioms initialization',
      JSON.stringify({
        axioms: Array.from(this.coreAxioms.keys()),
        count: this.coreAxioms.size
      })
    );

    this.logger.info('AxiomSystem initialized with core axioms', {
      count: this.coreAxioms.size,
      axioms: Array.from(this.coreAxioms.keys())
    });
  }

  /**
   * Create a new axiom using builder
   */
  public createAxiom(): AxiomBuilder {
    return new AxiomBuilder();
  }

  /**
   * Add axiom to the system
   */
  public addAxiom(axiom: Axiom): ValidationResult {
    // Validate the axiom first
    const result = this.validator.validate(axiom);

    if (result.valid) {
      this.validator.register(axiom);
      axiom.status = AxiomStatus.VALIDATED;
      axiom.validatedAt = new Date();

      // Record in master chain
      this.masterChain.addRecord(
        ProofType.AXIOM,
        JSON.stringify({ id: axiom.id, name: axiom.name }),
        JSON.stringify({ valid: true, hash: axiom.hash })
      );

      this.logger.proof(`Axiom ${axiom.name} added and validated`, { id: axiom.id });
    } else {
      axiom.status = AxiomStatus.REJECTED;
      this.logger.warn(`Axiom ${axiom.name} rejected`, { errors: result.errors });
    }

    return result;
  }

  /**
   * Remove axiom from the system
   */
  public removeAxiom(axiomId: string): boolean {
    return this.validator.unregister(axiomId);
  }

  /**
   * Get axiom by ID
   */
  public getAxiom(axiomId: string): Axiom | undefined {
    return this.validator.getAxiom(axiomId) || this.coreAxioms.get(axiomId);
  }

  /**
   * Get all axioms
   */
  public getAllAxioms(): Axiom[] {
    return this.validator.getAllAxioms();
  }

  /**
   * Get core axioms
   */
  public getCoreAxioms(): Axiom[] {
    return Array.from(this.coreAxioms.values());
  }

  /**
   * Get axioms by category
   */
  public getByCategory(category: AxiomCategory): Axiom[] {
    return this.validator.getByCategory(category);
  }

  /**
   * Get axioms by status
   */
  public getByStatus(status: AxiomStatus): Axiom[] {
    return this.validator.getByStatus(status);
  }

  /**
   * Validate all axioms
   */
  public validateAll(): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();
    
    for (const axiom of this.getAllAxioms()) {
      results.set(axiom.id, this.validator.validate(axiom));
    }

    return results;
  }

  /**
   * Check global consistency
   */
  public checkGlobalConsistency(): ConsistencyResult {
    const axioms = this.getAllAxioms();
    const contradictions: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < axioms.length; i++) {
      for (let j = i + 1; j < axioms.length; j++) {
        const result = this.checkPairConsistency(axioms[i], axioms[j]);
        contradictions.push(...result.contradictions);
        warnings.push(...result.warnings);
      }
    }

    return {
      consistent: contradictions.length === 0,
      checkedAxioms: axioms.map(a => a.id),
      contradictions,
      warnings,
      hash: HashVerifier.hash(JSON.stringify({ contradictions, warnings }))
    };
  }

  /**
   * Check consistency between two axioms
   */
  private checkPairConsistency(axiom1: Axiom, axiom2: Axiom): ConsistencyResult {
    const contradictions: string[] = [];
    const warnings: string[] = [];

    // Check if both axioms make claims about same domain
    if (axiom1.formalDefinition.domain === axiom2.formalDefinition.domain) {
      // Check for conflicting constraints
      for (const c1 of axiom1.formalDefinition.constraints) {
        for (const c2 of axiom2.formalDefinition.constraints) {
          if (this.constraintsConflict(c1, c2)) {
            contradictions.push(
              `Constraint conflict: "${c1}" (${axiom1.name}) vs "${c2}" (${axiom2.name})`
            );
          }
        }
      }
    }

    // Check implications for conflicts
    for (const imp1 of axiom1.implications) {
      for (const imp2 of axiom2.implications) {
        if (this.statementsConflict(imp1.statement, imp2.statement)) {
          warnings.push(
            `Implication conflict: "${imp1.statement}" vs "${imp2.statement}"`
          );
        }
      }
    }

    return {
      consistent: contradictions.length === 0,
      checkedAxioms: [axiom1.id, axiom2.id],
      contradictions,
      warnings,
      hash: HashVerifier.hash(JSON.stringify([axiom1.id, axiom2.id]))
    };
  }

  /**
   * Check if two constraints conflict
   */
  private constraintsConflict(c1: string, c2: string): boolean {
    // Detect direct negations
    if (c1.includes('>=') && c2.includes('<') && 
        c1.split('>=')[0].trim() === c2.split('<')[0].trim()) {
      return true;
    }
    if (c1.includes('<=') && c2.includes('>') && 
        c1.split('<=')[0].trim() === c2.split('>')[0].trim()) {
      return true;
    }
    return false;
  }

  /**
   * Check if two statements conflict
   */
  private statementsConflict(s1: string, s2: string): boolean {
    const l1 = s1.toLowerCase();
    const l2 = s2.toLowerCase();
    
    // Check for logical opposites
    if ((l1.includes('always') && l2.includes('never')) ||
        (l1.includes('never') && l2.includes('always')) ||
        (l1.includes('must') && l2.includes('cannot')) ||
        (l1.includes('cannot') && l2.includes('must'))) {
      // Check if they refer to the same subject
      const words1 = new Set(l1.split(/\s+/));
      const words2 = new Set(l2.split(/\s+/));
      const intersection = [...words1].filter(w => words2.has(w));
      return intersection.length > 3; // Significant overlap
    }
    
    return false;
  }

  /**
   * Get master proof chain
   */
  public getProofChain(): HashChain {
    return this.masterChain;
  }

  /**
   * Get validator proof chain
   */
  public getValidatorProofChain(): HashChain {
    return this.validator.getProofChain();
  }

  /**
   * Export system state to JSON
   */
  public exportToJson(): string {
    return JSON.stringify({
      coreAxioms: Array.from(this.coreAxioms.entries()).map(([id, axiom]) => ({
        id,
        name: axiom.name,
        category: axiom.category,
        status: axiom.status,
        hash: axiom.hash
      })),
      allAxioms: this.getAllAxioms().map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
        status: a.status,
        hash: a.hash
      })),
      masterChainRecords: this.masterChain.getRecordCount(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get system statistics
   */
  public getStatistics(): {
    totalAxioms: number;
    coreAxioms: number;
    validated: number;
    proposed: number;
    rejected: number;
    testing: number;
    deprecated: number;
    totalTests: number;
    totalImplications: number;
  } {
    const all = this.getAllAxioms();
    
    return {
      totalAxioms: all.length,
      coreAxioms: this.coreAxioms.size,
      validated: all.filter(a => a.status === AxiomStatus.VALIDATED).length,
      proposed: all.filter(a => a.status === AxiomStatus.PROPOSED).length,
      rejected: all.filter(a => a.status === AxiomStatus.REJECTED).length,
      testing: all.filter(a => a.status === AxiomStatus.TESTING).length,
      deprecated: all.filter(a => a.status === AxiomStatus.DEPRECATED).length,
      totalTests: all.reduce((sum, a) => sum + a.validationTests.length, 0),
      totalImplications: all.reduce((sum, a) => sum + a.implications.length, 0)
    };
  }
}
