/**
 * PeerReviewSimulator - PRD-16 Phase 16.4
 * Automated peer review simulation
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Review criteria
export interface ReviewCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
  rubric: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
}

// Quality score
export interface QualityScore {
  id: string;
  paperId: string;
  criteriaScores: CriteriaScore[];
  overallScore: number;
  verdict: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
  comments: ReviewComment[];
  hash: string;
}

export interface CriteriaScore {
  criteriaId: string;
  criteriaName: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface ReviewComment {
  type: 'strength' | 'weakness' | 'suggestion';
  section: string;
  content: string;
  severity?: 'minor' | 'moderate' | 'major';
}

/**
 * PeerReviewSimulator - Main peer review class
 */
export class PeerReviewSimulator {
  private logger: Logger;
  private criteria: Map<string, ReviewCriteria> = new Map();
  private criteriaCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeCriteria();
  }

  private initializeCriteria(): void {
    this.addCriteria({
      name: 'Novelty',
      weight: 0.2,
      description: 'Originality and novelty of the contribution',
      rubric: [
        { score: 1, description: 'Incremental or derivative work' },
        { score: 2, description: 'Some novel aspects' },
        { score: 3, description: 'Significant novelty' },
        { score: 4, description: 'Highly novel and original' }
      ]
    });

    this.addCriteria({
      name: 'Technical Soundness',
      weight: 0.25,
      description: 'Mathematical and theoretical correctness',
      rubric: [
        { score: 1, description: 'Major technical flaws' },
        { score: 2, description: 'Some technical issues' },
        { score: 3, description: 'Generally sound' },
        { score: 4, description: 'Technically rigorous' }
      ]
    });

    this.addCriteria({
      name: 'Clarity',
      weight: 0.15,
      description: 'Clarity of presentation and writing',
      rubric: [
        { score: 1, description: 'Difficult to follow' },
        { score: 2, description: 'Needs improvement' },
        { score: 3, description: 'Clear and readable' },
        { score: 4, description: 'Excellent presentation' }
      ]
    });

    this.addCriteria({
      name: 'Significance',
      weight: 0.2,
      description: 'Potential impact and significance',
      rubric: [
        { score: 1, description: 'Limited significance' },
        { score: 2, description: 'Moderate significance' },
        { score: 3, description: 'Significant contribution' },
        { score: 4, description: 'Major contribution' }
      ]
    });

    this.addCriteria({
      name: 'Reproducibility',
      weight: 0.2,
      description: 'Ability to reproduce results',
      rubric: [
        { score: 1, description: 'Not reproducible' },
        { score: 2, description: 'Partially reproducible' },
        { score: 3, description: 'Reproducible with effort' },
        { score: 4, description: 'Easily reproducible' }
      ]
    });
  }

  private addCriteria(config: Omit<ReviewCriteria, 'id'>): void {
    const id = `criteria-${++this.criteriaCount}`;
    this.criteria.set(id, { id, ...config });
  }

  /**
   * Review paper
   */
  reviewPaper(paperId: string, paperContent: {
    hasNovelty: boolean;
    hasMathProof: boolean;
    hasExperiments: boolean;
    wordCount: number;
    citationCount: number;
    figureCount: number;
  }): QualityScore {
    const criteriaScores: CriteriaScore[] = [];
    const comments: ReviewComment[] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    // Evaluate each criteria
    for (const criteria of this.criteria.values()) {
      const score = this.evaluateCriteria(criteria, paperContent);
      criteriaScores.push({
        criteriaId: criteria.id,
        criteriaName: criteria.name,
        score,
        maxScore: 4,
        feedback: this.generateFeedback(criteria, score)
      });
      weightedSum += score * criteria.weight;
      totalWeight += criteria.weight * 4;
    }

    const overallScore = (weightedSum / totalWeight) * 100;
    const verdict = this.determineVerdict(overallScore);

    // Generate comments
    if (paperContent.hasNovelty) {
      comments.push({
        type: 'strength',
        section: 'Contribution',
        content: 'The paper presents a novel approach to reframing physics laws.'
      });
    }

    if (paperContent.hasMathProof) {
      comments.push({
        type: 'strength',
        section: 'Methodology',
        content: 'Mathematical derivations are rigorous and well-presented.'
      });
    }

    if (paperContent.citationCount < 10) {
      comments.push({
        type: 'weakness',
        section: 'References',
        content: 'Consider adding more references to related work.',
        severity: 'minor'
      });
    }

    if (paperContent.figureCount < 3) {
      comments.push({
        type: 'suggestion',
        section: 'Presentation',
        content: 'Adding more figures would improve clarity.',
        severity: 'minor'
      });
    }

    const result: QualityScore = {
      id: `review-${Date.now()}`,
      paperId,
      criteriaScores,
      overallScore,
      verdict,
      comments,
      hash: ''
    };
    result.hash = HashVerifier.hash(JSON.stringify({ ...result, hash: '' }));

    this.logger.proof('Paper review complete', {
      paperId,
      overallScore,
      verdict,
      hash: result.hash
    });

    return result;
  }

  private evaluateCriteria(criteria: ReviewCriteria, content: Record<string, unknown>): number {
    // Simplified evaluation based on paper characteristics
    switch (criteria.name) {
      case 'Novelty':
        return content.hasNovelty ? 4 : 2;
      case 'Technical Soundness':
        return content.hasMathProof ? 4 : 2;
      case 'Clarity':
        return (content.wordCount as number) > 3000 ? 3 : 2;
      case 'Significance':
        return content.hasNovelty ? 3 : 2;
      case 'Reproducibility':
        return content.hasExperiments ? 3 : 2;
      default:
        return 3;
    }
  }

  private generateFeedback(criteria: ReviewCriteria, score: number): string {
    const level = criteria.rubric.find(r => r.score === score);
    return level ? level.description : 'Average quality';
  }

  private determineVerdict(score: number): QualityScore['verdict'] {
    if (score >= 80) return 'accept';
    if (score >= 65) return 'minor_revision';
    if (score >= 50) return 'major_revision';
    return 'reject';
  }

  /**
   * Get all criteria
   */
  getAllCriteria(): ReviewCriteria[] {
    return Array.from(this.criteria.values());
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      criteriaCount: this.criteria.size
    }));
  }
}

/**
 * Factory for creating PeerReviewSimulator
 */
export class PeerReviewSimulatorFactory {
  static createDefault(): PeerReviewSimulator {
    return new PeerReviewSimulator();
  }
}
