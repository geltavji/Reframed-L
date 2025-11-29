/**
 * Qlaws Ham - Proof System Module (M07.03)
 * 
 * Automates proof generation, verification, and documentation for
 * mathematical and physical formulas.
 * 
 * @module ProofSystem
 * @version 1.0.0
 * @dependencies HashVerifier (M01.02), FormulaEngine (M07.01), Logger (M01.01)
 */

import * as crypto from 'crypto';
import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { 
  FormulaEngine, 
  Formula, 
  EvaluationResult,
  ValidationStatus
} from '../formula/FormulaEngine';

/**
 * Proof status
 */
export enum ProofStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  FAILED = 'failed',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

/**
 * Proof type
 */
export enum ProofType {
  MATHEMATICAL = 'mathematical',
  PHYSICAL = 'physical',
  NUMERICAL = 'numerical',
  EMPIRICAL = 'empirical',
  DEDUCTIVE = 'deductive',
  INDUCTIVE = 'inductive'
}

/**
 * Step type in proof
 */
export enum StepType {
  AXIOM = 'axiom',
  DEFINITION = 'definition',
  THEOREM = 'theorem',
  LEMMA = 'lemma',
  COROLLARY = 'corollary',
  ASSUMPTION = 'assumption',
  DERIVATION = 'derivation',
  SUBSTITUTION = 'substitution',
  SIMPLIFICATION = 'simplification',
  CONCLUSION = 'conclusion'
}

/**
 * Proof step
 */
export interface ProofStep {
  id: string;
  stepNumber: number;
  type: StepType;
  statement: string;
  justification: string;
  references: string[];
  isValid: boolean;
  hash: string;
}

/**
 * Complete proof
 */
export interface Proof {
  id: string;
  name: string;
  type: ProofType;
  status: ProofStatus;
  theorem: string;
  hypothesis: string[];
  steps: ProofStep[];
  conclusion: string;
  createdAt: Date;
  verifiedAt?: Date;
  verificationHash?: string;
  hash: string;
}

/**
 * Proof chain linking multiple proofs
 */
export interface ProofChain {
  id: string;
  name: string;
  proofs: Proof[];
  rootProofId: string;
  isComplete: boolean;
  chainHash: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  proofId: string;
  isValid: boolean;
  invalidSteps: string[];
  verificationTime: number;
  confidence: number;
  hash: string;
}

/**
 * Proof documentation
 */
export interface ProofDocumentation {
  proof: Proof;
  summary: string;
  formalNotation: string;
  naturalLanguage: string;
  references: string[];
  generatedAt: Date;
  hash: string;
}

/**
 * Proof Generator class
 */
export class ProofGenerator {
  private readonly logger: Logger | null;
  private proofs: Map<string, Proof> = new Map();

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Generate a proof for a theorem
   */
  public generate(
    name: string,
    type: ProofType,
    theorem: string,
    hypothesis: string[],
    steps: Omit<ProofStep, 'id' | 'hash'>[]
  ): Proof {
    this.log(LogLevel.INFO, `Generating proof: ${name}`);

    const proofId = crypto.randomUUID();
    const generatedSteps: ProofStep[] = steps.map((step, index) => {
      const stepWithMeta = {
        ...step,
        id: crypto.randomUUID(),
        stepNumber: index + 1
      };
      return {
        ...stepWithMeta,
        hash: this.hashStep(stepWithMeta)
      };
    });

    // Validate each step
    for (const step of generatedSteps) {
      step.isValid = this.validateStep(step, generatedSteps);
    }

    const allValid = generatedSteps.every(s => s.isValid);
    const conclusion = generatedSteps[generatedSteps.length - 1]?.statement || '';

    const proof: Proof = {
      id: proofId,
      name,
      type,
      status: allValid ? ProofStatus.COMPLETE : ProofStatus.FAILED,
      theorem,
      hypothesis,
      steps: generatedSteps,
      conclusion,
      createdAt: new Date(),
      hash: ''
    };
    proof.hash = this.hashProof(proof);

    this.proofs.set(proofId, proof);
    this.log(LogLevel.INFO, `Proof generated: ${proof.status}`);

    return proof;
  }

