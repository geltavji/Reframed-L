/**
 * ReviewSimulator - Peer Review Simulation System (M09.04)
 * PRD-09 Phase 9.4: Peer Review Simulation
 * 
 * Simulates peer review process, identifies weaknesses, and strengthens claims
 */

import { Logger, LogLevel } from '../../core/logger/Logger';
import { HashVerifier } from '../../core/logger/HashVerifier';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Paper {
  id: string;
  title: string;
  abstract: string;
  sections: Section[];
  claims: Claim[];
  evidence: Evidence[];
  methodology: Methodology;
  references: Reference[];
  keywords: string[];
  hash: string;
  submittedAt: Date;
}

export interface Section {
  title: string;
  content: string;
  figures?: Figure[];
  tables?: Table[];
}

export interface Claim {
  id: string;
  statement: string;
  type: 'theoretical' | 'empirical' | 'methodological';
  strength: 'strong' | 'moderate' | 'weak';
  supportingEvidence: string[];
  limitations: string[];
}

export interface Evidence {
  id: string;
  type: 'experimental' | 'statistical' | 'computational' | 'theoretical';
  description: string;
  strength: number; // 0-1
  reproducibility: number; // 0-1
  supportsClaims: string[];
}

export interface Methodology {
  design: string;
  sampleSize?: number;
  statisticalMethods: string[];
  assumptions: string[];
  limitations: string[];
}

export interface Reference {
  id: string;
  authors: string[];
  title: string;
  journal?: string;
  year: number;
  doi?: string;
}

export interface Figure {
  id: string;
  caption: string;
  type: 'graph' | 'diagram' | 'image' | 'table';
}

export interface Table {
  id: string;
  caption: string;
  data: string[][];
}

export interface Critique {
  id: string;
  category: CritiqueCategory;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  section: string;
  issue: string;
  suggestion: string;
  references?: string[];
  hash: string;
}

export type CritiqueCategory = 
  | 'methodology'
  | 'statistics'
  | 'logic'
  | 'evidence'
  | 'clarity'
  | 'novelty'
  | 'significance'
  | 'reproducibility'
  | 'ethics'
  | 'references';

export interface Response {
  critiqueId: string;
  action: 'accept' | 'reject' | 'partial';
  explanation: string;
  changes: string[];
  hash: string;
}

export interface ReviewRound {
  roundNumber: number;
  critiques: Critique[];
  responses: Response[];
  decision: 'accept' | 'minor-revision' | 'major-revision' | 'reject';
  summary: string;
  hash: string;
}

export interface ReviewReport {
  paperId: string;
  rounds: ReviewRound[];
  finalDecision: 'accept' | 'reject';
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementsMade: string[];
  remainingIssues: string[];
  hash: string;
}

export interface ReviewerProfile {
  id: string;
  expertise: string[];
  rigor: number; // 0-1, how strict
  focusAreas: CritiqueCategory[];
  style: 'constructive' | 'critical' | 'balanced';
}

// ============================================================================
// REVIEW SIMULATOR
// ============================================================================

export class ReviewSimulator {
  private logger: Logger;
  private reviewers: ReviewerProfile[] = [];
  private reviewHistory: Map<string, ReviewReport> = new Map();

  constructor(logger?: Logger) {
    this.logger = logger || Logger.getInstance({ minLevel: LogLevel.INFO, enableConsole: false });
    this.initializeDefaultReviewers();
  }

  /**
   * Initialize default reviewer profiles
   */
  private initializeDefaultReviewers(): void {
    this.reviewers = [
      {
        id: 'R1',
        expertise: ['methodology', 'statistics'],
        rigor: 0.8,
        focusAreas: ['methodology', 'statistics', 'reproducibility'],
        style: 'critical'
      },
      {
        id: 'R2',
        expertise: ['theory', 'logic'],
        rigor: 0.7,
        focusAreas: ['logic', 'evidence', 'novelty'],
        style: 'balanced'
      },
      {
        id: 'R3',
        expertise: ['clarity', 'presentation'],
        rigor: 0.6,
        focusAreas: ['clarity', 'significance', 'references'],
        style: 'constructive'
      }
    ];
  }

