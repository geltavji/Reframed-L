/**
 * DiscoveryDocs - Discovery Documentation System (M10.05)
 * PRD-10 Phase 10.5: Discovery Documentation
 * 
 * Documents all discoveries, creates reproducibility guides,
 * and generates proof documents.
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';
import { Discovery } from '../explorer/AutoExplorer';
import { ValidationResult } from '../validation/BreakthroughValidator';
import { BreakthroughCandidate } from '../anomaly/AnomalyDetector';
import { Hypothesis } from '../hypothesis/HypothesisEngine';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ReproducibilityGuide {
  id: string;
  discoveryId: string;
  version: string;
  title: string;
  summary: string;
  prerequisites: Prerequisite[];
  materials: Material[];
  procedure: ProcedureStep[];
  expectedResults: ExpectedResult[];
  troubleshooting: TroubleshootingEntry[];
  references: Reference[];
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prerequisite {
  id: string;
  description: string;
  category: 'knowledge' | 'equipment' | 'software' | 'data';
  required: boolean;
  alternatives?: string[];
}

export interface Material {
  name: string;
  specification: string;
  quantity: string;
  source?: string;
  substitutes?: string[];
}

export interface ProcedureStep {
  stepNumber: number;
  title: string;
  description: string;
  duration?: string;
  criticalPoints: string[];
  safetyNotes?: string[];
  expectedOutcome?: string;
}

export interface ExpectedResult {
  metric: string;
  value: number | string;
  tolerance: number | string;
  units?: string;
  notes?: string;
}

export interface TroubleshootingEntry {
  issue: string;
  possibleCauses: string[];
  solutions: string[];
}

export interface Reference {
  id: string;
  type: 'paper' | 'book' | 'software' | 'dataset' | 'website';
  title: string;
  authors?: string[];
  year?: number;
  url?: string;
  doi?: string;
}

export interface ProofDocument {
  id: string;
  type: 'discovery' | 'validation' | 'replication' | 'synthesis';
  title: string;
  abstract: string;
  sections: ProofSection[];
  evidence: ProofEvidence[];
  conclusions: string[];
  hashChain: HashChainEntry[];
  metadata: ProofMetadata;
  hash: string;
}

export interface ProofSection {
  title: string;
  content: string;
  figures?: string[];
  tables?: string[];
}

export interface ProofEvidence {
  id: string;
  type: string;
  description: string;
  data: unknown;
  hash: string;
}

export interface HashChainEntry {
  index: number;
  operation: string;
  hash: string;
  previousHash: string;
  timestamp: Date;
}

export interface ProofMetadata {
  version: string;
  authors: string[];
  institution?: string;
  date: Date;
  keywords: string[];
  classification: string;
}

export interface DiscoveryReport {
  id: string;
  discovery: Discovery;
  validation?: ValidationResult;
  guide?: ReproducibilityGuide;
  proof?: ProofDocument;
  status: 'draft' | 'reviewed' | 'published' | 'archived';
  hash: string;
  createdAt: Date;
}

// ============================================================================
// DISCOVERY DOCS
// ============================================================================

export class DiscoveryDocs {
  private logger: Logger;
  private guides: Map<string, ReproducibilityGuide> = new Map();
  private proofs: Map<string, ProofDocument> = new Map();
  private reports: Map<string, DiscoveryReport> = new Map();
  private hashChain: HashChainEntry[] = [];

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.initializeHashChain();
  }

  /**
   * Initialize hash chain
   */
  private initializeHashChain(): void {
    const genesisEntry: HashChainEntry = {
      index: 0,
      operation: 'genesis',
      hash: HashVerifier.hash('genesis'),
      previousHash: '0'.repeat(64),
      timestamp: new Date()
    };
    this.hashChain.push(genesisEntry);
  }

  /**
   * Add entry to hash chain
   */
  private addToHashChain(operation: string): HashChainEntry {
    const previousEntry = this.hashChain[this.hashChain.length - 1];
    const entry: HashChainEntry = {
      index: previousEntry.index + 1,
      operation,
      hash: HashVerifier.hash(`${previousEntry.hash}-${operation}-${Date.now()}`),
      previousHash: previousEntry.hash,
      timestamp: new Date()
    };
    this.hashChain.push(entry);
    return entry;
  }

  /**
   * Create a reproducibility guide for a discovery
   */
  createReproducibilityGuide(
    discovery: Discovery,
    additionalInfo: {
      title?: string;
      materials?: Material[];
      prerequisites?: Prerequisite[];
      references?: Reference[];
    } = {}
  ): ReproducibilityGuide {
    const id = `RG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const guide: Omit<ReproducibilityGuide, 'hash'> = {
      id,
      discoveryId: discovery.id,
      version: '1.0.0',
      title: additionalInfo.title || `Reproducibility Guide: ${discovery.description.substring(0, 50)}`,
      summary: this.generateSummary(discovery),
      prerequisites: additionalInfo.prerequisites || this.generatePrerequisites(discovery),
      materials: additionalInfo.materials || this.generateMaterials(discovery),
      procedure: this.generateProcedure(discovery),
      expectedResults: this.generateExpectedResults(discovery),
      troubleshooting: this.generateTroubleshooting(discovery),
      references: additionalInfo.references || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const finalGuide: ReproducibilityGuide = {
      ...guide,
      hash: HashVerifier.hash(JSON.stringify(guide))
    };

    this.guides.set(id, finalGuide);
    this.addToHashChain(`create_guide:${id}`);
    
    this.logger.info(`Created reproducibility guide: ${id}`);

    return finalGuide;
  }

  /**
   * Generate summary from discovery
   */
  private generateSummary(discovery: Discovery): string {
    return `This guide provides step-by-step instructions for reproducing the ${discovery.type} discovery: ${discovery.description}. ` +
           `The discovery has a significance score of ${discovery.significance.toFixed(3)} and is currently ${discovery.status}.`;
  }

  /**
   * Generate prerequisites from discovery
   */
  private generatePrerequisites(discovery: Discovery): Prerequisite[] {
    const prerequisites: Prerequisite[] = [
      {
        id: 'P1',
        description: 'Basic understanding of the scientific method',
        category: 'knowledge',
        required: true
      },
      {
        id: 'P2',
        description: 'Access to computational resources',
        category: 'equipment',
        required: true
      },
      {
        id: 'P3',
        description: 'Statistical analysis software',
        category: 'software',
        required: true,
        alternatives: ['R', 'Python with scipy', 'MATLAB']
      }
    ];

    // Add programming prereq for computation-heavy discoveries
    if (discovery.evidence.some(e => e.type === 'computational')) {
      prerequisites.push({
        id: 'P4',
        description: 'Programming experience',
        category: 'knowledge',
        required: true
      });
    }

    return prerequisites;
  }

  /**
   * Generate materials from discovery
   */
  private generateMaterials(discovery: Discovery): Material[] {
    return [
      {
        name: 'Data set',
        specification: 'Original data used in discovery',
        quantity: 'Complete dataset',
        source: 'Discovery repository'
      },
      {
        name: 'Analysis scripts',
        specification: 'Scripts used for analysis',
        quantity: 'Full codebase',
        source: 'Code repository'
      }
    ];
  }

  /**
   * Generate procedure from discovery
   */
  private generateProcedure(discovery: Discovery): ProcedureStep[] {
    return [
      {
        stepNumber: 1,
        title: 'Environment Setup',
        description: 'Set up the computational environment with required dependencies',
        duration: '30 minutes',
        criticalPoints: ['Ensure correct versions of all dependencies'],
        expectedOutcome: 'Working environment ready'
      },
      {
        stepNumber: 2,
        title: 'Data Preparation',
        description: 'Load and prepare the data for analysis',
        duration: '15 minutes',
        criticalPoints: ['Verify data integrity', 'Check for missing values'],
        expectedOutcome: 'Clean, validated dataset'
      },
      {
        stepNumber: 3,
        title: 'Execute Analysis',
        description: 'Run the main analysis procedure',
        duration: 'Variable',
        criticalPoints: ['Monitor for convergence', 'Log all parameters'],
        expectedOutcome: 'Analysis results'
      },
      {
        stepNumber: 4,
        title: 'Validate Results',
        description: 'Compare results with expected values',
        duration: '15 minutes',
        criticalPoints: ['Check statistical significance', 'Verify against expected results'],
        expectedOutcome: 'Validated discovery'
      }
    ];
  }

  /**
   * Generate expected results from discovery
   */
  private generateExpectedResults(discovery: Discovery): ExpectedResult[] {
    return [
      {
        metric: 'Significance score',
        value: discovery.significance,
        tolerance: '±0.05',
        notes: 'May vary slightly due to random initialization'
      },
      {
        metric: 'Status',
        value: discovery.status,
        tolerance: 'N/A',
        notes: 'Should match original discovery status'
      }
    ];
  }

  /**
   * Generate troubleshooting entries
   */
  private generateTroubleshooting(discovery: Discovery): TroubleshootingEntry[] {
    return [
      {
        issue: 'Results differ from expected',
        possibleCauses: [
          'Different random seed',
          'Version mismatch in dependencies',
          'Data preprocessing differences'
        ],
        solutions: [
          'Use fixed random seed as specified',
          'Install exact dependency versions',
          'Follow data preparation steps exactly'
        ]
      },
      {
        issue: 'Analysis fails to converge',
        possibleCauses: [
          'Incorrect parameter settings',
          'Insufficient computational resources',
          'Data quality issues'
        ],
        solutions: [
          'Verify all parameters match the guide',
          'Increase available memory/compute',
          'Re-validate input data'
        ]
      }
    ];
  }

  /**
   * Create a proof document
   */
  createProofDocument(
    title: string,
    discovery: Discovery,
    validation?: ValidationResult,
    hypothesis?: Hypothesis
  ): ProofDocument {
    const id = `PROOF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const sections = this.generateProofSections(discovery, validation, hypothesis);
    const evidence = this.collectEvidence(discovery, validation);
    const conclusions = this.generateConclusions(discovery, validation);

    const proof: Omit<ProofDocument, 'hash'> = {
      id,
      type: 'discovery',
      title,
      abstract: this.generateAbstract(discovery),
      sections,
      evidence,
      conclusions,
      hashChain: [...this.hashChain],
      metadata: {
        version: '1.0.0',
        authors: ['Automated Discovery System'],
        date: new Date(),
        keywords: this.extractKeywords(discovery),
        classification: discovery.type
      }
    };

    const finalProof: ProofDocument = {
      ...proof,
      hash: HashVerifier.hash(JSON.stringify(proof))
    };

    this.proofs.set(id, finalProof);
    this.addToHashChain(`create_proof:${id}`);
    
    this.logger.info(`Created proof document: ${id}`);

    return finalProof;
  }

  /**
   * Generate abstract
   */
  private generateAbstract(discovery: Discovery): string {
    return `This document presents evidence for a ${discovery.type} discovery with significance score ${discovery.significance.toFixed(3)}. ` +
           `The discovery is described as: ${discovery.description}. ` +
           `This proof provides comprehensive documentation of the discovery process, validation results, and reproducibility information.`;
  }

  /**
   * Generate proof sections
   */
  private generateProofSections(
    discovery: Discovery,
    validation?: ValidationResult,
    hypothesis?: Hypothesis
  ): ProofSection[] {
    const sections: ProofSection[] = [
      {
        title: 'Introduction',
        content: `This document provides proof for the ${discovery.type} discovery identified through automated exploration. ` +
                 `The discovery has been documented and validated according to scientific standards.`
      },
      {
        title: 'Discovery Description',
        content: `Type: ${discovery.type}\n` +
                 `Description: ${discovery.description}\n` +
                 `Significance: ${discovery.significance.toFixed(4)}\n` +
                 `Status: ${discovery.status}\n` +
                 `Created: ${discovery.createdAt.toISOString()}`
      },
      {
        title: 'Evidence',
        content: discovery.evidence.map(e => 
          `- ${e.type}: ${e.description} (strength: ${e.strength.toFixed(3)})`
        ).join('\n')
      }
    ];

    if (validation) {
      sections.push({
        title: 'Validation Results',
        content: `Overall Certainty: ${validation.overallCertainty.level} (${validation.overallCertainty.score.toFixed(3)})\n` +
                 `False Positive Probability: ${validation.falsePositiveProbability.toFixed(4)}\n` +
                 `Recommendation: ${validation.recommendation}\n\n` +
                 `Validation Methods:\n` +
                 validation.methods.map(m => 
                   `- ${m.method}: ${m.passed ? 'PASSED' : 'FAILED'} (confidence: ${m.confidence.toFixed(3)})`
                 ).join('\n')
      });
    }

    if (hypothesis) {
      sections.push({
        title: 'Related Hypothesis',
        content: `Hypothesis ID: ${hypothesis.id}\n` +
                 `Statement: ${hypothesis.statement}\n` +
                 `Category: ${hypothesis.category}\n` +
                 `Confidence: ${hypothesis.confidence.toFixed(3)}`
      });
    }

    sections.push({
      title: 'Conclusion',
      content: `Based on the evidence and validation results, this discovery is classified as ${discovery.status}. ` +
               `Full reproducibility information is available in the associated reproducibility guide.`
    });

    return sections;
  }

  /**
   * Collect evidence
   */
  private collectEvidence(
    discovery: Discovery,
    validation?: ValidationResult
  ): ProofEvidence[] {
    const evidence: ProofEvidence[] = [];

    // Add discovery evidence
    for (const ev of discovery.evidence) {
      const proofEv: Omit<ProofEvidence, 'hash'> = {
        id: `PEV-${ev.id}`,
        type: ev.type,
        description: ev.description,
        data: { strength: ev.strength, reproducible: ev.reproducible }
      };
      evidence.push({
        ...proofEv,
        hash: HashVerifier.hash(JSON.stringify(proofEv))
      });
    }

    // Add validation evidence
    if (validation) {
      for (const vev of validation.evidence) {
        const proofEv: Omit<ProofEvidence, 'hash'> = {
          id: `PEV-VAL-${vev.id}`,
          type: vev.type,
          description: vev.description,
          data: { strength: vev.strength, reproducible: vev.reproducible }
        };
        evidence.push({
          ...proofEv,
          hash: HashVerifier.hash(JSON.stringify(proofEv))
        });
      }
    }

    return evidence;
  }

  /**
   * Generate conclusions
   */
  private generateConclusions(
    discovery: Discovery,
    validation?: ValidationResult
  ): string[] {
    const conclusions: string[] = [];

    conclusions.push(`Discovery type: ${discovery.type} with significance ${discovery.significance.toFixed(3)}`);

    if (validation) {
      conclusions.push(
        `Validation certainty: ${validation.overallCertainty.level} (${validation.overallCertainty.score.toFixed(3)})`
      );
      conclusions.push(`Recommendation: ${validation.recommendation}`);
    }

    conclusions.push(`Current status: ${discovery.status}`);

    return conclusions;
  }

  /**
   * Extract keywords
   */
  private extractKeywords(discovery: Discovery): string[] {
    const keywords: string[] = [discovery.type];
    
    // Extract words from description
    const words = discovery.description.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 5);
    
    keywords.push(...words);
    
    return [...new Set(keywords)];
  }

  /**
   * Create a discovery report combining all documentation
   */
  createDiscoveryReport(
    discovery: Discovery,
    validation?: ValidationResult
  ): DiscoveryReport {
    const id = `REPORT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Create associated documentation
    const guide = this.createReproducibilityGuide(discovery);
    const proof = this.createProofDocument(
      `Discovery Report: ${discovery.description.substring(0, 30)}`,
      discovery,
      validation
    );

    const report: Omit<DiscoveryReport, 'hash'> = {
      id,
      discovery,
      validation,
      guide,
      proof,
      status: 'draft',
      createdAt: new Date()
    };

    const finalReport: DiscoveryReport = {
      ...report,
      hash: HashVerifier.hash(JSON.stringify(report))
    };

    this.reports.set(id, finalReport);
    this.addToHashChain(`create_report:${id}`);
    
    this.logger.info(`Created discovery report: ${id}`);

    return finalReport;
  }

  /**
   * Update report status
   */
  updateReportStatus(id: string, status: DiscoveryReport['status']): void {
    const report = this.reports.get(id);
    if (report) {
      report.status = status;
      this.addToHashChain(`update_report:${id}:${status}`);
    }
  }

  /**
   * Get guide by ID
   */
  getGuide(id: string): ReproducibilityGuide | undefined {
    return this.guides.get(id);
  }

  /**
   * Get proof by ID
   */
  getProof(id: string): ProofDocument | undefined {
    return this.proofs.get(id);
  }

  /**
   * Get report by ID
   */
  getReport(id: string): DiscoveryReport | undefined {
    return this.reports.get(id);
  }

  /**
   * Get all guides
   */
  getAllGuides(): ReproducibilityGuide[] {
    return Array.from(this.guides.values());
  }

  /**
   * Get all proofs
   */
  getAllProofs(): ProofDocument[] {
    return Array.from(this.proofs.values());
  }

  /**
   * Get all reports
   */
  getAllReports(): DiscoveryReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Verify hash chain integrity
   */
  verifyHashChain(): boolean {
    for (let i = 1; i < this.hashChain.length; i++) {
      if (this.hashChain[i].previousHash !== this.hashChain[i-1].hash) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get hash chain
   */
  getHashChain(): HashChainEntry[] {
    return [...this.hashChain];
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    return HashVerifier.hash(`DiscoveryDocs-${this.reports.size}-${this.hashChain.length}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): {
    guides: ReproducibilityGuide[];
    proofs: ProofDocument[];
    reports: DiscoveryReport[];
    hashChain: HashChainEntry[];
    integrity: boolean;
  } {
    return {
      guides: Array.from(this.guides.values()),
      proofs: Array.from(this.proofs.values()),
      reports: Array.from(this.reports.values()),
      hashChain: this.hashChain,
      integrity: this.verifyHashChain()
    };
  }
}

// ============================================================================
// DISCOVERY DOCS FACTORY
// ============================================================================

export class DiscoveryDocsFactory {
  /**
   * Create default documentation system
   */
  static default(): DiscoveryDocs {
    return new DiscoveryDocs();
  }

  /**
   * Create with custom logger
   */
  static withLogger(logger: Logger): DiscoveryDocs {
    return new DiscoveryDocs(logger);
  }
}