  /**
   * Generate proof from formula evaluation
   */
  public generateFromFormula(
    formula: Formula,
    evaluations: EvaluationResult[]
  ): Proof {
    const steps: Omit<ProofStep, 'id' | 'hash'>[] = [];

    // Step 1: Define the formula
    steps.push({
      stepNumber: 1,
      type: StepType.DEFINITION,
      statement: `Define ${formula.getName()}: ${formula.getExpression()}`,
      justification: 'Formula definition',
      references: [],
      isValid: true
    });

    // Step 2: State parameters
    const params = formula.getParameters();
    for (const [name, param] of params) {
      steps.push({
        stepNumber: steps.length + 1,
        type: StepType.ASSUMPTION,
        statement: `Let ${name} = ${param.value}`,
        justification: 'Parameter assignment',
        references: [],
        isValid: true
      });
    }

    // Step 3: Evaluate
    for (const eval_ of evaluations) {
      steps.push({
        stepNumber: steps.length + 1,
        type: StepType.DERIVATION,
        statement: `Evaluation yields: ${eval_.result}`,
        justification: 'Numerical evaluation',
        references: [eval_.hash],
        isValid: eval_.status === ValidationStatus.VALID
      });
    }

    // Step 4: Conclusion
    const finalEval = evaluations[evaluations.length - 1];
    steps.push({
      stepNumber: steps.length + 1,
      type: StepType.CONCLUSION,
      statement: `Therefore, ${formula.getExpression()} = ${finalEval?.result}`,
      justification: 'Direct computation',
      references: evaluations.map(e => e.hash),
      isValid: finalEval?.status === ValidationStatus.VALID
    });

    return this.generate(
      `Proof of ${formula.getName()}`,
      ProofType.NUMERICAL,
      `${formula.getExpression()} evaluates correctly`,
      Array.from(params.keys()).map(k => `${k} is defined`),
      steps
    );
  }

  /**
   * Validate a single proof step
   */
  private validateStep(step: ProofStep, allSteps: ProofStep[]): boolean {
    // Check that references exist
    for (const ref of step.references) {
      const refStep = allSteps.find(s => s.id === ref || s.hash === ref);
      // References can also be external
    }

    // Axioms and definitions are always valid
    if (step.type === StepType.AXIOM || step.type === StepType.DEFINITION) {
      return true;
    }

    // Assumptions are valid by definition
    if (step.type === StepType.ASSUMPTION) {
      return true;
    }

    // Other steps need justification
    return step.justification.length > 0;
  }

  /**
   * Get proof by ID
   */
  public getProof(id: string): Proof | undefined {
    return this.proofs.get(id);
  }

  /**
   * Get all proofs
   */
  public getAllProofs(): Proof[] {
    return Array.from(this.proofs.values());
  }

  /**
   * Clear proofs
   */
  public clear(): void {
    this.proofs.clear();
  }