  /**
   * Create a new paper for review
   */
  createPaper(
    title: string,
    abstract: string,
    sections: Section[],
    claims: Claim[],
    evidence: Evidence[],
    methodology: Methodology,
    references: Reference[] = [],
    keywords: string[] = []
  ): Paper {
    const id = `PAPER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const paper: Omit<Paper, 'hash'> = {
      id,
      title,
      abstract,
      sections,
      claims,
      evidence,
      methodology,
      references,
      keywords,
      submittedAt: new Date()
    };

    return {
      ...paper,
      hash: HashVerifier.hash(JSON.stringify(paper))
    };
  }

  /**
   * Simulate a full review process
   */
  simulateReview(paper: Paper, maxRounds: number = 3): ReviewReport {
    this.logger.info(`Starting review simulation for paper: ${paper.title}`);

    const rounds: ReviewRound[] = [];
    let currentPaper = paper;
    let finalDecision: 'accept' | 'reject' = 'reject';

    for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
      const critiques = this.generateCritiques(currentPaper, roundNum);
      const responses = this.generateResponses(critiques);
      
      const decision = this.makeDecision(critiques, roundNum === maxRounds);
      
      const round: Omit<ReviewRound, 'hash'> = {
        roundNumber: roundNum,
        critiques,
        responses,
        decision,
        summary: this.generateRoundSummary(critiques, decision)
      };

      rounds.push({
        ...round,
        hash: HashVerifier.hash(JSON.stringify(round))
      });

      this.logger.info(`Round ${roundNum}: ${critiques.length} critiques, decision: ${decision}`);

      if (decision === 'accept') {
        finalDecision = 'accept';
        break;
      }

      if (decision === 'reject') {
        finalDecision = 'reject';
        break;
      }

      // Apply improvements for next round
      currentPaper = this.applyImprovements(currentPaper, responses);
    }

    const report = this.generateReport(paper.id, rounds, finalDecision);
    this.reviewHistory.set(paper.id, report);

    return report;
  }

  /**
   * Generate critiques for a paper
   */
  generateCritiques(paper: Paper, roundNumber: number): Critique[] {
    const critiques: Critique[] = [];
    const intensity = 1 / roundNumber; // Less intense in later rounds

    for (const reviewer of this.reviewers) {
      const reviewerCritiques = this.generateReviewerCritiques(paper, reviewer, intensity);
      critiques.push(...reviewerCritiques);
    }

    return critiques;
  }

  /**
   * Generate critiques from a specific reviewer
   */
  private generateReviewerCritiques(
    paper: Paper,
    reviewer: ReviewerProfile,
    intensity: number
  ): Critique[] {
    const critiques: Critique[] = [];
    const threshold = 1 - (reviewer.rigor * intensity);

    // Check methodology
    if (reviewer.focusAreas.includes('methodology')) {
      const methodCritiques = this.checkMethodology(paper.methodology, threshold);
      critiques.push(...methodCritiques);
    }

    // Check claims
    if (reviewer.focusAreas.includes('logic') || reviewer.focusAreas.includes('evidence')) {
      const claimCritiques = this.checkClaims(paper.claims, paper.evidence, threshold);
      critiques.push(...claimCritiques);
    }

    // Check clarity
    if (reviewer.focusAreas.includes('clarity')) {
      const clarityCritiques = this.checkClarity(paper, threshold);
      critiques.push(...clarityCritiques);
    }

    // Check novelty and significance
    if (reviewer.focusAreas.includes('novelty') || reviewer.focusAreas.includes('significance')) {
      const noveltyCritiques = this.checkNovelty(paper, threshold);
      critiques.push(...noveltyCritiques);
    }

    // Check statistics
    if (reviewer.focusAreas.includes('statistics')) {
      const statCritiques = this.checkStatistics(paper.methodology, threshold);
      critiques.push(...statCritiques);
    }

    // Check reproducibility
    if (reviewer.focusAreas.includes('reproducibility')) {
      const reproCritiques = this.checkReproducibility(paper, threshold);
      critiques.push(...reproCritiques);
    }

    // Check references
    if (reviewer.focusAreas.includes('references')) {
      const refCritiques = this.checkReferences(paper.references, threshold);
      critiques.push(...refCritiques);
    }

    return critiques;
  }

  /**
   * Check methodology for issues
   */
  private checkMethodology(methodology: Methodology, threshold: number): Critique[] {
    const critiques: Critique[] = [];

    // Check sample size
    if (methodology.sampleSize !== undefined && methodology.sampleSize < 30 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'methodology',
        'major',
        'Methods',
        `Sample size (n=${methodology.sampleSize}) may be insufficient for statistical validity`,
        'Consider increasing sample size or justifying the chosen sample size with power analysis'
      ));
    }

    // Check assumptions
    if (methodology.assumptions.length === 0 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'methodology',
        'major',
        'Methods',
        'No explicit assumptions are stated',
        'Clearly state the assumptions underlying your methodology'
      ));
    }

    // Check limitations acknowledgment
    if (methodology.limitations.length === 0 && Math.random() > threshold * 0.8) {
      critiques.push(this.createCritique(
        'methodology',
        'minor',
        'Methods',
        'Limitations of the methodology are not discussed',
        'Add a limitations section discussing potential weaknesses of the approach'
      ));
    }

    // Check statistical methods
    if (methodology.statisticalMethods.length === 0 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'statistics',
        'major',
        'Methods',
        'No statistical methods are described',
        'Describe the statistical methods used for data analysis'
      ));
    }

    return critiques;
  }

  /**
   * Check claims for support and logic
   */
  private checkClaims(claims: Claim[], evidence: Evidence[], threshold: number): Critique[] {
    const critiques: Critique[] = [];

    for (const claim of claims) {
      // Check if claim has supporting evidence
      if (claim.supportingEvidence.length === 0 && Math.random() > threshold) {
        critiques.push(this.createCritique(
          'evidence',
          'critical',
          'Results/Discussion',
          `Claim "${claim.statement.substring(0, 50)}..." lacks supporting evidence`,
          'Provide experimental or analytical evidence to support this claim'
        ));
      }

      // Check claim strength vs evidence
      if (claim.strength === 'strong' && claim.limitations.length === 0 && Math.random() > threshold * 0.7) {
        critiques.push(this.createCritique(
          'logic',
          'major',
          'Discussion',
          `Strong claim without acknowledged limitations: "${claim.statement.substring(0, 50)}..."`,
          'Acknowledge potential limitations or caveats of this claim'
        ));
      }

      // Check evidence quality
      const supportingEvidence = evidence.filter(e => claim.supportingEvidence.includes(e.id));
      const avgStrength = supportingEvidence.length > 0
        ? supportingEvidence.reduce((sum, e) => sum + e.strength, 0) / supportingEvidence.length
        : 0;

      if (avgStrength < 0.5 && claim.strength !== 'weak' && Math.random() > threshold) {
        critiques.push(this.createCritique(
          'evidence',
          'major',
          'Results',
          'Evidence strength does not match claim strength',
          'Either strengthen the evidence or moderate the claim language'
        ));
      }
    }

    return critiques;
  }

  /**
   * Check paper clarity
   */
  private checkClarity(paper: Paper, threshold: number): Critique[] {
    const critiques: Critique[] = [];

    // Check abstract length
    if (paper.abstract.length < 100 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'clarity',
        'minor',
        'Abstract',
        'Abstract is too brief',
        'Expand the abstract to include key findings and implications'
      ));
    }

    if (paper.abstract.length > 500 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'clarity',
        'minor',
        'Abstract',
        'Abstract is too long',
        'Condense the abstract to focus on essential information'
      ));
    }

    // Check section structure
    const requiredSections = ['Introduction', 'Methods', 'Results', 'Discussion'];
    const sectionTitles = paper.sections.map(s => s.title.toLowerCase());
    
    for (const required of requiredSections) {
      if (!sectionTitles.some(t => t.includes(required.toLowerCase())) && Math.random() > threshold * 0.5) {
        critiques.push(this.createCritique(
          'clarity',
          'minor',
          'Structure',
          `Missing or unclear ${required} section`,
          `Ensure the paper has a clear ${required} section`
        ));
      }
    }

    return critiques;
  }

  /**
   * Check novelty and significance
   */
  private checkNovelty(paper: Paper, threshold: number): Critique[] {
    const critiques: Critique[] = [];

    // Check keywords
    if (paper.keywords.length < 3 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'significance',
        'minor',
        'Keywords',
        'Insufficient keywords for discoverability',
        'Add more relevant keywords to improve paper discoverability'
      ));
    }

    // Simulate novelty check (random for simulation)
    if (Math.random() > threshold * 1.5) {
      critiques.push(this.createCritique(
        'novelty',
        'major',
        'Introduction',
        'Novelty of the contribution is not clearly established',
        'Clearly articulate how this work differs from and advances existing literature'
      ));
    }

    return critiques;
  }

  /**
   * Check statistical analysis
   */
  private checkStatistics(methodology: Methodology, threshold: number): Critique[] {
    const critiques: Critique[] = [];

    // Check for common statistical issues
    const methods = methodology.statisticalMethods.map(m => m.toLowerCase());

    if (!methods.some(m => m.includes('confidence') || m.includes('interval')) && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'statistics',
        'minor',
        'Methods',
        'No confidence intervals reported',
        'Report confidence intervals for key estimates'
      ));
    }

    if (!methods.some(m => m.includes('effect size')) && Math.random() > threshold * 0.8) {
      critiques.push(this.createCritique(
        'statistics',
        'minor',
        'Methods',
        'Effect sizes not reported',
        'Include effect size measures in addition to p-values'
      ));
    }

    return critiques;
  }

  /**
   * Check reproducibility
   */
  private checkReproducibility(paper: Paper, threshold: number): Critique[] {
    const critiques: Critique[] = [];

    // Check evidence reproducibility scores
    const lowReproducibility = paper.evidence.filter(e => e.reproducibility < 0.5);
    
    if (lowReproducibility.length > 0 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'reproducibility',
        'major',
        'Methods',
        'Some results may be difficult to reproduce',
        'Provide additional methodological details or supplementary materials'
      ));
    }

    // Check for data availability statement
    const hasDataStatement = paper.sections.some(s => 
      s.content.toLowerCase().includes('data availability') ||
      s.content.toLowerCase().includes('code availability')
    );

    if (!hasDataStatement && Math.random() > threshold * 0.6) {
      critiques.push(this.createCritique(
        'reproducibility',
        'minor',
        'Methods',
        'No data or code availability statement',
        'Add a statement about data and code availability'
      ));
    }

    return critiques;
  }

  /**
   * Check references
   */
  private checkReferences(references: Reference[], threshold: number): Critique[] {
    const critiques: Critique[] = [];

    // Check reference count
    if (references.length < 10 && Math.random() > threshold) {
      critiques.push(this.createCritique(
        'references',
        'major',
        'References',
        'Limited reference list',
        'Expand the literature review to include more relevant prior work'
      ));
    }

    // Check reference recency
    const currentYear = new Date().getFullYear();
    const recentRefs = references.filter(r => r.year >= currentYear - 5);
    
    if (recentRefs.length < references.length * 0.3 && Math.random() > threshold * 0.8) {
      critiques.push(this.createCritique(
        'references',
        'minor',
        'References',
        'Limited recent references',
        'Include more recent literature (last 5 years)'
      ));
    }

    return critiques;
  }

  /**
   * Create a critique object
   */
  private createCritique(
    category: CritiqueCategory,
    severity: Critique['severity'],
    section: string,
    issue: string,
    suggestion: string
  ): Critique {
    const id = `CRQ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const critique: Omit<Critique, 'hash'> = {
      id,
      category,
      severity,
      section,
      issue,
      suggestion
    };

    return {
      ...critique,
      hash: HashVerifier.hash(JSON.stringify(critique))
    };
  }

  /**
   * Generate responses to critiques
   */
  generateResponses(critiques: Critique[]): Response[] {
    return critiques.map(critique => {
      // Simulate author response
      const acceptProbability = critique.severity === 'critical' ? 0.9 :
                                critique.severity === 'major' ? 0.8 :
                                critique.severity === 'minor' ? 0.7 : 0.5;

      const action: Response['action'] = Math.random() < acceptProbability ? 'accept' :
                                         Math.random() < 0.5 ? 'partial' : 'reject';

      const response: Omit<Response, 'hash'> = {
        critiqueId: critique.id,
        action,
        explanation: this.generateExplanation(critique, action),
        changes: action !== 'reject' ? [this.generateChange(critique)] : []
      };

      return {
        ...response,
        hash: HashVerifier.hash(JSON.stringify(response))
      };
    });
  }

  /**
   * Generate explanation for a response
   */
  private generateExplanation(critique: Critique, action: Response['action']): string {
    if (action === 'accept') {
      return `We agree with the reviewer's concern and have addressed it as suggested.`;
    } else if (action === 'partial') {
      return `We partially addressed this concern. While we acknowledge the issue, our approach differs from the suggestion due to specific constraints.`;
    } else {
      return `We respectfully disagree with this critique. Our methodology is appropriate because...`;
    }
  }