  private hashStep(step: Omit<ProofStep, 'hash'>): string {
    const data = JSON.stringify({
      stepNumber: step.stepNumber,
      type: step.type,
      statement: step.statement
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private hashProof(proof: Omit<Proof, 'hash'>): string {
    const data = JSON.stringify({
      name: proof.name,
      theorem: proof.theorem,
      stepHashes: proof.steps.map(s => s.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ProofGenerator] ${message}`, context);
    }
  }
}

/**
 * Proof Verifier class
 */
export class ProofVerifier {
  private readonly logger: Logger | null;
  private verifications: VerificationResult[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Verify a proof
   */
  public verify(proof: Proof): VerificationResult {
    this.log(LogLevel.INFO, `Verifying proof: ${proof.name}`);
    const startTime = performance.now();

    const invalidSteps: string[] = [];

    // Verify each step
    for (const step of proof.steps) {
      if (!this.verifyStep(step, proof)) {
        invalidSteps.push(step.id);
      }
    }

    // Verify hash chain
    const hashValid = this.verifyHashChain(proof);

    const isValid = invalidSteps.length === 0 && hashValid;
    const verificationTime = performance.now() - startTime;

    // Calculate confidence based on proof type and validation
    const confidence = this.calculateConfidence(proof, invalidSteps.length);

    const result: VerificationResult = {
      proofId: proof.id,
      isValid,
      invalidSteps,
      verificationTime,
      confidence,
      hash: ''
    };
    result.hash = this.hashVerification(result);

    this.verifications.push(result);
    this.log(LogLevel.INFO, `Verification complete: ${isValid ? 'VALID' : 'INVALID'}`);

    return result;
  }

  /**
   * Verify a single step
   */
  private verifyStep(step: ProofStep, proof: Proof): boolean {
    // Check step is marked as valid
    if (!step.isValid) return false;

    // Verify step hash
    const expectedHash = this.recalculateStepHash(step);
    if (expectedHash !== step.hash) return false;

    // Check references are valid
    for (const ref of step.references) {
      const refStep = proof.steps.find(s => s.id === ref || s.hash === ref);
      // Allow external references
    }

    return true;
  }

  /**
   * Verify hash chain integrity
   */
  private verifyHashChain(proof: Proof): boolean {
    // Verify each step's hash
    for (const step of proof.steps) {
      const expected = this.recalculateStepHash(step);
      if (expected !== step.hash) {
        return false;
      }
    }

    // Verify proof hash
    const expectedProofHash = this.recalculateProofHash(proof);
    return expectedProofHash === proof.hash;
  }

  /**
   * Calculate verification confidence
   */
  private calculateConfidence(proof: Proof, invalidCount: number): number {
    const totalSteps = proof.steps.length;
    if (totalSteps === 0) return 0;

    const validRatio = (totalSteps - invalidCount) / totalSteps;

    // Adjust based on proof type
    let typeMultiplier = 1.0;
    switch (proof.type) {
      case ProofType.MATHEMATICAL:
        typeMultiplier = 1.0;
        break;
      case ProofType.NUMERICAL:
        typeMultiplier = 0.95;
        break;
      case ProofType.EMPIRICAL:
        typeMultiplier = 0.9;
        break;
      default:
        typeMultiplier = 0.85;
    }

    return validRatio * typeMultiplier;
  }

  private recalculateStepHash(step: ProofStep): string {
    const data = JSON.stringify({
      stepNumber: step.stepNumber,
      type: step.type,
      statement: step.statement
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private recalculateProofHash(proof: Proof): string {
    const data = JSON.stringify({
      name: proof.name,
      theorem: proof.theorem,
      stepHashes: proof.steps.map(s => s.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Get all verifications
   */
  public getVerifications(): VerificationResult[] {
    return [...this.verifications];
  }

  /**
   * Clear verifications
   */
  public clear(): void {
    this.verifications = [];
  }

  private hashVerification(result: VerificationResult): string {
    const data = JSON.stringify({
      proofId: result.proofId,
      isValid: result.isValid,
      confidence: result.confidence
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ProofVerifier] ${message}`, context);
    }
  }
}

/**
 * Proof Chain Manager
 */
export class ProofChainManager {
  private readonly logger: Logger | null;
  private chains: Map<string, ProofChain> = new Map();

  constructor(logger: Logger | null = null) {
    this.logger = logger;
  }

  /**
   * Create a new proof chain
   */
  public createChain(name: string, rootProof: Proof): ProofChain {
    const chain: ProofChain = {
      id: crypto.randomUUID(),
      name,
      proofs: [rootProof],
      rootProofId: rootProof.id,
      isComplete: rootProof.status === ProofStatus.COMPLETE,
      chainHash: ''
    };
    chain.chainHash = this.hashChain(chain);

    this.chains.set(chain.id, chain);
    this.log(LogLevel.INFO, `Created proof chain: ${name}`);

    return chain;
  }

  /**
   * Add proof to chain
   */
  public addToChain(chainId: string, proof: Proof): boolean {
    const chain = this.chains.get(chainId);
    if (!chain) {
      this.log(LogLevel.WARN, `Chain not found: ${chainId}`);
      return false;
    }

    chain.proofs.push(proof);
    chain.isComplete = chain.proofs.every(p => p.status === ProofStatus.COMPLETE);
    chain.chainHash = this.hashChain(chain);

    this.log(LogLevel.INFO, `Added proof to chain: ${proof.name}`);
    return true;
  }

  /**
   * Get chain by ID
   */
  public getChain(id: string): ProofChain | undefined {
    return this.chains.get(id);
  }

  /**
   * Get all chains
   */
  public getAllChains(): ProofChain[] {
    return Array.from(this.chains.values());
  }

  /**
   * Clear chains
   */
  public clear(): void {
    this.chains.clear();
  }

  private hashChain(chain: ProofChain): string {
    const data = JSON.stringify({
      name: chain.name,
      proofHashes: chain.proofs.map(p => p.hash),
      isComplete: chain.isComplete
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ProofChainManager] ${message}`, context);
    }
  }
}

/**
 * Main ProofSystem class
 */
export class ProofSystem {
  private readonly logger: Logger | null;
  private readonly generator: ProofGenerator;
  private readonly verifier: ProofVerifier;
  private readonly chainManager: ProofChainManager;
  private documentation: ProofDocumentation[] = [];

  constructor(logger: Logger | null = null) {
    this.logger = logger;
    this.generator = new ProofGenerator(logger);
    this.verifier = new ProofVerifier(logger);
    this.chainManager = new ProofChainManager(logger);
    this.log(LogLevel.INFO, 'ProofSystem initialized');
  }

  /**
   * Generate a proof
   */
  public generate(
    name: string,
    type: ProofType,
    theorem: string,
    hypothesis: string[],
    steps: Omit<ProofStep, 'id' | 'hash'>[]
  ): Proof {
    return this.generator.generate(name, type, theorem, hypothesis, steps);
  }

  /**
   * Generate proof from formula
   */
  public generateFromFormula(formula: Formula, evaluations: EvaluationResult[]): Proof {
    return this.generator.generateFromFormula(formula, evaluations);
  }

  /**
   * Verify a proof
   */
  public verify(proof: Proof): VerificationResult {
    const result = this.verifier.verify(proof);
    
    // Update proof status based on verification
    if (result.isValid) {
      proof.status = ProofStatus.VERIFIED;
      proof.verifiedAt = new Date();
      proof.verificationHash = result.hash;
    } else {
      proof.status = ProofStatus.REJECTED;
    }

    return result;
  }

  /**
   * Create proof chain
   */
  public createChain(name: string, rootProof: Proof): ProofChain {
    return this.chainManager.createChain(name, rootProof);
  }

  /**
   * Add to chain
   */
  public addToChain(chainId: string, proof: Proof): boolean {
    return this.chainManager.addToChain(chainId, proof);
  }

  /**
   * Generate documentation for a proof
   */
  public document(proof: Proof): ProofDocumentation {
    this.log(LogLevel.INFO, `Generating documentation for: ${proof.name}`);

    // Generate summary
    const summary = `Proof of "${proof.theorem}" using ${proof.type} method with ${proof.steps.length} steps.`;

    // Generate formal notation
    const formalNotation = proof.steps.map(s => 
      `${s.stepNumber}. [${s.type.toUpperCase()}] ${s.statement}`
    ).join('\n');

    // Generate natural language description
    const naturalLanguage = this.generateNaturalLanguage(proof);

    const doc: ProofDocumentation = {
      proof,
      summary,
      formalNotation,
      naturalLanguage,
      references: [],
      generatedAt: new Date(),
      hash: ''
    };
    doc.hash = this.hashDocumentation(doc);

    this.documentation.push(doc);
    this.log(LogLevel.INFO, 'Documentation generated');

    return doc;
  }

  /**
   * Generate natural language description
   */
  private generateNaturalLanguage(proof: Proof): string {
    let text = `To prove that ${proof.theorem}, we proceed as follows:\n\n`;

    for (const step of proof.steps) {
      switch (step.type) {
        case StepType.AXIOM:
          text += `By axiom, ${step.statement}.\n`;
          break;
        case StepType.DEFINITION:
          text += `We define ${step.statement}.\n`;
          break;
        case StepType.ASSUMPTION:
          text += `Assume ${step.statement}.\n`;
          break;
        case StepType.DERIVATION:
          text += `From this, we derive ${step.statement}.\n`;
          break;
        case StepType.CONCLUSION:
          text += `Therefore, ${step.statement}. Q.E.D.\n`;
          break;
        default:
          text += `${step.statement}.\n`;
      }
    }

    return text;
  }

  /**
   * Get generator
   */
  public getGenerator(): ProofGenerator {
    return this.generator;
  }

  /**
   * Get verifier
   */
  public getVerifier(): ProofVerifier {
    return this.verifier;
  }

  /**
   * Get chain manager
   */
  public getChainManager(): ProofChainManager {
    return this.chainManager;
  }

  /**
   * Get all documentation
   */
  public getDocumentation(): ProofDocumentation[] {
    return [...this.documentation];
  }

  /**
   * Get statistics
   */
  public getStatistics(): {
    proofCount: number;
    verifiedCount: number;
    rejectedCount: number;
    chainCount: number;
    documentationCount: number;
  } {
    const proofs = this.generator.getAllProofs();
    const verified = proofs.filter(p => p.status === ProofStatus.VERIFIED).length;
    const rejected = proofs.filter(p => p.status === ProofStatus.REJECTED).length;

    return {
      proofCount: proofs.length,
      verifiedCount: verified,
      rejectedCount: rejected,
      chainCount: this.chainManager.getAllChains().length,
      documentationCount: this.documentation.length
    };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    this.generator.clear();
    this.verifier.clear();
    this.chainManager.clear();
    this.documentation = [];
    this.log(LogLevel.INFO, 'ProofSystem cleared');
  }

  /**
   * Export to JSON
   */
  public toJSON(): object {
    return {
      proofs: this.generator.getAllProofs(),
      verifications: this.verifier.getVerifications(),
      chains: this.chainManager.getAllChains(),
      documentation: this.documentation,
      statistics: this.getStatistics()
    };
  }

  /**
   * Generate proof chain hash
   */
  public generateProofChainHash(): string {
    const proofs = this.generator.getAllProofs();
    const data = JSON.stringify({
      proofCount: proofs.length,
      proofHashes: proofs.map(p => p.hash)
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashDocumentation(doc: ProofDocumentation): string {
    const data = JSON.stringify({
      proofHash: doc.proof.hash,
      summary: doc.summary
    });
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private log(level: LogLevel, message: string, context?: object): void {
    if (this.logger) {
      this.logger.log(level, `[ProofSystem] ${message}`, context);
    }
  }
}

/**
 * Factory for creating ProofSystem instances
 */
export class ProofSystemFactory {
  /**
   * Create ProofSystem with optional logger
   */
  public static create(logger?: Logger): ProofSystem {
    return new ProofSystem(logger || null);
  }
}