  /**
   * Generate change description
   */
  private generateChange(critique: Critique): string {
    return `Addressed ${critique.category} concern in ${critique.section} section`;
  }

  /**
   * Make decision based on critiques
   */
  private makeDecision(critiques: Critique[], isFinalRound: boolean): ReviewRound['decision'] {
    const criticalCount = critiques.filter(c => c.severity === 'critical').length;
    const majorCount = critiques.filter(c => c.severity === 'major').length;
    const minorCount = critiques.filter(c => c.severity === 'minor').length;

    if (criticalCount > 0) {
      return isFinalRound ? 'reject' : 'major-revision';
    }

    if (majorCount > 2) {
      return isFinalRound ? 'reject' : 'major-revision';
    }

    if (majorCount > 0 || minorCount > 3) {
      return 'minor-revision';
    }

    return 'accept';
  }

  /**
   * Generate round summary
   */
  private generateRoundSummary(critiques: Critique[], decision: ReviewRound['decision']): string {
    const counts = {
      critical: critiques.filter(c => c.severity === 'critical').length,
      major: critiques.filter(c => c.severity === 'major').length,
      minor: critiques.filter(c => c.severity === 'minor').length,
      suggestion: critiques.filter(c => c.severity === 'suggestion').length
    };

    return `Review identified ${counts.critical} critical, ${counts.major} major, ${counts.minor} minor issues, and ${counts.suggestion} suggestions. Decision: ${decision}`;
  }

  /**
   * Apply improvements to paper based on responses
   */
  private applyImprovements(paper: Paper, responses: Response[]): Paper {
    // In a real system, this would modify the paper based on accepted responses
    // For simulation, we just update the hash
    return {
      ...paper,
      hash: HashVerifier.hash(JSON.stringify({ ...paper, revised: true }))
    };
  }

  /**
   * Generate final review report
   */
  private generateReport(
    paperId: string,
    rounds: ReviewRound[],
    finalDecision: 'accept' | 'reject'
  ): ReviewReport {
    const allCritiques = rounds.flatMap(r => r.critiques);
    const allResponses = rounds.flatMap(r => r.responses);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];
    const remaining: string[] = [];

    // Identify strengths (areas with no critiques)
    const categories: CritiqueCategory[] = ['methodology', 'statistics', 'logic', 'evidence', 'clarity', 'novelty'];
    for (const cat of categories) {
      if (!allCritiques.some(c => c.category === cat)) {
        strengths.push(`Strong ${cat}`);
      }
    }

    // Identify weaknesses and improvements
    for (const critique of allCritiques) {
      const response = allResponses.find(r => r.critiqueId === critique.id);
      
      if (response?.action === 'accept') {
        improvements.push(critique.issue.substring(0, 50) + '...');
      } else if (response?.action === 'reject') {
        remaining.push(critique.issue.substring(0, 50) + '...');
        weaknesses.push(critique.issue.substring(0, 50) + '...');
      }
    }

    // Calculate overall score
    const totalIssues = allCritiques.length;
    const resolvedIssues = allResponses.filter(r => r.action === 'accept').length;
    const overallScore = totalIssues > 0 ? (resolvedIssues / totalIssues) * 0.5 + 0.5 : 0.8;

    const report: Omit<ReviewReport, 'hash'> = {
      paperId,
      rounds,
      finalDecision,
      overallScore: Math.min(1, overallScore),
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      improvementsMade: improvements.slice(0, 10),
      remainingIssues: remaining.slice(0, 5)
    };

    return {
      ...report,
      hash: HashVerifier.hash(JSON.stringify(report))
    };
  }

  /**
   * Add custom reviewer
   */
  addReviewer(reviewer: ReviewerProfile): void {
    this.reviewers.push(reviewer);
    this.logger.info(`Added reviewer: ${reviewer.id}`);
  }

  /**
   * Get review history
   */
  getReviewHistory(paperId: string): ReviewReport | undefined {
    return this.reviewHistory.get(paperId);
  }

  /**
   * Get all review reports
   */
  getAllReports(): ReviewReport[] {
    return Array.from(this.reviewHistory.values());
  }

  /**
   * Get hash for verification
   */
  getHash(): string {
    const reviewerIds = this.reviewers.map(r => r.id).sort().join(',');
    return HashVerifier.hash(`ReviewSimulator-${reviewerIds}`);
  }

  /**
   * Export proof chain
   */
  exportProofChain(): { reviewers: ReviewerProfile[]; reports: ReviewReport[] } {
    return {
      reviewers: this.reviewers,
      reports: Array.from(this.reviewHistory.values())
    };
  }
}

// ============================================================================
// REVIEW SIMULATOR FACTORY
// ============================================================================

export class ReviewSimulatorFactory {
  /**
   * Create simulator with default reviewers
   */
  static default(): ReviewSimulator {
    return new ReviewSimulator();
  }

  /**
   * Create simulator with strict reviewers
   */
  static strict(): ReviewSimulator {
    const simulator = new ReviewSimulator();
    simulator.addReviewer({
      id: 'R-STRICT',
      expertise: ['all'],
      rigor: 0.95,
      focusAreas: ['methodology', 'statistics', 'evidence', 'reproducibility'],
      style: 'critical'
    });
    return simulator;
  }

  /**
   * Create simulator for specific field
   */
  static forField(field: 'physics' | 'cs' | 'biology'): ReviewSimulator {
    const simulator = new ReviewSimulator();
    
    const fieldReviewers: Record<string, ReviewerProfile> = {
      physics: {
        id: 'R-PHYSICS',
        expertise: ['physics', 'mathematics'],
        rigor: 0.85,
        focusAreas: ['methodology', 'statistics', 'evidence', 'reproducibility'],
        style: 'balanced'
      },
      cs: {
        id: 'R-CS',
        expertise: ['computer science', 'algorithms'],
        rigor: 0.75,
        focusAreas: ['methodology', 'novelty', 'reproducibility'],
        style: 'constructive'
      },
      biology: {
        id: 'R-BIO',
        expertise: ['biology', 'statistics'],
        rigor: 0.80,
        focusAreas: ['methodology', 'statistics', 'ethics', 'reproducibility'],
        style: 'balanced'
      }
    };

    simulator.addReviewer(fieldReviewers[field]);
    return simulator;
  }
}
